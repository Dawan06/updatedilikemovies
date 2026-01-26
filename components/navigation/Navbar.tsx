'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser, SignOutButton } from '@clerk/nextjs';
import {
  Search, Home, Bookmark, Film, LogOut,
  Upload, Menu, X, ChevronDown, LogIn, Grid3x3, Sparkles
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import MovieWizard from '@/components/wizard/MovieWizard';
import { useSearchSuggestions } from '@/lib/hooks/useSearchSuggestions';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '@/lib/utils/search-storage';

export default function Navbar() {
  const { user, isSignedIn, isLoaded } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const recentSearches = getRecentSearches();
  const { suggestions, loading: suggestionsLoading } = useSearchSuggestions(searchQuery, isSearchOpen && searchQuery.length >= 2);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(globalThis.scrollY > 20);
    };
    globalThis.addEventListener('scroll', handleScroll, { passive: true });
    return () => globalThis.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node) && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery('');
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    addRecentSearch(query);
    const params = new URLSearchParams();
    params.set('search', query);

    if (pathname === '/browse') {
      const mediaType = searchParams.get('media_type');
      const genres = searchParams.get('genres');
      const yearFrom = searchParams.get('year_from');
      const yearTo = searchParams.get('year_to');
      const ratingMin = searchParams.get('rating_min');
      const language = searchParams.get('language');
      const sortBy = searchParams.get('sort_by');

      if (mediaType && mediaType !== 'all') params.set('media_type', mediaType);
      if (genres) params.set('genres', genres);
      if (yearFrom) params.set('year_from', yearFrom);
      if (yearTo) params.set('year_to', yearTo);
      if (ratingMin) params.set('rating_min', ratingMin);
      if (language) params.set('language', language);
      if (sortBy && sortBy !== 'popularity.desc') params.set('sort_by', sortBy);
    }

    router.push(`/browse?${params.toString()}`);
    setIsSearchOpen(false);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const allNavLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/browse', label: 'Browse', icon: Grid3x3 },
    { href: '/my-list', label: 'My List', icon: Bookmark, requiresAuth: true },
    { href: '/franchise', label: 'Franchise', icon: Film },
  ];

  // Filter nav links based on auth status - hide My List when not signed in
  const navLinks = isLoaded
    ? allNavLinks.filter(link => !link.requiresAuth || isSignedIn)
    : allNavLinks.filter(link => !link.requiresAuth);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-netflix-black/95 backdrop-blur-md shadow-lg'
          : 'bg-gradient-to-b from-black/80 to-transparent'
          }`}
      >
        <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-[68px]">
            {/* Left Section: Logo + Nav Links */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              {/* Logo - Hide on mobile when search is open */}
              <Link
                href="/"
                className={`flex items-center gap-2 flex-shrink-0 transition-transform duration-300 hover:scale-105 ${isSearchOpen ? 'hidden md:flex' : 'flex'}`}
              >
                <Image
                  src="/logo.png"
                  alt="ILikeMovies"
                  width={36}
                  height={36}
                  className="w-8 h-8 md:w-9 md:h-9"
                  unoptimized
                />
                <span className="font-display text-xl md:text-2xl tracking-wide text-white">
                  <span className="text-primary">I</span>LIKE<span className="text-primary">MOVIES</span>
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
                        ? 'text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                      {/* Active indicator */}
                      {active && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Section: Search + Profile */}
            <div className="flex items-center gap-3">
              {/* AI Wizard Button */}
              <button
                onClick={() => setIsWizardOpen(true)}
                className={`p-2.5 rounded-lg transition-all duration-300 group ${isWizardOpen ? 'bg-primary text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                aria-label="AI Wizard"
              >
                <Sparkles className={`w-5 h-5 ${isWizardOpen ? 'animate-pulse' : 'group-hover:text-primary transition-colors'}`} />
              </button>

              {/* Search - Improved UI */}
              <div className="relative" ref={searchContainerRef}>
                {!isSearchOpen ? (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2.5 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                ) : (
                  <div className={`${isSearchOpen ? 'fixed inset-x-4 top-[14px] z-50 w-[calc(100%-2rem)] md:w-auto md:static md:inset-auto' : ''} flex items-center gap-2.5 bg-netflix-dark/95 md:bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2.5 shadow-lg animate-fade-in transition-all duration-200 hover:border-white/30 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20`}>
                    <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Search titles, people, genres..."
                      value={searchQuery}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          handleSearch(searchQuery);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const maxIndex = suggestions.length + recentSearches.length - 1;
                          setSelectedSuggestionIndex(prev => 
                            prev < maxIndex ? prev + 1 : prev
                          );
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                        } else if (e.key === 'Escape') {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          setShowSuggestions(false);
                        } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
                          e.preventDefault();
                          if (selectedSuggestionIndex < suggestions.length) {
                            const suggestion = suggestions[selectedSuggestionIndex];
                            handleSearch(suggestion.title);
                          } else {
                            const recentIndex = selectedSuggestionIndex - suggestions.length;
                            handleSearch(recentSearches[recentIndex]);
                          }
                        }
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                        setSelectedSuggestionIndex(-1);
                      }}
                      className="flex-1 bg-transparent text-white text-sm placeholder-gray-400 outline-none w-full md:min-w-[300px] focus:placeholder-gray-500"
                    />
                    {searchQuery ? (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95"
                        aria-label="Close search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                
                {/* Search Suggestions Dropdown */}
                {isSearchOpen && showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
                  <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto scrollbar-hide"
                  >
                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Suggestions
                        </div>
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.media_type}-${suggestion.id}`}
                            onClick={() => handleSearch(suggestion.title)}
                            onMouseEnter={() => setSelectedSuggestionIndex(index)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                              selectedSuggestionIndex === index
                                ? 'bg-white/10 text-white'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {suggestion.poster_path ? (
                              <Image
                                src={`https://image.tmdb.org/t/p/w92${suggestion.poster_path}`}
                                alt={suggestion.title}
                                width={40}
                                height={60}
                                className="w-10 h-[60px] object-cover rounded flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-[60px] bg-netflix-gray rounded flex-shrink-0 flex items-center justify-center">
                                <Film className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">
                                {suggestion.title}
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                <span className="capitalize">{suggestion.media_type}</span>
                                {(suggestion.release_date || suggestion.first_air_date) && (
                                  <>
                                    <span>•</span>
                                    <span>{(suggestion.release_date || suggestion.first_air_date)?.slice(0, 4)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="p-2 border-t border-white/10">
                        <div className="flex items-center justify-between px-3 py-2">
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Recent Searches
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearRecentSearches();
                            }}
                            className="text-xs text-gray-500 hover:text-white transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                        {recentSearches.map((recent, index) => {
                          const suggestionIndex = suggestions.length + index;
                          return (
                            <button
                              key={recent}
                              onClick={() => handleSearch(recent)}
                              onMouseEnter={() => setSelectedSuggestionIndex(suggestionIndex)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                                selectedSuggestionIndex === suggestionIndex
                                  ? 'bg-white/10 text-white'
                                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="text-sm truncate">{recent}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Dropdown or Sign In Button */}
              {isLoaded && (
                <>
                  {isSignedIn ? (
                    <div ref={profileRef} className="relative">
                      <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 p-1 rounded-lg transition-colors hover:bg-white/10"
                      >
                        {user?.imageUrl ? (
                          <Image
                            src={user.imageUrl}
                            alt={user.firstName || 'User'}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-gradient-red flex items-center justify-center text-white font-semibold text-sm">
                            {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0].toUpperCase() || 'U'}
                          </div>
                        )}
                        <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform duration-200 hidden md:block ${isProfileOpen ? 'rotate-180' : ''
                          }`} />
                      </button>

                      {/* Dropdown Menu */}
                      {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 glass rounded-lg shadow-xl overflow-hidden animate-fade-in-down">
                          {/* User Info */}
                          <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-white font-medium truncate">
                              {user?.firstName || 'User'}
                            </p>
                            <p className="text-gray-400 text-sm truncate">
                              {user?.emailAddresses[0]?.emailAddress}
                            </p>
                          </div>

                          {/* Menu Items */}
                          <div className="py-2">
                            <Link
                              href="/import"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              <span className="text-sm">Import Watchlist</span>
                            </Link>
                          </div>

                          {/* Sign Out */}
                          <div className="py-2 border-t border-white/10">
                            <SignOutButton>
                              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm">Sign Out</span>
                              </button>
                            </SignOutButton>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href="/sign-in"
                      className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md font-medium text-sm transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="hidden sm:inline">Sign In</span>
                    </Link>
                  )}
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="absolute right-0 top-0 h-full w-64 bg-netflix-dark border-l border-white/10 animate-slide-in-right">
            <div className="pt-20 px-4">
              {navLinks.map((link, index) => {
                const Icon = link.icon;
                const active = isActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${active
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}

              {/* Wizard Button Mobile */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsWizardOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-medium">AI Wizard</span>
              </button>

              {!isSignedIn && (
                <Link
                  href="/sign-in"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg mb-1 bg-primary text-white hover:bg-primary-dark transition-colors mt-4"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="font-medium">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed navbar */}
      <div className="h-[68px]" />

      {/* AI Movie Wizard Modal */}
      <MovieWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </>
  );
}
