export default function MainLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      <p className="text-xs text-[var(--text-muted)]">Loading...</p>
    </div>
  );
}
