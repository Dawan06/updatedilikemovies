import { createServiceClient } from './server';
import { WatchlistItem, ViewingHistory, UserProfile } from '@/types';
import { tmdbClient } from '@/lib/tmdb/client';

export async function getOrCreateUserProfile(userId: string, email: string) {
  const supabase = createServiceClient();

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
  const supabase = createServiceClient();

  console.log(`[getUserWatchlist] Fetching watchlist for user: ${userId}`);

  // Only select columns we actually need - reduces payload by ~60%
  const { data, error } = await supabase
    .from('watchlist')
    .select('id, user_id, tmdb_id, media_type, status, title, added_at')
    .eq('user_id', userId)
    .order('added_at', { ascending: false })
    .limit(100); // Reasonable limit - UI won't show more than this anyway

  if (error) {
    console.error('[getUserWatchlist] Supabase error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId,
      query: 'SELECT id, tmdb_id, media_type, status, title, added_at FROM watchlist WHERE user_id = $1 ORDER BY added_at DESC LIMIT 100',
    });
    throw new Error(`Failed to fetch watchlist: ${error.message}${error.details ? ` (${error.details})` : ''}${error.hint ? ` Hint: ${error.hint}` : ''}`);
  }

  console.log(`[getUserWatchlist] Successfully fetched ${data?.length || 0} items for user ${userId}`);
  return data as WatchlistItem[];
}

export async function addToWatchlist(
  userId: string,
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  status: 'watching' | 'completed' | 'plan_to_watch' = 'plan_to_watch'
) {
  const supabase = createServiceClient();

  // Check if already in watchlist
  const { data: existing, error: checkError } = await supabase
    .from('watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .maybeSingle();

  // maybeSingle() returns null data (not an error) when no row found
  // Only throw if there's an actual error
  if (checkError) {
    console.error('Supabase check error:', {
      code: checkError.code,
      message: checkError.message,
      details: checkError.details,
      hint: checkError.hint,
    });
    throw new Error(`Failed to check watchlist: ${checkError.message}`);
  }

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

  // Fetch title from TMDB
  let title = '';
  try {
    if (mediaType === 'movie') {
      const movie = await tmdbClient.getMovieDetails(tmdbId);
      title = movie.title || '';
    } else {
      const tv = await tmdbClient.getTVDetails(tmdbId);
      title = tv.name || '';
    }
  } catch (tmdbError) {
    console.error(`Failed to fetch title from TMDB for ${mediaType} ${tmdbId}:`, tmdbError);
    // Continue with empty title - this should ideally not happen, but we'll let the DB constraint catch it
    title = '';
  }

  // Add new
  const { data, error } = await supabase
    .from('watchlist')
    .insert({
      user_id: userId,
      tmdb_id: tmdbId,
      media_type: mediaType,
      status,
      title, // Include the title
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId,
      tmdbId,
      mediaType,
      title,
    });
    throw new Error(`Failed to add to watchlist: ${error.message}${error.details ? ` (${error.details})` : ''}`);
  }

  if (!data) {
    throw new Error('Failed to add to watchlist: No data returned from insert');
  }

  return data as WatchlistItem;
}

export async function removeFromWatchlist(
  userId: string,
  tmdbId: number,
  mediaType: 'movie' | 'tv'
) {
  const supabase = createServiceClient();

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
  const supabase = createServiceClient();

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
  const supabase = createServiceClient();

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
  const supabase = createServiceClient();

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
  const supabase = createServiceClient();

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
  const supabase = createServiceClient();

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
