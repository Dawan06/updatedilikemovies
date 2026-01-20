import { tmdbClient } from '@/lib/tmdb/client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Star, Film, Clock, Award } from 'lucide-react';
import MovieCard from '@/components/movie-card/MovieCard';

export const revalidate = 3600;

export default async function FranchiseDetailPage({
  params
}: {
  readonly params: { readonly id: string }
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

    // Calculate Stats
    const totalMovies = collection.parts.length;
    const avgRating = totalMovies > 0
      ? collection.parts.reduce((sum, m) => sum + (m.vote_average || 0), 0) / totalMovies
      : 0;

    // Calculate total runtime if available (API often doesn't give runtime in collection parts)
    // We would need to fetch details for each movie to get runtime. 
    // Optimization: Skip runtime calculation to avoid N+1 API calls for now, or fetch just top 3 for specific details?
    // Let's stick to what we have in the basic collection response for performance.

    const backdropUrl = collection.backdrop_path
      ? `https://image.tmdb.org/t/p/original${collection.backdrop_path}`
      : null;

    const posterUrl = collection.poster_path
      ? `https://image.tmdb.org/t/p/w500${collection.poster_path}`
      : null;

    return (
      <main className="min-h-screen bg-netflix-black">
        {/* Parallax Hero Section */}
        <div className="relative min-h-[70vh] w-full overflow-hidden flex items-center">
          {/* Background Image with Fixed/Parallax Effect */}
          {backdropUrl ? (
            <div className="absolute inset-0">
              <Image
                src={backdropUrl}
                alt={collection.name}
                fill
                className="object-cover animate-ken-burns opacity-60"
                priority
                sizes="100vw"
                quality={90}
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-netflix-gray to-netflix-dark" />
          )}

          {/* Cinematic Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-netflix-black via-netflix-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-netflix-black" />

          {/* Hero Content */}
          <div className="relative z-10 w-full px-4 md:px-12 py-20">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">

              {/* Left Column: Text & Stats */}
              <div className="lg:col-span-8 space-y-8 animate-fade-in-up">
                {/* Breadcrumb */}
                <Link
                  href="/franchise"
                  className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="uppercase tracking-widest text-xs font-semibold">Back to Franchises</span>
                </Link>

                {/* Title */}
                <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white tracking-wide drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  {collection.name}
                </h1>

                {/* Glassmorphism Stats Bar */}
                <div className="inline-flex flex-wrap items-center gap-6 px-6 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">

                  {/* Movie Count */}
                  <div className="flex items-center gap-3 pr-6 border-r border-white/10 last:border-0 last:pr-0">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Film className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg leading-none">{totalMovies}</p>
                      <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Movies</p>
                    </div>
                  </div>

                  {/* Rating */}
                  {avgRating > 0 && (
                    <div className="flex items-center gap-3 pr-6 border-r border-white/10 last:border-0 last:pr-0">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg leading-none">{avgRating.toFixed(1)}</p>
                        <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Avg Rating</p>
                      </div>
                    </div>
                  )}

                  {/* First Release Year */}
                  {sortedMovies[0]?.release_date && (
                    <div className="flex items-center gap-3 pr-6 border-r border-white/10 last:border-0 last:pr-0">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg leading-none">
                          {sortedMovies[0].release_date.split('-')[0]}
                        </p>
                        <p className="text-white/50 text-xs uppercase tracking-wider font-medium">First Release</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Overview */}
                {collection.overview && (
                  <p className="text-xl text-gray-200 leading-relaxed max-w-2xl drop-shadow-md text-balance opacity-90">
                    {collection.overview}
                  </p>
                )}
              </div>

              {/* Right Column: Poster (Hidden on mobile) */}
              {posterUrl && (
                <div className="hidden lg:block lg:col-span-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <div className="relative aspect-[2/3] w-full max-w-md ml-auto rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 rotate-2 hover:rotate-0 transition-transform duration-700">
                    <Image
                      src={posterUrl}
                      alt={`${collection.name} Poster`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1200px) 50vw, 33vw"
                      quality={90}
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-10 px-4 md:px-12 pb-24">
          <div className="max-w-8xl mx-auto">

            {/* Timeline Header */}
            <div className="flex items-end gap-4 mb-10 px-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                <span className="w-1.5 h-8 bg-primary rounded-full" />
                Chronological Order
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent mb-2" />
            </div>

            {/* Movies Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
              {sortedMovies.map((movie, index) => {
                const releaseYear = movie.release_date?.slice(0, 4) || 'Unknown';

                return (
                  <div
                    key={movie.id}
                    className="relative group animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Connector Line (Desktop) */}
                    {index < sortedMovies.length - 1 && (
                      <div className="hidden lg:block absolute top-[40%] -right-4 w-8 h-0.5 bg-white/5 z-0" />
                    )}

                    {/* Movie Number Badge */}
                    <div className="absolute -top-3 -left-3 z-20 w-10 h-10 rounded-xl bg-netflix-dark border border-white/10 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <span className="font-display text-xl text-white/50 group-hover:text-primary transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="relative z-10">
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
