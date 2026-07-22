import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItem =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition";
const navActive = "bg-ink-panelAlt text-text";
const navInactive = "text-text-muted hover:bg-ink-panelAlt/60 hover:text-text";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-ink-border bg-ink-panel px-3 py-5">
      <div className="mb-8 px-2">
        <span className="font-display text-lg font-semibold text-text">
          DocSense <span className="text-gold">AI</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${navItem} ${isActive ? navActive : navInactive}`
          }
        >
          Documents
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `${navItem} ${isActive ? navActive : navInactive}`
          }
        >
          Search all documents
        </NavLink>
        {user?.role === "admin" && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `${navItem} ${isActive ? navActive : navInactive}`
            }
          >
            Admin
          </NavLink>
        )}
      </nav>

      <div className="border-t border-ink-border pt-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium text-text">
            {user?.full_name || user?.email}
          </p>
          <p className="truncate text-xs text-text-faint">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-text-muted transition hover:bg-ink-panelAlt/60 hover:text-error"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}