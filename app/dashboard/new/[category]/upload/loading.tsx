export default function UploadLoading() {
  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-4 bg-surface-200 rounded w-16 mb-8" />
        <div className="flex items-center gap-3 mb-8">
          <div className="w-6 h-6 bg-surface-200 rounded-full" />
          <div className="flex-1 h-px bg-surface-300" />
          <div className="w-6 h-6 bg-surface-200 rounded-full" />
          <div className="flex-1 h-px bg-surface-300" />
          <div className="w-6 h-6 bg-surface-200 rounded-full" />
        </div>
        <div className="card h-48 flex items-center justify-center">
          <div className="h-5 bg-surface-200 rounded w-40" />
        </div>
      </div>
    </div>
  );
}