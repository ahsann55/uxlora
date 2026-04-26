import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_REDIRECT_PATHS = [
  "/dashboard",
  "/dashboard/settings",
  "/dashboard/new/game",
  "/dashboard/new/mobile",
  "/dashboard/new/web",
];

function sanitizeRedirect(redirectTo: string | null): string {
  if (!redirectTo) return "/dashboard";
  // Block external redirects (open redirect prevention)
  if (redirectTo.startsWith("//") || redirectTo.includes("://")) return "/dashboard";
  // Block protocol-relative or non-relative paths
  if (!redirectTo.startsWith("/")) return "/dashboard";
  // Whitelist check — only allow known internal paths
  const matched = ALLOWED_REDIRECT_PATHS.find(p => redirectTo === p || redirectTo.startsWith(`${p}/`) || redirectTo.startsWith(`${p}?`));
  return matched ? redirectTo : "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const redirectTo = sanitizeRedirect(searchParams.get("redirectTo"));

  if (errorParam) {
    console.error("Auth callback error:", errorParam, errorDescription);
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent("Authentication failed. Please try signing in again.")}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent("Invalid verification link. Please request a new one.")}`
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Code exchange failed:", error.message);
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent("Verification link is invalid or expired. Please request a new one.")}`
      );
    }

    return NextResponse.redirect(`${origin}${redirectTo}`);
  } catch (err) {
    console.error("Unexpected callback error:", err);
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent("An unexpected error occurred. Please try again.")}`
    );
  }
}