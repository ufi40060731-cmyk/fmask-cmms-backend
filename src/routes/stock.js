const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logAudit } = require("../db/auditLog");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const [rows] = await pool.query("SELECT part_category, qty_adjustment FROM stock_adjustments");
  const map = {};
  rows.forEach(r => { map[r.part_category] = r.qty_adjustment; });
  res.json(map);
});

router.put("/:part", requireAuth, requireRole(["admin", "engineer"]), async (req, res) => {
  const { delta } = req.body || {};
  const n = Number(delta);
  if (!n) return res.status(400).json({ error: "請輸入要調整的數量，例如 5 或 -5" });
  await pool.query(
    `INSERT INTO stock_adjustments (part_category, qty_adjustment) VALUES (?,?)
     ON DUPLICATE KEY UPDATE qty_adjustment = qty_adjustment + VALUES(qty_adjustment)`,
    [req.params.part, n]
  );
  await logAudit(req.user.account, `調整庫存：${req.params.part} ${n > 0 ? "+" : ""}${n}`);
  res.json({ ok: true });
});

router.delete("/:part", requireAuth, requireRole(["admin", "engineer"]), async (req, res) => {
  await pool.query("DELETE FROM stock_adjustments WHERE part_category=?", [req.params.part]);
  await logAudit(req.user.account, `重設庫存調整量：${req.params.part}`);
  res.json({ ok: true });
});

module.exports = router;
