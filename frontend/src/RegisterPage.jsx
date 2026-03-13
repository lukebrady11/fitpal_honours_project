import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      await register(email.trim(), password);
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
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-lime-400 to-slate-800 shadow-sm" />
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Create your account
              </h2>
              <p className="text-sm text-slate-400">
                Save plans, sync across devices, and remove guest limits.
              </p>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-300">Email</label>
              <input
                className="mt-1 w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-900/70 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-lime-300/20"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">Password</label>
              <input
                className="mt-1 w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-900/70 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-lime-300/20"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Use 8+ characters. Don’t reuse an important password.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={[
                "w-full px-4 py-3 rounded-xl text-sm font-medium shadow-sm transition",
                isLoading
                  ? "bg-lime-300 text-slate-900 cursor-not-allowed"
                  : "bg-lime-500 text-slate-950 hover:bg-lime-400 active:scale-[0.99]",
              ].join(" ")}
            >
              {isLoading ? "Creating account..." : "Register"}
            </button>
          </form>

          <div className="mt-4 text-sm text-slate-300">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-lime-300 hover:underline">
              Log in
            </Link>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            FitPal provides general lifestyle guidance only — not medical advice.
          </div>
        </div>
      </div>
    </div>
  );
}