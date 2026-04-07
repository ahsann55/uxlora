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
      // Successful OAuth or magic link callback
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Something went wrong — redirect to sign-in with error
  return NextResponse.redirect(
    `${origin}/sign-in?error=Could not authenticate. Please try again.`
  );
}