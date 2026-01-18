'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import FilterPanel from '@/components/browse/FilterPanel';
import BrowsePageClient from './BrowsePageClient';

interface Genre {
  id: number;
  name: string;
}

interface DiscoverClientProps {
  movieGenres: Genre[];
  tvGenres: Genre[];
}

export default function DiscoverClient({ movieGenres, tvGenres }: DiscoverClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const getFiltersFromURL = useCallback(() => {
    return {
      genres: searchParams.get('genres')?.split(',').map(Number).filter(Boolean) || [],
      yearFrom: searchParams.get('year_from') ? parseInt(searchParams.get('year_from')!, 10) : null,
      yearTo: searchParams.get('year_to') ? parseInt(searchParams.get('year_to')!, 10) : null,
      ratingMin: searchParams.get('rating_min') ? parseFloat(searchParams.get('rating_min')!) : null,
      language: searchParams.get('language') || null,
      mediaType: searchParams.get('media_type') || 'movie', // Default to 'movie' instead of 'all'
      sortBy: searchParams.get('sort_by') || 'popularity.desc',
    };
  }, [searchParams]);

  const [filters, setFilters] = useState(getFiltersFromURL);

  // Show filters panel if any filters are active in URL
  useEffect(() => {
    const urlFilters = getFiltersFromURL();
    const hasFilters = 
      urlFilters.genres.length > 0 ||
      urlFilters.yearFrom !== null ||
      urlFilters.yearTo !== null ||
      urlFilters.ratingMin !== null ||
      urlFilters.language !== null ||
      urlFilters.mediaType !== 'movie' ||
      urlFilters.sortBy !== 'popularity.desc';
    
    if (hasFilters) {
      setShowFilters(true);
    }
    setFilters(urlFilters);
  }, [searchParams, getFiltersFromURL]);

  const updateURL = useCallback((newFilters: typeof filters) => {
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

    const queryString = params.toString();
    router.push(`/browse${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [router]);

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  // Debounce URL updates when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateURL(filters);
    }, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [filters, updateURL]);

  return (
    <>
      {/* Filter Button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 ease-out ${
            showFilters
              ? 'bg-primary hover:bg-primary-dark shadow-lg'
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          {showFilters ? (
            <>
              <X className="w-4 h-4 transition-transform duration-200" />
              <span>Hide Filters</span>
            </>
          ) : (
            <>
              <Filter className="w-4 h-4 transition-transform duration-200" />
              <span>Show Filters</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Panel - Compact */}
      {showFilters && (
        <div className="mb-6 p-4 glass rounded-lg border border-white/10 animate-fade-in relative z-50">
          <FilterPanel
            movieGenres={movieGenres}
            tvGenres={tvGenres}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>
      )}

      <BrowsePageClient movieGenres={movieGenres} tvGenres={tvGenres} />
    </>
  );
}
