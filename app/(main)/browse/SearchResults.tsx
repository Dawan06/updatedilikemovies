import { cachedTmdbClient } from '@/lib/tmdb/cached-client';
import MovieCard from '@/components/movie-card/MovieCard';
import SearchPagination from './SearchPagination';
import { MediaItem } from '@/types';
import FilterBadges from './FilterBadges';
import Link from 'next/link';
import Image from 'next/image';
import { Film, ChevronRight } from 'lucide-react';
import { highlightSearchTerm } from '@/lib/utils/search-highlight';

async function getGenres() {
  const [movieGenresData, tvGenresData] = await Promise.all([
    cachedTmdbClient.getMovieGenres().catch(() => ({ genres: [] })),
    cachedTmdbClient.getTVGenres().catch(() => ({ genres: [] })),
  ]);
  return {
    movieGenres: movieGenresData.genres || [],
    tvGenres: tvGenresData.genres || [],
  };
}

interface SearchResultsProps {
  query: string;
  page: number;
  filters?: {
    media_type?: string;
    genres?: string;
    year_from?: string;
    year_to?: string;
    rating_min?: string;
    language?: string;
    sort_by?: string;
  };
}

function applyFilters(results: MediaItem[], filters: SearchResultsProps['filters']): MediaItem[] {
  if (!filters) return results;

  let filtered = [...results];

  // Filter by media type
  if (filters.media_type && filters.media_type !== 'all') {
    filtered = filtered.filter(item => item.media_type === filters.media_type);
  }

  // Filter by genres (if item has genre_ids)
  if (filters.genres) {
    const genreIds = filters.genres.split(',').map(Number).filter(Boolean);
    if (genreIds.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.genre_ids || item.genre_ids.length === 0) return false;
        return genreIds.some(genreId => item.genre_ids.includes(genreId));
      });
    }
  }

  // Filter by year range
  if (filters.year_from || filters.year_to) {
    filtered = filtered.filter(item => {
      const date = item.release_date || item.first_air_date;
      if (!date) return false;

      const year = parseInt(date.slice(0, 4), 10);
      if (isNaN(year)) return false;

      if (filters.year_from && year < parseInt(filters.year_from, 10)) return false;
      if (filters.year_to && year > parseInt(filters.year_to, 10)) return false;
      return true;
    });
  }

  // Filter by rating
  if (filters.rating_min) {
    const minRating = parseFloat(filters.rating_min);
    filtered = filtered.filter(item => item.vote_average >= minRating);
  }

  // Filter by language
  if (filters.language) {
    filtered = filtered.filter(item => item.original_language === filters.language);
  }

  // Sort results
  if (filters.sort_by) {
    filtered.sort((a, b) => {
      switch (filters.sort_by) {
        case 'popularity.desc':
          return (b.popularity || 0) - (a.popularity || 0);
        case 'popularity.asc':
          return (a.popularity || 0) - (b.popularity || 0);
        case 'vote_average.desc':
          return (b.vote_average || 0) - (a.vote_average || 0);
        case 'vote_average.asc':
          return (a.vote_average || 0) - (b.vote_average || 0);
        case 'release_date.desc':
          const dateA = new Date(a.release_date || a.first_air_date || '').getTime();
          const dateB = new Date(b.release_date || b.first_air_date || '').getTime();
          return dateB - dateA;
        case 'release_date.asc':
          const dateA2 = new Date(a.release_date || a.first_air_date || '').getTime();
          const dateB2 = new Date(b.release_date || b.first_air_date || '').getTime();
          return dateA2 - dateB2;
        default:
          return 0;
      }
    });
  }

  return filtered;
}

export default async function SearchResults({ query, page, filters }: SearchResultsProps) {
  // Fetch everything in parallel
  // Only search collections on page 1 and when not filtered by specific media type (logic: collections usually implies 'all')
  const shouldSearchCollections = page === 1 && (!filters?.media_type || filters.media_type === 'all');

  const [results, collectionData, { movieGenres, tvGenres }] = await Promise.all([
    cachedTmdbClient.searchMulti(query, page),
    shouldSearchCollections
      ? cachedTmdbClient.searchCollections(query).catch(() => ({ results: [], total_pages: 0, total_results: 0 }))
      : Promise.resolve({ results: [], total_pages: 0, total_results: 0 }),
    getGenres()
  ]);

  // Apply filters to search results
  const filteredResults = applyFilters(results.results, filters);
  const totalFiltered = filteredResults.length;
  const totalPages = results.total_pages || 1;
  const totalResults = results.total_results || 0;

  // Check if any filters are active
  const hasActiveFilters = filters && (
    (filters.media_type && filters.media_type !== 'all') ||
    filters.genres ||
    filters.year_from ||
    filters.year_to ||
    filters.rating_min ||
    filters.language ||
    (filters.sort_by && filters.sort_by !== 'popularity.desc')
  );

  const collections = collectionData.results.slice(0, 8); // Show top 8 collections

  return (
    <div className="pt-8 pb-12 px-4 md:px-8 lg:px-12">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-primary rounded-full" />
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Search Results for &quot;<span className="text-primary">{query}</span>&quot;
          </h1>
        </div>
        {totalResults > 0 && (
          <p className="text-gray-400 text-sm ml-4">
            {totalResults.toLocaleString()} {totalResults === 1 ? 'result' : 'results'} found
            {hasActiveFilters && filteredResults.length !== totalResults && (
              <span className="ml-2">
                ({filteredResults.length} after filters)
              </span>
            )}
          </p>
        )}
      </div>

      {/* Show active filters */}
      {hasActiveFilters && (
        <div className="mb-8">
          <FilterBadges filters={filters} query={query} movieGenres={movieGenres} tvGenres={tvGenres} />
        </div>
      )}

      {/* Franchise/Collection Results Section */}
      {collections.length > 0 && (
        <div className="mb-12 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold text-white">Franchises & Collections</h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
          </div>
          <div className="overflow-x-auto scrollbar-hide -mx-4 md:-mx-8 lg:-mx-12 px-4 md:px-8 lg:px-12">
            <div className="flex gap-4 pb-4" style={{ scrollSnapType: 'x mandatory' }}>
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/franchise/${collection.id}`}
                  className="group relative flex-shrink-0 w-[280px] md:w-[320px] aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {collection.backdrop_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w780${collection.backdrop_path}`}
                      alt={collection.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 280px, 320px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-netflix-gray to-netflix-dark flex items-center justify-center">
                      <Film className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-lg md:text-xl leading-tight group-hover:text-primary transition-colors mb-2 line-clamp-2">
                      {highlightSearchTerm(collection.name, query)}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white/70 uppercase tracking-wider bg-white/10 px-2 py-1 rounded">
                        Collection
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Results Section */}
      {filteredResults.length === 0 && collections.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2 font-medium">
              {hasActiveFilters
                ? 'No results match your search and filters'
                : 'No results found'}
            </p>
            {hasActiveFilters ? (
              <p className="text-gray-500 text-sm">
                Try adjusting your filters or search query to find what you're looking for.
              </p>
            ) : (
              <p className="text-gray-500 text-sm">
                Try a different search term or browse our collection.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {filteredResults.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h2 className="text-2xl font-bold text-white">
                  {collections.length > 0 ? 'Movies & TV Shows' : 'Results'}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
                <span className="text-gray-400 text-sm">
                  {filteredResults.length} {filteredResults.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 mb-8">
            {filteredResults.map((item) => (
              <MovieCard
                key={`${item.media_type}-${item.id}`}
                item={item}
                mediaType={item.media_type}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12">
              <SearchPagination
                currentPage={page}
                totalPages={totalPages}
                query={query}
                filters={filters}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
