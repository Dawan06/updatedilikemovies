'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Film, Star, ChevronRight, Layers } from 'lucide-react';
import { FranchiseCard as FranchiseCardType } from '@/types';
import { useState } from 'react';
import { createProgressiveImageProps } from '@/lib/progressive-image-loader';

interface FranchiseCardProps {
  readonly franchise: FranchiseCardType;
  readonly priority?: boolean;
}

export default function FranchiseCard({ franchise, priority = false }: FranchiseCardProps) {
  const { collection, movieCount } = franchise;
  const [backdropReady, setBackdropReady] = useState(false);

  // Use optimized image sizes
  const progressiveProps = createProgressiveImageProps(collection.backdrop_path, 'w1280');

  // Calculate average rating from movies
  const avgRating = collection.parts.length > 0
    ? collection.parts.reduce((sum, m) => sum + (m.vote_average || 0), 0) / collection.parts.length
    : 0;

  return (
    <Link
      href={`/franchise/${collection.id}`}
      className="group relative block aspect-video rounded-xl overflow-hidden bg-netflix-dark shadow-card hover:shadow-card-hover hover:shadow-primary/20 transition-all duration-700 ease-cinematic z-0"
    >
      {/* Backdrop Image with Slow Cinematic Zoom */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        {progressiveProps.fullSrc ? (
          <Image
            src={backdropReady ? progressiveProps.fullSrc : progressiveProps.placeholderSrc}
            alt={collection.name}
            fill
            className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 will-change-transform"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            quality={backdropReady ? 80 : 20}
            onLoad={() => {
              setBackdropReady(true);
              if (progressiveProps.fullSrc) {
                const preloadImg = document.createElement('img');
                preloadImg.src = progressiveProps.fullSrc;
              }
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}
      </div>

      {/* Cinematic Vignette & Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent opacity-60" />

      {/* Subtle Shine Effect */}
      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent z-10 pointer-events-none" />

      {/* Border Glow */}
      <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-primary/30 transition-colors duration-500 z-20" />

      {/* Content Layer */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 z-20">

        {/* Floating Badges (Top Right) */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
          {avgRating > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-50 text-xs font-bold tracking-wide">{avgRating.toFixed(1)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
            <Layers className="w-3 h-3 text-gray-300" />
            <span className="text-gray-300 text-xs font-semibold">{movieCount} Entries</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="transform transition-transform duration-500 group-hover:-translate-y-1">
          <h3 className="font-display text-3xl md:text-4xl text-white uppercase tracking-widest drop-shadow-2xl leading-none mb-2 line-clamp-1 group-hover:text-primary transition-colors duration-300">
            {collection.name.replace(' Collection', '')}
          </h3>

          <div className="h-0.5 w-12 bg-primary rounded-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out origin-left group-hover:w-full max-w-[200px]" />

          <p className="text-gray-300 text-sm font-light line-clamp-2 max-w-[90%] opacity-0 group-hover:opacity-100 transition-all duration-500 delay-75 transform translate-y-4 group-hover:translate-y-0">
            {collection.overview || `Experience the complete ${collection.name} saga.`}
          </p>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between mt-4 border-t border-white/10 pt-3 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150 transform translate-y-4 group-hover:translate-y-0">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
            {movieCount} Movies
          </span>
          <div className="flex items-center gap-1 text-white text-xs font-bold uppercase tracking-widest group/btn">
            Explore
            <ChevronRight className="w-3.5 h-3.5 text-primary transition-transform duration-300 group-hover/btn:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
