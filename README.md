# F-Mask CMMS Backend

給 F-Mask CMMS 系統使用的後端 API（Node.js + Express + MySQL），部署在 Railway。

## API 總覽

- `POST /api/auth/login` — 登入，回傳 JWT token
- `GET /api/records` — 取得所有維修紀錄
- `POST /api/records` — 新增維修紀錄（admin / engineer）
- `PUT /api/records/:id` — 編輯維修紀錄（admin / engineer）
- `DELETE /api/records/:id` — 刪除維修紀錄（admin）
- `GET /api/users` — 使用者清單（admin）
- `POST /api/users` / `PUT /api/users/:id` / `DELETE /api/users/:id` — 使用者管理（admin）
- `GET /api/pm/items` / `POST /api/pm/items` / `DELETE /api/pm/items/:id` — 手動 PM 項目
- `GET /api/pm/auto-status` / `PUT /api/pm/auto-status/:key` — 自動 PM 建議的完成狀態
- `GET /api/stock` / `PUT /api/stock/:part` / `DELETE /api/stock/:part` — 庫存調整量
- `GET /api/photos/:machine` / `PUT /api/photos/:machine` — 設備照片
- `GET /api/audit` — 操作紀錄（admin）

## 預設帳號（跟原本網頁一樣）

| 帳號 | 密碼 | 角色 |
|---|---|---|
| admin | admin123 | 系統管理員 |
| engineer | eng123 | 設備工程師 |
| supervisor | sup123 | 生產主管（唯讀） |

**上線後請務必到「使用者管理」把這些預設密碼改掉。**

## 本機開發

```bash
npm install
cp .env.example .env   # 填入你本機 MySQL 的連線資訊
npm run migrate        # 建立資料表 + 匯入預設資料
npm start
```

## 部署（Railway）

這個 repo 是設計給 Railway 直接從 GitHub 部署使用，環境變數（MySQL 連線資訊、JWT_SECRET）由 Railway 專案設定注入，不需要在程式碼裡填寫。
