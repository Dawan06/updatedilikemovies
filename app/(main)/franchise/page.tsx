import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getPopularFranchises, collectionsToFranchiseCards } from '@/lib/franchise/detector';
import FranchisePageClient from './FranchisePageClient';

// ISR: Revalidate every hour - franchises don't change often
export const revalidate = 3600;

export default async function FranchisePage() {
  // Fetch curated franchises (fast - uses predefined list)
  const collections = await getPopularFranchises();
  const franchises = collectionsToFranchiseCards(collections);

  return (
    <Suspense fallback={<FranchisePageSkeleton />}>
      <FranchisePageClient franchises={franchises} />
    </Suspense>
  );
}

function FranchisePageSkeleton() {
  return (
    <main className="min-h-screen bg-netflix-black">
      <div className="px-4 md:px-12 py-8 md:py-12">
        {/* Header Skeleton */}
        <div className="mb-8 md:mb-12">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
