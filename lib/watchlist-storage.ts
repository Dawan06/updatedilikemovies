// Watchlist storage utility using localStorage
// Supports large lists (5-10MB vs 4KB cookie limit)

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
