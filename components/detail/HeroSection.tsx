'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Play, Star, Calendar, Info } from 'lucide-react';
import { useParallax } from '@/lib/hooks/useParallax';
import TrailerPlayer from './TrailerPlayer';
import PrePlayModal from '@/components/PrePlayModal';
import { Genre } from '@/types';
import { createProgressiveImageProps } from '@/lib/progressive-image-loader';
import ContentRatingBadge from '@/components/ContentRatingBadge';

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
  status?: string;
  contentRating?: string;
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
  contentRating,
}: HeroSectionProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const parallaxOffset = useParallax(0.3);
  const [showPrePlayModal, setShowPrePlayModal] = useState(false);
  const [backdropReady, setBackdropReady] = useState(false);

  // Use high quality image for hero
  const backdropProgressiveProps = createProgressiveImageProps(backdropPath, 'original');

  useEffect(() => {
    if (backdropRef.current) {
      // Smoother parallax with scale to prevent edge bleeding
      backdropRef.current.style.transform = `translateY(${parallaxOffset}px) scale(1.05)`;
    }
  }, [parallaxOffset]);

  const handleWatchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const dismissed = localStorage.getItem('prePlayTipsDismissed');
    if (dismissed) {
      window.location.href = watchUrl;
    } else {
      setShowPrePlayModal(true);
    }
  };

  return (
    <div className="relative min-h-[600px] md:min-h-[85vh] lg:min-h-[95vh] w-full overflow-hidden flex items-end font-sans">
      {/* Dynamic Background */}
      <div ref={backdropRef} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-netflix-black" />
        {backdropPath && (
          <Image
            src={backdropReady ? backdropProgressiveProps.fullSrc : backdropProgressiveProps.placeholderSrc}
            alt={title}
            fill
            className={`object-cover transition-opacity duration-1000 ease-out ${backdropReady ? 'opacity-100' : 'opacity-0'
              }`}
            priority
            quality={90}
            onLoad={() => setBackdropReady(true)}
            draggable={false}
          />
        )}

        {/* Premium Cinematic Gradients - Carefully layered for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-netflix-black via-netflix-black/40 to-transparent opacity-90 md:opacity-100" />

        {/* Top Vignette */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 w-full px-6 md:px-12 lg:px-16 pb-20 lg:pb-28 max-w-[1600px] mx-auto">
        <div className="flex flex-col items-start max-w-4xl space-y-6">

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-3 animate-fade-in-up">
            {mediaType === 'movie' ? (
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-sm shadow-sm">
                Movie
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-primary/80 backdrop-blur-md text-white border border-primary/50 rounded-sm shadow-sm">
                TV Series
              </span>
            )}

            {status && mediaType === 'tv' && (
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-white/10 backdrop-blur-md text-gray-200 border border-white/10 rounded-sm">
                {status}
              </span>
            )}

            {rating && rating > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-sm border border-white/10">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold text-white tracking-wide">{rating.toFixed(1)}</span>
              </div>
            )}
            {contentRating && (
              <ContentRatingBadge rating={contentRating} size="md" />
            )}
          </div>

          {/* Majestic Title */}
          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-white leading-[0.9] tracking-tight drop-shadow-2xl animate-fade-in-up delay-100">
            {title}
          </h1>

          {/* Info Line */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm md:text-base font-medium text-gray-200 animate-fade-in-up delay-200">
            {year && (
              <div className="flex items-center gap-2 opacity-90">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{year}</span>
              </div>
            )}

            <div className="w-1 h-1 rounded-full bg-white/30" />

            <div className="flex flex-wrap gap-2">
              {genres.map((g, i) => (
                <span key={g.id} className="text-gray-300 hover:text-white transition-colors">
                  {g.name}{i < genres.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          </div>

          {/* Overview */}
          <p className="text-base md:text-xl text-gray-200/90 leading-relaxed font-light max-w-3xl line-clamp-3 md:line-clamp-4 drop-shadow-md animate-fade-in-up delay-300">
            {overview}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4 animate-fade-in-up delay-500">
            <button
              onClick={handleWatchClick}
              className="group relative flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-white text-black rounded-lg font-bold text-base md:text-xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            >
              <Play className="w-5 h-5 md:w-6 md:h-6 fill-black" />
              <span>Watch Now</span>
            </button>

            {trailer && (
              <TrailerPlayer videoKey={trailer.key} title={title}>
                <button className="flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-lg font-bold text-lg hover:bg-white/20 transition-all duration-300 group">
                  <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                    <Info className="w-3 h-3" strokeWidth={4} />
                  </div>
                  <span>Trailer</span>
                </button>
              </TrailerPlayer>
            )}
          </div>
        </div>
      </div>

      {/* Subtle bottom gradient to blend with content below */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-netflix-black to-transparent z-10 pointer-events-none" />

      {/* Modal */}
      <PrePlayModal
        isOpen={showPrePlayModal}
        onClose={() => setShowPrePlayModal(false)}
        watchUrl={watchUrl}
        title={title}
      />
    </div>
  );
}
