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
 * Get popular franchises
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
 * Get franchise cards sorted by relevance (user franchises first, then popular)
 */
export async function getFranchiseCards(
  watchlist: SimpleWatchlistItem[]
): Promise<{
  userFranchises: FranchiseCard[];
  popularFranchises: FranchiseCard[];
  allFranchises: FranchiseCard[];
}> {
  const [userFranchisesMap, popularFranchisesMap] = await Promise.all([
    detectFranchisesFromWatchlist(watchlist),
    getPopularFranchises(),
  ]);

  const userFranchiseCards = enrichFranchiseData(userFranchisesMap, watchlist);
  const popularFranchiseCards = enrichFranchiseData(popularFranchisesMap, watchlist);
  
  // Filter out popular franchises that user already has
  const userFranchiseIds = new Set(userFranchiseCards.map(card => card.collection.id));
  const filteredPopular = popularFranchiseCards.filter(
    card => !userFranchiseIds.has(card.collection.id)
  );

  const allFranchises = [...userFranchiseCards, ...filteredPopular];

  return {
    userFranchises: userFranchiseCards,
    popularFranchises: filteredPopular,
    allFranchises,
  };
}
