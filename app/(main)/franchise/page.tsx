import { auth } from '@clerk/nextjs/server';
import { getUserWatchlist } from '@/lib/supabase/helpers';
import { 
  detectFranchisesFromWatchlist,
  getPopularFranchises,
  enrichFranchiseData,
  calculatePopularityScore
} from '@/lib/franchise/detector';
import { FranchiseCard } from '@/types';
import FranchisePageClient from './FranchisePageClient';

export const revalidate = 3600; // Cache for 1 hour

export default async function FranchisePage() {
  // Get user's watchlist on server (don't block if not signed in)
  let watchlist: Array<{ tmdb_id: number; media_type: 'movie' | 'tv' }> = [];
  
  try {
    const { userId } = await auth();
    if (userId) {
      const userWatchlist = await getUserWatchlist(userId);
      watchlist = userWatchlist.map(item => ({
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
      }));
    }
  } catch (error) {
    // Continue without watchlist if auth fails
    console.error('Error fetching watchlist:', error);
  }

  // Fetch initial franchises in parallel - don't wait for watchlist
  const [userFranchisesMap, popularFranchisesMap] = await Promise.all([
    detectFranchisesFromWatchlist(watchlist).catch(() => new Map()),
    getPopularFranchises(), // Fast - uses hardcoded list
  ]);

  // Enrich franchise data
  const userFranchiseCards = enrichFranchiseData(userFranchisesMap, watchlist);
  const userFranchiseIds = new Set(userFranchiseCards.map(card => card.collection.id));
  
  // Remove user franchises from popular franchises
  userFranchiseIds.forEach(id => popularFranchisesMap.delete(id));
  const popularFranchiseCards = enrichFranchiseData(popularFranchisesMap, watchlist);

  // Sort franchises by popularity
  const sortedUserFranchises = userFranchiseCards.sort((a, b) => {
    const scoreA = calculatePopularityScore(a);
    const scoreB = calculatePopularityScore(b);
    if (Math.abs(scoreB - scoreA) > 0.1) {
      return scoreB - scoreA;
    }
    return a.collection.name.localeCompare(b.collection.name);
  });

  const sortedPopularFranchises = popularFranchiseCards.sort((a, b) => {
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

  // Combine: user franchises first, then popular franchises
  const allFranchises = [...sortedUserFranchises, ...sortedPopularFranchises];
  
  // Get first page (20 items)
  const itemsPerPage = 20;
  const initialFranchises = allFranchises.slice(0, itemsPerPage);
  const initialHeroFranchises = allFranchises.slice(0, 10); // Top 10 for hero
  // Always set hasMore to true - there are more franchises available through progressive discovery
  // The API will discover more franchises when page 2+ is requested
  const initialHasMore = true; // Progressive discovery means there are always more franchises
  const initialTotalCount = allFranchises.length; // This will be updated by API as more are discovered

  return (
    <FranchisePageClient
      initialFranchises={initialFranchises}
      initialHeroFranchises={initialHeroFranchises}
      initialTotalCount={initialTotalCount}
      initialHasMore={initialHasMore}
    />
  );
}
