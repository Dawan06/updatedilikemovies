const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 10;

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  if (typeof window === 'undefined') return;
  if (!query.trim()) return;

  try {
    const recent = getRecentSearches();
    // Remove if already exists
    const filtered = recent.filter(q => q.toLowerCase() !== query.toLowerCase());
    // Add to beginning
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent search:', error);
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error('Failed to clear recent searches:', error);
  }
}
