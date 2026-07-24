import type { CSSProperties } from "react";
import { Card, Button } from "../../ui";
import { usePress } from "../../../hooks/usePress";
import { C } from "../../../constants/designToken";

export interface EmptyStateProps {
  onDraw: () => void;
  loading: boolean;
  learnedCount?: number;
  streakCount?: number;
  masteredCount?: number;
  onLearnedClick?: () => void;
  onStreakClick?: () => void;
  onMasteredClick?: () => void;
  onStartChallenge?: () => void;
}

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  onClick?: () => void;
}

function StatCard({ icon, value, label, onClick }: StatCardProps) {
  const { pressed, handlers } = usePress();
  const lift = onClick && pressed ? 4 : 0;

  const content = (
    <>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 900, fontSize: 20, color: C.white }}>{value}</div>
      <div
        style={{
          fontSize: 10,
          color: C.gray,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
    </>
  );

  const baseStyle: CSSProperties = {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: "14px 10px",
    boxShadow: `0 ${4 - lift}px 0 ${C.dim}`,
    transform: `translateY(${lift}px)`,
    textAlign: "center",
    transition: "transform 0.08s ease, box-shadow 0.08s ease",
    WebkitTapHighlightColor: "transparent",
    fontFamily: "'Nunito', sans-serif",
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        {...handlers}
        style={{
          ...baseStyle,
          border: "none",
          cursor: "pointer",
        }}
      >
        {content}
      </button>
    );
  }

  return <div style={baseStyle}>{content}</div>;
}

export function EmptyState({
  onDraw,
  loading,
  learnedCount = 47,
  streakCount = 12,
  masteredCount = 3,
  onLearnedClick,
  onStreakClick,
  onMasteredClick,
  onStartChallenge,
}: EmptyStateProps) {
  const stats = [
    { icon: "📚", value: learnedCount, label: "Learned", onClick: onLearnedClick },
    { icon: "🔥", value: streakCount, label: "Day Streak", onClick: onStreakClick },
    { icon: "🏅", value: masteredCount, label: "Mastered", onClick: onMasteredClick },
  ];

  return (
    <>
      {/* Hero draw area */}
      <Card style={{ textAlign: "center", padding: "32px 20px" }}>
        <div style={{ fontSize: 60, marginBottom: 12, lineHeight: 1 }}>🎴</div>
        <h2
          style={{
            color: C.white,
            fontWeight: 900,
            fontSize: 22,
            margin: "0 0 8px",
          }}
        >
          Ready to learn?
        </h2>
        <p
          style={{
            color: C.gray,
            fontSize: 14,
            fontWeight: 600,
            margin: "0 0 24px",
            lineHeight: 1.6,
          }}
        >
          Draw a chunk, learn its meaning, and practise using it in context.
        </p>
        <Button
          label={loading ? "Loading..." : "Draw a Chunk"}
          icon="✨"
          bg={C.green}
          shadow={C.greenDark}
          size="xl"
          full
          onClick={onDraw}
          disabled={loading}
        />
      </Card>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 10 }}>
        {stats.map((s) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            value={s.value}
            label={s.label}
            onClick={s.onClick}
          />
        ))}
      </div>

      {/* Start Challenge */}
      <Card style={{ padding: "18px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${C.purple}33, ${C.blue}22)`,
              border: `1.5px solid ${C.purple}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            🧩
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: C.white,
                fontWeight: 900,
                fontSize: 16,
                lineHeight: 1.2,
                marginBottom: 4,
              }}
            >
              Start Challenge
            </div>
            <div
              style={{
                color: C.gray,
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              Ready for today's challenge?
            </div>
          </div>
          <Button
            label="Start"
            bg={C.purple}
            shadow={C.purpleDk}
            size="sm"
            onClick={onStartChallenge}
            style={{ flexShrink: 0 }}
          />
        </div>
      </Card>

      {/* Quick hint */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: C.blue + "14",
          borderRadius: 14,
          border: `1.5px solid ${C.blue}33`,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <span style={{ color: C.gray, fontSize: 12, fontWeight: 700, lineHeight: 1.5 }}>
          <span style={{ color: C.blue }}>Chunking tip:</span> Learn phrases as whole
          units, not word-by-word. Your brain stores them like muscle memory!
        </span>
      </div>
    </>
  );
}
