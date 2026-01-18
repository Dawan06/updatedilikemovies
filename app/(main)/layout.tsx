import Navbar from '@/components/navigation/Navbar';
import WatchlistSyncNotification from '@/components/watchlist/WatchlistSyncNotification';
import { WatchlistProvider } from '@/lib/contexts/WatchlistContext';

export default function MainLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <WatchlistProvider>
      <div className="min-h-screen bg-netflix-black overflow-x-hidden">
        <Navbar />
        <WatchlistSyncNotification />
        {children}
      </div>
    </WatchlistProvider>
  );
}
