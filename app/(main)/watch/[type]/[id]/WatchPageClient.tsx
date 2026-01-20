'use client';

import dynamic from 'next/dynamic';
import { VideoSource, Episode } from '@/types';

// Lazy load video player
const VideoPlayerWrapper = dynamic(
  () => import('@/components/video-player/VideoPlayerWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white">Loading player...</div>
      </div>
    )
  }
);

interface WatchPageClientProps {
  sources: VideoSource[];
  title: string;
  tmdbId: number;
  mediaType: string;
  season?: number;
  episode?: number;
  episodes?: Episode[];
  totalSeasons?: number;
}

export default function WatchPageClient({
  sources,
  title,
  tmdbId,
  mediaType,
  season,
  episode,
  episodes,
  totalSeasons,
}: WatchPageClientProps) {
  // No sign-in required to watch content
  // Users can watch freely - only watchlist features require authentication
  return (
    <div className="fixed inset-0 bg-black z-50">
      <VideoPlayerWrapper
        sources={sources}
        title={title}
        tmdbId={tmdbId}
        mediaType={mediaType}
        season={season}
        episode={episode}
        episodes={episodes}
        totalSeasons={totalSeasons}
      />
    </div>
  );
}

