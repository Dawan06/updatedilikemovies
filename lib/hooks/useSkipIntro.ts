'use client';

import { useState, useEffect, useCallback } from 'react';
import { Episode } from '@/types';

interface UseSkipIntroOptions {
  mediaType: 'movie' | 'tv';
  currentEpisode?: Episode;
  onSkip: (time: number) => void;
}

// Typical intro durations (in seconds)
const INTRO_DURATIONS = {
  tv: 90, // 1.5 minutes for TV shows
  movie: 0, // Movies typically don't have skip intro
};

export function useSkipIntro({
  mediaType,
  currentEpisode,
  onSkip,
}: UseSkipIntroOptions) {
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [introEndTime, setIntroEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Determine intro end time
  useEffect(() => {
    if (mediaType === 'tv') {
      // For TV shows, use typical intro duration or episode-specific data
      const introDuration = INTRO_DURATIONS.tv;
      setIntroEndTime(introDuration);
    } else {
      setIntroEndTime(0);
    }
  }, [mediaType]);

  // Show skip intro button when in intro range
  useEffect(() => {
    if (introEndTime > 0 && currentTime > 0 && currentTime < introEndTime) {
      setShowSkipIntro(true);
    } else {
      setShowSkipIntro(false);
    }
  }, [currentTime, introEndTime]);

  const handleSkip = useCallback(() => {
    onSkip(introEndTime);
    setShowSkipIntro(false);
  }, [introEndTime, onSkip]);

  return {
    showSkipIntro,
    introEndTime,
    handleSkip,
    setCurrentTime, // Call this to update current playback time
  };
}
