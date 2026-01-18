'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import GenreFilter from './GenreFilter';
import YearRangeFilter from './YearRangeFilter';
import RatingFilter from './RatingFilter';

interface Genre {
  id: number;
  name: string;
}

interface FilterPanelProps {
  movieGenres: Genre[];
  tvGenres: Genre[];
  filters: {
    genres: number[];
    yearFrom: number | null;
    yearTo: number | null;
    ratingMin: number | null;
    language: string | null;
    mediaType: string;
    sortBy: string;
  };
  onFiltersChange: (filters: {
    genres: number[];
    yearFrom: number | null;
    yearTo: number | null;
    ratingMin: number | null;
    language: string | null;
    mediaType: string;
    sortBy: string;
  }) => void;
}

const POPULAR_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularity' },
  { value: 'release_date.desc', label: 'Newest' },
  { value: 'release_date.asc', label: 'Oldest' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'vote_average.asc', label: 'Lowest Rated' },
  { value: 'title.asc', label: 'A-Z' },
  { value: 'revenue.desc', label: 'Revenue' },
];

export default function FilterPanel({
  movieGenres,
  tvGenres,
  filters,
  onFiltersChange,
}: FilterPanelProps) {
  const [showGenres, setShowGenres] = useState(false);
  const [showYear, setShowYear] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const genreRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const ratingRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const currentGenres = filters.mediaType === 'tv' ? tvGenres : movieGenres;

  const updateFilters = (updates: Partial<typeof filters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handleLanguageChange = (langCode: string | null) => {
    updateFilters({ language: langCode });
    setShowLanguage(false);
  };

  const handleMediaTypeChange = (type: string) => {
    updateFilters({ mediaType: type, genres: [] });
  };

  const handleSortChange = (sortValue: string) => {
    updateFilters({ sortBy: sortValue });
    setShowSort(false);
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === filters.sortBy)?.label || 'Sort';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(event.target as Node)) {
        setShowGenres(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setShowYear(false);
      }
      if (ratingRef.current && !ratingRef.current.contains(event.target as Node)) {
        setShowRating(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setShowLanguage(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSort(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2 relative">
      {/* Media Type */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
        {[
          { value: 'all', label: 'All' },
          { value: 'movie', label: 'Movies' },
          { value: 'tv', label: 'TV' },
        ].map((type) => (
          <button
            key={type.value}
            onClick={() => handleMediaTypeChange(type.value)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filters.mediaType === type.value
                ? 'bg-primary text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Sort Dropdown */}
      <div ref={sortRef} className="relative">
        <button
          onClick={() => setShowSort(!showSort)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            filters.sortBy !== 'popularity.desc'
              ? 'bg-primary text-white'
              : 'glass text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          {currentSortLabel}
          {showSort ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showSort && (
          <div className="absolute top-full left-0 mt-1 p-1 glass rounded-lg border border-white/10 z-50 min-w-[180px]">
            <div className="space-y-0.5">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    filters.sortBy === option.value
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Genres Dropdown */}
      <div ref={genreRef} className="relative">
        <button
          onClick={() => setShowGenres(!showGenres)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            filters.genres.length > 0
              ? 'bg-primary text-white'
              : 'glass text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Genres {filters.genres.length > 0 && `(${filters.genres.length})`}
          {showGenres ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showGenres && (
          <div className="absolute top-full left-0 mt-1 p-3 glass rounded-lg border border-white/10 z-50 min-w-[320px] max-h-80 overflow-y-auto">
            <GenreFilter
              genres={currentGenres}
              selectedGenres={filters.genres}
              onSelectionChange={(genres) => updateFilters({ genres })}
            />
          </div>
        )}
      </div>

      {/* Year Dropdown */}
      <div ref={yearRef} className="relative">
        <button
          onClick={() => setShowYear(!showYear)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            filters.yearFrom || filters.yearTo
              ? 'bg-primary text-white'
              : 'glass text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Year {(filters.yearFrom || filters.yearTo) ? `${filters.yearFrom || ''}-${filters.yearTo || ''}` : 'Any'}
          {showYear ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showYear && (
          <div className="absolute top-full left-0 mt-1 p-3 glass rounded-lg border border-white/10 z-50 min-w-[280px]">
            <YearRangeFilter
              yearFrom={filters.yearFrom}
              yearTo={filters.yearTo}
              onYearChange={(from, to) => updateFilters({ yearFrom: from, yearTo: to })}
            />
          </div>
        )}
      </div>

      {/* Rating Dropdown */}
      <div ref={ratingRef} className="relative">
        <button
          onClick={() => setShowRating(!showRating)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            filters.ratingMin
              ? 'bg-primary text-white'
              : 'glass text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Rating {filters.ratingMin ? `${filters.ratingMin.toFixed(1)}+` : 'Any'}
          {showRating ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showRating && (
          <div className="absolute top-full left-0 mt-1 p-3 glass rounded-lg border border-white/10 z-50 min-w-[280px]">
            <RatingFilter
              ratingMin={filters.ratingMin}
              onRatingChange={(rating) => updateFilters({ ratingMin: rating })}
            />
          </div>
        )}
      </div>

      {/* Language Dropdown */}
      <div ref={languageRef} className="relative">
        <button
          onClick={() => setShowLanguage(!showLanguage)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            filters.language
              ? 'bg-primary text-white'
              : 'glass text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Language {filters.language ? POPULAR_LANGUAGES.find(l => l.code === filters.language)?.name : 'Any'}
          {showLanguage ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showLanguage && (
          <div className="absolute top-full left-0 mt-1 p-3 glass rounded-lg border border-white/10 z-50 min-w-[200px]">
            <div className="space-y-1">
              <button
                onClick={() => handleLanguageChange(null)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  !filters.language
                    ? 'bg-primary text-white'
                    : 'glass text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                All Languages
              </button>
              {POPULAR_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(filters.language === lang.code ? null : lang.code)}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    filters.language === lang.code
                      ? 'bg-primary text-white'
                      : 'glass text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
