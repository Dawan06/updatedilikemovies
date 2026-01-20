'use client';

import { Movie, TVShow } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, X } from 'lucide-react';
import { useState, memo, useCallback } from 'react';

interface MovieCardWithActionsProps {
  movie: Movie | TVShow;
  onLike: () => void;
  onDislike: () => void;
  onWatch: () => void;
  isLiked: boolean;
  isDisliked: boolean;
}

function MovieCardWithActions({
  movie,
  onLike,
  onDislike,
  onWatch,
  isLiked,
  isDisliked,
}: MovieCardWithActionsProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const title = 'title' in movie ? movie.title : movie.name;
  const posterPath = movie.poster_path;
  const rating = movie.vote_average || 0;
  const overview = movie.overview || '';
  const year = ('release_date' in movie ? movie.release_date : movie.first_air_date || '').slice(0, 4);
  const mediaType = 'title' in movie ? 'movie' : 'tv';

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onLike();
  }, [onLike]);

  const handleDislike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDislike();
  }, [onDislike]);

  return (
    <div 
      className="group relative rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster - Full, no cropping */}
      <div className="relative w-full aspect-[2/3] bg-netflix-gray">
        {/* Loading Skeleton */}
        {!imageLoaded && posterPath && (
          <div className="absolute inset-0 bg-gradient-to-br from-netflix-gray via-netflix-dark to-netflix-gray animate-pulse" />
        )}
        
        {posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w300${posterPath}`}
            alt={title}
            fill
            className={`object-contain transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            quality={75}
            onLoad={() => setImageLoaded(true)}
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-netflix-gray to-netflix-dark flex items-center justify-center">
            <span className="text-white/20 text-sm">No Poster</span>
          </div>
        )}
        
        {/* Hover Overlay with Info */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Content shown on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            <div>
              <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">{title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>{year}</span>
                {rating > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span>{rating.toFixed(1)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Overview */}
            {overview && (
              <p className="text-gray-300 text-sm line-clamp-2">{overview}</p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onWatch}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch</span>
              </button>
              <Link
                href={`/${mediaType}/${movie.id}`}
                onClick={(e) => e.stopPropagation()}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                aria-label="More Info"
              >
                <Info className="w-4 h-4" />
              </Link>
              <button
                onClick={handleDislike}
                className="p-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 rounded-lg transition-colors"
                aria-label="Remove"
                title="Remove this recommendation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MovieCardWithActions);
