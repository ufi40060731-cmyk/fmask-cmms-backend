const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db/pool");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logAudit } = require("../db/auditLog");

const router = express.Router();

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const [rows] = await pool.query("SELECT id, name, account, role, active, created_at FROM users ORDER BY id");
  res.json(rows);
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { name, account, password, role } = req.body || {};
  if (!name || !account || !password || !role) {
    return res.status(400).json({ error: "請輸入姓名、帳號、密碼與角色" });
  }
  if (!["admin", "engineer", "supervisor"].includes(role)) {
    return res.status(400).json({ error: "角色設定錯誤" });
  }
  const [dup] = await pool.query("SELECT id FROM users WHERE account=?", [account]);
  if (dup.length) return res.status(409).json({ error: "帳號已存在，請換一個帳號" });

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    "INSERT INTO users (name, account, password_hash, role, active) VALUES (?,?,?,?,1)",
    [name, account, hash, role]
  );
  await logAudit(req.user.account, `新增使用者：${account}`);
  res.status(201).json({ id: result.insertId });
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { name, password, role, active } = req.body || {};
  if (Number(req.params.id) === req.user.id && active === false) {
    return res.status(400).json({ error: "不能停用目前登入中的自己" });
  }
  const sets = [];
  const values = [];
  if (name !== undefined) { sets.push("name=?"); values.push(name); }
  if (role !== undefined) { sets.push("role=?"); values.push(role); }
  if (active !== undefined) { sets.push("active=?"); values.push(active ? 1 : 0); }
  if (password) {
    if (!password.trim()) return res.status(400).json({ error: "密碼不可空白" });
    sets.push("password_hash=?");
    values.push(await bcrypt.hash(password, 10));
  }
  if (!sets.length) return res.status(400).json({ error: "沒有要更新的欄位" });
  values.push(req.params.id);
  await pool.query(`UPDATE users SET ${sets.join(",")} WHERE id=?`, values);
  await logAudit(req.user.account, `編輯使用者 #${req.params.id}`);
  res.json({ ok: true });
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: "不能刪除目前登入中的自己" });
  }
  await pool.query("DELETE FROM users WHERE id=?", [req.params.id]);
  await logAudit(req.user.account, `刪除使用者 #${req.params.id}`);
  res.json({ ok: true });
});

module.exports = router;
