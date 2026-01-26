'use client';

import { useState, useEffect, useCallback } from 'react';
import { cachedTmdbClient } from '@/lib/tmdb/cached-client';

interface SearchSuggestion {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
}

export function useSearchSuggestions(query: string, enabled: boolean = true) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await cachedTmdbClient.searchMulti(query, 1);
        const limited = results.results.slice(0, 5).map(item => ({
          id: item.id,
          title: (item as any).title || (item as any).name || '',
          media_type: item.media_type,
          poster_path: item.poster_path,
          release_date: (item as any).release_date,
          first_air_date: (item as any).first_air_date,
        }));
        setSuggestions(limited);
      } catch (error) {
        console.error('Failed to fetch search suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [query, enabled]);

  return { suggestions, loading };
}
