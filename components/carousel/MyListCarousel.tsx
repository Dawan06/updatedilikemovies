'use client';

import { useEffect, useState } from 'react';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import ContentCarousel from './ContentCarousel';
import MovieCard from '@/components/movie-card/MovieCard';
import { WatchlistItem } from '@/types';

interface ItemWithDetails {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  added_at: string;
  details: {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
    overview: string;
  };
}

export default function MyListCarousel() {
  const { items: watchlistItems, loading: watchlistLoading } = useWatchlist();
  const [items, setItems] = useState<ItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyList() {
      // Only show if 3 or more items
      if (watchlistItems.length < 3) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        // Convert WatchlistItem to format expected by details API
        const itemsForDetails = watchlistItems.map(item => ({
          tmdb_id: item.tmdb_id,
          media_type: item.media_type,
        }));

        // Fetch details for items (cached by API)
        const response = await fetch('/api/watchlist/details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: itemsForDetails }),
        });

        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error('Error loading my list:', error);
      } finally {
        setLoading(false);
      }
    }

    // Don't wait for watchlist loading - start fetching details immediately if we have items
    if (watchlistItems.length > 0) {
      loadMyList();
    } else if (!watchlistLoading) {
      // Only set loading false if watchlist is done loading and empty
      setLoading(false);
    }
  }, [watchlistItems, watchlistLoading]);

  // Don't render anything if loading or not enough items
  if ((loading && watchlistItems.length === 0) || items.length < 3) {
    return null;
  }

  return (
    <ContentCarousel title="My List" seeAllHref="/my-list">
      {items.map((item, i) => (
        <div key={`${item.media_type}-${item.tmdb_id}`} className="flex-shrink-0 w-[180px] md:w-[220px] scroll-snap-align-start">
          <MovieCard 
            item={item.details} 
            mediaType={item.media_type} 
            index={i} 
            enableHover={true} 
          />
        </div>
      ))}
    </ContentCarousel>
  );
}
