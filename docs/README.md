# ChunkMaster V1 專案進度

> 更新日期：2026-09-01  
> 當前狀態：Web／Backend 核心與部署骨架已完成；V1 最終目標改為私下分發、帶獨立主畫面圖示的 signed Android APK，不上架 Google Play。目前進入 M1 發布身份、域名與雲端 staging。

## 文件索引

- [V1 完整計劃](V1_PLAN.md)：產品、工程、內容及私下分發 APK 的分階段計劃。
- [部署手冊](DEPLOYMENT.md)：Cloudflare Pages、Railway、Neon 的部署、回滾與 smoke test。
- [詳細開發進度](progress.md)：前後端、API、驗證結果與下一階段工作。
- [後端內容規格](../Backend/docs/standardBook.md)：內容池及題庫的早期設計資料。

## 目前已完成

### 學習者產品

- 註冊、登入、會話恢復及登出。
- 郵箱驗證、忘記／重設密碼、帳號資料匯出與刪除。
- Home 語塊學習、翻譯揭示、「仍在學習／已記住」自評及每日進度。
- Challenge 填空、SRS 到期 Review、Mastered、Library、Streak。
- 雲端 Notes CRUD、搜尋、分類、批次刪除及與 Chunk 的資料關聯。
- Profile 統計、每日目標與偏好設定；統計 API 失敗時不再顯示假資料。
- 基本 PWA manifest、icon、service worker 及唯讀快取。

### 帳號與安全

- bcrypt 密碼雜湊，密碼最低 8 字元。
- 15 分鐘 access token、可輪替 refresh session、登出撤銷與重放保護。
- Secure／HttpOnly／SameSite Cookie，並保留 Bearer Token 相容層。
- `learner`、`content_reviewer`、`content_admin`、`super_admin` 四級 RBAC。
- Helmet、CORS allowlist、JSON payload 限制、request ID、rate limit。
- Production 缺少 `JWT_SECRET` 時拒絕啟動。
- `/admin/*` 必須通過身份及角色驗證。

### 學習與資料

- `LearningProgress` 已加入 stability、difficulty、dueAt、lapseCount 及反應時間。
- 答錯約 10 分鐘後到期；答對按穩定度延長間隔。
- Review 只返回到期項目，空佇列不再混入隨機題。
- Library 只統計真正學過的內容。
- `retired` 內容不再出題，但保留既有學習進度。

### AI 內容工作流

- Admin 建立 generation job，HTTP 不同步等待模型完成。
- PostgreSQL job queue、背景 polling、冪等鍵、批量上限及每日 job 上限。
- OpenAI 結構化輸出、欄位驗證、答案／選項檢查及批次去重。
- 移除模型失敗時冒充正式內容的模板 fallback。
- 合格內容只進入 `pending_review`，不會直接發布。
- 支援人工編輯、核准、拒絕、下架、恢復、內容版本及 audit log。

### Admin

- `/admin` 角色保護入口。
- Dashboard、狀態篩選、待審列表及內容詳情。
- 可選 category、difficulty、batch size 建立生成任務。
- 支援編輯、Approve、Reject、Retire、Restore。
- 管理操作寫入不可變 audit event。

### 工程與部署

- Prisma V1 migration，包括既有 `Note` 表兼容處理。
- Backend multi-stage Dockerfile 與 production startup migration。
- GitHub Actions：migration、typecheck、unit、E2E、build、Docker build。
- `/health`、`/ready`、Swagger `/docs`。
- 前後端 Sentry 初始化及後端結構化 HTTP 日誌。
- Cloudflare Pages SPA redirects、PWA assets、環境變數範例及部署 runbook。

## 已完成驗證

2026-08-16 本機驗證結果：

- `npx prisma validate`：通過。
- `npx prisma migrate deploy`：兩個 migrations 全部成功。
- `npx prisma migrate status`：Database schema is up to date。
- Backend unit tests：3/3 通過。
- Backend PostgreSQL E2E：1/1 通過，確認不同帳號不能讀取對方 Notes。
- Backend production build：通過。
- Frontend TypeScript typecheck：通過。
- Frontend production build：通過。
- Backend／Frontend production dependency audit：0 vulnerabilities。

常用驗證命令：

```powershell
cd Backend
npx prisma migrate deploy
npm run typecheck
npm test
npm run test:e2e
npm run build

cd ..\Frontend
npm run typecheck
npm run build
```

## 本機啟動

先啟動 Docker Desktop：

```powershell
cd Backend
docker compose up -d
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

另一個 terminal：

```powershell
cd Frontend
npm run dev
```

本機入口：

- 前端：`http://localhost:5173`
- API：`http://localhost:3000`
- Health：`http://localhost:3000/health`
- Readiness：`http://localhost:3000/ready`
- Swagger：`http://localhost:3000/docs`

## 尚待完成

目前依 [V1 計劃 M1](V1_PLAN.md#6-m1發布身份域名與雲端-staging) 推進：

- 確認 application ID、App 顯示名稱、網域或 HTTPS 預設網址、支援聯絡方式。不要建立 Play Console。
- 建立 Cloudflare Pages、Railway、Neon、Resend、OpenAI、Sentry 的 staging／production 資源。
- 完成 staging smoke test 後，以 Capacitor 建立 Android 工程、獨立 launcher icon、native auth、返回鍵與安全儲存。
- 準備並人工審核首批 300–500 個 chunks；給他人的 release 環境不得外洩未審內容。
- 產出 signed release APK、安裝／覆蓋升級說明，並以同一 keystore 分發給熟人。
- 執行 Neon 備份還原演練及應用回滾演練。
- 加入前端 Playwright、弱網與主要 Admin 流程自動測試（能做多少做多少，不為商店審核擴矩陣）。
- 補齊給受邀者看的隱私、條款、支援與刪除說明；不填 Play Data safety。

## 已知限制

- SRS 為第一版簡化算法，尚不是完整 FSRS。
- PWA 只提供基本讀取快取，不支援離線寫入與衝突同步。
- Capacitor Android、獨立 launcher icon、signed APK 與 native secure storage 尚未實作，均為 V1 必做。Daily Reminder 與 haptic 僅在 Settings 顯示為可用時必做；已驗證 App Links 不是 V1 阻擋項。
- 聽力目前主要依賴 Web Speech；跟讀評分及 AI 情境對話不屬 V1。
- Generation worker 目前與 API 使用相同程式映像；正式拆成獨立 worker 前，API 應保持單 replica。
- 正式環境不得執行 seed；內容只能經 Admin 生產及人工核准。

## 更新規則

後續每次重要發布應同步更新：

1. 本文件的日期、完成項目、驗證結果與已知限制。
2. [V1_PLAN.md](V1_PLAN.md) 的階段狀態。
3. [DEPLOYMENT.md](DEPLOYMENT.md) 的供應商設定、發布與回滾步驟。
4. 涉及資料庫變更時，附上 migration、備份及還原驗證結果。
