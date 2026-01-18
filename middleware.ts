import { clerkMiddleware } from '@clerk/nextjs/server';

// Allow all routes to be accessed by guests
// Authentication is handled in components - when guests try to add to watchlist,
// use my-list, or import, they'll see a sign-in prompt instead of being blocked
export default clerkMiddleware(
  () => {
    // No route protection - all pages are accessible
    // Auth-required features show sign-in prompts in the UI
  },
  {
    clockSkewInMs: 60000, // Allow 60 seconds of clock skew
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
