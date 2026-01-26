import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Create watch party room
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tmdb_id, media_type, season_number, episode_number, room_name } = body;

    if (!tmdb_id || !media_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const roomId = crypto.randomUUID();

    // Create room in database (you'd need to create this table)
    // For now, return a room ID that can be used for real-time sync
    return NextResponse.json({
      success: true,
      room_id: roomId,
      room_name: room_name || `Watch Party ${roomId.slice(0, 8)}`,
    });
  } catch (error) {
    console.error('Error creating watch party:', error);
    return NextResponse.json(
      { error: 'Failed to create watch party' },
      { status: 500 }
    );
  }
}

// Get watch party room
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const room_id = searchParams.get('room_id');

    if (!room_id) {
      return NextResponse.json(
        { error: 'Missing room_id' },
        { status: 400 }
      );
    }

    // Fetch room data (implementation depends on your database schema)
    return NextResponse.json({
      success: true,
      room: {
        room_id: room_id,
        // Add room data here
      },
    });
  } catch (error) {
    console.error('Error fetching watch party:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watch party' },
      { status: 500 }
    );
  }
}
