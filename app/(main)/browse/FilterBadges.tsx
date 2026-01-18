'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

interface FilterBadgesProps {
  filters: {
    media_type?: string;
    genres?: string;
    year_from?: string;
    year_to?: string;
    rating_min?: string;
    language?: string;
    sort_by?: string;
  };
  query: string;
  movieGenres?: Array<{ id: number; name: string }>;
  tvGenres?: Array<{ id: number; name: string }>;
}

export default function FilterBadges({ filters, query, movieGenres = [], tvGenres = [] }: FilterBadgesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Handle year range specially - remove both year_from and year_to
    if (key === 'year_from') {
      params.delete('year_from');
      params.delete('year_to');
    } else {
      params.delete(key);
    }
    
    // Preserve search query
    if (query) {
      params.set('search', query);
    }
    
    router.push(`/browse?${params.toString()}`);
  };

  const badges: Array<{ key: string; label: string; value: string }> = [];

  // Media type filter
  if (filters.media_type && filters.media_type !== 'all') {
    badges.push({
      key: 'media_type',
      label: 'Type',
      value: filters.media_type === 'movie' ? 'Movies' : filters.media_type === 'tv' ? 'TV Shows' : filters.media_type,
    });
  }

  // Genre filters
  if (filters.genres) {
    const genreIds = filters.genres.split(',').map(Number).filter(Boolean);
    const allGenres = [...movieGenres, ...tvGenres];
    const genreNames = genreIds
      .map(id => allGenres.find(g => g.id === id)?.name)
      .filter(Boolean) as string[];
    
    if (genreNames.length > 0) {
      badges.push({
        key: 'genres',
        label: 'Genres',
        value: genreNames.length > 2 ? `${genreNames.slice(0, 2).join(', ')} +${genreNames.length - 2}` : genreNames.join(', '),
      });
    }
  }

  // Year range
  if (filters.year_from || filters.year_to) {
    const yearRange = filters.year_from && filters.year_to
      ? `${filters.year_from}-${filters.year_to}`
      : filters.year_from
      ? `From ${filters.year_from}`
      : `Until ${filters.year_to}`;
    badges.push({
      key: 'year_from',
      label: 'Year',
      value: yearRange,
    });
  }

  // Rating
  if (filters.rating_min) {
    badges.push({
      key: 'rating_min',
      label: 'Rating',
      value: `≥ ${filters.rating_min}`,
    });
  }

  // Language
  if (filters.language) {
    badges.push({
      key: 'language',
      label: 'Language',
      value: filters.language.toUpperCase(),
    });
  }

  // Sort
  if (filters.sort_by && filters.sort_by !== 'popularity.desc') {
    const sortLabels: Record<string, string> = {
      'popularity.asc': 'Popularity ↑',
      'vote_average.desc': 'Rating ↓',
      'vote_average.asc': 'Rating ↑',
      'release_date.desc': 'Newest',
      'release_date.asc': 'Oldest',
    };
    badges.push({
      key: 'sort_by',
      label: 'Sort',
      value: sortLabels[filters.sort_by] || filters.sort_by,
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-gray-400 text-sm font-medium">Active filters:</span>
      {badges.map((badge) => (
        <button
          key={badge.key}
          onClick={() => removeFilter(badge.key)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-colors group"
        >
          <span className="text-gray-300 text-xs">{badge.label}:</span>
          <span className="font-medium">{badge.value}</span>
          <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
        </button>
      ))}
      <button
        onClick={() => {
          const params = new URLSearchParams();
          if (query) {
            params.set('search', query);
          }
          router.push(`/browse?${params.toString()}`);
        }}
        className="px-3 py-1.5 text-primary hover:text-primary-dark text-sm font-medium transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}
