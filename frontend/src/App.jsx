// frontend/src/App.jsx
import { Routes, Route, NavLink } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import ChatPage from "./ChatPage.jsx";
import PlannerPage from "./PlannerPage.jsx";
import DietPage from "./DietPage.jsx";
import LoginPage from "./LoginPage.jsx";
import RegisterPage from "./RegisterPage.jsx";
import EvaluationPage from "./EvaluationPage.jsx";
import LandingPage from "./LandingPage.jsx";
import { useAuth } from "./AuthContext.jsx";

function TabLink({ to, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "px-3 py-2 rounded-xl text-sm font-medium border transition",
          "border-[rgb(var(--border))] bg-white hover:bg-slate-50",
          isActive ? "bg-[rgb(var(--surface-2))] border-purple-200 text-purple-700" : "text-slate-700",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

export default function App() {
  const { user, loading, logout } = useAuth();
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  // ---------- workout planner ----------
  const emptyPlanner = useMemo(
    () => ({
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: [],
    }),
    []
  );

  const [planner, setPlanner] = useState(emptyPlanner);
  const workoutSaveTimerRef = useRef(null);
  const GUEST_KEY = "fitpal_guest_planner_v1";

  // Guest load planner
  useEffect(() => {
    if (user) return;
    try {
      const saved = localStorage.getItem(GUEST_KEY);
      if (saved) setPlanner(JSON.parse(saved));
    } catch {}
  }, [user]);

  // Guest save planner
  useEffect(() => {
    if (user) return;
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(planner));
    } catch {}
  }, [planner, user]);

  // Import guest planner on login
  useEffect(() => {
    const maybeImport = async () => {
      if (!user) return;

      let guest = null;
      try {
        const raw = localStorage.getItem(GUEST_KEY);
        if (raw) guest = JSON.parse(raw);
      } catch {}

      const hasGuest =
        guest && Object.values(guest).some((arr) => Array.isArray(arr) && arr.length > 0);

      if (!hasGuest) return;

      const doImport = window.confirm(
        "You have a guest workout planner saved on this device. Import it into your account?"
      );
      if (!doImport) return;

      await fetch(`${apiBase}/planner/replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planner: guest }),
      });

      localStorage.removeItem(GUEST_KEY);

      const res = await fetch(`${apiBase}/planner`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data?.planner) setPlanner(data.planner);
    };

    maybeImport();
  }, [user, apiBase]);

  // Load planner for logged-in
  useEffect(() => {
    const loadPlanner = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${apiBase}/planner`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data?.planner) setPlanner(data.planner);
      } catch {}
    };
    loadPlanner();
  }, [user, apiBase]);

  // Autosave planner for logged-in (debounced)
  useEffect(() => {
    if (!user) return;

    if (workoutSaveTimerRef.current) clearTimeout(workoutSaveTimerRef.current);

    workoutSaveTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`${apiBase}/planner/replace`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ planner }),
        });
      } catch {}
    }, 600);

    return () => {
      if (workoutSaveTimerRef.current) clearTimeout(workoutSaveTimerRef.current);
    };
  }, [planner, user, apiBase]);

  const addPlanDraftToPlanner = (planDraft) => {
    if (!planDraft || !Array.isArray(planDraft.items)) return { ok: false };

    setPlanner((prev) => {
      const next = { ...prev };
      for (const item of planDraft.items) {
        if (!item?.day || !next[item.day]) continue;

        next[item.day] = [
          ...next[item.day],
          {
            id: crypto.randomUUID(),
            day: item.day,
            time: item.time || "",
            name: item.name || "Workout",
            sourceTitle: planDraft.title || "Workout plan",
          },
        ];
      }
      return next;
    });

    return { ok: true };
  };

  const plannerApi = useMemo(
    () => ({
      planner,
      setPlanner,
      addPlanDraftToPlanner,
      emptyPlanner,
      isLoggedIn: !!user,
    }),
    [planner, emptyPlanner, user]
  );

  // ---------- diet planner ----------
  const emptyDiet = useMemo(
    () => ({
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snacks: [],
    }),
    []
  );

  const [diet, setDiet] = useState(emptyDiet);
  const dietSaveTimerRef = useRef(null);
  const DIET_GUEST_KEY = "fitpal_guest_diet_v1";

  // Guest load diet
  useEffect(() => {
    if (user) return;
    try {
      const saved = localStorage.getItem(DIET_GUEST_KEY);
      if (saved) setDiet(JSON.parse(saved));
    } catch {}
  }, [user]);

  // Guest save diet
  useEffect(() => {
    if (user) return;
    try {
      localStorage.setItem(DIET_GUEST_KEY, JSON.stringify(diet));
    } catch {}
  }, [diet, user]);

  // Import guest diet on login
  useEffect(() => {
    const maybeImport = async () => {
      if (!user) return;

      let guest = null;
      try {
        const raw = localStorage.getItem(DIET_GUEST_KEY);
        if (raw) guest = JSON.parse(raw);
      } catch {}

      const hasGuest =
        guest && Object.values(guest).some((arr) => Array.isArray(arr) && arr.length > 0);

      if (!hasGuest) return;

      const doImport = window.confirm(
        "You have a guest diet planner saved on this device. Import it into your account?"
      );
      if (!doImport) return;

      await fetch(`${apiBase}/diet/replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ diet: guest }),
      });

      localStorage.removeItem(DIET_GUEST_KEY);

      const res = await fetch(`${apiBase}/diet`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data?.diet) setDiet(data.diet);
    };

    maybeImport();
  }, [user, apiBase]);

  // Load diet for logged-in
  useEffect(() => {
    const loadDiet = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${apiBase}/diet`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data?.diet) setDiet(data.diet);
      } catch {}
    };
    loadDiet();
  }, [user, apiBase]);

  // Autosave diet for logged-in (debounced)
  useEffect(() => {
    if (!user) return;

    if (dietSaveTimerRef.current) clearTimeout(dietSaveTimerRef.current);

    dietSaveTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`${apiBase}/diet/replace`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ diet }),
        });
      } catch {}
    }, 600);

    return () => {
      if (dietSaveTimerRef.current) clearTimeout(dietSaveTimerRef.current);
    };
  }, [diet, user, apiBase]);

  const addDietDraftToPlanner = (dietDraft) => {
    if (!dietDraft || !Array.isArray(dietDraft.items)) return { ok: false };

    setDiet((prev) => {
      const next = { ...prev };
      for (const it of dietDraft.items) {
        if (!it?.meal || !next[it.meal]) continue;

        next[it.meal] = [
          ...next[it.meal],
          {
            id: crypto.randomUUID(),
            meal: it.meal,
            name: it.name || "Meal idea",
            sourceTitle: dietDraft.title || "Diet plan",
          },
        ];
      }
      return next;
    });

    return { ok: true };
  };

  const dietApi = useMemo(
    () => ({
      diet,
      setDiet,
      addDietDraftToPlanner,
      emptyDiet,
      isLoggedIn: !!user,
    }),
    [diet, emptyDiet, user]
  );

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/75 backdrop-blur border-b border-[rgb(var(--border))]">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-sm" />
            <div>
              <div className="font-semibold leading-tight">FitPal</div>
              <div className="text-xs text-[rgb(var(--muted))]">
                Fitness • Diet • Planning
              </div>
            </div>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2">
            {loading ? (
              <span className="text-sm text-[rgb(var(--muted))]">Checking session…</span>
            ) : user ? (
              <>
                <span className="text-xs px-3 py-2 rounded-xl border border-[rgb(var(--border))] bg-white text-slate-700">
                  {user.email}
                  {user.isAdmin ? " • admin" : ""}
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-xl text-sm font-medium border border-[rgb(var(--border))] bg-white hover:bg-slate-50 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    [
                      "px-3 py-2 rounded-xl text-sm font-medium border transition",
                      "border-[rgb(var(--border))] bg-white hover:bg-slate-50",
                      isActive ? "bg-[rgb(var(--surface-2))] border-purple-200 text-purple-700" : "text-slate-700",
                    ].join(" ")
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    [
                      "px-3 py-2 rounded-xl text-sm font-medium border transition",
                      "border-[rgb(var(--border))] bg-white hover:bg-slate-50",
                      isActive ? "bg-[rgb(var(--surface-2))] border-purple-200 text-purple-700" : "text-slate-700",
                    ].join(" ")
                  }
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-5xl px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            <TabLink to="/" end>
              Home
            </TabLink>
            <TabLink to="/chat">Chat</TabLink>
            <TabLink to="/planner">Planner</TabLink>
            <TabLink to="/diet">Diet</TabLink>
            {user?.isAdmin ? <TabLink to="/evaluation">Evaluation</TabLink> : null}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatPage plannerApi={plannerApi} dietApi={dietApi} />} />
          <Route path="/planner" element={<PlannerPage plannerApi={plannerApi} />} />
          <Route path="/diet" element={<DietPage dietApi={dietApi} />} />
          <Route path="/evaluation" element={<EvaluationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>

        {/* small footer */}
        <div className="mt-10 text-xs text-[rgb(var(--muted))]">
          FitPal provides general lifestyle guidance only — not medical advice.
        </div>
      </main>
    </div>
  );
}
