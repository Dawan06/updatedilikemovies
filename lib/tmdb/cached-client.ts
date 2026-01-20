/**
 * Cached TMDB Client Wrapper
 * 
 * Wraps tmdbClient with caching and deduplication for massive performance gains.
 * Use this instead of direct tmdbClient for cached responses.
 */

import { tmdbClient } from './client';
import { fetchOptimized } from './dedup';
import type { Movie, TVShow, MovieDetails, TVShowDetails } from '@/types';

class CachedTMDBClient {
    // Movies - 6 hour cache (trending changes slowly)
    async getTrendingMovies(page: number = 1) {
        return fetchOptimized(
            `trending-movies-${page}`,
            () => tmdbClient.getTrendingMovies(page),
            21600 // 6 hours
        );
    }

    async getPopularMovies(page: number = 1) {
        return fetchOptimized(
            `popular-movies-${page}`,
            () => tmdbClient.getPopularMovies(page),
            21600
        );
    }

    async getTopRatedMovies(page: number = 1) {
        return fetchOptimized(
            `top-rated-movies-${page}`,
            () => tmdbClient.getTopRatedMovies(page),
            43200 // 12 hours - rarely changes
        );
    }

    async getMovieDetails(id: number) {
        return fetchOptimized(
            `movie-details-${id}`,
            () => tmdbClient.getMovieDetails(id),
            86400 // 24 hours - movie details don't change
        );
    }

    async getMovieCredits(id: number) {
        return fetchOptimized(
            `movie-credits-${id}`,
            () => tmdbClient.getMovieCredits(id),
            86400
        );
    }

    async getMovieVideos(id: number) {
        return fetchOptimized(
            `movie-videos-${id}`,
            () => tmdbClient.getMovieVideos(id),
            86400
        );
    }

    async getMovieImages(id: number) {
        return fetchOptimized(
            `movie-images-${id}`,
            () => tmdbClient.getMovieImages(id),
            86400
        );
    }

    async getMovieReviews(id: number) {
        return fetchOptimized(
            `movie-reviews-${id}`,
            () => tmdbClient.getMovieReviews(id),
            43200
        );
    }

    // TV Shows - 6 hour cache
    async getTrendingTV(page: number = 1) {
        return fetchOptimized(
            `trending-tv-${page}`,
            () => tmdbClient.getTrendingTV(page),
            21600
        );
    }

    async getPopularTV(page: number = 1) {
        return fetchOptimized(
            `popular-tv-${page}`,
            () => tmdbClient.getPopularTV(page),
            21600
        );
    }

    async getTopRatedTV(page: number = 1) {
        return fetchOptimized(
            `top-rated-tv-${page}`,
            () => tmdbClient.getTopRatedTV(page),
            43200
        );
    }

    async getTVDetails(id: number) {
        return fetchOptimized(
            `tv-details-${id}`,
            () => tmdbClient.getTVDetails(id),
            86400
        );
    }

    async getTVCredits(id: number) {
        return fetchOptimized(
            `tv-credits-${id}`,
            () => tmdbClient.getTVCredits(id),
            86400
        );
    }

    async getTVVideos(id: number) {
        return fetchOptimized(
            `tv-videos-${id}`,
            () => tmdbClient.getTVVideos(id),
            86400
        );
    }

    async getTVImages(id: number) {
        return fetchOptimized(
            `tv-images-${id}`,
            () => tmdbClient.getTVImages(id),
            86400
        );
    }

    async getTVReviews(id: number) {
        return fetchOptimized(
            `tv-reviews-${id}`,
            () => tmdbClient.getTVReviews(id),
            43200
        );
    }

    // Search - 10 minute cache (user-specific, needs to feel responsive)
    async searchMulti(query: string, page: number = 1) {
        return fetchOptimized(
            `search-${query}-${page}`,
            () => tmdbClient.searchMulti(query, page),
            600
        );
    }

    async searchCollections(query: string, page: number = 1) {
        return fetchOptimized(
            `search-collections-${query}-${page}`,
            () => tmdbClient.searchCollections(query, page),
            600
        );
    }

    // Genres - 7 days cache (never changes)
    async getMovieGenres() {
        return fetchOptimized(
            'movie-genres',
            () => tmdbClient.getMovieGenres(),
            604800
        );
    }

    async getTVGenres() {
        return fetchOptimized(
            'tv-genres',
            () => tmdbClient.getTVGenres(),
            604800
        );
    }

    // Similar/Recommendations - 12 hour cache
    async getSimilarMovies(id: number) {
        return fetchOptimized(
            `similar-movies-${id}`,
            () => tmdbClient.getSimilarMovies(id),
            43200
        );
    }

    async getSimilarTV(id: number) {
        return fetchOptimized(
            `similar-tv-${id}`,
            () => tmdbClient.getSimilarTV(id),
            43200
        );
    }

    async getMovieRecommendations(id: number) {
        return fetchOptimized(
            `movie-recommendations-${id}`,
            () => tmdbClient.getMovieRecommendations(id),
            43200
        );
    }

    async getTVRecommendations(id: number) {
        return fetchOptimized(
            `tv-recommendations-${id}`,
            () => tmdbClient.getTVRecommendations(id),
            43200
        );
    }

    // Discover - 1 hour cache
    async discoverMovies(params: Record<string, string> = {}) {
        const cacheKey = `discover-movies-${JSON.stringify(params)}`;
        return fetchOptimized(
            cacheKey,
            () => tmdbClient.discoverMovies(params),
            3600
        );
    }

    async discoverTV(params: Record<string, string> = {}) {
        const cacheKey = `discover-tv-${JSON.stringify(params)}`;
        return fetchOptimized(
            cacheKey,
            () => tmdbClient.discoverTV(params),
            3600
        );
    }

    // Collections - 24 hour cache
    async getCollectionDetails(collectionId: number) {
        return fetchOptimized(
            `collection-${collectionId}`,
            () => tmdbClient.getCollectionDetails(collectionId),
            86400
        );
    }

    // Season details - 24 hour cache
    async getTVSeasonDetails(tvId: number, seasonNumber: number) {
        return fetchOptimized(
            `tv-season-${tvId}-${seasonNumber}`,
            () => tmdbClient.getTVSeasonDetails(tvId, seasonNumber),
            86400
        );
    }

    // Pass-through methods that shouldn't be cached (or have custom caching needs)
    async findByIMDbId(imdbId: string) {
        return tmdbClient.findByIMDbId(imdbId);
    }

    async searchMovies(query: string, page: number = 1) {
        return fetchOptimized(
            `search-movies-${query}-${page}`,
            () => tmdbClient.searchMovies(query, page),
            600
        );
    }

    async searchTV(query: string, page: number = 1) {
        return fetchOptimized(
            `search-tv-${query}-${page}`,
            () => tmdbClient.searchTV(query, page),
            600
        );
    }
}

export const cachedTmdbClient = new CachedTMDBClient();
