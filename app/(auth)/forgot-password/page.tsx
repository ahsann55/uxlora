import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your UXLora account password",
};

export default function ForgotPasswordPage() {
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
            <h2 className="text-xl font-semibold text-white">Reset password</h2>
            <p className="text-white/50 text-sm mt-1">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          <ForgotPasswordForm />

          <div className="mt-6 text-center text-sm text-white/50">
            Remember your password?{" "}
            <Link
              href="/sign-in"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}