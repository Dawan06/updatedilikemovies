import { VideoSource } from '@/types';

interface EmbedProvider {
  name: string;
  getMovieUrl: (tmdbId: number) => string;
  getTVUrl: (tmdbId: number, season: number, episode: number) => string;
  priority?: number; // Lower number = higher priority (shown first)
  quality?: 'high' | 'medium' | 'auto'; // Quality indicator
}

// Restored user-preferred servers and trusted aggregators
// Focus on VidSrc family and broad aggregators (like 123movies/Goku style)
const EMBED_PROVIDERS: EmbedProvider[] = [
  // User Favorite: VidSrc.to (Priority 1)
  {
    name: 'VidSrc.to',
    getMovieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
    priority: 1,
    quality: 'high',
  },

  // Classic VidSrc family (Reliable, classic layout)
  {
    name: 'VidSrc.me',
    getMovieUrl: (id) => `https://vidsrc.me/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.me/embed/tv/${id}/${s}/${e}`,
    priority: 2,
    quality: 'high',
  },
  {
    name: 'VidSrc Pro',
    getMovieUrl: (id) => `https://vidsrc.pro/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`,
    priority: 3,
    quality: 'high',
  },

  // SuperEmbed / MultiEmbed 
  // (Aggregator that behaves like 123movies/Goku - finding multiple internal sources)
  {
    name: 'SuperEmbed',
    getMovieUrl: (id) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
    getTVUrl: (id, s, e) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    priority: 4,
    quality: 'high',
  },

  // 2Embed (Classic 123movies style embed)
  {
    name: '2Embed',
    getMovieUrl: (id) => `https://2embed.cc/embed/${id}`,
    getTVUrl: (id, s, e) => `https://2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
    priority: 5,
    quality: 'medium',
  },

  // Fallbacks
  {
    name: 'Vidsrc.icu',
    getMovieUrl: (id) => `https://vidsrc.icu/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
    priority: 6,
    quality: 'auto',
  },
  {
    name: 'Smashy', // Kept as deep backup just in case
    getMovieUrl: (id) => `https://player.smashy.stream/movie/${id}`,
    getTVUrl: (id, s, e) => `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
    priority: 7,
    quality: 'medium',
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
