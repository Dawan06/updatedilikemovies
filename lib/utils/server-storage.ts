/**
 * Server preferences storage utilities
 */

const FAVORITE_SERVERS_KEY = 'favoriteServers';
const BLACKLISTED_SERVERS_KEY = 'blacklistedServers';
const SERVER_PERFORMANCE_KEY = 'serverPerformance';

export interface ServerPerformance {
  serverUrl: string;
  successCount: number;
  failureCount: number;
  avgResponseTime: number;
  lastUsed: number;
}

export function getFavoriteServers(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITE_SERVERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addFavoriteServer(serverUrl: string) {
  if (typeof window === 'undefined') return;
  try {
    const favorites = getFavoriteServers();
    if (!favorites.includes(serverUrl)) {
      favorites.push(serverUrl);
      localStorage.setItem(FAVORITE_SERVERS_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Failed to save favorite server:', error);
  }
}

export function removeFavoriteServer(serverUrl: string) {
  if (typeof window === 'undefined') return;
  try {
    const favorites = getFavoriteServers();
    const filtered = favorites.filter(url => url !== serverUrl);
    localStorage.setItem(FAVORITE_SERVERS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove favorite server:', error);
  }
}

export function getBlacklistedServers(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(BLACKLISTED_SERVERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addBlacklistedServer(serverUrl: string) {
  if (typeof window === 'undefined') return;
  try {
    const blacklist = getBlacklistedServers();
    if (!blacklist.includes(serverUrl)) {
      blacklist.push(serverUrl);
      localStorage.setItem(BLACKLISTED_SERVERS_KEY, JSON.stringify(blacklist));
    }
  } catch (error) {
    console.error('Failed to blacklist server:', error);
  }
}

export function removeBlacklistedServer(serverUrl: string) {
  if (typeof window === 'undefined') return;
  try {
    const blacklist = getBlacklistedServers();
    const filtered = blacklist.filter(url => url !== serverUrl);
    localStorage.setItem(BLACKLISTED_SERVERS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove blacklisted server:', error);
  }
}

export function getServerPerformance(): ServerPerformance[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(SERVER_PERFORMANCE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function updateServerPerformance(
  serverUrl: string,
  success: boolean,
  responseTime: number
) {
  if (typeof window === 'undefined') return;
  try {
    const performance = getServerPerformance();
    const existing = performance.find(p => p.serverUrl === serverUrl);
    
    if (existing) {
      if (success) {
        existing.successCount++;
        existing.avgResponseTime = (existing.avgResponseTime * (existing.successCount - 1) + responseTime) / existing.successCount;
      } else {
        existing.failureCount++;
      }
      existing.lastUsed = Date.now();
    } else {
      performance.push({
        serverUrl,
        successCount: success ? 1 : 0,
        failureCount: success ? 0 : 1,
        avgResponseTime: success ? responseTime : 0,
        lastUsed: Date.now(),
      });
    }
    
    localStorage.setItem(SERVER_PERFORMANCE_KEY, JSON.stringify(performance));
  } catch (error) {
    console.error('Failed to update server performance:', error);
  }
}
