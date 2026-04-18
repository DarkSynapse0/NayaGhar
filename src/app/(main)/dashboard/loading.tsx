export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      {/* Header skeleton */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-card)]/50">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-8 pb-8">
          <div className="h-5 w-20 rounded-full animate-shimmer mb-3" />
          <div className="h-8 w-56 rounded animate-shimmer mb-2" />
          <div className="h-4 w-36 rounded animate-shimmer" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-16 rounded animate-shimmer" />
                <div className="w-8 h-8 rounded-lg animate-shimmer" />
              </div>
              <div className="h-8 w-12 rounded animate-shimmer" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="mb-10">
          <div className="h-5 w-32 rounded animate-shimmer mb-1" />
          <div className="h-3 w-52 rounded animate-shimmer mb-4" />
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="hidden sm:block px-5 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
              <div className="h-3 w-full rounded animate-shimmer" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 sm:px-5 border-b border-[var(--border)] last:border-0 bg-[var(--bg-card)]">
                <div className="w-16 h-12 rounded-lg animate-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded animate-shimmer" />
                  <div className="h-3 w-24 rounded animate-shimmer" />
                </div>
                <div className="h-4 w-20 rounded animate-shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions skeleton */}
        <div className="h-5 w-28 rounded animate-shimmer mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg animate-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded animate-shimmer" />
                  <div className="h-3 w-36 rounded animate-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
