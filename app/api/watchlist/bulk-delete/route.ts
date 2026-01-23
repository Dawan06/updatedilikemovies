import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { bulkRemoveFromWatchlist } from '@/lib/supabase/helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// DELETE - Bulk remove multiple items from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty items array. Expected: { items: Array<{tmdbId: number, mediaType: "movie"|"tv"}> }' },
        { status: 400 }
      );
    }

    // Validate items structure
    for (const item of items) {
      if (typeof item.tmdbId !== 'number' || !['movie', 'tv'].includes(item.mediaType)) {
        return NextResponse.json(
          { error: 'Invalid item structure. Each item must have: { tmdbId: number, mediaType: "movie"|"tv" }' },
          { status: 400 }
        );
      }
    }

    console.log(`[DELETE /api/watchlist/bulk-delete] Deleting ${items.length} items for user ${userId}`, {
      sample: items.slice(0, 3),
    });

    const deletedCount = await bulkRemoveFromWatchlist(userId, items);

    console.log(`[DELETE /api/watchlist/bulk-delete] Successfully deleted ${deletedCount} items`);
    return NextResponse.json({ 
      success: true,
      deleted: deletedCount,
      requested: items.length 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DELETE /api/watchlist/bulk-delete] Error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to bulk delete from watchlist',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
