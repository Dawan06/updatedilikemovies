-- Migration: Create franchise cache tables for persistent caching
-- This allows franchise discovery to work within Netlify's 10 second timeout limit

-- Table to cache discovered franchise collections
CREATE TABLE IF NOT EXISTS franchise_cache (
  collection_id INTEGER PRIMARY KEY,
  collection_data JSONB NOT NULL,
  discovered_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_franchise_cache_discovered_at ON franchise_cache(discovered_at DESC);

-- Table to track which page ranges have been discovered
CREATE TABLE IF NOT EXISTS franchise_discovery_progress (
  page_range TEXT PRIMARY KEY, -- e.g., "1-3", "4-6"
  discovered_at TIMESTAMP DEFAULT NOW(),
  franchise_count INTEGER DEFAULT 0 -- Number of franchises discovered in this range
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_franchise_discovery_progress_discovered_at ON franchise_discovery_progress(discovered_at DESC);

-- Function to get all cached franchises (for fast retrieval)
CREATE OR REPLACE FUNCTION get_cached_franchises()
RETURNS TABLE (
  collection_id INTEGER,
  collection_data JSONB,
  discovered_at TIMESTAMP,
  last_updated TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.collection_id,
    fc.collection_data,
    fc.discovered_at,
    fc.last_updated
  FROM franchise_cache fc
  ORDER BY fc.discovered_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a page range has been discovered
CREATE OR REPLACE FUNCTION is_page_range_discovered(page_range_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM franchise_discovery_progress 
    WHERE page_range = page_range_text
  );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (allow public read, but restrict writes to service role)
ALTER TABLE franchise_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_discovery_progress ENABLE ROW LEVEL SECURITY;


-- Allow public read access (for API queries)
DROP POLICY IF EXISTS "Allow public read access to franchise_cache" ON franchise_cache;
CREATE POLICY "Allow public read access to franchise_cache"
  ON franchise_cache FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read access to franchise_discovery_progress" ON franchise_discovery_progress;
CREATE POLICY "Allow public read access to franchise_discovery_progress"
  ON franchise_discovery_progress FOR SELECT
  USING (true);

-- Only service role can write (via server-side functions)
DROP POLICY IF EXISTS "Allow service role write access to franchise_cache" ON franchise_cache;
CREATE POLICY "Allow service role write access to franchise_cache"
  ON franchise_cache FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role write access to franchise_discovery_progress" ON franchise_discovery_progress;
CREATE POLICY "Allow service role write access to franchise_discovery_progress"
  ON franchise_discovery_progress FOR ALL
  USING (auth.role() = 'service_role');
