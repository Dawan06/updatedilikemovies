'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Film, Tv, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  { value: 'vote_average.desc', label: 'Top Rated' },
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
      if (genreRef.current && !genreRef.current.contains(event.target as Node)) setShowGenres(false);
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) setShowYear(false);
      if (ratingRef.current && !ratingRef.current.contains(event.target as Node)) setShowRating(false);
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) setShowLanguage(false);
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setShowSort(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
      {/* Filter Container - Wrapped to prevent clipping of dropdowns */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">

        {/* Media Type Capsules */}
        <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/5 mr-4 shrink-0">
          {[
            { value: 'all', label: 'All', icon: LayoutGrid },
            { value: 'movie', label: 'Movies', icon: Film },
            { value: 'tv', label: 'TV', icon: Tv },
          ].map((type) => {
            const Icon = type.icon;
            const isActive = filters.mediaType === type.value || (filters.mediaType === 'movie' && type.value === 'all' && false); // Simplified logic
            // Actual logic: 'all' isn't really a state in existing logic (default is movie), but mimicking MyList UI:
            // Let's just map 'all' to something or keep as is.
            // Wait, existing logic uses 'movie' as default. Let's keep it consistent.

            return (
              <button
                key={type.value}
                onClick={() => handleMediaTypeChange(type.value)}
                className="relative px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
              >
                {filters.mediaType === (type.value === 'all' ? 'xg' : type.value) && ( /* Hack to not highlight all */
                  null
                )}
                {filters.mediaType === type.value && (
                  <motion.div
                    layoutId="activeBrowseFilter"
                    className="absolute inset-0 bg-white/10 rounded-full border border-white/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-2 ${filters.mediaType === type.value ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {type.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filter Pills */}
        <div ref={genreRef} className="relative shrink-0">
          <button
            onClick={() => setShowGenres(!showGenres)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${filters.genres.length > 0
              ? 'bg-primary text-white shadow-glow'
              : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
          >
            Genres {filters.genres.length > 0 && <span className="bg-white/20 px-1.5 rounded text-xs">{filters.genres.length}</span>}
            <ChevronDown className={`w-3 h-3 transition-transform ${showGenres ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showGenres && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-2 p-3 bg-netflix-gray/95 backdrop-blur-xl rounded-2xl border border-white/10 z-50 w-[90vw] md:w-auto min-w-[280px] md:min-w-[320px] max-h-80 overflow-y-auto shadow-2xl"
              >
                <GenreFilter
                  genres={currentGenres}
                  selectedGenres={filters.genres}
                  onSelectionChange={(genres) => updateFilters({ genres })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={yearRef} className="relative shrink-0">
          <button
            onClick={() => setShowYear(!showYear)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${filters.yearFrom || filters.yearTo
              ? 'bg-primary text-white shadow-glow'
              : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
          >
            Year {(filters.yearFrom || filters.yearTo) ? `${filters.yearFrom || ''}-${filters.yearTo || ''}` : 'Any'}
            <ChevronDown className={`w-3 h-3 transition-transform ${showYear ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showYear && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-2 p-4 bg-netflix-gray/95 backdrop-blur-xl rounded-2xl border border-white/10 z-50 min-w-[300px] shadow-2xl"
              >
                <YearRangeFilter
                  yearFrom={filters.yearFrom}
                  yearTo={filters.yearTo}
                  onYearChange={(from, to) => updateFilters({ yearFrom: from, yearTo: to })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={ratingRef} className="relative shrink-0">
          <button
            onClick={() => setShowRating(!showRating)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${filters.ratingMin
              ? 'bg-primary text-white shadow-glow'
              : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
          >
            Rating {filters.ratingMin ? `${filters.ratingMin.toFixed(1)}+` : 'Any'}
            <ChevronDown className={`w-3 h-3 transition-transform ${showRating ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showRating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-2 p-4 bg-netflix-gray/95 backdrop-blur-xl rounded-2xl border border-white/10 z-50 min-w-[280px] shadow-2xl"
              >
                <RatingFilter
                  ratingMin={filters.ratingMin}
                  onRatingChange={(rating) => updateFilters({ ratingMin: rating })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={languageRef} className="relative shrink-0">
          <button
            onClick={() => setShowLanguage(!showLanguage)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${filters.language
              ? 'bg-primary text-white shadow-glow'
              : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
          >
            {filters.language ? POPULAR_LANGUAGES.find(l => l.code === filters.language)?.name : 'Language'}
            <ChevronDown className={`w-3 h-3 transition-transform ${showLanguage ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showLanguage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-2 p-3 bg-netflix-gray/95 backdrop-blur-xl rounded-2xl border border-white/10 z-50 min-w-[200px] shadow-2xl max-h-80 overflow-y-auto"
              >
                <div className="space-y-1">
                  <button
                    onClick={() => handleLanguageChange(null)}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${!filters.language
                      ? 'bg-white/20 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    All Languages
                  </button>
                  {POPULAR_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(filters.language === lang.code ? null : lang.code)}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${filters.language === lang.code
                        ? 'bg-primary text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sort Dropdown - Floating Right */}
      <div ref={sortRef} className="relative shrink-0">
        <button
          onClick={() => setShowSort(!showSort)}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${filters.sortBy !== 'popularity.desc'
            ? 'bg-primary text-white shadow-glow'
            : 'bg-transparent text-gray-400 hover:text-white'
            }`}
        >
          {currentSortLabel}
          <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showSort && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: 0 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, y: 10, x: 0 }}
              className="absolute top-full left-0 lg:left-auto lg:right-0 mt-2 p-2 bg-netflix-gray/95 backdrop-blur-xl rounded-2xl border border-white/10 z-50 min-w-[180px] shadow-2xl"
            >
              <div className="space-y-0.5">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${filters.sortBy === option.value
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
