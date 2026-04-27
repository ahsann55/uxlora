import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function verifyAdmin(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const profile = data as { is_admin: boolean } | null;
  if (!profile?.is_admin) return null;

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    const adminSupabase = await createAdminClient();

    // Fetch profiles
const { data: profilesData, error, count } = await adminSupabase
  .from("profiles")
  .select("*", { count: "exact" })
  .order("created_at", { ascending: false })
  .range(offset, offset + limit - 1);

// Fetch auth users to get emails
const { data: authData } = await adminSupabase.auth.admin.listUsers({
  page: page,
  perPage: limit,
});
const emailMap: Record<string, string> = {};
(authData?.users ?? []).forEach((u) => {
  emailMap[u.id] = u.email ?? "";
});

// Merge email into profiles
const data = (profilesData ?? []).map((p: Record<string, unknown>) => ({
  ...p,
  email: emailMap[p.id as string] ?? null,
}));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      users: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      userId: string;
      updates: Record<string, unknown>;
    };

    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required." },
        { status: 400 }
      );
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      "subscription_tier",
      "subscription_status",
      "generations_limit",
      "is_founding_member",
      "is_admin",
    ];

    const safeUpdates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in updates) {
        safeUpdates[field] = updates[field];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    const adminSupabase = await createAdminClient();
    const { data, error } = await (adminSupabase as any)
    .from("profiles")
    .update({
        ...safeUpdates,
        updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

    if (error) {
    return NextResponse.json(
        { error: "Failed to update user." },
        { status: 500 }
    );
    }

    // If upgrading to a paid tier, unlock all demo kits for this user
    const newTier = safeUpdates.subscription_tier as string | undefined;
    const newStatus = safeUpdates.subscription_status as string | undefined;
    if (
    newTier &&
    newTier !== "free" &&
    newStatus === "active"
    ) {
    await (adminSupabase as any)
        .from("kits")
        .update({ is_demo: false })
        .eq("user_id", userId)
        .eq("is_demo", true);
    }

    // If downgrading to free, flip all kits back to demo
    if (newTier === "free") {
    await (adminSupabase as any)
        .from("kits")
        .update({ is_demo: true })
        .eq("user_id", userId);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("PATCH /api/admin/users error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}