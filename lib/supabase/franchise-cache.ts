import { createServiceClient } from './server';
import { Collection } from '@/types';

interface CachedFranchise {
  collection_id: number;
  collection_data: Collection;
  discovered_at: string;
  last_updated: string;
}

interface DiscoveryProgress {
  page_range: string;
  discovered_at: string;
  franchise_count: number;
}

/**
 * Get all cached franchises from Supabase
 */
export async function getCachedFranchises(): Promise<Map<number, Collection>> {
  const supabase = createServiceClient();
  const franchises = new Map<number, Collection>();

  const { data, error } = await supabase
    .from('franchise_cache')
    .select('collection_id, collection_data')
    .order('discovered_at', { ascending: false });

  if (error) {
    console.error('Error fetching cached franchises:', error);
    return franchises;
  }

  if (data) {
    data.forEach((item) => {
      try {
        const collection = item.collection_data as Collection;
        franchises.set(item.collection_id, collection);
      } catch (err) {
        console.error(`Error parsing cached franchise ${item.collection_id}:`, err);
      }
    });
  }

  return franchises;
}

/**
 * Cache franchises in Supabase (upsert to handle duplicates)
 */
export async function cacheFranchises(
  franchises: Map<number, Collection>
): Promise<void> {
  if (franchises.size === 0) return;

  const supabase = createServiceClient();
  const cacheEntries = Array.from(franchises.entries()).map(([id, collection]) => ({
    collection_id: id,
    collection_data: collection as unknown as Record<string, unknown>,
    last_updated: new Date().toISOString(),
  }));

  // Use upsert to handle duplicates (collection_id is primary key)
  const { error } = await supabase
    .from('franchise_cache')
    .upsert(cacheEntries, {
      onConflict: 'collection_id',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('Error caching franchises:', error);
    throw new Error(`Failed to cache franchises: ${error.message}`);
  }
}

/**
 * Check if a page range has been discovered
 */
export async function isPageRangeDiscovered(
  startPage: number,
  endPage: number
): Promise<boolean> {
  const supabase = createServiceClient();
  const pageRange = `${startPage}-${endPage}`;

  const { data, error } = await supabase
    .from('franchise_discovery_progress')
    .select('page_range')
    .eq('page_range', pageRange)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" which is fine
    console.error('Error checking discovery progress:', error);
    return false;
  }

  return !!data;
}

/**
 * Mark a page range as discovered
 */
export async function markPageRangeDiscovered(
  startPage: number,
  endPage: number,
  franchiseCount: number
): Promise<void> {
  const supabase = createServiceClient();
  const pageRange = `${startPage}-${endPage}`;

  const { error } = await supabase
    .from('franchise_discovery_progress')
    .upsert({
      page_range: pageRange,
      discovered_at: new Date().toISOString(),
      franchise_count: franchiseCount,
    }, {
      onConflict: 'page_range',
    });

  if (error) {
    console.error('Error marking page range as discovered:', error);
    throw new Error(`Failed to mark page range as discovered: ${error.message}`);
  }
}

/**
 * Get the next undiscovered page range
 * Returns the next 2-3 page range that hasn't been discovered yet
 */
export async function getNextUndiscoveredRange(
  maxPage: number = 200
): Promise<{ startPage: number; endPage: number } | null> {
  const supabase = createServiceClient();

  // Get all discovered ranges
  const { data: discovered, error } = await supabase
    .from('franchise_discovery_progress')
    .select('page_range')
    .order('page_range', { ascending: true });

  if (error) {
    console.error('Error fetching discovery progress:', error);
    // If error, start from beginning
    return { startPage: 1, endPage: 3 };
  }

  const discoveredRanges = new Set(discovered?.map((d) => d.page_range) || []);

  // Find the first undiscovered range (in chunks of 3 pages)
  for (let start = 1; start <= maxPage; start += 3) {
    const end = Math.min(start + 2, maxPage);
    const rangeKey = `${start}-${end}`;

    if (!discoveredRanges.has(rangeKey)) {
      return { startPage: start, endPage: end };
    }
  }

  // All ranges discovered
  return null;
}

/**
 * Get total count of cached franchises
 */
export async function getCachedFranchiseCount(): Promise<number> {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from('franchise_cache')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting cached franchises:', error);
    return 0;
  }

  return count || 0;
}
