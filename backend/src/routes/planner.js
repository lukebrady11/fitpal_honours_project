import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

// Get all planner items for the logged-in user
router.get("/", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      "SELECT id, day, time, name, source_title AS sourceTitle FROM planner_items WHERE user_id = ? ORDER BY id DESC"
    )
    .all(req.user.id);

  // Convert to { Mon: [...], Tue: [...] } structure
  const planner = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
  for (const r of rows) {
    if (!planner[r.day]) continue;
    planner[r.day].push({
      id: String(r.id),
      day: r.day,
      time: r.time,
      name: r.name,
      sourceTitle: r.sourceTitle || "",
    });
  }

  return res.json({ planner });
});

// Replace planner 
router.post("/replace", requireAuth, (req, res) => {
  const { planner } = req.body;

  if (!planner || typeof planner !== "object") {
    return res.status(400).json({ error: "planner object required" });
  }

  // Clear existing
  db.prepare("DELETE FROM planner_items WHERE user_id = ?").run(req.user.id);

  // Insert new
  const insert = db.prepare(
    "INSERT INTO planner_items (user_id, day, time, name, source_title, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const now = new Date().toISOString();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (const day of days) {
    const items = Array.isArray(planner[day]) ? planner[day] : [];
    for (const item of items) {
      insert.run(
        req.user.id,
        day,
        String(item.time || ""),
        String(item.name || "Workout"),
        String(item.sourceTitle || ""),
        now
      );
    }
  }

  return res.json({ ok: true });
});

// Clear all planner items
router.post("/clear", requireAuth, (req, res) => {
  db.prepare("DELETE FROM planner_items WHERE user_id = ?").run(req.user.id);
  return res.json({ ok: true });
});

export default router;
