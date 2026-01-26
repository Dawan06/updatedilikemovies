'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Users, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation';
import { createProgressiveImageProps } from '@/lib/progressive-image-loader';

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
  const [fullQualityReady, setFullQualityReady] = useState<Record<number, boolean>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
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
        <div className="flex items-center gap-3 flex-1">
          <div className="w-1 h-8 bg-primary rounded-full" />
          <h2 className="text-2xl font-bold text-white">Cast</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
          <span className="text-sm text-gray-400">{cast.length} cast members</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`hidden md:flex p-2 rounded-full transition-all duration-200 ${
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
            className={`hidden md:flex p-2 rounded-full transition-all duration-200 ${
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
        className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {cast.map((person, index) => {
          const progressiveProps = createProgressiveImageProps(person.profile_path, 'w300');
          const isHovered = hoveredId === person.id;
          
          return (
            <div
              key={person.id}
              className="flex-shrink-0 w-32 md:w-40 group"
              style={{ 
                animationDelay: `${index * 50}ms`,
                scrollSnapAlign: 'start'
              }}
              onMouseEnter={() => setHoveredId(person.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Card Container */}
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-netflix-dark to-netflix-black border border-white/10 group-hover:border-primary/50 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-primary/20">
                {person.profile_path ? (
                  <Image
                    src={fullQualityReady[person.id] ? progressiveProps.fullSrc : progressiveProps.placeholderSrc}
                    alt={person.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 128px, 160px"
                    quality={fullQualityReady[person.id] ? 85 : 30}
                    onLoad={() => {
                      if (!fullQualityReady[person.id] && progressiveProps.fullSrc) {
                        const preloadImg = document.createElement('img');
                        preloadImg.onload = () => {
                          setFullQualityReady(prev => ({ ...prev, [person.id]: true }));
                        };
                        preloadImg.src = progressiveProps.fullSrc;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-netflix-dark to-netflix-black">
                    <Users className="w-12 h-12 text-gray-700" />
                  </div>
                )}

                {/* Gradient Overlay - Always visible */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

                {/* Name - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <p className="text-white font-bold text-sm truncate drop-shadow-lg">{person.name}</p>
                  </div>
                  <p className="text-gray-300 text-xs truncate opacity-90">{person.character}</p>
                </div>

                {/* Hover Glow Effect */}
                {isHovered && (
                  <div className="absolute inset-0 bg-primary/10 pointer-events-none animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
