import { NextRequest, NextResponse } from 'next/server';
import { vidsrcClient } from '@/lib/vidsrc/vidsrc-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tmdbId = searchParams.get('tmdb_id');
  const mediaType = searchParams.get('media_type') as 'movie' | 'tv' | null;
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');

  if (!tmdbId || !mediaType) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    let sources;

    if (mediaType === 'movie') {
      sources = await vidsrcClient.getMovieSources(parseInt(tmdbId, 10));
    } else if (mediaType === 'tv') {
      // Default to season 1, episode 1 if not specified
      const s = season ? parseInt(season, 10) : 1;
      const e = episode ? parseInt(episode, 10) : 1;
      sources = await vidsrcClient.getTVSources(parseInt(tmdbId, 10), s, e);
    } else {
      return NextResponse.json(
        { error: 'Invalid media type' },
        { status: 400 }
      );
    }

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Error fetching video sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video sources' },
      { status: 500 }
    );
  }
}
