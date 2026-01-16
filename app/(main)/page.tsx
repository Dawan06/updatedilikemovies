import { tmdbClient } from '@/lib/tmdb/client';
import UserHeroBanner from '@/components/hero-banner/UserHeroBanner';
import MovieCard from '@/components/movie-card/MovieCard';
import ContentCarousel from '@/components/carousel/ContentCarousel';
import Top10Carousel from '@/components/carousel/Top10Carousel';
import MyListCarousel from '@/components/carousel/MyListCarousel';
import { Movie, TVShow } from '@/types';

// Cache for 1 hour - page is pre-rendered
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch all content data in parallel
  const [trendingMovies, trendingTV, topRatedMovies, popularMovies] = await Promise.all([
    tmdbClient.getTrendingMovies(1),
    tmdbClient.getTrendingTV(1),
    tmdbClient.getTopRatedMovies(1),
    tmdbClient.getPopularMovies(1),
  ]);

  // Get top 5 trending movies for hero slideshow
  const heroMovies = trendingMovies.results.slice(0, 5);

  // Fetch trailers for hero movies in parallel
  const trailerResults = await Promise.all(
    heroMovies.map(movie => 
      tmdbClient.getMovieVideos(movie.id).catch(() => ({ results: [] }))
    )
  );

  // Create trailers map: movieId -> videos array
  const trailersMap: Record<number, Array<{ key: string; name: string; site: string; type: string }>> = {};
  heroMovies.forEach((movie, index) => {
    trailersMap[movie.id] = trailerResults[index].results;
  });

  // Mix trending movies and TV shows for Top 10 Today
  // Combine and sort by popularity/trending score
  type MixedContentItem = (Movie | TVShow) & { mediaType: 'movie' | 'tv' };
  const mixedContent: MixedContentItem[] = [
    ...trendingMovies.results.slice(0, 10).map(item => ({ ...item, mediaType: 'movie' as const })),
    ...trendingTV.results.slice(0, 10).map(item => ({ ...item, mediaType: 'tv' as const }))
  ]
    .sort((a, b) => (b.vote_average * b.popularity) - (a.vote_average * a.popularity))
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-netflix-black">
      {/* Hero Banner - Shows user's list if available, otherwise trending */}
      {heroMovies.length > 0 && (
        <UserHeroBanner 
          fallbackItems={heroMovies} 
          fallbackMediaType="movie" 
          fallbackTrailers={trailersMap}
        />
      )}

      {/* Content Sections */}
      <div className="relative z-30 pb-20">
        <div className="space-y-8 md:space-y-10">
          {/* My List */}
          <div className="pt-6">
            <MyListCarousel />
          </div>

          {/* Top 10 Today - Mixed movies and TV shows */}
          <div className="pt-8 md:pt-12">
            <Top10Carousel 
              title="Today" 
              items={mixedContent.map(item => {
                const { mediaType, ...rest } = item;
                return rest;
              })}
              itemsWithMediaType={mixedContent}
            />
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
