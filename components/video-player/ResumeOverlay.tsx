'use client';

import { Play, RotateCcw } from 'lucide-react';

interface ResumeOverlayProps {
  show: boolean;
  progressPercent: number;
  progressTime: string;
  onResume: () => void;
  onStartFromBeginning: () => void;
}

export default function ResumeOverlay({
  show,
  progressPercent,
  progressTime,
  onResume,
  onStartFromBeginning,
}: ResumeOverlayProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="text-center space-y-6 animate-fade-in-up">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Continue Watching?
          </h2>
          <p className="text-gray-300 text-sm md:text-base">
            You were at {progressTime} ({progressPercent}%)
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onResume}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Play className="w-5 h-5" />
            Resume
          </button>
          <button
            onClick={onStartFromBeginning}
            className="flex items-center gap-2 glass hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
