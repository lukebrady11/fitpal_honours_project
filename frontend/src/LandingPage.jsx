import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function LandingPage() {
  const nav = useNavigate();
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Top banner */}
      {!user ? (
        <div className="rounded-2xl border border-lime-400/20 bg-white/5 backdrop-blur p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-lime-300">
              Save unlimited plans
            </div>
            <div className="text-lg font-semibold text-white">
              Create a free account to keep your workouts and diet plans across devices
            </div>
            <div className="text-sm text-slate-300 mt-1">
              Guest mode works too, but saving is limited.
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/register"
              className="px-4 py-2.5 rounded-xl bg-lime-500 text-slate-950 font-medium hover:bg-lime-400 transition"
            >
              Register free
            </Link>
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 text-white font-medium hover:bg-white/15 transition backdrop-blur-sm"
            >
              Login
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-sm text-slate-400">Welcome back</div>
            <div className="text-lg font-semibold text-white">
              Ready to plan your week with FitPal?
            </div>
          </div>

          <button
            onClick={() => nav("/chat")}
            className="px-4 py-2.5 rounded-xl bg-lime-500 text-slate-950 font-medium hover:bg-lime-400 transition"
          >
            Go to Chat
          </button>
        </div>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-lg min-h-[420px]">
        {/* Background runner image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/runners-bg.jpg')" }}
        />

        {/* Navy overlay */}
        <div className="absolute inset-0 bg-slate-950/80" />

        {/* Content */}
        <div className="relative z-10 p-7 sm:p-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-lime-300 backdrop-blur-sm">
              AI lifestyle support • workouts • diet • planner
            </div>

            <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
              FitPal helps you build realistic weekly habits — without the fluff.
            </h1>

            <p className="mt-4 text-slate-200 leading-relaxed">
              Chat to FitPal for simple workout plans and meal ideas, then save them into your
              weekly planner. Designed to stay practical, supportive, and easy to stick with.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => nav("/chat")}
                className="px-5 py-3 rounded-2xl bg-lime-500 text-slate-950 font-semibold hover:bg-lime-400 transition"
              >
                Chat to FitPal
              </button>

              <button
                onClick={() => nav("/planner")}
                className="px-5 py-3 rounded-2xl border border-white/20 bg-white/10 text-white font-semibold hover:bg-white/15 transition backdrop-blur-sm"
              >
                View planner
              </button>
            </div>

            <div className="mt-4 text-xs text-slate-300">
              FitPal provides general lifestyle guidance only — not medical advice.
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeatureCard
          title="Workout planning"
          desc="Ask for a weekly plan and add it straight into your planner in one click."
          tag="Structured plans"
        />
        <FeatureCard
          title="Diet support"
          desc="Get simple meal ideas and save a daily plan to your diet page."
          tag="Low friction"
        />
        <FeatureCard
          title="Progress-friendly"
          desc="Start in guest mode, then create an account to save unlimited plans."
          tag="Flexible"
        />
      </div>

      {/* Final CTA */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xl font-semibold text-white">
            Ready to build your week?
          </div>
          <div className="text-sm text-slate-300 mt-1">
            Start with a simple question — FitPal handles the structure.
          </div>
        </div>

        <button
          onClick={() => nav("/chat")}
          className="px-5 py-3 rounded-2xl bg-lime-500 text-slate-950 font-semibold hover:bg-lime-400 transition"
        >
          Chat to FitPal
        </button>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, tag }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
      <div className="text-xs font-semibold text-lime-300">{tag}</div>
      <div className="mt-2 text-lg font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm text-slate-300 leading-relaxed">{desc}</div>
    </div>
  );
}