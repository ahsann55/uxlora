export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-8 bg-surface-200 rounded w-32 mb-2" />
        <div className="h-4 bg-surface-200 rounded w-64" />
      </div>

      {/* Profile card */}
      <div className="card mb-6">
        <div className="h-5 bg-surface-200 rounded w-24 mb-4" />
        <div className="space-y-4">
          <div>
            <div className="h-3 bg-surface-200 rounded w-28 mb-2" />
            <div className="h-5 bg-surface-200 rounded w-40" />
          </div>
          <div>
            <div className="h-3 bg-surface-200 rounded w-28 mb-2" />
            <div className="h-5 bg-surface-200 rounded w-56" />
          </div>
        </div>
      </div>

      {/* Subscription card */}
      <div className="mb-6">
        <div className="h-5 bg-surface-200 rounded w-32 mb-4" />
        <div className="card">
          <div className="h-4 bg-surface-200 rounded w-48 mb-3" />
          <div className="h-4 bg-surface-200 rounded w-32 mb-3" />
          <div className="h-8 bg-surface-200 rounded w-36" />
        </div>
      </div>

      {/* Account card */}
      <div className="card">
        <div className="h-5 bg-surface-200 rounded w-24 mb-4" />
        <div className="h-4 bg-surface-200 rounded w-48" />
      </div>
    </div>
  );
}