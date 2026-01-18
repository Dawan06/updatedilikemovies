import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getViewingHistory } from '@/lib/supabase/helpers';
import { tmdbClient } from '@/lib/tmdb/client';
import { Movie, TVShow } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // No caching for user-specific data

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all viewing history for the user
    const viewingHistory = await getViewingHistory(userId);

    // Filter for items with progress between 1% and 99% (incomplete but started)
    // For movies, we need runtime to calculate percentage
    // For TV shows, we track by episode progress
    const continueWatchingItems = viewingHistory.filter(item => {
      // For now, include items with any progress > 0
      // We'll refine this after fetching details with runtime
      return item.progress > 0;
    });

    // Sort by last_watched_at (most recent first)
    continueWatchingItems.sort((a, b) => 
      new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime()
    );

    // Limit to top 20 items
    const limitedItems = continueWatchingItems.slice(0, 20);

    // Fetch details for each item in parallel
    const itemsWithDetails = await Promise.all(
      limitedItems.map(async (item) => {
        try {
          let details: Movie | TVShow;
          let runtime: number | null = null;

          if (item.media_type === 'movie') {
            details = await tmdbClient.getMovieDetails(item.tmdb_id);
            runtime = details.runtime * 60; // Convert to seconds
          } else {
            details = await tmdbClient.getTVDetails(item.tmdb_id);
            // For TV shows, use episode runtime if available
            if (details.episode_run_time && details.episode_run_time.length > 0) {
              runtime = details.episode_run_time[0] * 60; // Convert to seconds
            }
          }

          // Calculate completion percentage
          let completionPercentage = 0;
          if (runtime && runtime > 0) {
            completionPercentage = Math.round((item.progress / runtime) * 100);
          }

          // Only include if progress is between 1% and 99%
          if (completionPercentage >= 1 && completionPercentage < 100) {
            return {
              ...item,
              details,
              completionPercentage,
              runtime,
            };
          }

          return null;
        } catch (error) {
          console.error(`Error fetching details for ${item.media_type} ${item.tmdb_id}:`, error);
          return null;
        }
      })
    );

    // Filter out nulls and return
    const validItems = itemsWithDetails.filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json({ items: validItems });
  } catch (error) {
    console.error('Error fetching continue watching:', error);
    return NextResponse.json(
      { error: 'Failed to fetch continue watching items' },
      { status: 500 }
    );
  }
}