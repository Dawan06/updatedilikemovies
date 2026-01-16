'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/lib/watchlist-storage';

interface AddToListButtonProps {
  readonly tmdbId: number;
  readonly mediaType: 'movie' | 'tv';
}

export default function AddToListButton({ tmdbId, mediaType }: AddToListButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAdded(isInWatchlist(tmdbId, mediaType));
    setMounted(true);
  }, [tmdbId, mediaType]);

  const handleToggle = () => {
    setLoading(true);
    
    try {
      if (added) {
        removeFromWatchlist(tmdbId, mediaType);
        setAdded(false);
      } else {
        addToWatchlist(tmdbId, mediaType);
        setAdded(true);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <button disabled className="flex items-center gap-2 text-white/50">
        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
        <span className="text-sm font-medium">My List</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 transition-colors ${
        added ? 'text-green-400 hover:text-white' : 'text-white/80 hover:text-white'
      }`}
    >
      <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
        added 
          ? 'border-green-400 bg-green-400/10' 
          : 'border-white/40 hover:border-white/60'
      }`}>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : added ? (
          <Check className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </div>
      <span className="text-sm font-medium">{added ? 'In My List' : 'My List'}</span>
    </button>
  );
}
