import { VideoSource } from '@/types';

interface EmbedProvider {
  name: string;
  getMovieUrl: (tmdbId: number) => string;
  getTVUrl: (tmdbId: number, season: number, episode: number) => string;
}

// Curated list of high-quality, reliable streaming providers with clean UIs
const EMBED_PROVIDERS: EmbedProvider[] = [
  {
    name: 'VidSrc.to',
    getMovieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'VidSrc.me',
    getMovieUrl: (id) => `https://vidsrc.me/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.me/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: '2Embed',
    getMovieUrl: (id) => `https://2embed.cc/embed/${id}`,
    getTVUrl: (id, s, e) => `https://2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    name: 'SuperEmbed',
    getMovieUrl: (id) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
    getTVUrl: (id, s, e) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    name: 'Smashy',
    getMovieUrl: (id) => `https://player.smashy.stream/movie/${id}`,
    getTVUrl: (id, s, e) => `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
  },
  {
    name: 'VidSrc Pro',
    getMovieUrl: (id) => `https://vidsrc.pro/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'Embed.su',
    getMovieUrl: (id) => `https://embed.su/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'VidPlay',
    getMovieUrl: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'VidCloud',
    getMovieUrl: (id) => `https://vidsrc.stream/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.stream/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'VidMoly',
    getMovieUrl: (id) => `https://vidsrc.fun/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.fun/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'Vidsrc.icu',
    getMovieUrl: (id) => `https://vidsrc.icu/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'Vidsrc.ru',
    getMovieUrl: (id) => `https://vidsrc.ru/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.ru/embed/tv/${id}/${s}/${e}`,
  },
];

export class VidsrcClient {
  async getMovieSources(tmdbId: number): Promise<VideoSource[]> {
    const sources: VideoSource[] = EMBED_PROVIDERS.map((provider) => ({
      url: provider.getMovieUrl(tmdbId),
      quality: 'Auto',
      type: 'iframe',
      provider: provider.name,
    }));

    return sources;
  }

  async getTVSources(tmdbId: number, season: number, episode: number): Promise<VideoSource[]> {
    const sources: VideoSource[] = EMBED_PROVIDERS.map((provider) => ({
      url: provider.getTVUrl(tmdbId, season, episode),
      quality: 'Auto',
      type: 'iframe',
      provider: provider.name,
    }));

    return sources;
  }
}

export const vidsrcClient = new VidsrcClient();
