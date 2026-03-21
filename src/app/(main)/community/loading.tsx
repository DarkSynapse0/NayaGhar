export default function CommunityLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="text-center mb-10 space-y-2"><div className="h-8 w-40 rounded animate-shimmer mx-auto" /><div className="h-4 w-64 rounded animate-shimmer mx-auto" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-40 rounded-2xl animate-shimmer" />))}</div>
    </div>
  );
}
