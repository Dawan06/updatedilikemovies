'use client';

import { Star, Clock, Calendar, Film, Tv } from 'lucide-react';

interface QuickStatsProps {
  rating?: number;
  runtime?: number;
  year?: string;
  mediaType: 'movie' | 'tv';
  seasons?: number;
  episodes?: number;
}

export default function QuickStats({
  rating,
  runtime,
  year,
  mediaType,
  seasons,
  episodes,
}: QuickStatsProps) {
  const formatRuntime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-3">
      {rating !== undefined && rating > 0 && (
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-white font-semibold">{rating.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Rating</p>
          </div>
        </div>
      )}

      {runtime !== undefined && runtime > 0 && (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-white font-semibold">{formatRuntime(runtime)}</p>
            <p className="text-xs text-gray-500">Runtime</p>
          </div>
        </div>
      )}

      {year && (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-white font-semibold">{year}</p>
            <p className="text-xs text-gray-500">Release Year</p>
          </div>
        </div>
      )}

      {mediaType === 'tv' && seasons !== undefined && (
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-white font-semibold">{seasons}</p>
            <p className="text-xs text-gray-500">Season{seasons !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {mediaType === 'tv' && episodes !== undefined && (
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-white font-semibold">{episodes}</p>
            <p className="text-xs text-gray-500">Episode{episodes !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}
    </div>
  );
}
