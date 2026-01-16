import { NextRequest, NextResponse } from 'next/server';
import { tmdbClient } from '@/lib/tmdb/client';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes (TMDB data is stable, but user data changes)

interface WatchlistItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: WatchlistItem[] = body.items || [];

    if (items.length === 0) {
      return NextResponse.json({ items: [] });
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

    return NextResponse.json({ items: validItems });
  } catch (error) {
    console.error('Error fetching watchlist details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch details' },
      { status: 500 }
    );
  }
}
