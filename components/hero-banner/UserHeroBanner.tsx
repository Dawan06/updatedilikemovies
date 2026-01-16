'use client';

import { useEffect, useState, useRef } from 'react';
import { getWatchlist } from '@/lib/watchlist-storage';
import HeroBanner from './HeroBanner';
import { Movie, TVShow } from '@/types';

interface VideoInfo {
  key: string;
  name: string;
  site: string;
  type: string;
}

interface UserHeroBannerProps {
  readonly fallbackItems: (Movie | TVShow)[];
  readonly fallbackMediaType: 'movie' | 'tv';
  readonly fallbackTrailers: Record<number, VideoInfo[]>;
}

interface WatchlistItemWithDetails {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  details: Movie | TVShow;
}

export default function UserHeroBanner({ 
  fallbackItems, 
  fallbackMediaType, 
  fallbackTrailers 
}: UserHeroBannerProps) {
  const [items, setItems] = useState<(Movie | TVShow)[]>(fallbackItems);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>(fallbackMediaType);
  const [trailers, setTrailers] = useState<Record<number, VideoInfo[]>>(fallbackTrailers);
  const hasLoaded = useRef(false);

  useEffect(() => {
    // Only run once
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    async function loadUserList() {
      try {
        const watchlist = getWatchlist();
        
        // If user has no watchlist, keep using fallback (already set)
        if (watchlist.length < 1) {
          return;
        }

        // Fetch details for user's watchlist
        const response = await fetch('/api/watchlist/details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: watchlist }),
        });

        if (!response.ok) {
          return; // Keep fallback
        }

        const data = await response.json();
        const itemsWithDetails: WatchlistItemWithDetails[] = data.items || [];
        
        if (itemsWithDetails.length < 1) {
          return; // Keep fallback
        }

        // Get up to 5 items for the hero
        const heroItems = itemsWithDetails.slice(0, 5).map(item => item.details);
        
        // Determine primary media type
        const movieCount = itemsWithDetails.slice(0, 5).filter(i => i.media_type === 'movie').length;
        const primaryType = movieCount > itemsWithDetails.slice(0, 5).length / 2 ? 'movie' : 'tv';
        
        // Fetch trailers for user's items
        const trailerPromises = itemsWithDetails.slice(0, 5).map(async (item) => {
          try {
            const res = await fetch(`/api/videos?id=${item.tmdb_id}&type=${item.media_type}`);
            if (res.ok) {
              const videoData = await res.json();
              return { id: item.details.id, videos: videoData.results || [] };
            }
          } catch {
            // Ignore errors
          }
          return { id: item.details.id, videos: [] };
        });

        const trailerResults = await Promise.all(trailerPromises);
        const userTrailers: Record<number, VideoInfo[]> = {};
        trailerResults.forEach(result => {
          if (result.videos.length > 0) {
            userTrailers[result.id] = result.videos;
          }
        });

        // Switch to user content
        setItems(heroItems);
        setMediaType(primaryType);
        setTrailers(userTrailers);
      } catch (error) {
        console.error('Error loading user list for hero:', error);
        // Keep fallback on error
      }
    }

    loadUserList();
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <HeroBanner 
      items={items} 
      mediaType={mediaType} 
      trailers={trailers}
    />
  );
}
