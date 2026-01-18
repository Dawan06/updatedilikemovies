'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface CastGridProps {
  readonly cast: CastMember[];
}

export default function CastGrid({ cast }: CastGridProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { ref, isVisible } = useScrollAnimation();

  if (!cast || cast.length === 0) return null;

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 300);
  };

  return (
    <section ref={ref} className={`scroll-fade-in ${isVisible ? 'visible' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Cast</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-colors ${
              canScrollLeft 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-colors ${
              canScrollRight 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
      >
        {cast.map((person, index) => (
          <div
            key={person.id}
            className="flex-shrink-0 w-32 md:w-40 group"
            style={{ animationDelay: `${index * 50}ms` }}
            onMouseEnter={() => setHoveredId(person.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-netflix-dark mb-2 transition-all duration-300 group-hover:scale-105 group-hover:ring-2 group-hover:ring-primary/50">
              {person.profile_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w300${person.profile_path}`}
                  alt={person.name}
                  fill
                  className="object-cover transition-transform duration-300"
                  sizes="(max-width: 768px) 128px, 160px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-600" />
                </div>
              )}
              
              {/* Hover overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-300 ${
                  hoveredId === person.id ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-semibold text-sm mb-1">{person.name}</p>
                  <p className="text-gray-300 text-xs">{person.character}</p>
                </div>
              </div>
            </div>
            
            {/* Info below image */}
            <div className={`${hoveredId === person.id ? 'hidden md:block' : 'block'}`}>
              <p className="text-white text-sm font-medium truncate">{person.name}</p>
              <p className="text-gray-500 text-xs truncate">{person.character}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
