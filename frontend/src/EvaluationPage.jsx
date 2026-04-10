import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";

const FALLBACK_ENDPOINTS = ["/events/summary"];

function prettyType(t) {
  return String(t || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeCounts(raw) {
  if (raw?.totals && typeof raw.totals === "object" && !Array.isArray(raw.totals)) {
    return raw.totals;
  }

  if (raw?.counts && typeof raw.counts === "object" && !Array.isArray(raw.counts)) {
    return raw.counts;
  }

  if (Array.isArray(raw?.byType)) {
    const out = {};
    for (const r of raw.byType) {
      const type = r?.type || r?.event_type || r?.name;
      const count = r?.count ?? r?.total ?? r?.n ?? r?.value;
      if (type) out[type] = Number(count) || 0;
    }
    return out;
  }

  if (raw?.byType && typeof raw.byType === "object" && !Array.isArray(raw.byType)) {
    return raw.byType;
  }

  const rows = raw?.rows || raw?.eventsByType || raw?.summary;
  if (Array.isArray(rows)) {
    const out = {};
    for (const r of rows) {
      const type = r?.type || r?.event_type || r?.name;
      const count = r?.count ?? r?.total ?? r?.n ?? r?.value;
      if (type) out[type] = Number(count) || 0;
    }
    return out;
  }

  return {};
}

export default function EvaluationPage() {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const { user, loading } = useAuth();

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [raw, setRaw] = useState(null);
  const [usedEndpoint, setUsedEndpoint] = useState("");

  const fetchSummary = async () => {
    setStatus("loading");
    setError("");
    setRaw(null);
    setUsedEndpoint("");

    const tried = [];

    for (const path of FALLBACK_ENDPOINTS) {
      const url = `${apiBase}${path}`;
      tried.push(url);

      try {
        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) continue;

        const json = await res.json().catch(() => null);
        if (!json) continue;

        setUsedEndpoint(path);
        setRaw(json);
        setStatus("ok");
        return;
      } catch {
        
      }
    }

    setStatus("error");
    setError(`Could not load evaluation data. Tried:\n- ${tried.join("\n- ")}`);
  };

  useEffect(() => {
    if (loading) return;
    if (!user?.isAdmin) return;
    fetchSummary();
    
  }, [loading, user?.isAdmin]);

  const counts = useMemo(() => normalizeCounts(raw), [raw]);

  const totalEvents = useMemo(() => {
    return Object.values(counts).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [counts]);

  const countRows = useMemo(() => {
    const entries = Object.entries(counts || {});
    entries.sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));
    return entries;
  }, [counts]);

  const get = (k) => Number(counts?.[k] || 0);

  if (loading) {
    return <div className="p-6 text-sm text-slate-400">Loading…</div>;
  }

  if (!user?.isAdmin) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-white">Evaluation</h2>
        <p className="mt-2 text-sm text-slate-400">Admin access required.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 backdrop-blur-md p-6 shadow-sm">
          <div className="text-sm font-medium text-red-300">{error}</div>
        </div>

        <button
          onClick={fetchSummary}
          className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-sm">
        <div className="text-sm text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Evaluation Dashboard
        </h2>

        <button
          onClick={fetchSummary}
          className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="text-xs text-slate-500">
        Source: <span className="font-mono">{usedEndpoint || "(unknown)"}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Events" value={totalEvents} />
        <StatCard title="Chat Messages" value={get("chat_message_sent")} />
        <StatCard title="Workout Plans Generated" value={get("plan_generated")} />
        <StatCard title="Workout Plans Saved" value={get("plan_saved")} />
        <StatCard title="Diet Plans Generated" value={get("diet_plan_generated")} />
        <StatCard title="Diet Plans Saved" value={get("diet_plan_saved")} />
        <StatCard title="Safety Triage" value={get("safety_triage_triggered")} />
        <StatCard title="Guest Limit Hits" value={get("guest_limit_hit")} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-300">
                  Event Type
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-300">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {countRows.length ? (
                countRows.map(([type, count]) => (
                  <tr key={type} className="border-b border-white/10">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{prettyType(type)}</div>
                      <div className="text-xs text-slate-500 font-mono">{type}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-100">
                      {Number(count) || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-sm text-slate-400">
                    No counts found in response.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm p-4">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-white">
        {value || 0}
      </div>
    </div>
  );
}