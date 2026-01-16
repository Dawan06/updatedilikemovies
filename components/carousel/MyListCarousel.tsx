'use client';

import { useEffect, useState } from 'react';
import { getWatchlist, WatchlistItem } from '@/lib/watchlist-storage';
import ContentCarousel from './ContentCarousel';
import MovieCard from '@/components/movie-card/MovieCard';

interface ItemWithDetails extends WatchlistItem {
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
  const [items, setItems] = useState<ItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyList() {
      try {
        const watchlist = getWatchlist();
        
        // Only show if 3 or more items
        if (watchlist.length < 3) {
          setItems([]);
          setLoading(false);
          return;
        }

        // Fetch details for items
        const response = await fetch('/api/watchlist/details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: watchlist }),
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

    loadMyList();
  }, []);

  // Don't render anything if loading or not enough items
  if (loading || items.length < 3) {
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
