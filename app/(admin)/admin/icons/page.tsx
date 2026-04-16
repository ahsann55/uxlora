import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { IconLibraryClient } from "./IconLibraryClient";

export const metadata: Metadata = {
  title: "Admin — Icon Library",
};

export default async function IconLibraryPage() {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: icons } = await (adminSupabase as any)
    .from("icon_libraries")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Icon Library</h1>
        <p className="page-subtitle">Manage game icons used in UI kit generation</p>
      </div>
      <IconLibraryClient icons={icons ?? []} />
    </div>
  );
}