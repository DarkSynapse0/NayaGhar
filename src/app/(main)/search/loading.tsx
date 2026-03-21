export default function SearchLoading() {
  return (
    <div className="min-h-screen px-5 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex gap-8 pt-6 pb-16">

          {/* Sidebar skeleton */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0 space-y-5">
            <div className="h-11 rounded-xl animate-shimmer" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-24 rounded animate-shimmer" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded-xl animate-shimmer" />
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-4 w-12 rounded animate-shimmer" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded-xl animate-shimmer" />
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-4 w-16 rounded animate-shimmer" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded-xl animate-shimmer" />
              ))}
            </div>
          </aside>

          {/* Grid skeleton */}
          <div className="flex-1 min-w-0">
            <div className="h-4 w-32 rounded animate-shimmer mb-5" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-[20px] bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
                  <div className="h-56 animate-shimmer" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-3/4 rounded animate-shimmer" />
                    <div className="h-3 w-1/2 rounded animate-shimmer" />
                    <div className="pt-2 border-t border-white/[0.04]">
                      <div className="h-5 w-24 rounded animate-shimmer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
