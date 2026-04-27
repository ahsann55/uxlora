"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
  initialDisplayName: string;
  email: string;
  emailVerified: boolean;
}

export function SettingsClient({ initialDisplayName, email, emailVerified }: SettingsClientProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const router = useRouter();

  async function handleSaveName() {
    if (!displayName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const userId = (await supabase.auth.getUser()).data.user!.id;
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSaved(true);
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch {
      setPasswordError("Failed to update password. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleResendVerification() {
    setResendLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      setResendSent(true);
    } catch {
      // fail silently — show sent anyway to avoid email enumeration
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="card space-y-5">
      {/* Email verification banner */}
      {!emailVerified && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-yellow-300 text-sm font-medium">Email not verified</p>
            <p className="text-white/40 text-xs mt-0.5">Check your inbox or resend the confirmation email.</p>
          </div>
          {resendSent ? (
            <span className="text-green-400 text-xs font-medium flex-shrink-0">Sent ✓</span>
          ) : (
            <button
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="text-yellow-300 hover:text-yellow-200 text-xs font-medium flex-shrink-0 transition-colors disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend →"}
            </button>
          )}
        </div>
      )}

      {/* Display name */}
      <div>
        <label className="label">Display name</label>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input flex-1"
            placeholder="Your name"
            maxLength={50}
          />
          <button
            onClick={handleSaveName}
            disabled={saving || displayName.trim() === initialDisplayName}
            className="btn-primary px-4 text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>

      {/* Email — read only */}
      <div>
        <label className="label">Email address</label>
        <p className="text-white font-medium mt-1">{email}</p>
        <p className="text-white/30 text-xs mt-0.5">
          Contact support to change your email address.
        </p>
      </div>

      {/* Password */}
      <div>
        <label className="label">Password</label>
        {!showPasswordForm ? (
          <div className="flex items-center justify-between mt-1">
            <p className="text-white/50 text-sm">••••••••</p>
            <button
              onClick={() => setShowPasswordForm(true)}
              className="text-brand-400 hover:text-brand-300 text-sm transition-colors"
            >
              Change password →
            </button>
          </div>
        ) : (
          <div className="space-y-2 mt-1">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input w-full"
              placeholder="New password (min 8 characters)"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input w-full"
              placeholder="Confirm new password"
            />
            {passwordError && (
              <p className="text-red-400 text-xs">{passwordError}</p>
            )}
            {passwordSaved && (
              <p className="text-green-400 text-xs">Password updated successfully ✓</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="btn-primary text-sm px-4 disabled:opacity-50"
              >
                {passwordSaving ? "Updating..." : "Update password"}
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError(null);
                }}
                className="btn-secondary text-sm px-4"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}