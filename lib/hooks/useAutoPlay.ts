'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Episode } from '@/types';

interface UseAutoPlayOptions {
  enabled?: boolean;
  countdownDuration?: number; // in seconds
  onAutoPlay?: () => void;
  nextEpisode?: Episode | null;
  currentEpisode?: number;
  currentSeason?: number;
  tvId?: number;
}

export function useAutoPlay({
  enabled = true,
  countdownDuration = 10,
  onAutoPlay,
  nextEpisode,
  currentEpisode,
  currentSeason,
  tvId,
}: UseAutoPlayOptions) {
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(countdownDuration);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('autoPlayEnabled');
      return saved !== null ? saved === 'true' : enabled;
    }
    return enabled;
  });
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const episodeEndDetectedRef = useRef(false);

  // Save auto-play preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('autoPlayEnabled', autoPlayEnabled.toString());
    }
  }, [autoPlayEnabled]);

  // Detect episode end (this would need to be called from the player)
  const detectEpisodeEnd = useCallback(() => {
    if (!autoPlayEnabled || !nextEpisode || episodeEndDetectedRef.current) {
      return;
    }

    episodeEndDetectedRef.current = true;
    setShowCountdown(true);
    setCountdown(countdownDuration);

    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-play next episode
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setShowCountdown(false);
          onAutoPlay?.();
          episodeEndDetectedRef.current = false;
          return countdownDuration;
        }
        return prev - 1;
      });
    }, 1000);
  }, [autoPlayEnabled, nextEpisode, countdownDuration, onAutoPlay]);

  const cancelAutoPlay = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowCountdown(false);
    setCountdown(countdownDuration);
    episodeEndDetectedRef.current = false;
  }, [countdownDuration]);

  const skipCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowCountdown(false);
    onAutoPlay?.();
    episodeEndDetectedRef.current = false;
  }, [onAutoPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return {
    showCountdown,
    countdown,
    autoPlayEnabled,
    setAutoPlayEnabled,
    detectEpisodeEnd,
    cancelAutoPlay,
    skipCountdown,
  };
}
