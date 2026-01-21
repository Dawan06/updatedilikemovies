'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Film, X, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import FranchiseCard from '@/components/franchise/FranchiseCard';
import { FranchiseCard as FranchiseCardType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface FranchisePageClientProps {
  readonly franchises: FranchiseCardType[];
}

export default function FranchisePageClient({ franchises: initialFranchises }: FranchisePageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  // We keep a buffer of ALL fetched franchises
  const [allFranchises, setAllFranchises] = useState<FranchiseCardType[]>(initialFranchises);

  // Validation state
  const [isLoading, setIsLoading] = useState(false);
  const [apiPageToFetch, setApiPageToFetch] = useState(2); // Next API page to fetch (starts at 2)
  const [hasMoreApiData, setHasMoreApiData] = useState(true);

  // URL State
  const searchQuery = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const ITEMS_PER_PAGE = 20;

  // -- Helpers --

  // Update URL helper
  const updateUrl = useCallback((newPage: number, newQuery: string) => {
    const params = new URLSearchParams(searchParams);
    if (newQuery) {
      params.set('q', newQuery);
      // Reset to page 1 on search change
      if (newQuery !== searchQuery) {
        params.set('page', '1');
      } else {
        params.set('page', newPage.toString());
      }
    } else {
      params.delete('q');
      params.set('page', newPage.toString());
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  }, [pathname, router, searchParams, searchQuery]);

  // -- Data Fetching --
  const ensureDataForPage = useCallback(async (targetPage: number) => {
    if (searchQuery) return; // Search logic is handled entirely by filtering current buffer for simplicity in this demo

    const requiredCount = targetPage * ITEMS_PER_PAGE;

    if (allFranchises.length >= requiredCount || !hasMoreApiData) {
      return;
    }

    setIsLoading(true);

    try {
      let currentBuffer = [...allFranchises];
      let nextApiPage = apiPageToFetch;
      let canFetchMore: boolean = hasMoreApiData;

      while (currentBuffer.length < requiredCount && canFetchMore) {
        const res = await fetch(`/api/franchises?page=${nextApiPage}`);
        if (!res.ok) break;

        const data = await res.json();
        const newFranchises: FranchiseCardType[] = data.franchises;

        const existingIds = new Set(currentBuffer.map(f => f.collection.id));
        const uniqueNew = newFranchises.filter(f => !existingIds.has(f.collection.id));

        currentBuffer = [...currentBuffer, ...uniqueNew];
        nextApiPage++;

        if (!data.hasMore || newFranchises.length === 0) {
          canFetchMore = false;
        }
      }

      setAllFranchises(currentBuffer);
      setApiPageToFetch(nextApiPage);
      setHasMoreApiData(canFetchMore);

    } catch (error) {
      console.error('Error buffering franchises:', error);
    } finally {
      setIsLoading(false);
    }
  }, [allFranchises, apiPageToFetch, hasMoreApiData, searchQuery]);

  // -- Effects --
  useEffect(() => {
    ensureDataForPage(currentPage);
  }, [currentPage, ensureDataForPage]);


  // -- Render Logic --
  const filteredBuffer = useMemo(() => {
    if (!searchQuery.trim()) return allFranchises;
    const q = searchQuery.toLowerCase();
    return allFranchises.filter(f =>
      f.collection.name.toLowerCase().includes(q) ||
      f.collection.overview?.toLowerCase().includes(q)
    );
  }, [allFranchises, searchQuery]);

  const currentItems = useMemo(() => {
    if (searchQuery) return filteredBuffer;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredBuffer.slice(start, end);
  }, [filteredBuffer, currentPage, searchQuery]);

  const hasNextPage = useMemo(() => {
    if (searchQuery) return false;
    const shownCount = currentPage * ITEMS_PER_PAGE;
    return allFranchises.length > shownCount || hasMoreApiData;
  }, [searchQuery, currentPage, allFranchises.length, hasMoreApiData]);


  // Handlers
  const handleNext = () => {
    if (!hasNextPage || isLoading) return;
    updateUrl(currentPage + 1, searchQuery);
  };

  const handlePrev = () => {
    if (currentPage <= 1 || isLoading) return;
    updateUrl(currentPage - 1, searchQuery);
  };

  const handleSearch = (q: string) => {
    updateUrl(1, q);
  };

  const clearSearch = () => {
    updateUrl(1, '');
  };

  // Featured Franchise for Hero (Use the first one or a random popular one)
  const heroFranchise = useMemo(() => {
    return allFranchises.length > 0 ? allFranchises[0] : null;
  }, [allFranchises]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-netflix-black pb-20">

      {/* Cinematic Hero Section */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        {heroFranchise?.collection.backdrop_path && (
          <>
            <Image
              src={`https://image.tmdb.org/t/p/original${heroFranchise.collection.backdrop_path}`}
              alt="Hero Background"
              fill
              className="object-cover opacity-50 contrast-125"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-netflix-black/80 via-transparent to-netflix-black/80" />
            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(20,20,20,0.8)_100%)]" />
          </>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <span className="text-yellow-500 font-bold tracking-wider text-sm uppercase">Cinematic Universes</span>
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white tracking-widest drop-shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
              FRANCHISES
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mt-4 font-light text-balance leading-relaxed">
              Dive deep into complete movie collections and explore your favorite sagas from start to finish.
            </p>
          </motion.div>

          {/* Floating Glass Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-2xl relative group"
          >
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-4 shadow-2xl transition-all hover:bg-white/15 hover:border-white/30">
              <Search className="w-6 h-6 text-gray-300 mr-4" />
              <input
                type="text"
                placeholder="Search for a saga like 'Star Wars', 'Marvel', 'Potter'..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 bg-transparent border-none text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-0"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-1 text-gray-400 hover:text-white transition-colors bg-white/10 rounded-full hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-4 md:px-12 -mt-20 relative z-20">
        {/* Results Info Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" />
            {searchQuery ? 'Search Results' : 'Explore Collections'}
          </h2>
          <div className="text-sm font-medium text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/5">
            {searchQuery
              ? `${filteredBuffer.length} collection${filteredBuffer.length !== 1 ? 's' : ''}`
              : `Page ${currentPage} of ${Math.ceil(allFranchises.length / ITEMS_PER_PAGE)}+`
            }
          </div>
        </div>

        {/* Loading State Overlay */}
        {isLoading && currentItems.length === 0 && (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
          </div>
        )}

        {/* Franchises Grid */}
        {currentItems.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8"
          >
            <AnimatePresence mode='popLayout'>
              {currentItems.map((franchise, index) => (
                <motion.div
                  key={franchise.collection.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.4,
                    delay: Math.min(index * 0.05, 0.4),
                    ease: [0.25, 0.4, 0.25, 1]
                  }}
                >
                  <FranchiseCard
                    franchise={franchise}
                    priority={index < 3}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 bg-white/5 rounded-3xl border border-white/5"
          >
            <Film className="w-20 h-20 mx-auto mb-6 text-gray-700" />
            <h3 className="text-xl font-bold text-white mb-2">No collections found</h3>
            <p className="text-gray-400 text-lg">
              We couldn't find any franchises matching "{searchQuery}"
            </p>
            <button
              onClick={clearSearch}
              className="mt-6 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-full font-semibold transition-colors"
            >
              Clear Search
            </button>
          </motion.div>
        )}

        {/* Pagination Controls */}
        {!searchQuery && (
          <div className="flex items-center justify-center gap-4 mt-20">
            <button
              onClick={handlePrev}
              disabled={currentPage <= 1 || isLoading}
              className={`
                group flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all
                ${currentPage <= 1 || isLoading
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-transparent'
                  : 'bg-transparent text-white border border-white/20 hover:border-primary hover:text-primary hover:bg-primary/5'
                }
              `}
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!hasNextPage || isLoading}
              className={`
                group flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all
                ${!hasNextPage || isLoading
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-transparent'
                  : 'bg-white text-black hover:bg-primary hover:text-white hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(229,9,20,0.4)]'
                }
              `}
            >
              {isLoading && currentItems.length > 0 ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Next Page
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
