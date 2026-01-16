import { tmdbClient } from '@/lib/tmdb/client';

export interface IMDbItem {
  position: string;
  const: string; // IMDb ID (tt...)
  created: string;
  modified: string;
  description: string;
  title: string;
  url: string;
  title_type: string; // movie, tvSeries, tvMiniSeries, etc.
  imdb_rating: string;
  runtime_mins: string;
  year: string;
  genres: string;
  num_votes: string;
  release_date: string;
  directors: string;
}

export async function parseIMDbCSV(csvContent: string): Promise<IMDbItem[]> {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  // Parse header to find column indices (IMDb CSV column order can vary)
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  const getIndex = (names: string[]) => {
    for (const name of names) {
      const idx = headers.indexOf(name.toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Map column names to indices
  const colMap = {
    position: getIndex(['position', 'pos']),
    const: getIndex(['const', 'imdb id', 'imdbid', 'tconst']),
    created: getIndex(['created', 'date added']),
    modified: getIndex(['modified', 'date modified']),
    description: getIndex(['description']),
    title: getIndex(['title', 'name']),
    url: getIndex(['url']),
    title_type: getIndex(['title type', 'titletype', 'type']),
    imdb_rating: getIndex(['imdb rating', 'your rating', 'rating']),
    runtime_mins: getIndex(['runtime (mins)', 'runtime', 'runtimemins']),
    year: getIndex(['year', 'release year']),
    genres: getIndex(['genres', 'genre']),
    num_votes: getIndex(['num votes', 'numvotes', 'votes']),
    release_date: getIndex(['release date', 'releasedate']),
    directors: getIndex(['directors', 'director']),
  };

  const items: IMDbItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const fields = parseCSVLine(line);
    
    // Need at least title and some identifier
    const title = colMap.title >= 0 ? fields[colMap.title] : '';
    const constId = colMap.const >= 0 ? fields[colMap.const] : '';
    
    if (!title && !constId) continue;

    items.push({
      position: colMap.position >= 0 ? fields[colMap.position] || '' : '',
      const: constId,
      created: colMap.created >= 0 ? fields[colMap.created] || '' : '',
      modified: colMap.modified >= 0 ? fields[colMap.modified] || '' : '',
      description: colMap.description >= 0 ? fields[colMap.description] || '' : '',
      title: title,
      url: colMap.url >= 0 ? fields[colMap.url] || '' : '',
      title_type: colMap.title_type >= 0 ? fields[colMap.title_type] || '' : '',
      imdb_rating: colMap.imdb_rating >= 0 ? fields[colMap.imdb_rating] || '' : '',
      runtime_mins: colMap.runtime_mins >= 0 ? fields[colMap.runtime_mins] || '' : '',
      year: colMap.year >= 0 ? fields[colMap.year] || '' : '',
      genres: colMap.genres >= 0 ? fields[colMap.genres] || '' : '',
      num_votes: colMap.num_votes >= 0 ? fields[colMap.num_votes] || '' : '',
      release_date: colMap.release_date >= 0 ? fields[colMap.release_date] || '' : '',
      directors: colMap.directors >= 0 ? fields[colMap.directors] || '' : '',
    });
  }

  return items;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Skip next quote
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

export async function matchIMDbToTMDB(items: IMDbItem[]): Promise<Array<{
  imdbItem: IMDbItem;
  tmdbId: number | null;
  mediaType: 'movie' | 'tv';
}>> {
  // Process in batches to avoid rate limiting
  const batchSize = 5;
  const results: Array<{ imdbItem: IMDbItem; tmdbId: number | null; mediaType: 'movie' | 'tv' }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        try {
          return await matchSingleItem(item);
        } catch (error) {
          console.error(`Error matching IMDb item ${item.title}:`, error);
          return { imdbItem: item, tmdbId: null, mediaType: 'movie' as const };
        }
      })
    );
    results.push(...batchResults);
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

async function matchSingleItem(item: IMDbItem): Promise<{
  imdbItem: IMDbItem;
  tmdbId: number | null;
  mediaType: 'movie' | 'tv';
}> {
  // Determine media type from IMDb title_type
  const titleType = item.title_type?.toLowerCase() || '';
  const isTV = titleType.includes('series') || 
               titleType.includes('tv') || 
               titleType.includes('mini');

  const year = item.year ? parseInt(item.year, 10) : undefined;
  const imdbId = item.const || '';

  // Method 1: Try to find by IMDb ID (most accurate)
  if (imdbId && imdbId.startsWith('tt')) {
    try {
      const findResult = await tmdbClient.findByIMDbId(imdbId);
      
      if (findResult.tv_results.length > 0) {
        return {
          imdbItem: item,
          tmdbId: findResult.tv_results[0].id,
          mediaType: 'tv',
        };
      }
      
      if (findResult.movie_results.length > 0) {
        return {
          imdbItem: item,
          tmdbId: findResult.movie_results[0].id,
          mediaType: 'movie',
        };
      }
    } catch (error) {
      console.log(`IMDb ID lookup failed for ${imdbId}, falling back to search`);
    }
  }

  // Method 2: Search by title with year filter (strict matching)
  const searchQuery = item.title;
  if (!searchQuery) {
    return { imdbItem: item, tmdbId: null, mediaType: isTV ? 'tv' : 'movie' };
  }

  if (isTV) {
    // Search TV shows
    const match = await searchTVStrict(searchQuery, year);
    if (match) {
      return { imdbItem: item, tmdbId: match.id, mediaType: 'tv' };
    }
  } else {
    // Search movies
    const match = await searchMovieStrict(searchQuery, year);
    if (match) {
      return { imdbItem: item, tmdbId: match.id, mediaType: 'movie' };
    }
  }

  // Method 3: If no match with strict year, try without year but verify result
  if (year) {
    if (isTV) {
      const results = await tmdbClient.searchTV(searchQuery, 1);
      const match = findBestYearMatch(results.results, year, 'first_air_date');
      if (match) {
        return { imdbItem: item, tmdbId: match.id, mediaType: 'tv' };
      }
    } else {
      const results = await tmdbClient.searchMovies(searchQuery, 1);
      const match = findBestYearMatch(results.results, year, 'release_date');
      if (match) {
        return { imdbItem: item, tmdbId: match.id, mediaType: 'movie' };
      }
    }
  }

  return { imdbItem: item, tmdbId: null, mediaType: isTV ? 'tv' : 'movie' };
}

async function searchMovieStrict(query: string, year?: number): Promise<{ id: number } | null> {
  if (year) {
    // First try with exact year
    const exactResults = await tmdbClient.searchMoviesWithYear(query, year);
    if (exactResults.results.length > 0) {
      return exactResults.results[0];
    }
    
    // Try year ±1
    const prevYear = await tmdbClient.searchMoviesWithYear(query, year - 1);
    if (prevYear.results.length > 0) {
      return prevYear.results[0];
    }
    
    const nextYear = await tmdbClient.searchMoviesWithYear(query, year + 1);
    if (nextYear.results.length > 0) {
      return nextYear.results[0];
    }
  }
  
  return null;
}

async function searchTVStrict(query: string, year?: number): Promise<{ id: number } | null> {
  if (year) {
    // First try with exact year
    const exactResults = await tmdbClient.searchTVWithYear(query, year);
    if (exactResults.results.length > 0) {
      return exactResults.results[0];
    }
    
    // Try year ±1
    const prevYear = await tmdbClient.searchTVWithYear(query, year - 1);
    if (prevYear.results.length > 0) {
      return prevYear.results[0];
    }
    
    const nextYear = await tmdbClient.searchTVWithYear(query, year + 1);
    if (nextYear.results.length > 0) {
      return nextYear.results[0];
    }
  }
  
  return null;
}

function findBestYearMatch<T extends { id: number }>(
  results: T[],
  targetYear: number,
  dateField: string
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
