import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_status, is_founding_member, generations_used_this_month, generations_limit")
      .eq("id", user.id)
      .single();

    const profile = data as {
      subscription_tier: string;
      subscription_status: string;
      is_founding_member: boolean;
      generations_used_this_month: number;
      generations_limit: number;
    } | null;

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("GET /api/profile/me error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}