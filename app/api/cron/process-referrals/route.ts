import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { processQualifiedReferrals } from "@/lib/billing/referrals";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processQualifiedReferrals();
    return NextResponse.json({
      success: true,
      qualified: result.qualified,
      rewarded: result.rewarded,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Referral cron error:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}