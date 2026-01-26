'use client';

import { useEffect, useRef, useState } from 'react';
import { Bookmark, BookmarkCheck, PlayCircle, CheckCircle2, Clock, Share2, ExternalLink } from 'lucide-react';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/contexts/ToastContext';

interface MovieCardContextMenuProps {
  item: {
    id: number;
    title?: string;
    name?: string;
    media_type: 'movie' | 'tv';
  };
  position: { x: number; y: number };
  onClose: () => void;
}

export default function MovieCardContextMenu({ item, position, onClose }: MovieCardContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useUser();
  const router = useRouter();
  const toast = useToast();
  const { isInWatchlist, addItem, removeItem, items } = useWatchlist();

  const type = item.media_type;
  const title = item.title || item.name || '';
  const isBookmarked = isInWatchlist(item.id, type);
  const currentItem = items.find(i => i.tmdb_id === item.id && i.media_type === type);
  const currentStatus = currentItem?.status || 'plan_to_watch';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleBookmark = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      onClose();
      return;
    }

    try {
      if (isBookmarked) {
        await removeItem(item.id, type);
        toast.showSuccess(`${title} removed from watchlist`);
      } else {
        await addItem(item.id, type);
        toast.showSuccess(`${title} added to watchlist`);
      }
      onClose();
    } catch (error) {
      toast.showError(`Failed to ${isBookmarked ? 'remove from' : 'add to'} watchlist`);
    }
  };

  const handleStatusChange = async (status: 'watching' | 'completed' | 'plan_to_watch') => {
    if (!isSignedIn) return;

    try {
      const response = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: item.id,
          media_type: type,
          status: status,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const statusLabels = {
        watching: 'Watching',
        completed: 'Completed',
        plan_to_watch: 'Plan to Watch',
      };

      toast.showSuccess(`Marked as ${statusLabels[status]}`);
      onClose();
    } catch (error) {
      toast.showError('Failed to update status');
    }
  };

  const handleViewDetails = () => {
    router.push(`/${type}/${item.id}`);
    onClose();
  };

  const menuItems = [
    {
      icon: isBookmarked ? BookmarkCheck : Bookmark,
      label: isBookmarked ? 'Remove from Watchlist' : 'Add to Watchlist',
      onClick: handleBookmark,
      active: isBookmarked,
    },
    {
      icon: PlayCircle,
      label: 'Mark as Watching',
      onClick: () => handleStatusChange('watching'),
      active: currentStatus === 'watching',
      divider: true,
    },
    {
      icon: CheckCircle2,
      label: 'Mark as Completed',
      onClick: () => handleStatusChange('completed'),
      active: currentStatus === 'completed',
    },
    {
      icon: Clock,
      label: 'Plan to Watch',
      onClick: () => handleStatusChange('plan_to_watch'),
      active: currentStatus === 'plan_to_watch',
      divider: true,
    },
    {
      icon: Share2,
      label: 'Share',
      onClick: async () => {
        const url = `${window.location.origin}/${type}/${item.id}`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: title,
              url: url,
            });
            toast.showSuccess('Link shared successfully');
            onClose();
          } catch (error) {
            if ((error as Error).name !== 'AbortError') {
              toast.showError('Failed to share');
            }
          }
        } else {
          try {
            await navigator.clipboard.writeText(url);
            toast.showSuccess('Link copied to clipboard');
            onClose();
          } catch (error) {
            toast.showError('Failed to copy link');
          }
        }
      },
    },
    {
      icon: ExternalLink,
      label: 'View Details',
      onClick: handleViewDetails,
    },
  ];

  // Adjust position to keep menu in viewport
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      // Adjust horizontal position
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      if (x < 10) {
        x = 10;
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }
      if (y < 10) {
        y = 10;
      }

      setAdjustedPosition({ x, y });
    }
  }, [position]);

  return (
    <>
      <div
        ref={menuRef}
        className="fixed glass rounded-xl border border-white/10 shadow-2xl overflow-hidden z-[9999] min-w-[200px] animate-fade-in-up"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
        }}
        role="menu"
        aria-label="Context menu"
      >
        <div className="py-2">
          {menuItems.map((menuItem, index) => {
            const Icon = menuItem.icon;
            return (
              <div key={index}>
                {menuItem.divider && index > 0 && (
                  <div className="h-px bg-white/10 my-1" />
                )}
                <button
                  onClick={menuItem.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    menuItem.active
                      ? 'bg-primary/20 text-primary'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  <Icon className={`w-4 h-4 ${menuItem.active ? 'text-primary' : ''}`} />
                  <span className="text-sm font-medium">{menuItem.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
