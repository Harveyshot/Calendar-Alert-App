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
