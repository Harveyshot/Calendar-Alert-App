const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");
const { sendEmail } = require("./email");

const app = express();
const FRONTEND = process.env.FRONTEND_ORIGIN || "https://calendar-alert-app.onrender.com";
app.use(cors({ origin: FRONTEND }));
app.use(bodyParser.json());

const CRON_SECRET = process.env.CRON_SECRET || "change-me";

app.post("/api/reminders", (req, res) => {
  const { email, dueAtISO, message } = req.body || {};
  const due_at = Date.parse(dueAtISO);
  if (!email || !Number.isFinite(due_at)) {
    return res.status(400).json({ error: "email and valid dueAtISO required" });
  }
  db.run(
    "INSERT INTO reminders (email, message, due_at) VALUES (?, ?, ?)",
    [email, message || "", due_at],
    function (err) {
      if (err) return res.status(500).json({ error: "db insert failed" });
      res.json({ id: this.lastID });
    }
  );
});

app.post("/tasks/run", async (req, res) => {
  if (req.get("X-CRON-SECRET") !== CRON_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const now = Date.now();
  db.all("SELECT * FROM reminders WHERE sent = 0 AND due_at <= ? LIMIT 50", [now], async (err, rows) => {
    if (err) return res.status(500).json({ error: "db read failed" });
    let sentCount = 0;
    for (const r of rows) {
      try {
        await sendEmail({
          to: r.email,
          subject: "CalendarCo Alert",
          text: r.message || "You have a calendar alert."
        });
        await new Promise((resolve, reject) =>
          db.run("UPDATE reminders SET sent = 1 WHERE id = ?", [r.id], (e) => (e ? reject(e) : resolve()))
        );
        sentCount++;
      } catch {}
    }
    res.json({ processed: rows.length, sent: sentCount, now });
  });
});

app.get("/api/ping", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server listening on", PORT));
