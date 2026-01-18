import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserWatchlist, addToWatchlist } from '@/lib/supabase/helpers';

export const dynamic = 'force-dynamic';

interface LocalStorageItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  added_at?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const localItems: LocalStorageItem[] = body.items || [];

    if (localItems.length === 0) {
      // Just return existing watchlist
      const watchlist = await getUserWatchlist(userId);
      return NextResponse.json({ 
        items: watchlist,
        migrated: 0,
        skipped: 0
      });
    }

    // Get existing watchlist from Supabase
    const existingWatchlist = await getUserWatchlist(userId);
    const existingKeys = new Set(
      existingWatchlist.map(item => `${item.tmdb_id}-${item.media_type}`)
    );

    // Add items from localStorage that don't exist in Supabase
    let migrated = 0;
    let skipped = 0;

    for (const localItem of localItems) {
      const key = `${localItem.tmdb_id}-${localItem.media_type}`;
      
      // Skip if already exists in Supabase
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }

      try {
        await addToWatchlist(
          userId,
          localItem.tmdb_id,
          localItem.media_type,
          'plan_to_watch'
        );
        migrated++;
      } catch (error) {
        console.error(`Error migrating item ${key}:`, error);
        skipped++;
      }
    }

    // Return updated watchlist
    const updatedWatchlist = await getUserWatchlist(userId);

    return NextResponse.json({
      items: updatedWatchlist,
      migrated,
      skipped,
      message: migrated > 0 
        ? `Migrated ${migrated} item${migrated === 1 ? '' : 's'} to cloud` 
        : 'No new items to migrate'
    });
  } catch (error) {
    console.error('Error syncing watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to sync watchlist' },
      { status: 500 }
    );
  }
}
