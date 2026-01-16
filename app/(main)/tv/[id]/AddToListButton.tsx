'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/lib/watchlist-storage';

interface AddToListButtonProps {
  readonly tmdbId: number;
  readonly mediaType: 'movie' | 'tv';
}

export default function AddToListButton({ tmdbId, mediaType }: AddToListButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      setAdded(isInWatchlist(tmdbId, mediaType));
    }
    setMounted(true);
  }, [tmdbId, mediaType, isSignedIn]);

  const handleToggle = () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

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

  const isGuest = !isSignedIn;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={isGuest ? 'Sign in to add to your list' : undefined}
      className={`flex items-center gap-2 transition-colors ${
        isGuest 
          ? 'text-white/50 hover:text-white/70 cursor-pointer' 
          : added 
            ? 'text-green-400 hover:text-white' 
            : 'text-white/80 hover:text-white'
      }`}
    >
      <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
        isGuest
          ? 'border-white/20 bg-white/5'
          : added 
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
      <span className="text-sm font-medium">
        {isGuest ? 'Sign in to add' : added ? 'In My List' : 'My List'}
      </span>
    </button>
  );
}
