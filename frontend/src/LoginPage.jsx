import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      nav("/");
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[65vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-white shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-sm" />
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-sm text-[rgb(var(--muted))]">
                Log in to save unlimited plans across devices.
              </p>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                className="mt-1 w-full px-4 py-3 rounded-xl border border-[rgb(var(--border))] bg-white text-sm focus:outline-none focus:ring-4 focus:ring-purple-200"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                className="mt-1 w-full px-4 py-3 rounded-xl border border-[rgb(var(--border))] bg-white text-sm focus:outline-none focus:ring-4 focus:ring-purple-200"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Minimum 8 characters.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={[
                "w-full px-4 py-3 rounded-xl text-sm font-medium shadow-sm transition",
                isLoading
                  ? "bg-purple-300 text-white cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.99]",
              ].join(" ")}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="mt-4 text-sm text-slate-700">
            Don’t have an account?{" "}
            <Link to="/register" className="font-medium text-purple-700 hover:underline">
              Register
            </Link>
          </div>

          <div className="mt-3 text-xs text-[rgb(var(--muted))]">
            You can also use guest mode without logging in.
          </div>
        </div>
      </div>
    </div>
  );
}
