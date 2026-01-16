import { NextRequest, NextResponse } from 'next/server';
import { getFranchiseCards } from '@/lib/franchise/detector';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

interface WatchlistItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
}

export async function GET(request: NextRequest) {
  try {
    // Get watchlist from query params (client will send it)
    const watchlistParam = request.nextUrl.searchParams.get('watchlist');
    
    let watchlist: WatchlistItem[] = [];
    if (watchlistParam) {
      try {
        watchlist = JSON.parse(watchlistParam);
      } catch {
        // Invalid JSON, use empty array
      }
    }

    const franchiseData = await getFranchiseCards(watchlist);

    return NextResponse.json({
      userFranchises: franchiseData.userFranchises,
      popularFranchises: franchiseData.popularFranchises,
      allFranchises: franchiseData.allFranchises,
    });
  } catch (error) {
    console.error('Error fetching franchises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch franchises' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const watchlist: WatchlistItem[] = body.watchlist || [];

    const franchiseData = await getFranchiseCards(watchlist);

    return NextResponse.json({
      userFranchises: franchiseData.userFranchises,
      popularFranchises: franchiseData.popularFranchises,
      allFranchises: franchiseData.allFranchises,
    });
  } catch (error) {
    console.error('Error fetching franchises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch franchises' },
      { status: 500 }
    );
  }
}
