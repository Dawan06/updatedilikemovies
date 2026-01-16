import { tmdbClient } from '@/lib/tmdb/client';
import { vidsrcClient } from '@/lib/vidsrc/vidsrc-client';
import VideoPlayerWrapper from '@/components/video-player/VideoPlayerWrapper';
import { Episode } from '@/types';

export const dynamic = 'force-dynamic';

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: { type: string; id: string };
  searchParams: { season?: string; episode?: string };
}) {
  const tmdbId = parseInt(params.id, 10);
  const season = searchParams.season ? parseInt(searchParams.season, 10) : undefined;
  const episode = searchParams.episode ? parseInt(searchParams.episode, 10) : undefined;

  // Get video sources
  const sources = params.type === 'movie'
    ? await vidsrcClient.getMovieSources(tmdbId)
    : await vidsrcClient.getTVSources(tmdbId, season || 1, episode || 1);

  // Get details and episodes for TV shows
  let title = '';
  let episodes: Episode[] = [];
  let totalSeasons = 0;

  if (params.type === 'movie') {
    const movie = await tmdbClient.getMovieDetails(tmdbId);
    title = movie.title;
  } else {
    const [show, seasonData] = await Promise.all([
      tmdbClient.getTVDetails(tmdbId),
      season ? tmdbClient.getTVSeasonDetails(tmdbId, season).catch(() => null) : null
    ]);
    
    title = show.name;
    totalSeasons = show.number_of_seasons;
    
    if (seasonData) {
      episodes = seasonData.episodes;
      const currentEp = episodes.find(e => e.episode_number === episode);
      if (currentEp) {
        title = `${show.name} - ${currentEp.name}`;
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <VideoPlayerWrapper
        sources={sources}
        title={title}
        tmdbId={tmdbId}
        mediaType={params.type}
        season={season}
        episode={episode}
        episodes={episodes}
        totalSeasons={totalSeasons}
      />
    </div>
  );
}
