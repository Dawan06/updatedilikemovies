'use client';

import HeroBanner from './HeroBanner';
import { Movie, TVShow } from '@/types';

interface VideoInfo {
  key: string;
  name: string;
  site: string;
  type: string;
}

interface UserHeroBannerProps {
  readonly initialItems?: (Movie | TVShow)[];
  readonly initialMediaType?: 'movie' | 'tv';
  readonly initialTrailers?: Record<number, VideoInfo[]>;
  readonly fallbackItems: (Movie | TVShow)[];
  readonly fallbackMediaType: 'movie' | 'tv';
  readonly fallbackTrailers: Record<number, VideoInfo[]>;
}

export default function UserHeroBanner({ 
  initialItems,
  initialMediaType,
  initialTrailers,
  fallbackItems, 
  fallbackMediaType, 
  fallbackTrailers 
}: UserHeroBannerProps) {
  // Use server-side fetched data if available, otherwise use fallback
  // This eliminates blocking client-side requests for LCP optimization
  const items = initialItems && initialItems.length > 0 ? initialItems : fallbackItems;
  const mediaType = initialMediaType || fallbackMediaType;
  const trailers = initialTrailers && Object.keys(initialTrailers).length > 0 ? initialTrailers : fallbackTrailers;

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
