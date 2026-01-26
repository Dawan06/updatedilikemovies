'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePlayerControlsOptions {
  onPlayPause?: () => void;
  onSeek?: (seconds: number) => void;
  onVolumeChange?: (delta: number) => void;
  onToggleFullscreen?: () => void;
  onToggleMute?: () => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  onToggleServers?: () => void;
  onToggleEpisodes?: () => void;
  onSpeedChange?: (delta: number) => void;
  onJumpToPercent?: (percent: number) => void;
  enabled?: boolean;
  iframeRef?: React.RefObject<HTMLIFrameElement>;
}

export function usePlayerControls({
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleFullscreen,
  onToggleMute,
  onNextEpisode,
  onPrevEpisode,
  onToggleServers,
  onToggleEpisodes,
  onSpeedChange,
  onJumpToPercent,
  enabled = true,
  iframeRef,
}: UsePlayerControlsOptions) {
  const [showHelp, setShowHelp] = useState(false);
  const keysPressed = useRef<Set<string>>(new Set());

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Prevent default for shortcuts
      const preventDefault = () => {
        e.preventDefault();
        e.stopPropagation();
      };

      switch (e.key) {
        case ' ': // Space - Play/Pause
          preventDefault();
          onPlayPause?.();
          break;

        case 'k':
        case 'K': // K - Play/Pause (alternative)
          preventDefault();
          onPlayPause?.();
          break;

        case 'ArrowLeft':
          preventDefault();
          onSeek?.(-10); // Seek backward 10 seconds
          break;

        case 'ArrowRight':
          preventDefault();
          onSeek?.(10); // Seek forward 10 seconds
          break;

        case 'j':
        case 'J': // J - Seek backward 10 seconds (Netflix-style)
          preventDefault();
          onSeek?.(-10);
          break;

        case 'l':
        case 'L': // L - Seek forward 10 seconds (Netflix-style)
          preventDefault();
          onSeek?.(10);
          break;

        case 'ArrowUp':
          preventDefault();
          onVolumeChange?.(0.1); // Volume up
          break;

        case 'ArrowDown':
          preventDefault();
          onVolumeChange?.(-0.1); // Volume down
          break;

        case 'f':
        case 'F': // F - Toggle fullscreen
          preventDefault();
          onToggleFullscreen?.();
          break;

        case 'm':
        case 'M': // M - Mute/unmute
          preventDefault();
          onToggleMute?.();
          break;

        case 'n':
        case 'N': // N - Next episode (TV shows)
          preventDefault();
          onNextEpisode?.();
          break;

        case 'p':
        case 'P': // P - Previous episode (TV shows)
          preventDefault();
          onPrevEpisode?.();
          break;

        case 's':
        case 'S': // S - Toggle server selection panel
          preventDefault();
          onToggleServers?.();
          break;

        case 'e':
        case 'E': // E - Toggle episode list (TV shows)
          preventDefault();
          onToggleEpisodes?.();
          break;

        case '[': // [ - Decrease playback speed
          preventDefault();
          onSpeedChange?.(-0.25);
          break;

        case ']': // ] - Increase playback speed
          preventDefault();
          onSpeedChange?.(0.25);
          break;

        case '?': // ? - Show keyboard shortcuts help
          preventDefault();
          setShowHelp((prev) => !prev);
          break;

        case 'Escape': // Esc - Close panels, exit fullscreen
          if (showHelp) {
            preventDefault();
            setShowHelp(false);
          }
          break;

        default:
          // Number keys 0-9 for jumping to percentage
          if (e.key >= '0' && e.key <= '9') {
            const percent = parseInt(e.key) * 10;
            preventDefault();
            onJumpToPercent?.(percent);
          }
          break;
      }
    },
    [
      enabled,
      onPlayPause,
      onSeek,
      onVolumeChange,
      onToggleFullscreen,
      onToggleMute,
      onNextEpisode,
      onPrevEpisode,
      onToggleServers,
      onToggleEpisodes,
      onSpeedChange,
      onJumpToPercent,
      showHelp,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Try to send postMessage to iframe for controls
  const sendIframeMessage = useCallback(
    (action: string, data?: any) => {
      if (iframeRef?.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(
            { action, ...data },
            '*'
          );
        } catch (error) {
          // Cross-origin restrictions may prevent this
          console.debug('Could not send message to iframe:', error);
        }
      }
    },
    [iframeRef]
  );

  return {
    showHelp,
    setShowHelp,
    sendIframeMessage,
  };
}
