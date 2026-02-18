import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

const MEALS = new Set(["Breakfast", "Lunch", "Dinner", "Snacks"]);

function emptyDiet() {
  return { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
}

// GET /diet  -> returns grouped diet planner
router.get("/", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, meal, name, source_title
       FROM diet_items
       WHERE user_id = ?
       ORDER BY id ASC`
    )
    .all(req.user.id);

  const out = emptyDiet();
  for (const r of rows) {
    if (!MEALS.has(r.meal)) continue;
    out[r.meal].push({
      id: String(r.id),
      meal: r.meal,
      name: r.name,
      sourceTitle: r.source_title || "Diet plan",
    });
  }

  res.json({ diet: out });
});

// POST /diet/replace  body: { diet: {...} }  -> replaces all diet items
router.post("/replace", requireAuth, (req, res) => {
  const { diet } = req.body;

  if (!diet || typeof diet !== "object") {
    return res.status(400).json({ error: "diet must be an object" });
  }

  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM diet_items WHERE user_id = ?").run(req.user.id);

    const insert = db.prepare(
      `INSERT INTO diet_items (user_id, meal, name, source_title, created_at)
       VALUES (?, ?, ?, ?, ?)`
    );

    for (const meal of Object.keys(diet)) {
      if (!MEALS.has(meal)) continue;
      const items = Array.isArray(diet[meal]) ? diet[meal] : [];
      for (const it of items) {
        const name = typeof it?.name === "string" ? it.name : "Meal idea";
        const sourceTitle = typeof it?.sourceTitle === "string" ? it.sourceTitle : "Diet plan";
        insert.run(req.user.id, meal, name, sourceTitle, now);
      }
    }
  });

  tx();
  res.json({ ok: true });
});

export default router;
