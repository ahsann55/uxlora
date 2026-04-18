export function KitCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="w-full h-40 bg-surface-200 rounded-lg mb-4" />
      <div className="h-4 bg-surface-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-surface-200 rounded w-1/2 mb-4" />
      <div className="flex gap-2">
        <div className="h-8 bg-surface-200 rounded flex-1" />
        <div className="h-8 bg-surface-200 rounded flex-1" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 bg-surface-200 rounded w-48 mb-2" />
          <div className="h-4 bg-surface-200 rounded w-32" />
        </div>
        <div className="h-10 bg-surface-200 rounded w-36" />
      </div>

      {/* Kit grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <KitCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ScreenCardSkeleton({ isLandscape = false }: { isLandscape?: boolean }) {
  return (
    <div className="card animate-pulse" style={{ width: isLandscape ? "320px" : "220px", padding: "12px" }}>
      {/* Revision badge skeleton */}
      <div className="flex justify-center mb-2">
        <div className="h-5 bg-surface-200 rounded-full w-32" />
      </div>
      {/* Screen preview skeleton — centered */}
      <div
        className="bg-surface-200 rounded-xl mb-2 mx-auto"
        style={{ width: isLandscape ? "296px" : "190px", height: isLandscape ? "140px" : "380px" }}
      />
      <div className="h-4 bg-surface-200 rounded w-2/3 mb-1.5" />
      <div className="flex gap-2">
        <div className="h-8 bg-surface-200 rounded flex-1" />
        <div className="h-8 bg-surface-200 rounded flex-1" />
      </div>
    </div>
  );
}

export function KitPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-6xl mx-auto animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-4 bg-surface-200 rounded w-24 mb-3" />
            <div className="h-8 bg-surface-200 rounded w-64 mb-2" />
            <div className="h-4 bg-surface-200 rounded w-48" />
          </div>
          <div className="h-8 bg-surface-200 rounded w-24" />
        </div>

        {/* Toolbar */}
        <div className="flex gap-3 mb-6">
          <div className="h-9 bg-surface-200 rounded w-28" />
          <div className="h-9 bg-surface-200 rounded w-28" />
          <div className="h-9 bg-surface-200 rounded w-28" />
        </div>

        {/* Screen grid */}
        <div className="flex flex-wrap gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ScreenCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminTableSkeleton() {
  return (
    <div className="card overflow-hidden p-0 animate-pulse">
      <div className="p-4 border-b border-surface-300">
        <div className="h-4 bg-surface-200 rounded w-48" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-surface-200">
          <div className="h-4 bg-surface-200 rounded flex-1" />
          <div className="h-4 bg-surface-200 rounded w-24" />
          <div className="h-4 bg-surface-200 rounded w-16" />
          <div className="h-4 bg-surface-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}