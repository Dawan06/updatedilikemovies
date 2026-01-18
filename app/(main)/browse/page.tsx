import { tmdbClient } from '@/lib/tmdb/client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import DiscoverClient from './DiscoverClient';
import SearchResults from './SearchResults';

const DiscoverClientDynamic = dynamic(() => import('./DiscoverClient'), { ssr: false });

interface BrowsePageProps {
  searchParams: { 
    search?: string; 
    page?: string;
    media_type?: string;
    genres?: string;
    year_from?: string;
    year_to?: string;
    rating_min?: string;
    language?: string;
    sort_by?: string;
  };
}

async function BrowseContent({ searchParams }: BrowsePageProps) {
  // If search query exists, show search results with filters
  if (searchParams.search) {
    // Extract filter params to pass to SearchResults
    const filters = {
      media_type: searchParams.media_type,
      genres: searchParams.genres,
      year_from: searchParams.year_from,
      year_to: searchParams.year_to,
      rating_min: searchParams.rating_min,
      language: searchParams.language,
      sort_by: searchParams.sort_by,
    };
    
    return (
      <SearchResults 
        query={searchParams.search} 
        page={parseInt(searchParams.page || '1', 10)}
        filters={filters}
      />
    );
  }

  // Otherwise show filtered discover results
  const [movieGenresData, tvGenresData] = await Promise.all([
    tmdbClient.getMovieGenres().catch(() => ({ genres: [] })),
    tmdbClient.getTVGenres().catch(() => ({ genres: [] })),
  ]);

  const movieGenres = movieGenresData.genres || [];
  const tvGenres = tvGenresData.genres || [];

  return <DiscoverClientDynamic movieGenres={movieGenres} tvGenres={tvGenres} />;
}

export default function BrowsePage({ searchParams }: BrowsePageProps) {
  const hasSearch = !!searchParams.search;

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      {/* Page Header */}
      {!hasSearch && (
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Discover</h1>
          <p className="text-gray-400">
            Browse through thousands of movies and TV shows with powerful filters
          </p>
        </div>
      )}

      {/* Content */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3]" />
            ))}
          </div>
        }
      >
        <BrowseContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
