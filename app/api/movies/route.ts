import { NextRequest, NextResponse } from 'next/server';
import { tmdbClient } from '@/lib/tmdb/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'trending';
  const page = parseInt(searchParams.get('page') || '1', 10);

  try {
    let results;

    switch (type) {
      case 'trending':
        results = await tmdbClient.getTrendingMovies(page);
        break;
      case 'popular':
        results = await tmdbClient.getPopularMovies(page);
        break;
      case 'top_rated':
        results = await tmdbClient.getTopRatedMovies(page);
        break;
      default:
        results = await tmdbClient.getTrendingMovies(page);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}
