'use client';

import { useState, useEffect, useRef } from 'react';
import { VideoSource, Episode } from '@/types';
import { 
  ArrowLeft, Server, X, ChevronRight, ChevronLeft, 
  Tv, List, Monitor, RefreshCw, Wifi, WifiOff, Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface VideoPlayerProps {
  readonly sources: VideoSource[];
  readonly title?: string;
  readonly tvId?: number;
  readonly currentSeason?: number;
  readonly currentEpisode?: number;
  readonly episodes?: Episode[];
  readonly totalSeasons?: number;
}

interface ServerStatus {
  index: number;
  speed: number;
  status: 'testing' | 'fast' | 'slow' | 'failed';
}

export default function VideoPlayer({ 
  sources, 
  title,
  tvId,
  currentSeason,
  currentEpisode,
  episodes,
  totalSeasons
}: VideoPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showServers, setShowServers] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>([]);
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'medium' | 'slow'>('fast');
  const preloadRefs = useRef<Map<number, HTMLIFrameElement>>(new Map());

  const currentSource = sources[currentIndex];
  const isTV = !!tvId && !!currentSeason && !!currentEpisode;

  // Test server speeds (for display only - no auto-selection)
  useEffect(() => {
    const testServers = async () => {
      const statuses: ServerStatus[] = [];
      
      // Test all servers in parallel to show speed badges
      const testPromises = sources.map(async (source, index) => {
        const startTime = Date.now();
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          
          await fetch(source.url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
          });
          clearTimeout(timeout);
          
          const speed = Date.now() - startTime;
          const status: 'fast' | 'slow' | 'failed' = speed < 2000 ? 'fast' : speed < 5000 ? 'slow' : 'failed';
          return {
            index,
            speed,
            status,
          };
        } catch {
          return {
            index,
            speed: 10000,
            status: 'failed' as 'failed',
          };
        }
      });

      const results = await Promise.all(testPromises);
      statuses.push(...results);

      setServerStatuses(statuses);
      // No auto-selection - user chooses manually
    };

    if (sources.length > 0) {
      testServers();
    }
  }, [sources]);

  // Preload next servers in background
  useEffect(() => {
    const toPreload = [currentIndex, currentIndex + 1, currentIndex + 2]
      .filter(i => i < sources.length);

    toPreload.forEach((index) => {
      if (index !== currentIndex) {
        const iframe = document.createElement('iframe');
        iframe.src = sources[index].url;
        iframe.style.display = 'none';
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.allowFullscreen = true;
        iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
        document.body.appendChild(iframe);
        preloadRefs.current.set(index, iframe);
      }
    });

    return () => {
      preloadRefs.current.forEach((iframe, index) => {
        if (!toPreload.includes(index)) {
          iframe.remove();
          preloadRefs.current.delete(index);
        }
      });
    };
  }, [currentIndex, sources]);

  // Detect connection quality
  useEffect(() => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        const updateConnection = () => {
          const effectiveType = conn.effectiveType;
          if (effectiveType === '4g' || effectiveType === '3g') {
            setConnectionQuality('fast');
          } else if (effectiveType === '2g') {
            setConnectionQuality('slow');
          } else {
            setConnectionQuality('medium');
          }
        };
        updateConnection();
        conn.addEventListener('change', updateConnection);
        return () => conn.removeEventListener('change', updateConnection);
      }
    }
  }, []);

  // Find prev/next episodes
  const currentEpIndex = episodes?.findIndex(e => e.episode_number === currentEpisode) ?? -1;
  const prevEp = currentEpIndex > 0 ? episodes?.[currentEpIndex - 1] : null;
  const nextEp = episodes && currentEpIndex < episodes.length - 1 ? episodes[currentEpIndex + 1] : null;

  // Close panels on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowServers(false);
        setShowEpisodes(false);
      }
    };
    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, []);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleServerChange = (index: number) => {
    setCurrentIndex(index);
    setShowServers(false);
    setLoading(true);
    setIframeKey(k => k + 1);
  };

  const getServerStatus = (index: number) => {
    const status = serverStatuses.find(s => s.index === index);
    if (!status) return null;
    
    if (status.status === 'fast') {
      return <span className="text-xs text-green-400 font-medium">Fast</span>;
    } else if (status.status === 'slow') {
      return <span className="text-xs text-yellow-400 font-medium">Slow</span>;
    }
    return null;
  };

  if (!sources.length) {
    return (
      <div className="flex items-center justify-center h-full bg-netflix-black text-white">
        <div className="text-center p-8 animate-fade-in-up">
          <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold mb-2">No Sources Available</h2>
          <p className="text-gray-500 mb-6">Try again later or choose another title</p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-md font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Top Bar - Glass Morphism */}
      <div className="absolute top-0 left-0 right-0 z-40 glass-dark border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link 
              href={isTV ? `/tv/${tvId}` : '/'} 
              className="p-2 hover:bg-white/10 rounded-full transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-white font-medium truncate text-sm md:text-base">{title}</h1>
              {isTV && (
                <p className="text-gray-400 text-xs">
                  Season {currentSeason} <span className="text-primary">•</span> Episode {currentEpisode}
                </p>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Connection Quality */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-full">
              {connectionQuality === 'fast' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Good</span>
                </>
              ) : connectionQuality === 'medium' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">OK</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">Slow</span>
                </>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={() => { setIframeKey(k => k + 1); setLoading(true); }}
              className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200"
              title="Refresh Player"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
            
            {/* Episodes (TV only) */}
            {isTV && episodes && (
              <button
                onClick={() => { setShowEpisodes(!showEpisodes); setShowServers(false); }}
                className={`p-2.5 rounded-full transition-all duration-200 ${
                  showEpisodes ? 'bg-primary text-white' : 'hover:bg-white/10 text-white'
                }`}
                title="Episodes"
              >
                <List className="w-5 h-5" />
              </button>
            )}
            
            {/* Servers */}
            <button
              onClick={() => { setShowServers(!showServers); setShowEpisodes(false); }}
              className={`p-2.5 rounded-full transition-all duration-200 ${
                showServers ? 'bg-primary text-white' : 'hover:bg-white/10 text-white'
              }`}
              title="Change Server"
            >
              <Server className="w-5 h-5" />
            </button>
            
            {/* Close */}
            <Link 
              href={isTV ? `/tv/${tvId}` : '/'} 
              className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200"
            >
              <X className="w-5 h-5 text-white" />
            </Link>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-netflix-black/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center animate-fade-in-up">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-white font-medium mb-1">Loading {currentSource?.provider}...</p>
            <p className="text-gray-400 text-sm">Buffering for smooth playback</p>
          </div>
        </div>
      )}

      {/* Server Panel - Glass Morphism */}
      {showServers && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={() => setShowServers(false)} />
          <div className="absolute top-16 right-4 z-50 w-72 glass rounded-xl shadow-2xl overflow-hidden animate-fade-in-down">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <span className="text-white font-semibold">Select Server</span>
              <button onClick={() => setShowServers(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {/* Sort sources by speed: fast first, then by speed ascending */}
              {[...sources]
                .map((source, i) => ({ source, index: i, status: serverStatuses.find(s => s.index === i) }))
                .sort((a, b) => {
                  const statusA = a.status;
                  const statusB = b.status;
                  if (!statusA && !statusB) return 0;
                  if (!statusA) return 1;
                  if (!statusB) return -1;
                  // Fast first
                  if (statusA.status === 'fast' && statusB.status !== 'fast') return -1;
                  if (statusB.status === 'fast' && statusA.status !== 'fast') return 1;
                  // Then by speed
                  return statusA.speed - statusB.speed;
                })
                .map(({ source, index: i, status }) => (
                  <button
                    key={`${source.provider}-${source.url}`}
                    onClick={() => handleServerChange(i)}
                    className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all duration-200 ${
                      currentIndex === i 
                        ? 'bg-primary/20 text-white border-l-2 border-primary' 
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Tv className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{source.provider || `Server ${i + 1}`}</span>
                        {getServerStatus(i)}
                      </div>
                      {status && status.speed < 10000 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {status.speed < 1000 ? `${status.speed}ms` : `${(status.speed / 1000).toFixed(1)}s`} response
                        </p>
                      )}
                    </div>
                    {currentIndex === i && (
                      <span className="text-xs text-primary font-medium">Playing</span>
                    )}
                  </button>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Episodes Panel - Glass Morphism (TV only) */}
      {showEpisodes && isTV && episodes && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={() => setShowEpisodes(false)} />
          <div className="absolute top-16 right-4 z-50 w-96 glass rounded-xl shadow-2xl overflow-hidden animate-fade-in-down">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <span className="text-white font-semibold">Season {currentSeason} Episodes</span>
              <button onClick={() => setShowEpisodes(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/watch/tv/${tvId}?season=${currentSeason}&episode=${ep.episode_number}`}
                  onClick={() => setShowEpisodes(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                    ep.episode_number === currentEpisode 
                      ? 'bg-primary/20 border-l-2 border-primary' 
                      : 'hover:bg-white/10'
                  }`}
                >
                  <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-netflix-gray flex-shrink-0">
                    {ep.still_path ? (
                      <Image 
                        src={`https://image.tmdb.org/t/p/w185${ep.still_path}`} 
                        alt={ep.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                        E{ep.episode_number}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${
                      ep.episode_number === currentEpisode ? 'text-primary' : 'text-white'
                    }`}>
                      {ep.episode_number}. {ep.name}
                    </p>
                    {ep.runtime && <p className="text-xs text-gray-500 mt-0.5">{ep.runtime} min</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Prev/Next Episode Buttons - Glass Style */}
      {isTV && (
        <>
          {prevEp && (
            <Link
              href={`/watch/tv/${tvId}?season=${currentSeason}&episode=${prevEp.episode_number}`}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 glass hover:bg-white/20 p-3 rounded-full transition-all duration-200 hover:scale-110"
              title={`Previous: ${prevEp.name}`}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </Link>
          )}
          {nextEp && (
            <Link
              href={`/watch/tv/${tvId}?season=${currentSeason}&episode=${nextEp.episode_number}`}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 glass hover:bg-white/20 p-3 rounded-full transition-all duration-200 hover:scale-110"
              title={`Next: ${nextEp.name}`}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </Link>
          )}
        </>
      )}

      {/* Bottom Info Bar - Glass Morphism */}
      <div className="absolute bottom-20 left-0 right-0 z-20 px-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="glass px-3 py-1.5 rounded-full text-white text-xs font-medium">
              {currentSource?.provider} <span className="text-gray-400">({currentIndex + 1}/{sources.length})</span>
            </span>
            {connectionQuality === 'slow' && (
              <span className="text-yellow-400 text-xs">Slow connection detected</span>
            )}
          </div>
          
          {isTV && nextEp && (
            <Link 
              href={`/watch/tv/${tvId}?season=${currentSeason}&episode=${nextEp.episode_number}`}
              className="flex items-center gap-2 glass hover:bg-white/20 px-4 py-2 rounded-full text-white transition-all duration-200 text-sm font-medium"
            >
              <span className="hidden sm:inline">Next: {nextEp.name}</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* The Iframe Player */}
      <iframe
        key={`${currentIndex}-${iframeKey}`}
        src={currentSource?.url}
        className="w-full h-full border-0"
        title={title || 'Video Player'}
        allowFullScreen
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        onLoad={handleIframeLoad}
      />
    </div>
  );
}
