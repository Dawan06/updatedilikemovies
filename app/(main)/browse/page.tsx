import { tmdbClient } from '@/lib/tmdb/client';
import MovieCard from '@/components/movie-card/MovieCard';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface BrowsePageProps {
  searchParams: { search?: string; page?: string };
}

function BrowseContent({ searchQuery, page }: { searchQuery?: string; page: number }) {
  if (searchQuery) {
    return <SearchResults query={searchQuery} page={page} />;
  }

  return (
    <div className="space-y-12">
      <TrendingSection page={page} />
      <PopularSection page={page} />
      <TopRatedSection page={page} />
    </div>
  );
}

async function SearchResults({ query, page }: { query: string; page: number }) {
  const results = await tmdbClient.searchMulti(query, page);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">
        Search Results for &quot;{query}&quot;
      </h1>
      {results.results.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No results found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.results.map((item) => (
            <MovieCard
              key={`${item.media_type}-${item.id}`}
              item={item}
              mediaType={item.media_type}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function TrendingSection({ page }: { page: number }) {
  const [movies, tv] = await Promise.all([
    tmdbClient.getTrendingMovies(page),
    tmdbClient.getTrendingTV(page),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Trending Movies</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.results.map((movie) => (
            <MovieCard key={movie.id} item={movie} mediaType="movie" />
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Trending TV Shows</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tv.results.map((show) => (
            <MovieCard key={show.id} item={show} mediaType="tv" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function PopularSection({ page }: { page: number }) {
  const [movies, tv] = await Promise.all([
    tmdbClient.getPopularMovies(page),
    tmdbClient.getPopularTV(page),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Popular Movies</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.results.map((movie) => (
            <MovieCard key={movie.id} item={movie} mediaType="movie" />
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Popular TV Shows</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tv.results.map((show) => (
            <MovieCard key={show.id} item={show} mediaType="tv" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function TopRatedSection({ page }: { page: number }) {
  const [movies, tv] = await Promise.all([
    tmdbClient.getTopRatedMovies(page),
    tmdbClient.getTopRatedTV(page),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Top Rated Movies</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.results.map((movie) => (
            <MovieCard key={movie.id} item={movie} mediaType="movie" />
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Top Rated TV Shows</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tv.results.map((show) => (
            <MovieCard key={show.id} item={show} mediaType="tv" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage({ searchParams }: BrowsePageProps) {
  const searchQuery = searchParams.search;
  const page = parseInt(searchParams.page || '1', 10);

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <Suspense
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3]" />
            ))}
          </div>
        }
      >
        <BrowseContent searchQuery={searchQuery} page={page} />
      </Suspense>
    </div>
  );
}
