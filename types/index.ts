export type MediaType = 'movie' | 'tv';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  popularity: number;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
}

export interface MediaItem extends Omit<Movie, 'title' | 'release_date'> {
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  media_type: MediaType;
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime: number;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  imdb_id: string | null;
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
}

export interface TVShowDetails extends TVShow {
  genres: Genre[];
  episode_run_time: number[];
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: Season[];
  networks: Network[];
  created_by?: Array<{
    id: number;
    name: string;
    profile_path: string | null;
  }>;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  air_date: string;
  episode_count: number;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  episode_number: number;
  season_number: number;
  runtime: number | null;
  vote_average: number;
}

export interface SeasonDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  air_date: string;
  episodes: Episode[];
}

export interface Network {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface Crew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Credits {
  cast: Cast[];
  crew: Crew[];
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  added_at: string;
  status: 'watching' | 'completed' | 'plan_to_watch';
}

export interface ViewingHistory {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  season_number?: number;
  episode_number?: number;
  progress: number;
  last_watched_at: string;
}

export interface VideoSource {
  url: string;
  quality: string;
  type: string;
  provider?: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  preferences: {
    theme?: string;
    language?: string;
    notifications?: boolean;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: Movie[];
}

export interface FranchiseCard {
  collection: Collection;
  userHasMovies: boolean;
  movieCount: number;
  userMovieCount: number;
  avgRating?: number; // Optional since it's a UI-calculated field
}
