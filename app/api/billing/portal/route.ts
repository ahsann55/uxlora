import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSubscriptionDetails, initLemonSqueezy } from "@/lib/billing/lemon-squeezy";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("lemon_squeezy_subscription_id, subscription_status, subscription_tier")
      .eq("id", user.id)
      .single();

    const profile = profileData as {
      lemon_squeezy_subscription_id: string | null;
      subscription_status: string;
      subscription_tier: string;
    } | null;

    // No LMS subscription — account was manually upgraded or is free
    // Return a flag so the frontend can show the appropriate action
    if (!profile?.lemon_squeezy_subscription_id) {
      return NextResponse.json(
        { error: "no_lms_subscription", tier: profile?.subscription_tier ?? "free" },
        { status: 404 }
      );
    }

    initLemonSqueezy();
    const subscription = await getSubscriptionDetails(
      profile.lemon_squeezy_subscription_id
    );

    // Try customer portal first, fall back to update payment URL
    const portalUrl =
      subscription?.attributes?.urls?.customer_portal ??
      subscription?.attributes?.urls?.update_payment_method ??
      null;

    if (!portalUrl) {
      return NextResponse.json(
        { error: "no_portal_url" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("GET /api/billing/portal error:", error);
    return NextResponse.json(
      { error: "Failed to get portal URL." },
      { status: 500 }
    );
  }
}