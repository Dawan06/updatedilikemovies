'use client';

import { useState, useEffect } from 'react';

interface RatingFilterProps {
  ratingMin: number | null;
  onRatingChange: (rating: number | null) => void;
  className?: string;
}

export default function RatingFilter({
  ratingMin,
  onRatingChange,
  className = '',
}: RatingFilterProps) {
  const [tempRating, setTempRating] = useState(ratingMin || 0);

  useEffect(() => {
    setTempRating(ratingMin || 0);
  }, [ratingMin]);

  const handleSliderChange = (value: string) => {
    const numValue = parseFloat(value);
    setTempRating(numValue);
    onRatingChange(numValue > 0 ? numValue : null);
  };

  const clearFilter = () => {
    setTempRating(0);
    onRatingChange(null);
  };

  const quickFilters = [7, 8, 9];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Minimum Rating</h3>
        {ratingMin !== null && (
          <button
            onClick={clearFilter}
            className="text-xs text-primary hover:text-primary-dark transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {quickFilters.map((rating) => {
          const isActive = ratingMin === rating;
          return (
            <button
              key={rating}
              onClick={() => {
                setTempRating(rating);
                onRatingChange(rating);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'glass text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {rating}+
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={tempRating}
          onChange={(e) => handleSliderChange(e.target.value)}
          className="w-full h-2 bg-netflix-gray rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0</span>
          <span className="text-white font-medium">{tempRating.toFixed(1)}</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
}
