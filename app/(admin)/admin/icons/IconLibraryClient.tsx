"use client";

import { useState } from "react";

interface Icon {
  id: string;
  category: string;
  name: string;
  author: string;
  tags: string[];
  is_active: boolean;
}

interface Props {
  icons: Icon[];
}

export function IconLibraryClient({ icons: initialIcons }: Props) {
  const [icons, setIcons] = useState<Icon[]>(initialIcons);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIcon, setNewIcon] = useState({ category: "game", name: "", author: "", tags: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = icons.filter(icon => {
    const matchSearch = icon.name.toLowerCase().includes(search.toLowerCase()) ||
      icon.author.toLowerCase().includes(search.toLowerCase()) ||
      icon.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = filterCategory === "all" || icon.category === filterCategory;
    const matchActive = filterActive === "all" ||
      (filterActive === "active" && icon.is_active) ||
      (filterActive === "inactive" && !icon.is_active);
    return matchSearch && matchCategory && matchActive;
  });

  const categories = ["all", ...Array.from(new Set(icons.map(i => i.category)))];

  async function toggleActive(icon: Icon) {
    setLoading(icon.id);
    try {
      const res = await fetch("/api/admin/icons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: icon.id, is_active: !icon.is_active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setIcons(prev => prev.map(i => i.id === icon.id ? { ...i, is_active: !i.is_active } : i));
      setSuccess(`${icon.name} ${!icon.is_active ? "activated" : "deactivated"}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Failed to update icon");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(null);
    }
  }

  async function deleteIcon(icon: Icon) {
    if (!confirm(`Delete ${icon.name}? This cannot be undone.`)) return;
    setLoading(icon.id);
    try {
      const res = await fetch(`/api/admin/icons?id=${icon.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setIcons(prev => prev.filter(i => i.id !== icon.id));
      setSuccess(`${icon.name} deleted`);
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Failed to delete icon");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(null);
    }
  }

  async function addIcon() {
    if (!newIcon.name || !newIcon.author) {
      setError("Name and author are required");
      return;
    }
    setLoading("add");
    try {
      const res = await fetch("/api/admin/icons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newIcon.category,
          name: newIcon.name.trim(),
          author: newIcon.author.trim(),
          tags: newIcon.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      const { icon } = await res.json() as { icon: Icon };
      setIcons(prev => [...prev, icon].sort((a, b) => a.name.localeCompare(b.name)));
      setNewIcon({ category: "game", name: "", author: "", tags: "" });
      setShowAddModal(false);
      setSuccess(`${icon.name} added`);
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Failed to add icon — check name/author are correct");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(null);
    }
  }

  const previewUrl = (name: string, author: string) =>
    `https://game-icons.net/icons/ffffff/000000/1x1/${author}/${name}.svg`;

  const activeCount = icons.filter(i => i.is_active).length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{icons.length}</p>
          <p className="text-white/50 text-sm">Total Icons</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-400">{activeCount}</p>
          <p className="text-white/50 text-sm">Active</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-white/40">{icons.length - activeCount}</p>
          <p className="text-white/50 text-sm">Inactive</p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-300 text-sm px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input flex-1 min-w-48"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="input w-32"
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={e => setFilterActive(e.target.value)}
          className="input w-32"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm px-4 py-2">
          + Add Icon
        </button>
      </div>

      <p className="text-white/40 text-sm mb-4">{filtered.length} icons</p>

      {/* Icons grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map(icon => (
          <div
            key={icon.id}
            className={`card p-3 flex flex-col items-center gap-2 ${!icon.is_active ? "opacity-40" : ""}`}
          >
            <img
              src={previewUrl(icon.name, icon.author)}
              width={48}
              height={48}
              alt={icon.name}
              className="rounded"
              onError={e => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
            />
            <p className="text-xs font-medium text-white text-center leading-tight">{icon.name}</p>
            <p className="text-xs text-white/40">{icon.author}</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {icon.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs bg-surface-200 text-white/50 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => toggleActive(icon)}
                disabled={loading === icon.id}
                className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                  icon.is_active
                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    : "bg-surface-200 text-white/40 hover:bg-surface-300"
                }`}
              >
                {loading === icon.id ? "..." : icon.is_active ? "Active" : "Inactive"}
              </button>
              <button
                onClick={() => deleteIcon(icon)}
                disabled={loading === icon.id}
                className="text-xs px-2 py-1 rounded bg-error/20 text-red-400 hover:bg-error/30 transition-colors"
              >
                Del
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h2 className="section-title mb-6">Add Icon</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Category</label>
                <select
                  value={newIcon.category}
                  onChange={e => setNewIcon(p => ({ ...p, category: e.target.value }))}
                  className="input w-full"
                >
                  <option value="game">game</option>
                  <option value="mobile">mobile</option>
                  <option value="web">web</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Icon name</label>
                <input
                  type="text"
                  placeholder="e.g. broadsword"
                  value={newIcon.name}
                  onChange={e => setNewIcon(p => ({ ...p, name: e.target.value }))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Author</label>
                <input
                  type="text"
                  placeholder="e.g. lorc"
                  value={newIcon.author}
                  onChange={e => setNewIcon(p => ({ ...p, author: e.target.value }))}
                  className="input w-full"
                />
                {newIcon.name && newIcon.author && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={previewUrl(newIcon.name, newIcon.author)}
                      width={32}
                      height={32}
                      alt="preview"
                      onError={e => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                    />
                    <span className="text-xs text-white/40">Live preview</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. fantasy, rpg, weapon"
                  value={newIcon.tags}
                  onChange={e => setNewIcon(p => ({ ...p, tags: e.target.value }))}
                  className="input w-full"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={addIcon}
                disabled={loading === "add"}
                className="btn-primary flex-1"
              >
                {loading === "add" ? "Adding..." : "Add Icon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}