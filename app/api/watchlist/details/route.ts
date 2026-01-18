import { NextRequest, NextResponse } from 'next/server';
import { tmdbClient } from '@/lib/tmdb/client';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes (TMDB data is stable, but user data changes)

// Add cache headers for better performance
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

interface WatchlistItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  status?: 'watching' | 'completed' | 'plan_to_watch';
  added_at?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: WatchlistItem[] = body.items || [];

    if (items.length === 0) {
      return NextResponse.json({ items: [] }, { headers: CACHE_HEADERS });
    }

    // Fetch details for all items in parallel (with rate limiting)
    const detailsPromises = items.map(async (item) => {
      try {
        if (item.media_type === 'movie') {
          const movie = await tmdbClient.getMovieDetails(item.tmdb_id);
          return {
            ...item,
            details: movie,
          };
        } else {
          const tv = await tmdbClient.getTVDetails(item.tmdb_id);
          return {
            ...item,
            details: tv,
          };
        }
      } catch (error) {
        console.error(`Error fetching details for ${item.media_type} ${item.tmdb_id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(detailsPromises);
    const validItems = results.filter((item) => item !== null);

    return NextResponse.json({ items: validItems }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching watchlist details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch details' },
      { status: 500 }
    );
  }
}
