import { tmdbClient } from '@/lib/tmdb/client';
import { Collection, FranchiseCard, MovieDetails } from '@/types';

interface SimpleWatchlistItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
}

// Popular franchise collection IDs from TMDB
const POPULAR_FRANCHISE_IDS = [
  86311, // Marvel Cinematic Universe
  10,    // Star Wars
  528,   // Fast & Furious
  645,   // James Bond
  1241,  // Harry Potter
  119,   // The Lord of the Rings
  87359, // Mission: Impossible
  131296, // DC Extended Universe
  131635, // The Hunger Games
  9485,  // Pirates of the Caribbean
  131292, // The Matrix
  131295, // Transformers
  131634, // The Conjuring Universe
  131632, // Saw
];

interface WatchlistItemWithDetails {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  details: MovieDetails;
}

/**
 * Detect franchises from user's watchlist
 */
export async function detectFranchisesFromWatchlist(
  watchlist: SimpleWatchlistItem[]
): Promise<Map<number, Collection>> {
  const franchises = new Map<number, Collection>();
  
  // Filter to only movies (collections are for movies only)
  const movieItems = watchlist.filter(item => item.media_type === 'movie');
  
  if (movieItems.length === 0) {
    return franchises;
  }

  // Fetch movie details in batches to avoid rate limits
  const batchSize = 10;
  const collectionIds = new Set<number>();

  for (let i = 0; i < movieItems.length; i += batchSize) {
    const batch = movieItems.slice(i, i + batchSize);
    
    const detailsPromises = batch.map(async (item) => {
      try {
        const movie = await tmdbClient.getMovieDetails(item.tmdb_id);
        if (movie.belongs_to_collection?.id) {
          collectionIds.add(movie.belongs_to_collection.id);
        }
        return { item, movie };
      } catch (error) {
        console.error(`Error fetching movie ${item.tmdb_id}:`, error);
        return null;
      }
    });

    await Promise.all(detailsPromises);
  }

  // Fetch collection details for detected franchises
  const collectionPromises = Array.from(collectionIds).map(async (collectionId) => {
    try {
      const collection = await tmdbClient.getCollectionDetails(collectionId);
      franchises.set(collectionId, {
        id: collection.id,
        name: collection.name,
        overview: collection.overview || '',
        poster_path: collection.poster_path,
        backdrop_path: collection.backdrop_path,
        parts: collection.parts.map(part => ({
          id: part.id,
          title: part.title,
          overview: part.overview,
          poster_path: part.poster_path,
          backdrop_path: part.backdrop_path,
          release_date: part.release_date,
          vote_average: part.vote_average,
          vote_count: 0,
          genre_ids: [],
          adult: false,
          original_language: 'en',
          popularity: 0,
        })),
      });
    } catch (error) {
      console.error(`Error fetching collection ${collectionId}:`, error);
    }
  });

  await Promise.all(collectionPromises);
  return franchises;
}

/**
 * Get popular franchises from hardcoded list
 */
export async function getPopularFranchises(): Promise<Map<number, Collection>> {
  const franchises = new Map<number, Collection>();

  const collectionPromises = POPULAR_FRANCHISE_IDS.map(async (collectionId) => {
    try {
      const collection = await tmdbClient.getCollectionDetails(collectionId);
      franchises.set(collectionId, {
        id: collection.id,
        name: collection.name,
        overview: collection.overview || '',
        poster_path: collection.poster_path,
        backdrop_path: collection.backdrop_path,
        parts: collection.parts.map(part => ({
          id: part.id,
          title: part.title,
          overview: part.overview,
          poster_path: part.poster_path,
          backdrop_path: part.backdrop_path,
          release_date: part.release_date,
          vote_average: part.vote_average,
          vote_count: 0,
          genre_ids: [],
          adult: false,
          original_language: 'en',
          popularity: 0,
        })),
      });
    } catch (error) {
      console.error(`Error fetching popular collection ${collectionId}:`, error);
    }
  });

  await Promise.all(collectionPromises);
  return franchises;
}

/**
 * Discover franchises from a specific page range of TMDB popular movies
 * Optimized for incremental/progressive loading
 */
export async function getFranchisesFromPageRange(
  startPage: number,
  endPage: number,
  batchSize: number = 3 // Reduced default for Netlify timeout safety
): Promise<Map<number, Collection>> {
  const franchises = new Map<number, Collection>();
  const collectionIds = new Set<number>();

  // Limit range to max 3 pages to stay under 10 second timeout
  const maxPages = Math.min(endPage - startPage + 1, 3);
  const actualEndPage = startPage + maxPages - 1;

  console.log(`Discovering franchises from pages ${startPage}-${actualEndPage} of popular movies (limited for timeout safety)...`);

  // Fetch popular movies sequentially for small ranges (faster and safer)
  // For 2-3 pages, sequential is fine and avoids timeout
  for (let page = startPage; page <= actualEndPage; page++) {
    try {
      const result = await tmdbClient.getPopularMovies(page);
      const movies = result.results || [];

      // Extract collection IDs from movies (process in smaller parallel batches)
      // Process 10 movies at a time to avoid overwhelming the API
      const movieBatchSize = 10;
      for (let i = 0; i < movies.length; i += movieBatchSize) {
        const movieBatch = movies.slice(i, i + movieBatchSize);
        
        const movieDetailsPromises = movieBatch.map(async (movie) => {
          try {
            const details = await tmdbClient.getMovieDetails(movie.id);
            if (details.belongs_to_collection?.id) {
              collectionIds.add(details.belongs_to_collection.id);
            }
          } catch (error) {
            // Silently skip errors
          }
        });

        await Promise.all(movieDetailsPromises);
      }
      
      console.log(`Processed page ${page}, found ${collectionIds.size} unique collections so far`);
    } catch (error) {
      console.error(`Error fetching popular movies page ${page}:`, error);
      // Continue with next page
    }
  }

  console.log(`Found ${collectionIds.size} unique collections in range ${startPage}-${actualEndPage}, fetching details...`);

  // Fetch collection details in smaller batches (5 at a time for timeout safety)
  const collectionArray = Array.from(collectionIds);
  const collectionBatchSize = 5; // Reduced from 10 for timeout safety

  for (let i = 0; i < collectionArray.length; i += collectionBatchSize) {
    const batch = collectionArray.slice(i, i + collectionBatchSize);

    const collectionPromises = batch.map(async (collectionId) => {
      try {
        const collection = await tmdbClient.getCollectionDetails(collectionId);
        // Only include collections with at least 2 movies
        if (collection.parts.length >= 2) {
          franchises.set(collectionId, {
            id: collection.id,
            name: collection.name,
            overview: collection.overview || '',
            poster_path: collection.poster_path,
            backdrop_path: collection.backdrop_path,
            parts: collection.parts.map(part => ({
              id: part.id,
              title: part.title,
              overview: part.overview,
              poster_path: part.poster_path,
              backdrop_path: part.backdrop_path,
              release_date: part.release_date,
              vote_average: part.vote_average,
              vote_count: 0,
              genre_ids: [],
              adult: false,
              original_language: 'en',
              popularity: 0,
            })),
          });
        }
      } catch (error) {
        console.error(`Error fetching collection ${collectionId}:`, error);
      }
    });

    await Promise.all(collectionPromises);
    console.log(`Fetched ${franchises.size} franchise details (${Math.min(i + batch.length, collectionArray.length)}/${collectionArray.length})`);
  }

  console.log(`Total franchises discovered from pages ${startPage}-${actualEndPage}: ${franchises.size}`);
  return franchises;
}

/**
 * Discover all franchises from TMDB popular movies
 * Fetches multiple pages of popular movies and extracts their collections
 * @deprecated Use getFranchisesFromPageRange for progressive loading instead
 */
export async function getAllFranchisesFromTMDB(
  maxPages: number = 10,
  batchSize: number = 5
): Promise<Map<number, Collection>> {
  return getFranchisesFromPageRange(1, maxPages, batchSize);
}

/**
 * Merge user franchises with popular franchises, deduplicating
 */
export function mergeFranchises(
  userFranchises: Map<number, Collection>,
  popularFranchises: Map<number, Collection>
): Map<number, Collection> {
  const merged = new Map(userFranchises);
  
  // Add popular franchises that aren't already in user's list
  popularFranchises.forEach((collection, id) => {
    if (!merged.has(id)) {
      merged.set(id, collection);
    }
  });
  
  return merged;
}

/**
 * Calculate popularity score for a franchise card
 * Uses vote_average, movie count, and optionally vote_count/popularity if available
 */
export function calculatePopularityScore(franchiseCard: FranchiseCard): number {
  const { collection } = franchiseCard;
  const parts = collection.parts;
  
  if (parts.length === 0) return 0;
  
  // Calculate average vote_average
  const avgVoteAverage = parts.reduce((sum, movie) => sum + (movie.vote_average || 0), 0) / parts.length;
  
  // Get vote_count and popularity if available (they may be 0 if not fetched)
  const avgVoteCount = parts.reduce((sum, movie) => sum + (movie.vote_count || 0), 0) / parts.length;
  const avgPopularity = parts.reduce((sum, movie) => sum + (movie.popularity || 0), 0) / parts.length;
  
  // Popularity score formula:
  // Base score from vote average, weighted by franchise size and engagement
  // If vote_count/popularity are available, use them; otherwise rely on vote_average and movie count
  let score = avgVoteAverage * franchiseCard.movieCount;
  
  // If we have vote_count data (non-zero), weight by engagement
  if (avgVoteCount > 0) {
    score *= Math.log10(avgVoteCount + 1); // Logarithmic scale to prevent outliers from dominating
  }
  
  // If we have popularity data (non-zero), incorporate it
  if (avgPopularity > 0) {
    score *= Math.log10(avgPopularity + 1);
  }
  
  return score;
}

/**
 * Enrich franchise data with user watchlist info
 */
export function enrichFranchiseData(
  collections: Map<number, Collection>,
  watchlist: SimpleWatchlistItem[]
): FranchiseCard[] {
  const watchlistMovieIds = new Set(
    watchlist.filter(item => item.media_type === 'movie').map(item => item.tmdb_id)
  );

  return Array.from(collections.values()).map((collection) => {
    const userMovieIds = collection.parts
      .filter(movie => watchlistMovieIds.has(movie.id))
      .map(movie => movie.id);

    return {
      collection,
      userHasMovies: userMovieIds.length > 0,
      movieCount: collection.parts.length,
      userMovieCount: userMovieIds.length,
    };
  });
}

/**
 * Get franchise cards sorted by relevance (user franchises first, then all others)
 */
export async function getFranchiseCards(
  watchlist: SimpleWatchlistItem[],
  includeAll: boolean = false,
  page: number = 1,
  itemsPerPage: number = 20
): Promise<{
  userFranchises: FranchiseCard[];
  popularFranchises: FranchiseCard[];
  allFranchises: FranchiseCard[];
  totalCount: number;
  hasMore: boolean;
}> {
  const [userFranchisesMap] = await Promise.all([
    detectFranchisesFromWatchlist(watchlist),
  ]);

  const userFranchiseCards = enrichFranchiseData(userFranchisesMap, watchlist);
  const userFranchiseIds = new Set(userFranchiseCards.map(card => card.collection.id));

  let allFranchisesMap: Map<number, Collection>;
  
  if (includeAll) {
    // Get franchises from TMDB (limited to 10 pages for performance)
    // This is still slower than popular franchises, but much faster than 50 pages
    allFranchisesMap = await getAllFranchisesFromTMDB(10, 5);
  } else {
    // Just get popular franchises (fast - uses hardcoded list)
    allFranchisesMap = await getPopularFranchises();
  }

  // Remove user franchises from all franchises
  userFranchiseIds.forEach(id => allFranchisesMap.delete(id));

  const otherFranchiseCards = enrichFranchiseData(allFranchisesMap, watchlist);
  
  // Sort by popularity score (highest first), then by name
  const sortedOtherFranchises = otherFranchiseCards.sort((a, b) => {
    const scoreA = calculatePopularityScore(a);
    const scoreB = calculatePopularityScore(b);
    
    // Primary sort: popularity score (highest first)
    if (Math.abs(scoreB - scoreA) > 0.1) {
      return scoreB - scoreA;
    }
    
    // Secondary sort: movie count (larger franchises first)
    if (b.movieCount !== a.movieCount) {
      return b.movieCount - a.movieCount;
    }
    
    // Tertiary sort: alphabetical by name
    return a.collection.name.localeCompare(b.collection.name);
  });

  // Sort user franchises by popularity too (but keep them first)
  const sortedUserFranchises = userFranchiseCards.sort((a, b) => {
    const scoreA = calculatePopularityScore(a);
    const scoreB = calculatePopularityScore(b);
    if (Math.abs(scoreB - scoreA) > 0.1) {
      return scoreB - scoreA;
    }
    return a.collection.name.localeCompare(b.collection.name);
  });

  // Combine: user franchises first (sorted by popularity), then all others (sorted by popularity)
  const allFranchises = [...sortedUserFranchises, ...sortedOtherFranchises];
  
  // Paginate
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFranchises = allFranchises.slice(startIndex, endIndex);
  const hasMore = endIndex < allFranchises.length;

  return {
    userFranchises: page === 1 ? userFranchiseCards : [],
    popularFranchises: page === 1 ? sortedOtherFranchises.slice(0, 20) : [],
    allFranchises: paginatedFranchises,
    totalCount: allFranchises.length,
    hasMore,
  };
}
