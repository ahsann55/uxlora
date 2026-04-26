"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/utils";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && /^[A-Z0-9]{4,16}$/.test(ref)) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (trimmedName.length > 50) {
      setError("Name must be less than 50 characters.");
      return;
    }
    if (!/^[\p{L}\p{M}\s'.\-]+$/u.test(trimmedName)) {
      setError("Name can only contain letters, spaces, hyphens, apostrophes, and periods.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (trimmedEmail.length > 254) {
      setError("Email address is too long.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password.length > 128) {
      setError("Password must be less than 128 characters.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const signUpData: any = {
        full_name: trimmedName,
      };
      if (referralCode) {
        signUpData.referred_by_code = referralCode;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: signUpData,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Success state — email verification sent
  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Check your email
        </h3>
        <p className="text-white/50 text-sm">
          We sent a verification link to{" "}
          <span className="text-white font-medium">{email}</span>. Click the
          link to activate your account.
        </p>
        <button
          onClick={() => router.push("/sign-in")}
          className="btn-secondary mt-6 w-full"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Referral banner */}
      {referralCode && (
        <div className="bg-brand-500/10 border border-brand-500/30 text-brand-200 text-sm px-4 py-3 rounded-lg">
          🎁 You were invited! Sign up and subscribe to help your friend earn a free month.
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Display name */}
      <div>
        <label htmlFor="displayName" className="label">
          Your name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your full name"
          className="input"
          autoComplete="name"
          required
          minLength={2}
          maxLength={50}
          disabled={loading}
        />
      </div>

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
          maxLength={254}
          disabled={loading}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters, A-Z, a-z, 0-9"
          className="input"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          disabled={loading}
        />
        <p className="text-xs text-white/40 mt-1">
          Must include uppercase, lowercase, and a number.
        </p>
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor="confirmPassword" className="label">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="input"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          disabled={loading}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-2.5 mt-2"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>

    </form>
  );
}