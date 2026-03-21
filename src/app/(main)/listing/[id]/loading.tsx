export default function ListingLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="h-4 w-28 rounded animate-shimmer mb-4" />
      <div className="rounded-2xl overflow-hidden grid grid-cols-2 sm:grid-cols-3 gap-1">
        <div className="col-span-2 sm:row-span-2 h-52 sm:h-[380px] animate-shimmer" />
        <div className="h-32 sm:h-[186px] animate-shimmer" />
      </div>
      <div className="mt-5 space-y-3"><div className="h-7 w-3/4 rounded animate-shimmer" /><div className="h-4 w-1/2 rounded animate-shimmer" /></div>
      <div className="mt-4 h-20 rounded-2xl animate-shimmer" />
    </div>
  );
}
