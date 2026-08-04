const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logAudit } = require("../db/auditLog");

const router = express.Router();

function toFrontend(row) {
  return {
    id: row.id,
    "維修單號": row.mes_no,
    "ISO文件編號": row.iso_no,
    "機台名稱": row.machine_name,
    "機台代碼": row.machine_code,
    "申請日期": row.request_date,
    "維修天數": row.repair_days,
    "維修狀態": row.repair_status,
    "風險等級": row.risk_level,
    "零件分類": row.part_category,
    "故障說明": row.fault_desc,
    "初步檢查結果": row.check_result,
    "維修人員": row.technician,
    "建議保養週期": row.suggested_cycle,
    "改善優先級": row.priority,
    "_source": row.source
  };
}

// 所有登入的角色都可以「看」資料（含 supervisor 唯讀）
router.get("/", requireAuth, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM repair_records ORDER BY request_date DESC, id DESC");
  res.json(rows.map(toFrontend));
});

// 新增一筆維修紀錄（supervisor 唯讀角色不可新增）
router.post("/", requireAuth, requireRole(["admin", "engineer"]), async (req, res) => {
  const b = req.body || {};
  if (!b["維修單號"] || !b["機台名稱"] || !b["申請日期"]) {
    return res.status(400).json({ error: "維修單號、機台名稱、申請日期為必填" });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO repair_records
       (mes_no, iso_no, machine_name, machine_code, request_date, repair_days, repair_status,
        risk_level, part_category, fault_desc, check_result, technician, suggested_cycle, priority, source, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        b["維修單號"], b["ISO文件編號"] || null, b["機台名稱"], b["機台代碼"] || null,
        b["申請日期"], Math.max(1, Number(b["維修天數"]) || 1), b["維修狀態"] || "維修中",
        b["風險等級"] || null, b["零件分類"] || "其他", b["故障說明"] || null,
        b["初步檢查結果"] || null, b["維修人員"] || null, b["建議保養週期"] || null,
        b["改善優先級"] || null, "added", req.user.id
      ]
    );
    await logAudit(req.user.account, `新增維修紀錄：${b["維修單號"]}`);
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "這個維修單號已經存在" });
    }
    console.error(e);
    res.status(500).json({ error: "新增失敗" });
  }
});

// 更新一筆（例如編輯狀態）
router.put("/:id", requireAuth, requireRole(["admin", "engineer"]), async (req, res) => {
  const b = req.body || {};
  const fields = {
    mes_no: "維修單號", iso_no: "ISO文件編號", machine_name: "機台名稱", machine_code: "機台代碼",
    request_date: "申請日期", repair_days: "維修天數", repair_status: "維修狀態", risk_level: "風險等級",
    part_category: "零件分類", fault_desc: "故障說明", check_result: "初步檢查結果",
    technician: "維修人員", suggested_cycle: "建議保養週期", priority: "改善優先級"
  };
  const sets = [];
  const values = [];
  for (const [col, key] of Object.entries(fields)) {
    if (b[key] !== undefined) { sets.push(`${col}=?`); values.push(b[key]); }
  }
  if (!sets.length) return res.status(400).json({ error: "沒有要更新的欄位" });
  values.push(req.params.id);
  await pool.query(`UPDATE repair_records SET ${sets.join(",")} WHERE id=?`, values);
  await logAudit(req.user.account, `編輯維修紀錄 #${req.params.id}`);
  res.json({ ok: true });
});

// 刪除（僅 admin）
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await pool.query("DELETE FROM repair_records WHERE id=?", [req.params.id]);
  await logAudit(req.user.account, `刪除維修紀錄 #${req.params.id}`);
  res.json({ ok: true });
});

module.exports = router;
