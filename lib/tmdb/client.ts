import { Movie, TVShow, MovieDetails, TVShowDetails, Credits, MediaItem, SeasonDetails } from '@/types';

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  throw new Error('Missing TMDB API key');
}

class TMDBClient {
  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', TMDB_API_KEY);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Movies
  async getTrendingMovies(page: number = 1): Promise<{ results: Movie[]; total_pages: number }> {
    return this.fetch<{ results: Movie[]; total_pages: number }>('/trending/movie/week', { page: page.toString() });
  }

  async getPopularMovies(page: number = 1): Promise<{ results: Movie[]; total_pages: number }> {
    return this.fetch<{ results: Movie[]; total_pages: number }>('/movie/popular', { page: page.toString() });
  }

  async getTopRatedMovies(page: number = 1): Promise<{ results: Movie[]; total_pages: number }> {
    return this.fetch<{ results: Movie[]; total_pages: number }>('/movie/top_rated', { page: page.toString() });
  }

  async getMovieDetails(id: number): Promise<MovieDetails> {
    return this.fetch<MovieDetails>(`/movie/${id}`);
  }

  async getMovieCredits(id: number): Promise<Credits> {
    return this.fetch<Credits>(`/movie/${id}/credits`);
  }

  // TV Shows
  async getTrendingTV(page: number = 1): Promise<{ results: TVShow[]; total_pages: number }> {
    return this.fetch<{ results: TVShow[]; total_pages: number }>('/trending/tv/week', { page: page.toString() });
  }

  async getPopularTV(page: number = 1): Promise<{ results: TVShow[]; total_pages: number }> {
    return this.fetch<{ results: TVShow[]; total_pages: number }>('/tv/popular', { page: page.toString() });
  }

  async getTopRatedTV(page: number = 1): Promise<{ results: TVShow[]; total_pages: number }> {
    return this.fetch<{ results: TVShow[]; total_pages: number }>('/tv/top_rated', { page: page.toString() });
  }

  async getTVDetails(id: number): Promise<TVShowDetails> {
    return this.fetch<TVShowDetails>(`/tv/${id}`);
  }

  async getTVCredits(id: number): Promise<Credits> {
    return this.fetch<Credits>(`/tv/${id}/credits`);
  }

  async getTVSeasonDetails(tvId: number, seasonNumber: number): Promise<SeasonDetails> {
    return this.fetch<SeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`);
  }

  // Search
  async searchMovies(query: string, page: number = 1): Promise<{ results: Movie[]; total_pages: number }> {
    return this.fetch<{ results: Movie[]; total_pages: number }>('/search/movie', {
      query,
      page: page.toString(),
    });
  }

  async searchTV(query: string, page: number = 1): Promise<{ results: TVShow[]; total_pages: number }> {
    return this.fetch<{ results: TVShow[]; total_pages: number }>('/search/tv', {
      query,
      page: page.toString(),
    });
  }

  async searchMulti(query: string, page: number = 1): Promise<{ results: MediaItem[]; total_pages: number; total_results: number }> {
    return this.fetch<{ results: MediaItem[]; total_pages: number; total_results: number }>('/search/multi', {
      query,
      page: page.toString(),
    });
  }

  // Genres
  async getMovieGenres() {
    return this.fetch<{ genres: Array<{ id: number; name: string }> }>('/genre/movie/list');
  }

  async getTVGenres() {
    return this.fetch<{ genres: Array<{ id: number; name: string }> }>('/genre/tv/list');
  }

  // Discover
  async discoverMovies(params: Record<string, string> = {}) {
    return this.fetch<{ results: Movie[]; total_pages: number; total_results: number }>('/discover/movie', params);
  }

  async discoverTV(params: Record<string, string> = {}) {
    return this.fetch<{ results: TVShow[]; total_pages: number; total_results: number }>('/discover/tv', params);
  }

  // Find by external ID (IMDb, etc.)
  async findByIMDbId(imdbId: string): Promise<{
    movie_results: Movie[];
    tv_results: TVShow[];
  }> {
    return this.fetch<{ movie_results: Movie[]; tv_results: TVShow[] }>(
      `/find/${imdbId}`,
      { external_source: 'imdb_id' }
    );
  }

  // Search movies with year filter
  async searchMoviesWithYear(query: string, year: number): Promise<{ results: Movie[]; total_pages: number }> {
    return this.fetch<{ results: Movie[]; total_pages: number }>('/search/movie', {
      query,
      year: year.toString(),
      page: '1',
    });
  }

  // Search TV with year filter
  async searchTVWithYear(query: string, year: number): Promise<{ results: TVShow[]; total_pages: number }> {
    return this.fetch<{ results: TVShow[]; total_pages: number }>('/search/tv', {
      query,
      first_air_date_year: year.toString(),
      page: '1',
    });
  }

  // Videos (trailers, teasers, etc.)
  async getMovieVideos(id: number): Promise<{
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
      official: boolean;
    }>;
  }> {
    return this.fetch(`/movie/${id}/videos`);
  }

  async getTVVideos(id: number): Promise<{
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
      official: boolean;
    }>;
  }> {
    return this.fetch(`/tv/${id}/videos`);
  }

  // Images (backdrops, posters, stills)
  async getMovieImages(id: number): Promise<{
    backdrops: Array<{ file_path: string; width: number; height: number }>;
    posters: Array<{ file_path: string; width: number; height: number }>;
  }> {
    return this.fetch(`/movie/${id}/images`);
  }

  async getTVImages(id: number): Promise<{
    backdrops: Array<{ file_path: string; width: number; height: number }>;
    posters: Array<{ file_path: string; width: number; height: number }>;
  }> {
    return this.fetch(`/tv/${id}/images`);
  }

  // Similar content
  async getSimilarMovies(id: number): Promise<{ results: Movie[]; total_pages: number }> {
    return this.fetch<{ results: Movie[]; total_pages: number }>(`/movie/${id}/similar`);
  }

  async getSimilarTV(id: number): Promise<{ results: TVShow[]; total_pages: number }> {
    return this.fetch<{ results: TVShow[]; total_pages: number }>(`/tv/${id}/similar`);
  }

  // Recommendations (alternative to similar)
  async getMovieRecommendations(id: number): Promise<{ results: Movie[]; total_pages: number }> {
    return this.fetch<{ results: Movie[]; total_pages: number }>(`/movie/${id}/recommendations`);
  }

  async getTVRecommendations(id: number): Promise<{ results: TVShow[]; total_pages: number }> {
    return this.fetch<{ results: TVShow[]; total_pages: number }>(`/tv/${id}/recommendations`);
  }

  // Reviews
  async getMovieReviews(id: number, page: number = 1): Promise<{
    results: Array<{
      id: string;
      author: string;
      author_details: {
        name: string;
        username: string;
        avatar_path: string | null;
        rating: number | null;
      };
      content: string;
      created_at: string;
      updated_at: string;
      url: string;
    }>;
    total_pages: number;
    total_results: number;
  }> {
    return this.fetch(`/movie/${id}/reviews`, { page: page.toString() });
  }

  async getTVReviews(id: number, page: number = 1): Promise<{
    results: Array<{
      id: string;
      author: string;
      author_details: {
        name: string;
        username: string;
        avatar_path: string | null;
        rating: number | null;
      };
      content: string;
      created_at: string;
      updated_at: string;
      url: string;
    }>;
    total_pages: number;
    total_results: number;
  }> {
    return this.fetch(`/tv/${id}/reviews`, { page: page.toString() });
  }

  // Collections (Franchises)
  async getCollectionDetails(collectionId: number): Promise<{
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    parts: Array<{
      id: number;
      title: string;
      release_date: string;
      poster_path: string | null;
      backdrop_path: string | null;
      vote_average: number;
      overview: string;
    }>;
  }> {
    return this.fetch(`/collection/${collectionId}`);
  }

  async getCollectionImages(collectionId: number): Promise<{
    backdrops: Array<{ file_path: string; width: number; height: number }>;
    posters: Array<{ file_path: string; width: number; height: number }>;
  }> {
    return this.fetch(`/collection/${collectionId}/images`);
  }
}

export const tmdbClient = new TMDBClient();
