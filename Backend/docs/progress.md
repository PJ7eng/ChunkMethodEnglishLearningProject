# 項目進度報告

更新日期：2026-07-04

## 1. 整體進度總結

根據 [Backend/plan.md](../plan.md) 的規劃，整個項目目前已經完成了大部分後端基礎建設，並且開始進入「真正可用的產品流程」階段。

目前整體狀態可以概括為：

- 後端基礎已經打通，包含資料庫、 Prisma、認證、內容查詢、學習進度與內容生成流程。
- 前端已經接上後端的主要資料流，包含註冊/登入、chunk 讀取與內容展示。
- 尚未完全完成的部分主要是「設定持久化」與「前端完整把學習進度與 AI 生成流程串到 UI」。

整體評估：

- 後端：約 85% 完成
- 前端：約 70% 完成
- 端到端完整流程：約 75% 完成

---

## 2. 與 plan.md 的對比

| 階段 | plan.md 目標 | 目前狀態 | 說明 |
| --- | --- | --- | --- |
| 階段一：基礎打實 | Prisma + PostgreSQL + Auth | 已完成 | 已實作註冊、登入、JWT、bcrypt 與 Prisma 連線 |
| 階段二：內容系統 | chunk / quiz / example 從資料庫取資料 | 已完成 | 目前可查詢 chunk 清單與隨機 chunk |
| 階段三：學習與進度 | 答題紀錄、mastered、daily progress | 已完成 | 已建立 progress API，能記錄答題與每日完成數 |
| 階段四：AI 批量生成內容 | generation job + 內容池 + 狀態流 | 已完成 | 已建立生成任務流程，能創建 job 並寫入內容池 |
| 階段五：前端真正串接 | 前後端完整整合 | 進行中 | 前端已接上 auth 與 chunk 資料，尚未完全接上 settings 與 progress UI |

---

## 3. 目前已完成的內容

### 3.1 後端已完成

- 已建立 NestJS 後端骨架，並接上 Prisma 與 PostgreSQL。
- 已完成真正的使用者認證流程：
  - 註冊
  - 登入
  - 取目前使用者資訊
- 已完成內容池與 chunk 查詢：
  - 取得 chunk 列表
  - 隨機取得 chunk
- 已完成學習進度流程：
  - 記錄每次答題結果
  - 更新 mastered / needsReview 狀態
  - 記錄每日完成數
- 已完成內容生成流程：
  - 建立 generation job
  - 生成 chunk / example / quiz 基本資料
  - 更新內容池與 job 狀態

相關實作位置：

- [Backend/src/auth/auth.controller.ts](../src/auth/auth.controller.ts)
- [Backend/src/auth/auth.service.ts](../src/auth/auth.service.ts)
- [Backend/src/content-pool/content-pool.controller.ts](../src/content-pool/content-pool.controller.ts)
- [Backend/src/content-pool/content-pool.service.ts](../src/content-pool/content-pool.service.ts)
- [Backend/src/progress/progress.controller.ts](../src/progress/progress.controller.ts)
- [Backend/src/progress/progress.service.ts](../src/progress/progress.service.ts)
- [Backend/src/generation/generation.controller.ts](../src/generation/generation.controller.ts)
- [Backend/src/generation/generation.service.ts](../src/generation/generation.service.ts)

### 3.2 前端已完成

- 已建立前端 API 封裝層，能呼叫後端接口。
- Home 頁已接上後端 chunk 資料。
- Library 頁已接上後端 chunk 資料。
- 已有基本的註冊與登入資料流的前端支援。

相關實作位置：

- [Frontend/src/app/api.ts](../../Frontend/src/app/api.ts)
- [Frontend/src/app/App.tsx](../../Frontend/src/app/App.tsx)

---

## 4. 目前已產生的 API 總數

目前後端共提供 9 個 API 端點。

### 4.1 API 清單與用途

| API | 方法 | 用途 |
| --- | --- | --- |
| /auth/register | POST | 建立新使用者帳號 |
| /auth/login | POST | 使用者登入，取得 JWT |
| /auth/me | GET | 依據 token 取得目前登入者資訊 |
| /chunks | GET | 取得 chunk 清單，可依照分類篩選 |
| /chunks/random | GET | 隨機取得一個 chunk |
| /progress/answer | POST | 記錄使用者答題結果、進度與每日完成數 |
| /generation/jobs | POST | 建立一個內容生成任務 |
| /generation/jobs | GET | 查詢所有 generation jobs |
| /generation/jobs/:id | GET | 查詢單一 generation job 的詳情 |

### 4.2 這些 API 的整體角色

這 9 個 API 已經把整個產品的核心流程覆蓋了：

- 認證流程：註冊、登入、身份確認
- 學習流程：取得內容、回答問題、紀錄進度
- 內容生成流程：建立任務、追蹤狀態、檢查結果

---

## 5. 目前仍然還缺的部分

雖然核心功能已經完成，但仍有幾個重要部分還沒完全收斂到產品可用狀態：

1. 設定頁面尚未真正接到後端
   - 目前設定是前端本地狀態，尚未做成持久化儲存。

2. 學習進度 UI 尚未完整串接
   - 前端目前已具備 API helper，但還沒有全面把答題結果提交到後端並顯示真實統計。

3. AI 生成流程仍屬基礎版
   - 目前已經能建立 generation job 與寫入內容池，但尚未接真正排程器與審核流程。

4. 缺乏更完整的測試與正式資料流驗證
   - 目前已經有服務層的基本測試，但仍需要整合測試與真實資料庫驗證。

---

## 6. 接下來建議做的事情

接下來建議按這個順序繼續完成：

1. 先把 Settings 的後端 API 做完
   - 新增 preferences 相關接口
   - 前端把設定讀寫接上後端

2. 把學習進度 UI 完整接上
   - 使用者答題後直接提交到 /progress/answer
   - 前端顯示真實 mastered、review、daily progress

3. 把 AI 生成流程升級為更完整版本
   - 加入排程器 / background job
   - 增加 pending_review 和 published 流程
   - 加入內容品質評分

4. 補齊整合測試與手動測試流程
   - 驗證註冊、登入、拿 chunk、答題、生成內容的整條路徑

---

## 7. 結論

目前這個專案已經從「骨架版」進入「可運作的 MVP」階段。後端的核心功能已經建立完成，前端也已經串上大部分關鍵資料流。下一步最值得優先完成的，是把使用者設定與學習進度的 UI 真正打通，讓整個產品從「能跑」變成「好用」。
