'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import { useParallax } from '@/lib/hooks/useParallax';
import TrailerPlayer from './TrailerPlayer';
import PrePlayModal from '@/components/PrePlayModal';
import { Genre } from '@/types';

interface HeroSectionProps {
  backdropPath: string | null;
  posterPath: string | null;
  title: string;
  rating?: number;
  year?: string;
  genres: Genre[];
  overview: string;
  watchUrl: string;
  trailer?: { key: string; name: string } | null;
  mediaType: 'movie' | 'tv';
  status?: string; // For TV shows
}

export default function HeroSection({
  backdropPath,
  posterPath,
  title,
  rating,
  year,
  genres,
  overview,
  watchUrl,
  trailer,
  mediaType,
  status,
}: HeroSectionProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const parallaxOffset = useParallax(0.3);
  const [showPrePlayModal, setShowPrePlayModal] = useState(false);

  useEffect(() => {
    if (backdropRef.current) {
      backdropRef.current.style.transform = `translateY(${parallaxOffset}px)`;
    }
  }, [parallaxOffset]);

  return (
    <div className="relative h-[90vh] min-h-[700px] overflow-hidden">
      {/* Backdrop with Parallax */}
      {backdropPath && (
        <div ref={backdropRef} className="absolute inset-0">
          <Image
            src={`https://image.tmdb.org/t/p/original${backdropPath}`}
            alt={title}
            fill
            className="object-cover animate-ken-burns"
            priority
            sizes="100vw"
          />
        </div>
      )}
      
      {/* Enhanced Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-netflix-black via-netflix-black/90 to-netflix-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-netflix-black/80" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-16 md:pb-24">
        <div className="w-full px-4 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              {/* Poster */}
              {posterPath && (
                <div className="flex-shrink-0 animate-slide-in-left">
                  <div className="relative w-48 md:w-64 lg:w-80 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl ring-2 ring-white/10">
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${posterPath}`}
                      alt={title}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 192px, (max-width: 1024px) 256px, 320px"
                    />
                  </div>
                </div>
              )}

              {/* Text Content */}
              <div className="flex-1 min-w-0 animate-fade-in-up">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {mediaType === 'tv' && (
                    <span className="px-3 py-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full">
                      TV Series
                    </span>
                  )}
                  {status && (
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      status === 'Returning Series' 
                        ? 'text-green-400 bg-green-400/10 border border-green-400/20' 
                        : 'text-gray-400 bg-white/10 border border-white/10'
                    }`}>
                      {status}
                    </span>
                  )}
                  {genres.slice(0, mediaType === 'tv' ? 2 : 3).map((g) => (
                    <span
                      key={g.id}
                      className="px-3 py-1 text-xs font-medium text-white/90 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-white mb-4 tracking-wide leading-tight">
                  {title}
                </h1>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-300">
                  {rating !== undefined && rating > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-semibold">{rating.toFixed(1)}</span>
                    </span>
                  )}
                  {year && <span>{year}</span>}
                </div>

                {/* Overview */}
                <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-2xl line-clamp-3">
                  {overview}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const dismissed = localStorage.getItem('prePlayTipsDismissed');
                      if (dismissed) {
                        window.location.href = watchUrl;
                      } else {
                        setShowPrePlayModal(true);
                      }
                    }}
                    className="inline-flex items-center gap-3 bg-white text-black px-8 py-3 rounded font-bold text-base hover:bg-white/90 transition-all duration-200 hover:scale-105"
                  >
                    <Play className="w-5 h-5 fill-black" />
                    Watch Now
                  </button>

                  {trailer && (
                    <TrailerPlayer 
                      videoKey={trailer.key} 
                      title={title}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-Play Modal */}
      <PrePlayModal
        isOpen={showPrePlayModal}
        onClose={() => setShowPrePlayModal(false)}
        watchUrl={watchUrl}
        title={title}
      />
    </div>
  );
}
