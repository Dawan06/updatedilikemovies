'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { preloadImages, getTMDBImageUrl } from '@/lib/image-preloader';

interface ContentCarouselProps {
  readonly title: string;
  readonly seeAllHref?: string;
  readonly children: React.ReactNode;
  readonly preloadPaths?: (string | null)[];
}

export default function ContentCarousel({ title, seeAllHref, children, preloadPaths = [] }: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Preload images on initial render
  useEffect(() => {
    if (preloadPaths.length > 0) {
      const urls = preloadPaths
        .filter((path): path is string => !!path)
        .map((path) => getTMDBImageUrl(path, 'w300'));
      preloadImages(urls).catch(() => {
        // Silently fail - this is just a performance optimization
      });
    }
  }, [preloadPaths]);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Simple throttle to avoid running checkScroll too often on main thread
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    checkScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    globalThis.addEventListener('resize', onScroll);

    return () => {
      el.removeEventListener('scroll', onScroll);
      globalThis.removeEventListener('resize', onScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section
      className="relative group/section mb-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-4 md:px-12">
        <div className="flex items-center gap-3 group/title">
          <h2 className="text-lg md:text-xl font-semibold text-white">
            {title}
          </h2>
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="flex items-center text-sm text-primary opacity-0 group-hover/title:opacity-100 transition-opacity duration-300"
            >
              <span>Explore All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow - Netflix style: gradient fade with centered icon */}
        <div
          className={`absolute left-0 top-0 bottom-4 w-12 md:w-14 z-30 flex items-center justify-center transition-opacity duration-300 ${canScrollLeft && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
          <button
            onClick={() => scroll('left')}
            className="relative z-10 w-full h-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
          </button>
        </div>

        {/* Scrollable Content - Fixed height to prevent CLS */}
        <div
          ref={scrollRef}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-12 pb-4"
          style={{ scrollSnapType: 'x mandatory', minHeight: '320px' }}
        >
          {children}
        </div>

        {/* Right Arrow - Netflix style: gradient fade with centered icon */}
        <div
          className={`absolute right-0 top-0 bottom-4 w-12 md:w-14 z-30 flex items-center justify-center transition-opacity duration-300 ${canScrollRight && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
          <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/60 to-transparent" />
          <button
            onClick={() => scroll('right')}
            className="relative z-10 w-full h-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
          </button>
        </div>
      </div>
    </section>
  );
}
