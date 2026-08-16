import { useEffect, useState } from "react";
import { resetPassword, validatePassword, verifyEmail } from "../../api";
import { C } from "../../constants/designToken";

export function AccountActionScreen({ onDone }: { onDone: () => void }) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const isVerify = window.location.pathname.includes("verify-email");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(isVerify ? "正在驗證電子郵件…" : "");
  const [busy, setBusy] = useState(isVerify);

  useEffect(() => {
    if (!isVerify) return;
    void verifyEmail(token)
      .then((result) => setMessage(result.message))
      .catch((error) => setMessage(error instanceof Error ? error.message : "驗證失敗"))
      .finally(() => setBusy(false));
  }, [isVerify, token]);

  async function submit() {
    const error = validatePassword(password);
    if (error) {
      setMessage(error);
      return;
    }
    setBusy(true);
    try {
      const result = await resetPassword(token, password);
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "重設失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100svh", background: C.bg, color: C.white, display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 400, background: C.surface, borderRadius: 18, padding: 24 }}>
        <h1>{isVerify ? "驗證電子郵件" : "重設密碼"}</h1>
        {!isVerify && (
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 8 個字元"
            style={{ width: "100%", padding: 12, marginBottom: 12 }}
          />
        )}
        <p role="status" style={{ color: C.gray }}>{message}</p>
        {!isVerify && <button disabled={busy} onClick={() => void submit()}>更新密碼</button>}
        <button disabled={busy} onClick={onDone} style={{ marginLeft: 8 }}>返回登入</button>
      </section>
    </main>
  );
}
