'use client';

import { useState } from 'react';

interface Genre {
  id: number;
  name: string;
}

interface GenreFilterProps {
  genres: Genre[];
  selectedGenres: number[];
  onSelectionChange: (selected: number[]) => void;
  className?: string;
}

export default function GenreFilter({
  genres,
  selectedGenres,
  onSelectionChange,
  className = '',
}: GenreFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleGenre = (genreId: number) => {
    const newSelection = selectedGenres.includes(genreId)
      ? selectedGenres.filter((id) => id !== genreId)
      : [...selectedGenres, genreId];
    onSelectionChange(newSelection);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const visibleGenres = isExpanded ? genres : genres.slice(0, 12);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Genres</h3>
        {selectedGenres.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-primary hover:text-primary-dark transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleGenres.map((genre) => {
          const isSelected = selectedGenres.includes(genre.id);
          return (
            <button
              key={genre.id}
              onClick={() => toggleGenre(genre.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-primary text-white'
                  : 'glass text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {genre.name}
            </button>
          );
        })}

        {genres.length > 12 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 rounded-lg text-sm font-medium glass text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isExpanded ? 'Show Less' : `+${genres.length - 12} More`}
          </button>
        )}
      </div>
    </div>
  );
}
