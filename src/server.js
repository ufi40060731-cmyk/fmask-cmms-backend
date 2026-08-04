require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "12mb" })); // 放寬一點，因為設備照片是用 base64 傳送

app.get("/", (req, res) => res.json({ ok: true, service: "fmask-cmms-backend" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/records", require("./routes/records"));
app.use("/api/users", require("./routes/users"));
app.use("/api/pm", require("./routes/pm"));
app.use("/api/stock", require("./routes/stock"));
app.use("/api/photos", require("./routes/photos"));
app.use("/api/audit", require("./routes/audit"));

app.use((req, res) => res.status(404).json({ error: "找不到這個路徑" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "伺服器發生錯誤" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`F-Mask CMMS backend 已啟動，port ${PORT}`);
});
