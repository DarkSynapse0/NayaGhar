export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="space-y-2 mb-8"><div className="h-8 w-64 rounded animate-shimmer" /><div className="h-4 w-48 rounded animate-shimmer" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-24 rounded-2xl animate-shimmer" />))}</div>
    </div>
  );
}
