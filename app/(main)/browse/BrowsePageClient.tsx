'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MovieCard from '@/components/movie-card/MovieCard';
import FilterPanel from '@/components/browse/FilterPanel';
import FilterChips from '@/components/browse/FilterChips';
import { Skeleton } from '@/components/ui/skeleton';

interface Genre {
  id: number;
  name: string;
}

interface BrowsePageClientProps {
  movieGenres: Genre[];
  tvGenres: Genre[];
}

interface FilterState {
  genres: number[];
  yearFrom: number | null;
  yearTo: number | null;
  ratingMin: number | null;
  language: string | null;
  mediaType: string;
  sortBy: string;
}

export default function BrowsePageClient({ movieGenres, tvGenres }: BrowsePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse filters from URL
  const getFiltersFromURL = useCallback((): FilterState => {
    return {
      genres: searchParams.get('genres')?.split(',').map(Number).filter(Boolean) || [],
      yearFrom: searchParams.get('year_from') ? parseInt(searchParams.get('year_from')!, 10) : null,
      yearTo: searchParams.get('year_to') ? parseInt(searchParams.get('year_to')!, 10) : null,
      ratingMin: searchParams.get('rating_min') ? parseFloat(searchParams.get('rating_min')!) : null,
      language: searchParams.get('language') || null,
      mediaType: searchParams.get('media_type') || 'movie', // Default to 'movie'
      sortBy: searchParams.get('sort_by') || 'popularity.desc',
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<FilterState>(getFiltersFromURL);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Update URL when filters change
  const updateURL = useCallback((newFilters: FilterState, page: number = 1) => {
    const params = new URLSearchParams();
    
    if (newFilters.genres.length > 0) {
      params.set('genres', newFilters.genres.join(','));
    }
    if (newFilters.yearFrom) {
      params.set('year_from', newFilters.yearFrom.toString());
    }
    if (newFilters.yearTo) {
      params.set('year_to', newFilters.yearTo.toString());
    }
    if (newFilters.ratingMin) {
      params.set('rating_min', newFilters.ratingMin.toString());
    }
    if (newFilters.language) {
      params.set('language', newFilters.language);
    }
    if (newFilters.mediaType !== 'movie') {
      params.set('media_type', newFilters.mediaType);
    }
    if (newFilters.sortBy !== 'popularity.desc') {
      params.set('sort_by', newFilters.sortBy);
    }
    if (page > 1) {
      params.set('page', page.toString());
    }

    const queryString = params.toString();
    router.push(`/browse${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [router]);

  // Fetch results from API
  const fetchResults = useCallback(async (filterState: FilterState, page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      params.set('media_type', filterState.mediaType);
      params.set('page', page.toString());
      params.set('sort_by', filterState.sortBy);
      
      if (filterState.genres.length > 0) {
        params.set('genres', filterState.genres.join(','));
      }
      if (filterState.yearFrom) {
        params.set('year_from', filterState.yearFrom.toString());
      }
      if (filterState.yearTo) {
        params.set('year_to', filterState.yearTo.toString());
      }
      if (filterState.ratingMin) {
        params.set('rating_min', filterState.ratingMin.toString());
      }
      if (filterState.language) {
        params.set('language', filterState.language);
      }

      const response = await fetch(`/api/discover?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data.results || []);
        setTotalResults(data.total_results || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching discover results:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce filter changes - always fetch (default shows movies)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateURL(filters, 1);
      setCurrentPage(1);
      fetchResults(filters, 1);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters, updateURL, fetchResults]);

  // Sync filters and fetch when URL changes - always fetch (default shows movies)
  useEffect(() => {
    const urlFilters = getFiltersFromURL();
    const urlPage = parseInt(searchParams.get('page') || '1', 10);

    // Update state from URL
    setFilters(urlFilters);
    setCurrentPage(urlPage);

    // Always fetch results (default shows popular movies)
    fetchResults(urlFilters, urlPage);
  }, [searchParams, fetchResults, getFiltersFromURL]);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleRemoveFilter = (filterType: string, value?: any) => {
    switch (filterType) {
      case 'genres':
        setFilters((prev) => ({
          ...prev,
          genres: prev.genres.filter((id) => id !== value),
        }));
        break;
      case 'year':
        setFilters((prev) => ({ ...prev, yearFrom: null, yearTo: null }));
        break;
      case 'rating':
        setFilters((prev) => ({ ...prev, ratingMin: null }));
        break;
      case 'language':
        setFilters((prev) => ({ ...prev, language: null }));
        break;
      case 'mediaType':
        setFilters((prev) => ({ ...prev, mediaType: 'movie' }));
        break;
    }
  };

  const handleClearAll = () => {
    const defaultFilters: FilterState = {
      genres: [],
      yearFrom: null,
      yearTo: null,
      ratingMin: null,
      language: null,
      mediaType: 'movie',
      sortBy: 'popularity.desc',
    };
    setFilters(defaultFilters);
    updateURL(defaultFilters, 1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateURL(filters, newPage);
    fetchResults(filters, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Create genre names map
  const genreNamesMap = useMemo(() => {
    const map = new Map<number, string>();
    [...movieGenres, ...tvGenres].forEach((genre) => {
      map.set(genre.id, genre.name);
    });
    return map;
  }, [movieGenres, tvGenres]);

  const hasFiltersActive = 
    filters.genres.length > 0 ||
    filters.yearFrom !== null ||
    filters.yearTo !== null ||
    filters.ratingMin !== null ||
    filters.language !== null ||
    filters.mediaType !== 'movie' ||
    filters.sortBy !== 'popularity.desc';

  return (
    <div className="space-y-6">
      {/* Filter Chips */}
      {hasFiltersActive && (
        <FilterChips
          filters={filters}
          genreNames={genreNamesMap}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAll}
          className="pb-4 border-b border-white/10"
        />
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3]" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No results found</p>
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <>
          {/* Results Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((item, index) => (
              <MovieCard
                key={`${item.media_type || 'movie'}-${item.id}`}
                item={item}
                mediaType={item.media_type || filters.mediaType}
                index={index}
                enableHover={true}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage > 1
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
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

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage < totalPages
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
