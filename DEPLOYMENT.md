# Deployment Guide

## Netlify Deployment

### Prerequisites

1. A Netlify account
2. Your repository pushed to GitHub/GitLab/Bitbucket
3. All environment variables ready

### Steps

1. **Connect Repository to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider and select the repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `20` (set in `netlify.toml`)

3. **Set Environment Variables**
   In Netlify dashboard → Site settings → Environment variables, add:

   ```
   NEXT_PUBLIC_TMDB_API_KEY=37ec0b0f9f14409ef6f559739272b5f1
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_d29ya2FibGUtd29tYmF0LTQyLmNsZXJrLmFjY291bnRzLmRldiQ
   CLERK_SECRET_KEY=sk_test_L7c22GRvbxIg5uBsWMw4EwjJXM5SG4J4OyceaRorzt
   NEXT_PUBLIC_SUPABASE_URL=https://nzbfavogxtkrbccsnhm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_K3ZqYc0TVVmB0dx4lk8LSA_0JFiu0EI
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_TCRQGZpUymOBu6k2UHHeMw_gdtuGpi5
   NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
   ```

4. **Deploy**
   - Netlify will automatically deploy on push to main branch
   - Or trigger a manual deploy from the dashboard

### Database Setup

Before deploying, make sure to:

1. Run the SQL migration in Supabase:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the contents of `supabase/migrations/001_initial_schema.sql`

2. Update RLS policies if needed for your authentication setup

### Clerk Configuration

1. In Clerk dashboard, add your Netlify domain to allowed origins
2. Update redirect URLs to include your Netlify domain

### Troubleshooting

- **Build fails**: Check Node version (should be 20)
- **API routes not working**: Ensure environment variables are set correctly
- **Images not loading**: Check `next.config.js` remote patterns
- **Authentication issues**: Verify Clerk and Supabase environment variables
