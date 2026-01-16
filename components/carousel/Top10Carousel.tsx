'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Movie, TVShow } from '@/types';

interface Top10CarouselProps {
  readonly title: string;
  readonly items: (Movie | TVShow)[];
  readonly itemsWithMediaType?: Array<(Movie | TVShow) & { mediaType: 'movie' | 'tv' }>;
  readonly mediaType?: 'movie' | 'tv';
}

export default function Top10Carousel({ title, items, itemsWithMediaType, mediaType }: Top10CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const top10Items = items.slice(0, 10);
  
  // Get media type for each item
  const getMediaType = (item: Movie | TVShow, index: number): 'movie' | 'tv' => {
    if (itemsWithMediaType) {
      return itemsWithMediaType[index]?.mediaType || mediaType || 'movie';
    }
    return mediaType || 'movie';
  };

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    globalThis.addEventListener('resize', checkScroll);
    
    return () => {
      el.removeEventListener('scroll', checkScroll);
      globalThis.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (top10Items.length === 0) return null;

  return (
    <section 
      className="relative group/section"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-14 md:w-16 h-80 z-30 flex items-center justify-center transition-opacity duration-300 ${
            canScrollLeft && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
          <button
            onClick={() => scroll('left')}
            className="relative z-10 w-full h-full flex items-center justify-center text-white/80 hover:text-white transition-all duration-300 hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-12 h-12 drop-shadow-lg" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-12 py-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {top10Items.map((item, index) => (
            <Top10Card 
              key={item.id} 
              item={item} 
              rank={index + 1} 
              mediaType={getMediaType(item, index)}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <div
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-14 md:w-16 h-80 z-30 flex items-center justify-center transition-opacity duration-300 ${
            canScrollRight && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/60 to-transparent" />
          <button
            onClick={() => scroll('right')}
            className="relative z-10 w-full h-full flex items-center justify-center text-white/80 hover:text-white transition-all duration-300 hover:scale-110"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-12 h-12 drop-shadow-lg" />
          </button>
        </div>
      </div>
    </section>
  );
}

interface Top10CardProps {
  readonly item: Movie | TVShow;
  readonly rank: number;
  readonly mediaType: 'movie' | 'tv';
}

function Top10Card({ item, rank, mediaType }: Top10CardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const title = (item as Movie).title || (item as TVShow).name || '';
  const posterPath = item.poster_path;
  const rating = item.vote_average;

  return (
    <Link 
      href={`/${mediaType}/${item.id}`}
      className="flex-shrink-0 relative group scroll-snap-align-start hover:scale-105 transition-all duration-300 ease-out"
      style={{ width: '220px', height: '280px', minWidth: '220px' }}
    >
      {/* Number - positioned to the left, bottom aligned with poster */}
      <span 
        className="absolute font-black leading-none select-none transition-all duration-300 group-hover:scale-110"
        style={{
          fontSize: '10rem',
          WebkitTextStroke: '4px #E50914',
          color: 'transparent',
          textShadow: '2px 2px 0px rgba(0,0,0,0.9)',
          left: '0',
          bottom: '0',
          letterSpacing: '-0.1em',
          zIndex: 1,
          lineHeight: '0.8',
        }}
      >
        {rank}
      </span>

      {/* Poster Card - offset to the right to show number */}
      <div 
        className="absolute rounded-lg overflow-hidden bg-netflix-dark shadow-2xl transition-all duration-300 z-10 group-hover:shadow-red-900/30 group-hover:shadow-xl"
        style={{
          width: '140px',
          height: '210px',
          right: '0',
          bottom: '0',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}
        
        {/* Poster Image */}
        {posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w342${posterPath}`}
            alt={title}
            fill
            className={`object-cover transition-all duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="140px"
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full bg-netflix-gray flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-600">{rank}</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          
          <div className="relative z-10 p-2">
            <h3 className="text-white font-bold text-xs line-clamp-2 mb-1">
              {title}
            </h3>
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-white text-xs font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
