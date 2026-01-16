'use client';

import { useState, useEffect } from 'react';
import { getWatchlist } from '@/lib/watchlist-storage';
import FranchiseHero from '@/components/franchise/FranchiseHero';
import FranchiseGrid from '@/components/franchise/FranchiseGrid';
import { FranchiseCard } from '@/types';
import { Loader2 } from 'lucide-react';

export default function FranchisePage() {
  const [userFranchises, setUserFranchises] = useState<FranchiseCard[]>([]);
  const [popularFranchises, setPopularFranchises] = useState<FranchiseCard[]>([]);
  const [allFranchises, setAllFranchises] = useState<FranchiseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFranchises() {
      try {
        setLoading(true);
        const watchlist = getWatchlist();

        const response = await fetch('/api/franchises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchlist }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch franchises');
        }

        const data = await response.json();
        setUserFranchises(data.userFranchises || []);
        setPopularFranchises(data.popularFranchises || []);
        setAllFranchises(data.allFranchises || []);
      } catch (err) {
        console.error('Error loading franchises:', err);
        setError('Failed to load franchises');
      } finally {
        setLoading(false);
      }
    }

    loadFranchises();
  }, []);

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

  const hasFranchises = allFranchises.length > 0;

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

        {/* Hero Carousel - Show top franchises */}
        {hasFranchises && allFranchises.length > 0 && (
          <div className="mb-12">
            <FranchiseHero franchises={allFranchises} />
          </div>
        )}

        {/* Your Franchises Section */}
        {userFranchises.length > 0 && (
          <FranchiseGrid 
            franchises={userFranchises} 
            title="Your Franchises" 
          />
        )}

        {/* Popular Franchises Section */}
        {popularFranchises.length > 0 && (
          <FranchiseGrid 
            franchises={popularFranchises} 
            title="Popular Franchises" 
          />
        )}

        {/* Empty State */}
        {!hasFranchises && (
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
