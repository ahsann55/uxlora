import { DashboardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-surface-200 rounded w-48 mb-2" />
        <div className="h-4 bg-surface-200 rounded w-32" />
      </div>
      <DashboardSkeleton />
    </div>
  );
}