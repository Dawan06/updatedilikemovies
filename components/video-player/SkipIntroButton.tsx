'use client';

import { FastForward } from 'lucide-react';

interface SkipIntroButtonProps {
  show: boolean;
  onSkip: () => void;
  introEndTime?: number; // in seconds
}

export default function SkipIntroButton({
  show,
  onSkip,
  introEndTime,
}: SkipIntroButtonProps) {
  if (!show) return null;

  return (
    <div className="absolute bottom-24 left-4 z-30 animate-fade-in">
      <button
        onClick={onSkip}
        className="flex items-center gap-2 glass hover:bg-white/20 px-4 py-2 rounded-lg text-white transition-all duration-200 group"
      >
        <FastForward className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium">Skip Intro</span>
      </button>
    </div>
  );
}
