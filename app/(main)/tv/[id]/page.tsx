import { tmdbClient } from '@/lib/tmdb/client';
import { TVShowDetails, SeasonDetails } from '@/types';
import dynamic from 'next/dynamic';
import SeasonSelector from './SeasonSelector';
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

async function getSeasonData(tvId: number, seasons: TVShowDetails['seasons']): Promise<SeasonDetails[]> {
  const validSeasons = seasons.filter(s => s.season_number > 0);
  const seasonPromises = validSeasons.map(s => 
    tmdbClient.getTVSeasonDetails(tvId, s.season_number).catch(() => null)
  );
  const results = await Promise.all(seasonPromises);
  return results.filter((s): s is SeasonDetails => s !== null);
}

export default async function TVDetailPage({ params }: { params: { readonly id: string } }) {
  const tvId = Number.parseInt(params.id, 10);
  
  const [show, credits, videos, images, similar, recommendations, reviews] = await Promise.all([
    tmdbClient.getTVDetails(tvId),
    tmdbClient.getTVCredits(tvId).catch(() => null),
    tmdbClient.getTVVideos(tvId).catch(() => ({ results: [] })),
    tmdbClient.getTVImages(tvId).catch(() => ({ backdrops: [], posters: [] })),
    tmdbClient.getSimilarTV(tvId).catch(() => ({ results: [] })),
    tmdbClient.getTVRecommendations(tvId).catch(() => ({ results: [] })),
    tmdbClient.getTVReviews(tvId).catch(() => ({ results: [], total_results: 0 })),
  ]);
  
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
      />

      {/* Main Content with Sidebar */}
      <div className="px-4 md:px-12 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Overview */}
              <ExpandableOverview overview={show.overview} />

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
                <section>
                  <h2 className="text-xl font-semibold text-white mb-6">Key Crew</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {credits.crew
                      .filter((c: any) => ['Creator', 'Executive Producer', 'Producer', 'Writer'].includes(c.job))
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
