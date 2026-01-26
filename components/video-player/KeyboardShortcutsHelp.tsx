'use client';

import { X } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  show: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({
  show,
  onClose,
}: KeyboardShortcutsHelpProps) {
  if (!show) return null;

  const shortcuts = [
    { key: 'Space / K', description: 'Play/Pause' },
    { key: '← / J', description: 'Seek backward 10s' },
    { key: '→ / L', description: 'Seek forward 10s' },
    { key: '↑', description: 'Volume up' },
    { key: '↓', description: 'Volume down' },
    { key: 'F', description: 'Toggle fullscreen' },
    { key: 'M', description: 'Mute/Unmute' },
    { key: 'N', description: 'Next episode (TV)' },
    { key: 'P', description: 'Previous episode (TV)' },
    { key: 'S', description: 'Toggle servers' },
    { key: 'E', description: 'Toggle episodes (TV)' },
    { key: '[', description: 'Decrease speed' },
    { key: ']', description: 'Increase speed' },
    { key: '0-9', description: 'Jump to 0-90%' },
    { key: 'Esc', description: 'Close panels' },
    { key: '?', description: 'Show this help' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-netflix-dark rounded-xl border border-white/10 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fade-in-up">
        <div className="sticky top-0 bg-netflix-dark border-b border-white/10 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <span className="text-gray-300 text-sm">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-white/10 text-white text-xs font-mono rounded">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
