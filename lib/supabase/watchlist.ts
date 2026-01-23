import { createServiceClient } from './server';

export interface BatchAddResult {
  added: number;
  skipped: number;
}

export interface WatchlistItemToAdd {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
}

/**
 * Add multiple items to watchlist
 * Uses direct insert with conflict handling to insert new items and skip existing ones
 */
export async function batchAddToWatchlist(
  userId: string,
  items: WatchlistItemToAdd[]
): Promise<BatchAddResult> {
  if (items.length === 0) return { added: 0, skipped: 0 };

  const supabase = createServiceClient();

  console.log(`[batchAddToWatchlist] Starting - User: ${userId}, Items: ${items.length}`);

  // Step 1: Check which items ALREADY exist in the database
  const tmdbIds = items.map(i => i.tmdb_id);
  const { data: existingItems, error: queryError } = await supabase
    .from('watchlist')
    .select('tmdb_id,media_type')
    .eq('user_id', userId)
    .in('tmdb_id', tmdbIds);

  if (queryError) {
    console.error(`[batchAddToWatchlist] Error querying existing items:`, queryError);
  }

  // Build a set of existing items
  const existingSet = new Set<string>();
  if (existingItems) {
    existingItems.forEach(item => {
      existingSet.add(`${item.tmdb_id}:${item.media_type}`);
    });
  }

  console.log(`[batchAddToWatchlist] Found ${existingSet.size} items already in database`);

  // Step 2: Filter to only items that DON'T already exist
  const newItems = items.filter(item => {
    const key = `${item.tmdb_id}:${item.media_type}`;
    return !existingSet.has(key);
  });

  console.log(`[batchAddToWatchlist] Will insert ${newItems.length} new items (${items.length - newItems.length} already exist)`);

  if (newItems.length === 0) {
    // All items already exist, nothing to insert
    return {
      added: 0,
      skipped: items.length,
    };
  }

  // Step 3: Prepare items for insert (including title)
  const itemsToInsert = newItems.map((item) => ({
    user_id: userId,
    tmdb_id: item.tmdb_id,
    media_type: item.media_type,
    title: item.title,
    status: 'plan_to_watch' as const,
    added_at: new Date().toISOString(),
  }));

  // Step 4: Insert in batches
  const batchSize = 100;
  let totalBatches = 0;
  let successfulInserts = 0;
  let failedInserts = 0;

  for (let i = 0; i < itemsToInsert.length; i += batchSize) {
    const batch = itemsToInsert.slice(i, i + batchSize);
    totalBatches++;

    const { data: insertedData, error: batchError } = await supabase
      .from('watchlist')
      .insert(batch)
      .select('id');

    if (batchError) {
      console.error(`[batchAddToWatchlist] Error in batch ${totalBatches}:`, batchError);
      failedInserts += batch.length;
    } else {
      successfulInserts += insertedData?.length || batch.length;
      console.log(`[batchAddToWatchlist] Batch ${totalBatches}: Inserted ${insertedData?.length || batch.length} items`);
    }
  }

  console.log(`[batchAddToWatchlist] Completed ${totalBatches} batches`);
  console.log(`[batchAddToWatchlist] Successfully inserted: ${successfulInserts}`);

  if (failedInserts > 0) {
    console.warn(`[batchAddToWatchlist] Failed to insert: ${failedInserts}`);
  }

  // Step 5: Calculate final results
  const alreadyExisted = items.length - newItems.length;
  const skippedCount = alreadyExisted + failedInserts;

  console.log(`[batchAddToWatchlist] FINAL RESULT:`);
  console.log(`[batchAddToWatchlist] - Total items in request: ${items.length}`);
  console.log(`[batchAddToWatchlist] - Actually inserted: ${successfulInserts}`);
  console.log(`[batchAddToWatchlist] - Already existed: ${alreadyExisted}`);
  console.log(`[batchAddToWatchlist] - Failed: ${failedInserts}`);

  return {
    added: successfulInserts,
    skipped: skippedCount,
  };
}

