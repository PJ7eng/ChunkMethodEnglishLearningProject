# 📝 項目開發與個人待辦事項 (TODO List)

> **最後更新時間**：2026-09-11  
> 給 Agent 的完整交接以 [progress.md](progress.md) 第六節與 [V1_PLAN.md](V1_PLAN.md) 第 15 節為準。

## 下一刀（擋 M4 勾選）— 程式已完成，待營運者真實驗收

- [x] 驗證頁改成按鈕「確認驗證信箱」，不要一進 `/verify-email` 就 POST（否則 Gmail／掃描器會先用掉 token）。
- [x] 後端 `verifyEmail` 冪等：token 已用過且該帳已驗證 → 回成功，不要報過期。
- [x] （可選）重寄驗證信 API；登入頁與驗證失敗頁可重寄。
- [ ] 用**新信箱**走通：註冊 → 信 → 按鈕驗證 → 登入。`REQUIRE_EMAIL_VERIFICATION` 修好前保持 false。
- [ ] 覆蓋安裝（不卸載再 Run）仍登入——若尚未測。

## 可後補

- Access token 過期後回到登入頁，避免無登入狀態繼續操作。
- 驗證／重設頁 UI 重構。
- Neon 備份還原、支援信箱、DEPLOYMENT 實網址。
- Admin 審核累積 300–500 chunks（M5）。
- Signed APK（M6）。不要改 `appId`。
