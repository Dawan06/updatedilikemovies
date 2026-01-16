'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, Film } from 'lucide-react';
import { FranchiseCard as FranchiseCardType } from '@/types';

interface FranchiseHeroProps {
  readonly franchises: FranchiseCardType[];
}

export default function FranchiseHero({ franchises }: FranchiseHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const featuredFranchises = franchises.slice(0, 5);

  if (featuredFranchises.length === 0) return null;

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % featuredFranchises.length);
  }, [currentIndex, featuredFranchises.length, goToSlide]);

  // Auto-advance every 20 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 20000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const currentFranchise = featuredFranchises[currentIndex];

  return (
    <div className="relative h-[85vh] min-h-[550px] max-h-[900px] w-full overflow-hidden">
      {/* Background Images */}
      {featuredFranchises.map((franchise, index) => {
        const backdrop = franchise.collection.backdrop_path
          ? `https://image.tmdb.org/t/p/original${franchise.collection.backdrop_path}`
          : null;
        const isCurrentSlide = index === currentIndex;
        
        return (
          <div
            key={franchise.collection.id}
            className={`absolute inset-0 transition-opacity duration-800 ${
              isCurrentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {backdrop ? (
              <Image
                src={backdrop}
                alt={franchise.collection.name}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
                quality={85}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-netflix-gray to-netflix-dark" />
            )}
          </div>
        );
      })}

      {/* Gradient Overlays - Cinematic */}
      <div className="absolute inset-0 bg-gradient-to-r from-netflix-black via-netflix-black/70 to-transparent z-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-netflix-black/40 z-20" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-vignette opacity-50 z-20" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end z-20">
        <div className="w-full px-4 md:px-12 pb-36 md:pb-40">
          <div className="max-w-2xl">
            {/* Franchise Name with cinematic animation */}
            <h1 
              key={currentFranchise.collection.id}
              className="font-display text-4xl md:text-6xl lg:text-7xl text-white mb-4 tracking-wide drop-shadow-2xl animate-fade-in-up"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
            >
              {currentFranchise.collection.name.toUpperCase()}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm animate-fade-in-up animation-delay-100">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" />
                <span className="text-white font-semibold">
                  {currentFranchise.movieCount} {currentFranchise.movieCount === 1 ? 'Movie' : 'Movies'}
                </span>
              </div>
              {currentFranchise.userHasMovies && (
                <span className="px-2 py-0.5 bg-primary/20 border border-primary/30 rounded text-primary text-xs font-semibold uppercase">
                  You have {currentFranchise.userMovieCount}/{currentFranchise.movieCount}
                </span>
              )}
            </div>

            {/* Overview */}
            {currentFranchise.collection.overview && (
              <p className="text-gray-200 text-base md:text-lg max-w-xl leading-relaxed mb-6 line-clamp-3 drop-shadow-lg animate-fade-in-up animation-delay-200">
                {currentFranchise.collection.overview}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 animate-fade-in-up animation-delay-300">
              <Link 
                href={`/franchise/${currentFranchise.collection.id}`}
                className="group flex items-center gap-2 bg-white text-black px-6 md:px-8 py-3 rounded-md font-semibold text-lg hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Play className="w-6 h-6 fill-black" />
                <span>Explore Franchise</span>
              </Link>
              <Link 
                href={`/franchise/${currentFranchise.collection.id}`}
                className="group flex items-center gap-2 glass text-white px-6 md:px-8 py-3 rounded-md font-semibold text-lg hover:bg-white/20 transition-all duration-300 shadow-lg"
              >
                <Info className="w-6 h-6" />
                <span>More Info</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
        {featuredFranchises.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-500 rounded-full ${
              index === currentIndex 
                ? 'w-10 h-2 bg-primary shadow-glow' 
                : 'w-2 h-2 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-netflix-black to-transparent pointer-events-none z-20" />
    </div>
  );
}
