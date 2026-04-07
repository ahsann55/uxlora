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

    // Verify kit ownership
    const { data: kit } = await supabase
      .from("kits")
      .select("id")
      .eq("id", kitId)
      .eq("user_id", user.id)
      .single();

    if (!kit) {
      return NextResponse.json({ error: "Kit not found." }, { status: 404 });
    }

    // Parse reorder payload
    const body = await request.json() as { screenIds: string[] };
    const { screenIds } = body;

    if (!Array.isArray(screenIds) || screenIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid screen order." },
        { status: 400 }
      );
    }

    // Update order_index for each screen
    const adminSupabase = getAdminClient();

    const updates = screenIds.map((screenId, index) =>
      adminSupabase
        .from("screens")
        .update({ order_index: index, updated_at: new Date().toISOString() })
        .eq("id", screenId)
        .eq("kit_id", kitId)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("POST /reorder error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}