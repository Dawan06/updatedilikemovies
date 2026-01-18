import { NextRequest, NextResponse } from 'next/server';
import { 
  getFranchiseCards, 
  getFranchisesFromPageRange,
  detectFranchisesFromWatchlist,
  getPopularFranchises,
  enrichFranchiseData,
  calculatePopularityScore
} from '@/lib/franchise/detector';
import { FranchiseCard, Collection } from '@/types';

// Keep force-dynamic since this route accepts user-specific watchlist data
// But allow ISR for popular franchises when no watchlist is provided
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

// Cache headers for responses
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

// Cache for discovered franchises (in-memory cache)
// Structure: { [pageRangeKey]: { franchises: FranchiseCard[], timestamp: number } }
// Example: "1-5" -> franchises discovered from pages 1-5 of popular movies
const franchisesCache: Map<string, {
  franchises: FranchiseCard[];
  timestamp: number;
}> = new Map();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Helper to get page range key (e.g., "1-5", "6-10")
function getPageRangeKey(startPage: number, endPage: number): string {
  return `${startPage}-${endPage}`;
}

// Helper to calculate which page ranges need to be discovered for a given page
// Progressive discovery strategy:
// - Page 1: No discovery (uses user + popular franchises only - instant)
// - Pages 2-5: Discover from pages 1-5 of popular movies (~100 movies, ~50 franchises)
// - Page 6+: Discover incrementally - each request page needs ~2 pages of discovery
function getPageRangesForPage(page: number): { startPage: number; endPage: number }[] {
  const ranges: { startPage: number; endPage: number }[] = [];
  
  if (page === 1) {
    // Page 1: No discovery needed (user + popular only)
    return [];
  }
  
  // Pages 2-5: Discover from pages 1-5 of popular movies
  if (page >= 2 && page <= 5) {
    ranges.push({ startPage: 1, endPage: 5 });
  } else if (page > 5) {
    // Page 6+: Progressive discovery
    // Each page of popular movies yields ~5-10 franchises
    // To get 20 franchises per page, we need ~2-4 pages of discovery per request page
    const discoveryEndPage = Math.min(50, 5 + (page - 5) * 2);
    
    // Always include pages 1-5 (first discovery batch)
    ranges.push({ startPage: 1, endPage: 5 });
    
    // Add additional 5-page ranges if needed
    for (let start = 6; start <= discoveryEndPage; start += 5) {
      ranges.push({ startPage: start, endPage: Math.min(start + 4, discoveryEndPage) });
    }
  }
  
  return ranges;
}

interface WatchlistItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
}

export async function GET(request: NextRequest) {
  try {
    // Get watchlist from query params (client will send it)
    const watchlistParam = request.nextUrl.searchParams.get('watchlist');
    const pageParam = request.nextUrl.searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const itemsPerPage = 20;
    
    let watchlist: WatchlistItem[] = [];
    if (watchlistParam) {
      try {
        watchlist = JSON.parse(watchlistParam);
      } catch {
        // Invalid JSON, use empty array
      }
    }

    const franchiseData = await getFranchiseCards(watchlist);
    
    // Combine all franchises for pagination
    const allFranchises = [...franchiseData.userFranchises, ...franchiseData.popularFranchises];
    const totalCount = allFranchises.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    // Paginate results
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFranchises = allFranchises.slice(startIndex, endIndex);

    return NextResponse.json({
      franchises: paginatedFranchises,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        itemsPerPage,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      // Keep separate arrays for backward compatibility (first page only)
      userFranchises: page === 1 ? franchiseData.userFranchises : [],
      popularFranchises: page === 1 ? franchiseData.popularFranchises : [],
      allFranchises: page === 1 ? franchiseData.allFranchises : [],
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching franchises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch franchises' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const watchlist: WatchlistItem[] = body.watchlist || [];
    const page = body.page || 1;
    const itemsPerPage = body.itemsPerPage || 20;
    const includeAll = body.includeAll !== false; // Default to true

    // Step 1: Always get user franchises (fast)
    const userFranchisesMap = await detectFranchisesFromWatchlist(watchlist);
    const userFranchiseCards = enrichFranchiseData(userFranchisesMap, watchlist);
    const userFranchiseIds = new Set(userFranchiseCards.map(card => card.collection.id));

    // Step 2: Progressive discovery based on requested page
    let allDiscoveredFranchises: FranchiseCard[] = [];
    const now = Date.now();
    
    if (includeAll) {
      if (page === 1) {
        // Page 1: Only use popular franchises (instant, no discovery)
        const popularFranchisesMap = await getPopularFranchises();
        userFranchiseIds.forEach(id => popularFranchisesMap.delete(id));
        allDiscoveredFranchises = enrichFranchiseData(popularFranchisesMap, watchlist);
      } else {
        // Pages 2+: Progressive discovery
        const pageRanges = getPageRangesForPage(page);
        const discoveredCollectionsMap = new Map<number, Collection>();
        
        // Discover franchises from required page ranges
        for (const range of pageRanges) {
          const rangeKey = getPageRangeKey(range.startPage, range.endPage);
          const cached = franchisesCache.get(rangeKey);
          
          if (cached && (now - cached.timestamp) < CACHE_DURATION) {
            // Use cached franchises for this range
            cached.franchises.forEach(card => {
              if (!discoveredCollectionsMap.has(card.collection.id)) {
                discoveredCollectionsMap.set(card.collection.id, card.collection);
              }
            });
          } else {
            // Discover and cache franchises for this range
            const discoveredMap = await getFranchisesFromPageRange(range.startPage, range.endPage, 5);
            userFranchiseIds.forEach(id => discoveredMap.delete(id));
            const discoveredCards = enrichFranchiseData(discoveredMap, watchlist);
            
            // Cache the discovered franchises
            franchisesCache.set(rangeKey, {
              franchises: discoveredCards,
              timestamp: now,
            });
            
            // Add to our collection
            discoveredMap.forEach(collection => {
              if (!discoveredCollectionsMap.has(collection.id)) {
                discoveredCollectionsMap.set(collection.id, collection);
              }
            });
          }
        }
        
        // Always include popular franchises for pages 2-5
        if (page <= 5) {
          const popularFranchisesMap = await getPopularFranchises();
          userFranchiseIds.forEach(id => popularFranchisesMap.delete(id));
          popularFranchisesMap.forEach(collection => {
            if (!discoveredCollectionsMap.has(collection.id)) {
              discoveredCollectionsMap.set(collection.id, collection);
            }
          });
        }
        
        allDiscoveredFranchises = enrichFranchiseData(discoveredCollectionsMap, watchlist);
      }
    } else {
      // Not including all - just use popular franchises
      const popularFranchisesMap = await getPopularFranchises();
      userFranchiseIds.forEach(id => popularFranchisesMap.delete(id));
      allDiscoveredFranchises = enrichFranchiseData(popularFranchisesMap, watchlist);
    }

    // Step 3: Sort all franchises by popularity score
    const sortedUserFranchises = userFranchiseCards.sort((a, b) => {
      const scoreA = calculatePopularityScore(a);
      const scoreB = calculatePopularityScore(b);
      if (Math.abs(scoreB - scoreA) > 0.1) {
        return scoreB - scoreA;
      }
      return a.collection.name.localeCompare(b.collection.name);
    });

    const sortedDiscoveredFranchises = allDiscoveredFranchises.sort((a, b) => {
      const scoreA = calculatePopularityScore(a);
      const scoreB = calculatePopularityScore(b);
      if (Math.abs(scoreB - scoreA) > 0.1) {
        return scoreB - scoreA;
      }
      if (b.movieCount !== a.movieCount) {
        return b.movieCount - a.movieCount;
      }
      return a.collection.name.localeCompare(b.collection.name);
    });

    // Combine: user franchises first, then discovered franchises
    const allFranchises = [...sortedUserFranchises, ...sortedDiscoveredFranchises];
    
    // Step 4: Paginate
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFranchises = allFranchises.slice(startIndex, endIndex);
    const totalPages = Math.ceil(allFranchises.length / itemsPerPage);
    
    // For progressive discovery, be optimistic about hasMore
    // Strategy: If we got a full page of results (20 items), assume there are more to discover
    // Only stop if we got less than a full page AND we've discovered from many pages
    let hasMore = endIndex < allFranchises.length;
    if (includeAll) {
      // Calculate how many pages of popular movies we've discovered from
      const pageRanges = getPageRangesForPage(page);
      const maxDiscoveredPage = pageRanges.length > 0 
        ? Math.max(...pageRanges.map(r => r.endPage), 0)
        : 0;
      
      // If we got a full page of results, there are likely more
      if (paginatedFranchises.length >= itemsPerPage) {
        hasMore = true;
      } 
      // If we got less than a full page but haven't discovered from many pages yet, keep going
      else if (maxDiscoveredPage < 50) {
        hasMore = true;
      }
      // Only stop if we got less than a full page AND we've discovered from 50+ pages
      // This means we've likely exhausted most discoverable franchises
    }

    return NextResponse.json({
      franchises: paginatedFranchises,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: allFranchises.length,
        itemsPerPage,
        hasNextPage: hasMore,
        hasPreviousPage: page > 1,
      },
      // Keep separate arrays for backward compatibility (first page only)
      userFranchises: page === 1 ? sortedUserFranchises : [],
      popularFranchises: page === 1 ? sortedDiscoveredFranchises.slice(0, 20) : [],
      allFranchises: page === 1 ? paginatedFranchises : [],
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching franchises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch franchises' },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}
