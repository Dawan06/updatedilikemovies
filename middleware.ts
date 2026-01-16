import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Only protect routes that require authentication
// Guests can browse: /, /browse, /movie, /tv, /franchise, /watch (but will see sign-in message)
// But cannot access: /my-list, /import, /settings
const isProtectedRoute = createRouteMatcher([
  '/my-list(.*)',
  '/import(.*)',
  '/settings(.*)',
]);

export default clerkMiddleware(
  (auth, req) => {
    if (isProtectedRoute(req)) {
      auth().protect();
    }
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
