import { useState } from "react";
import { Card, Label, Toggle, StepBtn } from "../../components";
import { WEEK_DATA } from "../../constants/weekData";
import { C } from "../../constants/designToken";

export function SettingsScreen() {
  const [goal, setGoal] = useState(5);
  const [sound, setSound] = useState(true);
  const [remind, setRemind] = useState(true);
  const [haptic, setHaptic] = useState(false);
  const [autoNext, setAutoNext] = useState(false);

  const longestStreak = 18;
  const totalChunks = 47;
  const weeklyDone = WEEK_DATA.filter((d) => d.done).length;

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "14px 20px 28px",
      }}
    >
      <h2 style={{ color: C.white, fontWeight: 900, fontSize: 22, margin: "0 0 16px" }}>
        Settings
      </h2>

      {/* ── Weekly habit grid ── */}
      <Card style={{ marginBottom: 12 }}>
        <Label color={C.orange}>🔥 This Week's Habit</Label>
        <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
          {WEEK_DATA.map((d, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  borderRadius: 12,
                  background: d.done
                    ? `linear-gradient(135deg, ${C.green}, #89E219)`
                    : d.count > 0
                    ? "#1A3A1A"
                    : C.surface3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: d.done ? `0 3px 0 ${C.greenDark}` : `0 3px 0 ${C.dim}`,
                  fontSize: 12,
                  fontWeight: 900,
                  color: d.done ? C.white : d.count > 0 ? C.green : C.gray,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {d.done ? "✓" : d.count > 0 ? d.count : ""}
                {d.done && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: d.done ? C.green : C.gray,
                  fontWeight: 900,
                }}
              >
                {d.day}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            padding: "10px 14px",
            background: `linear-gradient(135deg, #1A3A1A, #0D2210)`,
            borderRadius: 11,
            border: `1.5px solid ${C.green}33`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>🏆</span>
          <span style={{ color: C.green, fontWeight: 800, fontSize: 13 }}>
            {weeklyDone}-day streak this week! Keep going!
          </span>
        </div>
      </Card>

      {/* ── Stats row ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {[
          { label: "Total Chunks", value: totalChunks, color: C.blue, icon: "📚" },
          {
            label: "Best Streak",
            value: `${longestStreak}🔥`,
            color: C.orange,
            icon: "🏅",
          },
          {
            label: "This Week",
            value: `${WEEK_DATA.reduce((s, d) => s + d.count, 0)}`,
            color: C.purple,
            icon: "📅",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              backgroundColor: C.surface,
              borderRadius: 15,
              padding: "13px 8px",
              boxShadow: `0 4px 0 ${C.dim}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 17, color: s.color }}>
              {s.value}
            </div>
            <div
              style={{
                fontSize: 9,
                color: C.gray,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginTop: 2,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Daily goal stepper ── */}
      <Card style={{ marginBottom: 12 }}>
        <Label color={C.blue}>🎯 Daily Chunk Goal</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <StepBtn icon="−" onClick={() => setGoal((g) => Math.max(1, g - 1))} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontWeight: 900,
                fontSize: 52,
                lineHeight: 1,
                background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {goal}
            </div>
            <div style={{ color: C.gray, fontSize: 13, fontWeight: 700, marginTop: 4 }}>
              chunks per day
            </div>
          </div>
          <StepBtn icon="+" onClick={() => setGoal((g) => Math.min(20, g + 1))} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[3, 5, 7, 10, 15].map((n) => (
            <button
              key={n}
              onClick={() => setGoal(n)}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 11,
                backgroundColor: goal === n ? "#1A2A3A" : C.surface3,
                border: `2px solid ${goal === n ? C.blue : "transparent"}`,
                color: goal === n ? C.blue : C.gray,
                fontWeight: 900,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
                transition: "all 0.15s ease",
                boxShadow:
                  goal === n ? `0 3px 0 ${C.blueDark}44` : `0 3px 0 ${C.dim}`,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Toggle preferences ── */}
      <Card style={{ marginBottom: 12 }}>
        <Label color={C.purple}>⚙️ Preferences</Label>
        {[
          {
            label: "Sound Effects",
            sub: "Play sounds on correct answers",
            icon: "🔊",
            val: sound,
            set: () => setSound((v) => !v),
          },
          {
            label: "Daily Reminders",
            sub: "Notify me to keep my streak alive",
            icon: "🔔",
            val: remind,
            set: () => setRemind((v) => !v),
          },
          {
            label: "Haptic Feedback",
            sub: "Vibrate on interactions (mobile)",
            icon: "📳",
            val: haptic,
            set: () => setHaptic((v) => !v),
          },
          {
            label: "Auto-Next Card",
            sub: "Skip animation, go straight to next",
            icon: "⚡",
            val: autoNext,
            set: () => setAutoNext((v) => !v),
          },
        ].map((item, i, arr) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, backgroundColor: C.surface3, margin: "13px 0" }} />}
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
      </Card>

      {/* ── App info ── */}
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
          <span style={{ color: C.gray, fontSize: 11, fontWeight: 700 }}>
            v1.0.0
          </span>
        </div>
        <div style={{ color: C.gray, fontSize: 11, fontWeight: 700 }}>
          Built for ambitious language learners ✨
        </div>
      </div>
    </div>
  );
}