import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { parseIMDbCSV, matchIMDbToTMDB } from '@/lib/importers/imdb';
import { parseLetterboxdCSV, matchLetterboxdToTMDB } from '@/lib/importers/letterboxd';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const source = formData.get('source') as string;

    if (!file || !source) {
      return NextResponse.json(
        { error: 'Missing file or source' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();

    // Debug: log file info
    console.log(`Import request: source=${source}, fileSize=${file.size}, lines=${fileContent.split('\n').length}`);

    let matches: Array<{
      tmdbId: number | null;
      mediaType: 'movie' | 'tv';
    }> = [];

    if (source === 'imdb') {
      const items = await parseIMDbCSV(fileContent);
      console.log(`Parsed ${items.length} IMDb items`);

      if (items.length === 0) {
        return NextResponse.json(
          { error: 'No valid items found in CSV. Make sure you exported your watchlist from IMDb correctly.' },
          { status: 400 }
        );
      }

      const matched = await matchIMDbToTMDB(items);
      matches = matched.map((m) => ({
        tmdbId: m.tmdbId,
        mediaType: m.mediaType,
      }));
    } else if (source === 'letterboxd') {
      const items = await parseLetterboxdCSV(fileContent);
      console.log(`Parsed ${items.length} Letterboxd items`);

      if (items.length === 0) {
        return NextResponse.json(
          { error: 'No valid items found in CSV. Make sure you exported your data from Letterboxd correctly.' },
          { status: 400 }
        );
      }

      const matched = await matchLetterboxdToTMDB(items);
      matches = matched.map((m) => ({
        tmdbId: m.tmdbId,
        mediaType: m.mediaType,
      }));
    } else {
      return NextResponse.json(
        { error: 'Invalid source' },
        { status: 400 }
      );
    }

    // Filter out items that couldn't be matched
    const validMatches = matches.filter((m) => m.tmdbId !== null);

    console.log(`Matched ${validMatches.length} of ${matches.length} items to TMDB`);

    // Return matched items - client will store them in localStorage
    return NextResponse.json({
      success: true,
      total: matches.length,
      matched: validMatches.length,
      failed: matches.filter((m) => m.tmdbId === null).length,
      // Return the actual matched items for client to store
      items: validMatches.map((m) => ({
        tmdb_id: m.tmdbId,
        media_type: m.mediaType,
      })),
    });
  } catch (error) {
    console.error('Error importing watchlist:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: `Import failed: ${errorMessage}`,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
