'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { WatchlistItem } from '@/types';
import { getWatchlist as getLocalWatchlist } from '@/lib/watchlist-storage';

interface WatchlistContextType {
  items: WatchlistItem[];
  loading: boolean;
  error: string | null;
  addItem: (tmdbId: number, mediaType: 'movie' | 'tv') => Promise<boolean>;
  removeItem: (tmdbId: number, mediaType: 'movie' | 'tv') => Promise<boolean>;
  isInWatchlist: (tmdbId: number, mediaType: 'movie' | 'tv') => boolean;
  refresh: () => Promise<void>;
  synced: boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

// Request deduplication - prevent multiple simultaneous requests
let fetchPromise: Promise<WatchlistItem[]> | null = null;
let lastFetchTime = 0;
const FETCH_CACHE_TIME = 5000; // Cache for 5 seconds

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);
  const isInitialMount = useRef(true);

  const fetchWatchlist = useCallback(async (force = false): Promise<WatchlistItem[]> => {
    if (!isLoaded) return [];
    
    if (!isSignedIn) {
      setItems([]);
      setLoading(false);
      return [];
    }

    // Request deduplication - reuse ongoing request only if not forcing
    const now = Date.now();
    if (!force && fetchPromise && (now - lastFetchTime) < FETCH_CACHE_TIME) {
      return fetchPromise;
    }

    // If forcing, clear the promise to allow new request
    if (force) {
      fetchPromise = null;
    }

    fetchPromise = (async () => {
      try {
        setError(null);
        const response = await fetch('/api/watchlist', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Watchlist API error:', response.status, errorText);
          throw new Error(`Failed to fetch watchlist: ${response.status}`);
        }

        const data = await response.json();
        const fetchedItems = data.items || [];
        lastFetchTime = now;
        
        console.log(`Fetched ${fetchedItems.length} watchlist items`);
        setItems(fetchedItems);
        return fetchedItems;
      } catch (err) {
        console.error('Error fetching watchlist:', err);
        setError(err instanceof Error ? err.message : 'Failed to load watchlist');
        return [];
      } finally {
        // Clear promise after completion
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  }, [isSignedIn, isLoaded]);

  // Initial load with migration check
  useEffect(() => {
    if (!isLoaded) return;

    async function initialLoad() {
      setLoading(true);
      
      const fetchedItems = await fetchWatchlist();
      
      // Check for localStorage migration on first load only
      if (isInitialMount.current && isSignedIn) {
        isInitialMount.current = false;
        
        const localItems = getLocalWatchlist();
        if (localItems.length > 0) {
          // Auto-migrate localStorage to Supabase
          try {
            const syncResponse = await fetch('/api/watchlist/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: localItems }),
            });

            if (syncResponse.ok) {
              const syncData = await syncResponse.json();
              setItems(syncData.items || []);
              setSynced(true);
              
              // Clear localStorage after successful sync
              if (syncData.migrated > 0) {
                localStorage.removeItem('ilikemovies_watchlist');
                // Store migration info for notification
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('watchlist_migration', JSON.stringify({
                    migrated: syncData.migrated,
                    skipped: syncData.skipped,
                  }));
                }
              }
            }
          } catch (syncError) {
            console.error('Error syncing watchlist:', syncError);
            // Continue with Supabase data even if sync fails
          }
        } else {
          setSynced(true);
        }
      }
      
      setLoading(false);
    }

    initialLoad();
  }, [isSignedIn, isLoaded, fetchWatchlist]);

  const addItem = useCallback(async (tmdbId: number, mediaType: 'movie' | 'tv'): Promise<boolean> => {
    if (!isSignedIn) return false;

    // Optimistic update
    const optimisticItem: WatchlistItem = {
      id: `temp-${tmdbId}-${mediaType}`,
      user_id: '',
      tmdb_id: tmdbId,
      media_type: mediaType,
      added_at: new Date().toISOString(),
      status: 'plan_to_watch',
    };
    
    setItems(prev => {
      // Check if already exists
      if (prev.some(item => item.tmdb_id === tmdbId && item.media_type === mediaType)) {
        return prev;
      }
      return [optimisticItem, ...prev];
    });

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: tmdbId,
          media_type: mediaType,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        console.error('Add to watchlist error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          details: errorData.details,
          fullResponse: errorData,
        });
        throw new Error(errorData.details || errorData.error || 'Failed to add to watchlist');
      }

      const responseData = await response.json();
      console.log('Add API response:', responseData);

      if (responseData.error) {
        console.error('API returned error:', responseData.error, responseData.details);
        throw new Error(responseData.details || responseData.error);
      }

      if (!responseData.item) {
        console.error('API response missing item:', responseData);
        throw new Error('Invalid response from server');
      }

      console.log('Successfully added item to watchlist:', responseData.item);

      // Add small delay before refresh to ensure DB commit completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh to get real data (force refresh)
      const refreshed = await fetchWatchlist(true);
      // Ensure items are updated
      setItems(refreshed);
      console.log(`Watchlist refreshed, now has ${refreshed.length} items`);
      return true;
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      // Revert optimistic update
      setItems(prev => prev.filter(item => item.id !== optimisticItem.id));
      return false;
    }
  }, [isSignedIn, fetchWatchlist]);

  const removeItem = useCallback(async (tmdbId: number, mediaType: 'movie' | 'tv'): Promise<boolean> => {
    if (!isSignedIn) return false;

    // Optimistic update
    const itemToRemove = items.find(
      item => item.tmdb_id === tmdbId && item.media_type === mediaType
    );
    
    setItems(prev => prev.filter(
      item => !(item.tmdb_id === tmdbId && item.media_type === mediaType)
    ));

    try {
      const response = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: tmdbId,
          media_type: mediaType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove from watchlist');
      }

      return true;
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      // Revert optimistic update
      if (itemToRemove) {
        setItems(prev => [...prev, itemToRemove]);
      }
      return false;
    }
  }, [isSignedIn, items]);

  const isInWatchlist = useCallback((tmdbId: number, mediaType: 'movie' | 'tv'): boolean => {
    return items.some(
      item => item.tmdb_id === tmdbId && item.media_type === mediaType
    );
  }, [items]);

  const refresh = useCallback(async () => {
    await fetchWatchlist(true);
  }, [fetchWatchlist]);

  return (
    <WatchlistContext.Provider
      value={{
        items,
        loading,
        error,
        addItem,
        removeItem,
        isInWatchlist,
        refresh,
        synced,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
