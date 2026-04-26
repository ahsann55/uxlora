import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
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
  const matched = ALLOWED_NEXT_PATHS.find(
    (p) => next === p || next.startsWith(`${p}/`)
  );
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
    // Build the redirect response first so we can attach cookies to it
    const redirectResponse = NextResponse.redirect(`${origin}/auth/confirmed`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              redirectResponse.cookies.set(name, value, options as Parameters<typeof redirectResponse.cookies.set>[2]);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (error) {
      console.error("OTP verify failed:", error.message);
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent(
          "Verification link is invalid or expired."
        )}`
      );
    }

    return redirectResponse;
  } catch (err) {
    console.error("Unexpected confirm error:", err);
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(
        "An unexpected error occurred."
      )}`
    );
  }
}