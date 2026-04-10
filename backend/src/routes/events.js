import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

const ALLOWED_TYPES = new Set([
  "chat_message_sent",
  "plan_generated",
  "plan_saved",
  "planner_viewed",
  "login",
  "register",
  "logout",
  "guest_limit_hit",
  "planner_session_deleted",
  "planner_session_updated",
  "planner_session_moved",
  "planner_cleared",
  "safety_triage_triggered",
  "diet_cleared",
  "diet_item_deleted",
  "diet_item_moved",
  "diet_item_updated",
  "diet_plan_saved",
  "diet_plan_generated",

]);

// POST /events  (works for guests + logged in)
router.post("/", (req, res) => {
  try {
    const { type, guestId, meta } = req.body;

    if (!type || typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
      return res.status(400).json({ error: "Invalid event type" });
    }

    // If logged in, you can pass userId by decoding cookie later.
   
    let user_id = null;
    
    const guest_id =
      typeof guestId === "string" && guestId.length <= 100 ? guestId : null;

    const meta_json =
      meta && typeof meta === "object" ? JSON.stringify(meta).slice(0, 2000) : null;

    db.prepare(
      "INSERT INTO events (user_id, guest_id, type, meta_json, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(user_id, guest_id, type, meta_json, new Date().toISOString());

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to log event" });
  }
});

// POST /events/auth  (logged-in events with user_id)
router.post("/auth", requireAuth, (req, res) => {
  try {
    const { type, meta } = req.body;

    if (!type || typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
      return res.status(400).json({ error: "Invalid event type" });
    }

    const meta_json =
      meta && typeof meta === "object" ? JSON.stringify(meta).slice(0, 2000) : null;

    db.prepare(
      "INSERT INTO events (user_id, guest_id, type, meta_json, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(req.user.id, null, type, meta_json, new Date().toISOString());

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to log event" });
  }
});

// GET /events/summary  (logged-in only; good enough for dissertation)
router.get("/summary", requireAdmin, (req, res) => {
  try {
    // Overall counts by type (all users + guests)
    const byType = db
      .prepare(
        "SELECT type, COUNT(*) AS count FROM events GROUP BY type ORDER BY count DESC"
      )
      .all();

    // Last 7 days trend (all events)
    const last7 = db
      .prepare(
        `
        SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
        FROM events
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY day
        ORDER BY day ASC
        `
      )
      .all();

    return res.json({ byType, last7 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to build summary" });
  }
});

export default router;
