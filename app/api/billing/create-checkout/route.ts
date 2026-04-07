import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createCheckoutUrl, VARIANT_IDS } from "@/lib/billing/lemon-squeezy";
import { isFoundingMember, getVariantForUser } from "@/lib/billing/founding-member";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      tier: "starter" | "pro" | "studio";
      interval: "monthly" | "yearly";
    };

    if (!body.tier || !body.interval) {
      return NextResponse.json(
        { error: "Missing tier or interval" },
        { status: 400 }
      );
    }

    if (!["starter", "pro", "studio"].includes(body.tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    if (!["monthly", "yearly"].includes(body.interval)) {
      return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
    }

    // Check if user is a founding member
    const founding = await isFoundingMember(user.email!);

    // Get correct variant ID
    const variantId = getVariantForUser(body.tier, body.interval, founding);

    // Create checkout URL
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`;

    const checkoutUrl = await createCheckoutUrl(
      variantId,
      user.email!,
      user.id,
      redirectUrl
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("POST /api/billing/create-checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}