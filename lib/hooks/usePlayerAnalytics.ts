'use client';

import { useEffect, useRef } from 'react';

interface PlayerAnalytics {
  playStartTime: number | null;
  totalPlayTime: number;
  pauseCount: number;
  seekCount: number;
  serverSwitches: number;
  errors: number;
  bufferEvents: number;
}

interface UsePlayerAnalyticsOptions {
  enabled?: boolean;
  onAnalyticsUpdate?: (analytics: PlayerAnalytics) => void;
}

export function usePlayerAnalytics({
  enabled = true,
  onAnalyticsUpdate,
}: UsePlayerAnalyticsOptions = {}) {
  const analyticsRef = useRef<PlayerAnalytics>({
    playStartTime: null,
    totalPlayTime: 0,
    pauseCount: 0,
    seekCount: 0,
    serverSwitches: 0,
    errors: 0,
    bufferEvents: 0,
  });

  useEffect(() => {
    if (!enabled) return;

    // Track play/pause
    const handlePlay = () => {
      analyticsRef.current.playStartTime = Date.now();
    };

    const handlePause = () => {
      if (analyticsRef.current.playStartTime) {
        const playDuration = (Date.now() - analyticsRef.current.playStartTime) / 1000;
        analyticsRef.current.totalPlayTime += playDuration;
        analyticsRef.current.playStartTime = null;
      }
      analyticsRef.current.pauseCount++;
      onAnalyticsUpdate?.(analyticsRef.current);
    };

    // Track buffer events
    const handleWaiting = () => {
      analyticsRef.current.bufferEvents++;
      onAnalyticsUpdate?.(analyticsRef.current);
    };

    // Save analytics periodically
    const saveInterval = setInterval(() => {
      if (analyticsRef.current.playStartTime) {
        const playDuration = (Date.now() - analyticsRef.current.playStartTime) / 1000;
        analyticsRef.current.totalPlayTime += playDuration;
        analyticsRef.current.playStartTime = Date.now();
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('playerAnalytics', JSON.stringify(analyticsRef.current));
      } catch (error) {
        console.error('Failed to save analytics:', error);
      }
      
      onAnalyticsUpdate?.(analyticsRef.current);
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(saveInterval);
    };
  }, [enabled, onAnalyticsUpdate]);

  const trackSeek = () => {
    analyticsRef.current.seekCount++;
    onAnalyticsUpdate?.(analyticsRef.current);
  };

  const trackServerSwitch = () => {
    analyticsRef.current.serverSwitches++;
    onAnalyticsUpdate?.(analyticsRef.current);
  };

  const trackError = () => {
    analyticsRef.current.errors++;
    onAnalyticsUpdate?.(analyticsRef.current);
  };

  return {
    analytics: analyticsRef.current,
    trackSeek,
    trackServerSwitch,
    trackError,
  };
}
