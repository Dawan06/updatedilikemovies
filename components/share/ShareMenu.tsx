'use client';

import { useState } from 'react';
import { Share2, Copy, Twitter, Facebook, X, Check } from 'lucide-react';
import { useToast } from '@/lib/contexts/ToastContext';

interface ShareMenuProps {
  url: string;
  title: string;
  description?: string;
  mediaType?: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
  onClose?: () => void;
}

export default function ShareMenu({ url, title, description, mediaType, seasonNumber, episodeNumber, onClose: externalOnClose }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(externalOnClose ? true : false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleClose = () => {
    setIsOpen(false);
    setCopied(false);
    externalOnClose?.();
  };

  const shareText = mediaType === 'tv' && seasonNumber && episodeNumber
    ? `Check out ${title} S${seasonNumber}E${episodeNumber}`
    : `Check out ${title}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.showSuccess('Link copied!');
      setTimeout(() => {
        setCopied(false);
        handleClose();
      }, 1500);
    } catch (error) {
      toast.showError('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: description || shareText,
          url: url,
        });
        handleClose();
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.showError('Failed to share');
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSocialShare = (platform: 'twitter' | 'facebook') => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(shareText);
    
    let shareUrl = '';
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      handleClose();
    }
  };

  return (
    <>
      {!externalOnClose && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors w-full"
          aria-label="Share"
        >
          <div className="w-10 h-10 rounded-full border border-white/40 hover:border-white/60 flex items-center justify-center transition-colors">
            <Share2 className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Share</span>
        </button>
      )}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-lg animate-fade-in"
            onClick={handleClose}
          />

          {/* Share Menu */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-white/10 pointer-events-auto animate-fade-in-up relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Share</h3>
                    <p className="text-sm text-gray-400">Share this {mediaType === 'tv' ? 'show' : 'movie'}</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Share Options */}
                <div className="space-y-4">
                  {/* Native Share - Primary Action */}
                  {(typeof navigator !== 'undefined' && 'share' in navigator) && (
                    <button
                      onClick={handleShare}
                      className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 border border-primary/30 hover:border-primary/50 transition-all duration-300 p-5 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Share2 className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold text-base mb-1">Share via...</div>
                          <div className="text-xs text-gray-400">Use your device's share menu</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Copy Link - Secondary Action */}
                  <button
                    onClick={handleCopyLink}
                    className={`w-full group relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 text-left ${
                      copied
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                        copied ? 'bg-green-500/20' : 'bg-blue-500/20'
                      }`}>
                        {copied ? (
                          <Check className="w-6 h-6 text-green-400" />
                        ) : (
                          <Copy className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-base mb-1 ${
                          copied ? 'text-green-400' : 'text-white'
                        }`}>
                          {copied ? 'Copied!' : 'Copy Link'}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{url}</div>
                      </div>
                    </div>
                  </button>

                  {/* Social Media Section */}
                  <div className="pt-6 border-t border-white/10">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      Share on Social Media
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleSocialShare('twitter')}
                        className="group flex flex-col items-center gap-3 px-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all hover:scale-105"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#1DA1F2]/20 flex items-center justify-center group-hover:bg-[#1DA1F2]/30 transition-colors">
                          <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                        </div>
                        <span className="text-white font-medium text-sm">Twitter</span>
                      </button>
                      <button
                        onClick={() => handleSocialShare('facebook')}
                        className="group flex flex-col items-center gap-3 px-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all hover:scale-105"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#1877F2]/20 flex items-center justify-center group-hover:bg-[#1877F2]/30 transition-colors">
                          <Facebook className="w-5 h-5 text-[#1877F2]" />
                        </div>
                        <span className="text-white font-medium text-sm">Facebook</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
