# ChunkMaster

用 **chunk（片語／語塊）** 學英語，而不是背一張單詞表。

真實英語是一塊塊出現的：`on the other hand`、`I'm looking forward to`、`long story short`。ChunkMaster 每次只練一小塊——看懂、用得出來、過幾天再見面。

## 亮點

- **抽卡學習**：依分類抽一片語，先猜再揭曉，用「還在學／我記得」誠實回報，不是假裝全對。
- **填空挑戰**：把 chunk 放回句子裡，確認你真的會用，而不只是眼熟。
- **到期複習**：答錯很快再出現，答對間隔拉長。複習頁只給到期的，不會拿隨機題湊數。
- **筆記與習慣**：雲端筆記、連續打卡、每日目標、種類分佈。統計失敗就說失敗，不拿假數據撐場面。
- **AI 產教材，人來把關**：後台用模型批量生成片語、翻譯、例句與填空；必須人工核准才會進學習題庫。學習 App 裡沒有後台，也沒有模型金鑰。
- **帳號說了算**：註冊登入、匯出自己的資料、確認密碼後刪除帳號。

## 技術

| | |
|---|---|
| 學習端 | React、Vite、TypeScript |
| API | NestJS、Prisma、PostgreSQL |
| 教材生成 | DeepSeek（結構化輸出 + 去重 + 審核流） |
| 現況 | Web 已可在雲端使用；獨立圖示的 Android Debug App 已在模擬器與實機驗收。Native refresh 存 Keystore，殺掉行程後仍登入。signed APK 尚未產出。不上架 Google Play |

## 本地開發

需要 Docker（Postgres）與 **Node 22**（Capacitor 8 CLI 不接受 Node 20）。

```powershell
cd Backend
docker compose up -d
npx prisma migrate deploy
npm run start:dev
```

```powershell
cd Frontend
npm run dev
```

前端 `http://localhost:5173`，API `http://localhost:3000`。

Android Debug：複製 `Frontend/.env.android-production.example` 為 `.env.android-production`，填入 Railway HTTPS（不可 localhost）。然後 `npm run android:sync`、`npx cap open android`。先在 Railway `CORS_ORIGINS` 加上 `https://localhost`（保留現有 Pages 網址）。
