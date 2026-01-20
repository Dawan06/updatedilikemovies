/**
 * Static Path Generation for Build-Time Pre-rendering
 * 
 * Generates paths for top 1000 movies and TV shows to be statically
 * generated at build time, eliminating serverless function calls.
 */

import { cachedTmdbClient } from './tmdb/cached-client';

/**
 * Get top 1000 movie paths for static generation
 * Fetches 50 pages of 20 movies each = 1000 movies
 */
export async function getStaticMoviePaths() {
    const paths = [];

    try {
        console.log('[Static Paths] Generating movie paths...');

        // Fetch top 50 pages of popular movies (1000 total)
        for (let page = 1; page <= 50; page++) {
            try {
                const response = await cachedTmdbClient.getPopularMovies(page);

                paths.push(...response.results.map(movie => ({
                    params: { id: movie.id.toString() }
                })));

                // Log progress every 10 pages
                if (page % 10 === 0) {
                    console.log(`[Static Paths] Generated ${paths.length} movie paths...`);
                }
            } catch (error) {
                console.error(`[Static Paths] Error fetching page ${page}:`, error);
                // Continue with other pages even if one fails
            }
        }

        console.log(`[Static Paths] Total movie paths generated: ${paths.length}`);
        return paths;
    } catch (error) {
        console.error('[Static Paths] Fatal error generating movie paths:', error);
        // Return empty array instead of failing build
        return [];
    }
}

/**
 * Get top 1000 TV show paths for static generation
 * Fetches 50 pages of 20 shows each = 1000 shows
 */
export async function getStaticTVPaths() {
    const paths = [];

    try {
        console.log('[Static Paths] Generating TV paths...');

        // Fetch top 50 pages of popular TV shows (1000 total)
        for (let page = 1; page <= 50; page++) {
            try {
                const response = await cachedTmdbClient.getPopularTV(page);

                paths.push(...response.results.map(show => ({
                    params: { id: show.id.toString() }
                })));

                // Log progress every 10 pages
                if (page % 10 === 0) {
                    console.log(`[Static Paths] Generated ${paths.length} TV paths...`);
                }
            } catch (error) {
                console.error(`[Static Paths] Error fetching TV page ${page}:`, error);
                // Continue with other pages even if one fails
            }
        }

        console.log(`[Static Paths] Total TV paths generated: ${paths.length}`);
        return paths;
    } catch (error) {
        console.error('[Static Paths] Fatal error generating TV paths:', error);
        // Return empty array instead of failing build
        return [];
    }
}

/**
 * Get top 100 franchise/collection paths
 */
export async function getStaticFranchisePaths() {
    // TODO: Implement if we have a list of popular collections
    // For now, return empty array - franchises will be ISR on-demand
    return [];
}

/**
 * Helper: Batch paths for incremental generation
 * Useful for very large path lists
 */
export function batchPaths<T>(paths: T[], batchSize: number = 100): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < paths.length; i += batchSize) {
        batches.push(paths.slice(i, i + batchSize));
    }
    return batches;
}
