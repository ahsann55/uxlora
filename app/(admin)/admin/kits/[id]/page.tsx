  import { createAdminClient, createClient } from "@/lib/supabase/server";
  import { redirect } from "next/navigation";
  import { ScreenPreviewCard } from "./ScreenPreviewCard";
  import type { Database } from "@/lib/supabase/types";

  type Kit = Database["public"]["Tables"]["kits"]["Row"];
  type Screen = Database["public"]["Tables"]["screens"]["Row"];

  export default async function AdminKitPreviewPage({
    params,
  }: {
    params: Promise<{ id: string }>;
  }) {
    const { id } = await params;
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

    const adminSupabase = await createAdminClient();

    const { data: kitData } = await adminSupabase
      .from("kits")
      .select("id, name, category, checklist_data")
      .eq("id", id)
      .single();

    if (!kitData) redirect("/admin/logs");
    const kit = kitData as Kit;

    const { data: screensData } = await adminSupabase
      .from("screens")
      .select("id, name, order_index, html_css")
      .eq("kit_id", id)
      .order("order_index", { ascending: true });

    const screens = (screensData ?? []) as Screen[];

    const checklistData = kit.checklist_data as Record<string, unknown>;
    const customRaw = checklistData.custom_resolution as string | undefined;
    const presetRaw = checklistData.screen_resolution as string | undefined;
    const orientation = (checklistData.orientation as string) ?? "Portrait";
    const isLandscape = orientation === "Landscape";
    const kitCategory = kit.category;
    const kitName = kit.name;

    function parseRes(): { w: number; h: number } {
      if (customRaw?.includes("×")) {
        const parts = customRaw.split("×").map((s: string) => parseInt(s.trim()));
        if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) return { w: parts[0], h: parts[1] };
      }
      if (presetRaw && presetRaw !== "Custom" && presetRaw.includes("×")) {
        const match = presetRaw.match(/^(\d+)×(\d+)/);
        if (match) return { w: parseInt(match[1]), h: parseInt(match[2]) };
      }
      if (kitCategory === "web") return { w: 1440, h: 900 };
      return isLandscape ? { w: 844, h: 390 } : { w: 390, h: 844 };
    }

    const { w: screenW, h: screenH } = parseRes();
    const previewW = screenW > screenH ? 600 : 320;
    const scale = previewW / screenW;
    const previewH = Math.ceil(screenH * scale);

    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <a href="/admin/logs" className="text-white/50 hover:text-white text-sm mb-4 inline-block transition-colors">
            ← Back to logs
          </a>
          <h1 className="page-title">{kitName}</h1>
          <p className="page-subtitle capitalize">
            {kitCategory} · {screens.length} screens · {screenW}x{screenH}px
          </p>
        </div>

        {screens.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-white/40">No screens generated yet.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6" style={{ maxWidth: screenW > screenH ? "1260px" : "100%" }}>
            {screens.map((screen) => (
              <ScreenPreviewCard
                key={screen.id}
                screen={screen}
                screenW={screenW}
                screenH={screenH}
                previewW={previewW}
                scale={scale}
                previewH={previewH}
              />
            ))}
          </div>
        )}
      </div>
    );
  }