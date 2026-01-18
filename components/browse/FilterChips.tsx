'use client';

import { X } from 'lucide-react';

interface FilterChipsProps {
  filters: {
    genres?: number[];
    yearFrom?: number | null;
    yearTo?: number | null;
    ratingMin?: number | null;
    language?: string | null;
    mediaType?: string;
  };
  genreNames: Map<number, string>;
  onRemoveFilter: (filterType: string, value?: any) => void;
  onClearAll: () => void;
  className?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
};

export default function FilterChips({
  filters,
  genreNames,
  onRemoveFilter,
  onClearAll,
  className = '',
}: FilterChipsProps) {
  const activeFilterCount =
    (filters.genres?.length || 0) +
    (filters.yearFrom ? 1 : 0) +
    (filters.yearTo ? 1 : 0) +
    (filters.ratingMin ? 1 : 0) +
    (filters.language ? 1 : 0) +
    (filters.mediaType && filters.mediaType !== 'all' ? 1 : 0);

  if (activeFilterCount === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {filters.genres && filters.genres.length > 0 && (
        <>
          {filters.genres.map((genreId) => (
            <button
              key={`genre-${genreId}`}
              onClick={() => onRemoveFilter('genres', genreId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-netflix-dark text-white border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
            >
              {genreNames.get(genreId) || `Genre ${genreId}`}
              <X className="w-3.5 h-3.5" />
            </button>
          ))}
        </>
      )}

      {(filters.yearFrom || filters.yearTo) && (
        <button
          onClick={() => onRemoveFilter('year')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-netflix-dark text-white border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          Year: {filters.yearFrom || 'Any'}-{filters.yearTo || 'Any'}
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {filters.ratingMin && (
        <button
          onClick={() => onRemoveFilter('rating')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-netflix-dark text-white border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          Rating: {filters.ratingMin.toFixed(1)}+
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {filters.language && (
        <button
          onClick={() => onRemoveFilter('language')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-netflix-dark text-white border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          {LANGUAGE_NAMES[filters.language] || filters.language}
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {filters.mediaType && filters.mediaType !== 'all' && (
        <button
          onClick={() => onRemoveFilter('mediaType')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-netflix-dark text-white border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          {filters.mediaType === 'movie' ? 'Movies' : 'TV Shows'}
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {activeFilterCount > 1 && (
        <button
          onClick={onClearAll}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Clear All ({activeFilterCount})
        </button>
      )}
    </div>
  );
}
