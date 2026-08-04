const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const [rows] = await pool.query(
    "SELECT event_time, user_account, message FROM audit_logs ORDER BY id DESC LIMIT 200"
  );
  res.json(rows);
});

module.exports = router;
