'use client';

import FastStreamPlayer from './FastStreamPlayer';
import { VideoSource, Episode } from '@/types';

interface VideoPlayerWrapperProps {
  sources: VideoSource[];
  title: string;
  tmdbId: number;
  mediaType: string;
  season?: number;
  episode?: number;
  episodes?: Episode[];
  totalSeasons?: number;
}

export default function VideoPlayerWrapper({ 
  sources, 
  title, 
  tmdbId,
  mediaType,
  season,
  episode,
  episodes,
  totalSeasons 
}: VideoPlayerWrapperProps) {
  return (
    <FastStreamPlayer 
      sources={sources} 
      title={title}
      tvId={mediaType === 'tv' ? tmdbId : undefined}
      currentSeason={season}
      currentEpisode={episode}
      episodes={episodes}
      totalSeasons={totalSeasons}
    />
  );
}
