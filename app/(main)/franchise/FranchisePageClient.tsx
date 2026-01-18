'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import FranchiseHero from '@/components/franchise/FranchiseHero';
import FranchiseGrid from '@/components/franchise/FranchiseGrid';
import { FranchiseCard } from '@/types';
import { Loader2 } from 'lucide-react';

interface FranchisePageClientProps {
  readonly initialFranchises: FranchiseCard[];
  readonly initialHeroFranchises: FranchiseCard[];
  readonly initialTotalCount: number;
  readonly initialHasMore: boolean;
}

export default function FranchisePageClient({
  initialFranchises,
  initialHeroFranchises,
  initialTotalCount,
  initialHasMore,
}: FranchisePageClientProps) {
  const { items: watchlistItems } = useWatchlist();
  
  const [franchises, setFranchises] = useState<FranchiseCard[]>(initialFranchises);
  const [heroFranchises, setHeroFranchises] = useState<FranchiseCard[]>(initialHeroFranchises);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const itemsPerPage = 20;
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadFranchises = useCallback(async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      }
      
      // Convert WatchlistItem to format expected by franchises API
      const watchlist = watchlistItems.map(item => ({
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
      }));

      const response = await fetch('/api/franchises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          watchlist, 
          page, 
          itemsPerPage,
          includeAll: true, // Enable progressive discovery of all franchises
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch franchises');
      }

      const data = await response.json();
      const newFranchises = data.franchises || [];
      
      if (append) {
        setFranchises(prev => [...prev, ...newFranchises]);
      } else {
        setFranchises(newFranchises);
      }
      
      setHasMore(data.pagination?.hasNextPage || false);
      setTotalCount(data.pagination?.totalCount || 0);
      
      // Load hero franchises from first page only
      if (page === 1 && data.allFranchises) {
        setHeroFranchises(data.allFranchises.slice(0, 10)); // Top 10 for hero
      }
    } catch (err) {
      console.error('Error loading franchises:', err);
      setError('Failed to load franchises');
    } finally {
      setLoadingMore(false);
    }
  }, [watchlistItems]);

  // Pre-fetch page 2 in background after initial load
  useEffect(() => {
    if (hasMore && currentPage === 1) {
      // Pre-fetch next page in background
      const timer = setTimeout(() => {
        loadFranchises(2, false).catch(() => {
          // Silently fail - will load when user scrolls
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasMore, currentPage, loadFranchises]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          loadFranchises(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, currentPage, loadFranchises]);

  if (error) {
    return (
      <main className="min-h-screen bg-netflix-black flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setCurrentPage(1);
              loadFranchises(1, false);
            }}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-md font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const hasFranchises = franchises.length > 0 || heroFranchises.length > 0;

  return (
    <main className="min-h-screen bg-netflix-black">
      <div className="px-4 md:px-12 py-8 md:py-12">
        {/* Page Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="font-display text-4xl md:text-6xl text-white mb-2 tracking-wide">
            ALL FRANCHISES
          </h1>
          <p className="text-gray-400 text-lg">
            Explore complete movie universes and collections
          </p>
          {totalCount > 0 && (
            <p className="text-gray-500 text-sm mt-2">
              {totalCount} franchises available
            </p>
          )}
        </div>

        {/* Hero Carousel - Show top franchises */}
        {heroFranchises.length > 0 && (
          <div className="mb-12">
            <FranchiseHero franchises={heroFranchises} />
          </div>
        )}

        {/* Franchises Grid */}
        {hasFranchises ? (
          <>
            <FranchiseGrid 
              franchises={franchises} 
              title="All Franchises"
            />

            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
              {loadingMore && (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Loading more franchises...</span>
                </div>
              )}
              {!hasMore && franchises.length > 0 && (
                <p className="text-gray-500 text-sm">
                  You've reached the end! {franchises.length} franchises loaded.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">
              No franchises found.
            </p>
            <p className="text-gray-500 text-sm">
              Discovering franchises from TMDB...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
