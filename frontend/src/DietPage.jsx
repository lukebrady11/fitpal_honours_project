import { useState } from "react";
import { logEvent } from "./analytics";

const meals = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export default function DietPage({ dietApi }) {
  const { diet, setDiet, isLoggedIn } = dietApi;
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const clearAll = () => {
    setDiet({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] });
    logEvent(apiBase, { type: "diet_cleared", isLoggedIn });
  };

  const deleteItem = (meal, id) => {
    setDiet((prev) => ({
      ...prev,
      [meal]: (prev[meal] || []).filter((x) => x.id !== id),
    }));
    logEvent(apiBase, { type: "diet_item_deleted", isLoggedIn, meta: { meal } });
  };

  const moveItem = (fromMeal, toMeal, id) => {
    if (fromMeal === toMeal) return;

    setDiet((prev) => {
      const fromList = prev[fromMeal] || [];
      const moving = fromList.find((x) => x.id === id);
      if (!moving) return prev;

      const next = { ...prev };
      next[fromMeal] = fromList.filter((x) => x.id !== id);
      next[toMeal] = [...(prev[toMeal] || []), { ...moving, meal: toMeal }];
      return next;
    });

    logEvent(apiBase, {
      type: "diet_item_moved",
      isLoggedIn,
      meta: { fromMeal, toMeal },
    });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = (meal, id) => {
    setDiet((prev) => ({
      ...prev,
      [meal]: (prev[meal] || []).map((x) =>
        x.id === id ? { ...x, name: editName.trim() || x.name } : x
      ),
    }));

    logEvent(apiBase, { type: "diet_item_updated", isLoggedIn, meta: { meal } });
    cancelEdit();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">Diet Planner</h2>
          <p className="text-sm text-slate-400">
            Save meal ideas from Chat and organise them across the day.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {meals.map((meal) => (
              <div
                key={meal}
                className="rounded-2xl border border-white/10 bg-slate-900/40 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{meal}</div>
                  <span className="text-[11px] text-slate-400">
                    {diet[meal]?.length || 0}
                  </span>
                </div>

                {diet[meal]?.length ? (
                  <div className="mt-3 flex flex-col gap-2">
                    {diet[meal].map((x) => {
                      const isEditing = editingId === x.id;

                      return (
                        <div
                          key={x.id}
                          className="rounded-2xl border border-lime-400/20 bg-lime-500/10 p-3"
                        >
                          {!isEditing ? (
                            <>
                              <div className="text-sm font-semibold text-white">{x.name}</div>
                              <div className="mt-1 text-xs text-slate-400">
                                From: {x.sourceTitle || "Diet plan"}
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => startEdit(x)}
                                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition text-xs font-medium"
                                >
                                  Edit
                                </button>

                                <select
                                  className="px-3 py-2 rounded-xl border border-white/10 bg-slate-900/80 text-xs text-white"
                                  value={meal}
                                  onChange={(e) => moveItem(meal, e.target.value, x.id)}
                                >
                                  {meals.map((m) => (
                                    <option key={m} value={m}>
                                      Move to {m}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  onClick={() => deleteItem(meal, x.id)}
                                  className="px-3 py-2 rounded-xl border border-red-400/20 bg-red-500/10 hover:bg-red-500/20 transition text-xs font-medium text-red-300"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <input
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-900/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-lime-300/20"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Meal suggestion"
                              />

                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  onClick={() => saveEdit(meal, x.id)}
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
                  <div className="mt-3 text-sm text-slate-500">No items</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Tip: In Chat, ask for a “3-day meal plan”, then click “Add to diet planner”.
          </div>
        </div>
      </div>
    </div>
  );
}