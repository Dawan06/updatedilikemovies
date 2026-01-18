import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  getUserWatchlist, 
  addToWatchlist as addToWatchlistDB, 
  removeFromWatchlist as removeFromWatchlistDB,
  updateWatchlistStatus as updateWatchlistStatusDB
} from '@/lib/supabase/helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // No caching for user-specific data

// GET - Fetch user's watchlist
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[GET /api/watchlist] Fetching watchlist for user: ${userId}`);
    const watchlist = await getUserWatchlist(userId);
    
    console.log(`[GET /api/watchlist] Returning ${watchlist.length} items`);
    return NextResponse.json({ items: watchlist });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error && 'details' in error ? String(error.details) : undefined;
    
    console.error('[GET /api/watchlist] Error fetching watchlist:', {
      error: errorMessage,
      details: errorDetails,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch watchlist',
        details: errorMessage,
        ...(errorDetails && { errorDetails }),
      },
      { status: 500 }
    );
  }
}

// POST - Add item to watchlist
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
    const { tmdb_id, media_type, status } = body;

    if (!tmdb_id || !media_type) {
      return NextResponse.json(
        { error: 'Missing required fields: tmdb_id, media_type' },
        { status: 400 }
      );
    }

    console.log('Adding to watchlist:', { userId, tmdb_id, media_type, status: status || 'plan_to_watch' });
    
    const item = await addToWatchlistDB(
      userId,
      tmdb_id,
      media_type,
      status || 'plan_to_watch'
    );

    console.log('Successfully added to watchlist:', item);
    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error && 'details' in error ? String(error.details) : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to add to watchlist',
        details: errorMessage,
        ...(errorDetails && { errorDetails }),
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from watchlist
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
    const { tmdb_id, media_type } = body;

    if (!tmdb_id || !media_type) {
      return NextResponse.json(
        { error: 'Missing required fields: tmdb_id, media_type' },
        { status: 400 }
      );
    }

    await removeFromWatchlistDB(userId, tmdb_id, media_type);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}

// PATCH - Batch add items (for imports)
export async function PATCH(request: NextRequest) {
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
        { error: 'Missing or empty items array' },
        { status: 400 }
      );
    }

    let added = 0;
    let skipped = 0;
    const errors: Array<{ item: { tmdb_id: number; media_type: string }; error: string }> = [];

    // Add items in parallel (with reasonable concurrency)
    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const promises = batch.map(async (item: { tmdb_id: number; media_type: 'movie' | 'tv' }) => {
        try {
          await addToWatchlistDB(userId, item.tmdb_id, item.media_type, 'plan_to_watch');
          added++;
        } catch (error: any) {
          const errorMessage = error?.message || String(error);
          
          // Distinguish between "already exists" vs actual errors
          // Check for duplicate/unique constraint violations or explicit "already" messages
          if (errorMessage?.includes('already') || 
              errorMessage?.includes('duplicate') ||
              error?.code === '23505' || // PostgreSQL unique violation
              errorMessage?.includes('UNIQUE constraint')) {
            skipped++;
          } else {
            // This is a real error (schema issue, network, etc.)
            console.error(`[PATCH /api/watchlist] Error adding item ${item.tmdb_id} (${item.media_type}):`, {
              error: errorMessage,
              code: error?.code,
              details: error?.details,
              hint: error?.hint,
            });
            errors.push({
              item: { tmdb_id: item.tmdb_id, media_type: item.media_type },
              error: errorMessage,
            });
            skipped++; // Still count as skipped for UI purposes
          }
        }
      });

      await Promise.all(promises);
    }

    // Log summary
    if (errors.length > 0) {
      console.error(`[PATCH /api/watchlist] Failed to add ${errors.length} items. First few errors:`, errors.slice(0, 5));
      console.error(`[PATCH /api/watchlist] Sample error details:`, errors[0]);
    }

    // If all items failed, return error response to help debugging
    if (added === 0 && skipped === items.length && errors.length > 0) {
      return NextResponse.json({ 
        success: false,
        added: 0,
        skipped,
        total: items.length,
        error: 'All items failed to add. Check errors array for details.',
        errorCount: errors.length,
        errors: errors.slice(0, 20), // Include first 20 errors for debugging
        sampleError: errors[0] // Include first error for quick debugging
      }, { status: 207 }); // 207 Multi-Status - partial failure
    }

    return NextResponse.json({ 
      success: true,
      added,
      skipped,
      total: items.length,
      ...(errors.length > 0 && { 
        errorCount: errors.length,
        errors: errors.slice(0, 10), // Include first 10 errors for debugging
        warning: `${errors.length} items had errors but were counted as skipped`
      })
    });
  } catch (error) {
    console.error('Error batch adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to batch add to watchlist' },
      { status: 500 }
    );
  }
}

// PUT - Update watchlist item status
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tmdb_id, media_type, status } = body;

    if (!tmdb_id || !media_type || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: tmdb_id, media_type, status' },
        { status: 400 }
      );
    }

    if (!['watching', 'completed', 'plan_to_watch'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: watching, completed, or plan_to_watch' },
        { status: 400 }
      );
    }

    const item = await updateWatchlistStatusDB(
      userId,
      tmdb_id,
      media_type,
      status
    );

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error updating watchlist status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to update watchlist status',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
