'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  Bookmark, Plus, Upload, Film, Tv, Loader2, Search, X,
  Trash2, CheckSquare, ChevronLeft, ChevronRight, LogIn,
  PlayCircle, CheckCircle2, Clock, PieChart, Sparkles, Dices, Shuffle
} from 'lucide-react';
import MovieCard from '@/components/movie-card/MovieCard';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

interface WatchlistItemWithDetails {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  added_at: string;
  status: 'watching' | 'completed' | 'plan_to_watch';
  details: {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
    overview: string;
    runtime?: number;
    episode_run_time?: number[];
  };
}

type FilterType = 'all' | 'movie' | 'tv';
type SortType = 'added' | 'title' | 'year';

export default function MyListPage() {
  const { isSignedIn, isLoaded: authLoaded } = useUser();
  const { items: watchlistItems, loading: watchlistLoading, error: watchlistError, removeItem, refresh } = useWatchlist();
  const [items, setItems] = useState<WatchlistItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('added');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Select mode state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Show sign-in prompt for guests
  if (authLoaded && !isSignedIn) {
    return (
      <main className="min-h-screen bg-netflix-black px-4 md:px-12 py-12 flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg mx-auto"
        >
          <div className="relative inline-flex items-center justify-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute w-40 h-40 bg-primary rounded-full blur-3xl"
            />
            <div className="relative w-28 h-28 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 backdrop-blur-xl shadow-2xl">
              <Bookmark className="w-14 h-14 text-white/80" />
            </div>
          </div>

          <h2 className="text-white text-3xl font-bold mb-4">Your Private Collection</h2>
          <p className="text-gray-400 mb-10 text-lg">
            Create an account to curate your personal library of movies and TV shows. Track your favorites, what you've watched, and what's next.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:scale-105 shadow-glow"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all hover:scale-105 backdrop-blur-md"
            >
              <Plus className="w-5 h-5" />
              Create Account
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  const loadWatchlistDetails = useCallback(async () => {
    try {
      if (watchlistItems.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Convert WatchlistItem to format expected by details API
      const itemsForDetails = watchlistItems.map(item => ({
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
        status: item.status || 'plan_to_watch',
        added_at: item.added_at,
      }));

      const response = await fetch('/api/watchlist/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsForDetails }),
      });

      if (!response.ok) throw new Error('Failed to fetch details');

      const data = await response.json();
      const itemsWithStatus = (data.items || []).map((item: any) => ({
        ...item,
        status: item.status || 'plan_to_watch',
      }));
      setItems(itemsWithStatus);
      setError(null);
    } catch (err) {
      console.error('Error loading watchlist details:', err);
      setError('Failed to load watchlist details');
    } finally {
      setLoading(false);
    }
  }, [watchlistItems]);

  useEffect(() => {
    if (!watchlistLoading) loadWatchlistDetails();
  }, [watchlistLoading, loadWatchlistDetails]);

  useEffect(() => {
    if (watchlistError) {
      setError(watchlistError);
      setLoading(false);
    }
  }, [watchlistError]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Apply type filter
    if (filter !== 'all') {
      result = result.filter(item => item.media_type === filter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => {
        const title = (item.details.title || item.details.name || '').toLowerCase();
        return title.includes(query);
      });
    }

    // Apply sort
    result.sort((a, b) => {
      if (sortBy === 'title') {
        const titleA = (a.details.title || a.details.name || '').toLowerCase();
        const titleB = (b.details.title || b.details.name || '').toLowerCase();
        return titleA.localeCompare(titleB);
      }
      if (sortBy === 'year') {
        const yearA = (a.details.release_date || a.details.first_air_date || '').slice(0, 4);
        const yearB = (b.details.release_date || b.details.first_air_date || '').slice(0, 4);
        return yearB.localeCompare(yearA); // Newest first
      }
      // Default: sort by date added (newest first)
      return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
    });

    return result;
  }, [items, filter, searchQuery, sortBy]);

  // Paginate filtered items
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, sortBy]);

  const handleSelect = (id: number, type: 'movie' | 'tv') => {
    const key = `${id}-${type}`;
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    try {
      const items = Array.from(selectedItems).map((key) => {
        const [id, type] = key.split('-');
        return {
          tmdbId: parseInt(id),
          mediaType: type as 'movie' | 'tv'
        };
      });

      const response = await fetch('/api/watchlist/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) throw new Error('Delete failed');

      setSelectedItems(new Set());
      setSelectMode(false);
      await refresh();
      await loadWatchlistDetails();
    } catch (err) {
      console.error('[MyList] Error in bulk delete:', err);
      // In a real app, use toast here
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => `${item.tmdb_id}-${item.media_type}`)));
    }
  };

  const handleShuffle = () => {
    if (filteredItems.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredItems.length);
    const item = filteredItems[randomIndex];
    window.location.href = `/${item.media_type}/${item.tmdb_id}`;
  };

  // Stats for the Dashboard
  const stats = useMemo(() => {
    const movieCount = items.filter(i => i.media_type === 'movie').length;
    const tvCount = items.filter(i => i.media_type === 'tv').length;
    // Rough estimate: standard movie 2h, standard tv episode 45m * 10 eps * seasons (simplified here just counting items)
    // For a fun stat, let's just count total items as "Adventures"
    const total = movieCount + tvCount;
    return { movieCount, tvCount, total };
  }, [items]);

  if (loading || watchlistLoading) {
    return (
      <main className="min-h-screen bg-netflix-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-gray-400 font-medium animate-pulse">Fetching your collection...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-netflix-black pb-20">

      {/* 🎭 Creative Header & Stats Dashboard */}
      <div className="relative pt-24 pb-12 px-4 md:px-12 bg-gradient-to-b from-netflix-dark to-netflix-black overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 max-w-[1800px] mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-10">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 mb-2"
              >
                <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/5">
                  Your Library
                </span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-display text-5xl md:text-7xl text-white tracking-wide drop-shadow-lg"
              >
                MY LIST
              </motion.h1>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[100px] backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-1">
                  <Film className="w-3 h-3" /> Movies
                </div>
                <div className="text-2xl font-bold text-white">{stats.movieCount}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[100px] backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-1">
                  <Tv className="w-3 h-3" /> Shows
                </div>
                <div className="text-2xl font-bold text-white">{stats.tvCount}</div>
              </motion.div>
            </div>
          </div>

          {/* 🎛️ Control Center: Search, Filter, Sort */}
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-xl shadow-xl">
            {/* Left: Filter Capsules */}
            <div className="flex items-center bg-black/20 rounded-full p-1.5 self-start lg:self-auto overflow-x-auto max-w-full">
              {(['all', 'movie', 'tv'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`relative px-6 py-2 rounded-full text-sm font-bold transition-colors ${filter === f ? 'text-black' : 'text-gray-400 hover:text-white'
                    }`}
                >
                  {filter === f && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-white rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2 capitalize">
                    {f === 'all' && <Dices className="w-4 h-4" />}
                    {f === 'movie' && <Film className="w-4 h-4" />}
                    {f === 'tv' && <Tv className="w-4 h-4" />}
                    {f === 'all' ? 'Everything' : f === 'movie' ? 'Movies' : 'TV Shows'}
                  </span>
                </button>
              ))}
            </div>

            {/* Right: Search & Actions */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-black/40 transition-all text-sm"
                />
              </div>

              {/* Shuffle Button */}
              <button
                onClick={handleShuffle}
                className="p-2.5 bg-black/20 border border-white/5 rounded-xl text-gray-400 hover:text-primary hover:border-primary/30 transition-all group"
                title="Shuffle Random Pick"
              >
                <Shuffle className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              </button>

              {/* Select Mode Toggle */}
              <button
                onClick={() => { setSelectMode(!selectMode); setSelectedItems(new Set()); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${selectMode
                  ? 'bg-primary border-primary text-white shadow-glow'
                  : 'bg-black/20 border-white/5 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span className="hidden sm:inline">{selectMode ? 'Done' : 'Edit'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 📥 Bulk Action Bar (Animate in when selecting) */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="sticky top-20 z-40 px-4 md:px-12 mb-6"
          >
            <div className="bg-netflix-gray/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="text-sm font-bold text-white hover:text-primary transition-colors"
                >
                  {selectedItems.size === filteredItems.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-gray-300">
                  {selectedItems.size} Selected
                </span>
              </div>
              <button
                onClick={handleBulkDelete}
                disabled={selectedItems.size === 0}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${selectedItems.size > 0
                  ? 'bg-red-600 text-white shadow-lg hover:bg-red-700 hover:scale-105'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🖼️ The Grid */}
      <div className="px-4 md:px-12 max-w-[1800px] mx-auto min-h-[400px]">
        {paginatedItems.length > 0 ? (
          <LayoutGroup>
            <motion.div
              layout
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-y-8 gap-x-4 md:gap-x-6"
            >
              <AnimatePresence mode='popLayout'>
                {paginatedItems.map((item, index) => (
                  <motion.div
                    layout
                    key={`${item.media_type}-${item.tmdb_id}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: selectMode ? (index % 2 === 0 ? 1 : -1) : 0, // Wiggle start position
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3 }}
                    className={selectMode ? 'cursor-pointer' : ''}
                  >
                    <div className={selectMode ? "animate-subtle-float" : ""}>
                      <MovieCard
                        item={item.details}
                        mediaType={item.media_type}
                        enableHover={!selectMode}
                        showCheckbox={selectMode}
                        isSelected={selectedItems.has(`${item.tmdb_id}-${item.media_type}`)}
                        onSelect={handleSelect}
                        className={selectMode ? "pointer-events-none" : ""} // Disable internal link when selecting
                      />
                      {/* Select Overlay Target - Makes clicking anywhere on the card work for selection */}
                      {selectMode && (
                        <div
                          onClick={() => handleSelect(item.tmdb_id, item.media_type)}
                          className="absolute inset-0 z-50 cursor-pointer rounded-xl ring-2 ring-transparent hover:ring-white/30 transition-all"
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        ) : (
          /* Empty State - Fun & Illustrative */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <Film className="relative w-24 h-24 text-gray-700 rotate-12" />
              <Tv className="absolute top-0 -right-4 w-16 h-16 text-gray-600 -rotate-12" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">It's a Ghost Town!</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8 text-lg">
              Your list is waiting for its first blockbuster. Explore the library and find something awesome to watch.
            </p>
            <div className="flex gap-4">
              <Link
                href="/browse"
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all hover:scale-105 shadow-glow"
              >
                Browse Movies
              </Link>
              <Link
                href="/import"
                className="px-8 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all backdrop-blur-md"
              >
                Import List
              </Link>
            </div>
          </motion.div>
        )}

        {/* Improved Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 mt-16 pb-12">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-3 rounded-full transition-all ${currentPage > 1
                ? 'bg-white/10 text-white hover:bg-white/20 hover:scale-110'
                : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <span className="font-display text-xl text-gray-400 tracking-wide">
              PAGE <span className="text-white font-bold">{currentPage}</span> / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-3 rounded-full transition-all ${currentPage < totalPages
                ? 'bg-white/10 text-white hover:bg-white/20 hover:scale-110'
                : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
