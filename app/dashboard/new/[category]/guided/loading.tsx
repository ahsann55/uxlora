export default function GuidedLoading() {
  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-4 bg-surface-200 rounded w-16 mb-8" />
        <div className="h-8 bg-surface-200 rounded w-56 mb-2" />
        <div className="h-4 bg-surface-200 rounded w-40 mb-8" />
        <div className="h-2 bg-surface-200 rounded-full w-full mb-8" />
        <div className="card space-y-4">
          <div className="h-5 bg-surface-200 rounded w-32" />
          <div className="h-10 bg-surface-200 rounded" />
          <div className="h-5 bg-surface-200 rounded w-40" />
          <div className="h-10 bg-surface-200 rounded" />
          <div className="h-5 bg-surface-200 rounded w-36" />
          <div className="h-10 bg-surface-200 rounded" />
        </div>
        <div className="flex gap-3 mt-8">
          <div className="h-11 bg-surface-200 rounded flex-1" />
          <div className="h-11 bg-surface-200 rounded flex-1" />
        </div>
      </div>
    </div>
  );
}