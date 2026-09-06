# ChunkMaster — 簡歷用專案總結

獨立開發以「語塊／片語」為單位的英語學習產品：React 學習端 + NestJS API + PostgreSQL，打通註冊學習複習筆記閉環，並做 AI 生成教材與人工審核後台。目標為私下分發 Android APK，尚未上架商店、尚未部署公開雲端。

**ChunkMaster｜全端英語語塊學習 App（獨立專案）**  
React / TypeScript / NestJS / Prisma / PostgreSQL / OpenAI

## 中文履歷條目（可刪減）

- 獨立設計並實作英語語塊學習全端產品：抽卡學習、填空挑戰、間隔複習（SRS）、雲端筆記、打卡 streak 與個人統計，前後端真實 API 閉環，不再依賴假資料。
- 以 NestJS + Prisma + PostgreSQL 建立帳號體系：JWT／HttpOnly Cookie、refresh token 輪替與重放防護、郵箱驗證、密碼重設、帳號匯出與刪除，以及 learner／reviewer／admin 四級 RBAC。
- 實作 AI 內容工廠：Admin 建立非同步 job，後端 worker 以 OpenAI JSON Schema 批次生成片語、例句、填空與 CEFR 等欄位；機器校驗、全域去重與失敗回滾後進入待審，人工核准才發布，模型金鑰不進前端。
- 設計內容生命週期 `draft → pending_review → published／rejected → retired`，管理操作寫入版本快照與 audit log；公開題庫只讀已發布內容。
- 建立工程品質基線：Backend 單元／服務測試、PostgreSQL E2E（跨帳號隔離）、Frontend Vitest 與 Playwright 學習者 smoke（桌面 + 小螢幕）；CI 含 typecheck、build、dependency audit 與 secret scan。
- 依行動端發布預先拆 Web／Native 邊界：production 禁止 localhost API、native bundle 排除 Admin、refresh token 不寫入 localStorage；規劃 Capacitor 側載 APK（工程尚未初始化）。

## 技術關鍵字

| 層 | 技術 |
|----|------|
| 前端 | React, TypeScript, Vite, PWA, Playwright, Vitest |
| 後端 | NestJS, Prisma, PostgreSQL, JWT, RBAC, Swagger |
| AI | OpenAI Chat Completions, JSON Schema structured output, job queue |
| 工程 | Docker Compose, GitHub Actions, Helmet / CORS / rate limit, Sentry（已接初始化） |
| 規劃中 | Capacitor Android、Railway、Neon、Cloudflare Pages、Resend |
