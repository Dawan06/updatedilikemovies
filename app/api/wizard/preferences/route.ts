import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserWatchlist, getViewingHistory } from '@/lib/supabase/helpers';
import { analyzeUserPreferences } from '@/lib/wizard/preferenceEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's watchlist and viewing history
    const [watchlist, viewingHistory] = await Promise.all([
      getUserWatchlist(userId).catch(() => []),
      getViewingHistory(userId).catch(() => []),
    ]);

    // Analyze preferences
    const preferences = await analyzeUserPreferences(watchlist, viewingHistory);

    return NextResponse.json(preferences, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch preferences',
        details: errorMessage,
        // Return default preferences as fallback
        default: {
          genres: [],
          decades: [],
          avgRating: 7.0,
          preferredRuntimes: ['standard'],
          excludedGenres: [],
          preferredMediaTypes: ['movie'],
        },
      },
      { status: 500 }
    );
  }
}
