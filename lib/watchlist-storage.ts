// Watchlist storage utility
// NOTE: This file now primarily handles localStorage for migration purposes.
// For production use, components should use the useWatchlist hook or API directly.

export interface WatchlistItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  added_at: string;
}

const STORAGE_KEY = 'ilikemovies_watchlist';

/**
 * Get all watchlist items from localStorage
 */
export function getWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading watchlist from localStorage:', error);
    return [];
  }
}

/**
 * Save the entire watchlist to localStorage
 */
export function setWatchlist(items: WatchlistItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving watchlist to localStorage:', error);
  }
}

/**
 * Add a single item to the watchlist (if not already present)
 */
export function addToWatchlist(tmdbId: number, mediaType: 'movie' | 'tv'): boolean {
  const watchlist = getWatchlist();
  const key = `${tmdbId}-${mediaType}`;
  
  // Check if already exists
  const exists = watchlist.some(
    item => `${item.tmdb_id}-${item.media_type}` === key
  );
  
  if (exists) return false;
  
  watchlist.push({
    tmdb_id: tmdbId,
    media_type: mediaType,
    added_at: new Date().toISOString(),
  });
  
  setWatchlist(watchlist);
  return true;
}

/**
 * Remove a single item from the watchlist
 */
export function removeFromWatchlist(tmdbId: number, mediaType: 'movie' | 'tv'): boolean {
  const watchlist = getWatchlist();
  const key = `${tmdbId}-${mediaType}`;
  
  const newWatchlist = watchlist.filter(
    item => `${item.tmdb_id}-${item.media_type}` !== key
  );
  
  if (newWatchlist.length === watchlist.length) return false;
  
  setWatchlist(newWatchlist);
  return true;
}

/**
 * Check if an item is in the watchlist
 */
export function isInWatchlist(tmdbId: number, mediaType: 'movie' | 'tv'): boolean {
  const watchlist = getWatchlist();
  return watchlist.some(
    item => item.tmdb_id === tmdbId && item.media_type === mediaType
  );
}

/**
 * Add multiple items to the watchlist (for imports)
 * Returns count of items added (skips duplicates)
 */
export function addManyToWatchlist(
  items: Array<{ tmdb_id: number; media_type: 'movie' | 'tv' }>
): { added: number; skipped: number } {
  const watchlist = getWatchlist();
  const existingKeys = new Set(
    watchlist.map(item => `${item.tmdb_id}-${item.media_type}`)
  );
  
  let added = 0;
  let skipped = 0;
  
  for (const item of items) {
    const key = `${item.tmdb_id}-${item.media_type}`;
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }
    
    watchlist.push({
      tmdb_id: item.tmdb_id,
      media_type: item.media_type,
      added_at: new Date().toISOString(),
    });
    existingKeys.add(key);
    added++;
  }
  
  setWatchlist(watchlist);
  return { added, skipped };
}

/**
 * Clear the entire watchlist
 */
export function clearWatchlist(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get watchlist count
 */
export function getWatchlistCount(): number {
  return getWatchlist().length;
}

/**
 * Remove multiple items from the watchlist (for bulk delete)
 */
export function removeManyFromWatchlist(
  items: Array<{ tmdb_id: number; media_type: 'movie' | 'tv' }>
): number {
  const watchlist = getWatchlist();
  const keysToRemove = new Set(
    items.map(item => `${item.tmdb_id}-${item.media_type}`)
  );
  
  const newWatchlist = watchlist.filter(
    item => !keysToRemove.has(`${item.tmdb_id}-${item.media_type}`)
  );
  
  const removed = watchlist.length - newWatchlist.length;
  setWatchlist(newWatchlist);
  return removed;
}

/**
 * Sync localStorage watchlist to Supabase (for migration)
 * Returns the number of items migrated
 */
export async function syncWatchlistToCloud(): Promise<{ migrated: number; skipped: number }> {
  if (typeof window === 'undefined') return { migrated: 0, skipped: 0 };

  const localItems = getWatchlist();
  if (localItems.length === 0) {
    return { migrated: 0, skipped: 0 };
  }

  try {
    const response = await fetch('/api/watchlist/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: localItems }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync watchlist');
    }

    const data = await response.json();
    
    // Clear localStorage after successful sync
    if (data.migrated > 0) {
      clearWatchlist();
    }

    return { migrated: data.migrated || 0, skipped: data.skipped || 0 };
  } catch (error) {
    console.error('Error syncing watchlist to cloud:', error);
    return { migrated: 0, skipped: 0 };
  }
}

/**
 * Fetch watchlist from Supabase API
 */
export async function fetchWatchlistFromCloud(): Promise<WatchlistItem[]> {
  try {
    const response = await fetch('/api/watchlist');
    
    if (!response.ok) {
      throw new Error('Failed to fetch watchlist');
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching watchlist from cloud:', error);
    return [];
  }
}
