'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoSource, Episode } from '@/types';
import {
  ArrowLeft, Server, X, ChevronRight, ChevronLeft,
  Tv, List, Monitor, RefreshCw, Wifi, WifiOff, Loader2,
  Settings, Volume2, VolumeX, Maximize, Minimize, Play, Pause, Users
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useResumeWatching } from '@/lib/hooks/useResumeWatching';
import { usePlayerControls } from '@/lib/hooks/usePlayerControls';
import { useAutoPlay } from '@/lib/hooks/useAutoPlay';
import ResumeOverlay from './ResumeOverlay';
import UpNextOverlay from './UpNextOverlay';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import SkipIntroButton from './SkipIntroButton';
import WatchPartyPanel from './WatchPartyPanel';
import { useSkipIntro } from '@/lib/hooks/useSkipIntro';
import { useWatchTimeTracking } from '@/lib/hooks/useWatchTimeTracking';
import { usePlayerAnalytics } from '@/lib/hooks/usePlayerAnalytics';
import { debounce, throttle } from '@/lib/utils/player-utils';
import {
  getFavoriteServers,
  addFavoriteServer,
  removeFavoriteServer,
  getBlacklistedServers,
  addBlacklistedServer,
  removeBlacklistedServer,
  updateServerPerformance,
  getServerPerformance,
} from '@/lib/utils/server-storage';
import { Star } from 'lucide-react';

interface VideoPlayerProps {
  readonly sources: VideoSource[];
  readonly title?: string;
  readonly tvId?: number;
  readonly currentSeason?: number;
  readonly currentEpisode?: number;
  readonly episodes?: Episode[];
  readonly totalSeasons?: number;
  readonly tmdbId?: number;
  readonly mediaType?: string;
  readonly runtime?: number;
}

interface ServerStatus {
  index: number;
  speed: number;
  status: 'testing' | 'fast' | 'slow' | 'failed';
  working?: boolean;
}

export default function VideoPlayer({
  sources,
  title,
  tvId,
  currentSeason,
  currentEpisode,
  episodes,
  totalSeasons,
  tmdbId,
  mediaType,
  runtime,
}: VideoPlayerProps) {
  // Default to vidsrc.to (index 0, priority 1) - user decides which server to use
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showServers, setShowServers] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWatchParty, setShowWatchParty] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>([]);
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'medium' | 'slow'>('fast');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mouseIdle, setMouseIdle] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [hasResumed, setHasResumed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [serverHealth, setServerHealth] = useState<Map<number, { lastCheck: number; status: 'healthy' | 'unhealthy' }>>(new Map());
  const [favoriteServers, setFavoriteServers] = useState<string[]>([]);
  const [blacklistedServers, setBlacklistedServers] = useState<string[]>([]);
  
  const preloadRefs = useRef<Map<number, HTMLIFrameElement>>(new Map());
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseIdleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSource = sources[currentIndex];
  const isTV = !!tvId && !!currentSeason && !!currentEpisode;
  const mediaTypeValue = mediaType || (isTV ? 'tv' : 'movie');

  // Find prev/next episodes
  const currentEpIndex = episodes?.findIndex(e => e.episode_number === currentEpisode) ?? -1;
  const prevEp = currentEpIndex > 0 ? episodes?.[currentEpIndex - 1] : null;
  const nextEp = episodes && currentEpIndex < episodes.length - 1 ? episodes?.[currentEpIndex + 1] : null;
  const currentEp = episodes?.find(e => e.episode_number === currentEpisode);

  // Skip intro hook
  const {
    showSkipIntro,
    introEndTime,
    handleSkip: handleSkipIntro,
    setCurrentTime: setSkipIntroCurrentTime,
  } = useSkipIntro({
    mediaType: mediaTypeValue as 'movie' | 'tv',
    currentEpisode: currentEp,
    onSkip: (time) => {
      sendIframeMessage('seek', { time });
    },
  });

  // Watch time tracking
  useWatchTimeTracking({
    tmdbId: tmdbId || 0,
    mediaType: mediaTypeValue as 'movie' | 'tv',
    seasonNumber: currentSeason,
    episodeNumber: currentEpisode,
    enabled: !!tmdbId,
  });

  // Player analytics
  const { trackSeek, trackServerSwitch, trackError } = usePlayerAnalytics({
    enabled: true,
  });

  // Resume watching hook
  const {
    showResume,
    progressSeconds: resumeProgressSeconds,
    progressPercent: resumeProgressPercent,
    handleResume: handleResumeClick,
    handleStartFromBeginning,
    formatTime,
  } = useResumeWatching({
    tmdbId: tmdbId || 0,
    mediaType: mediaTypeValue as 'movie' | 'tv',
    seasonNumber: currentSeason,
    episodeNumber: currentEpisode,
    runtime,
    onResume: (progress) => {
      setCurrentProgress(progress);
      setHasResumed(true);
      // Try to seek in iframe (may not work due to cross-origin)
      if (iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(
            { action: 'seek', time: progress },
            '*'
          );
        } catch (e) {
          // Cross-origin restrictions
        }
      }
    },
  });

  // Auto-play next episode hook
  const {
    showCountdown,
    countdown,
    autoPlayEnabled,
    setAutoPlayEnabled,
    detectEpisodeEnd,
    cancelAutoPlay,
    skipCountdown,
  } = useAutoPlay({
    enabled: true,
    countdownDuration: 10,
    nextEpisode: nextEp || undefined,
    currentEpisode,
    currentSeason,
    tvId,
    onAutoPlay: () => {
      if (nextEp && tvId) {
        window.location.href = `/watch/tv/${tvId}?season=${currentSeason}&episode=${nextEp.episode_number}`;
      }
    },
  });

  // Keyboard controls hook
  const { showHelp, setShowHelp, sendIframeMessage } = usePlayerControls({
    onPlayPause: () => {
      sendIframeMessage('playPause');
    },
    onSeek: (delta) => {
      trackSeek();
      sendIframeMessage('seek', { delta });
    },
    onVolumeChange: (delta) => {
      setVolume((prev) => Math.max(0, Math.min(1, prev + delta)));
    },
    onToggleFullscreen: () => {
      toggleFullscreen();
    },
    onToggleMute: () => {
      setIsMuted((prev) => !prev);
    },
    onNextEpisode: () => {
      if (nextEp && tvId) {
        window.location.href = `/watch/tv/${tvId}?season=${currentSeason}&episode=${nextEp.episode_number}`;
      }
    },
    onPrevEpisode: () => {
      if (prevEp && tvId) {
        window.location.href = `/watch/tv/${tvId}?season=${currentSeason}&episode=${prevEp.episode_number}`;
      }
    },
    onToggleServers: () => {
      setShowServers((prev) => !prev);
      setShowEpisodes(false);
    },
    onToggleEpisodes: () => {
      if (isTV) {
        setShowEpisodes((prev) => !prev);
        setShowServers(false);
      }
    },
    onSpeedChange: (delta) => {
      const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
      setPlaybackSpeed((prev) => {
        const currentIndex = speeds.indexOf(prev);
        const newIndex = Math.max(0, Math.min(speeds.length - 1, currentIndex + (delta > 0 ? 1 : -1)));
        const newSpeed = speeds[newIndex];
        sendIframeMessage('setSpeed', { speed: newSpeed });
        return newSpeed;
      });
    },
    onJumpToPercent: (percent) => {
      if (runtime) {
        trackSeek();
        const targetTime = (runtime * 60 * percent) / 100;
        sendIframeMessage('seek', { time: targetTime });
      }
    },
    enabled: true,
    iframeRef,
  });

  // Save playback speed preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('playbackSpeed', playbackSpeed.toString());
    }
  }, [playbackSpeed]);

  // Load playback speed preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('playbackSpeed');
      if (saved) {
        setPlaybackSpeed(parseFloat(saved));
      }
    }
  }, []);

  // Mouse idle detection for hiding controls
  useEffect(() => {
    const handleMouseMove = () => {
      setMouseIdle(false);
      setShowControls(true);
      
      if (controlsHideTimerRef.current) {
        clearTimeout(controlsHideTimerRef.current);
      }
      
      controlsHideTimerRef.current = setTimeout(() => {
        setMouseIdle(true);
        if (!showServers && !showEpisodes && !showSettings && !showHelp) {
          setShowControls(false);
        }
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsHideTimerRef.current) {
        clearTimeout(controlsHideTimerRef.current);
      }
    };
  }, [showServers, showEpisodes, showSettings, showHelp]);

  // Progress tracking (debounced updates)
  const updateProgress = useCallback(
    debounce(async (progress: number) => {
      if (!tmdbId || !mediaTypeValue) return;
      
      // Check for completion (90%+ watched)
      const totalSeconds = runtime ? runtime * 60 : (currentEp?.runtime ? currentEp.runtime * 60 : 0);
      const completionPercent = totalSeconds > 0 ? (progress / totalSeconds) * 100 : 0;
      
      if (completionPercent >= 90) {
        // Mark as completed
        try {
          // You could add an API call here to mark as completed in watchlist
          console.log('Content completed:', { tmdbId, mediaTypeValue, completionPercent });
        } catch (error) {
          console.error('Failed to mark as completed:', error);
        }
      }
      
      try {
        await fetch('/api/viewing-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdb_id: tmdbId,
            media_type: mediaTypeValue,
            progress,
            season_number: currentSeason,
            episode_number: currentEpisode,
          }),
        });
        setCurrentProgress(progress);
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }, 10000), // Update every 10 seconds
    [tmdbId, mediaTypeValue, currentSeason, currentEpisode, runtime, currentEp]
  );

  // Monitor iframe for progress (if possible via postMessage)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Listen for progress updates from iframe (if supported)
      if (event.data?.type === 'progress') {
        const progress = event.data.progress;
        setCurrentProgress(progress);
        updateProgress(progress);
        setSkipIntroCurrentTime(progress);
      } else if (event.data?.type === 'ended') {
        // Episode ended - trigger auto-play
        if (isTV && nextEp) {
          detectEpisodeEnd();
        }
      } else if (event.data?.type === 'error') {
        // Handle iframe errors
        handleIframeError();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isTV, nextEp, detectEpisodeEnd, updateProgress]);

  // Try to hide overlay messages in iframe (limited by cross-origin restrictions)
  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    
    const tryHideOverlays = () => {
      try {
        // Try to access iframe content (will fail for cross-origin, but worth trying)
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          // Inject CSS to hide common overlay messages
          const style = iframeDoc.createElement('style');
          style.textContent = `
            /* Hide "click esc to use cursor" and similar messages */
            [class*="cursor"], [class*="overlay"], [id*="cursor"], [id*="overlay"],
            [class*="esc"], [id*="esc"], [class*="message"], [id*="message"],
            [class*="tooltip"], [id*="tooltip"], [class*="hint"], [id*="hint"] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }
            /* Common overlay patterns */
            .overlay-message, .cursor-message, .esc-message,
            [data-overlay], [data-cursor], [data-esc],
            .vjs-overlay, .plyr__overlay {
              display: none !important;
            }
            /* Hide elements containing common overlay text */
            * {
              user-select: auto !important;
            }
          `;
          iframeDoc.head.appendChild(style);
          
          // Also try to find and remove overlay elements
          const overlays = iframeDoc.querySelectorAll('[class*="cursor"], [class*="overlay"], [id*="cursor"], [id*="esc"]');
          overlays.forEach(el => {
            (el as HTMLElement).style.display = 'none';
            (el as HTMLElement).remove();
          });
        }
      } catch (e) {
        // Cross-origin restriction - can't access iframe content
        // This is expected for most video hosting sites
      }
    };

    // Try after iframe loads
    iframe.addEventListener('load', tryHideOverlays);
    
    // Also try immediately and with delays in case iframe is already loaded
    setTimeout(tryHideOverlays, 500);
    setTimeout(tryHideOverlays, 1500);
    setTimeout(tryHideOverlays, 3000);

    return () => {
      iframe.removeEventListener('load', tryHideOverlays);
    };
  }, [currentIndex, iframeKey]);

  // Handle ESC key to dismiss overlays and improve cursor behavior
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Send ESC to iframe to dismiss any overlays
        if (iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage({ type: 'keydown', key: 'Escape' }, '*');
          } catch (e) {
            // Cross-origin restriction
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fullscreen handling - try iframe fullscreen first, then container
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        // Try iframe fullscreen first (if supported by the embedded player)
        if (iframeRef.current?.requestFullscreen) {
          try {
            await iframeRef.current.requestFullscreen();
            setIsFullscreen(true);
            return;
          } catch (e) {
            // If iframe fullscreen fails, try container
          }
        }
        
        // Fallback to container fullscreen
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          // Safari support
          await (containerRef.current as any).webkitRequestFullscreen();
          setIsFullscreen(true);
        } else if ((containerRef.current as any)?.mozRequestFullScreen) {
          // Firefox support
          await (containerRef.current as any).mozRequestFullScreen();
          setIsFullscreen(true);
        } else if ((containerRef.current as any)?.msRequestFullscreen) {
          // IE/Edge support
          await (containerRef.current as any).msRequestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      // Fallback: try container fullscreen
      if (!document.fullscreenElement && containerRef.current) {
        try {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch (e) {
          console.error('Container fullscreen also failed:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Load server preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFavoriteServers(getFavoriteServers());
      setBlacklistedServers(getBlacklistedServers());
    }
  }, []);

  // Test server speeds (for display only - user decides which server to use)
  useEffect(() => {
    const testServers = async () => {
      const statuses: ServerStatus[] = [];

      const testPromises = sources.map(async (source, index) => {
        // Skip blacklisted servers
        if (blacklistedServers.includes(source.url)) {
          return {
            index,
            speed: 10000,
            status: 'failed' as 'failed',
            working: false,
          };
        }

        const startTime = Date.now();
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);

          await fetch(source.url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
          });
          clearTimeout(timeout);

          const speed = Date.now() - startTime;
          const status: 'fast' | 'slow' | 'failed' = speed < 2000 ? 'fast' : speed < 5000 ? 'slow' : 'failed';
          
          // Update performance tracking
          updateServerPerformance(source.url, true, speed);
          
          return {
            index,
            speed,
            status,
            working: true,
          };
        } catch {
          updateServerPerformance(source.url, false, 10000);
          return {
            index,
            speed: 10000,
            status: 'failed' as 'failed',
            working: false,
          };
        }
      });

      const results = await Promise.all(testPromises);
      statuses.push(...results);

      setServerStatuses(statuses);
      // Note: User manually selects servers - no auto-selection
    };

    if (sources.length > 0) {
      testServers();
    }
  }, [sources, blacklistedServers]);

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

  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
    setRetryCount(0);
  };

  const handleIframeError = useCallback(() => {
    trackError();
    setError('Failed to load video. Please select a different server.');
    setLoading(false);
    // User decides which server to use - no auto-retry
  }, [trackError]);

  const handleServerChange = (index: number) => {
    setCurrentIndex(index);
    setShowServers(false);
    setLoading(true);
    setIframeKey(k => k + 1);
    trackServerSwitch();
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
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
      {/* Resume Overlay */}
      {showResume && !hasResumed && (
        <ResumeOverlay
          show={showResume}
          progressPercent={resumeProgressPercent}
          progressTime={formatTime(resumeProgressSeconds)}
          onResume={handleResumeClick}
          onStartFromBeginning={handleStartFromBeginning}
        />
      )}

      {/* Up Next Overlay */}
      {showCountdown && nextEp && (
        <UpNextOverlay
          show={showCountdown}
          countdown={countdown}
          nextEpisode={nextEp}
          tvId={tvId!}
          currentSeason={currentSeason!}
          onCancel={cancelAutoPlay}
          onSkip={skipCountdown}
        />
      )}

      {/* Skip Intro Button */}
      <SkipIntroButton
        show={showSkipIntro}
        onSkip={handleSkipIntro}
        introEndTime={introEndTime}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        show={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center animate-fade-in-up max-w-md mx-4">
            <Monitor className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold mb-2 text-white">Playback Error</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  setRetryCount(0);
                  setIframeKey(k => k + 1);
                  setLoading(true);
                }}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setShowServers(true);
                }}
                className="glass hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Change Server
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar - Glass Morphism */}
      <div className={`absolute top-0 left-0 right-0 z-40 glass-dark border-b border-white/5 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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

            {/* Playback Speed */}
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-white/5 rounded-full">
              <span className="text-xs text-white font-medium">{playbackSpeed}x</span>
            </div>

            {/* Refresh */}
            <button
              onClick={() => { setIframeKey(k => k + 1); setLoading(true); }}
              className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200"
              title="Refresh Player"
              aria-label="Refresh video player"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>

            {/* Watch Party */}
            <button
              onClick={() => { setShowWatchParty(!showWatchParty); setShowServers(false); setShowEpisodes(false); setShowSettings(false); }}
              className={`p-2.5 rounded-full transition-all duration-200 ${showWatchParty ? 'bg-primary text-white' : 'hover:bg-white/10 text-white'}`}
              title="Watch Party"
            >
              <Users className="w-5 h-5" />
            </button>

            {/* Settings */}
            <button
              onClick={() => { setShowSettings(!showSettings); setShowServers(false); setShowEpisodes(false); setShowWatchParty(false); }}
              className={`p-2.5 rounded-full transition-all duration-200 ${showSettings ? 'bg-primary text-white' : 'hover:bg-white/10 text-white'}`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Episodes (TV only) */}
            {isTV && episodes && (
              <button
                onClick={() => { setShowEpisodes(!showEpisodes); setShowServers(false); setShowSettings(false); }}
                className={`p-2.5 rounded-full transition-all duration-200 ${showEpisodes ? 'bg-primary text-white' : 'hover:bg-white/10 text-white'}`}
                title="Episodes"
              >
                <List className="w-5 h-5" />
              </button>
            )}

            {/* Servers */}
            <button
              onClick={() => { setShowServers(!showServers); setShowEpisodes(false); setShowSettings(false); }}
              className={`p-2.5 rounded-full transition-all duration-200 ${showServers ? 'bg-primary text-white' : 'hover:bg-white/10 text-white'}`}
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

      {/* Watch Party Panel */}
      {showWatchParty && (
        <WatchPartyPanel
          show={showWatchParty}
          onClose={() => setShowWatchParty(false)}
        />
      )}

      {/* Settings Panel */}
      {showSettings && (
        <>
          <button className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="absolute top-16 right-4 z-50 w-72 glass rounded-xl shadow-2xl overflow-hidden animate-fade-in-down">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <span className="text-white font-semibold">Settings</span>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Playback Speed */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Playback Speed</label>
                <div className="flex flex-wrap gap-2">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => {
                        setPlaybackSpeed(speed);
                        sendIframeMessage('setSpeed', { speed });
                      }}
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${
                        playbackSpeed === speed
                          ? 'bg-primary text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-play */}
              {isTV && (
                <div className="flex items-center justify-between">
                  <label className="text-white text-sm font-medium">Auto-play next episode</label>
                  <button
                    onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      autoPlayEnabled ? 'bg-primary' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      autoPlayEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              )}

              {/* Keyboard Shortcuts */}
              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowHelp(true);
                }}
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                View Keyboard Shortcuts
              </button>
            </div>
          </div>
        </>
      )}

      {/* Server Panel - Glass Morphism */}
      {showServers && (
        <>
          <button className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm" onClick={() => setShowServers(false)} />
          <div className="absolute top-16 right-4 z-50 w-72 glass rounded-xl shadow-2xl overflow-hidden animate-fade-in-down">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <span className="text-white font-semibold">Select Server</span>
              <button onClick={() => setShowServers(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {[...sources]
                .map((source, i) => ({ source, index: i, status: serverStatuses.find(s => s.index === i) }))
                // Filter out servers without valid ms stats (speed >= 10000 means not connected/tested)
                .filter(({ status }) => {
                  // Always show current server, even if no stats yet
                  if (status && status.index === currentIndex) return true;
                  // Only show servers with valid speed stats (connected and tested)
                  return status && status.speed < 10000 && status.working !== false;
                })
                .sort((a, b) => {
                  const statusA = a.status;
                  const statusB = b.status;

                  if (statusA && statusB) {
                    const aWorking = statusA.working !== false && statusA.status !== 'failed';
                    const bWorking = statusB.working !== false && statusB.status !== 'failed';
                    if (aWorking && !bWorking) return -1;
                    if (!aWorking && bWorking) return 1;

                    if (aWorking && bWorking) {
                      return statusA.speed - statusB.speed;
                    }

                    return statusA.speed - statusB.speed;
                  }

                  if (statusA && !statusB) return -1;
                  if (!statusA && statusB) return 1;

                  const qualityOrder: Record<string, number> = { 'HD+': 1, 'HD': 2, 'Auto': 3 };
                  const qualityA = qualityOrder[a.source.quality] || 3;
                  const qualityB = qualityOrder[b.source.quality] || 3;
                  return qualityA - qualityB;
                })
                .map(({ source, index: i, status }) => {
                  const isHighQuality = source.quality === 'HD+';
                  const isMediumQuality = source.quality === 'HD';

                  return (
                    <button
                      key={`${source.provider}-${source.url}`}
                      onClick={() => handleServerChange(i)}
                      className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all duration-200 ${
                        currentIndex === i
                          ? 'bg-primary/20 text-white border-l-2 border-primary'
                          : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isHighQuality ? 'bg-green-500/20' : isMediumQuality ? 'bg-blue-500/20' : 'bg-white/10'
                      }`}>
                        <Tv className={`w-4 h-4 ${
                          isHighQuality ? 'text-green-400' : isMediumQuality ? 'text-blue-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{source.provider || `Server ${i + 1}`}</span>
                          {isHighQuality && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-medium">
                              HD+
                            </span>
                          )}
                          {isMediumQuality && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-medium">
                              HD
                            </span>
                          )}
                          {getServerStatus(i)}
                        </div>
                        {status && status.speed < 10000 && status.working !== false && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {status.speed < 1000 ? `${status.speed}ms` : `${(status.speed / 1000).toFixed(1)}s`} response
                          </p>
                        )}
                      </div>
                      {currentIndex === i && (
                        <span className="text-xs text-primary font-medium">Playing</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const isFavorite = favoriteServers.includes(source.url);
                          if (isFavorite) {
                            removeFavoriteServer(source.url);
                            setFavoriteServers(prev => prev.filter(url => url !== source.url));
                          } else {
                            addFavoriteServer(source.url);
                            setFavoriteServers(prev => [...prev, source.url]);
                          }
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title={favoriteServers.includes(source.url) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`w-4 h-4 ${
                          favoriteServers.includes(source.url)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-400'
                        }`} />
                      </button>
                      {blacklistedServers.includes(source.url) && (
                        <span className="text-xs text-red-400">Blacklisted</span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      )}

      {/* Episodes Panel - Glass Morphism (TV only) */}
      {showEpisodes && isTV && episodes && (
        <>
          <button className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm" onClick={() => setShowEpisodes(false)} />
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
      {isTV && showControls && (
        <>
          {prevEp && (
            <Link
              href={`/watch/tv/${tvId}?season=${currentSeason}&episode=${prevEp.episode_number}`}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 glass hover:bg-white/20 p-3 rounded-full transition-all duration-200 hover:scale-110 hidden md:flex"
              title={`Previous: ${prevEp.name}`}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </Link>
          )}
          {nextEp && (
            <Link
              href={`/watch/tv/${tvId}?season=${currentSeason}&episode=${nextEp.episode_number}`}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 glass hover:bg-white/20 p-3 rounded-full transition-all duration-200 hover:scale-110 hidden md:flex"
              title={`Next: ${nextEp.name}`}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </Link>
          )}
        </>
      )}

      {/* Bottom Info Bar - Glass Morphism */}
      {showControls && (
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
      )}

      {/* The Iframe Player */}
      <div className="relative w-full h-full iframe-wrapper">
        <iframe
          ref={iframeRef}
          key={`${currentIndex}-${iframeKey}`}
          src={currentSource?.url}
          className="w-full h-full border-0 iframe-player"
          title={title || 'Video Player'}
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture; pointer-lock"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          aria-label={`Video player for ${title}`}
          role="application"
          style={{
            pointerEvents: 'auto',
            cursor: 'default',
          }}
        />
      </div>
    </div>
  );
}
