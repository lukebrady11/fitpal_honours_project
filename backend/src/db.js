import Database from "better-sqlite3";

const db = new Database("fitnessapp.db");

// Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);
try {
  db.exec(`
    ALTER TABLE users
    ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
  `);
} catch {
  // column already exists → do nothing
} 
// Planner items table (per user)
db.exec(`
  CREATE TABLE IF NOT EXISTS planner_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    time TEXT NOT NULL,
    name TEXT NOT NULL,
    source_title TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS diet_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    meal TEXT NOT NULL,          -- Breakfast/Lunch/Dinner/Snacks
    name TEXT NOT NULL,
    source_title TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Events table (evaluation logging)
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    guest_id TEXT,
    type TEXT NOT NULL,
    meta_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

export default db;
