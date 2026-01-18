'use client';

import { useState } from 'react';
import { X, ExternalLink, Play, Zap, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PrePlayModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly watchUrl: string;
  readonly title?: string;
}

export default function PrePlayModal({ isOpen, onClose, watchUrl, title }: PrePlayModalProps) {
  const [neverShowAgain, setNeverShowAgain] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleContinue = () => {
    if (neverShowAgain) {
      localStorage.setItem('prePlayTipsDismissed', 'true');
    }
    // Preload the player by navigating
    router.push(watchUrl);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-netflix-dark rounded-lg border border-white/10 shadow-2xl max-w-2xl w-full animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            For a Better Viewing Experience
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300 text-sm">
            If you want a better experience, we recommend using these tools:
          </p>

          <div className="space-y-3">
            {/* FastStream */}
            <a
              href="https://chromewebstore.google.com/u/1/detail/faststream-video-player/kkeakohpadmbldjaiggikmnldlfkdfog"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-lg transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium mb-1">
                  FastStream Video Player
                </h3>
                <p className="text-gray-400 text-xs">
                  Faster buffering and smoother playback
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
            </a>

            {/* uBlock Origin */}
            <a
              href="https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-lg transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium mb-1">
                  uBlock Origin
                </h3>
                <p className="text-gray-400 text-xs">
                  Block ads for a cleaner experience
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
            </a>

            {/* Brave Browser */}
            <a
              href="https://brave.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-lg transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium mb-1">
                  Brave Browser
                </h3>
                <p className="text-gray-400 text-xs">
                  Browser with built-in ad blocking
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={neverShowAgain}
              onChange={(e) => setNeverShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-netflix-dark cursor-pointer"
            />
            <span className="text-gray-300 text-xs group-hover:text-white transition-colors">
              Don&apos;t show this again
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={handleContinue}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              Continue
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 glass text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
