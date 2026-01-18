'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Loader2, X, ChevronDown, PlayCircle, CheckCircle2, Clock } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useWatchlist } from '@/lib/hooks/useWatchlist';

interface AddToListButtonProps {
  readonly tmdbId: number;
  readonly mediaType: 'movie' | 'tv';
}

export default function AddToListButton({ tmdbId, mediaType }: AddToListButtonProps) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const { isInWatchlist, addItem, removeItem, items, refresh, loading: watchlistLoading } = useWatchlist();
  
  const [operationLoading, setOperationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  const added = isInWatchlist(tmdbId, mediaType);
  const currentItem = items.find(item => item.tmdb_id === tmdbId && item.media_type === mediaType);
  const currentStatus = currentItem?.status || 'plan_to_watch';
  const loading = watchlistLoading || operationLoading;
  
  // Close menu when clicking outside
  useEffect(() => {
    if (!showStatusMenu) return;
    const handleClickOutside = () => setShowStatusMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showStatusMenu]);

  const handleToggle = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (added) {
      // If already in watchlist, show status menu
      setShowStatusMenu(!showStatusMenu);
      return;
    }

    setOperationLoading(true);
    setError(null);

    try {
      const success = await addItem(tmdbId, mediaType);
      if (!success) {
        setError('Failed to add to watchlist');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Watchlist operation error:', err);
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'watching' | 'completed' | 'plan_to_watch') => {
    if (!isSignedIn) return;

    setOperationLoading(true);
    setError(null);
    setShowStatusMenu(false);

    try {
      const response = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: tmdbId,
          media_type: mediaType,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh watchlist to get updated status
      await refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Status update error:', err);
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!isSignedIn) return;

    setOperationLoading(true);
    setError(null);
    setShowStatusMenu(false);

    try {
      const success = await removeItem(tmdbId, mediaType);
      if (!success) {
        setError('Failed to remove from watchlist');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Watchlist operation error:', err);
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    } finally {
      setOperationLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'watching': return 'Watching';
      case 'completed': return 'Completed';
      case 'plan_to_watch': return 'Plan to Watch';
      default: return 'Plan to Watch';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'watching': return <PlayCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'plan_to_watch': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!isLoaded) {
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
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          disabled={loading}
          aria-label={isGuest ? 'Sign in to add to your list' : added ? `Change status: ${getStatusLabel(currentStatus)}` : 'Add to my list'}
          title={isGuest ? 'Sign in to add to your list' : error || undefined}
          className={`flex items-center gap-2 transition-colors ${
            isGuest 
              ? 'text-white/50 hover:text-white/70 cursor-pointer' 
              : error
                ? 'text-red-400 hover:text-red-300'
                : added 
                  ? 'text-green-400 hover:text-white' 
                  : 'text-white/80 hover:text-white'
          }`}
        >
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
            isGuest
              ? 'border-white/20 bg-white/5'
              : error
                ? 'border-red-400 bg-red-400/10'
                : added 
                  ? 'border-green-400 bg-green-400/10' 
                  : 'border-white/40 hover:border-white/60'
          }`}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : error ? (
              <X className="w-4 h-4" />
            ) : added ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </div>
          <span className="text-sm font-medium">
            {isGuest ? 'Sign in to add' : error ? 'Error' : added ? getStatusLabel(currentStatus) : 'My List'}
          </span>
        </button>

        {added && !isGuest && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
            disabled={loading}
            aria-label="Change watchlist status"
            aria-expanded={showStatusMenu}
            aria-haspopup="true"
            className="text-white/60 hover:text-white transition-colors"
            title="Change status"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Status Menu Dropdown */}
      {showStatusMenu && added && !isGuest && (
        <div 
          className="absolute top-full left-0 mt-2 w-48 glass rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in-down border border-white/10"
          role="menu"
          aria-label="Watchlist status options"
        >
          <div className="py-1">
            {['watching', 'completed', 'plan_to_watch'].map((status) => (
              <button
                key={status}
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(status as 'watching' | 'completed' | 'plan_to_watch');
                }}
                aria-label={`Set status to ${getStatusLabel(status)}`}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  currentStatus === status
                    ? 'bg-primary/20 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {getStatusIcon(status)}
                <span className="text-sm font-medium">{getStatusLabel(status)}</span>
                {currentStatus === status && <Check className="w-4 h-4 ml-auto" />}
              </button>
            ))}
            <div className="h-px bg-white/10 my-1" />
            <button
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              aria-label="Remove from watchlist"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Remove from List</span>
            </button>
          </div>
        </div>
      )}
      
      {error && !showStatusMenu && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-red-500/90 text-white text-xs rounded-md whitespace-nowrap z-50 animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
