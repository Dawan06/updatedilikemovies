-- Create tmdb_mappings table for caching IMDb ID -> TMDB ID mappings
-- This dramatically speeds up imports by avoiding redundant API calls

CREATE TABLE IF NOT EXISTS tmdb_mappings (
  imdb_id TEXT PRIMARY KEY,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by IMDb ID
CREATE INDEX IF NOT EXISTS idx_tmdb_mappings_imdb_id ON tmdb_mappings(imdb_id);

-- Index for media type lookups
CREATE INDEX IF NOT EXISTS idx_tmdb_mappings_media_type ON tmdb_mappings(media_type);

-- Create table for Letterboxd title+year -> TMDB mappings
CREATE TABLE IF NOT EXISTS tmdb_mappings_letterboxd (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title, year, media_type)
);

-- Index for fast lookups by title and year
CREATE INDEX IF NOT EXISTS idx_tmdb_mappings_letterboxd_lookup ON tmdb_mappings_letterboxd(title, year, media_type);

-- Enable RLS (Row Level Security) - these tables are read-only for all authenticated users
-- Service role can write, authenticated users can read
ALTER TABLE tmdb_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tmdb_mappings_letterboxd ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read (for cache lookups)
DROP POLICY IF EXISTS "Allow authenticated read on tmdb_mappings" ON tmdb_mappings;
CREATE POLICY "Allow authenticated read on tmdb_mappings" ON tmdb_mappings
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on tmdb_mappings_letterboxd" ON tmdb_mappings_letterboxd;
CREATE POLICY "Allow authenticated read on tmdb_mappings_letterboxd" ON tmdb_mappings_letterboxd
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role can do everything (for bulk inserts)
-- Note: Service role bypasses RLS by default, so no policy needed
