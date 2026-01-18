'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import ContentCarousel from './ContentCarousel';
import MovieCard from '@/components/movie-card/MovieCard';
import { Movie, TVShow } from '@/types';

interface ContinueWatchingItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  progress: number;
  last_watched_at: string;
  season_number?: number | null;
  episode_number?: number | null;
  details: Movie | TVShow;
  completionPercentage: number;
  runtime: number | null;
}

export default function ContinueWatchingCarousel() {
  const { isSignedIn, isLoaded } = useUser();
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContinueWatching() {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/continue-watching', {
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error('Error loading continue watching:', error);
      } finally {
        setLoading(false);
      }
    }

    loadContinueWatching();
  }, [isSignedIn, isLoaded]);

  // Don't render if not signed in, loading, or no items
  if (!isLoaded || !isSignedIn || loading || items.length === 0) {
    return null;
  }

  return (
    <ContentCarousel title="Continue Watching" seeAllHref="/my-list">
      {items.map((item, i) => (
        <div 
          key={`${item.media_type}-${item.tmdb_id}`} 
          className="flex-shrink-0 w-[180px] md:w-[220px] scroll-snap-align-start"
        >
          <div className="relative">
            <MovieCard 
              item={item.details} 
              mediaType={item.media_type} 
              index={i} 
              enableHover={true}
            />
            {/* Progress indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${item.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </ContentCarousel>
  );
}