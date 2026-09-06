import { useEffect, useState } from "react";
import { C } from "../constants/designToken";

export function NetworkStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "var(--safe-top)",
        left: 12,
        right: 12,
        zIndex: 100,
        padding: "10px 14px",
        borderRadius: 12,
        background: C.orange,
        color: C.bg,
        fontWeight: 900,
        textAlign: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,.35)",
      }}
    >
      目前離線；連線恢復前不會儲存變更。
    </div>
  );
}
