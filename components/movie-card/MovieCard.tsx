'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Movie, TVShow, MediaItem } from '@/types';
import { Film, Star } from 'lucide-react';
import { useState } from 'react';

// Genre ID to name mapping (TMDB standard)
const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  // TV genres
  10759: 'Action', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi', 10766: 'Soap', 10767: 'Talk', 10768: 'Politics'
};

// Flexible item type that accepts partial movie/TV data
interface CardItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  genre_ids?: number[];
  media_type?: 'movie' | 'tv';
}

interface MovieCardProps {
  readonly item: Movie | TVShow | MediaItem | CardItem;
  readonly mediaType?: 'movie' | 'tv';
  readonly priority?: boolean;
  readonly index?: number;
  readonly enableHover?: boolean;
  readonly showCheckbox?: boolean;
  readonly isSelected?: boolean;
  readonly onSelect?: (id: number, type: 'movie' | 'tv') => void;
  readonly showDeleteButton?: boolean;
  readonly onDelete?: (id: number, type: 'movie' | 'tv') => void;
}

export default function MovieCard({ 
  item, 
  mediaType, 
  priority, 
  enableHover = true,
  showCheckbox = false,
  isSelected = false,
  onSelect,
  showDeleteButton = false,
  onDelete,
}: MovieCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const type = mediaType || (item as MediaItem).media_type || 'movie';
  const title = (item as Movie).title || (item as TVShow).name || '';
  const posterPath = item.poster_path;
  const year = ((item as Movie).release_date || (item as TVShow).first_air_date || '').slice(0, 4);
  const rating = item.vote_average || 0;
  const genreIds = (item as Movie | TVShow).genre_ids || [];
  const genres = genreIds.slice(0, 2).map(id => GENRE_MAP[id]).filter(Boolean);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(item.id, type);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(item.id, type);
  };

  return (
    <Link 
      href={`/${type}/${item.id}`} 
      className={`block group relative ${enableHover ? 'hover:scale-105 hover:z-20' : ''} transition-all duration-300 ease-out`}
    >
      {/* Checkbox for selection */}
      {showCheckbox && (
        <button
          onClick={handleCheckboxClick}
          className={`absolute top-2 left-2 z-20 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
            isSelected 
              ? 'bg-primary border-primary' 
              : 'bg-black/50 border-white/50 hover:border-white'
          }`}
        >
          {isSelected && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}

      {/* Delete button for edit mode */}
      {showDeleteButton && (
        <button
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Card Container */}
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-netflix-dark shadow-card transition-shadow duration-300">
        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}
        
        {/* Poster Image */}
        {posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w342${posterPath}`}
            alt={title}
            fill
            className={`object-cover transition-all duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="(max-width: 768px) 180px, 220px"
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full bg-netflix-gray flex items-center justify-center">
            <Film className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Quick Info Hover Overlay */}
        {enableHover && (
          <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            
            {/* Content */}
            <div className="relative z-10 p-3">
              {/* Title */}
              <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2">
                {title}
              </h3>
              
              {/* Rating & Year Row */}
              <div className="flex items-center gap-2 mb-2">
                {rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-xs font-semibold">{rating.toFixed(1)}</span>
                  </div>
                )}
                {year && (
                  <>
                    <span className="w-1 h-1 bg-gray-500 rounded-full" />
                    <span className="text-gray-300 text-xs">{year}</span>
                  </>
                )}
                <span className="w-1 h-1 bg-gray-500 rounded-full" />
                <span className="text-primary text-xs font-medium uppercase">
                  {type === 'tv' ? 'TV' : 'Movie'}
                </span>
              </div>
              
              {/* Genre Tags */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {genres.map((genre, idx) => (
                    <span 
                      key={idx}
                      className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-gray-300"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
