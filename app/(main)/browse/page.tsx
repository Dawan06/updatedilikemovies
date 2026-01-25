import { cachedTmdbClient } from '@/lib/tmdb/cached-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
// import DiscoverClient from './DiscoverClient'; // Deprecated
import BrowseClient from '@/components/browse/BrowseClient';
import SearchResults from './SearchResults';

// const DiscoverClientDynamic = dynamic(() => import('./DiscoverClient'), { ssr: false });

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
    cachedTmdbClient.getMovieGenres().catch(() => ({ genres: [] })),
    cachedTmdbClient.getTVGenres().catch(() => ({ genres: [] })),
  ]);

  const movieGenres = movieGenresData.genres || [];
  const tvGenres = tvGenresData.genres || [];

  return <BrowseClient movieGenres={movieGenres} tvGenres={tvGenres} />;
}

export default function BrowsePage({ searchParams }: BrowsePageProps) {
  // Render structure
  return (
    <div className="min-h-screen bg-netflix-black pb-20">
      {/* Content Container (Header is now inside BrowseClient for Discover mode) */}
      {/* Note: SearchResults probably has its own header or we might need one here if search is active. 
          The previous implementation had a header ONLY for !hasSearch. 
          BrowseClient now includes the header. 
          So for SearchResults, we might need to handle it.
      */}

      {/* If search is active, we render SearchResults which is wrapped in BrowseContent. 
          The old code had a separate header block in BrowsePage before the Suspense.
          BrowseClient handles its own header.
          If searchParams.search is present, BrowseContent returns SearchResults.
          So we just wrap BrowseContent in Suspense.
      */}

      <Suspense
        fallback={
          !searchParams.search ? (
            // Browse Skeleton (with header placeholder?)
            <div className="pt-24 px-4 md:px-12">
              <div className="h-16 w-64 bg-white/10 rounded-lg mb-8 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 18 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3]" />
                ))}
              </div>
            </div>
          ) : (
            // Search Skeleton
            <div className="pt-24 px-4 md:px-12">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 18 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3]" />
                ))}
              </div>
            </div>
          )
        }
      >
        <BrowseContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
