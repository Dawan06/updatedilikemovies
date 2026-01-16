'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Check, Loader2 } from 'lucide-react';

interface WatchlistButtonProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  isInWatchlist: boolean;
  currentStatus: 'watching' | 'completed' | 'plan_to_watch';
}

export default function WatchlistButton({
  tmdbId,
  mediaType,
  isInWatchlist,
  currentStatus,
}: WatchlistButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist);

  const handleClick = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/watchlist', {
        method: inWatchlist ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tmdb_id: tmdbId,
          media_type: mediaType,
        }),
      });

      if (response.ok) {
        setInWatchlist(!inWatchlist);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const isGuest = !isSignedIn;

  return (
    <Button
      variant={inWatchlist ? 'default' : 'outline'}
      size="lg"
      onClick={handleClick}
      disabled={loading}
      title={isGuest ? 'Sign in to add to your watchlist' : undefined}
      className="flex items-center space-x-2"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : inWatchlist ? (
        <>
          <Check className="w-5 h-5" />
          <span>In Watchlist</span>
        </>
      ) : (
        <>
          <Plus className="w-5 h-5" />
          <span>{isGuest ? 'Sign in to Add' : 'Add to Watchlist'}</span>
        </>
      )}
    </Button>
  );
}
