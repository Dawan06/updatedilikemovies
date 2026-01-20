import { NextRequest, NextResponse } from 'next/server';
import { cachedTmdbClient } from '@/lib/tmdb/cached-client';

// Allow ISR for TMDB data - no need to force dynamic
export const revalidate = 3600; // Cache for 1 hour

// Cache headers for CDN caching on Netlify
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'trending';
  const page = parseInt(searchParams.get('page') || '1', 10);

  try {
    let results;

    switch (type) {
      case 'trending':
        results = await cachedTmdbClient.getTrendingMovies(page);
        break;
      case 'popular':
        results = await cachedTmdbClient.getPopularMovies(page);
        break;
      case 'top_rated':
        results = await cachedTmdbClient.getTopRatedMovies(page);
        break;
      default:
        results = await cachedTmdbClient.getTrendingMovies(page);
    }

    return NextResponse.json(results, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}
