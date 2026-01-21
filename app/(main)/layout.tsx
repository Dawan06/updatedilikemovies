import Navbar from '@/components/navigation/Navbar';
import WatchlistSyncNotification from '@/components/watchlist/WatchlistSyncNotification';
import Footer from '@/components/layout/Footer';
import { WatchlistProvider } from '@/lib/contexts/WatchlistContext';

export default function MainLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <WatchlistProvider>
      <div className="min-h-screen bg-netflix-black overflow-x-hidden flex flex-col">
        <Navbar />
        <WatchlistSyncNotification />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </div>
    </WatchlistProvider>
  );
}
