'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Film, Play } from 'lucide-react';
import { FranchiseCard as FranchiseCardType } from '@/types';

interface FranchiseCardProps {
  readonly franchise: FranchiseCardType;
}

export default function FranchiseCard({ franchise }: FranchiseCardProps) {
  const { collection, userHasMovies, movieCount, userMovieCount } = franchise;
  const backdropUrl = collection.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${collection.backdrop_path}`
    : null;
  const posterUrl = collection.poster_path
    ? `https://image.tmdb.org/t/p/w500${collection.poster_path}`
    : null;

  return (
    <Link
      href={`/franchise/${collection.id}`}
      className="group relative block aspect-video rounded-xl overflow-hidden bg-netflix-dark shadow-card hover:shadow-card-hover transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Backdrop Image */}
      {backdropUrl ? (
        <Image
          src={backdropUrl}
          alt={collection.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-netflix-gray to-netflix-dark" />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        {/* Franchise Name */}
        <h3 className="text-white font-bold text-2xl md:text-3xl mb-3 drop-shadow-2xl z-10">
          {collection.name}
        </h3>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-3 z-10">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-primary" />
            <span className="text-white/90 text-sm font-medium">
              {movieCount} {movieCount === 1 ? 'Movie' : 'Movies'}
            </span>
          </div>
          
          {userHasMovies && (
            <div className="px-2 py-1 bg-primary/20 border border-primary/40 rounded text-xs text-primary font-semibold">
              You have {userMovieCount}/{movieCount}
            </div>
          )}
        </div>

        {/* Overview (truncated) */}
        {collection.overview && (
          <p className="text-gray-300 text-sm line-clamp-2 mb-4 drop-shadow-lg z-10">
            {collection.overview}
          </p>
        )}

        {/* Play Button - appears on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md font-semibold text-sm hover:bg-gray-200 transition-colors">
            <Play className="w-4 h-4 fill-black" />
            <span>Explore Franchise</span>
          </div>
        </div>
      </div>

      {/* Poster overlay (top-right corner) */}
      {posterUrl && (
        <div className="absolute top-4 right-4 w-16 h-24 rounded-md overflow-hidden shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <Image
            src={posterUrl}
            alt={collection.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      )}
    </Link>
  );
}
