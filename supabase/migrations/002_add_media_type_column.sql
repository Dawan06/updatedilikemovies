-- Migration: Add missing columns to watchlist table (media_type and status)
-- This fixes the issue where watchlist table is missing required columns
-- Simple, direct SQL statements - guaranteed to work

-- Add media_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'watchlist' 
        AND column_name = 'media_type'
    ) THEN
        -- Add column with default
        ALTER TABLE watchlist ADD COLUMN media_type TEXT DEFAULT 'movie';
        
        -- Update existing rows to have 'movie' as default
        UPDATE watchlist SET media_type = 'movie' WHERE media_type IS NULL;
        
        -- Make it NOT NULL and set default
        ALTER TABLE watchlist ALTER COLUMN media_type SET NOT NULL;
        ALTER TABLE watchlist ALTER COLUMN media_type SET DEFAULT 'movie';
        
        -- Add check constraint
        ALTER TABLE watchlist ADD CONSTRAINT watchlist_media_type_check 
        CHECK (media_type IN ('movie', 'tv'));
        
        RAISE NOTICE 'Added media_type column to watchlist table';
    ELSE
        RAISE NOTICE 'media_type column already exists';
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'watchlist' 
        AND column_name = 'status'
    ) THEN
        -- Add column with default
        ALTER TABLE watchlist ADD COLUMN status TEXT DEFAULT 'plan_to_watch';
        
        -- Update existing rows
        UPDATE watchlist SET status = 'plan_to_watch' WHERE status IS NULL;
        
        -- Make it NOT NULL and set default
        ALTER TABLE watchlist ALTER COLUMN status SET NOT NULL;
        ALTER TABLE watchlist ALTER COLUMN status SET DEFAULT 'plan_to_watch';
        
        -- Add check constraint
        ALTER TABLE watchlist ADD CONSTRAINT watchlist_status_check 
        CHECK (status IN ('watching', 'completed', 'plan_to_watch'));
        
        RAISE NOTICE 'Added status column to watchlist table';
    ELSE
        RAISE NOTICE 'status column already exists';
    END IF;
END $$;

-- Drop old unique constraint if it exists (without media_type)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'watchlist_user_id_tmdb_id_key'
    ) THEN
        ALTER TABLE watchlist DROP CONSTRAINT watchlist_user_id_tmdb_id_key;
        RAISE NOTICE 'Dropped old unique constraint (without media_type)';
    END IF;
END $$;

-- Add unique constraint with media_type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'watchlist_user_id_tmdb_id_media_type_key'
    ) THEN
        ALTER TABLE watchlist 
        ADD CONSTRAINT watchlist_user_id_tmdb_id_media_type_key 
        UNIQUE (user_id, tmdb_id, media_type);
        RAISE NOTICE 'Added unique constraint with media_type';
    ELSE
        RAISE NOTICE 'Unique constraint with media_type already exists';
    END IF;
END $$;

-- Verify columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'watchlist'
ORDER BY ordinal_position;
