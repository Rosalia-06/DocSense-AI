import { useEffect, useState } from "react";
import { listAllUsers, forceDeleteDocument } from "../../api/admin";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [docId, setDocId] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    listAllUsers()
      .then(setUsers)
      .catch(() => setError("Couldn't load users."))
      .finally(() => setLoading(false));
  }, []);

  const handleForceDelete = async (e) => {
    e.preventDefault();
    const trimmed = docId.trim();
    if (!trimmed) return;
    if (!window.confirm(`Force-delete document "${trimmed}"? This can't be undone.`)) return;

    setDeleteMsg("");
    setDeleteError("");
    setDeleting(true);
    try {
      await forceDeleteDocument(trimmed);
      setDeleteMsg(`Document "${trimmed}" deleted.`);
      setDocId("");
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) setDeleteError("No document found with that ID.");
      else if (status === 403) setDeleteError("You don't have permission to do that.");
      else setDeleteError("Couldn't delete that document. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="font-display text-2xl font-semibold text-text">Admin</h1>
      <p className="mt-1 text-sm text-text-muted">
        Manage users and force-remove documents across all accounts.
      </p>

      {/* Force delete tool */}
      <div className="mt-8 rounded-xl border border-ink-border bg-ink-panel p-5">
        <h2 className="text-sm font-semibold text-text">Force-delete a document</h2>
        <p className="mt-1 text-xs text-text-faint">
          Paste a document ID (copy it from a user's document card URL, e.g.{" "}
          <span className="font-mono">/documents/&lt;id&gt;</span>) to remove it.
        </p>
        <form onSubmit={handleForceDelete} className="mt-3 flex gap-2">
          <input
            type="text"
            value={docId}
            onChange={(e) => setDocId(e.target.value)}
            placeholder="Document ID"
            className="flex-1 rounded-lg border border-ink-border bg-ink-panelAlt px-3.5 py-2.5 font-mono text-sm text-text placeholder:text-text-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <button
            type="submit"
            disabled={deleting || !docId.trim()}
            className="rounded-lg border border-error/40 px-4 py-2.5 text-sm font-medium text-error transition hover:bg-error/10 disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Force delete"}
          </button>
        </form>
        {deleteMsg && <p className="mt-2 text-sm text-success">{deleteMsg}</p>}
        {deleteError && <p className="mt-2 text-sm text-error">{deleteError}</p>}
      </div>

      {/* Users table */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-text">All users</h2>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-ink-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-panelAlt text-xs uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-ink-border bg-ink-panel">
                    <td className="px-4 py-3 text-text">{u.full_name || "—"}</td>
                    <td className="px-4 py-3 text-text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-gold-soft text-gold"
                            : "bg-ink-panelAlt text-text-muted"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}