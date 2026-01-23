'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { createProgressiveImageProps } from '@/lib/progressive-image-loader';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface CastCarouselProps {
  readonly cast: CastMember[];
}

export default function CastCarousel({ cast }: CastCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [fullQualityReady, setFullQualityReady] = useState<Record<number, boolean>>({});

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

  if (!cast || cast.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
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
        {cast.map((person) => {
          const progressiveProps = createProgressiveImageProps(person.profile_path, 'w154');
          return (
            <div key={person.id} className="flex-shrink-0 w-32 group">
              <div className="relative w-32 h-32 mb-2 rounded-lg overflow-hidden bg-netflix-dark">
                {person.profile_path ? (
                  <Image
                    src={fullQualityReady[person.id] ? progressiveProps.fullSrc : progressiveProps.placeholderSrc}
                    alt={person.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="128px"
                    quality={fullQualityReady[person.id] ? 60 : 20}
                    onLoad={() => {
                      if (!fullQualityReady[person.id] && progressiveProps.fullSrc) {
                        // Preload full quality image in background
                        const preloadImg = document.createElement('img');
                        preloadImg.onload = () => {
                          setFullQualityReady(prev => ({ ...prev, [person.id]: true }));
                        };
                        preloadImg.src = progressiveProps.fullSrc;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-12 h-12 text-gray-600" />
                  </div>
                )}
              </div>
              <p className="text-white text-sm font-medium truncate">{person.name}</p>
              <p className="text-gray-500 text-xs truncate">{person.character}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
