'use client';

export default function RecommendationSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-netflix-dark rounded-xl overflow-hidden border border-white/10 animate-pulse">
          {/* Poster Skeleton */}
          <div className="relative aspect-[2/3] bg-netflix-gray" />
          
          {/* Content Skeleton */}
          <div className="p-4 space-y-3">
            <div className="h-6 bg-white/10 rounded w-3/4" />
            <div className="flex gap-2">
              <div className="h-4 bg-white/10 rounded w-16" />
              <div className="h-4 bg-white/10 rounded w-12" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-white/10 rounded w-full" />
              <div className="h-3 bg-white/10 rounded w-5/6" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-white/10 rounded flex-1" />
              <div className="h-10 bg-white/10 rounded flex-1" />
              <div className="h-10 bg-white/10 rounded w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
