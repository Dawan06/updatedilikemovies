'use client';

import { useState } from 'react';
import { Play, X } from 'lucide-react';

interface TrailerPlayerProps {
  readonly videoKey: string;
  readonly title: string;
}

export default function TrailerPlayer({ videoKey, title }: TrailerPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!videoKey) return null;

  return (
    <>
      <button
        onClick={() => setIsPlaying(true)}
        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <div className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center hover:border-white/60 transition-colors">
          <Play className="w-4 h-4 fill-current ml-0.5" />
        </div>
        <span className="text-sm font-medium">Trailer</span>
      </button>

      {isPlaying && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setIsPlaying(false)}
        >
          <button
            onClick={() => setIsPlaying(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            className="w-full max-w-5xl mx-4 aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
              title={`${title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
