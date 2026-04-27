export default function NewKitLoading() {
  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-4 bg-surface-200 rounded w-16 mb-8" />
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-surface-200 rounded-full mx-auto mb-4" />
          <div className="h-8 bg-surface-200 rounded w-48 mx-auto mb-3" />
          <div className="h-4 bg-surface-200 rounded w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card h-52" />
          <div className="card h-52" />
        </div>
      </div>
    </div>
  );
}