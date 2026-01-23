import { NextRequest, NextResponse } from 'next/server';
import { tmdbClient } from '@/lib/tmdb/client';
import { scoreAndRankMovies, shuffleTop, VIBE_CONFIGS, ScoringParams } from '@/lib/wizard/scoringEngine';

export const dynamic = 'force-dynamic';

// Simple in-memory cache for recommendation results
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCacheKey(params: Record<string, string>): string {
    return Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join('&');
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json();
        const {
            vibeId,
            era,
            runtime,
            mediaType = 'movie',
            hiddenGems = false,
            surpriseMe = false,
            excludeIds = [],
            page = 1,
        } = body;

        if (!vibeId && !surpriseMe) {
            return NextResponse.json({ error: 'vibeId is required' }, { status: 400 });
        }

        // For Surprise Me, pick random vibe
        const actualVibeId = surpriseMe
            ? Object.keys(VIBE_CONFIGS)[Math.floor(Math.random() * Object.keys(VIBE_CONFIGS).length)]
            : vibeId;

        const vibeConfig = VIBE_CONFIGS[actualVibeId];
        if (!vibeConfig) {
            return NextResponse.json({ error: 'Invalid vibeId' }, { status: 400 });
        }

        // Check cache
        const cacheKey = getCacheKey({ vibeId: actualVibeId, era: era || '', runtime: runtime || '', mediaType, hiddenGems: String(hiddenGems), page: String(page) });
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            // Filter out excluded IDs and return cached results
            const filteredResults = cached.data.results.filter(
                (r: any) => !excludeIds.includes(r.item.id)
            );
            return NextResponse.json({
                ...cached.data,
                results: filteredResults.slice(0, 20),
                fromCache: true,
                responseTime: Date.now() - startTime,
            });
        }

        // Build TMDB discover params
        const discoverParams: Record<string, string> = {
            page: page.toString(),
            sort_by: hiddenGems ? 'vote_average.desc' : 'popularity.desc',
            'vote_count.gte': hiddenGems ? '50' : '100',
            with_genres: vibeConfig.primaryGenres.join(','),
        };

        // Add era filters
        const currentYear = new Date().getFullYear();
        if (era === 'modern') {
            discoverParams['primary_release_date.gte'] = '2015-01-01';
            discoverParams['primary_release_date.lte'] = `${currentYear}-12-31`;
        } else if (era === '2000s') {
            discoverParams['primary_release_date.gte'] = '2000-01-01';
            discoverParams['primary_release_date.lte'] = '2014-12-31';
        } else if (era === '90s') {
            discoverParams['primary_release_date.gte'] = '1990-01-01';
            discoverParams['primary_release_date.lte'] = '1999-12-31';
        } else if (era === 'classic') {
            discoverParams['primary_release_date.lte'] = '1989-12-31';
        }

        // Add runtime filters (movies only)
        if (mediaType === 'movie' && runtime && runtime !== 'any') {
            if (runtime === 'short') {
                discoverParams['with_runtime.lte'] = '90';
            } else if (runtime === 'standard') {
                discoverParams['with_runtime.gte'] = '90';
                discoverParams['with_runtime.lte'] = '120';
            } else if (runtime === 'epic') {
                discoverParams['with_runtime.gte'] = '120';
            }
        }

        // Fetch from TMDB (get 2 pages for more variety)
        // Parallelize Movie and TV fetching
        const fetchPromises: Promise<any[]>[] = [];

        if (mediaType === 'movie' || mediaType === 'all') {
            fetchPromises.push(
                Promise.all([
                    tmdbClient.discoverMovies({ ...discoverParams, page: '1' }),
                    tmdbClient.discoverMovies({ ...discoverParams, page: '2' }),
                ]).then(([p1, p2]) => [...p1.results, ...p2.results])
            );
        }

        if (mediaType === 'tv' || mediaType === 'all') {
            // Adjust params for TV
            const tvParams = { ...discoverParams };
            delete tvParams['primary_release_date.gte'];
            delete tvParams['primary_release_date.lte'];
            delete tvParams['with_runtime.gte'];
            delete tvParams['with_runtime.lte'];

            if (era === 'modern') {
                tvParams['first_air_date.gte'] = '2015-01-01';
                tvParams['first_air_date.lte'] = `${currentYear}-12-31`;
            } else if (era === '2000s') {
                tvParams['first_air_date.gte'] = '2000-01-01';
                tvParams['first_air_date.lte'] = '2014-12-31';
            } else if (era === '90s') {
                tvParams['first_air_date.gte'] = '1990-01-01';
                tvParams['first_air_date.lte'] = '1999-12-31';
            } else if (era === 'classic') {
                tvParams['first_air_date.lte'] = '1989-12-31';
            }

            fetchPromises.push(
                Promise.all([
                    tmdbClient.discoverTV({ ...tvParams, page: '1' }),
                    tmdbClient.discoverTV({ ...tvParams, page: '2' }),
                ]).then(([p1, p2]) => [...p1.results, ...p2.results])
            );
        }

        const resultsArrays = await Promise.all(fetchPromises);
        let allResults = resultsArrays.flat();

        // Filter items without posters
        allResults = allResults.filter(item => item.poster_path);

        // Score and rank all results
        const scoringParams: ScoringParams = {
            vibeId: actualVibeId,
            vibeName: vibeConfig.name,
            primaryGenres: vibeConfig.primaryGenres,
            secondaryGenres: vibeConfig.secondaryGenres,
            antiGenres: vibeConfig.antiGenres,
            era,
            runtimePref: runtime,
            wantHiddenGems: hiddenGems,
            excludeIds,
        };

        let scoredResults = scoreAndRankMovies(allResults, scoringParams);

        // For Surprise Me, shuffle the top results
        if (surpriseMe) {
            scoredResults = shuffleTop(scoredResults, 30);
        }

        // Take top 20 for display
        const topResults = scoredResults.slice(0, 20);

        // Build response
        const response = {
            results: topResults,
            vibeUsed: {
                id: actualVibeId,
                name: vibeConfig.name,
            },
            totalScored: scoredResults.length,
            filters: { era, runtime, mediaType, hiddenGems },
            responseTime: Date.now() - startTime,
        };

        // Cache the full scored results
        cache.set(cacheKey, {
            data: { ...response, results: scoredResults.slice(0, 100) },
            timestamp: Date.now()
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error('Wizard recommend error:', error);
        return NextResponse.json(
            { error: 'Recommendation failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
