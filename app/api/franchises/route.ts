import { NextRequest, NextResponse } from 'next/server';
import {
    getPopularFranchises,
    discoverFranchises,
    collectionsToFranchiseCards,
    calculatePopularityScore
} from '@/lib/franchise/detector';
import { FranchiseCard, Collection } from '@/types';

// Ensure dynamic route for pagination
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

// Cache headers for responses
const CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

// In-memory cache for discovered franchises (simple cache, wiped on serverless cold start)
// Key: page_number
const discoveryCache = new Map<number, Collection[]>();

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);

        let collections: Collection[] = [];

        // Page 1: Always return curated franchises (Static/Fast)
        if (page === 1) {
            collections = await getPopularFranchises();
        }
        // Page 2+: Discover new franchises from TMDB popular movies (Dynamic)
        else {
            // Check cache first
            if (discoveryCache.has(page)) {
                collections = discoveryCache.get(page)!;
            } else {
                // Fetch from TMDB (offset by 1 because page 1 is curated)
                // We use page-1 for discovery so page 2 requests discovery page 1, etc.
                collections = await discoverFranchises(page - 1);

                // Cache non-empty results
                if (collections.length > 0) {
                    discoveryCache.set(page, collections);
                }
            }
        }

        // Convert to franchise cards
        const franchiseCards = collectionsToFranchiseCards(collections);

        // Sort by popularity score
        const sortedCards = franchiseCards.sort((a, b) => {
            const scoreA = calculatePopularityScore(a);
            const scoreB = calculatePopularityScore(b);

            // Primary sort: popularity score (highest first)
            if (Math.abs(scoreB - scoreA) > 0.1) {
                return scoreB - scoreA;
            }
            // Secondary sort: movie count
            return b.movieCount - a.movieCount;
        });

        return NextResponse.json({
            franchises: sortedCards,
            hasMore: sortedCards.length > 0, // Assumption: if we found some, there might be more
            page,
        }, { headers: CACHE_HEADERS });

    } catch (error) {
        console.error('Error in franchises API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch franchises', franchises: [] },
            { status: 500 }
        );
    }
}
