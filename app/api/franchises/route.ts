import { NextRequest, NextResponse } from 'next/server';
import { getFranchiseCards } from '@/lib/franchise/detector';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

interface WatchlistItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
}

export async function GET(request: NextRequest) {
  try {
    // Get watchlist from query params (client will send it)
    const watchlistParam = request.nextUrl.searchParams.get('watchlist');
    const pageParam = request.nextUrl.searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const itemsPerPage = 20;
    
    let watchlist: WatchlistItem[] = [];
    if (watchlistParam) {
      try {
        watchlist = JSON.parse(watchlistParam);
      } catch {
        // Invalid JSON, use empty array
      }
    }

    const franchiseData = await getFranchiseCards(watchlist);
    
    // Combine all franchises for pagination
    const allFranchises = [...franchiseData.userFranchises, ...franchiseData.popularFranchises];
    const totalCount = allFranchises.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    // Paginate results
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFranchises = allFranchises.slice(startIndex, endIndex);

    return NextResponse.json({
      franchises: paginatedFranchises,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        itemsPerPage,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      // Keep separate arrays for backward compatibility (first page only)
      userFranchises: page === 1 ? franchiseData.userFranchises : [],
      popularFranchises: page === 1 ? franchiseData.popularFranchises : [],
      allFranchises: page === 1 ? franchiseData.allFranchises : [],
    });
  } catch (error) {
    console.error('Error fetching franchises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch franchises' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const watchlist: WatchlistItem[] = body.watchlist || [];
    const page = body.page || 1;
    const itemsPerPage = 20;

    const franchiseData = await getFranchiseCards(watchlist);
    
    // Combine all franchises for pagination
    const allFranchises = [...franchiseData.userFranchises, ...franchiseData.popularFranchises];
    const totalCount = allFranchises.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    // Paginate results
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFranchises = allFranchises.slice(startIndex, endIndex);

    return NextResponse.json({
      franchises: paginatedFranchises,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        itemsPerPage,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      // Keep separate arrays for backward compatibility (first page only)
      userFranchises: page === 1 ? franchiseData.userFranchises : [],
      popularFranchises: page === 1 ? franchiseData.popularFranchises : [],
      allFranchises: page === 1 ? franchiseData.allFranchises : [],
    });
  } catch (error) {
    console.error('Error fetching franchises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch franchises' },
      { status: 500 }
    );
  }
}
