import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function LandingPage() {
  const nav = useNavigate();
  const { user } = useAuth();

  return (
    <div className="space-y-10">
      {/* Banner (below nav) */}
      {!user ? (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-purple-700">
              Save unlimited plans
            </div>
            <div className="text-lg font-semibold text-slate-900">
              Create a free account to keep your workouts + diet plans across devices
            </div>
            <div className="text-sm text-slate-600 mt-1">
              Guest mode works too — but saving is limited.
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/register"
              className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition"
            >
              Register free
            </Link>
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-medium hover:bg-slate-50 transition"
            >
              Login
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">Welcome back</div>
            <div className="text-lg font-semibold text-slate-900">
              Ready to plan your week with FitPal?
            </div>
          </div>

          <button
            onClick={() => nav("/chat")}
            className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition"
          >
            Go to Chat
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
            AI lifestyle support • workouts + diet • planner
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            FitPal helps you build realistic weekly habits — without the fluff.
          </h1>

          <p className="mt-3 text-slate-600 leading-relaxed">
            Chat to FitPal for simple workout plans and meal ideas, then save them into your
            weekly planner. Designed to stay practical and non-judgmental.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => nav("/chat")}
              className="px-5 py-3 rounded-2xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
            >
              Chat to FitPal
            </button>

            <button
              onClick={() => nav("/planner")}
              className="px-5 py-3 rounded-2xl border border-slate-200 bg-white font-semibold hover:bg-slate-50 transition"
            >
              View planner
            </button>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            FitPal provides general lifestyle guidance only — not medical advice.
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeatureCard
          title="Workout planning"
          desc="Ask for a weekly plan and add it to your planner in one click."
          tag="Structured plans"
        />
        <FeatureCard
          title="Diet support"
          desc="Get simple meal ideas and save a daily plan to your diet page."
          tag="Low friction"
        />
        <FeatureCard
          title="Progress-friendly"
          desc="Guest mode works, then upgrade to an account to save unlimited plans."
          tag="Flexible"
        />
      </div>

      {/* Final CTA */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-purple-50 p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xl font-semibold text-slate-900">
            Ready to build your week?
          </div>
          <div className="text-sm text-slate-600 mt-1">
            Start with a simple question — FitPal will do the structure.
          </div>
        </div>

        <button
          onClick={() => nav("/chat")}
          className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
        >
          Chat to FitPal
        </button>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, tag }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold text-purple-700">{tag}</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</div>
    </div>
  );
}
