"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/utils";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Error message */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input"
          autoComplete="email"
          required
          disabled={loading}
        />
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="label mb-0">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="input"
          autoComplete="current-password"
          required
          disabled={loading}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-2.5 mt-2"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

    </form>
  );
}