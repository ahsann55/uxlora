"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  creditsAvailable: number;
  creditActiveUntil: string | null;
  subscriptionTier: string;
  stats: {
    total: number;
    pending: number;
    qualified: number;
    cancelled: number;
    rewardsEarned: number;
  };
  referrals: Array<{
    id: string;
    status: string;
    referred_subscribed_at: string | null;
    qualifies_at: string | null;
    rewarded_at: string | null;
    created_at: string;
  }>;
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/referrals/me");
      if (!res.ok) throw new Error("Failed to load referrals");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError("Failed to load referral data.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!data) return;
    await navigator.clipboard.writeText(data.referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function applyCredit() {
    setApplying(true);
    try {
      const res = await fetch("/api/referrals/apply-credit", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to apply credit");
        return;
      }
      await fetchData();
    } catch {
      setError("Failed to apply credit");
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return <div className="text-white/50 p-6">Loading...</div>;
  }

  if (!data) {
    return <div className="text-white/50 p-6">{error ?? "Could not load data."}</div>;
  }

  const progressToNext = data.stats.qualified % 3;
  const remainingForNext = 3 - progressToNext;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Refer & Earn</h1>
        <p className="page-subtitle">
          Get 1 free month for every 3 friends who subscribe to a paid plan
        </p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="card mb-6">
        <h2 className="section-title mb-4">Your referral link</h2>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={data.referralUrl}
            readOnly
            className="input flex-1 font-mono text-sm"
          />
          <button onClick={copyLink} className="btn-primary px-4 py-2 text-sm">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-white/50 text-xs">
          Your referral code: <span className="text-white font-mono">{data.referralCode}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card">
          <p className="text-xs text-white/50 mb-1">Total referred</p>
          <p className="text-2xl font-bold text-white">{data.stats.total}</p>
        </div>
        <div className="card">
          <p className="text-xs text-white/50 mb-1">Pending (14 days)</p>
          <p className="text-2xl font-bold text-yellow-300">{data.stats.pending}</p>
        </div>
        <div className="card">
          <p className="text-xs text-white/50 mb-1">Qualified</p>
          <p className="text-2xl font-bold text-green-400">{data.stats.qualified}</p>
        </div>
        <div className="card">
          <p className="text-xs text-white/50 mb-1">Months earned</p>
          <p className="text-2xl font-bold text-brand-400">{data.stats.rewardsEarned}</p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="section-title mb-3">Progress to next reward</h2>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-white/60">
            <span className="text-white font-semibold">{progressToNext}</span> of 3 qualified referrals
          </p>
          <p className="text-sm text-white/60">
            {remainingForNext} more for free month
          </p>
        </div>
        <div className="usage-bar-track">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
            style={{ width: `${(progressToNext / 3) * 100}%` }}
          />
        </div>
      </div>

      {data.creditsAvailable > 0 && (
        <div className="card mb-6 border-2 border-brand-500/50 bg-brand-500/5">
          <h2 className="text-white font-semibold text-lg mb-2">
            🎁 You have {data.creditsAvailable} free month{data.creditsAvailable > 1 ? "s" : ""} available
          </h2>
          <p className="text-white/60 text-sm mb-4">
            Apply your credit now to get a free month at your current tier
            {data.subscriptionTier === "free" ? " (Starter)" : ` (${data.subscriptionTier})`}.
          </p>
          <button
            onClick={applyCredit}
            disabled={applying}
            className="btn-primary px-5 py-2 text-sm"
          >
            {applying ? "Applying..." : "Apply free month"}
          </button>
        </div>
      )}

      {data.creditActiveUntil && new Date(data.creditActiveUntil) > new Date() && (
        <div className="card mb-6 border border-green-500/30 bg-green-500/5">
          <p className="text-green-300 text-sm">
            ✓ Free month active until{" "}
            <span className="font-semibold">
              {new Date(data.creditActiveUntil).toLocaleDateString()}
            </span>
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="section-title mb-4">How it works</h2>
        <ol className="space-y-3 text-sm text-white/70">
          <li className="flex gap-3">
            <span className="text-brand-400 font-bold">1.</span>
            <span>Share your referral link with friends</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand-400 font-bold">2.</span>
            <span>They sign up and subscribe to any paid plan (Starter, Pro, or Studio)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand-400 font-bold">3.</span>
            <span>After 14 days of active subscription, they become "qualified"</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand-400 font-bold">4.</span>
            <span>Every 3 qualified referrals earns you 1 free month at your current tier</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand-400 font-bold">5.</span>
            <span>Apply your free month anytime — credits never expire</span>
          </li>
        </ol>
      </div>

      {data.referrals.length > 0 && (
        <div className="card mt-6">
          <h2 className="section-title mb-4">Recent referrals</h2>
          <div className="space-y-2">
            {data.referrals.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm text-white/70">
                    Signed up {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  {r.qualifies_at && r.status === "subscribed" && (
                    <p className="text-xs text-yellow-300/70">
                      Qualifies {new Date(r.qualifies_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  r.status === "rewarded" ? "bg-brand-500/20 text-brand-300" :
                  r.status === "qualified" ? "bg-green-500/20 text-green-300" :
                  r.status === "subscribed" ? "bg-yellow-500/20 text-yellow-300" :
                  "bg-red-500/20 text-red-300"
                }`}>
                  {r.status === "rewarded" ? "Rewarded" :
                   r.status === "qualified" ? "Qualified" :
                   r.status === "subscribed" ? "Pending" :
                   "Cancelled"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}