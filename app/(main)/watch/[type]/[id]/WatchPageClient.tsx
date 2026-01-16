'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { VideoSource, Episode } from '@/types';
import { LogIn, Play } from 'lucide-react';

// Lazy load video player - only load when user is signed in and ready to watch
const VideoPlayerWrapper = dynamic(
  () => import('@/components/video-player/VideoPlayerWrapper'),
  { ssr: false }
);

interface WatchPageClientProps {
  sources: VideoSource[];
  title: string;
  tmdbId: number;
  mediaType: string;
  season?: number;
  episode?: number;
  episodes?: Episode[];
  totalSeasons?: number;
}

export default function WatchPageClient({
  sources,
  title,
  tmdbId,
  mediaType,
  season,
  episode,
  episodes,
  totalSeasons,
}: WatchPageClientProps) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center px-4 max-w-md">
          <div className="mb-6">
            <Play className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
            <h1 className="text-3xl font-bold text-white mb-2">Sign in to Watch</h1>
            <p className="text-gray-400">
              Create a free account to start watching {title}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href={`/sign-in?redirect_url=/watch/${mediaType}/${tmdbId}${season ? `?season=${season}&episode=${episode}` : ''}`}
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-md font-semibold text-lg transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </Link>
            <Link
              href={`/${mediaType}/${tmdbId}`}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Back to Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <VideoPlayerWrapper
        sources={sources}
        title={title}
        tmdbId={tmdbId}
        mediaType={mediaType}
        season={season}
        episode={episode}
        episodes={episodes}
        totalSeasons={totalSeasons}
      />
    </div>
  );
}
