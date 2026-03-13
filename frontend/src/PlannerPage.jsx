import { useState } from "react";
import { logEvent } from "./analytics";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PlannerPage({ plannerApi }) {
  const { planner, setPlanner, isLoggedIn } = plannerApi;
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editTime, setEditTime] = useState("");

  const clearAll = () => {
    setPlanner({
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: [],
    });
    logEvent(apiBase, { type: "planner_cleared", isLoggedIn });
  };

  const deleteItem = (day, id) => {
    setPlanner((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((x) => x.id !== id),
    }));
    logEvent(apiBase, { type: "planner_session_deleted", isLoggedIn, meta: { day } });
  };

  const moveItem = (fromDay, toDay, id) => {
    if (fromDay === toDay) return;

    setPlanner((prev) => {
      const fromList = prev[fromDay] || [];
      const moving = fromList.find((x) => x.id === id);
      if (!moving) return prev;

      const next = { ...prev };
      next[fromDay] = fromList.filter((x) => x.id !== id);
      next[toDay] = [...(prev[toDay] || []), { ...moving, day: toDay }];
      return next;
    });

    logEvent(apiBase, {
      type: "planner_session_moved",
      isLoggedIn,
      meta: { fromDay, toDay },
    });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name || "");
    setEditTime(item.time || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditTime("");
  };

  const saveEdit = (day, id) => {
    setPlanner((prev) => ({
      ...prev,
      [day]: (prev[day] || []).map((x) =>
        x.id === id
          ? {
              ...x,
              name: editName.trim() || x.name,
              time: editTime.trim(),
            }
          : x
      ),
    }));

    logEvent(apiBase, { type: "planner_session_updated", isLoggedIn, meta: { day } });
    cancelEdit();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">This Week’s Planner</h2>
          <p className="text-sm text-slate-400">
            Edit sessions, move them to another day, or delete them.
          </p>
        </div>

        <button
          onClick={clearAll}
          className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition text-sm font-medium"
        >
          Clear all
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm">
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {days.map((day) => (
              <div
                key={day}
                className="rounded-2xl border border-white/10 bg-slate-900/40 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{day}</div>
                  <span className="text-[11px] text-slate-400">
                    {planner[day]?.length || 0}
                  </span>
                </div>

                {planner[day]?.length ? (
                  <div className="mt-3 flex flex-col gap-2">
                    {planner[day].map((s) => {
                      const isEditing = editingId === s.id;

                      return (
                        <div
                          key={s.id}
                          className="w-full max-w-full box-border overflow-hidden break-words rounded-2xl border border-lime-400/20 bg-lime-500/10 p-3"
                        >
                          {!isEditing ? (
                            <>
                              <div className="text-sm font-semibold text-white">
                                {s.time ? `${s.time} — ` : ""}
                                {s.name}
                              </div>
                              <div className="mt-1 text-xs text-slate-400">
                                From: {s.sourceTitle || "Plan"}
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => startEdit(s)}
                                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition text-xs font-medium"
                                >
                                  Edit
                                </button>

                                <select
                                  className="w-full max-w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-900/80 text-xs text-white"
                                  value={day}
                                  onChange={(e) => moveItem(day, e.target.value, s.id)}
                                >
                                  {days.map((d) => (
                                    <option key={d} value={d}>
                                      Move to {d}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  onClick={() => deleteItem(day, s.id)}
                                  className="px-3 py-2 rounded-xl border border-red-400/20 bg-red-500/10 hover:bg-red-500/20 transition text-xs font-medium text-red-300"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="space-y-2">
                                <input
                                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-900/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-lime-300/20"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Workout name"
                                />
                                <input
                                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-900/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-lime-300/20"
                                  value={editTime}
                                  onChange={(e) => setEditTime(e.target.value)}
                                  placeholder="Time (HH:MM)"
                                />
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  onClick={() => saveEdit(day, s.id)}
                                  className="px-3 py-2 rounded-xl bg-lime-500 text-slate-950 hover:bg-lime-400 active:scale-[0.99] transition text-xs font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition text-xs font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-slate-500">No sessions</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Tip: Ask FitPal in Chat for a weekly plan, then click “Add to planner”.
          </div>
        </div>
      </div>
    </div>
  );
}