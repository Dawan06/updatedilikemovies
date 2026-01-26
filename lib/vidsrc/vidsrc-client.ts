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
    name: 'Smashy',
    getMovieUrl: (id) => `https://player.smashy.stream/movie/${id}`,
    getTVUrl: (id, s, e) => `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
    priority: 7,
    quality: 'medium',
  },
  {
    name: 'VidSrc.xyz',
    getMovieUrl: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
    priority: 8,
    quality: 'high',
  },
  {
    name: 'VidSrc.ru',
    getMovieUrl: (id) => `https://vidsrc.ru/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.ru/embed/tv/${id}/${s}/${e}`,
    priority: 9,
    quality: 'high',
  },
  {
    name: 'VidPlay',
    getMovieUrl: (id) => `https://vidsrc.stream/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.stream/embed/tv/${id}/${s}/${e}`,
    priority: 10,
    quality: 'high',
  },
  {
    name: 'VidCloud',
    getMovieUrl: (id) => `https://vidcloud.icu/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidcloud.icu/embed/tv/${id}/${s}/${e}`,
    priority: 11,
    quality: 'high',
  },
  {
    name: 'VidStream',
    getMovieUrl: (id) => `https://vidstream.pro/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidstream.pro/embed/tv/${id}/${s}/${e}`,
    priority: 12,
    quality: 'medium',
  },
  {
    name: 'VidSrc.cc',
    getMovieUrl: (id) => `https://vidsrc.cc/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.cc/embed/tv/${id}/${s}/${e}`,
    priority: 13,
    quality: 'high',
  },
  {
    name: 'VidSrc.net',
    getMovieUrl: (id) => `https://vidsrc.net/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.net/embed/tv/${id}/${s}/${e}`,
    priority: 14,
    quality: 'high',
  },
  {
    name: 'VidSrc.io',
    getMovieUrl: (id) => `https://vidsrc.io/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.io/embed/tv/${id}/${s}/${e}`,
    priority: 15,
    quality: 'high',
  },
  {
    name: 'VidSrc.com',
    getMovieUrl: (id) => `https://vidsrc.com/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.com/embed/tv/${id}/${s}/${e}`,
    priority: 16,
    quality: 'high',
  },
  {
    name: 'VidSrc.lol',
    getMovieUrl: (id) => `https://vidsrc.lol/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.lol/embed/tv/${id}/${s}/${e}`,
    priority: 17,
    quality: 'high',
  },
  {
    name: 'VidSrc.ws',
    getMovieUrl: (id) => `https://vidsrc.ws/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.ws/embed/tv/${id}/${s}/${e}`,
    priority: 18,
    quality: 'high',
  },
  {
    name: 'VidSrc.tv',
    getMovieUrl: (id) => `https://vidsrc.tv/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.tv/embed/tv/${id}/${s}/${e}`,
    priority: 19,
    quality: 'high',
  },
  {
    name: 'VidSrc.one',
    getMovieUrl: (id) => `https://vidsrc.one/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.one/embed/tv/${id}/${s}/${e}`,
    priority: 20,
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
