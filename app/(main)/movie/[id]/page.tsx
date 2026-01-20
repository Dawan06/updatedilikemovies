import { cachedTmdbClient } from '@/lib/tmdb/cached-client';
import dynamic from 'next/dynamic';
import CastGrid from '@/components/detail/CastGrid';
import DetailSidebar from '@/components/detail/DetailSidebar';
import ExpandableOverview from '@/components/detail/ExpandableOverview';
import HeroSection from '@/components/detail/HeroSection';

// Lazy load below-the-fold components
const PhotoGallery = dynamic(() => import('@/components/detail/PhotoGallery'), {
  loading: () => <div className="h-64 animate-pulse bg-netflix-dark rounded-lg" />,
});
const SimilarContent = dynamic(() => import('@/components/detail/SimilarContent'), {
  loading: () => <div className="h-64 animate-pulse bg-netflix-dark rounded-lg" />,
});
const ReviewsSection = dynamic(() => import('@/components/detail/ReviewsSection'), {
  loading: () => <div className="h-48 animate-pulse bg-netflix-dark rounded-lg" />,
});

export const revalidate = 3600;

export default async function MovieDetailPage({ params }: { params: { readonly id: string } }) {
  const movieId = Number.parseInt(params.id, 10);

  const [movie, credits, videos, images, similar, recommendations, reviews] = await Promise.all([
    cachedTmdbClient.getMovieDetails(movieId),
    cachedTmdbClient.getMovieCredits(movieId).catch(() => null),
    cachedTmdbClient.getMovieVideos(movieId).catch(() => ({ results: [] })),
    cachedTmdbClient.getMovieImages(movieId).catch(() => ({ backdrops: [], posters: [] })),
    cachedTmdbClient.getSimilarMovies(movieId).catch(() => ({ results: [] })),
    cachedTmdbClient.getMovieRecommendations(movieId).catch(() => ({ results: [] })),
    cachedTmdbClient.getMovieReviews(movieId).catch(() => ({ results: [], total_results: 0 })),
  ]);

  const director = credits?.crew?.find((c: any) => c.job === 'Director');
  const cast = credits?.cast?.slice(0, 20) || [];

  const trailer = videos.results.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
  ) || videos.results.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  ) || videos.results.find(
    (v) => v.site === 'YouTube'
  );

  return (
    <main className="min-h-screen bg-netflix-black">
      {/* Hero Section */}
      <HeroSection
        backdropPath={movie.backdrop_path}
        posterPath={movie.poster_path}
        title={movie.title}
        rating={movie.vote_average}
        year={movie.release_date?.slice(0, 4)}
        genres={movie.genres}
        overview={movie.overview}
        watchUrl={`/watch/movie/${movieId}`}
        trailer={trailer}
        mediaType="movie"
      />

      {/* Main Content with Sidebar */}
      <div className="px-4 md:px-12 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Overview */}
              <ExpandableOverview overview={movie.overview} />

              {/* Cast */}
              {cast.length > 0 && (
                <CastGrid cast={cast} />
              )}

              {/* Crew Section */}
              {credits && credits.crew && credits.crew.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-white mb-6">Key Crew</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {credits.crew
                      .filter((c: any) => ['Director', 'Producer', 'Screenplay', 'Writer', 'Cinematography'].includes(c.job))
                      .slice(0, 6)
                      .map((person: any) => (
                        <div key={person.id} className="glass rounded-lg p-4">
                          <p className="text-white font-medium">{person.name}</p>
                          <p className="text-gray-400 text-sm">{person.job}</p>
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {/* Photos */}
              {(images.backdrops.length > 0 || images.posters.length > 0) && (
                <PhotoGallery
                  backdrops={images.backdrops}
                  posters={images.posters}
                  title={movie.title}
                />
              )}

              {/* Reviews */}
              {reviews.results.length > 0 && (
                <ReviewsSection
                  reviews={reviews.results}
                  totalResults={reviews.total_results}
                />
              )}

              {/* Recommendations */}
              {(similar.results.length > 0 || recommendations.results.length > 0) && (
                <SimilarContent
                  items={similar.results}
                  recommendations={recommendations.results}
                  mediaType="movie"
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <DetailSidebar
                tmdbId={movieId}
                mediaType="movie"
                rating={movie.vote_average}
                runtime={movie.runtime}
                year={movie.release_date?.slice(0, 4)}
                director={director?.name}
                productionCompany={movie.production_companies?.[0]?.name}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
