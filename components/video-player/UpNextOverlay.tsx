'use client';

import { X, Play, Clock } from 'lucide-react';
import { Episode } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

interface UpNextOverlayProps {
  show: boolean;
  countdown: number;
  nextEpisode: Episode;
  tvId: number;
  currentSeason: number;
  onCancel: () => void;
  onSkip: () => void;
}

export default function UpNextOverlay({
  show,
  countdown,
  nextEpisode,
  tvId,
  currentSeason,
  onCancel,
  onSkip,
}: UpNextOverlayProps) {
  if (!show) return null;

  return (
    <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fade-in-up">
      <div className="glass rounded-xl overflow-hidden shadow-2xl">
        <div className="flex gap-4 p-4">
          {/* Thumbnail */}
          <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-netflix-gray flex-shrink-0">
            {nextEpisode.still_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w300${nextEpisode.still_path}`}
                alt={nextEpisode.name}
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                E{nextEpisode.episode_number}
              </div>
            )}
            {/* Countdown overlay on thumbnail */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{countdown}</div>
                <div className="text-xs text-gray-300">seconds</div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 mb-1">Up Next</p>
                <h3 className="text-white font-semibold text-sm truncate">
                  {nextEpisode.episode_number}. {nextEpisode.name}
                </h3>
                {nextEpisode.overview && (
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                    {nextEpisode.overview}
                  </p>
                )}
              </div>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {nextEpisode.runtime && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {nextEpisode.runtime} min
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Link
                href={`/watch/tv/${tvId}?season=${currentSeason}&episode=${nextEpisode.episode_number}`}
                onClick={onSkip}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                Play Now
              </Link>
              <button
                onClick={onCancel}
                className="px-4 py-2 glass hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
