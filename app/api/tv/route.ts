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
        results = await tmdbClient.getTrendingTV(page);
        break;
      case 'popular':
        results = await tmdbClient.getPopularTV(page);
        break;
      case 'top_rated':
        results = await tmdbClient.getTopRatedTV(page);
        break;
      default:
        results = await tmdbClient.getTrendingTV(page);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching TV shows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TV shows', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
