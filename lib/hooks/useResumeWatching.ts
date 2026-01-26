'use client';

import { useState, useEffect, useCallback } from 'react';
import { useViewingProgress } from './useViewingProgress';
import { ViewingHistory } from '@/types';

interface UseResumeWatchingOptions {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
  runtime?: number; // in minutes for movies
  onResume?: (progress: number) => void;
}

interface ResumeState {
  showResume: boolean;
  progressSeconds: number;
  progressPercent: number;
  shouldResume: boolean;
}

export function useResumeWatching({
  tmdbId,
  mediaType,
  seasonNumber,
  episodeNumber,
  runtime,
  onResume,
}: UseResumeWatchingOptions) {
  const { progress, loading } = useViewingProgress({
    tmdbId,
    mediaType,
    seasonNumber,
    episodeNumber,
  });

  const [resumeState, setResumeState] = useState<ResumeState>({
    showResume: false,
    progressSeconds: 0,
    progressPercent: 0,
    shouldResume: false,
  });

  // Calculate resume state from progress
  useEffect(() => {
    if (loading || !progress) {
      setResumeState({
        showResume: false,
        progressSeconds: 0,
        progressPercent: 0,
        shouldResume: false,
      });
      return;
    }

    const progressSeconds = progress.progress; // progress is in seconds
    let progressPercent = 0;

    if (mediaType === 'movie' && runtime) {
      const totalSeconds = runtime * 60;
      progressPercent = (progressSeconds / totalSeconds) * 100;
    } else if (mediaType === 'tv' && episodeNumber) {
      // For TV, we'd need episode runtime, but we can estimate or use a default
      // For now, use percentage based on typical episode length (45 min)
      const estimatedRuntime = 45 * 60; // 45 minutes in seconds
      progressPercent = (progressSeconds / estimatedRuntime) * 100;
    }

    // Smart resume threshold: only show if >5% watched and <90% complete
    const shouldResume = progressPercent > 5 && progressPercent < 90;

    setResumeState({
      showResume: shouldResume,
      progressSeconds,
      progressPercent: Math.round(progressPercent),
      shouldResume,
    });
  }, [progress, loading, mediaType, runtime, episodeNumber]);

  const handleResume = useCallback(() => {
    if (progress && onResume) {
      onResume(progress.progress);
    }
    setResumeState((prev) => ({ ...prev, showResume: false }));
  }, [progress, onResume]);

  const handleStartFromBeginning = useCallback(() => {
    setResumeState((prev) => ({ ...prev, showResume: false }));
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    ...resumeState,
    loading,
    handleResume,
    handleStartFromBeginning,
    formatTime,
    progressData: progress,
  };
}
