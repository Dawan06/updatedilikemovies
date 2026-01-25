'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import FilterChips from '@/components/browse/FilterChips';

interface FilterBadgesProps {
  filters: {
    media_type?: string;
    genres?: string;
    year_from?: string;
    year_to?: string;
    rating_min?: string;
    language?: string;
    sort_by?: string;
  };
  query: string;
  movieGenres?: Array<{ id: number; name: string }>;
  tvGenres?: Array<{ id: number; name: string }>;
}

export default function FilterBadges({ filters, query, movieGenres = [], tvGenres = [] }: FilterBadgesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Convert array to map for FilterChips
  const genreNamesMap = useMemo(() => {
    const map = new Map<number, string>();
    [...movieGenres, ...tvGenres].forEach(g => map.set(g.id, g.name));
    return map;
  }, [movieGenres, tvGenres]);

  // Convert filters to FilterState format expected by FilterChips
  // FilterChips expects keys like 'genres': number[], 'yearFrom': number|null, etc.
  // SearchResults uses string params
  const mappedFilters = useMemo(() => ({
    genres: filters.genres?.split(',').map(Number).filter(Boolean) || [],
    yearFrom: filters.year_from ? parseInt(filters.year_from) : null,
    yearTo: filters.year_to ? parseInt(filters.year_to) : null,
    ratingMin: filters.rating_min ? parseFloat(filters.rating_min) : null,
    language: filters.language || null,
    mediaType: filters.media_type,
    // sort_by is not displayed in FilterChips unless we add it, but FilterChips has no UI for sorting removal yet?
    // Wait, FilterChips (Step 57) checks genre, year, rating, language, mediaType. 
    // It does NOT show Sort.
    // FilterBadges (Step 74) DID show Sort.
    // I should probably skip Sort chip for now or add it to FilterChips if critical, 
    // but usually sorting is a view preference, not a "filter" to be removed (default is popularity).
    // Let's stick to what FilterChips supports to be consistent.
  }), [filters]);

  const removeFilter = (key: string, value?: any) => {
    const params = new URLSearchParams(searchParams.toString());

    // Map FilterChips keys to URL params
    if (key === 'genres') {
      // FilterChips passes specific genre ID to remove
      if (value) {
        const currentGenres = params.get('genres')?.split(',').filter(Boolean) || [];
        const newGenres = currentGenres.filter(g => g !== value.toString());
        if (newGenres.length > 0) params.set('genres', newGenres.join(','));
        else params.delete('genres');
      } else {
        params.delete('genres');
      }
    } else if (key === 'year') {
      params.delete('year_from');
      params.delete('year_to');
    } else if (key === 'rating') {
      params.delete('rating_min');
    } else if (key === 'language') {
      params.delete('language');
    } else if (key === 'mediaType') {
      params.delete('media_type');
    } else {
      // Fallback
      params.delete(key);
    }

    // Preserve search query
    if (query) {
      params.set('search', query);
    }

    router.push(`/browse?${params.toString()}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <FilterChips
      filters={mappedFilters}
      genreNames={genreNamesMap}
      onRemoveFilter={removeFilter}
      onClearAll={clearAll}
    />
  );
}
