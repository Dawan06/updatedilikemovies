'use client';

import { useRef, useState } from 'react';
import { Movie, TVShow } from '@/types';
import MovieCard from '@/components/movie-card/MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SimilarContentProps {
  readonly items: (Movie | TVShow)[];
  readonly recommendations?: (Movie | TVShow)[];
  readonly mediaType: 'movie' | 'tv';
}

export default function SimilarContent({ items, recommendations, mediaType }: SimilarContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Combine similar and recommendations, removing duplicates
  const allItems = [...(recommendations || []), ...items];
  const uniqueItems = allItems.filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id)
  );

  if (!uniqueItems || uniqueItems.length === 0) return null;

  const displayItems = uniqueItems.slice(0, 15);

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
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">More Like This</h2>
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
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
      >
        {displayItems.map((item, index) => (
          <div key={item.id} className="flex-shrink-0 w-[150px] md:w-[180px]">
            <MovieCard
              item={item}
              mediaType={mediaType}
              index={index}
              enableHover={true}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
