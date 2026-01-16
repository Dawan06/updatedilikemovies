'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Bookmark, Plus, Upload, Film, Tv, Loader2, Search, X, 
  Pencil, Trash2, CheckSquare, SortAsc, Calendar, Type
} from 'lucide-react';
import MovieCard from '@/components/movie-card/MovieCard';
import { getWatchlist, removeFromWatchlist, removeManyFromWatchlist, WatchlistItem } from '@/lib/watchlist-storage';

interface WatchlistItemWithDetails extends WatchlistItem {
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
type SortType = 'added' | 'title' | 'year';

export default function MyListPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<WatchlistItemWithDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('added');
  
  // Edit and select mode state
  const [editMode, setEditMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const loadWatchlist = async () => {
    try {
      const watchlist = getWatchlist();
      
      if (watchlist.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/watchlist/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: watchlist }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch details');
      }

      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Error loading watchlist:', err);
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

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

  const handleDelete = (id: number, type: 'movie' | 'tv') => {
    removeFromWatchlist(id, type);
    setItems(prev => prev.filter(item => !(item.tmdb_id === id && item.media_type === type)));
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

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    
    const itemsToDelete = Array.from(selectedItems).map(key => {
      const [id, type] = key.split('-');
      return { tmdb_id: parseInt(id), media_type: type as 'movie' | 'tv' };
    });
    
    removeManyFromWatchlist(itemsToDelete);
    setItems(prev => prev.filter(item => !selectedItems.has(`${item.tmdb_id}-${item.media_type}`)));
    setSelectedItems(new Set());
    setSelectMode(false);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => `${item.tmdb_id}-${item.media_type}`)));
    }
  };

  const exitModes = () => {
    setEditMode(false);
    setSelectMode(false);
    setSelectedItems(new Set());
  };

  if (loading) {
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

  return (
    <main className="min-h-screen bg-netflix-black px-4 md:px-12 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-4xl md:text-5xl text-white tracking-wide">MY LIST</h1>
        <div className="flex items-center gap-2">
          {/* Edit Mode Toggle */}
          <button
            onClick={() => { setEditMode(!editMode); setSelectMode(false); setSelectedItems(new Set()); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              editMode 
                ? 'bg-primary text-white' 
                : 'glass hover:bg-white/10 text-white'
            }`}
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          
          {/* Select Mode Toggle */}
          <button
            onClick={() => { setSelectMode(!selectMode); setEditMode(false); setSelectedItems(new Set()); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectMode 
                ? 'bg-primary text-white' 
                : 'glass hover:bg-white/10 text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Select</span>
          </button>
          
          <Link 
            href="/import"
            className="inline-flex items-center gap-2 px-4 py-2 glass hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </Link>
        </div>
      </div>

      {/* Search, Filter, Sort Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-netflix-dark text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter('movie')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              filter === 'movie' 
                ? 'bg-primary text-white' 
                : 'bg-netflix-dark text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            <Film className="w-4 h-4" />
            Movies ({movieCount})
          </button>
          <button
            onClick={() => setFilter('tv')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              filter === 'tv' 
                ? 'bg-primary text-white' 
                : 'bg-netflix-dark text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            <Tv className="w-4 h-4" />
            TV ({tvCount})
          </button>
        </div>
        
        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
          className="px-4 py-2 bg-netflix-dark border border-white/10 rounded-lg text-white text-sm font-medium focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="added">Sort: Date Added</option>
          <option value="title">Sort: Title (A-Z)</option>
          <option value="year">Sort: Year (Newest)</option>
        </select>
      </div>

      {/* Select Mode Actions Bar */}
      {selectMode && (
        <div className="flex items-center justify-between gap-4 mb-6 p-4 glass rounded-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary hover:underline"
            >
              {selectedItems.size === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-gray-400 text-sm">
              {selectedItems.size} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exitModes}
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

      {/* Edit Mode Info Bar */}
      {editMode && (
        <div className="flex items-center justify-between gap-4 mb-6 p-4 glass rounded-lg">
          <span className="text-gray-300 text-sm">
            Click the X on any card to remove it from your list
          </span>
          <button
            onClick={exitModes}
            className="px-4 py-2 text-sm text-primary hover:underline"
          >
            Done
          </button>
        </div>
      )}

      {/* Results info */}
      {(searchQuery || filter !== 'all') && (
        <p className="text-gray-400 text-sm mb-4">
          Showing {filteredItems.length} of {items.length} items
        </p>
      )}
      
      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {filteredItems.map((item) => (
            <MovieCard
              key={`${item.media_type}-${item.tmdb_id}`}
              item={item.details}
              mediaType={item.media_type}
              enableHover={!editMode && !selectMode}
              showCheckbox={selectMode}
              isSelected={selectedItems.has(`${item.tmdb_id}-${item.media_type}`)}
              onSelect={handleSelect}
              showDeleteButton={editMode}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No results found for &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </main>
  );
}
