import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

const COOKIE_NAME = "fitpal_token";
const JWT_EXPIRES_IN = "7d"; // session length

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true in production (https)
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
}

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email required" });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const password_hash = await bcrypt.hash(password, 12);

    // is_admin defaults to 0 (via table default), so we don't need to set it explicitly
    const info = db
      .prepare("INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)")
      .run(email.toLowerCase(), password_hash, new Date().toISOString());

    const user = { id: info.lastInsertRowid, email: email.toLowerCase(), isAdmin: false };

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    setAuthCookie(res, token);
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Register failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const row = db
      .prepare("SELECT id, email, password_hash, is_admin FROM users WHERE email = ?")
      .get(email.toLowerCase());

    if (!row) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: row.id }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    setAuthCookie(res, token);
    return res.json({ user: { id: row.id, email: row.email, isAdmin: !!row.is_admin } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

router.get("/me", (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.json({ user: null });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const row = db
      .prepare("SELECT id, email, is_admin FROM users WHERE id = ?")
      .get(payload.userId);

    if (!row) return res.json({ user: null });

    return res.json({ user: { id: row.id, email: row.email, isAdmin: !!row.is_admin } });
  } catch {
    return res.json({ user: null });
  }
});

export default router;
