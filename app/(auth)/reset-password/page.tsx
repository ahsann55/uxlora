import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set your new UXLora password",
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Set new password</h2>
            <p className="text-white/50 text-sm mt-1">
              Choose a strong password for your account
            </p>
          </div>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}