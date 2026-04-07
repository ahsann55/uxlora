import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kitId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: kitData } = await supabase
      .from("kits")
      .select("id, status, user_id")
      .eq("id", kitId)
      .eq("user_id", user.id)
      .single();

    const kit = kitData as { id: string; status: string; user_id: string } | null;

    if (!kit) {
      return NextResponse.json({ error: "Kit not found." }, { status: 404 });
    }

    // Can only cancel generating or queued kits
    if (kit.status !== "generating" && kit.status !== "queued") {
      return NextResponse.json(
        { error: "Kit is not currently generating." },
        { status: 400 }
      );
    }

    // Mark as cancelled using admin client
    const adminSupabase = getAdminClient();
    await adminSupabase
      .from("kits")
      .update({
        status: "cancelled",
        current_step: "Cancelled by user",
        updated_at: new Date().toISOString(),
      })
      .eq("id", kitId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("POST /cancel error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}