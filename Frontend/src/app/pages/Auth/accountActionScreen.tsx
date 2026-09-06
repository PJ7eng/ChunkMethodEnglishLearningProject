import { useEffect, useState } from "react";
import { resetPassword, validatePassword, verifyEmail } from "../../api";
import { C } from "../../constants/designToken";

export function AccountActionScreen({ onDone }: { onDone: () => void }) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const isVerify = window.location.pathname.includes("verify-email");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    isVerify ? "loading" : token ? "idle" : "error",
  );
  const [message, setMessage] = useState(
    token ? (isVerify ? "正在驗證電子郵件…" : "請輸入新密碼。") : "連結缺少 token，請重新申請郵件。",
  );

  useEffect(() => {
    if (!isVerify || !token) return;
    setStatus("loading");
    void verifyEmail(token)
      .then((result) => {
        setMessage(result.message);
        setStatus("success");
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "驗證失敗");
        setStatus("error");
      });
  }, [isVerify, token]);

  async function submit() {
    if (!token) return;
    const error = validatePassword(password);
    if (error) {
      setMessage(error);
      return;
    }
    setStatus("loading");
    setMessage("正在更新密碼…");
    try {
      const result = await resetPassword(token, password);
      setMessage(result.message);
      setStatus("success");
      setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "重設失敗");
      setStatus("error");
    }
  }

  return (
    <main style={{ minHeight: "100dvh", maxHeight: "100dvh", overflowY: "auto", background: C.bg, color: C.white, display: "grid", placeItems: "center", padding: "calc(var(--safe-top) + 20px) 20px calc(var(--safe-bottom) + 20px)" }}>
      <section style={{ width: "100%", maxWidth: 400, background: C.surface, borderRadius: 18, padding: 24 }}>
        <h1>{isVerify ? "驗證電子郵件" : "重設密碼"}</h1>
        {!isVerify && status !== "success" && (
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 8 個字元"
            autoComplete="new-password"
            style={{ width: "100%", padding: 12, marginBottom: 12 }}
          />
        )}
        <p
          role={status === "error" ? "alert" : "status"}
          style={{ color: status === "error" ? C.red : status === "success" ? C.green : C.gray }}
        >
          {message}
        </p>
        {!isVerify && status !== "success" && (
          <button disabled={status === "loading" || !token} onClick={() => void submit()}>
            {status === "loading" ? "更新中…" : "更新密碼"}
          </button>
        )}
        <button disabled={status === "loading"} onClick={onDone} style={{ marginLeft: 8 }}>返回登入</button>
      </section>
    </main>
  );
}
