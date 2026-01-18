import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { updateViewingProgress, getViewingProgress } from '@/lib/supabase/helpers';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tmdb_id, media_type, progress, season_number, episode_number } = body;

    if (!tmdb_id || !media_type || progress === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await updateViewingProgress(
      userId,
      tmdb_id,
      media_type,
      progress,
      season_number || undefined,
      episode_number || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating viewing progress:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to update viewing progress',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tmdb_id = searchParams.get('tmdb_id');
    const media_type = searchParams.get('media_type') as 'movie' | 'tv' | null;
    const season_number = searchParams.get('season_number');
    const episode_number = searchParams.get('episode_number');

    if (!tmdb_id || !media_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const progress = await getViewingProgress(
      userId,
      parseInt(tmdb_id, 10),
      media_type,
      season_number ? parseInt(season_number, 10) : undefined,
      episode_number ? parseInt(episode_number, 10) : undefined
    );

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching viewing progress:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch viewing progress',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
