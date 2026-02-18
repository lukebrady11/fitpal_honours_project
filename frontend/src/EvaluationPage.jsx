import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";

const FALLBACK_ENDPOINTS = ["/events/summary"];

function prettyType(t) {
  return String(t || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function normalizeCounts(raw) {
  // { totals: {type:n} } or { counts: {type:n} }
  if (raw?.totals && typeof raw.totals === "object" && !Array.isArray(raw.totals)) {
    return raw.totals;
  }
  if (raw?.counts && typeof raw.counts === "object" && !Array.isArray(raw.counts)) {
    return raw.counts;
  }

  // ✅ YOUR BACKEND SHAPE: { byType: [ { type, count }, ... ] }
  if (Array.isArray(raw?.byType)) {
    const out = {};
    for (const r of raw.byType) {
      const type = r?.type || r?.event_type || r?.name;
      const count = r?.count ?? r?.total ?? r?.n ?? r?.value;
      if (type) out[type] = Number(count) || 0;
    }
    return out;
  }

  // If byType is already a map
  if (raw?.byType && typeof raw.byType === "object" && !Array.isArray(raw.byType)) {
    return raw.byType;
  }

  // Other possible rows arrays
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

function normalizeRecent(raw) {
  const r = raw?.recent || raw?.latest || raw?.events || raw?.items;
  return Array.isArray(r) ? r : [];
}

export default function EvaluationPage() {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const { user, loading } = useAuth();

  const [status, setStatus] = useState("loading"); // loading | ok | error
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
        const res = await fetch(url, { method: "GET", credentials: "include" });
        if (!res.ok) continue;

        const json = await res.json().catch(() => null);
        if (!json) continue;

        setUsedEndpoint(path);
        setRaw(json);
        setStatus("ok");
        return;
      } catch {
        // keep trying
      }
    }

    setStatus("error");
    setError(`Could not load evaluation data. Tried:\n- ${tried.join("\n- ")}`);
  };

  useEffect(() => {
    if (loading) return;
    if (!user?.isAdmin) return;
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.isAdmin]);

  const counts = useMemo(() => normalizeCounts(raw), [raw]);
  const recent = useMemo(() => normalizeRecent(raw).slice(0, 10), [raw]);

  const totalEvents = useMemo(() => {
    return Object.values(counts).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [counts]);

  const get = (k) => Number(counts?.[k] || 0);

  // Build sorted rows for table
  const countRows = useMemo(() => {
    const entries = Object.entries(counts || {});
    entries.sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));
    return entries;
  }, [counts]);

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading…</div>;
  }

  if (!user?.isAdmin) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Evaluation</h2>
        <p className="mt-2 text-sm text-slate-500">Admin access required.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="text-sm font-medium text-red-700">{error}</div>
        </div>

        <button
          onClick={fetchSummary}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Evaluation Dashboard</h2>

        <button
          onClick={fetchSummary}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="text-xs text-slate-500">
        Source: <span className="font-mono">{usedEndpoint || "(unknown)"}</span>
      </div>

      {/* KPI Cards (uses YOUR keys) */}
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

      {/* Event Counts Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Event Type</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-700">Count</th>
              </tr>
            </thead>
            <tbody>
              {countRows.length ? (
                countRows.map(([type, count]) => (
                  <tr key={type} className="border-b border-slate-200">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{prettyType(type)}</div>
                      <div className="text-xs text-slate-400 font-mono">{type}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{Number(count) || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-sm text-slate-500">
                    No counts found in response.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Events (optional; your backend may not return these) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <h3 className="font-semibold mb-3">Recent Events</h3>

        {recent.length ? (
          <div className="space-y-2">
            {recent.map((e, idx) => (
              <div key={e.id || idx} className="rounded-xl border border-slate-200 p-3">
                <div className="flex justify-between items-center gap-3">
                  <div className="text-sm font-medium">{prettyType(e.type)}</div>
                  <div className="text-xs text-slate-400">
                    {formatDate(e.created_at || e.createdAt || e.time)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">No recent events.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value || 0}</div>
    </div>
  );
}
