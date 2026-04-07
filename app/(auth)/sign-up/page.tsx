import { SignUpForm } from "@/components/auth/SignUpForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your UXLora account",
};

export default function SignUpPage() {
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
            <h2 className="text-xl font-semibold text-white">Create account</h2>
            <p className="text-white/50 text-sm mt-1">
              Start generating production-ready UI kits
            </p>
          </div>

          <SignUpForm />

          <div className="mt-6 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/30 mt-6">
          By creating an account, you agree to our{" "}
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