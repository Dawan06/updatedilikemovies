import { NextRequest, NextResponse } from 'next/server';
import { tmdbClient } from '@/lib/tmdb/client';

// Allow ISR for TMDB data - no need to force dynamic
export const revalidate = 3600; // Cache for 1 hour

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'movie';

  if (!id) {
    return NextResponse.json(
      { error: 'Missing id parameter' },
      { status: 400 }
    );
  }

  try {
    const tmdbId = parseInt(id, 10);
    
    const videos = type === 'tv' 
      ? await tmdbClient.getTVVideos(tmdbId)
      : await tmdbClient.getMovieVideos(tmdbId);

    return NextResponse.json(videos, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
