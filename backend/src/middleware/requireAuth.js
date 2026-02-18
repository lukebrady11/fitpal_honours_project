import jwt from "jsonwebtoken";
import db from "../db.js";

const COOKIE_NAME = "fitpal_token";

export default function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const row = db
      .prepare("SELECT id, email, is_admin FROM users WHERE id = ?")
      .get(payload.userId);

    if (!row) return res.status(401).json({ error: "Not authenticated" });

    req.user = {
      id: row.id,
      email: row.email,
      isAdmin: !!row.is_admin,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Not authenticated" });
  }
}
