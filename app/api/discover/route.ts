import { NextRequest, NextResponse } from 'next/server';
import { tmdbClient } from '@/lib/tmdb/client';

// Ensure this route is always dynamic and respects query parameters
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable static revalidation completely

// No caching for discover API - filters need to work on every request
// The TMDB API is fast enough and we need query params to be respected
const getCacheHeaders = (request: NextRequest) => {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    // Add a custom header with search params for debugging
    'X-Query-Params': request.nextUrl.search.slice(0, 100) || 'none',
  };
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Media type: 'movie', 'tv', or 'all'
    const mediaType = searchParams.get('media_type') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);

    // Filter parameters
    const genres = searchParams.get('genres'); // comma-separated genre IDs
    const yearFrom = searchParams.get('year_from');
    const yearTo = searchParams.get('year_to');
    const ratingMin = searchParams.get('rating_min');
    const voteCountMin = searchParams.get('vote_count_min');
    const language = searchParams.get('language');
    const sortBy = searchParams.get('sort_by') || 'popularity.desc';
    const runtimeMin = searchParams.get('runtime_min');
    const runtimeMax = searchParams.get('runtime_max');
    const withoutGenres = searchParams.get('without_genres');

    // Build TMDB discover parameters
    const buildDiscoverParams = (type: 'movie' | 'tv') => {
      const params: Record<string, string> = {
        page: page.toString(),
        sort_by: sortBy,
      };

      // Genre filters
      if (genres) {
        params.with_genres = genres;
      }
      if (withoutGenres) {
        params.without_genres = withoutGenres;
      }

      // Year filters
      if (type === 'movie') {
        if (yearFrom && yearTo) {
          params['primary_release_date.gte'] = `${yearFrom}-01-01`;
          params['primary_release_date.lte'] = `${yearTo}-12-31`;
        } else if (yearFrom) {
          params.primary_release_year = yearFrom;
        }
      } else {
        if (yearFrom && yearTo) {
          params['first_air_date.gte'] = `${yearFrom}-01-01`;
          params['first_air_date.lte'] = `${yearTo}-12-31`;
        } else if (yearFrom) {
          params.first_air_date_year = yearFrom;
        }
      }

      // Rating filters
      if (ratingMin) {
        params['vote_average.gte'] = ratingMin;
      }
      if (voteCountMin) {
        params['vote_count.gte'] = voteCountMin;
      }

      // Language
      if (language) {
        params.with_original_language = language;
      }

      // Runtime
      if (runtimeMin) {
        params['with_runtime.gte'] = runtimeMin;
      }
      if (runtimeMax) {
        params['with_runtime.lte'] = runtimeMax;
      }

      return params;
    };

    let movieResults = null;
    let tvResults = null;

    // Fetch movies if needed
    if (mediaType === 'all' || mediaType === 'movie') {
      try {
        const movieParams = buildDiscoverParams('movie');
        movieResults = await tmdbClient.discoverMovies(movieParams);
      } catch (error) {
        console.error('Error discovering movies:', error);
        movieResults = { results: [], total_pages: 0, total_results: 0 };
      }
    }

    // Fetch TV shows if needed
    if (mediaType === 'all' || mediaType === 'tv') {
      try {
        const tvParams = buildDiscoverParams('tv');
        tvResults = await tmdbClient.discoverTV(tvParams);
      } catch (error) {
        console.error('Error discovering TV:', error);
        tvResults = { results: [], total_pages: 0, total_results: 0 };
      }
    }

    // Combine results if both requested
    if (mediaType === 'all') {
      const combinedResults = [
        ...(movieResults?.results || []).map((m: any) => ({ ...m, media_type: 'movie' })),
        ...(tvResults?.results || []).map((t: any) => ({ ...t, media_type: 'tv' })),
      ];

      // Sort combined results based on sortBy
      // Note: This is a simplified sort - TMDB handles sorting better on their end
      if (sortBy === 'release_date.desc' || sortBy === 'release_date.asc') {
        combinedResults.sort((a, b) => {
          const dateA = a.release_date || a.first_air_date || '';
          const dateB = b.release_date || b.first_air_date || '';
          return sortBy === 'release_date.desc'
            ? dateB.localeCompare(dateA)
            : dateA.localeCompare(dateB);
        });
      } else if (sortBy === 'vote_average.desc' || sortBy === 'vote_average.asc') {
        combinedResults.sort((a, b) => {
          return sortBy === 'vote_average.desc'
            ? (b.vote_average || 0) - (a.vote_average || 0)
            : (a.vote_average || 0) - (b.vote_average || 0);
        });
      }

      const totalResults = (movieResults?.total_results || 0) + (tvResults?.total_results || 0);
      const totalPages = Math.max(movieResults?.total_pages || 0, tvResults?.total_pages || 0);

      return NextResponse.json(
        {
          results: combinedResults,
          total_results: totalResults,
          total_pages: totalPages,
          page,
          movie_count: movieResults?.total_results || 0,
          tv_count: tvResults?.total_results || 0,
        },
        { headers: getCacheHeaders(request) }
      );
    }

    // Return single media type results
    const results = mediaType === 'movie' ? movieResults : tvResults;
    return NextResponse.json(results, { headers: getCacheHeaders(request) });
  } catch (error) {
    console.error('Error in discover API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to discover content',
        details: errorMessage,
        results: [],
        total_results: 0,
        total_pages: 0,
      },
      { status: 500 }
    );
  }
}
