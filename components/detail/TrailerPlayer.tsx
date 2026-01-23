'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, X } from 'lucide-react';

interface TrailerPlayerProps {
  readonly videoKey: string;
  readonly title: string;
  readonly children?: React.ReactNode;
}

export default function TrailerPlayer({ videoKey, title, children }: TrailerPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isPlaying]);

  if (!videoKey) return null;

  const modalContent = isPlaying ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-transparent"
      onClick={() => setIsPlaying(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trailer-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-fade-in" />

      {/* Close button */}
      <button
        onClick={() => setIsPlaying(false)}
        className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
        aria-label="Close trailer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Video container */}
      <div
        className="relative w-full max-w-6xl aspect-video z-10 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
          title={`${title} Trailer`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-xl shadow-2xl border border-white/10"
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      {children ? (
        <div onClick={() => setIsPlaying(true)} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <button
          onClick={() => setIsPlaying(true)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          aria-label="Play trailer"
        >
          <div className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center hover:border-white/60 transition-colors">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
          <span className="text-sm font-medium">Trailer</span>
        </button>
      )}

      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}
