const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logAudit } = require("../db/auditLog");

const router = express.Router();

router.get("/items", requireAuth, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM pm_items ORDER BY item_date");
  res.json(rows);
});

router.post("/items", requireAuth, requireRole(["admin", "engineer"]), async (req, res) => {
  const b = req.body || {};
  if (!b.date || !b.title) return res.status(400).json({ error: "請輸入日期與PM項目名稱" });
  const [result] = await pool.query(
    `INSERT INTO pm_items (item_date, title, machine, owner, required_parts, status, note)
     VALUES (?,?,?,?,?,?,?)`,
    [b.date, b.title, b.machine || null, b.owner || null, b.requiredParts || null, b.status || "待執行", b.note || null]
  );
  await logAudit(req.user.account, `新增PM項目：${b.title}`);
  res.status(201).json({ id: result.insertId });
});

router.delete("/items/:id", requireAuth, requireRole(["admin", "engineer"]), async (req, res) => {
  await pool.query("DELETE FROM pm_items WHERE id=?", [req.params.id]);
  await logAudit(req.user.account, `刪除PM項目 #${req.params.id}`);
  res.json({ ok: true });
});

router.put("/items/:id/status", requireAuth, requireRole(["admin", "engineer"]), async (req, res) => {
  const { status } = req.body || {};
  await pool.query("UPDATE pm_items SET status=? WHERE id=?", [status || "待執行", req.params.id]);
  res.json({ ok: true });
});

// 自動產生的 PM 建議：只需要記住「哪一個 key 被標記完成」
router.get("/auto-status", requireAuth, async (req, res) => {
  const [rows] = await pool.query("SELECT pm_key, status FROM auto_pm_status");
  const map = {};
  rows.forEach(r => { map[r.pm_key] = r.status; });
  res.json(map);
});

router.put("/auto-status/:key", requireAuth, requireRole(["admin", "engineer"]), async (req, res) => {
  const { status } = req.body || {};
  await pool.query(
    "INSERT INTO auto_pm_status (pm_key, status) VALUES (?,?) ON DUPLICATE KEY UPDATE status=VALUES(status)",
    [req.params.key, status || "待執行"]
  );
  res.json({ ok: true });
});

module.exports = router;
