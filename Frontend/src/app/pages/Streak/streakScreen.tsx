import { Card, Calendar } from "../../components";
import { usePress } from "../../hooks/usePress";
import { C } from "../../constants/designToken";

export interface StreakScreenProps {
  onBack: () => void;
}

const STREAK_DAYS = 12;
const TOTAL_PRACTICED = 47;
const DAY_PRACTICED = 8;

function BackButton({ onClick }: { onClick: () => void }) {
  const { pressed, handlers } = usePress();
  const lift = pressed ? 3 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      {...handlers}
      aria-label="Go back"
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        border: "none",
        backgroundColor: C.surface,
        color: C.white,
        fontSize: 18,
        fontWeight: 900,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 ${4 - lift}px 0 ${C.dim}`,
        transform: `translateY(${lift}px)`,
        transition: "transform 0.08s ease, box-shadow 0.08s ease",
        WebkitTapHighlightColor: "transparent",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      ←
    </button>
  );
}

function StatMiniCard({ value, label }: { value: number; label: string }) {
  return (
    <Card style={{ flex: 1, padding: "8px 16px 14px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>🔥</span>
        <div style={{ fontWeight: 900, fontSize: 22, color: C.white, lineHeight: 1.1 }}>
          {value}
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.gray, marginTop: 2 }}>
        {label}
      </div>
    </Card>
  );
}

export function StreakScreen({ onBack }: StreakScreenProps) {
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
      {/* Top bar */}
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
          Streak
        </h2>
        <div />
      </div>

      {/* Streak hero */}
      <Card
        style={{
          marginBottom: 16,
          padding: "48px 24px",
          backgroundColor: "transparent",
          background: `linear-gradient(135deg, ${C.orange} 0%, ${C.bg} 100%)`,
          border: "1px solid rgba(255, 255, 255, 0.28)",
          boxShadow: `
            0 6px 0 ${C.dim},
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2)
          `,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 64,
                color: C.white,
                lineHeight: 1,
                marginBottom: 2,
              }}
            >
              {STREAK_DAYS}
            </div>
            <div style={{ fontWeight: 900, fontSize: 18, color: C.white }}>
              day Streak!
            </div>
          </div>
          <span style={{ fontSize: 72, lineHeight: 1 }}>🔥</span>
        </div>
      </Card>

      {/* Motivation card */}
      <Card style={{ marginBottom: 12, padding: "24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontSize: 40, lineHeight: 1, flexShrink: 0 }}>🔥</span>
          <p
            style={{
              margin: 0,
              color: C.white,
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.45,
            }}
          >
            Keep your{" "}
            <span style={{ color: C.orange }}>Perfect Streak flame</span> by doing a
            lesson every day!
          </p>
        </div>
      </Card>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <StatMiniCard value={TOTAL_PRACTICED} label="Total Practiced" />
        <StatMiniCard value={DAY_PRACTICED} label="Day Practiced" />
      </div>

      {/* Calendar */}
      <Calendar />
    </div>
  );
}
