export function CardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 animate-pulse">
      <div className="h-3 w-24 bg-surface-hover rounded mb-3" />
      <div className="h-5 w-48 bg-surface-hover rounded mb-2" />
      <div className="h-3 w-32 bg-surface-hover rounded" />
    </div>
  )
}
