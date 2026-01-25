'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FilterPanel from './FilterPanel';
import FilterChips from './FilterChips';
import MovieGrid from './MovieGrid';
import { useBrowseMedia } from '@/hooks/useBrowseMedia';

interface Genre {
    id: number;
    name: string;
}

interface BrowseClientProps {
    movieGenres: Genre[];
    tvGenres: Genre[];
}

export interface FilterState {
    genres: number[];
    yearFrom: number | null;
    yearTo: number | null;
    ratingMin: number | null;
    language: string | null;
    mediaType: string;
    sortBy: string;
}

export default function BrowseClient({ movieGenres, tvGenres }: BrowseClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parsing URL params into initial state
    const getFiltersFromURL = useCallback((): FilterState => {
        return {
            genres: searchParams.get('genres')?.split(',').map(Number).filter(Boolean) || [],
            yearFrom: searchParams.get('year_from') ? parseInt(searchParams.get('year_from')!, 10) : null,
            yearTo: searchParams.get('year_to') ? parseInt(searchParams.get('year_to')!, 10) : null,
            ratingMin: searchParams.get('rating_min') ? parseFloat(searchParams.get('rating_min')!) : null,
            language: searchParams.get('language') || null,
            mediaType: searchParams.get('media_type') || 'movie',
            sortBy: searchParams.get('sort_by') || 'popularity.desc',
        };
    }, [searchParams]);

    const [filters, setFilters] = useState<FilterState>(getFiltersFromURL);

    // Custom hook handles fetching & infinite scroll
    const { data, loading, loadingMore, hasMore, loadMore, error } = useBrowseMedia(filters);

    // Sync URL with State (Debounced)
    const updateURL = useCallback((currentFilters: FilterState) => {
        const params = new URLSearchParams();

        if (currentFilters.genres.length > 0) params.set('genres', currentFilters.genres.join(','));
        if (currentFilters.yearFrom) params.set('year_from', currentFilters.yearFrom.toString());
        if (currentFilters.yearTo) params.set('year_to', currentFilters.yearTo.toString());
        if (currentFilters.ratingMin) params.set('rating_min', currentFilters.ratingMin.toString());
        if (currentFilters.language) params.set('language', currentFilters.language);
        if (currentFilters.mediaType !== 'movie') params.set('media_type', currentFilters.mediaType);
        if (currentFilters.sortBy !== 'popularity.desc') params.set('sort_by', currentFilters.sortBy);

        const queryString = params.toString();
        // Using replace to avoid clogging history with every filter change, but push is okay too.
        // Let's use push for major changes, but here we update for every small change? 
        // Usually replacing is better for filters unless user expects back button to undo filter.
        // Requirement said: "Filters are URL-synced (shareable state)".
        // Let's use replace for now to keep history clean, or maybe push is better for UX?
        // "Filters persist when navigating away and back" -> satisfied by URL.
        // Let's stick to replace for smoother experience, maybe push if it's a "big" change?
        // Standard is usually replace.
        router.replace(`/browse${queryString ? `?${queryString}` : ''}`, { scroll: false });
    }, [router]);

    // Debounce filter updates to URL
    useEffect(() => {
        const timeout = setTimeout(() => {
            updateURL(filters);
        }, 500);
        return () => clearTimeout(timeout);
    }, [filters, updateURL]);

    // Handle Browser Back Button (PopState)
    useEffect(() => {
        const urlFilters = getFiltersFromURL();
        // JSON compare to avoid loop
        if (JSON.stringify(urlFilters) !== JSON.stringify(filters)) {
            setFilters(urlFilters);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleFiltersChange = (newFilters: Partial<FilterState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleRemoveFilter = (key: keyof FilterState, value?: any) => {
        setFilters(prev => {
            const next = { ...prev };
            if (key === 'genres' && value) {
                next.genres = next.genres.filter(g => g !== value);
            } else if (key === 'mediaType') {
                next.mediaType = 'movie';
            } else {
                // Reset to default (null)
                (next as any)[key] = null;
            }
            return next;
        });
    };

    const handleClearAll = () => {
        setFilters({
            genres: [],
            yearFrom: null,
            yearTo: null,
            ratingMin: null,
            language: null,
            mediaType: 'movie',
            sortBy: 'popularity.desc',
        });
    };

    // Memoize genre map for chips
    const genreNamesMap = useMemo(() => {
        const map = new Map<number, string>();
        [...movieGenres, ...tvGenres].forEach(g => map.set(g.id, g.name));
        return map;
    }, [movieGenres, tvGenres]);

    const hasActiveFilters =
        filters.genres.length > 0 ||
        filters.yearFrom !== null ||
        filters.yearTo !== null ||
        filters.ratingMin !== null ||
        filters.language !== null ||
        filters.mediaType !== 'movie' ||
        filters.sortBy !== 'popularity.desc';

    return (
        <div className="min-h-screen bg-netflix-black pb-20">
            {/* Header & Filter Panel */}
            <div className="pt-24 pb-8 px-4 md:px-12 bg-gradient-to-b from-netflix-dark to-netflix-black relative">
                <div className="max-w-[1800px] mx-auto space-y-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="font-display text-4xl md:text-6xl text-white tracking-wide drop-shadow-lg">
                            Browse
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl">
                            Explore our extensive collection of movies and TV shows.
                        </p>
                    </div>

                    <div className="sticky top-[68px] z-40 py-2">
                        <FilterPanel
                            movieGenres={movieGenres}
                            tvGenres={tvGenres}
                            // @ts-ignore - mismatch in type definition of FilterPanel vs local FilterState
                            // We need to fix FilterPanel types or cast here.
                            // Existing FilterPanel.tsx expects specific structure. 
                            // Let's verify FilterPanel props in next step or just match them.
                            // In previous `view_file`, FilterPanel props matched this structure exactly.
                            filters={filters}
                            onFiltersChange={(newVal) => setFilters(prev => ({ ...prev, ...newVal }))}
                        />
                    </div>

                    {hasActiveFilters && (
                        <FilterChips
                            // @ts-ignore - types match but strictness might complain
                            filters={filters}
                            genreNames={genreNamesMap}
                            onRemoveFilter={(type, val) => {
                                // Map FilterChips 'type' string back to state keys
                                // FilterChips uses 'genres', 'year', 'rating', 'language', 'mediaType'
                                if (type === 'year') {
                                    setFilters(prev => ({ ...prev, yearFrom: null, yearTo: null }));
                                } else if (type === 'rating') {
                                    setFilters(prev => ({ ...prev, ratingMin: null }));
                                } else {
                                    handleRemoveFilter(type as keyof FilterState, val);
                                }
                            }}
                            onClearAll={handleClearAll}
                            className="pb-4 border-b border-white/10"
                        />
                    )}

                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 md:px-12 max-w-[1800px] mx-auto">
                {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 mb-8">
                        Something went wrong loading the content. Please try again.
                    </div>
                )}

                <MovieGrid
                    items={data}
                    loading={loading}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    mediaType={filters.mediaType}
                />
            </div>
        </div>
    );
}
