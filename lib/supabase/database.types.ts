export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MediaType = 'movie' | 'tv'
export type WatchlistStatus = 'watching' | 'completed' | 'plan_to_watch'
export type ImportSource = 'imdb' | 'letterboxd'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          email: string
          username: string | null
          avatar_url: string | null
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email: string
          username?: string | null
          avatar_url?: string | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email?: string
          username?: string | null
          avatar_url?: string | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      watchlist: {
        Row: {
          id: string
          user_id: string
          tmdb_id: number
          media_type: MediaType
          added_at: string
          status: WatchlistStatus
        }
        Insert: {
          id?: string
          user_id: string
          tmdb_id: number
          media_type: MediaType
          added_at?: string
          status?: WatchlistStatus
        }
        Update: {
          id?: string
          user_id?: string
          tmdb_id?: number
          media_type?: MediaType
          added_at?: string
          status?: WatchlistStatus
        }
      }
      viewing_history: {
        Row: {
          id: string
          user_id: string
          tmdb_id: number
          media_type: MediaType
          season_number: number | null
          episode_number: number | null
          progress: number
          last_watched_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tmdb_id: number
          media_type: MediaType
          season_number?: number | null
          episode_number?: number | null
          progress: number
          last_watched_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tmdb_id?: number
          media_type?: MediaType
          season_number?: number | null
          episode_number?: number | null
          progress?: number
          last_watched_at?: string
        }
      }
      imported_lists: {
        Row: {
          id: string
          user_id: string
          source: ImportSource
          source_id: string
          imported_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source: ImportSource
          source_id: string
          imported_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source?: ImportSource
          source_id?: string
          imported_at?: string
        }
      }
    }
  }
}
