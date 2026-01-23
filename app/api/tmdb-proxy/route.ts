import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const dynamic = 'force-dynamic';

// Lightweight proxy for client-side TMDB lookups
// Handles both IMDb ID lookup and search queries
export async function POST(request: NextRequest) {
    try {
        if (!TMDB_API_KEY) {
            return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
        }

        const body = await request.json();
        const { imdbId, query, year, mediaType } = body;

        // Method 1: IMDb ID lookup (fastest, most accurate)
        if (imdbId && imdbId.startsWith('tt')) {
            const url = `${TMDB_BASE_URL}/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
            const response = await fetch(url);

            if (!response.ok) {
                return NextResponse.json({ tmdbId: null, mediaType: 'movie' });
            }

            const data = await response.json();

            // Check TV first (IMDb often has TV shows)
            if (data.tv_results?.length > 0) {
                const tv = data.tv_results[0];
                return NextResponse.json({
                    tmdbId: tv.id,
                    mediaType: 'tv',
                    title: tv.name,
                    poster_path: tv.poster_path,
                    backdrop_path: tv.backdrop_path
                });
            }

            // Then movies
            if (data.movie_results?.length > 0) {
                const movie = data.movie_results[0];
                return NextResponse.json({
                    tmdbId: movie.id,
                    mediaType: 'movie',
                    title: movie.title,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path
                });
            }

            return NextResponse.json({ tmdbId: null, mediaType: 'movie' });
        }

        // Method 2: Search by title (for Letterboxd or when IMDb ID lookup fails)
        if (query) {
            const isTV = mediaType === 'tv';
            const endpoint = isTV ? 'search/tv' : 'search/movie';
            const yearParam = year ? (isTV ? `&first_air_date_year=${year}` : `&year=${year}`) : '';

            const url = `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}${yearParam}`;
            const response = await fetch(url);

            if (!response.ok) {
                return NextResponse.json({ tmdbId: null, mediaType: isTV ? 'tv' : 'movie' });
            }

            const data = await response.json();

            if (data.results?.length > 0) {
                const result = data.results[0];
                return NextResponse.json({
                    tmdbId: result.id,
                    mediaType: isTV ? 'tv' : 'movie',
                    title: isTV ? result.name : result.title,
                    poster_path: result.poster_path,
                    backdrop_path: result.backdrop_path
                });
            }

            // Fallback: try without year if no results
            if (year) {
                const fallbackUrl = `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
                const fallbackResponse = await fetch(fallbackUrl);

                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    if (fallbackData.results?.length > 0) {
                        const result = fallbackData.results[0];
                        return NextResponse.json({
                            tmdbId: result.id,
                            mediaType: isTV ? 'tv' : 'movie',
                            title: isTV ? result.name : result.title,
                            poster_path: result.poster_path,
                            backdrop_path: result.backdrop_path
                        });
                    }
                }
            }

            return NextResponse.json({ tmdbId: null, mediaType: isTV ? 'tv' : 'movie' });
        }

        return NextResponse.json({ error: 'Missing imdbId or query' }, { status: 400 });
    } catch (error) {
        console.error('TMDB proxy error:', error);
        return NextResponse.json({ tmdbId: null, mediaType: 'movie' });
    }
}
