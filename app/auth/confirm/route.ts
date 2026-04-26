import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_NEXT_PATHS = [
  "/dashboard",
  "/dashboard/settings",
  "/sign-in",
];

function sanitizeNext(next: string | null): string {
  if (!next) return "/dashboard";
  if (next.startsWith("//") || next.includes("://")) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  const matched = ALLOWED_NEXT_PATHS.find(p => next === p || next.startsWith(`${p}/`));
  return matched ? next : "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeNext(searchParams.get("next"));

  if (!token_hash || !type) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent("Invalid verification link.")}`
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (error) {
      console.error("OTP verify failed:", error.message);
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent("Verification link is invalid or expired.")}`
      );
    }

    return NextResponse.redirect(`${origin}/auth/confirmed`);
  } catch (err) {
    console.error("Unexpected confirm error:", err);
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent("An unexpected error occurred.")}`
    );
  }
}