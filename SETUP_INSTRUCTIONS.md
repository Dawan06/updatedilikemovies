# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   Create a `.env.local` file in the root directory with:
   ```env
   NEXT_PUBLIC_TMDB_API_KEY=37ec0b0f9f14409ef6f559739272b5f1
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_d29ya2FibGUtd29tYmF0LTQyLmNsZXJrLmFjY291bnRzLmRldiQ
   CLERK_SECRET_KEY=sk_test_L7c22GRvbxIg5uBsWMw4EwjJXM5SG4J4OyceaRorzt
   NEXT_PUBLIC_SUPABASE_URL=https://nzbfavogxtkrbccsnhm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_K3ZqYc0TVVmB0dx4lk8LSA_0JFiu0EI
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_TCRQGZpUymOBu6k2UHHeMw_gdtuGpi5
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Set Up Supabase Database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL from `supabase/migrations/001_initial_schema.sql`
   - This creates all necessary tables and RLS policies

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Features Implemented

✅ **Authentication**
- Clerk integration for sign up/login
- Protected routes
- User profile management

✅ **Movie & TV Show Browsing**
- Homepage with trending content
- Browse page with categories
- Search functionality
- Movie and TV show detail pages
- Cast and crew information

✅ **Watchlist Management**
- Add/remove items from watchlist
- Filter by status (watching, completed, plan to watch)
- View watchlist organized by status

✅ **Video Player**
- FastStream-inspired video player
- Multiple quality options
- Playback controls (play, pause, volume, fullscreen)
- Progress tracking
- Integration with vidsrc and alternative sources

✅ **Import Functionality**
- Import watchlists from IMDb (CSV)
- Import watchlists from Letterboxd (CSV)
- Automatic matching with TMDB

✅ **User Settings**
- Profile customization
- Preferences (theme, language, notifications)
- Account management

✅ **Database**
- User profiles
- Watchlist storage
- Viewing history
- Imported lists tracking

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main app pages
│   │   ├── browse/        # Browse movies/TV
│   │   ├── movie/[id]/    # Movie details
│   │   ├── tv/[id]/       # TV show details
│   │   ├── watch/         # Video player
│   │   ├── my-list/       # User watchlist
│   │   ├── import/        # Import watchlist
│   │   └── settings/      # User settings
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # UI components
│   ├── video-player/     # Video player
│   ├── movie-card/       # Movie/TV cards
│   └── navigation/       # Navbar
├── lib/                  # Utilities
│   ├── supabase/         # Supabase helpers
│   ├── tmdb/             # TMDB API client
│   ├── vidsrc/           # Video source integration
│   └── importers/        # Watchlist importers
└── types/                # TypeScript types
```

## Next Steps

1. **Install dependencies**: `npm install`
2. **Set up database**: Run the SQL migration in Supabase
3. **Configure Clerk**: Add your domain to allowed origins
4. **Test locally**: Run `npm run dev`
5. **Deploy to Netlify**: Follow instructions in `DEPLOYMENT.md`

## Notes

- The video player uses vidsrc and alternative sources for streaming
- All user data is stored in Supabase with proper RLS policies
- Images are optimized using Next.js Image component
- The UI is fully responsive and works on all screen sizes
