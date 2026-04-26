export {};

// DEPRECATED: This route conflicted with /auth/callback and caused 404 errors
// in email verification flow. The active callback is at app/auth/callback/route.ts.
// Keep this file commented out — do not delete in case any external service still
// references this URL pattern.

/*
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/sign-in?error=Could not authenticate. Please try again.`
  );
}
*/