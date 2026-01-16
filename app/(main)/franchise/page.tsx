'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getWatchlist } from '@/lib/watchlist-storage';
import FranchiseHero from '@/components/franchise/FranchiseHero';
import FranchiseGrid from '@/components/franchise/FranchiseGrid';
import { FranchiseCard } from '@/types';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FranchisePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  const [franchises, setFranchises] = useState<FranchiseCard[]>([]);
  const [heroFranchises, setHeroFranchises] = useState<FranchiseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    async function loadFranchises() {
      try {
        setLoading(true);
        const watchlist = getWatchlist();

        const response = await fetch('/api/franchises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchlist, page: currentPage }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch franchises');
        }

        const data = await response.json();
        setFranchises(data.franchises || []);
        setPagination(data.pagination || pagination);
        
        // Load hero franchises from first page only
        if (currentPage === 1 && data.allFranchises) {
          setHeroFranchises(data.allFranchises);
        }
      } catch (err) {
        console.error('Error loading franchises:', err);
        setError('Failed to load franchises');
      } finally {
        setLoading(false);
      }
    }

    loadFranchises();
  }, [currentPage]);

  if (loading) {
    return (
      <main className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Loading franchises...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-netflix-black flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-md font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const handlePageChange = (newPage: number) => {
    router.push(`/franchise?page=${newPage}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFranchises = franchises.length > 0 || heroFranchises.length > 0;

  return (
    <main className="min-h-screen bg-netflix-black">
      <div className="px-4 md:px-12 py-8 md:py-12">
        {/* Page Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="font-display text-4xl md:text-6xl text-white mb-2 tracking-wide">
            FRANCHISES
          </h1>
          <p className="text-gray-400 text-lg">
            Explore complete movie universes and collections
          </p>
        </div>

        {/* Hero Carousel - Show top franchises (first page only) */}
        {currentPage === 1 && heroFranchises.length > 0 && (
          <div className="mb-12">
            <FranchiseHero franchises={heroFranchises} />
          </div>
        )}

        {/* Franchises Grid */}
        {hasFranchises ? (
          <>
            <FranchiseGrid 
              franchises={franchises} 
              title={currentPage === 1 ? "All Franchises" : `Franchises - Page ${currentPage}`}
            />

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                    pagination.hasPreviousPage
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-md font-medium transition-colors ${
                          pageNum === currentPage
                            ? 'bg-primary text-white'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <span className="text-gray-400 text-sm">
                  Page {currentPage} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                    pagination.hasNextPage
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">
              No franchises detected yet.
            </p>
            <p className="text-gray-500 text-sm">
              Add movies to your watchlist to automatically discover franchises!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
