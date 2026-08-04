require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("./pool");

async function run() {
  console.log("正在建立資料表...");
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const statements = schema.split(";").map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await pool.query(stmt);
  }
  console.log("資料表建立完成。");

  // 種子帳號：對應原本網頁裡的三個 Demo 帳號
  const defaultUsers = [
    { name: "系統管理員", account: "admin", pass: "admin123", role: "admin" },
    { name: "設備工程師", account: "engineer", pass: "eng123", role: "engineer" },
    { name: "生產主管", account: "supervisor", pass: "sup123", role: "supervisor" }
  ];
  for (const u of defaultUsers) {
    const [rows] = await pool.query("SELECT id FROM users WHERE account=?", [u.account]);
    if (rows.length) continue;
    const hash = await bcrypt.hash(u.pass, 10);
    await pool.query(
      "INSERT INTO users (name, account, password_hash, role, active) VALUES (?,?,?,?,1)",
      [u.name, u.account, hash, u.role]
    );
    console.log(`已建立帳號：${u.account}`);
  }

  // 匯入既有的 792 筆示範/歷史資料（如果 repair_records 已經有資料就跳過，避免重複匯入）
  const [[{ cnt }]] = await pool.query("SELECT COUNT(*) AS cnt FROM repair_records");
  if (cnt === 0) {
    const seedPath = path.join(__dirname, "seed_records.json");
    if (fs.existsSync(seedPath)) {
      const records = JSON.parse(fs.readFileSync(seedPath, "utf8"));
      console.log(`正在匯入 ${records.length} 筆既有維修紀錄...`);
      for (const r of records) {
        try {
          await pool.query(
            `INSERT IGNORE INTO repair_records
             (mes_no, iso_no, machine_name, machine_code, request_date, repair_days, repair_status,
              risk_level, part_category, fault_desc, check_result, technician, suggested_cycle, priority, source)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              r["維修單號"] || null, r["ISO文件編號"] || null, r["機台名稱"] || null, r["機台代碼"] || null,
              r["申請日期"] || null, r["維修天數"] || 1, r["維修狀態"] || null,
              r["風險等級"] || null, r["零件分類"] || null, r["故障說明"] || null,
              r["初步檢查結果"] || null, r["維修人員"] || null, r["建議保養週期"] || null,
              r["改善優先級"] || null, "seed"
            ]
          );
        } catch (e) {
          console.warn("跳過一筆匯入失敗的紀錄：", r["維修單號"], e.message);
        }
      }
      console.log("既有資料匯入完成。");
    }
  } else {
    console.log(`repair_records 已有 ${cnt} 筆資料，跳過種子資料匯入。`);
  }

  console.log("Migration 完成！");
  process.exit(0);
}

run().catch(e => {
  console.error("Migration 失敗：", e);
  process.exit(1);
});
