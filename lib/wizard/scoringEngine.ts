import { Movie, TVShow } from '@/types';

export interface ScoredResult {
    item: Movie | TVShow;
    score: number;
    reasons: string[];
    mediaType: 'movie' | 'tv';
}

export interface ScoringParams {
    vibeId: string;
    vibeName: string;
    primaryGenres: number[];    // Must-have genres (weighted heavily)
    secondaryGenres?: number[]; // Nice-to-have genres (light boost)
    antiGenres?: number[];      // Genres to avoid
    era?: string;               // 'modern' | '2000s' | '90s' | 'classic'
    runtimePref?: string;       // 'short' | 'standard' | 'epic' | 'any'
    wantHiddenGems?: boolean;
    excludeIds?: number[];      // Already shown movies to exclude
}

// Enhanced vibe definitions with scoring weights
export const VIBE_CONFIGS: Record<string, {
    name: string;
    primaryGenres: number[];
    secondaryGenres: number[];
    antiGenres: number[];
    preferHighRating: boolean;
}> = {
    chill: {
        name: 'Chill & Relax',
        primaryGenres: [35, 10751],      // Comedy, Family
        secondaryGenres: [10749, 16],    // Romance, Animation
        antiGenres: [27, 53, 80],        // Horror, Thriller, Crime
        preferHighRating: false,
    },
    adrenaline: {
        name: 'Adrenaline Rush',
        primaryGenres: [28, 53],         // Action, Thriller
        secondaryGenres: [80, 878],      // Crime, Sci-Fi
        antiGenres: [10749, 10751],      // Romance, Family
        preferHighRating: false,
    },
    brain: {
        name: 'Mind Bender',
        primaryGenres: [878, 9648],      // Sci-Fi, Mystery
        secondaryGenres: [53, 18],       // Thriller, Drama
        antiGenres: [35, 10751],         // Comedy, Family
        preferHighRating: true,
    },
    feelgood: {
        name: 'Feel Good',
        primaryGenres: [10749, 35],      // Romance, Comedy
        secondaryGenres: [10751, 18],    // Family, Drama
        antiGenres: [27, 53, 80],        // Horror, Thriller, Crime
        preferHighRating: false,
    },
    dark: {
        name: 'Dark & Gritty',
        primaryGenres: [80, 27],         // Crime, Horror
        secondaryGenres: [53, 9648],     // Thriller, Mystery
        antiGenres: [35, 10751, 16],     // Comedy, Family, Animation
        preferHighRating: true,
    },
    epic: {
        name: 'Epic Adventure',
        primaryGenres: [12, 14],         // Adventure, Fantasy
        secondaryGenres: [878, 28],      // Sci-Fi, Action
        antiGenres: [10749],             // Romance
        preferHighRating: false,
    },
};

/**
 * Calculate genre affinity score (0-1)
 * Primary genres get full weight, secondary get 50%
 */
function calculateGenreAffinity(
    movieGenres: number[],
    primaryGenres: number[],
    secondaryGenres: number[] = [],
    antiGenres: number[] = []
): { score: number; matchedPrimary: number[]; hasAnti: boolean } {
    if (!movieGenres || movieGenres.length === 0) {
        return { score: 0.3, matchedPrimary: [], hasAnti: false }; // Default score for unknown
    }

    let score = 0;
    const matchedPrimary: number[] = [];

    // Check for anti-genres first (heavy penalty)
    const hasAnti = movieGenres.some(g => antiGenres.includes(g));
    if (hasAnti) {
        return { score: 0, matchedPrimary: [], hasAnti: true };
    }

    // Primary genre matches (full points)
    const primaryMatches = movieGenres.filter(g => primaryGenres.includes(g));
    primaryMatches.forEach(g => matchedPrimary.push(g));
    score += primaryMatches.length > 0 ? (primaryMatches.length / primaryGenres.length) : 0;

    // Secondary genre matches (half points, max 0.3 bonus)
    const secondaryMatches = movieGenres.filter(g => secondaryGenres.includes(g));
    const secondaryBonus = Math.min(0.3, (secondaryMatches.length / Math.max(secondaryGenres.length, 1)) * 0.3);
    score += secondaryBonus;

    return { score: Math.min(1, score), matchedPrimary, hasAnti };
}

/**
 * Score era match (0-1)
 */
function scoreEraMatch(releaseDate: string | undefined, era: string | undefined): number {
    if (!releaseDate || !era) return 0.5; // Neutral if no preference

    const year = parseInt(releaseDate.slice(0, 4), 10);
    if (isNaN(year)) return 0.5;

    const currentYear = new Date().getFullYear();

    switch (era) {
        case 'modern':
            return year >= 2015 && year <= currentYear ? 1 : (year >= 2010 ? 0.5 : 0.2);
        case '2000s':
            return year >= 2000 && year <= 2014 ? 1 : (year >= 1995 || year <= 2018 ? 0.5 : 0.2);
        case '90s':
            return year >= 1990 && year <= 1999 ? 1 : (year >= 1985 || year <= 2005 ? 0.5 : 0.2);
        case 'classic':
            return year < 1990 ? 1 : (year < 2000 ? 0.5 : 0.2);
        default:
            return 0.5;
    }
}

/**
 * Score runtime preference (0-1)
 */
function scoreRuntime(runtime: number | undefined, pref: string | undefined): number {
    if (!runtime || !pref || pref === 'any') return 0.7; // Neutral

    switch (pref) {
        case 'short':
            return runtime <= 90 ? 1 : (runtime <= 110 ? 0.6 : 0.3);
        case 'standard':
            return runtime >= 90 && runtime <= 120 ? 1 : (runtime >= 75 && runtime <= 140 ? 0.6 : 0.3);
        case 'epic':
            return runtime >= 120 ? 1 : (runtime >= 100 ? 0.6 : 0.3);
        default:
            return 0.7;
    }
}

/**
 * Normalize TMDB rating with vote count consideration
 * High ratings with few votes are less trustworthy
 */
function normalizeRating(voteAverage: number, voteCount: number): number {
    if (!voteAverage || !voteCount) return 0.5;

    // Bayesian average - blend with global mean (7.0) based on vote count
    const globalMean = 7.0;
    const minVotes = 100; // Minimum votes for full confidence
    const confidence = Math.min(1, voteCount / minVotes);

    const adjustedRating = (confidence * voteAverage) + ((1 - confidence) * globalMean);

    // Normalize to 0-1 scale (ratings typically 5-9)
    return Math.max(0, Math.min(1, (adjustedRating - 5) / 4));
}

/**
 * Score for hidden gems (inverse popularity)
 */
function scoreHiddenGem(popularity: number): number {
    if (!popularity) return 0.5;

    // Popular movies have popularity > 100, hidden gems < 50
    if (popularity < 20) return 1;
    if (popularity < 50) return 0.8;
    if (popularity < 100) return 0.5;
    return 0.2;
}

/**
 * Score for popular movies
 */
function scorePopularity(popularity: number): number {
    if (!popularity) return 0.5;

    if (popularity > 200) return 1;
    if (popularity > 100) return 0.8;
    if (popularity > 50) return 0.6;
    return 0.4;
}

/**
 * Score freshness (newer movies get slight boost)
 */
function scoreFreshness(releaseDate: string | undefined): number {
    if (!releaseDate) return 0.5;

    const year = parseInt(releaseDate.slice(0, 4), 10);
    if (isNaN(year)) return 0.5;

    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age <= 2) return 1;
    if (age <= 5) return 0.8;
    if (age <= 10) return 0.6;
    if (age <= 20) return 0.5;
    return 0.4;
}

/**
 * Main scoring function
 */
export function scoreMovie(
    item: Movie | TVShow,
    params: ScoringParams
): ScoredResult {
    const isMovie = 'title' in item;
    const mediaType: 'movie' | 'tv' = isMovie ? 'movie' : 'tv';

    let score = 0;
    const reasons: string[] = [];

    const vibeConfig = VIBE_CONFIGS[params.vibeId];
    const movieGenres = item.genre_ids || [];
    const releaseDate = isMovie
        ? (item as Movie).release_date
        : (item as TVShow).first_air_date;

    // 1. GENRE AFFINITY (35%)
    const genreResult = calculateGenreAffinity(
        movieGenres,
        params.primaryGenres || vibeConfig?.primaryGenres || [],
        params.secondaryGenres || vibeConfig?.secondaryGenres || [],
        params.antiGenres || vibeConfig?.antiGenres || []
    );

    if (genreResult.hasAnti) {
        // Skip movies with anti-genres
        return { item, score: 0, reasons: ['Excluded: wrong genre'], mediaType };
    }

    score += genreResult.score * 35;
    if (genreResult.score > 0.7) {
        reasons.push(`Strong ${params.vibeName || vibeConfig?.name || 'match'} vibe`);
    }

    // 2. ERA RELEVANCE (15%)
    const eraScore = scoreEraMatch(releaseDate, params.era);
    score += eraScore * 15;
    if (eraScore === 1 && params.era) {
        const eraLabels: Record<string, string> = {
            modern: 'Recent release',
            '2000s': '2000s classic',
            '90s': '90s nostalgia',
            classic: 'Timeless classic',
        };
        reasons.push(eraLabels[params.era] || '');
    }

    // 3. RATING QUALITY (25%)
    const ratingScore = normalizeRating(item.vote_average, item.vote_count);
    score += ratingScore * 25;
    if (item.vote_average >= 7.5 && item.vote_count > 500) {
        reasons.push(`Highly rated (${item.vote_average.toFixed(1)}★)`);
    }

    // 4. POPULARITY vs HIDDEN GEM (15%)
    const popularityScore = params.wantHiddenGems
        ? scoreHiddenGem(item.popularity)
        : scorePopularity(item.popularity);
    score += popularityScore * 15;
    if (params.wantHiddenGems && item.popularity < 50) {
        reasons.push('Hidden gem 💎');
    }

    // 5. RUNTIME (for movies only, TV uses episode length which isn't in basic data)
    // We'll skip this for now as runtime requires movie details API call
    // Could be added in Phase 3 with caching

    // 6. FRESHNESS (10%)
    const freshnessScore = scoreFreshness(releaseDate);
    score += freshnessScore * 10;

    // Ensure reasons are meaningful
    if (reasons.length === 0 && score > 30) {
        reasons.push('Good match for your preferences');
    }

    return {
        item,
        score: Math.round(score * 10) / 10, // Round to 1 decimal
        reasons: reasons.filter(r => r.length > 0).slice(0, 2), // Max 2 reasons
        mediaType,
    };
}

/**
 * Score and rank a list of movies
 */
export function scoreAndRankMovies(
    items: (Movie | TVShow)[],
    params: ScoringParams
): ScoredResult[] {
    // Exclude already shown items
    const filteredItems = params.excludeIds
        ? items.filter(item => !params.excludeIds!.includes(item.id))
        : items;

    // Score all items
    const scored = filteredItems.map(item => scoreMovie(item, params));

    // Filter out zero-score (anti-genre) items and sort by score
    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);
}

/**
 * Get random shuffle for "Surprise Me"
 */
export function shuffleTop(results: ScoredResult[], topN: number = 20): ScoredResult[] {
    // Take top N and shuffle them for variety
    const top = results.slice(0, topN);
    for (let i = top.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [top[i], top[j]] = [top[j], top[i]];
    }
    return top;
}
