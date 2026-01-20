'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Film, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import FranchiseCard from '@/components/franchise/FranchiseCard';
import { FranchiseCard as FranchiseCardType } from '@/types';

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

  // Ensure we have enough data for the current page
  const ensureDataForPage = useCallback(async (targetPage: number) => {
    // If searching, we rely on what we have (or filtered search results)
    // Complex search pagination is tricky with client-side filter + server fetch
    // For simplicity, search only filters loaded items for now as per previous design
    if (searchQuery) return;

    const requiredCount = targetPage * ITEMS_PER_PAGE;

    // If we have enough items, or no more data to fetch, stop
    if (allFranchises.length >= requiredCount || !hasMoreApiData) {
      return;
    }

    setIsLoading(true);

    try {
      let currentBuffer = [...allFranchises];
      let nextApiPage = apiPageToFetch;
      let canFetchMore: boolean = hasMoreApiData;

      // Keep fetching API pages until we fill the buffer or run out
      while (currentBuffer.length < requiredCount && canFetchMore) {
        const res = await fetch(`/api/franchises?page=${nextApiPage}`);
        if (!res.ok) break;

        const data = await res.json();
        const newFranchises: FranchiseCardType[] = data.franchises;

        // Filter unique
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

  // Whenever page changes, ensure we have data
  useEffect(() => {
    ensureDataForPage(currentPage);
  }, [currentPage, ensureDataForPage]);


  // -- Render Logic --

  // 1. Filter full buffer if searching
  const filteredBuffer = useMemo(() => {
    if (!searchQuery.trim()) return allFranchises;
    const q = searchQuery.toLowerCase();
    return allFranchises.filter(f =>
      f.collection.name.toLowerCase().includes(q) ||
      f.collection.overview?.toLowerCase().includes(q)
    );
  }, [allFranchises, searchQuery]);

  // 2. Slice for current page
  // If searching, we just show all results or implement search pagination (showing all for simplicity/UX)
  // If not searching, we do strict pagination
  const currentItems = useMemo(() => {
    if (searchQuery) return filteredBuffer; // Show all matches (or could paginated search matches)

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredBuffer.slice(start, end);
  }, [filteredBuffer, currentPage, searchQuery]);

  // 3. Determine if there is a next page
  const hasNextPage = useMemo(() => {
    if (searchQuery) return false; // Search shows all on one page

    // If we have more items in buffer than shown OR we can fetch more from API
    const shownCount = currentPage * ITEMS_PER_PAGE;
    return allFranchises.length > shownCount || hasMoreApiData;
  }, [searchQuery, currentPage, allFranchises.length, hasMoreApiData]);


  // Handle Handlers
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

  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-netflix-black">
      <div className="px-4 md:px-12 py-8 md:py-12">
        {/* Page Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl md:text-6xl text-white mb-3 tracking-wide">
                FRANCHISES
              </h1>
              <p className="text-gray-400 text-lg">
                Explore complete movie universes and collections
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search discovered franchises..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-gray-400">
            <Film className="w-5 h-5" />
            <span>
              {searchQuery
                ? `${filteredBuffer.length} result${filteredBuffer.length !== 1 ? 's' : ''}`
                : `Page ${currentPage} (${currentItems.length} items)`
              }
            </span>
          </div>
        </div>

        {/* Loading State Overlay (only when strictly waiting for data to fill page) */}
        {isLoading && currentItems.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        )}

        {/* Franchises Grid */}
        {currentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map((franchise, index) => (
              <div
                key={franchise.collection.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
              >
                <FranchiseCard
                  franchise={franchise}
                  priority={index < 6}
                />
              </div>
            ))}
          </div>
        ) : !isLoading && (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <Film className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg mb-2">
              {searchQuery ? 'No franchises match your search' : 'No franchises found'}
            </p>
          </div>
        )}

        {/* Pagination Controls (Hidden during search) */}
        {!searchQuery && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              onClick={handlePrev}
              disabled={currentPage <= 1 || isLoading}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
                ${currentPage <= 1 || isLoading
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-primary hover:text-white hover:scale-105 active:scale-95'
                }
              `}
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 border border-white/10 font-mono">
                Page {currentPage}
              </span>
            </div>

            <button
              onClick={handleNext}
              disabled={!hasNextPage || isLoading}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
                ${!hasNextPage || isLoading
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-primary hover:text-white hover:scale-105 active:scale-95'
                }
              `}
            >
              {isLoading && currentItems.length > 0 && <Loader2 className="w-4 h-4 animate-spin" />}
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
