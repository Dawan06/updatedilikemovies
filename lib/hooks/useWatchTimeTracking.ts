'use client';

import { useEffect, useRef } from 'react';

interface UseWatchTimeTrackingOptions {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
  enabled?: boolean;
}

export function useWatchTimeTracking({
  tmdbId,
  mediaType,
  seasonNumber,
  episodeNumber,
  enabled = true,
}: UseWatchTimeTrackingOptions) {
  const startTimeRef = useRef<number | null>(null);
  const totalWatchTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Start tracking when component mounts
    startTimeRef.current = Date.now();

    // Update watch time every 30 seconds
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000; // in seconds
        totalWatchTimeRef.current += elapsed;
        startTimeRef.current = Date.now();

        // Save to localStorage
        const key = `watchTime_${tmdbId}_${mediaType}_${seasonNumber || ''}_${episodeNumber || ''}`;
        try {
          const existing = localStorage.getItem(key);
          const existingTime = existing ? parseFloat(existing) : 0;
          localStorage.setItem(key, (existingTime + elapsed).toString());
        } catch (error) {
          console.error('Failed to save watch time:', error);
        }
      }
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Save final watch time
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        totalWatchTimeRef.current += elapsed;
        
        const key = `watchTime_${tmdbId}_${mediaType}_${seasonNumber || ''}_${episodeNumber || ''}`;
        try {
          const existing = localStorage.getItem(key);
          const existingTime = existing ? parseFloat(existing) : 0;
          localStorage.setItem(key, (existingTime + elapsed).toString());
        } catch (error) {
          console.error('Failed to save final watch time:', error);
        }
      }
    };
  }, [tmdbId, mediaType, seasonNumber, episodeNumber, enabled]);

  return {
    totalWatchTime: totalWatchTimeRef.current,
  };
}
