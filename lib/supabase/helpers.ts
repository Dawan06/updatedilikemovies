import { createServerClient } from './server';
import { WatchlistItem, ViewingHistory, UserProfile } from '@/types';

export async function getOrCreateUserProfile(userId: string, email: string) {
  const supabase = createServerClient();
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existingProfile) {
    return existingProfile as UserProfile;
  }

  // Create new profile
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      email,
      preferences: {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return newProfile as UserProfile;
}

export async function getUserWatchlist(userId: string) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch watchlist: ${error.message}`);
  }

  return data as WatchlistItem[];
}

export async function addToWatchlist(
  userId: string,
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  status: 'watching' | 'completed' | 'plan_to_watch' = 'plan_to_watch'
) {
  const supabase = createServerClient();
  
  // Check if already in watchlist
  const { data: existing } = await supabase
    .from('watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .single();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('watchlist')
      .update({ status })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update watchlist: ${error.message}`);
    }

    return data as WatchlistItem;
  }

  // Add new
  const { data, error } = await supabase
    .from('watchlist')
    .insert({
      user_id: userId,
      tmdb_id: tmdbId,
      media_type: mediaType,
      status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add to watchlist: ${error.message}`);
  }

  return data as WatchlistItem;
}

export async function removeFromWatchlist(
  userId: string,
  tmdbId: number,
  mediaType: 'movie' | 'tv'
) {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType);

  if (error) {
    throw new Error(`Failed to remove from watchlist: ${error.message}`);
  }
}

export async function updateWatchlistStatus(
  userId: string,
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  status: 'watching' | 'completed' | 'plan_to_watch'
) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('watchlist')
    .update({ status })
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update watchlist status: ${error.message}`);
  }

  return data as WatchlistItem;
}

export async function getViewingHistory(userId: string) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('viewing_history')
    .select('*')
    .eq('user_id', userId)
    .order('last_watched_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch viewing history: ${error.message}`);
  }

  return data as ViewingHistory[];
}

export async function getViewingProgress(
  userId: string,
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  seasonNumber?: number,
  episodeNumber?: number
): Promise<ViewingHistory | null> {
  const supabase = createServerClient();
  
  const query = supabase
    .from('viewing_history')
    .select('*')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType);

  if (mediaType === 'tv') {
    if (seasonNumber !== undefined) {
      query.eq('season_number', seasonNumber);
    }
    if (episodeNumber !== undefined) {
      query.eq('episode_number', episodeNumber);
    }
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to fetch viewing progress: ${error.message}`);
  }

  return data as ViewingHistory;
}

export async function updateViewingProgress(
  userId: string,
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  progress: number,
  seasonNumber?: number,
  episodeNumber?: number
) {
  const supabase = createServerClient();
  
  // Check if exists
  const { data: existing } = await supabase
    .from('viewing_history')
    .select('id')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .eq('season_number', seasonNumber || null)
    .eq('episode_number', episodeNumber || null)
    .single();

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from('viewing_history')
      .update({
        progress,
        last_watched_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update viewing progress: ${error.message}`);
    }

    return data as ViewingHistory;
  }

  // Create new
  const { data, error } = await supabase
    .from('viewing_history')
    .insert({
      user_id: userId,
      tmdb_id: tmdbId,
      media_type: mediaType,
      progress,
      season_number: seasonNumber || null,
      episode_number: episodeNumber || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save viewing progress: ${error.message}`);
  }

  return data as ViewingHistory;
}

export async function updateUserPreferences(
  userId: string,
  preferences: Record<string, any>
) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update preferences: ${error.message}`);
  }

  return data as UserProfile;
}
