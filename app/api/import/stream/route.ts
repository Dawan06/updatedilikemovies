import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { parseIMDbCSV, matchIMDbToTMDB } from '@/lib/importers/imdb';
import { parseLetterboxdCSV, matchLetterboxdToTMDB } from '@/lib/importers/letterboxd';
import { batchAddToWatchlist } from '@/lib/supabase/watchlist';

export const dynamic = 'force-dynamic';

interface ProgressUpdate {
  type: 'parsing' | 'matching' | 'saving' | 'complete' | 'error';
  progress: number; // 0-100
  current: number;
  total: number;
  message: string;
  added?: number;
  skipped?: number;
  failed?: number;
  cached?: number;
  itemsPerSecond?: number;
  estimatedTimeRemaining?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const source = formData.get('source') as string;

    if (!file || !source) {
      return new NextResponse('Missing file or source', { status: 400 });
    }

    const fileContent = await file.text();
    const totalLines = fileContent.split('\n').length;

    // Create a ReadableStream that sends progress updates
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const encoder = new TextEncoder();

          // Helper to send SSE message
          const sendUpdate = (update: ProgressUpdate) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(update)}\n\n`)
            );
          };

          // Parse CSV
          sendUpdate({
            type: 'parsing',
            progress: 5,
            current: 0,
            total: totalLines,
            message: 'Parsing CSV file...',
          });

          let items: any[] = [];

          if (source === 'imdb') {
            items = await parseIMDbCSV(fileContent);
          } else if (source === 'letterboxd') {
            items = await parseLetterboxdCSV(fileContent);
          } else {
            throw new Error('Invalid source');
          }

          const itemCount = items.length;

          if (itemCount === 0) {
            sendUpdate({
              type: 'error',
              progress: 0,
              current: 0,
              total: 0,
              message: 'No valid items found in CSV',
            });
            controller.close();
            return;
          }

          // Match to TMDB with progress tracking
          let cachedCount = 0;
          let matchStartTime = Date.now();
          let lastProgressUpdate = 0;

          const progressCallback = (current: number, total: number, cached: number) => {
            cachedCount = cached;
            const now = Date.now();
            const elapsed = (now - matchStartTime) / 1000; // seconds
            const itemsPerSecond = current > 0 ? current / elapsed : 0;
            const remaining = total - current;
            const estimatedTimeRemaining = itemsPerSecond > 0 ? remaining / itemsPerSecond : 0;

            // Update progress every 10 items or every 500ms, whichever comes first
            if (current - lastProgressUpdate >= 10 || now - (matchStartTime + (lastProgressUpdate * 500)) >= 500) {
              const progressPercent = 10 + (current / total) * 40; // 10-50% for matching phase

              sendUpdate({
                type: 'matching',
                progress: progressPercent,
                current: current,
                total: total,
                message: `Matching ${current}/${total} items${cached > 0 ? ` (${cached} from cache)` : ''}...`,
                cached: cached,
                itemsPerSecond: Math.round(itemsPerSecond * 10) / 10,
                estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
              });

              lastProgressUpdate = current;
            }
          };

          // Include title in matched results
          let matched: Array<{
            tmdbId: number | null;
            mediaType: 'movie' | 'tv';
            title: string;
          }> = [];

          if (source === 'imdb') {
            const matchedItems = await matchIMDbToTMDB(items, progressCallback);
            matched = matchedItems.map((m) => ({
              tmdbId: m.tmdbId,
              mediaType: m.mediaType,
              title: m.imdbItem.title || 'Unknown Title',
            }));
          } else if (source === 'letterboxd') {
            const matchedItems = await matchLetterboxdToTMDB(items, progressCallback);
            matched = matchedItems.map((m) => ({
              tmdbId: m.tmdbId,
              mediaType: m.mediaType,
              title: m.letterboxdItem.Title || m.letterboxdItem.Name || 'Unknown Title',
            }));
          }

          const validMatches = matched.filter((m) => m.tmdbId !== null);
          const failedCount = matched.filter((m) => m.tmdbId === null).length;

          sendUpdate({
            type: 'matching',
            progress: 50,
            current: itemCount,
            total: itemCount,
            message: `Matched ${validMatches.length} of ${itemCount} items to TMDB${cachedCount > 0 ? ` (${cachedCount} from cache)` : ''}`,
            cached: cachedCount,
          });

          // Save to watchlist in optimized batches
          sendUpdate({
            type: 'saving',
            progress: 60,
            current: 0,
            total: validMatches.length,
            message: 'Saving items to your watchlist...',
          });

          let addedCount = 0;
          let skippedCount = 0;
          const batchSize = 100; // Large batch size for streaming
          const saveStartTime = Date.now();

          for (let i = 0; i < validMatches.length; i += batchSize) {
            const batch = validMatches.slice(i, i + batchSize);
            const batchItems = batch.map((m) => ({
              tmdb_id: m.tmdbId!,
              media_type: m.mediaType,
              title: m.title,
            }));

            try {
              const result = await batchAddToWatchlist(userId, batchItems);
              addedCount += result.added;
              skippedCount += result.skipped;
            } catch (error) {
              console.error(`Error adding batch ${i / batchSize + 1}:`, error);
              // Continue with next batch even if this one fails
              skippedCount += batch.length;
            }

            // Update progress with rate calculation
            const processed = Math.min(i + batchSize, validMatches.length);
            const progressPercent = 60 + (processed / validMatches.length) * 35;
            const elapsed = (Date.now() - saveStartTime) / 1000;
            const itemsPerSecond = processed > 0 ? processed / elapsed : 0;
            const remaining = validMatches.length - processed;
            const estimatedTimeRemaining = itemsPerSecond > 0 ? remaining / itemsPerSecond : 0;

            sendUpdate({
              type: 'saving',
              progress: progressPercent,
              current: processed,
              total: validMatches.length,
              message: `Saved ${addedCount} items (${processed}/${validMatches.length})`,
              added: addedCount,
              skipped: skippedCount,
              failed: failedCount,
              itemsPerSecond: Math.round(itemsPerSecond * 10) / 10,
              estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
            });
          }

          // Complete
          sendUpdate({
            type: 'complete',
            progress: 100,
            current: validMatches.length,
            total: validMatches.length,
            message: 'Import complete!',
            added: addedCount,
            skipped: skippedCount,
            failed: failedCount,
          });

          controller.close();
        } catch (error) {
          const encoder = new TextEncoder();
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                progress: 0,
                current: 0,
                total: 0,
                message: `Import failed: ${errorMessage}`,
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream error:', error);
    return new NextResponse('Stream error', { status: 500 });
  }
}
