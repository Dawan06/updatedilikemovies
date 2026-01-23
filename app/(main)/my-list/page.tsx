'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { 
  Bookmark, Plus, Upload, Film, Tv, Loader2, Search, X, 
  Trash2, CheckSquare, SortAsc, Calendar, Type, ChevronLeft, ChevronRight, LogIn,
  PlayCircle, CheckCircle2, Clock
} from 'lucide-react';
import MovieCard from '@/components/movie-card/MovieCard';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { WatchlistItem } from '@/types';

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
  };
}

type FilterType = 'all' | 'movie' | 'tv';
type StatusFilterType = 'all' | 'watching' | 'completed' | 'plan_to_watch';
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
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('added');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Select mode state (removed editMode)
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Show sign-in prompt for guests
  if (authLoaded && !isSignedIn) {
    return (
      <main className="min-h-screen bg-netflix-black px-4 md:px-12 py-12">
        <h1 className="font-display text-4xl md:text-5xl text-white mb-12 tracking-wide">MY LIST</h1>
        
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative w-24 h-24 bg-netflix-dark rounded-2xl flex items-center justify-center border border-white/10">
              <Bookmark className="w-12 h-12 text-gray-600" />
            </div>
          </div>
          
          <h2 className="text-white text-2xl font-semibold mb-3">Sign in to view your list</h2>
          <p className="text-gray-400 mb-8">
            Create an account or sign in to save movies and TV shows to your personal watchlist
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link 
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </Link>
            <Link 
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 glass hover:bg-white/10 text-white rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Account
            </Link>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-gray-500 text-sm mb-4">Or continue browsing</p>
            <Link 
              href="/"
              className="text-primary hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
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
      console.log(`Loading details for ${watchlistItems.length} watchlist items`);

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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch details:', response.status, errorText);
        throw new Error('Failed to fetch details');
      }

      const data = await response.json();
      console.log(`Loaded ${data.items?.length || 0} items with details`);
      // Ensure all items have status with default value
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
    if (!watchlistLoading) {
      loadWatchlistDetails();
    }
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
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
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
  }, [items, filter, statusFilter, searchQuery, sortBy]);

  // Paginate filtered items
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, statusFilter, searchQuery, sortBy]);

  const handleDelete = async (id: number, type: 'movie' | 'tv') => {
    await removeItem(id, type);
    // Items will be refreshed via useWatchlist hook
    await loadWatchlistDetails();
  };

  const handleSelect = (id: number, type: 'movie' | 'tv') => {
    const key = `${id}-${type}`;
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
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

      console.log(`[MyList] Deleting ${items.length} items via bulk delete API`, { sample: items.slice(0, 3) });

      const response = await fetch('/api/watchlist/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Delete failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log(`[MyList] Successfully deleted ${result.deleted} items`);

      setSelectedItems(new Set());
      setSelectMode(false);
      
      // Refresh watchlist
      await refresh();
      await loadWatchlistDetails();
    } catch (err) {
      console.error('[MyList] Error in bulk delete:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete selected items');
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => `${item.tmdb_id}-${item.media_type}`)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedItems(new Set());
  };

  if (loading || watchlistLoading) {
    return (
      <main className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-gray-400">Loading your watchlist...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-netflix-black flex items-center justify-center px-4">
        <div className="text-center">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">{error}</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-netflix-black px-4 md:px-12 py-12">
        <h1 className="font-display text-4xl md:text-5xl text-white mb-12 tracking-wide">MY LIST</h1>
        
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative w-24 h-24 bg-netflix-dark rounded-2xl flex items-center justify-center border border-white/10">
              <Bookmark className="w-12 h-12 text-gray-600" />
            </div>
          </div>
          
          <h2 className="text-white text-2xl font-semibold mb-3">Your list is empty</h2>
          <p className="text-gray-400 mb-8">
            Start adding movies and TV shows to build your personal watchlist
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link 
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Browse Content
            </Link>
            <Link 
              href="/import"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 glass hover:bg-white/10 text-white rounded-lg font-semibold transition-colors"
            >
              <Upload className="w-5 h-5" />
              Import List
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const movieCount = items.filter(i => i.media_type === 'movie').length;
  const tvCount = items.filter(i => i.media_type === 'tv').length;
  const watchingCount = items.filter(i => i.status === 'watching').length;
  const completedCount = items.filter(i => i.status === 'completed').length;
  const planToWatchCount = items.filter(i => i.status === 'plan_to_watch').length;

  return (
    <main className="min-h-screen bg-netflix-black px-4 md:px-12 py-12">
      {/* Header Section - Clean and Minimal */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-4xl md:text-5xl text-white tracking-wide">MY LIST</h1>
          
          {/* Action Buttons - Minimal */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectMode(!selectMode); setSelectedItems(new Set()); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectMode 
                  ? 'bg-primary text-white' 
                  : 'glass text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Select</span>
            </button>
            <Link 
              href="/import"
              className="inline-flex items-center gap-2 px-4 py-2 glass text-gray-300 hover:text-white hover:bg-white/10 rounded-lg text-sm font-medium transition-all"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </Link>
          </div>
        </div>

        {/* Search and Filters - Organized Row */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-netflix-dark border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filters and Sort - Compact Layout */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Media Type Filter */}
            <div className="flex items-center gap-1 bg-netflix-dark/50 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === 'all' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('movie')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  filter === 'movie' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                Movies
              </button>
              <button
                onClick={() => setFilter('tv')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  filter === 'tv' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                TV
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-netflix-dark/50 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  statusFilter === 'all' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('watching')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  statusFilter === 'watching' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Watching
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  statusFilter === 'completed' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </button>
              <button
                onClick={() => setStatusFilter('plan_to_watch')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  statusFilter === 'plan_to_watch' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Plan
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="px-3 py-1.5 bg-netflix-dark border border-white/10 rounded-lg text-white text-xs font-medium focus:outline-none focus:border-primary cursor-pointer hover:border-white/20 transition-colors"
            >
              <option value="added">Date Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="year">Year (Newest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Select Mode Actions Bar */}
      {selectMode && (
        <div className="flex items-center justify-between gap-4 mb-6 p-4 glass rounded-lg border border-white/10 animate-fade-in">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary hover:underline font-medium"
            >
              {selectedItems.size === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-gray-400 text-sm">
              {selectedItems.size} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exitSelectMode}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selectedItems.size === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedItems.size > 0
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedItems.size})
            </button>
          </div>
        </div>
      )}

      {/* Results info */}
      {(searchQuery || filter !== 'all' || statusFilter !== 'all') && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <p className="text-gray-300 text-sm font-medium">
            Showing <span className="text-white">{filteredItems.length}</span> of <span className="text-white">{items.length}</span> items
          </p>
        </div>
      )}
      
      {/* Grid */}
      {paginatedItems.length > 0 ? (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
            {paginatedItems.map((item) => (
              <MovieCard
                key={`${item.media_type}-${item.tmdb_id}`}
                item={item.details}
                mediaType={item.media_type}
                enableHover={!selectMode}
                showCheckbox={selectMode}
                isSelected={selectedItems.has(`${item.tmdb_id}-${item.media_type}`)}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  currentPage > 1
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-md font-medium transition-colors ${
                        pageNum === currentPage
                          ? 'bg-primary text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  currentPage < totalPages
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No results found for &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </main>
  );
}
