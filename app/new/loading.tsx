export default function NewKitLoading() {
  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="mb-10 text-center">
          <div className="h-4 bg-surface-200 rounded w-24 mx-auto mb-6" />
          <div className="h-9 bg-surface-200 rounded w-64 mx-auto mb-3" />
          <div className="h-4 bg-surface-200 rounded w-48 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-72" />
          ))}
        </div>
      </div>
    </div>
  );
}