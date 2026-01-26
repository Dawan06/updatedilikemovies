import { cachedTmdbClient } from '@/lib/tmdb/cached-client';
import { TVShowDetails, SeasonDetails } from '@/types';
import dynamic from 'next/dynamic';
import SeasonSelector from './SeasonSelector';
import CastGrid from '@/components/detail/CastGrid';
import CrewSection from '@/components/detail/CrewSection';
import DetailSidebar from '@/components/detail/DetailSidebar';
import ExpandableOverview from '@/components/detail/ExpandableOverview';
import HeroSection from '@/components/detail/HeroSection';
import ContentAdvisory from '@/components/detail/ContentAdvisory';

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

async function getSeasonData(tvId: number, seasons: TVShowDetails['seasons']): Promise<SeasonDetails[]> {
  const validSeasons = seasons.filter(s => s.season_number > 0);
  const seasonPromises = validSeasons.map(s =>
    cachedTmdbClient.getTVSeasonDetails(tvId, s.season_number).catch(() => null)
  );
  const results = await Promise.all(seasonPromises);
  return results.filter((s): s is SeasonDetails => s !== null);
}

export default async function TVDetailPage({ params }: { params: { readonly id: string } }) {
  const tvId = Number.parseInt(params.id, 10);

  const [show, credits, videos, images, similar, recommendations, reviews, contentRatings] = await Promise.all([
    cachedTmdbClient.getTVDetails(tvId),
    cachedTmdbClient.getTVCredits(tvId).catch(() => null),
    cachedTmdbClient.getTVVideos(tvId).catch(() => ({ results: [] })),
    cachedTmdbClient.getTVImages(tvId).catch(() => ({ backdrops: [], posters: [] })),
    cachedTmdbClient.getSimilarTV(tvId).catch(() => ({ results: [] })),
    cachedTmdbClient.getTVRecommendations(tvId).catch(() => ({ results: [] })),
    cachedTmdbClient.getTVReviews(tvId).catch(() => ({ results: [], total_results: 0 })),
    cachedTmdbClient.getTVContentRatings(tvId).catch(() => ({ id: tvId, results: [] })),
  ]);

  // Get US content rating
  const usRating = contentRatings.results.find(r => r.iso_3166_1 === 'US')?.rating || '';

  const seasonData = await getSeasonData(tvId, show.seasons);
  const cast = credits?.cast?.slice(0, 20) || [];
  const creator = show.created_by?.[0];

  const trailer = videos.results.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
  ) || videos.results.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  ) || videos.results.find(
    (v) => v.site === 'YouTube'
  );

  // Prepare genres with status badge
  const genresWithStatus = [
    ...(show.status ? [{ id: -1, name: show.status }] : []),
    ...show.genres.slice(0, 2),
  ];

  return (
    <main className="min-h-screen bg-netflix-black">
      {/* Hero Section */}
      <HeroSection
        backdropPath={show.backdrop_path}
        posterPath={show.poster_path}
        title={show.name}
        rating={show.vote_average}
        year={show.first_air_date?.slice(0, 4)}
        genres={show.genres}
        overview={show.overview}
        watchUrl={`/watch/tv/${tvId}?season=1&episode=1`}
        trailer={trailer}
        mediaType="tv"
        status={show.status}
        contentRating={usRating}
      />

      {/* Main Content with Sidebar */}
      <div className="px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-10 md:space-y-12">
              {/* Overview */}
              <ExpandableOverview overview={show.overview} />

              {/* Content Advisory */}
              {usRating && (
                <ContentAdvisory
                  rating={usRating}
                  mediaType="tv"
                  contentRatings={contentRatings.results}
                />
              )}

              {/* Seasons */}
              <SeasonSelector
                tvId={tvId}
                showName={show.name}
                seasons={seasonData}
              />

              {/* Cast */}
              {cast.length > 0 && (
                <CastGrid cast={cast} />
              )}

              {/* Crew Section */}
              {credits && credits.crew && credits.crew.length > 0 && (
                <CrewSection crew={credits.crew} mediaType="tv" />
              )}

              {/* Photos */}
              {(images.backdrops.length > 0 || images.posters.length > 0) && (
                <PhotoGallery
                  backdrops={images.backdrops}
                  posters={images.posters}
                  title={show.name}
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
                  mediaType="tv"
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <DetailSidebar
                tmdbId={tvId}
                mediaType="tv"
                rating={show.vote_average}
                runtime={show.episode_run_time?.[0]}
                year={show.first_air_date?.slice(0, 4)}
                seasons={show.number_of_seasons}
                episodes={show.number_of_episodes}
                creator={creator?.name}
                network={show.networks?.[0]?.name}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
