import { SignInForm } from "@/components/auth/SignInForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your UXLora account",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white">
              UX<span className="text-brand-500">Lora</span>
            </h1>
          </Link>
          <p className="text-white/50 mt-2 text-sm">
            AI-powered UI kit generator
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Welcome back</h2>
            <p className="text-white/50 text-sm mt-1">
              Sign in to your account to continue
            </p>
          </div>

          <SignInForm />

          <div className="mt-6 text-center text-sm text-white/50">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/30 mt-6">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="hover:text-white/50 transition-colors">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:text-white/50 transition-colors">
            Privacy Policy
          </Link>
        </p>

      </div>
    </div>
  );
}