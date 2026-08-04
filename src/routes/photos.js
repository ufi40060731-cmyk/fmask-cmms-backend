const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/:machine", requireAuth, async (req, res) => {
  const [rows] = await pool.query("SELECT photo_data FROM machine_photos WHERE machine=?", [req.params.machine]);
  res.json({ photo: rows[0]?.photo_data || null });
});

router.put("/:machine", requireAuth, requireRole(["admin", "engineer"]), async (req, res) => {
  const { photo } = req.body || {};
  if (!photo) return res.status(400).json({ error: "沒有收到照片資料" });
  await pool.query(
    `INSERT INTO machine_photos (machine, photo_data) VALUES (?,?)
     ON DUPLICATE KEY UPDATE photo_data=VALUES(photo_data)`,
    [req.params.machine, photo]
  );
  res.json({ ok: true });
});

module.exports = router;
