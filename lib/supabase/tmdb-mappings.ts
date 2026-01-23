import { createServiceClient } from './server';

export interface TMDBMapping {
  imdb_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
}

export interface LetterboxdMapping {
  title: string;
  year: number | null;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
}

/**
 * Batch lookup IMDb IDs in the cache
 * Returns a map of imdb_id -> { tmdb_id, media_type }
 */
export async function batchLookupIMDbMappings(
  imdbIds: string[]
): Promise<Map<string, { tmdb_id: number; media_type: 'movie' | 'tv' }>> {
  if (imdbIds.length === 0) {
    return new Map();
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('tmdb_mappings')
    .select('imdb_id, tmdb_id, media_type')
    .in('imdb_id', imdbIds);

  if (error) {
    console.error('Error looking up IMDb mappings:', error);
    return new Map();
  }

  const map = new Map<string, { tmdb_id: number; media_type: 'movie' | 'tv' }>();
  (data || []).forEach((mapping) => {
    map.set(mapping.imdb_id, {
      tmdb_id: mapping.tmdb_id,
      media_type: mapping.media_type as 'movie' | 'tv',
    });
  });

  return map;
}

/**
 * Batch insert new IMDb -> TMDB mappings
 */
export async function batchInsertIMDbMappings(
  mappings: Array<{ imdb_id: string; tmdb_id: number; media_type: 'movie' | 'tv' }>
): Promise<void> {
  if (mappings.length === 0) return;

  const supabase = createServiceClient();
  
  // Use upsert to handle duplicates gracefully
  const { error } = await supabase
    .from('tmdb_mappings')
    .upsert(
      mappings.map((m) => ({
        imdb_id: m.imdb_id,
        tmdb_id: m.tmdb_id,
        media_type: m.media_type,
      })),
      {
        onConflict: 'imdb_id',
        ignoreDuplicates: true,
      }
    );

  if (error) {
    console.error('Error inserting IMDb mappings:', error);
    // Don't throw - cache writes shouldn't block imports
  }
}

/**
 * Batch lookup Letterboxd title+year mappings
 */
export async function batchLookupLetterboxdMappings(
  items: Array<{ title: string; year: number | null; media_type?: 'movie' | 'tv' }>
): Promise<Map<string, { tmdb_id: number; media_type: 'movie' | 'tv' }>> {
  if (items.length === 0) {
    return new Map();
  }

  const supabase = createServiceClient();
  const map = new Map<string, { tmdb_id: number; media_type: 'movie' | 'tv' }>();

  // Get unique titles to query (case-insensitive matching)
  const uniqueTitles = new Set(items.map(item => item.title.toLowerCase().trim()));
  const titlesArray = Array.from(uniqueTitles);

  // Query in batches by title, then filter in memory for exact matches
  const batchSize = 100;
  for (let i = 0; i < titlesArray.length; i += batchSize) {
    const titleBatch = titlesArray.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('tmdb_mappings_letterboxd')
      .select('title, year, tmdb_id, media_type')
      .in('title', titleBatch);

    if (error) {
      console.error('Error looking up Letterboxd mappings:', error);
      continue;
    }

    // Build a lookup map from the results
    // Store with normalized title for matching
    (data || []).forEach((mapping) => {
      const normalizedTitle = mapping.title.toLowerCase().trim();
      const key = `${normalizedTitle}:${mapping.year || 'null'}:${mapping.media_type}`;
      map.set(key, {
        tmdb_id: mapping.tmdb_id,
        media_type: mapping.media_type as 'movie' | 'tv',
      });
    });
  }

  return map;
}

/**
 * Batch insert new Letterboxd -> TMDB mappings
 */
export async function batchInsertLetterboxdMappings(
  mappings: Array<{ title: string; year: number | null; tmdb_id: number; media_type: 'movie' | 'tv' }>
): Promise<void> {
  if (mappings.length === 0) return;

  const supabase = createServiceClient();
  
  // Use upsert to handle duplicates gracefully
  // Note: Supabase requires the conflict target to match the unique constraint
  const { error } = await supabase
    .from('tmdb_mappings_letterboxd')
    .upsert(
      mappings.map((m) => ({
        title: m.title,
        year: m.year,
        tmdb_id: m.tmdb_id,
        media_type: m.media_type,
      })),
      {
        onConflict: 'title,year,media_type',
        ignoreDuplicates: false, // Update if exists
      }
    );

  if (error) {
    console.error('Error inserting Letterboxd mappings:', error);
    // Don't throw - cache writes shouldn't block imports
  }
}
