'use client';

import { useViewingProgress } from '@/lib/hooks/useViewingProgress';
import Link from 'next/link';
import { Play, Clock } from 'lucide-react';

interface WatchProgressProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  runtime?: number;
  seasonNumber?: number;
  episodeNumber?: number;
}

export default function WatchProgress({
  tmdbId,
  mediaType,
  runtime,
  seasonNumber,
  episodeNumber,
}: WatchProgressProps) {
  const { progress, loading } = useViewingProgress({
    tmdbId,
    mediaType,
    seasonNumber,
    episodeNumber,
  });

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-2 bg-netflix-gray rounded mb-2" />
        <div className="h-4 bg-netflix-gray rounded w-24" />
      </div>
    );
  }

  if (!progress || progress.progress === 0) {
    return null;
  }

  if (mediaType === 'movie' && runtime) {
    const percentage = Math.round((progress.progress / runtime) * 100);
    const remainingMinutes = Math.round((runtime - progress.progress) / 60);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-medium">{percentage}%</span>
        </div>
        <div className="w-full h-1.5 bg-netflix-gray rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {remainingMinutes > 0 && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {remainingMinutes} min remaining
          </p>
        )}
        <Link
          href={`/watch/movie/${tmdbId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-primary transition-colors"
        >
          <Play className="w-4 h-4" />
          Resume Watching
        </Link>
      </div>
    );
  }

  if (mediaType === 'tv' && progress.season_number && progress.episode_number) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Last Watched</span>
        </div>
        <p className="text-white font-medium">
          Season {progress.season_number}, Episode {progress.episode_number}
        </p>
        <Link
          href={`/watch/tv/${tmdbId}?season=${progress.season_number}&episode=${progress.episode_number}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-primary transition-colors"
        >
          <Play className="w-4 h-4" />
          Continue Watching
        </Link>
      </div>
    );
  }

  return null;
}
