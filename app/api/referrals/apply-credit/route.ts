import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { applyReferralCredit } from "@/lib/billing/referrals";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const success = await applyReferralCredit(user.id);

  if (!success) {
    return NextResponse.json(
      { error: "No credits available" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}