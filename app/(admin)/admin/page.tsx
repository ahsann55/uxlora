import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Overview",
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const profile = profileData as { is_admin: boolean } | null;
  if (!profile?.is_admin) redirect("/dashboard");

  // Fetch stats using admin client
  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = await createAdminClient();

  const [
    { count: totalUsers },
    { count: totalKits },
    { count: totalScreens },
    { count: totalLogs },
  ] = await Promise.all([
    adminSupabase.from("profiles").select("*", { count: "exact", head: true }),
    adminSupabase.from("kits").select("*", { count: "exact", head: true }),
    adminSupabase.from("screens").select("*", { count: "exact", head: true }),
    adminSupabase.from("generation_logs").select("*", { count: "exact", head: true }),
  ]);

  // Recent kits
   const { data: recentKitsData } = await adminSupabase
    .from("kits")
    .select("id, name, category, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Failed generations
  const { data: failedLogsData } = await adminSupabase
    .from("generation_logs")
    .select("id, kit_id, step, error_message, created_at")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(5);

  type RecentKit = { id: string; name: string; category: string; status: string; created_at: string };
  type FailedLog = { id: string; kit_id: string; step: string; error_message: string | null; created_at: string };

  const recentKits = (recentKitsData ?? []) as RecentKit[];
  const failedLogs = (failedLogsData ?? []) as FailedLog[];

  const stats = [
    { label: "Total Users", value: totalUsers ?? 0, icon: "👥" },
    { label: "Total Kits", value: totalKits ?? 0, icon: "🎨" },
    { label: "Total Screens", value: totalScreens ?? 0, icon: "🖼️" },
    { label: "Generation Logs", value: totalLogs ?? 0, icon: "📊" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Admin Overview</h1>
        <p className="page-subtitle">UXLora platform statistics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-white/50 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent kits */}
        <div className="card">
          <h2 className="section-title mb-4">Recent Kits</h2>
          {!recentKits || recentKits.length === 0 ? (
            <p className="text-white/40 text-sm">No kits yet.</p>
          ) : (
            <div className="space-y-3">
              {recentKits.map((kit) => (
                <div key={kit.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{kit.name}</p>
                    <p className="text-xs text-white/40 capitalize">
                      {kit.category} · {new Date(kit.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge text-xs ${
                    kit.status === "complete" ? "badge-success" :
                    kit.status === "failed" ? "badge-error" :
                    kit.status === "generating" ? "badge-brand" :
                    "badge-warning"
                  }`}>
                    {kit.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent failures */}
        <div className="card">
          <h2 className="section-title mb-4">Recent Failures</h2>
          {!failedLogs || failedLogs.length === 0 ? (
            <p className="text-white/40 text-sm">No failures recently. 🎉</p>
          ) : (
            <div className="space-y-3">
              {failedLogs.map((log) => (
                <div key={log.id} className="bg-error/10 border border-error/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-300">{log.step}</p>
                  <p className="text-xs text-white/40 mt-1 truncate">
                    {log.error_message ?? "Unknown error"}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}