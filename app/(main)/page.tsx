import { cachedTmdbClient } from '@/lib/tmdb/cached-client';
import dynamic from 'next/dynamic';
import UserHeroBanner from '@/components/hero-banner/UserHeroBanner';
import MovieCard from '@/components/movie-card/MovieCard';
import { Movie, TVShow } from '@/types';
import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { getUserWatchlist } from '@/lib/supabase/helpers';

// Lazy load carousels below the fold for better initial load performance
// Use ssr: false for client-only components to reduce initial bundle
const ContentCarousel = dynamic(() => import('@/components/carousel/ContentCarousel'), {
  loading: () => <div className="h-64 animate-pulse bg-netflix-dark rounded-lg" />,
  ssr: false, // Client-only for faster initial load
});
const MyListCarousel = dynamic(() => import('@/components/carousel/MyListCarousel'), {
  loading: () => <div className="h-64 animate-pulse bg-netflix-dark rounded-lg" />,
  ssr: false,
});
const ContinueWatchingCarousel = dynamic(() => import('@/components/carousel/ContinueWatchingCarousel'), {
  loading: () => <div className="h-64 animate-pulse bg-netflix-dark rounded-lg" />,
  ssr: false,
});

// Cache for 1 hour - page is pre-rendered
export const revalidate = 3600;

// Generate metadata with hero image preload
export async function generateMetadata(): Promise<Metadata> {
  // Fetch trending movies to get hero image
  const trendingMovies = await cachedTmdbClient.getTrendingMovies(1);
  const heroMovie = trendingMovies.results[0];

  if (!heroMovie?.backdrop_path) {
    return {};
  }

  const heroImageUrl = `https://image.tmdb.org/t/p/w780${heroMovie.backdrop_path}`;

  return {
    other: {
      'hero-image-preload': heroImageUrl,
    },
  };
}

export default async function HomePage() {
  // Fetch all content data in parallel (now with caching!)
  const [trendingMovies, trendingTV, topRatedMovies, popularMovies] = await Promise.all([
    cachedTmdbClient.getTrendingMovies(1),
    cachedTmdbClient.getTrendingTV(1),
    cachedTmdbClient.getTopRatedMovies(1),
    cachedTmdbClient.getPopularMovies(1),
  ]);

  // Get top 5 trending movies for hero slideshow
  const heroMovies = trendingMovies.results.slice(0, 5);

  // Fetch trailers for hero movies in parallel
  const trailerResults = await Promise.all(
    heroMovies.map(movie =>
      cachedTmdbClient.getMovieVideos(movie.id).catch(() => ({ results: [] }))
    )
  );

  // Create trailers map: movieId -> videos array
  const trailersMap: Record<number, Array<{ key: string; name: string; site: string; type: string }>> = {};
  heroMovies.forEach((movie, index) => {
    trailersMap[movie.id] = trailerResults[index].results;
  });

  // Fetch user watchlist server-side if authenticated (non-blocking)
  let userHeroItems: (Movie | TVShow)[] | null = null;
  let userMediaType: 'movie' | 'tv' | null = null;
  let userTrailers: Record<number, Array<{ key: string; name: string; site: string; type: string }>> = {};

  try {
    const { userId } = await auth();
    if (userId) {
      // Fetch watchlist items server-side
      const watchlistItems = await getUserWatchlist(userId);

      if (watchlistItems.length > 0) {
        // Shuffle watchlist items so hero shows different movies each time
        const shuffled = [...watchlistItems].sort(() => Math.random() - 0.5);
        // Get first 5 shuffled items for hero
        const heroWatchlistItems = shuffled.slice(0, 5);

        // Fetch details and trailers in parallel
        const [detailsResults, ...trailerResults] = await Promise.all([
          Promise.all(
            heroWatchlistItems.map(async (item) => {
              try {
                if (item.media_type === 'movie') {
                  return await cachedTmdbClient.getMovieDetails(item.tmdb_id);
                } else {
                  return await cachedTmdbClient.getTVDetails(item.tmdb_id);
                }
              } catch {
                return null;
              }
            })
          ),
          ...heroWatchlistItems.map(item =>
            (item.media_type === 'movie'
              ? cachedTmdbClient.getMovieVideos(item.tmdb_id)
              : cachedTmdbClient.getTVVideos(item.tmdb_id)
            ).catch(() => ({ results: [] }))
          ),
        ]);

        const validDetails = detailsResults.filter(Boolean) as (Movie | TVShow)[];

        if (validDetails.length > 0) {
          userHeroItems = validDetails.slice(0, 5);

          // Determine primary media type
          const movieCount = heroWatchlistItems.slice(0, validDetails.length).filter(i => i.media_type === 'movie').length;
          userMediaType = movieCount > validDetails.length / 2 ? 'movie' : 'tv';

          // Process trailer results
          trailerResults.forEach((trailerData, index) => {
            const item = validDetails[index];
            if (item && trailerData && 'results' in trailerData && Array.isArray(trailerData.results)) {
              userTrailers[item.id] = trailerData.results;
            }
          });
        }
      }
    }
  } catch (error) {
    // Silently fail and use fallback - don't block page load
    console.error('Error fetching user watchlist for hero:', error);
  }

  return (
    <main className="min-h-screen bg-netflix-black">
      {/* Hero Banner - Shows user's list if available, otherwise trending */}
      {heroMovies.length > 0 && (
        <UserHeroBanner
          initialItems={userHeroItems || heroMovies}
          initialMediaType={(userMediaType || 'movie') as 'movie' | 'tv'}
          initialTrailers={Object.keys(userTrailers).length > 0 ? userTrailers : trailersMap}
          fallbackItems={heroMovies}
          fallbackMediaType="movie"
          fallbackTrailers={trailersMap}
        />
      )}

      {/* Content Sections */}
      <div className="relative z-30 pb-20">
        <div className="space-y-8 md:space-y-10">
          {/* Continue Watching */}
          <div className="pt-6">
            <ContinueWatchingCarousel />
          </div>

          {/* My List */}
          <div>
            <MyListCarousel />
          </div>

          {/* Trending Movies */}
          <ContentCarousel title="Trending Movies" seeAllHref="/browse?category=trending">
            {trendingMovies.results.slice(0, 20).map((m, i) => (
              <div key={m.id} className="flex-shrink-0 w-[180px] md:w-[220px] scroll-snap-align-start">
                <MovieCard item={m} mediaType="movie" priority={i < 6} index={i} enableHover={true} />
              </div>
            ))}
          </ContentCarousel>

          {/* Trending TV Shows */}
          <ContentCarousel title="Trending Shows" seeAllHref="/browse?category=tv">
            {trendingTV.results.slice(0, 20).map((t, i) => (
              <div key={t.id} className="flex-shrink-0 w-[180px] md:w-[220px] scroll-snap-align-start">
                <MovieCard item={t} mediaType="tv" index={i} enableHover={true} />
              </div>
            ))}
          </ContentCarousel>

          {/* Top Rated */}
          <ContentCarousel title="Top Rated" seeAllHref="/browse?category=top-rated">
            {topRatedMovies.results.slice(0, 20).map((m, i) => (
              <div key={m.id} className="flex-shrink-0 w-[180px] md:w-[220px] scroll-snap-align-start">
                <MovieCard item={m} mediaType="movie" index={i} enableHover={true} />
              </div>
            ))}
          </ContentCarousel>
        </div>
      </div>
    </main>
  );
}
