import { useState } from "react";
import {
  resendVerificationEmail,
  resetPassword,
  userFacingError,
  validateEmail,
  validatePassword,
  verifyEmail,
} from "../../api";
import { C } from "../../constants/designToken";
import { LoginBtn } from "../../components";

type Busy = "verify" | "reset" | "resend" | null;

export function AccountActionScreen({ onDone }: { onDone: () => void }) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const isVerify = window.location.pathname.includes("verify-email");
  const [password, setPassword] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">(
    token ? "idle" : "error",
  );
  const [message, setMessage] = useState(
    !token
      ? "連結缺少 token，請重新申請郵件。"
      : isVerify
        ? "請確認這是你的 ChunkMaster 信箱，再點擊下方按鈕完成驗證。開啟此頁不會自動驗證。"
        : "請輸入新密碼。",
  );

  async function confirmVerify() {
    if (!token || busy) return;
    setBusy("verify");
    setMessage("正在驗證電子郵件…");
    try {
      await verifyEmail(token);
      setMessage("信箱已驗證。可以返回登入。");
      setStatus("success");
    } catch (error) {
      setMessage(userFacingError(error, "驗證失敗"));
      setStatus("error");
    } finally {
      setBusy(null);
    }
  }

  async function submitReset() {
    if (!token || busy) return;
    const error = validatePassword(password);
    if (error) {
      setMessage(error);
      return;
    }
    setBusy("reset");
    setMessage("正在更新密碼…");
    try {
      const result = await resetPassword(token, password);
      setMessage(result.message);
      setStatus("success");
      setPassword("");
    } catch (error) {
      setMessage(userFacingError(error, "重設失敗"));
      setStatus("error");
    } finally {
      setBusy(null);
    }
  }

  async function resend() {
    if (busy) return;
    const emailErr = validateEmail(resendEmail);
    if (emailErr) {
      setMessage("請先輸入有效的電子郵件。");
      setStatus("error");
      return;
    }
    setBusy("resend");
    setMessage("正在寄送驗證信…");
    try {
      await resendVerificationEmail(resendEmail);
      setMessage("若此信箱尚未驗證，我們已寄出新的驗證信。請改用新信中的連結。");
      setStatus("success");
    } catch (error) {
      setMessage(userFacingError(error, "無法寄送驗證信"));
      setStatus("error");
    } finally {
      setBusy(null);
    }
  }

  const showResend = isVerify && (status === "error" || busy === "resend");

  return (
    <main style={{ minHeight: "100dvh", maxHeight: "100dvh", overflowY: "auto", background: C.bg, color: C.white, display: "grid", placeItems: "center", padding: "calc(var(--safe-top) + 20px) 20px calc(var(--safe-bottom) + 20px)" }}>
      <section style={{ width: "100%", maxWidth: 400, background: C.surface, borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{isVerify ? "驗證電子郵件" : "重設密碼"}</h1>
        {!isVerify && status !== "success" && (
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 8 個字元"
            autoComplete="new-password"
            style={{ width: "100%", padding: 12, marginBottom: 0, boxSizing: "border-box" }}
          />
        )}
        <p
          role={status === "error" ? "alert" : "status"}
          style={{ color: status === "error" ? C.red : status === "success" ? C.green : C.gray, margin: 0 }}
        >
          {message}
        </p>
        {isVerify && status !== "success" && token && (
          <LoginBtn
            variant="primary"
            fullWidth
            disabled={Boolean(busy)}
            onClick={() => void confirmVerify()}
          >
            {busy === "verify" ? "驗證中…" : "確認驗證信箱"}
          </LoginBtn>
        )}
        {showResend && (
          <>
            <input
              type="email"
              value={resendEmail}
              onChange={(event) => setResendEmail(event.target.value)}
              placeholder="輸入註冊信箱以重寄驗證信"
              autoComplete="email"
              style={{ width: "100%", padding: 12, boxSizing: "border-box" }}
            />
            <LoginBtn
              variant="ghost"
              fullWidth
              disabled={Boolean(busy)}
              onClick={() => void resend()}
            >
              {busy === "resend" ? "寄送中…" : "重寄驗證信"}
            </LoginBtn>
          </>
        )}
        {!isVerify && status !== "success" && (
          <LoginBtn
            variant="primary"
            fullWidth
            disabled={Boolean(busy) || !token}
            onClick={() => void submitReset()}
          >
            {busy === "reset" ? "更新中…" : "更新密碼"}
          </LoginBtn>
        )}
        <LoginBtn variant="ghost" fullWidth disabled={Boolean(busy)} onClick={onDone}>
          返回登入
        </LoginBtn>
      </section>
    </main>
  );
}
