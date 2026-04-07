"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  id: string;
  display_name: string | null;
  subscription_tier: string;
  subscription_status: string;
  generations_used_this_month: number;
  generations_limit: number;
  is_founding_member: boolean;
  is_admin: boolean;
  created_at: string;
}

const tierColors: Record<string, string> = {
  free: "badge-warning",
  starter: "badge-brand",
  pro: "badge-success",
  studio: "badge",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?page=${page}&limit=20`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveUser(userId: string) {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates: editValues }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to update user.");
        return;
      }

      setEditingUser(null);
      setEditValues({});
      await fetchUsers();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(user: UserProfile) {
    setEditingUser(user.id);
    setEditValues({
      subscription_tier: user.subscription_tier,
      subscription_status: user.subscription_status,
      generations_limit: user.generations_limit,
      is_founding_member: user.is_founding_member,
      is_admin: user.is_admin,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/50">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">{total} total users</p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-white/50 hover:text-white">✕</button>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-300">
              <th className="text-left p-4 text-white/50 text-sm font-medium">User</th>
              <th className="text-left p-4 text-white/50 text-sm font-medium">Tier</th>
              <th className="text-left p-4 text-white/50 text-sm font-medium">Generations</th>
              <th className="text-left p-4 text-white/50 text-sm font-medium">Flags</th>
              <th className="text-left p-4 text-white/50 text-sm font-medium">Joined</th>
              <th className="text-left p-4 text-white/50 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-surface-200 hover:bg-surface-100 transition-colors">
                <td className="p-4">
                  <p className="text-sm font-medium text-white">
                    {user.display_name ?? "—"}
                  </p>
                  <p className="text-xs text-white/40 font-mono">{user.id.slice(0, 8)}...</p>
                </td>
                <td className="p-4">
                  {editingUser === user.id ? (
                    <div className="flex flex-col gap-1">
  <select
    value={editValues.subscription_tier as string}
    onChange={(e) => {
      const tier = e.target.value;
      const defaultStatus = tier === "free" ? "inactive" : "active";
      const defaultLimit = tier === "free" ? 1 : tier === "starter" ? 3 : tier === "pro" ? 5 : 10;
      setEditValues({
        ...editValues,
        subscription_tier: tier,
        subscription_status: defaultStatus,
        generations_limit: defaultLimit,
      });
    }}
    className="input text-xs py-1"
  >
    <option value="free">Free</option>
    <option value="starter">Starter</option>
    <option value="pro">Pro</option>
    <option value="studio">Studio</option>
  </select>
  <select
    value={editValues.subscription_status as string}
    onChange={(e) => setEditValues({ ...editValues, subscription_status: e.target.value })}
    className="input text-xs py-1"
  >
    <option value="inactive">Inactive</option>
    <option value="active">Active</option>
    <option value="cancelled">Cancelled</option>
    <option value="past_due">Past Due</option>
  </select>
</div>
                  ) : (
                    <span className={`badge text-xs ${tierColors[user.subscription_tier] ?? "badge"}`}>
                      {user.subscription_tier}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {editingUser === user.id ? (
                    <input
                      type="number"
                      value={editValues.generations_limit as number}
                      onChange={(e) => setEditValues({ ...editValues, generations_limit: parseInt(e.target.value) })}
                      className="input text-xs py-1 w-20"
                    />
                  ) : (
                    <span className="text-sm text-white/70">
                      {user.generations_used_this_month} / {user.generations_limit}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-1 flex-wrap">
                    {user.is_founding_member && (
                      <span className="badge-founding text-xs">⭐ Founding</span>
                    )}
                    {user.is_admin && (
                      <span className="badge-error text-xs">Admin</span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-xs text-white/40">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="p-4">
                  {editingUser === user.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveUser(user.id)}
                        disabled={saving}
                        className="btn-primary text-xs py-1 px-3"
                      >
                        {saving ? "..." : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditingUser(null); setEditValues({}); }}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(user)}
                      className="text-brand-400 hover:text-brand-300 text-sm transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-white/40 text-sm">
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-50"
            >
              ← Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= total}
              className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}