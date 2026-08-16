import { useEffect, useState } from "react";
import { Card, Label, Toggle, Button, BackButton } from "../../components";
import { deleteAccount, exportAccount, getPreferences, updatePreferences, type PreferencesResponse } from "../../api";
import { C } from "../../constants/designToken";

export interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onPreferencesChange?: (prefs: PreferencesResponse) => void;
}

export function SettingsScreen({
  onBack,
  onLogout,
  onPreferencesChange,
}: SettingsScreenProps) {
  const [sound, setSound] = useState(true);
  const [remind, setRemind] = useState(true);
  const [haptic, setHaptic] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

  useEffect(() => {
    getPreferences()
      .then((p) => {
        setSound(p.soundEnabled);
        setRemind(p.reminderEnabled);
        setHaptic(p.hapticEnabled);
        setAutoNext(p.autoNextEnabled);
        onPreferencesChange?.(p);
      })
      .catch(() => undefined);
  }, []);

  async function patch(partial: Partial<PreferencesResponse>) {
    setSaving(true);
    try {
      const next = await updatePreferences(partial);
      setSound(next.soundEnabled);
      setRemind(next.reminderEnabled);
      setHaptic(next.hapticEnabled);
      setAutoNext(next.autoNextEnabled);
      onPreferencesChange?.(next);
    } catch {
      /* keep local */
    } finally {
      setSaving(false);
    }
  }

  async function downloadAccount() {
    const data = await exportAccount();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "chunkmaster-account.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function removeAccount() {
    const password = window.prompt("輸入密碼以永久刪除帳號");
    if (!password) return;
    try {
      await deleteAccount(password);
      onLogout();
    } catch (error) {
      setAccountMessage(error instanceof Error ? error.message : "刪除帳號失敗");
    }
  }

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        padding: "36px 20px 28px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr 36px",
          alignItems: "center",
          marginBottom: 20,
          flexShrink: 0,
        }}
      >
        <BackButton onClick={onBack} />
        <h2
          style={{
            margin: 0,
            textAlign: "center",
            color: C.white,
            fontWeight: 900,
            fontSize: 22,
          }}
        >
          Settings
        </h2>
        <div />
      </div>

      <Card style={{ marginBottom: 12 }}>
        <Label color={C.purple}>⚙️ Preferences</Label>
        {[
          {
            label: "Sound Effects",
            sub: "Play sounds on correct answers",
            icon: "🔊",
            val: sound,
            set: () => patch({ soundEnabled: !sound }),
          },
          {
            label: "Daily Reminders",
            sub: "Notify me to keep my streak alive",
            icon: "🔔",
            val: remind,
            set: () => setAccountMessage("Daily Reminders 將在 V1.1 提供。"),
          },
          {
            label: "Haptic Feedback",
            sub: "Vibrate on interactions (mobile)",
            icon: "📳",
            val: haptic,
            set: () => setAccountMessage("Haptic Feedback 將在原生版本提供。"),
          },
          {
            label: "Auto-Next Card",
            sub: "Skip animation, go straight to next",
            icon: "⚡",
            val: autoNext,
            set: () => patch({ autoNextEnabled: !autoNext }),
          },
        ].map((item, i) => (
          <div key={item.label}>
            {i > 0 && (
              <div
                style={{ height: 1, backgroundColor: C.surface3, margin: "13px 0" }}
              />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: C.surface3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                  boxShadow: `0 3px 0 ${C.dim}`,
                }}
              >
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.white, fontWeight: 800, fontSize: 14 }}>
                  {item.label}
                </div>
                <div
                  style={{
                    color: C.gray,
                    fontSize: 11,
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                >
                  {item.sub}
                </div>
              </div>
              <Toggle on={item.val} onChange={item.set} />
            </div>
          </div>
        ))}
        {saving && (
          <div style={{ color: C.gray, fontSize: 11, fontWeight: 700, marginTop: 10 }}>
            Saving...
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Label color={C.blue}>🔐 Account & Privacy</Label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => void downloadAccount()}>匯出我的資料</button>
          <button onClick={() => void removeAccount()} style={{ color: C.red }}>刪除帳號</button>
          <a href="/privacy.html" target="_blank" rel="noreferrer">隱私政策</a>
          <a href="/terms.html" target="_blank" rel="noreferrer">使用條款</a>
        </div>
        {accountMessage && <p style={{ color: C.orange }}>{accountMessage}</p>}
      </Card>

      <Button
        label="Log Out"
        bg={C.red}
        shadow="#C0392B"
        size="md"
        full
        onClick={onLogout}
        style={{ marginBottom: 16 }}
      />

      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: C.surface,
            borderRadius: 12,
            padding: "8px 14px",
            boxShadow: `0 3px 0 ${C.dim}`,
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>🌍</span>
          <span style={{ fontWeight: 900, fontSize: 14 }}>
            <span style={{ color: C.green }}>Chunk</span>
            <span style={{ color: C.white }}>Master</span>
          </span>
          <span style={{ color: C.gray, fontSize: 11, fontWeight: 700 }}>v1.0.0</span>
        </div>
        <div style={{ color: C.gray, fontSize: 11, fontWeight: 700 }}>
          Built for ambitious language learners ✨
        </div>
      </div>
    </div>
  );
}
