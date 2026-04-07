import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { variantIdToTier, isFoundingVariant, TIER_LIMITS } from "@/lib/billing/lemon-squeezy";
import { markAsFoundingMember } from "@/lib/billing/founding-member";

// Verify webhook signature (SEC-01)
function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const hmac = createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(digest, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body BEFORE parsing JSON (SEC-01)
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature") ?? "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("Webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as {
      meta: {
        event_name: string;
        custom_data?: { user_id?: string };
      };
      data: {
        id: string;
        attributes: {
          status: string;
          user_email: string;
          variant_id: number;
          customer_id: number;
          first_subscription_item?: {
            subscription_id: number;
          };
          urls?: {
            customer_portal?: string;
          };
          cancelled: boolean;
          ends_at: string | null;
          renews_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };

    const eventName = payload.meta.event_name;
    const userId = payload.meta.custom_data?.user_id;
    const attrs = payload.data.attributes;
    const subscriptionId = payload.data.id;
    const variantId = attrs.variant_id;

    console.log(`Webhook received: ${eventName} for user ${userId}`);

    const adminSupabase = await createAdminClient() as any;

    // Map variant to tier
    const tier = variantIdToTier(variantId);
    const founding = isFoundingVariant(variantId);
    const tierLimits = tier ? TIER_LIMITS[tier] : null;

    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        if (!userId) {
          console.error("No user_id in webhook custom_data");
          break;
        }

        // Mark founding member if applicable
        if (founding) {
          await markAsFoundingMember(userId);
        }

        // Map LS status to our status
        let subscriptionStatus: string;
        if (attrs.cancelled) {
          subscriptionStatus = "cancelled";
        } else if (attrs.status === "active") {
          subscriptionStatus = "active";
        } else if (attrs.status === "past_due") {
          subscriptionStatus = "past_due";
        } else if (attrs.status === "paused") {
          subscriptionStatus = "inactive";
        } else {
          subscriptionStatus = attrs.status;
        }

        // Update profile
        await adminSupabase
          .from("profiles")
          .update({
            subscription_tier: tier ?? "free",
            subscription_status: subscriptionStatus,
            lemon_squeezy_customer_id: String(attrs.customer_id),
            lemon_squeezy_subscription_id: subscriptionId,
            generations_limit: tierLimits?.generations ?? 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        // Unlock all demo kits for this user on upgrade
        if (subscriptionStatus === "active") {
          await adminSupabase
            .from("kits")
            .update({ is_demo: false })
            .eq("user_id", userId)
            .eq("is_demo", true);
        }

        break;
      }

      case "subscription_cancelled": {
        if (!userId) break;

        await adminSupabase
          .from("profiles")
          .update({
            subscription_status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        break;
      }

      case "subscription_expired": {
        if (!userId) break;

        // Downgrade to free
        await adminSupabase
          .from("profiles")
          .update({
            subscription_tier: "free",
            subscription_status: "inactive",
            generations_limit: TIER_LIMITS.free.generations,
            lemon_squeezy_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        break;
      }

      case "subscription_payment_failed": {
        if (!userId) break;

        await adminSupabase
          .from("profiles")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        break;
      }

      case "subscription_payment_success": {
        // Payment succeeded — ensure status is active
        if (!userId) break;

        await adminSupabase
          .from("profiles")
          .update({
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        break;
      }

      default:
        console.log(`Unhandled webhook event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}