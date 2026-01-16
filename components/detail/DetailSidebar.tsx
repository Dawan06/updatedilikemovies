'use client';

import { Share2 } from 'lucide-react';
import QuickStats from './QuickStats';
import AddToListButton from './AddToListButton';

interface DetailSidebarProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  rating?: number;
  runtime?: number;
  year?: string;
  seasons?: number;
  episodes?: number;
  director?: string;
  creator?: string;
  productionCompany?: string;
  network?: string;
}

export default function DetailSidebar({
  tmdbId,
  mediaType,
  rating,
  runtime,
  year,
  seasons,
  episodes,
  director,
  creator,
  productionCompany,
  network,
}: DetailSidebarProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
      {/* Quick Stats */}
      <div className="glass rounded-xl p-6">
        <QuickStats
          rating={rating}
          runtime={runtime}
          year={year}
          mediaType={mediaType}
          seasons={seasons}
          episodes={episodes}
        />
      </div>

      {/* Key Info */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Details
        </h3>
        {director && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Director</p>
            <p className="text-white font-medium">{director}</p>
          </div>
        )}
        {creator && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Creator</p>
            <p className="text-white font-medium">{creator}</p>
          </div>
        )}
        {productionCompany && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {mediaType === 'movie' ? 'Studio' : 'Production'}
            </p>
            <p className="text-white font-medium">{productionCompany}</p>
          </div>
        )}
        {network && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Network</p>
            <p className="text-white font-medium">{network}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Actions
        </h3>
        <AddToListButton tmdbId={tmdbId} mediaType={mediaType} />
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors w-full"
        >
          <div className="w-10 h-10 rounded-full border border-white/40 hover:border-white/60 flex items-center justify-center transition-colors">
            <Share2 className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>
    </aside>
  );
}
