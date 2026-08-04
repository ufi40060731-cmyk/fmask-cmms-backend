const mysql = require("mysql2/promise");

// Railway 會用 MYSQLHOST / MYSQLPORT / MYSQLUSER / MYSQLPASSWORD / MYSQLDATABASE
// 這幾個變數名稱把 MySQL 服務的連線資訊「注入」到這個後端服務裡（透過 Variable Reference）。
// 本地開發時可用 .env 檔案代替。
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || "localhost",
  port: Number(process.env.MYSQLPORT || 3306),
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "",
  database: process.env.MYSQLDATABASE || "fmask_cmms",
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  dateStrings: true
});

module.exports = pool;
