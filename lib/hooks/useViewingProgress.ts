'use client';

import { useState, useEffect } from 'react';
import { ViewingHistory } from '@/types';

interface UseViewingProgressOptions {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
}

export function useViewingProgress({
  tmdbId,
  mediaType,
  seasonNumber,
  episodeNumber,
}: UseViewingProgressOptions) {
  const [progress, setProgress] = useState<ViewingHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProgress() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          tmdb_id: tmdbId.toString(),
          media_type: mediaType,
        });

        if (seasonNumber !== undefined) {
          params.append('season_number', seasonNumber.toString());
        }
        if (episodeNumber !== undefined) {
          params.append('episode_number', episodeNumber.toString());
        }

        const response = await fetch(`/api/viewing-progress?${params.toString()}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            // User not authenticated, that's okay
            setProgress(null);
            return;
          }
          throw new Error('Failed to fetch progress');
        }

        const data = await response.json();
        setProgress(data.progress);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setProgress(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [tmdbId, mediaType, seasonNumber, episodeNumber]);

  return { progress, loading, error };
}
