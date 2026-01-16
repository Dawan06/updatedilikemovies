import { tmdbClient } from '@/lib/tmdb/client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Star, Film } from 'lucide-react';
import MovieCard from '@/components/movie-card/MovieCard';

export const revalidate = 3600;

export default async function FranchiseDetailPage({ 
  params 
}: { 
  params: { readonly id: string } 
}) {
  const collectionId = parseInt(params.id, 10);
  
  if (isNaN(collectionId)) {
    return (
      <main className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Invalid franchise ID</p>
          <Link href="/franchise" className="text-primary hover:underline">
            Back to Franchises
          </Link>
        </div>
      </main>
    );
  }

  try {
    const collection = await tmdbClient.getCollectionDetails(collectionId);
    
    // Sort movies by release date (chronological order)
    const sortedMovies = [...collection.parts].sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return dateA - dateB;
    });

    // Get user's watchlist to show which movies they have
    // Note: This is server-side, so we can't access localStorage directly
    // We'll handle this client-side in the component

    const backdropUrl = collection.backdrop_path
      ? `https://image.tmdb.org/t/p/original${collection.backdrop_path}`
      : null;

    return (
      <main className="min-h-screen bg-netflix-black">
        {/* Hero Section */}
        <div className="relative h-[50vh] min-h-[400px] max-h-[600px] w-full overflow-hidden">
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt={collection.name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
              quality={85}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-netflix-gray to-netflix-dark" />
          )}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-netflix-black via-netflix-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-netflix-black/60" />

          {/* Content */}
          <div className="absolute inset-0 flex items-end">
            <div className="w-full px-4 md:px-12 pb-12 md:pb-16">
              <div className="max-w-4xl">
                <Link
                  href="/franchise"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Franchises</span>
                </Link>

                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-white mb-4 tracking-wide drop-shadow-2xl">
                  {collection.name.toUpperCase()}
                </h1>

                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-primary" />
                    <span className="text-white font-semibold">
                      {collection.parts.length} {collection.parts.length === 1 ? 'Movie' : 'Movies'}
                    </span>
                  </div>
                </div>

                {collection.overview && (
                  <p className="text-gray-200 text-base md:text-lg max-w-2xl leading-relaxed drop-shadow-lg">
                    {collection.overview}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Movies Timeline */}
        <div className="px-4 md:px-12 py-12">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-primary" />
              <span>Movies in Chronological Order</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {sortedMovies.map((movie, index) => {
                const releaseYear = movie.release_date?.slice(0, 4) || 'Unknown';
                
                return (
                  <div key={movie.id} className="relative group">
                    {/* Movie Number Badge */}
                    <div className="absolute -top-2 -left-2 z-20 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>

                    <div className="relative">
                      <MovieCard
                        item={{
                          id: movie.id,
                          title: movie.title,
                          overview: movie.overview || '',
                          poster_path: movie.poster_path,
                          backdrop_path: movie.backdrop_path,
                          release_date: movie.release_date || '',
                          vote_average: movie.vote_average,
                          vote_count: 0,
                          genre_ids: [],
                          adult: false,
                          original_language: 'en',
                          popularity: 0,
                        }}
                        mediaType="movie"
                        enableHover={true}
                      />
                    </div>

                    {/* Release Year */}
                    <div className="mt-2 text-center">
                      <p className="text-white font-semibold text-sm line-clamp-1 mb-1">
                        {movie.title}
                      </p>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{releaseYear}</span>
                        {movie.vote_average > 0 && (
                          <>
                            <span className="mx-1">•</span>
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span>{movie.vote_average.toFixed(1)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error fetching franchise:', error);
    return (
      <main className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load franchise</p>
          <Link href="/franchise" className="text-primary hover:underline">
            Back to Franchises
          </Link>
        </div>
      </main>
    );
  }
}
