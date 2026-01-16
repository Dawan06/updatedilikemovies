export default function MovieDetailLoading() {
  return (
    <main className="min-h-screen bg-netflix-black">
      {/* Hero Section Skeleton */}
      <div className="relative h-[70vh] min-h-[500px]">
        {/* Backdrop skeleton */}
        <div className="absolute inset-0 skeleton" />
        <div className="absolute inset-0 bg-gradient-to-r from-netflix-black via-netflix-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/40 to-transparent" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full px-4 md:px-12 pb-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Poster Skeleton */}
                <div className="hidden md:block flex-shrink-0 w-64 -mb-32 relative z-20">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden skeleton" />
                </div>

                {/* Info Skeleton */}
                <div className="flex-1">
                  {/* Title */}
                  <div className="h-16 md:h-20 w-3/4 skeleton rounded mb-4" />

                  {/* Meta Row */}
                  <div className="flex gap-4 mb-5">
                    <div className="h-6 w-20 skeleton rounded" />
                    <div className="h-6 w-16 skeleton rounded" />
                    <div className="h-6 w-24 skeleton rounded" />
                  </div>

                  {/* Genres */}
                  <div className="flex gap-2 mb-5">
                    <div className="h-8 w-20 skeleton rounded-full" />
                    <div className="h-8 w-24 skeleton rounded-full" />
                    <div className="h-8 w-16 skeleton rounded-full" />
                  </div>

                  {/* Overview */}
                  <div className="space-y-2 mb-6 max-w-2xl">
                    <div className="h-4 w-full skeleton rounded" />
                    <div className="h-4 w-full skeleton rounded" />
                    <div className="h-4 w-3/4 skeleton rounded" />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <div className="h-14 w-32 skeleton rounded-md" />
                    <div className="h-14 w-40 skeleton rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section Skeleton */}
      <div className="relative z-10 px-4 md:px-12 py-12 md:pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-10">
              {/* Cast Section */}
              <section>
                <div className="h-6 w-32 skeleton rounded mb-4" />
                <div className="flex gap-4 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-28 text-center">
                      <div className="w-20 h-20 mx-auto mb-2 rounded-full skeleton" />
                      <div className="h-4 w-20 mx-auto skeleton rounded mb-1" />
                      <div className="h-3 w-16 mx-auto skeleton rounded" />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="glass rounded-xl p-5 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 w-16 skeleton rounded mb-1" />
                    <div className="h-5 w-32 skeleton rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
