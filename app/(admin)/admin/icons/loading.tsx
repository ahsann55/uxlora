export default function IconsLoading() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-8 bg-surface-200 rounded w-36 mb-2" />
        <div className="h-4 bg-surface-200 rounded w-64" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 bg-surface-200 rounded w-20" />
        ))}
      </div>

      {/* Icons grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(24)].map((_, i) => (
          <div key={i} className="card p-3 flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-surface-200 rounded" />
            <div className="h-3 bg-surface-200 rounded w-16" />
            <div className="h-3 bg-surface-200 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}