import { AdminTableSkeleton } from "@/components/ui/LoadingSkeleton";

export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-8 bg-surface-200 rounded w-48 mb-2" />
        <div className="h-4 bg-surface-200 rounded w-40" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card">
            <div className="h-8 w-8 bg-surface-200 rounded mb-2" />
            <div className="h-7 bg-surface-200 rounded w-16 mb-1" />
            <div className="h-4 bg-surface-200 rounded w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="h-5 bg-surface-200 rounded w-28 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-surface-200 rounded w-40 mb-1" />
                  <div className="h-3 bg-surface-200 rounded w-24" />
                </div>
                <div className="h-6 bg-surface-200 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="h-5 bg-surface-200 rounded w-32 mb-4" />
          <AdminTableSkeleton />
        </div>
      </div>
    </div>
  );
}