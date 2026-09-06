# ChunkMaster V1 Data inventory（發布前草稿）

> 盤點日期：2026-09-01  
> 狀態：依目前程式碼與 `V1_PLAN.md` 整理；供私下分發 APK 時核對實際資料流。不是 Google Play Data safety 申報，也不是法律意見。  
> 發布狀態：**阻塞**。所有標為「TODO／發布阻塞」的項目須由營運者確認並與 production 實際設定核對。V1 不上架 Google Play，但受邀者仍應知道聯絡方式與刪除帳號方式。

## 1. 範圍與判讀方式

本文件盤點 ChunkMaster 學習者 Web、規劃中的 Android App、NestJS API、PostgreSQL 資料庫及規劃中的第三方服務。盤點以以下來源為準：

- `Backend/prisma/schema.prisma`：持久化欄位與刪除關聯。
- `Backend/src/auth/auth.service.ts`：註冊、session、郵件、匯出與刪除行為。
- `Backend/src/main.ts`、`Backend/src/logging.interceptor.ts`：Sentry 與 HTTP 診斷。
- `Frontend/src/main.tsx`：前端 Sentry 啟用條件。
- `Backend/src/generation/generation.service.ts`：OpenAI 內容生成。
- `docs/V1_PLAN.md`、`docs/DEPLOYMENT.md`：預計 production 架構與供應商。

「目前」表示 repo 已有對應程式碼，不代表 production 已部署；「預計」表示發布計畫中的服務或行為，仍需在部署後驗證。

## 2. 資料類別盤點

| 類別 | 具體資料 | 來源 | 用途 | 儲存／傳輸 | 目前刪除行為 |
|---|---|---|---|---|---|
| 帳號識別 | UUID、email、選填 name、role、email 驗證時間、timezone、建立／更新時間 | 使用者輸入、系統產生 | 帳號、驗證、授權、時區化學習 | PostgreSQL；email 會送至郵件供應商 | 刪除 `User` 時移除 |
| 認證秘密 | password hash、refresh token hash、驗證 token hash、重設 token hash | 使用者輸入後雜湊、系統產生後雜湊 | 登入、session、驗證、重設密碼 | PostgreSQL；密碼與 token 明文不應寫入資料庫或 log | 關聯資料隨帳號級聯刪除 |
| Session／安全 metadata | session 建立、使用、到期、撤銷時間，IP address、user agent | HTTP 請求與系統 | 維持登入、撤銷 session、安全調查 | PostgreSQL；請求經 API 託管商 | session 隨帳號級聯刪除 |
| 學習進度 | chunk ID、mastered／needsReview、複習與作答次數、mastery、stability、difficulty、dueAt、lapseCount、lastResponseMs | 使用者學習操作、系統計算 | SRS、複習排程與統計 | PostgreSQL | 隨帳號級聯刪除 |
| 每日進度 | 日期、完成數、goal、streakDay | 使用者學習操作、系統計算 | 每日目標、streak、統計 | PostgreSQL | 隨帳號級聯刪除 |
| 偏好 | dailyGoal、sound、reminder、haptic、autoNext | 使用者設定 | 個人化體驗 | PostgreSQL | 隨帳號級聯刪除 |
| Notes | English、translation、category、關聯 chunk、建立／更新時間 | 使用者輸入 | 私人學習筆記 | PostgreSQL | 隨帳號級聯刪除 |
| HTTP 診斷 | request ID、method、route、status、duration；基礎設施可能另見 IP、user agent | API 與託管層自動產生 | 除錯、效能、可靠性與安全 | 應用程式 stdout／託管商 log | **TODO／發布阻塞：**目前未定義保存與使用者刪除後清除期限 |
| 錯誤診斷 | exception、stack、環境、release，以及 SDK 為重現錯誤取得的技術 context | Web／Android／API（設定 DSN 才啟用） | crash 與錯誤修復 | 預計送至 Sentry；目前設定 `sendDefaultPii: false` | **TODO／發布阻塞：**確認實際 event 欄位、scrubbing、保存與刪除流程 |
| 管理稽核 | actor ID、action、target type／ID、before／after JSON、request ID、時間 | 管理員操作與系統 | 內容治理、安全與責任追蹤 | PostgreSQL | 刪除 actor 後只將 actor 關聯設為 null；事件與 snapshot 保留 |
| 內容生成 metadata | 管理員 ID、job 狀態、原因、錯誤、model、prompt version、token 數、估計成本 | 管理操作、系統、OpenAI 回應 | 產生與審核學習內容、成本控制 | PostgreSQL；內容 prompt／output 傳送 OpenAI | 與學習者帳號刪除通常無關；若 createdBy／稽核可識別管理員，需另訂規則 |
| 公開學習內容 | phrase、翻譯、例句、題目、答案、難度、分類、版本 snapshot | 管理員與 AI 協助生成 | 提供學習服務 | PostgreSQL、API、前端；生成階段預計經 OpenAI | 非一般使用者個人資料；依內容生命週期處理 |
| 裝置端資料 | Web cookie／memory 中的登入狀態、service worker cache；未來 Android secure storage 中的 refresh token | API、Web／App | 登入與離線載入靜態資源 | 使用者瀏覽器／裝置 | logout、密碼重設及帳號刪除應清除；**Android 尚未實作及驗證** |

## 3. Email

### 目前收集與使用

- 註冊時將 email 正規化為小寫後保存在 `User.email`，並以 unique constraint 防止重複。
- email 用於帳號識別、郵箱驗證、登入、密碼重設及帳號資料匯出。
- access token payload 目前含 email；token 不應傳送到 log、Sentry 或非必要第三方。
- Resend API 整合程式會把收件 email、寄件地址、主旨及驗證／重設連結送至郵件供應商。

### 發布阻塞

- **TODO／發布阻塞：**確認正式寄件網域、寄件地址、Resend 帳號與資料處理條款。
- **TODO／發布阻塞：**確認郵件供應商 message／delivery log 的欄位、地區及保存期限。
- **TODO／發布阻塞：**確認未驗證帳號、退信地址與濫用紀錄的清除規則。

## 4. 學習進度與偏好

進度包括個別 chunk 的 SRS 狀態、答題／複習次數、反應時間、每日完成數、目標與 streak。這些資料與 `userId` 直接關聯，用於核心學習功能，不應被描述為匿名統計。

目前沒有產品 analytics SDK。加入任何分析、廣告、歸因或 A/B 測試工具前，必須更新本盤點與隱私說明，並重新評估同意需求。

**TODO／發布阻塞：**確認 production 是否會建立彙總或去識別化學習統計；若會，定義去識別標準、用途、保存及退出機制。未確認前不得宣稱資料已匿名化。

## 5. Notes

- Notes 內容包含 `english`、`translation`、`category` 與選填的 `chunkId`；即使欄位用於學習，使用者仍可能輸入個人或敏感內容。
- Notes 只應供其擁有者透過已授權 API 存取。
- 現有 AI generation 是管理員建立公開學習內容的流程；**私人 Notes 不應加入 OpenAI prompt 或 output**。
- 帳號刪除時，Notes 透過資料庫 cascade 刪除；備份中的副本依尚未確認的備份覆寫期處理。

**TODO／發布阻塞：**在 production smoke test 驗證 Notes ownership、匯出、刪除及 log／Sentry redaction，並確認客服流程不要求使用者提交完整 Notes。

## 6. 診斷、安全與日誌

### 已見程式行為

- API 為每個請求接受或產生 request ID。
- HTTP interceptor 記錄 method、route、status、duration 與 request ID。
- API session 另將 IP address 與 user agent 保存於 PostgreSQL。
- Web 與 API 只在有 Sentry DSN 時初始化 Sentry，並設定 `sendDefaultPii: false`。
- 部署規則禁止 log 記錄 passwords、cookies、bearer／refresh／reset／verification tokens 或 raw secrets。

### 尚待驗證

- `sendDefaultPii: false` 不等於所有事件都無個人資料；exception message、URL、breadcrumb 或自訂 context 仍須實測。
- Railway、Cloudflare、Neon、Resend 與 Sentry 可能各自產生服務日誌；需以實際方案及設定盤點，而非依供應商預設猜測。V1 不以 Google Play 分發，不要把 Play vitals／Data safety 當成已存在的處理者。
- 目前未找到正式的 log retention、Sentry retention、資料主體刪除或 incident evidence hold 規則。

**TODO／發布阻塞：**在 staging 擷取實際 Sentry event 與各供應商 log 樣本，確認欄位、遮罩、存取角色、處理地區、保存期限及刪除方法；不得放入真實使用者秘密。

## 7. 保存與刪除矩陣

| 資料 | 服務使用期間 | 帳號刪除後 | 尚待確認 |
|---|---|---|---|
| 帳號、偏好、進度、Notes | 保留以提供服務 | 目前由 PostgreSQL transaction／cascade 即時刪除主要資料 | 對外完成時限、失敗重試與稽核證據 |
| Sessions、驗證／重設 token | 至到期、撤銷或帳號刪除 | 隨帳號級聯刪除 | 是否需定期清除過期紀錄 |
| 稽核事件 | 未定 | actor 關聯變 null，但事件與 before／after snapshot 留存 | snapshot 個資審核、具體保存期、法定依據 |
| 應用程式／基礎設施 log | 未定 | 不保證隨帳號同步刪除 | 各供應商保存、輪替、legal hold 與刪除流程 |
| Sentry 診斷 | 未定且僅啟用後產生 | 不保證隨帳號同步刪除 | project retention、event 刪除、user context／scrubbing |
| 郵件與 delivery metadata | 依供應商設定，未定 | 不保證隨帳號同步刪除 | Resend 保存與 suppression／退信紀錄 |
| Neon 備份／PITR | 部署文件暫定至少 14 日，但方案未確認 | 於備份輪替／覆寫後移除；restore 時需防止已刪資料重新生效 | 核准期限、restore 後 re-deletion 程序 |
| 裝置端 session／cache | 至 logout、清除 App data 或 cache 更新 | 應於成功刪除後清除 | Android secure storage 尚未實作驗證 |

不得在正式政策中使用「合理期限」代替已決定的數字。若法律允許不同期限，需逐類資料明示。

## 8. 預計第三方處理者

下列為架構計畫，不代表 production 已簽約、已啟用或已公開：

| 預計供應商 | 預計角色／資料 | 狀態與發布前查核 |
|---|---|---|
| Neon | PostgreSQL 帳號、email、進度、Notes、sessions、稽核、內容及備份 | 預計；確認實體、地區、DPA、加密、PITR／備份保存與刪除 |
| Railway | 執行 API／worker；處理請求內容、IP、user agent，產生 runtime log | 預計；確認地區、DPA、log 欄位／保存、存取控制與刪除 |
| Cloudflare Pages | Web 靜態內容與邊緣請求 metadata | 預計；確認實際產品、地區／跨境機制、Web analytics 是否關閉、log 保存 |
| Resend | email、寄件資料、驗證／重設郵件與 delivery metadata | 程式已整合，production 未確認；確認寄件身份、DPA、地區、保存與 suppression 資料 |
| Sentry | Web／Android／API error、stack、breadcrumbs、版本與技術 context | SDK 已加入但 DSN 條件啟用；確認 data scrubbing、sample rate、session replay 是否關閉、地區與保存 |
| OpenAI | 管理員發起的學習內容 prompt／output、model 與 usage metadata | 程式已整合，production 未確認；不得傳送私人 Notes 或帳號資料；確認 API data controls、地區、保存與 DPA |
| （不適用）Google Play | V1 不上架，不以 Play 分發 APK | 不要建立 Console 資源，也不要盤點不存在的 Play 診斷資料 |

**TODO／發布阻塞：**填入每個實際處理者的完整締約法律實體、正式隱私 URL／DPA URL、資料處理地區、子處理者、保存期限、刪除機制與跨境傳輸依據。未知資料不得猜測。

## 9. 私下分發前資料核對

在把 signed APK 傳給他人前逐項完成：

- [ ] 在 release APK 與 production Web bundle 盤點所有 SDK／Capacitor plugins，不只依 `package.json`。
- [ ] 以真實 network capture 驗證哪些資料離開裝置及目的網域。
- [ ] 區分「收集」、「分享」、暫時處理、必要／選填，以及使用者可否選擇。
- [ ] 確認資料是否傳輸加密，以及受邀者如何要求刪除帳號。
- [ ] 對照 Privacy、Terms、Support、Account deletion 頁面與 App 內實際畫面。
- [ ] 確認沒有未盤點的 analytics、ads、crash replay、push、TTS 或 secure-storage SDK。
- [ ] 記錄每個答案的程式碼、供應商設定或合約證據與查核日期。
- [ ] 不要填寫或提交 Google Play Data safety。

## 10. 全域發布阻塞

1. 營運者法律名稱、司法地區、正式地址／聯絡方式未確認。
2. Privacy、Terms、Support 與 Account deletion 說明尚未對受邀者定稿（私下分發可用較短版本，但仍須與實際行為一致）。
3. 外部帳號刪除請求及身份驗證流程尚未實作／實測。
4. active DB、audit、logs、Sentry、email 與 backups 的具體保存期限未核准。
5. production 第三方處理者、法律實體、DPA、地區與跨境機制未確認。
6. Android 尚未建立，裝置端儲存、plugins、permissions 尚無 signed APK 可驗證。
7. 法律依據、使用者權利、年齡、準據法、爭議與法定保留例外需由合資格顧問按確定司法地區審閱。

上述阻塞解除前，本文件及四個靜態頁都應維持草稿／未發布標示，且不得作為「合規已完成」的證據。
