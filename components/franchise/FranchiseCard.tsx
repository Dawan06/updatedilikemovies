'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Film, Star, ChevronRight } from 'lucide-react';
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
      className="group relative block aspect-video rounded-2xl overflow-hidden bg-netflix-dark transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20"
    >
      {/* Backdrop Image */}
      {progressiveProps.fullSrc ? (
        <Image
          src={backdropReady ? progressiveProps.fullSrc : progressiveProps.placeholderSrc}
          alt={collection.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          quality={backdropReady ? 70 : 20}
          onLoad={() => {
            setBackdropReady(true);
            if (progressiveProps.fullSrc) {
              const preloadImg = document.createElement('img');
              preloadImg.src = progressiveProps.fullSrc;
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-netflix-gray to-netflix-dark" />
      )}

      {/* Gradient Overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      {/* Glassmorphism border on hover */}
      <div className="absolute inset-0 rounded-2xl border border-white/0 group-hover:border-white/20 transition-all duration-500" />

      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-primary/10 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
        {/* Rating Badge - Top Right */}
        {avgRating > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full border border-white/10">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-sm font-semibold">{avgRating.toFixed(1)}</span>
          </div>
        )}

        {/* Franchise Name */}
        <h3 className="text-white font-bold text-xl md:text-2xl mb-2 drop-shadow-lg line-clamp-2 group-hover:text-primary-light transition-colors duration-300">
          {collection.name}
        </h3>

        {/* Stats Row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-gray-300">
            <Film className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {movieCount} {movieCount === 1 ? 'Movie' : 'Movies'}
            </span>
          </div>
        </div>

        {/* Overview (truncated) */}
        {collection.overview && (
          <p className="text-gray-400 text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {collection.overview}
          </p>
        )}

        {/* CTA - appears on hover */}
        <div className="flex items-center gap-2 text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <span>Explore Collection</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </Link>
  );
}
