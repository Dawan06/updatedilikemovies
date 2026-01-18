'use client';

import { useState } from 'react';

interface YearRangeFilterProps {
  yearFrom: number | null;
  yearTo: number | null;
  onYearChange: (from: number | null, to: number | null) => void;
  className?: string;
}

const currentYear = new Date().getFullYear();
const PRESETS = [
  { label: '2020s', from: 2020, to: currentYear },
  { label: '2010s', from: 2010, to: 2019 },
  { label: '2000s', from: 2000, to: 2009 },
  { label: '1990s', from: 1990, to: 1999 },
  { label: 'Classic', from: 1900, to: 1989 },
];

export default function YearRangeFilter({
  yearFrom,
  yearTo,
  onYearChange,
  className = '',
}: YearRangeFilterProps) {
  const [customFrom, setCustomFrom] = useState<string>(yearFrom?.toString() || '');
  const [customTo, setCustomTo] = useState<string>(yearTo?.toString() || '');

  const handlePreset = (from: number, to: number) => {
    setCustomFrom(from.toString());
    setCustomTo(to.toString());
    onYearChange(from, to);
  };

  const handleCustomChange = (type: 'from' | 'to', value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    if (type === 'from') {
      setCustomFrom(value);
      onYearChange(numValue, yearTo);
    } else {
      setCustomTo(value);
      onYearChange(yearFrom, numValue);
    }
  };

  const clearFilters = () => {
    setCustomFrom('');
    setCustomTo('');
    onYearChange(null, null);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Year</h3>
        {(yearFrom || yearTo) && (
          <button
            onClick={clearFilters}
            className="text-xs text-primary hover:text-primary-dark transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((preset) => {
          const isActive = yearFrom === preset.from && yearTo === preset.to;
          return (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset.from, preset.to)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'glass text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="number"
          min="1900"
          max={currentYear}
          placeholder="From"
          value={customFrom}
          onChange={(e) => handleCustomChange('from', e.target.value)}
          className="w-24 px-3 py-2 bg-netflix-dark border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
        />
        <span className="text-gray-400">to</span>
        <input
          type="number"
          min="1900"
          max={currentYear}
          placeholder="To"
          value={customTo}
          onChange={(e) => handleCustomChange('to', e.target.value)}
          className="w-24 px-3 py-2 bg-netflix-dark border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
        />
      </div>
    </div>
  );
}
