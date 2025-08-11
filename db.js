const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "..", "data.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      message TEXT,
      due_at INTEGER NOT NULL,
      sent INTEGER DEFAULT 0
    )
  `);
});

module.exports = db;





