'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageItem {
  file_path: string;
  width: number;
  height: number;
}

interface PhotoGalleryProps {
  readonly backdrops: ImageItem[];
  readonly posters: ImageItem[];
  readonly title: string;
}

export default function PhotoGallery({ backdrops, posters, title }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Use backdrops primarily, limit to 10
  const images = backdrops.slice(0, 10);
  
  if (images.length === 0) return null;

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

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goTo = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, currentIndex, images.length]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Photos</h2>
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

      {/* Scrollable Gallery */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
      >
        {images.map((img, index) => (
          <button
            key={img.file_path}
            onClick={() => openLightbox(index)}
            className="flex-shrink-0 relative aspect-video w-64 md:w-80 rounded-lg overflow-hidden group"
          >
            <Image
              src={`https://image.tmdb.org/t/p/w780${img.file_path}`}
              alt={`${title} photo ${index + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 256px, 320px"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); goTo('prev'); }}
            className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={`https://image.tmdb.org/t/p/original${images[currentIndex].file_path}`}
              alt={`${title} photo`}
              width={images[currentIndex].width}
              height={images[currentIndex].height}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); goTo('next'); }}
            className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </section>
  );
}
