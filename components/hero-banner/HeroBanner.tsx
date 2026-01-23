'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube';
import { Movie, TVShow } from '@/types';
import { Play, Info, Star, Volume2, VolumeX } from 'lucide-react';
import PrePlayModal from '@/components/PrePlayModal';

interface VideoInfo {
  key: string;
  name: string;
  site: string;
  type: string;
}

interface HeroItem {
  item: Movie | TVShow;
  trailerKey?: string;
}

interface HeroBannerProps {
  readonly items: (Movie | TVShow)[];
  readonly mediaType: 'movie' | 'tv';
  readonly trailers?: Record<number, VideoInfo[]>;
}

export default function HeroBanner({ items, mediaType, trailers = {} }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoReady, setVideoReady] = useState<Record<number, boolean>>({});
  const [showVideo, setShowVideo] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [showPrePlayModal, setShowPrePlayModal] = useState(false);
  const [pendingWatchUrl, setPendingWatchUrl] = useState<string | null>(null);
  const playerRefs = useRef<Record<number, YouTubePlayer>>({});
  const heroRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const slideCount = Math.min(items.length, 5);
  const slides: HeroItem[] = items.slice(0, slideCount).map(item => ({
    item,
    trailerKey: trailers[item.id]?.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))?.key
  }));

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setShowVideo(false);
    setCurrentIndex(index);
    setTimeout(() => {
      setIsTransitioning(false);
      // Show video after transition completes
      setTimeout(() => setShowVideo(true), 500);
    }, 800);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % slideCount);
  }, [currentIndex, slideCount, goToSlide]);

  // Auto-advance every 20 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 20000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  // Use intersection observer and delay to improve LCP
  useEffect(() => {
    // Delay YouTube load until after LCP (first image loads)
    // Increased delay to 3500ms to ensure LCP completes
    const timer = setTimeout(() => {
      setShowVideo(true);
      
      // Use intersection observer to only load video when hero is visible
      if (heroRef.current && typeof IntersectionObserver !== 'undefined') {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setShouldLoadVideo(true);
                if (observerRef.current) {
                  observerRef.current.disconnect();
                  observerRef.current = null;
                }
              }
            });
          },
          {
            rootMargin: '50px',
            threshold: 0.1,
          }
        );
        
        observerRef.current.observe(heroRef.current);
      } else {
        // Fallback: load video if intersection observer not available
        setShouldLoadVideo(true);
      }
    }, 3500);
    
    return () => {
      clearTimeout(timer);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  const onVideoReady = (event: YouTubeEvent, itemId: number) => {
    const player = event.target;
    playerRefs.current[itemId] = player;
    // Start muted
    player.mute();
    player.setVolume(100);
    setVideoReady(prev => ({ ...prev, [itemId]: true }));
  };

  const toggleMute = () => {
    const currentItemId = slides[currentIndex]?.item.id;
    const player = currentItemId ? playerRefs.current[currentItemId] : null;
    
    if (player) {
      try {
        if (isMuted) {
          player.unMute();
          player.setVolume(100);
        } else {
          player.mute();
        }
        setIsMuted(!isMuted);
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    }
  };

  if (!slides.length) return null;

  const currentSlide = slides[currentIndex];
  const currentItem = currentSlide.item;
  const title = (currentItem as Movie).title || (currentItem as TVShow).name || '';
  const overview = currentItem.overview;
  const rating = currentItem.vote_average;
  const year = ((currentItem as Movie).release_date || (currentItem as TVShow).first_air_date || '').slice(0, 4);

  const youtubeOpts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      mute: 1,
      controls: 0,
      showinfo: 0,
      rel: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      loop: 1,
      start: 0,
    },
  };

  return (
    <div ref={heroRef} className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '550px', maxHeight: '900px', height: '85vh' }}>
      {/* Background - All slides */}
      {slides.map((slide, index) => {
        const hasTrailer = slide.trailerKey && showVideo;
        const isCurrentSlide = index === currentIndex;
        const shouldLoad = index === 0 || index === currentIndex; // Only load first and current slide images
        
        return (
          <div
            key={slide.item.id}
            className={`absolute inset-0 transition-opacity duration-800 ${
              isCurrentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Backdrop Image (always present as fallback) */}
            {slide.item.backdrop_path && shouldLoad && (
              <Image
                src={`https://image.tmdb.org/t/p/w1280${slide.item.backdrop_path}`}
                alt={(slide.item as Movie).title || (slide.item as TVShow).name || ''}
                fill
                className={`object-cover transition-opacity duration-500 ${
                  hasTrailer && videoReady[slide.item.id] ? 'opacity-0' : 'opacity-100'
                }`}
                priority={index === 0}
                sizes="100vw"
                quality={70}
                decoding="async"
              />
            )}
            
            {/* YouTube Video Trailer - Lazy load only when slide is active, after delay, and when visible */}
            {slide.trailerKey && isCurrentSlide && showVideo && shouldLoadVideo && (
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="absolute inset-0 scale-150">
                  <YouTube
                    videoId={slide.trailerKey}
                    opts={youtubeOpts}
                    onReady={(e) => onVideoReady(e, slide.item.id)}
                    className="w-full h-full"
                    iframeClassName="w-full h-full pointer-events-none"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Gradient Overlays - Cinematic */}
      <div className="absolute inset-0 bg-gradient-to-r from-netflix-black via-netflix-black/70 to-transparent z-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-netflix-black/40 z-20" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-vignette opacity-50 z-20" />

      {/* Mute/Unmute Button */}
      {currentSlide.trailerKey && showVideo && (
        <button
          onClick={toggleMute}
          className="absolute bottom-32 right-8 z-30 w-12 h-12 rounded-full border border-white/40 bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/50 transition-all duration-300"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      {/* Content */}
      <div className="absolute inset-0 flex items-end z-20">
        <div className="w-full px-4 md:px-12 pb-36 md:pb-40">
          <div className="max-w-2xl">
            {/* Title with cinematic animation */}
            <h1 
              key={currentItem.id}
              className="font-display text-4xl md:text-6xl lg:text-7xl text-white mb-4 tracking-wide drop-shadow-2xl animate-fade-in-up"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
            >
              {title.toUpperCase()}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm animate-fade-in-up animation-delay-100">
              {rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-semibold">{rating.toFixed(1)}</span>
                </div>
              )}
              {year && (
                <span className="text-gray-300">{year}</span>
              )}
              <span className="px-2 py-0.5 bg-primary/20 border border-primary/30 rounded text-primary text-xs font-semibold uppercase">
                {mediaType === 'tv' ? 'Series' : 'Movie'}
              </span>
            </div>

            {/* Overview */}
            {overview && (
              <p className="text-gray-200 text-base md:text-lg max-w-xl leading-relaxed mb-6 line-clamp-3 drop-shadow-lg animate-fade-in-up animation-delay-200">
                {overview}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 animate-fade-in-up animation-delay-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const watchUrl = `/watch/${mediaType}/${currentItem.id}`;
                  const dismissed = localStorage.getItem('prePlayTipsDismissed');
                  if (dismissed) {
                    window.location.href = watchUrl;
                  } else {
                    setPendingWatchUrl(watchUrl);
                    setShowPrePlayModal(true);
                  }
                }}
                className="group flex items-center gap-2 bg-white text-black px-6 md:px-8 py-3 rounded-md font-semibold text-lg hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Play className="w-6 h-6 fill-black" />
                <span>Play</span>
              </button>
              <Link 
                href={`/${mediaType}/${currentItem.id}`}
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
        {slides.map((_, index) => (
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

      {/* Pre-Play Modal */}
      {pendingWatchUrl && (
        <PrePlayModal
          isOpen={showPrePlayModal}
          onClose={() => setShowPrePlayModal(false)}
          watchUrl={pendingWatchUrl}
          title={title}
        />
      )}
    </div>
  );
}
