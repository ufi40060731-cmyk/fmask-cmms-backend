const pool = require("./pool");

async function logAudit(userAccount, message) {
  try {
    await pool.query(
      "INSERT INTO audit_logs (user_account, message) VALUES (?, ?)",
      [userAccount || "system", message]
    );
  } catch (e) {
    console.error("寫入操作紀錄失敗：", e.message);
  }
}

module.exports = { logAudit };
