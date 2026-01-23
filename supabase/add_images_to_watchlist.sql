-- Add poster_path and backdrop_path to watchlist table for caching
ALTER TABLE watchlist 
ADD COLUMN IF NOT EXISTS poster_path TEXT,
ADD COLUMN IF NOT EXISTS backdrop_path TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'watchlist';
