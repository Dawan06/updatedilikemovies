'use client';

import { useEffect, useState } from 'react';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { CheckCircle, X } from 'lucide-react';

export default function WatchlistSyncNotification() {
  const { synced } = useWatchlist();
  const [showNotification, setShowNotification] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if migration just completed
    if (synced && typeof window !== 'undefined') {
      const migrationData = sessionStorage.getItem('watchlist_migration');
      if (migrationData) {
        try {
          const data = JSON.parse(migrationData);
          if (data.migrated > 0) {
            setMigrationMessage(`${data.migrated} item${data.migrated === 1 ? '' : 's'} synced to cloud`);
            setShowNotification(true);
            sessionStorage.removeItem('watchlist_migration');
            
            // Auto-hide after 5 seconds
            setTimeout(() => setShowNotification(false), 5000);
          }
        } catch {
          sessionStorage.removeItem('watchlist_migration');
        }
      }
    }
  }, [synced]);

  if (!showNotification || !migrationMessage) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-fade-in-down">
      <div className="bg-green-500/90 backdrop-blur-sm border border-green-400/50 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 min-w-[300px]">
        <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
        <p className="text-white text-sm font-medium flex-1">{migrationMessage}</p>
        <button
          onClick={() => setShowNotification(false)}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
