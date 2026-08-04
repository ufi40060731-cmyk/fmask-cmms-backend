const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db/pool");
const { signToken } = require("../middleware/auth");
const { logAudit } = require("../db/auditLog");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { account, password } = req.body || {};
  if (!account || !password) {
    return res.status(400).json({ error: "請輸入帳號與密碼" });
  }
  const [rows] = await pool.query("SELECT * FROM users WHERE account=?", [account]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: "帳號或密碼錯誤" });
  if (!user.active) return res.status(403).json({ error: "此帳號已停用" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "帳號或密碼錯誤" });

  const token = signToken(user);
  await logAudit(user.account, "登入系統");
  res.json({
    token,
    user: { id: user.id, name: user.name, account: user.account, role: user.role }
  });
});

module.exports = router;
