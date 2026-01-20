import { tmdbClient } from '@/lib/tmdb/client';
import { Collection, FranchiseCard } from '@/types';

// Curated list of 40 popular franchise collection IDs from TMDB
// This provides instant loading without complex discovery
const CURATED_FRANCHISE_IDS = [
  // Superhero / Action
  86311,   // Marvel Cinematic Universe
  131296,  // DC Extended Universe
  531241,  // Spider-Man (MCU)
  573436,  // Spider-Man (Sony)
  748,     // X-Men
  263,     // Dark Knight Collection
  9743,    // DC Universe Animated Original Movies

  // Sci-Fi / Adventure
  10,      // Star Wars
  119,     // The Lord of the Rings
  121938,  // The Hobbit
  87359,   // Mission: Impossible
  528,     // Fast & Furious
  645,     // James Bond
  2980,    // Jurassic Park
  404609,  // John Wick
  115570,  // Kingsman
  295,     // Pirates of the Caribbean
  131292,  // The Matrix
  2344,    // Terminator
  8091,    // Alien
  1570,    // Die Hard

  // Fantasy / Drama
  1241,    // Harry Potter
  131635,  // The Hunger Games
  33514,   // Twilight
  173710,  // Planet of the Apes (Reboot)
  230,     // The Godfather
  87096,   // Avatar

  // Animation (Family)
  10194,   // Toy Story
  33085,   // Incredibles
  137697,  // Finding Nemo/Dory
  328,     // Jurassic Park Chaos Effect
  2150,    // Shrek
  86066,   // Despicable Me
  89137,   // How to Train Your Dragon
  77816,   // Kung Fu Panda
  8354,    // Ice Age
  87118,   // Monsters Inc

  // Horror
  313086,  // Conjuring Universe
  91698,   // Insidious
  656,     // Saw
  256322,  // The Purge

  // Classic Action
  94602,   // Bourne
  86055,   // Men in Black
  1709,    // Cars
  84,      // Indiana Jones
  1575,    // Rocky
];

/**
 * Fetch curated popular franchises
 * Optimized for speed - fetches from a fixed list of IDs
 */
export async function getPopularFranchises(): Promise<Collection[]> {
  // Remove duplicates from the list
  const uniqueIds = [...new Set(CURATED_FRANCHISE_IDS)];

  // Fetch all collections in parallel (with error handling)
  const collectionPromises = uniqueIds.map(async (collectionId): Promise<Collection | null> => {
    try {
      const collection = await tmdbClient.getCollectionDetails(collectionId);

      // Only include collections with at least 2 movies
      if (collection.parts.length < 2) return null;

      return mapCollectionData(collection);
    } catch (error) {
      // Silently skip failed collections
      console.error(`Error fetching collection ${collectionId}:`, error);
      return null;
    }
  });

  const results = await Promise.all(collectionPromises);

  // Filter out nulls and sort by number of movies (largest first)
  return results
    .filter((c): c is Collection => c !== null)
    .sort((a, b) => b.parts.length - a.parts.length);
}

/**
 * Discover new franchises from TMDB popular movies
 * Scans a page of popular movies to find collections we don't have yet
 */
export async function discoverFranchises(page: number = 1): Promise<Collection[]> {
  try {
    // 1. Fetch popular movies for this page
    const movies = await tmdbClient.getPopularMovies(page);
    const movieResults = movies.results || [];

    // 2. Find which movies belong to a collection
    const collectionIds = new Set<number>();

    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < movieResults.length; i += batchSize) {
      const batch = movieResults.slice(i, i + batchSize);
      await Promise.all(batch.map(async (movie) => {
        try {
          const details = await tmdbClient.getMovieDetails(movie.id);
          if (details.belongs_to_collection?.id) {
            // Skip if it's already in our curated list
            if (!CURATED_FRANCHISE_IDS.includes(details.belongs_to_collection.id)) {
              collectionIds.add(details.belongs_to_collection.id);
            }
          }
        } catch {
          // Ignore errors
        }
      }));
    }

    // 3. Fetch details for found collections
    const collectionPromises = Array.from(collectionIds).map(async (id) => {
      try {
        const collection = await tmdbClient.getCollectionDetails(id);
        // Strict filter: Must have at least 2 movies to be worth showing
        if (collection.parts.length < 2) return null;
        return mapCollectionData(collection);
      } catch {
        return null;
      }
    });

    const collections = await Promise.all(collectionPromises);
    return collections.filter((c): c is Collection => c !== null);

  } catch (error) {
    console.error('Error discovering franchises:', error);
    return [];
  }
}

// Helper to map TMDB response to our Collection type
function mapCollectionData(collection: any): Collection {
  return {
    id: collection.id,
    name: collection.name,
    overview: collection.overview || '',
    poster_path: collection.poster_path,
    backdrop_path: collection.backdrop_path,
    parts: collection.parts.map((part: any) => ({
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
  };
}

/**
 * Convert collections to franchise cards with metadata
 */
export function collectionsToFranchiseCards(collections: Collection[]): FranchiseCard[] {
  return collections.map(collection => {
    // Calculate average rating from all movies
    const avgRating = collection.parts.length > 0
      ? collection.parts.reduce((sum, m) => sum + (m.vote_average || 0), 0) / collection.parts.length
      : 0;

    return {
      collection,
      userHasMovies: false, // We're not tracking user watchlist for simplicity
      movieCount: collection.parts.length,
      userMovieCount: 0,
      avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
    };
  });
}

/**
 * Calculate popularity score for sorting
 */
export function calculatePopularityScore(franchiseCard: FranchiseCard): number {
  const { collection } = franchiseCard;
  const parts = collection.parts;

  if (parts.length === 0) return 0;

  // Simple score: average rating * number of movies
  const avgVoteAverage = parts.reduce((sum, movie) => sum + (movie.vote_average || 0), 0) / parts.length;
  return avgVoteAverage * franchiseCard.movieCount;
}
