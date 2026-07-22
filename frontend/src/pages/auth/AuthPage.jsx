import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, getCurrentUser } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : form;
      const authFn = mode === "login" ? loginUser : registerUser;
      const data = await authFn(payload);
      const token = data.access_token || data.token;
      localStorage.setItem("docsense_token", token);
      const userData = await getCurrentUser();
      login(token, userData);
      navigate("/dashboard");
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) setError("Too many attempts. Slow down and try again shortly.");
      else if (status === 401) setError("Invalid email or password.");
      else if (status === 400) setError(err.response?.data?.detail || "That email is already registered.");
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-ink-bg">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink-panel p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #D4A24C 0px, #D4A24C 1px, transparent 1px, transparent 32px)",
          }}
        />
        <div className="relative z-10">
          <span className="font-display text-2xl font-semibold tracking-tight text-text">
            DocSense <span className="text-gold">AI</span>
          </span>
        </div>
        <div className="relative z-10 max-w-md">
          <p className="font-display text-3xl font-medium leading-snug text-text">
            Every answer, traced back to the page it came from.
          </p>
          <p className="mt-4 text-sm text-text-muted">
            Upload contracts, reports, and decks. Ask questions in plain
            language. Get answers with citations you can verify in one click.
          </p>
        </div>
        <p className="relative z-10 text-xs text-text-faint">
          Document intelligence, grounded in evidence.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-2xl font-semibold text-text">
              DocSense <span className="text-gold">AI</span>
            </span>
          </div>

          <h1 className="font-display text-2xl font-semibold text-text">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {mode === "login"
              ? "Sign in to access your documents."
              : "Start asking questions of your documents."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  Full name
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={form.full_name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-ink-border bg-ink-panel px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="Jane Doe"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-ink-border bg-ink-panel px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-ink-border bg-ink-panel px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-error/30 bg-error/10 px-3.5 py-2.5 text-sm text-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-gold py-2.5 text-sm font-semibold text-ink-bg transition hover:bg-gold/90 disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="font-medium text-gold hover:underline"
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}