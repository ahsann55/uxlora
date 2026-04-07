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

    // Get user's subscription ID from profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("lemon_squeezy_subscription_id, subscription_status")
      .eq("id", user.id)
      .single();

    const profile = profileData as {
      lemon_squeezy_subscription_id: string | null;
      subscription_status: string;
    } | null;

    if (!profile?.lemon_squeezy_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found." },
        { status: 404 }
      );
    }

    // Get subscription details from Lemon Squeezy
    initLemonSqueezy();
    const subscription = await getSubscriptionDetails(
      profile.lemon_squeezy_subscription_id
    );

    const portalUrl = subscription?.attributes?.urls?.customer_portal;

    if (!portalUrl) {
      return NextResponse.json(
        { error: "Could not retrieve portal URL." },
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