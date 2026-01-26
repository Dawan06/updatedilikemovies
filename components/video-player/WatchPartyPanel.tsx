'use client';

import { Users, Share2, X } from 'lucide-react';
import { useState } from 'react';

interface WatchPartyPanelProps {
  show: boolean;
  onClose: () => void;
  roomId?: string;
  participants?: string[];
}

export default function WatchPartyPanel({
  show,
  onClose,
  roomId,
  participants = [],
}: WatchPartyPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!show) return null;

  const shareUrl = roomId ? `${window.location.origin}/watch-party/${roomId}` : '';

  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  return (
    <div className="absolute top-16 right-4 z-50 w-80 glass rounded-xl shadow-2xl overflow-hidden animate-fade-in-down">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">Watch Party</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        {roomId ? (
          <>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Room ID</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={roomId}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white/10 text-white rounded-lg text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Copy link"
                >
                  <Share2 className="w-4 h-4 text-white" />
                </button>
              </div>
              {copied && (
                <p className="text-green-400 text-xs mt-1">Link copied!</p>
              )}
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Participants ({participants.length})
              </label>
              <div className="space-y-2">
                {participants.length > 0 ? (
                  participants.map((participant, index) => (
                    <div key={index} className="px-3 py-2 bg-white/5 rounded-lg text-white text-sm">
                      {participant}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No participants yet</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm mb-4">Create a watch party to sync playback with friends</p>
            <button
              onClick={async () => {
                // Create watch party room
                try {
                  const response = await fetch('/api/watch-party', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      tmdb_id: 0, // Would need to pass this
                      media_type: 'movie',
                    }),
                  });
                  const data = await response.json();
                  if (data.success) {
                    // Handle room creation
                  }
                } catch (error) {
                  console.error('Failed to create watch party:', error);
                }
              }}
              className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
            >
              Create Watch Party
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
