import { WatchlistItem, ViewingHistory, Movie, TVShow } from '@/types';
import { tmdbClient } from '@/lib/tmdb/client';

export interface UserPreferences {
  genres: number[];
  decades: number[];
  avgRating: number;
  preferredRuntimes: string[];
  excludedGenres: number[];
  preferredMediaTypes: ('movie' | 'tv')[];
}

interface GenreFrequency {
  [genreId: number]: number;
}

interface DecadeFrequency {
  [decade: number]: number;
}

/**
 * Analyzes user's watchlist and viewing history to build a preference profile
 */
export async function analyzeUserPreferences(
  watchlist: WatchlistItem[],
  viewingHistory: ViewingHistory[]
): Promise<UserPreferences> {
  const genreFrequency: GenreFrequency = {};
  const decadeFrequency: DecadeFrequency = {};
  const ratings: number[] = [];
  const runtimes: number[] = [];
  const mediaTypes: Set<'movie' | 'tv'> = new Set();
  const completedItems = new Set<string>();
  const abandonedItems = new Set<string>();

  // Analyze viewing history to understand completion patterns
  viewingHistory.forEach((item) => {
    const key = `${item.tmdb_id}-${item.media_type}`;
    // Consider items with >90% progress as completed, <10% as abandoned
    if (item.progress > 0.9) {
      completedItems.add(key);
    } else if (item.progress < 0.1) {
      abandonedItems.add(key);
    }
  });

  // Fetch details for watchlist items (prioritize completed items)
  const watchlistDetails = await Promise.allSettled(
    watchlist
      .filter((item) => {
        const key = `${item.tmdb_id}-${item.media_type}`;
        // Prefer completed items, or items not in abandoned list
        return completedItems.has(key) || !abandonedItems.has(key);
      })
      .slice(0, 50) // Limit to 50 to avoid too many API calls
      .map(async (item) => {
        try {
          if (item.media_type === 'movie') {
            const movie = await tmdbClient.getMovieDetails(item.tmdb_id);
            return { item, details: movie, type: 'movie' as const };
          } else {
            const tv = await tmdbClient.getTVDetails(item.tmdb_id);
            return { item, details: tv, type: 'tv' as const };
          }
        } catch (error) {
          console.error(`Error fetching details for ${item.media_type} ${item.tmdb_id}:`, error);
          return null;
        }
      })
  );

  // Process watchlist details
  watchlistDetails.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      const { details, type } = result.value;
      mediaTypes.add(type);

      // Extract genres
      if ('genres' in details && Array.isArray(details.genres)) {
        details.genres.forEach((genre: { id: number }) => {
          genreFrequency[genre.id] = (genreFrequency[genre.id] || 0) + 1;
        });
      } else if ('genre_ids' in details && Array.isArray(details.genre_ids)) {
        details.genre_ids.forEach((genreId: number) => {
          genreFrequency[genreId] = (genreFrequency[genreId] || 0) + 1;
        });
      }

      // Extract decade
      const releaseDate = 'release_date' in details ? details.release_date : 'first_air_date' in details ? details.first_air_date : null;
      if (releaseDate) {
        const year = parseInt(releaseDate.slice(0, 4), 10);
        if (!isNaN(year)) {
          const decade = Math.floor(year / 10) * 10;
          decadeFrequency[decade] = (decadeFrequency[decade] || 0) + 1;
        }
      }

      // Extract rating
      if ('vote_average' in details && typeof details.vote_average === 'number') {
        ratings.push(details.vote_average);
      }

      // Extract runtime
      if (type === 'movie' && 'runtime' in details && typeof details.runtime === 'number') {
        runtimes.push(details.runtime);
      } else if (type === 'tv' && 'episode_run_time' in details && Array.isArray(details.episode_run_time) && details.episode_run_time.length > 0) {
        runtimes.push(details.episode_run_time[0]);
      }
    }
  });

  // Analyze viewing history items (completed ones)
  const historyDetails = await Promise.allSettled(
    viewingHistory
      .filter((item) => {
        const key = `${item.tmdb_id}-${item.media_type}`;
        return completedItems.has(key);
      })
      .slice(0, 30) // Limit to 30
      .map(async (item) => {
        try {
          if (item.media_type === 'movie') {
            const movie = await tmdbClient.getMovieDetails(item.tmdb_id);
            return { item, details: movie, type: 'movie' as const };
          } else {
            const tv = await tmdbClient.getTVDetails(item.tmdb_id);
            return { item, details: tv, type: 'tv' as const };
          }
        } catch (error) {
          console.error(`Error fetching history details for ${item.media_type} ${item.tmdb_id}:`, error);
          return null;
        }
      })
  );

  // Process viewing history details
  historyDetails.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      const { details, type } = result.value;
      mediaTypes.add(type);

      // Extract genres (weight completed items more)
      if ('genres' in details && Array.isArray(details.genres)) {
        details.genres.forEach((genre: { id: number }) => {
          genreFrequency[genre.id] = (genreFrequency[genre.id] || 0) + 2; // Weight completed items 2x
        });
      } else if ('genre_ids' in details && Array.isArray(details.genre_ids)) {
        details.genre_ids.forEach((genreId: number) => {
          genreFrequency[genreId] = (genreFrequency[genreId] || 0) + 2;
        });
      }

      // Extract decade
      const releaseDate = 'release_date' in details ? details.release_date : 'first_air_date' in details ? details.first_air_date : null;
      if (releaseDate) {
        const year = parseInt(releaseDate.slice(0, 4), 10);
        if (!isNaN(year)) {
          const decade = Math.floor(year / 10) * 10;
          decadeFrequency[decade] = (decadeFrequency[decade] || 0) + 2;
        }
      }

      // Extract rating
      if ('vote_average' in details && typeof details.vote_average === 'number') {
        ratings.push(details.vote_average);
      }

      // Extract runtime
      if (type === 'movie' && 'runtime' in details && typeof details.runtime === 'number') {
        runtimes.push(details.runtime);
      } else if (type === 'tv' && 'episode_run_time' in details && Array.isArray(details.episode_run_time) && details.episode_run_time.length > 0) {
        runtimes.push(details.episode_run_time[0]);
      }
    }
  });

  // Calculate excluded genres (from abandoned items)
  const excludedGenreFrequency: GenreFrequency = {};
  const abandonedDetails = await Promise.allSettled(
    viewingHistory
      .filter((item) => {
        const key = `${item.tmdb_id}-${item.media_type}`;
        return abandonedItems.has(key);
      })
      .slice(0, 20)
      .map(async (item) => {
        try {
          if (item.media_type === 'movie') {
            const movie = await tmdbClient.getMovieDetails(item.tmdb_id);
            return { details: movie };
          } else {
            const tv = await tmdbClient.getTVDetails(item.tmdb_id);
            return { details: tv };
          }
        } catch (error) {
          return null;
        }
      })
  );

  abandonedDetails.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      const { details } = result.value;
      if ('genres' in details && Array.isArray(details.genres)) {
        details.genres.forEach((genre: { id: number }) => {
          excludedGenreFrequency[genre.id] = (excludedGenreFrequency[genre.id] || 0) + 1;
        });
      } else if ('genre_ids' in details && Array.isArray(details.genre_ids)) {
        details.genre_ids.forEach((genreId: number) => {
          excludedGenreFrequency[genreId] = (excludedGenreFrequency[genreId] || 0) + 1;
        });
      }
    }
  });

  // Get top genres (appearing in at least 2 items)
  const sortedGenres = Object.entries(genreFrequency)
    .sort(([, a], [, b]) => b - a)
    .filter(([, count]) => count >= 2)
    .slice(0, 10)
    .map(([id]) => parseInt(id, 10));

  // Get top decades (appearing in at least 2 items)
  const sortedDecades = Object.entries(decadeFrequency)
    .sort(([, a], [, b]) => b - a)
    .filter(([, count]) => count >= 2)
    .slice(0, 5)
    .map(([decade]) => parseInt(decade, 10));

  // Calculate average rating
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : 7.0; // Default to 7.0 if no ratings

  // Determine runtime preferences
  const avgRuntime = runtimes.length > 0
    ? runtimes.reduce((sum, runtime) => sum + runtime, 0) / runtimes.length
    : 120; // Default to 120 minutes

  const preferredRuntimes: string[] = [];
  if (avgRuntime < 90) {
    preferredRuntimes.push('short');
  } else if (avgRuntime < 120) {
    preferredRuntimes.push('standard');
  } else {
    preferredRuntimes.push('epic');
  }

  // Get excluded genres (appearing in 3+ abandoned items)
  const excludedGenres = Object.entries(excludedGenreFrequency)
    .filter(([, count]) => count >= 3)
    .map(([id]) => parseInt(id, 10));

  return {
    genres: sortedGenres,
    decades: sortedDecades,
    avgRating,
    preferredRuntimes,
    excludedGenres,
    preferredMediaTypes: Array.from(mediaTypes),
  };
}

/**
 * Scores a movie based on how well it matches user preferences
 */
export function scoreMovie(movie: Movie | TVShow, preferences: UserPreferences, sessionFilters?: {
  selectedGenres?: number[];
  runtimePreference?: string;
  selectedEra?: string;
}): number {
  let score = 0;

  // Genre match (40% weight)
  const movieGenres = 'genre_ids' in movie ? movie.genre_ids : [];
  const preferredGenres = sessionFilters?.selectedGenres || preferences.genres;
  
  if (preferredGenres.length > 0 && movieGenres.length > 0) {
    const genreMatch = movieGenres.filter((id) => preferredGenres.includes(id)).length;
    const genreScore = genreMatch / Math.max(movieGenres.length, preferredGenres.length);
    score += genreScore * 40;
  }

  // Exclude movies with excluded genres (penalty)
  const hasExcludedGenre = movieGenres.some((id) => preferences.excludedGenres.includes(id));
  if (hasExcludedGenre) {
    score -= 30; // Heavy penalty
  }

  // Decade match (20% weight)
  const releaseDate = 'release_date' in movie ? movie.release_date : 'first_air_date' in movie ? movie.first_air_date : null;
  if (releaseDate) {
    const year = parseInt(releaseDate.slice(0, 4), 10);
    if (!isNaN(year)) {
      const decade = Math.floor(year / 10) * 10;
      const preferredDecades = preferences.decades;
      
      if (sessionFilters?.selectedEra) {
        // Use session era filter
        const currentYear = new Date().getFullYear();
        let eraMatch = false;
        if (sessionFilters.selectedEra === 'modern' && year >= 2015 && year <= currentYear) {
          eraMatch = true;
        } else if (sessionFilters.selectedEra === '2000s' && year >= 2000 && year <= 2014) {
          eraMatch = true;
        } else if (sessionFilters.selectedEra === '90s' && year >= 1990 && year <= 1999) {
          eraMatch = true;
        } else if (sessionFilters.selectedEra === 'classic' && year < 1990) {
          eraMatch = true;
        }
        if (eraMatch) {
          score += 20;
        }
      } else if (preferredDecades.length > 0) {
        // Use preference-based decades
        if (preferredDecades.includes(decade)) {
          score += 20;
        }
      }
    }
  }

  // Rating alignment (20% weight)
  if ('vote_average' in movie && typeof movie.vote_average === 'number') {
    const ratingDiff = Math.abs(movie.vote_average - preferences.avgRating);
    const ratingScore = Math.max(0, 1 - ratingDiff / 10); // Closer to user's avg = higher score
    score += ratingScore * 20;
  }

  // Runtime preference (20% weight) - would need movie details for exact runtime
  // For now, we'll skip this or use a rough estimate based on genre
  // This can be enhanced later when we fetch movie details

  return Math.max(0, score); // Ensure non-negative score
}
