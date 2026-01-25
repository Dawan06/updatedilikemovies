import { useState, useEffect, useCallback, useRef } from 'react';

interface MediaItem {
    id: number;
    [key: string]: any;
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

interface UseBrowseMediaOptions {
    initialData?: MediaItem[];
    debouncedDelay?: number;
}

export function useBrowseMedia(filters: FilterState, options: UseBrowseMediaOptions = {}) {
    const [data, setData] = useState<MediaItem[]>(options.initialData || []);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Keep track of the latest filters to avoid race conditions in async callbacks
    const currentFiltersRef = useRef(filters);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Deep comparison for filters to trigger effect
    const serializedFilters = JSON.stringify(filters);

    const buildQuery = useCallback((pageParam: number, filterState: FilterState) => {
        const params = new URLSearchParams();
        params.set('page', pageParam.toString());
        params.set('media_type', filterState.mediaType);
        params.set('sort_by', filterState.sortBy);

        if (filterState.genres.length > 0) params.set('genres', filterState.genres.join(','));
        if (filterState.yearFrom) params.set('year_from', filterState.yearFrom.toString());
        if (filterState.yearTo) params.set('year_to', filterState.yearTo.toString());
        if (filterState.ratingMin) params.set('rating_min', filterState.ratingMin.toString());
        if (filterState.language) params.set('language', filterState.language);

        return params.toString();
    }, []);

    const fetchData = useCallback(async (isLoadMore: boolean = false) => {
        const targetPage = isLoadMore ? page + 1 : 1;

        // Abort previous request if it's a new filter search (not load more)
        if (!isLoadMore && abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        if (isLoadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const queryString = buildQuery(targetPage, filters);
            const response = await fetch(`/api/discover?${queryString}`, {
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const json = await response.json();

            if (abortController.signal.aborted) return;

            const newResults = json.results || [];
            const totalPages = json.total_pages || 0;

            if (isLoadMore) {
                // Dedup logic: only add items that aren't already in data
                setData(prev => {
                    const existingIds = new Set(prev.map(item => `${item.media_type}-${item.id}`));
                    const uniqueNew = newResults.filter((item: any) =>
                        !existingIds.has(`${(item.media_type || filters.mediaType)}-${item.id}`)
                    );
                    return [...prev, ...uniqueNew];
                });
                setPage(targetPage);
            } else {
                setData(newResults);
                setPage(1);
            }

            setHasMore(targetPage < totalPages);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error("Fetch error:", err);
                setError(err);
            }
        } finally {
            if (!abortController.signal.aborted) {
                if (isLoadMore) setLoadingMore(false);
                else setLoading(false);
            }
        }
    }, [page, filters, buildQuery]);

    // Reset and fetch when filters change
    useEffect(() => {
        currentFiltersRef.current = filters;
        fetchData(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serializedFilters]); // Depend on stringified filters to avoid deep object ref check issues

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            fetchData(true);
        }
    }, [loadingMore, hasMore, loading, fetchData]);

    return {
        data,
        loading,
        loadingMore,
        error,
        hasMore,
        loadMore
    };
}
