'use client';

import { Movie, TVShow } from '@/types';
import { memo } from 'react';
import MovieCardWithActions from './MovieCardWithActions';

interface RecommendationGridProps {
  recommendations: (Movie | TVShow)[];
  onLike: (movie: Movie | TVShow) => void;
  onDislike: (movie: Movie | TVShow) => void;
  onWatch: (movie: Movie | TVShow) => void;
  likedMovies: Set<number>;
  dislikedMovies: Set<number>;
}

function RecommendationGrid({
  recommendations,
  onLike,
  onDislike,
  onWatch,
  likedMovies,
  dislikedMovies,
}: RecommendationGridProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
      {recommendations.map((movie) => (
        <MovieCardWithActions
          key={movie.id}
          movie={movie}
          onLike={() => onLike(movie)}
          onDislike={() => onDislike(movie)}
          onWatch={() => onWatch(movie)}
          isLiked={likedMovies.has(movie.id)}
          isDisliked={dislikedMovies.has(movie.id)}
        />
      ))}
    </div>
  );
}

export default memo(RecommendationGrid);
