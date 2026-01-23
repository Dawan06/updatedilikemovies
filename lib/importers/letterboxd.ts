import { tmdbClient } from '@/lib/tmdb/client';
import { batchLookupLetterboxdMappings, batchInsertLetterboxdMappings } from '@/lib/supabase/tmdb-mappings';

export interface LetterboxdItem {
  Title: string;
  Year: string;
  'Letterboxd URI': string;
  'Rating': string;
  'Watched Date': string;
  'Review': string;
  Name?: string; // Some exports use 'Name' instead of 'Title'
}

export async function parseLetterboxdCSV(csvContent: string): Promise<LetterboxdItem[]> {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.trim());

  const items: LetterboxdItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const fields = parseCSVLine(line);

    if (fields.length >= 1) {
      const item: Record<string, string> = {};
      headers.forEach((header, index) => {
        item[header] = fields[index] || '';
      });
      
      // Handle both 'Title' and 'Name' columns
      if (!item.Title && item.Name) {
        item.Title = item.Name;
      }
      
      // Only add if we have a title
      if (item.Title) {
        items.push(item as unknown as LetterboxdItem);
      }
    }
  }

  return items;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const nextChar = line[j + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        j++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField.trim());

  return fields;
}

export async function matchLetterboxdToTMDB(
  items: LetterboxdItem[],
  onProgress?: (current: number, total: number, cached: number) => void
): Promise<Array<{
  letterboxdItem: LetterboxdItem;
  tmdbId: number | null;
  mediaType: 'movie' | 'tv';
}>> {
  if (items.length === 0) return [];

  // Phase 1: Batch cache lookup
  const cacheLookupItems = items.map(item => ({
    title: item.Title,
    year: item.Year ? parseInt(item.Year, 10) : null,
    media_type: undefined as 'movie' | 'tv' | undefined,
  }));

  const cacheMap = await batchLookupLetterboxdMappings(cacheLookupItems);
  let cacheHits = 0;

  // Phase 2: Process items - use cache when available, otherwise match via API
  const results: Array<{ letterboxdItem: LetterboxdItem; tmdbId: number | null; mediaType: 'movie' | 'tv' }> = [];
  const itemsToMatch: LetterboxdItem[] = [];
  const cacheResults: Array<{ letterboxdItem: LetterboxdItem; tmdbId: number | null; mediaType: 'movie' | 'tv' }> = [];

  // Separate cached items from items needing API calls
  for (const item of items) {
    const year = item.Year ? parseInt(item.Year, 10) : null;
    // Try both movie and tv in cache
    const movieKey = `${item.Title.toLowerCase().trim()}:${year || 'null'}:movie`;
    const tvKey = `${item.Title.toLowerCase().trim()}:${year || 'null'}:tv`;
    
    const cachedMovie = cacheMap.get(movieKey);
    const cachedTV = cacheMap.get(tvKey);
    
    if (cachedMovie) {
      cacheHits++;
      cacheResults.push({
        letterboxdItem: item,
        tmdbId: cachedMovie.tmdb_id,
        mediaType: 'movie',
      });
      if (onProgress) {
        onProgress(cacheResults.length, items.length, cacheHits);
      }
      continue;
    }
    
    if (cachedTV) {
      cacheHits++;
      cacheResults.push({
        letterboxdItem: item,
        tmdbId: cachedTV.tmdb_id,
        mediaType: 'tv',
      });
      if (onProgress) {
        onProgress(cacheResults.length, items.length, cacheHits);
      }
      continue;
    }
    
    itemsToMatch.push(item);
  }

  results.push(...cacheResults);

  // Phase 3: Match remaining items via API in large parallel batches
  const batchSize = 100; // Increased from 25
  const newMappings: Array<{ title: string; year: number | null; tmdb_id: number; media_type: 'movie' | 'tv' }> = [];

  for (let i = 0; i < itemsToMatch.length; i += batchSize) {
    const batch = itemsToMatch.slice(i, i + batchSize);
    
    // Process batch in parallel - no delays
    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
        try {
          return await matchSingleItem(item);
        } catch (error) {
          console.error(`Error matching Letterboxd item ${item.Title}:`, error);
          return { letterboxdItem: item, tmdbId: null, mediaType: 'movie' as const };
        }
      })
    );

    // Process results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        const match = result.value;
        results.push(match);
        
        // Collect new mappings for cache
        if (match.tmdbId) {
          const year = match.letterboxdItem.Year ? parseInt(match.letterboxdItem.Year, 10) : null;
          newMappings.push({
            title: match.letterboxdItem.Title,
            year: year,
            tmdb_id: match.tmdbId,
            media_type: match.mediaType,
          });
        }
      }
    }

    // Update progress
    if (onProgress) {
      onProgress(results.length, items.length, cacheHits);
    }
  }

  // Phase 4: Bulk insert new mappings (async, don't block)
  if (newMappings.length > 0) {
    batchInsertLetterboxdMappings(newMappings).catch(error => {
      console.error('Failed to cache new mappings:', error);
      // Non-blocking - continue even if cache write fails
    });
  }

  return results;
}

async function matchSingleItem(item: LetterboxdItem): Promise<{
  letterboxdItem: LetterboxdItem;
  tmdbId: number | null;
  mediaType: 'movie' | 'tv';
}> {
  const title = item.Title;
  const year = item.Year ? parseInt(item.Year, 10) : undefined;

  if (!title) {
    return { letterboxdItem: item, tmdbId: null, mediaType: 'movie' };
  }

  // Search both movies and TV shows, find best match by year
  const [movieMatch, tvMatch] = await Promise.all([
    searchMovieStrict(title, year),
    searchTVStrict(title, year),
  ]);

  // If we have both, prefer the one with closer year match
  if (movieMatch && tvMatch && year) {
    const movieYearDiff = Math.abs(movieMatch.year - year);
    const tvYearDiff = Math.abs(tvMatch.year - year);
    
    if (tvYearDiff < movieYearDiff) {
      return { letterboxdItem: item, tmdbId: tvMatch.id, mediaType: 'tv' };
    }
    return { letterboxdItem: item, tmdbId: movieMatch.id, mediaType: 'movie' };
  }

  // Return whichever we found
  if (movieMatch) {
    return { letterboxdItem: item, tmdbId: movieMatch.id, mediaType: 'movie' };
  }
  
  if (tvMatch) {
    return { letterboxdItem: item, tmdbId: tvMatch.id, mediaType: 'tv' };
  }

  // Fallback: search without strict year matching but verify result
  if (year) {
    const movieResults = await tmdbClient.searchMovies(title, 1);
    const movieBest = findBestYearMatch(movieResults.results, year, 'release_date');
    
    const tvResults = await tmdbClient.searchTV(title, 1);
    const tvBest = findBestYearMatch(tvResults.results, year, 'first_air_date');

    if (movieBest && tvBest) {
      const movieYear = new Date(movieBest.release_date || '').getFullYear();
      const tvYear = new Date(tvBest.first_air_date || '').getFullYear();
      
      if (Math.abs(tvYear - year) < Math.abs(movieYear - year)) {
        return { letterboxdItem: item, tmdbId: tvBest.id, mediaType: 'tv' };
      }
      return { letterboxdItem: item, tmdbId: movieBest.id, mediaType: 'movie' };
    }

    if (movieBest) {
      return { letterboxdItem: item, tmdbId: movieBest.id, mediaType: 'movie' };
    }
    
    if (tvBest) {
      return { letterboxdItem: item, tmdbId: tvBest.id, mediaType: 'tv' };
    }
  }

  return { letterboxdItem: item, tmdbId: null, mediaType: 'movie' };
}

async function searchMovieStrict(query: string, year?: number): Promise<{ id: number; year: number } | null> {
  if (!year) {
    const results = await tmdbClient.searchMovies(query, 1);
    if (results.results.length > 0 && results.results[0].release_date) {
      return {
        id: results.results[0].id,
        year: new Date(results.results[0].release_date).getFullYear(),
      };
    }
    return null;
  }

  // Try exact year first
  const exactResults = await tmdbClient.searchMoviesWithYear(query, year);
  if (exactResults.results.length > 0) {
    return {
      id: exactResults.results[0].id,
      year: year,
    };
  }
  
  // Try year ±1
  const prevYear = await tmdbClient.searchMoviesWithYear(query, year - 1);
  if (prevYear.results.length > 0) {
    return {
      id: prevYear.results[0].id,
      year: year - 1,
    };
  }
  
  const nextYear = await tmdbClient.searchMoviesWithYear(query, year + 1);
  if (nextYear.results.length > 0) {
    return {
      id: nextYear.results[0].id,
      year: year + 1,
    };
  }
  
  return null;
}

async function searchTVStrict(query: string, year?: number): Promise<{ id: number; year: number } | null> {
  if (!year) {
    const results = await tmdbClient.searchTV(query, 1);
    if (results.results.length > 0 && results.results[0].first_air_date) {
      return {
        id: results.results[0].id,
        year: new Date(results.results[0].first_air_date).getFullYear(),
      };
    }
    return null;
  }

  // Try exact year first
  const exactResults = await tmdbClient.searchTVWithYear(query, year);
  if (exactResults.results.length > 0) {
    return {
      id: exactResults.results[0].id,
      year: year,
    };
  }
  
  // Try year ±1
  const prevYear = await tmdbClient.searchTVWithYear(query, year - 1);
  if (prevYear.results.length > 0) {
    return {
      id: prevYear.results[0].id,
      year: year - 1,
    };
  }
  
  const nextYear = await tmdbClient.searchTVWithYear(query, year + 1);
  if (nextYear.results.length > 0) {
    return {
      id: nextYear.results[0].id,
      year: year + 1,
    };
  }
  
  return null;
}

function findBestYearMatch<T extends { id: number }>(
  results: T[],
  targetYear: number,
  dateField: 'release_date' | 'first_air_date'
): T | null {
  if (results.length === 0) return null;

  // Find results within 2 years of target
  const validResults = results.filter(r => {
    const dateStr = (r as any)[dateField];
    if (!dateStr) return false;
    const resultYear = new Date(dateStr).getFullYear();
    return Math.abs(resultYear - targetYear) <= 2;
  });

  if (validResults.length > 0) {
    // Sort by closest year match
    validResults.sort((a, b) => {
      const yearA = new Date((a as any)[dateField]).getFullYear();
      const yearB = new Date((b as any)[dateField]).getFullYear();
      return Math.abs(yearA - targetYear) - Math.abs(yearB - targetYear);
    });
    return validResults[0];
  }

  return null;
}
