import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendKitReadyEmail } from "@/lib/notifications/email";
import { createAdminClient } from "@/lib/supabase/server";

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

    const adminSupabase = await createAdminClient();

    // Fetch kit with notification status
    const { data: kitData } = await adminSupabase
      .from("kits")
      .select("id, name, category, status, user_id, notification_sent")
      .eq("id", kitId)
      .single();

    const kit = kitData as {
      id: string;
      name: string;
      category: string;
      status: string;
      user_id: string;
      notification_sent: boolean;
    } | null;

    if (!kit) {
      return NextResponse.json({ error: "Kit not found." }, { status: 404 });
    }

    // Only send for complete kits
    if (kit.status !== "complete") {
      return NextResponse.json(
        { error: "Kit is not complete yet." },
        { status: 400 }
      );
    }

    // Check if already sent (UX-10)
    if (kit.notification_sent) {
      return NextResponse.json({ message: "Notification already sent." });
    }

    // Get screen count
    const { count: screenCount } = await adminSupabase
      .from("screens")
      .select("*", { count: "exact", head: true })
      .eq("kit_id", kitId);

    // Get user email
    const { data: { user: kitUser } } = await adminSupabase.auth.admin.getUserById(kit.user_id);

    if (!kitUser?.email) {
      return NextResponse.json(
        { error: "User email not found." },
        { status: 400 }
      );
    }

    // Send email
    const sent = await sendKitReadyEmail({
      to: kitUser.email,
      kitName: kit.name,
      kitId: kit.id,
      screenCount: screenCount ?? 0,
      category: kit.category,
    });

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send email." },
        { status: 500 }
      );
    }

    // Mark notification as sent
    await (adminSupabase as any)
      .from("kits")
      .update({ notification_sent: true })
      .eq("id", kitId);

    return NextResponse.json({ message: "Notification sent." });
  } catch (error) {
    console.error("POST /api/kits/[id]/notify error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}