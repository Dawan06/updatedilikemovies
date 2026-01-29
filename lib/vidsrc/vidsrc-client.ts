import { VideoSource } from '@/types';

interface EmbedProvider {
  name: string;
  getMovieUrl: (tmdbId: number) => string;
  getTVUrl: (tmdbId: number, season: number, episode: number) => string;
  priority?: number; // Lower number = higher priority (shown first)
  quality?: 'high' | 'medium' | 'auto'; // Quality indicator
}

// Your 3: vidsrc.to, vidsrc.lol, SuperEmbed. Server 4–5: different providers (not VidSrc duplicates).
const EMBED_PROVIDERS: EmbedProvider[] = [
  {
    name: 'Server 1',
    getMovieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
    priority: 1,
    quality: 'high',
  },
  {
    name: 'Server 2',
    getMovieUrl: (id) => `https://vidsrc.lol/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.lol/embed/tv/${id}/${s}/${e}`,
    priority: 2,
    quality: 'high',
  },
  {
    name: 'Server 3',
    getMovieUrl: (id) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
    getTVUrl: (id, s, e) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    priority: 3,
    quality: 'high',
  },
  {
    name: 'Server 4',
    getMovieUrl: (id) => `https://2embed.cc/embed/${id}`,
    getTVUrl: (id, s, e) => `https://2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
    priority: 4,
    quality: 'high',
  },
  {
    name: 'Server 5',
    getMovieUrl: (id) => `https://player.smashy.stream/movie/${id}`,
    getTVUrl: (id, s, e) => `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
    priority: 5,
    quality: 'high',
  },
];

export class VidsrcClient {
  async getMovieSources(tmdbId: number): Promise<VideoSource[]> {
    // Create sources from all providers - client will test and sort by performance
    const sources: VideoSource[] = EMBED_PROVIDERS.map((provider) => ({
      url: provider.getMovieUrl(tmdbId),
      quality: provider.quality === 'high' ? 'HD+' : provider.quality === 'medium' ? 'HD' : 'Auto',
      type: 'iframe',
      provider: provider.name,
    }));

    return sources;
  }

  async getTVSources(tmdbId: number, season: number, episode: number): Promise<VideoSource[]> {
    // Create sources from all providers - client will test and sort by performance
    const sources: VideoSource[] = EMBED_PROVIDERS.map((provider) => ({
      url: provider.getTVUrl(tmdbId, season, episode),
      quality: provider.quality === 'high' ? 'HD+' : provider.quality === 'medium' ? 'HD' : 'Auto',
      type: 'iframe',
      provider: provider.name,
    }));

    return sources;
  }
}

export const vidsrcClient = new VidsrcClient();
