# Movie Hub - Full-Stack Movie Hosting Platform

A Netflix-like movie hosting platform built with Next.js, featuring TMDB integration, embedded video players, watchlist management, and user authentication.

## Features

- 🎬 Browse movies and TV shows from TMDB
- 🔐 User authentication with Clerk
- 📝 Personal watchlist management
- 📥 Import watchlists from IMDb and Letterboxd
- 🎥 Embedded video player with multiple sources
- 📊 Viewing history and progress tracking
- 🎨 Modern, sleek UI with dark theme

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **APIs**: TMDB, vidsrc
- **Deployment**: Netlify

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Set up Supabase database:**
   - Run the SQL migration in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor
   - This will create all necessary tables and RLS policies

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/001_initial_schema.sql`
4. This creates:
   - `profiles` table for user data
   - `watchlist` table for saved movies/TV shows
   - `viewing_history` table for watch progress
   - `imported_lists` table for imported watchlists
   - All necessary RLS policies

## Deployment

### Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add all environment variables in Netlify dashboard
5. Deploy!

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main app pages
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities and clients
│   ├── supabase/         # Supabase helpers
│   ├── tmdb/             # TMDB API client
│   └── vidsrc/           # Video source integration
├── types/                 # TypeScript types
└── supabase/             # Database migrations
```

## License

MIT
