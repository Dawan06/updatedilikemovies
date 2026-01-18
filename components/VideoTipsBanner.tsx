'use client';

import { useState, useEffect } from 'react';
import { Info, X, ExternalLink } from 'lucide-react';

interface VideoTipsBannerProps {
  readonly delay?: number;
  readonly storageKey?: string;
  readonly className?: string;
}

export default function VideoTipsBanner({ 
  delay = 3000,
  storageKey = 'videoPlayerTipsDismissed',
  className = ''
}: VideoTipsBannerProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [delay, storageKey]);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem(storageKey, 'true');
  };

  if (!showBanner) return null;

  return (
    <div className={`glass rounded-lg border border-primary/30 p-4 shadow-xl ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">
            <Info className="w-5 h-5 text-primary flex-shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm mb-2">
              For the best viewing experience:
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
              <a
                href="https://chromewebstore.google.com/u/1/detail/faststream-video-player/kkeakohpadmbldjaiggikmnldlfkdfog"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors underline decoration-primary/50 hover:decoration-primary"
              >
                <span>FastStream Video Player</span>
                <ExternalLink className="w-3 h-3" />
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">Faster buffering</span>
              </a>
              <a
                href="https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors underline decoration-primary/50 hover:decoration-primary"
              >
                <span>uBlock Origin</span>
                <ExternalLink className="w-3 h-3" />
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">Block ads</span>
              </a>
              <span className="text-gray-400">or</span>
              <a
                href="https://brave.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors underline decoration-primary/50 hover:decoration-primary"
              >
                <span>Try Brave Browser</span>
                <ExternalLink className="w-3 h-3" />
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">Built-in ad blocker</span>
              </a>
            </div>
          </div>
        </div>
        <button
          onClick={dismissBanner}
          className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
