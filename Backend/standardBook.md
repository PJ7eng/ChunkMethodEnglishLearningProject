
下面是一份基於你目前前端功能、並且符合你“AI 批量生成內容、內容池復用、降低成本”的設計計劃。

## 1. 整體定位

這個後端不應該只是“把前端數據接起來”，而是要變成一個“內容生成 + 內容池 + 學習分發”系統。

你現在的需求其實很清楚：

- 前端需要展示 chunk、例句、填空題、選擇題
- 這些內容不能每次用戶請求時都重新生成，因為成本太高
- 所以後端要設計成：
  - 定時批量生成內容
  - 把生成結果存入共享池
  - 用戶學習時從池子中取內容，而不是每次重生成

這樣的設計會讓系統更像一個“內容引擎”，而不只是普通 CRUD API。

---

## 2. 後端整體架構

建議先採用“模塊化單體架構”，也就是：

- API 層：負責接收前端請求
- 生成服務：負責調用 AI API 生成內容
- 內容池：負責存儲和管理可複用內容
- 學習服務：負責為用戶提供學習內容和記錄學習進度
- 管理服務：負責人工審核、內容上下線、生成任務管理

這種設計的好處是：
- 起步快，不需要一開始就拆微服務
- 之後如果規模變大，也可以再拆成獨立服務
- 邏輯分層清晰，後續維護容易

---

## 3. 核心業務流程

### A. 內容生成流程

這是你最重要的需求，建議設計成下面這樣：

1. 定時任務觸發
   - 例如每天固定時間（如凌晨 2 點）觸發一次生成任務
   - 或者每隔幾小時觸發一次

2. 批量生成內容
   - 一次生成一批 chunk
   - 每個 chunk 同時生成 3-5 個例句
   - 再生成一批選擇題
   - 每道題包含 3 個 chunk 選項

3. 內容進入内容池
   - 生成成功後，先放入“待審核”或“草稿”狀態
   - 通過檢查後，再標記為“已發布”

4. 用戶從內容池拿取
   - 用戶學習時不會重新生成
   - 而是從池中提取“未被使用過/適合現在難度/適合當前分類”的內容

這樣就完全符合你的成本控制思路。

---

## 4. 數據模型設計

以下是建議的核心表結構。

### 4.1 User
存用戶基本信息和偏好。

字段建議包括：
- id
- email
- passwordHash
- name
- createdAt

### 4.2 ContentPoolItem
這是整個系統最關鍵的表，代表一個“可重複使用的內容單元”。

字段建議：
- id
- category
- difficulty
- status
- qualityScore
- usageCount
- createdAt
- updatedAt

它的作用是：
- 把 chunk、例句、題目統一聚合成一個內容單元
- 之後可以根據它的狀態和使用次數決定是否繼續使用

### 4.3 Chunk
存真正的 chunk 資料。

字段建議：
- id
- contentPoolItemId
- phrase
- translation
- pinyin
- category
- difficulty
- blank
- answer
- options
- status

這裡的 blank、answer、options 可以直接對應你前端現在的練習方式。

### 4.4 ChunkExample
存每個 chunk 的例句。

字段：
- id
- chunkId
- sentence

建議每個 chunk 至少 3-5 條。

### 4.5 QuizQuestion
存題目。

字段：
- id
- contentPoolItemId
- prompt
- correctAnswerChunkId
- difficulty
- status

### 4.6 QuizOption
存每道題的選項。

字段：
- id
- quizQuestionId
- chunkId
- isCorrect
- orderIndex

這樣可以方便後面把選擇題和 chunk 之間做關聯。

### 4.7 LearningProgress
存每個用戶對每個 chunk 的學習狀態。

字段：
- id
- userId
- chunkId
- mastered
- needsReview
- lastReviewedAt
- reviewCount
- answerCount
- masteryScore

這是前端“已掌握 / 需要複習”等狀態的數據來源。

### 4.8 DailyProgress
存每日進度。

字段：
- id
- userId
- date
- completedCount
- goal
- streakDay

### 4.9 UserPreference
存設定。

字段：
- id
- userId
- dailyGoal
- soundEnabled
- reminderEnabled
- hapticEnabled
- autoNextEnabled

### 4.10 GenerationJob
存生成任務的執行記錄。

字段：
- id
- jobType
- status
- batchSize
- startedAt
- completedAt
- errorMessage
- triggerReason

這張表對後續排查生成失敗、監控成本非常重要。

---

## 5. 內容生成的工作流設計

這部分是你需求的核心。

### 生成流程建議

1. 定時任務啟動
   - 每天固定時間生成一批內容

2. 生成一組 chunk
   - 按類別、難度、主題進行生成
   - 避免太多重複或太像的內容

3. 為每個 chunk 生成例句
   - 建議每個 chunk 生成 3-5 個例句
   - 這些例句要能直接展示在前端

4. 生成選擇題
   - 每次生成一批 quiz
   - 每道題有 3 個 chunk 選項
   - 其中一個為正確答案

5. 做品質檢查
   - 去重
   - 檢查語法與語義是否合理
   - 檢查是否符合學習目標

6. 寫入內容池
   - 通過後才真正對外提供

這樣就能把“生成”與“使用”拆開，降低成本。

---

## 6. 內容池的設計思路

內容池不是簡單的“存一堆 chunk”，而應該是一個“可回收、可評分、可輪換”的內容庫。

建議設計成這種狀態流轉：

- draft：剛生成
- generating：正在生成中
- pending_review：生成後待審核
- published：已對外可用
- retired：已淘汰或不再使用

這樣的設計有幾個好處：

- 不會把一開始就有問題的內容直接暴露給用戶
- 可以後續根據使用率和評分來淘汰低質內容
- 未來可以做“新內容優先展示”或“老內容輪詢復用”

---

## 7. 用戶學習時的請求流程

前端現在是“Home / Library / Settings”三個主場景。

後端可以這樣對應：

### Home
- 前端請求一個隨機 chunk
- 後端從內容池中選擇一個“適合該用戶”的 chunk
- 返回 chunk、例句、題目相關數據

### Library
- 前端請求 chunk 列表
- 後端根據分類、搜索詞、是否已掌握等條件返回

### Settings
- 前端請求偏好設定
- 後端返回使用者設定，並保存修改

---

## 8. API 設計建議

### 認證相關
- POST /auth/register
- POST /auth/login
- GET /auth/me

### chunk 相關
- GET /chunks
- GET /chunks/:id
- GET /chunks/random
- GET /chunks/library

### 測驗相關
- GET /quizzes/random
- POST /quizzes/:id/submit

### 學習進度相關
- POST /progress/chunks/:id/answer
- POST /progress/chunks/:id/review
- GET /progress/summary
- GET /progress/daily

### 設定相關
- GET /preferences
- PUT /preferences

### 管理相關
- POST /admin/generation/run
- GET /admin/generation/jobs
- POST /admin/content/:id/approve
- POST /admin/content/:id/retire

---

## 9. 成本控制策略

這是你最關心的點，我建議有以下措施：

### 9.1 批量生成
不要每個用戶請求時都生成一次，而是定時批量生成。

### 9.2 內容池復用
生成過的內容供所有用戶共用。

### 9.3 去重
生成前先檢查相似內容，避免重複生成。

### 9.4 預算管理
設置每天/每月 AI 調用上限，防止成本失控。

### 9.5 內容分級
例如：
- 新手內容優先
- 高難度內容只在池子足夠時生成
- 低使用率內容不再生成

### 9.6 使用率監控
如果某個內容已經被用很多次，就不需要再生成相似內容。

---

## 10. 質量控制設計

AI 生成內容雖然方便，但一定要有品質保障。

建議加入以下流程：

- 生成後先做格式檢查
- 檢查是否有重複詞句
- 檢查例句是否自然
- 檢查選項是否合理
- 對低品質內容做人工審核或自動退回

可以把生成內容分成三層：
- 自動通過
- 人工審核
- 直接丟棄

這樣能大幅提升內容品質。

---

## 11. 未來擴展方向

這個系統建完後，未來很容易擴展，建議你預留以下方向：

### 11.1 個性化學習
根據用戶答題表現，調整難度與內容推薦。

### 11.2 間隔重複
根據記憶曲線安排複習。

### 11.3 多語言支持
未來不只英文，還能支持其他語言學習。

### 11.4 管理後台
讓你自己或團隊審核內容、調整生成規則。

### 11.5 數據分析
觀察哪些 chunk 最受歡迎、哪些題目最容易出錯。

---

## 12. 建議的實施階段

### Phase 1：MVP
先把最核心的功能做起來：
- 用戶註冊 / 登錄
- chunk 列表與隨機取題
- 例句與練習題接口
- 學習進度記錄
- 設定保存

### Phase 2：生成 pipeline
加入：
- 定時生成任務
- AI 批量生成 chunk / example / quiz
- 內容池存儲
- 內容審核流

### Phase 3：個性化與優化
加入：
- 難度適配
- 複習安排
- 數據分析
- 管理後台

---

## 13. 我的建議結論

如果要和你現在的前端需求完美契合，我建議後端的核心設計是：

- 以“內容池”作為核心
- 以“定時批量生成”作為成本控制手段
- 以“學習服務”作為面向前端的使用層
- 以“生成任務與審核流程”作為擴展層

這樣的設計既符合你目前的想法，也能很好地支持未來的增長。

---

如果你願意，我下一步可以直接幫你把這份計劃進一步落成兩種更實用的版本之一：

1. 後端技術選型版
   - 明確說明用 NestJS / Prisma / PostgreSQL / Redis / JWT 該怎麼搭

2. API 與數據庫設計版
   - 直接列出資料表、接口、字段和實際請求格式

如果你要，我下一條就直接幫你整理成“可直接開發的後端規格書”。