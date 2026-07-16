import { Card, Label, Button, XpDots } from "../../ui";
import { C } from "../../../constants/designToken";

export interface EmptyStateProps {
  onDraw: () => void;
  done: number;
  goal: number;
  loading: boolean;
}

export function EmptyState({ onDraw, done, goal, loading }: EmptyStateProps) {
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
        {[
          { icon: "📚", value: "47", label: "Learned" },
          { icon: "🔥", value: "12", label: "Day Streak" },
          { icon: "🏅", value: "3", label: "Mastered" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              backgroundColor: C.surface,
              borderRadius: 16,
              padding: "14px 10px",
              boxShadow: `0 4px 0 ${C.dim}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 20, color: C.white }}>
              {s.value}
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.gray,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Today's dots */}
      <Card>
        <Label color={C.purple}>🎯 Today's goal</Label>
        <XpDots filled={done} total={goal} color={C.green} />
        <p
          style={{
            color: C.gray,
            fontSize: 12,
            fontWeight: 700,
            margin: "10px 0 0",
          }}
        >
          {done < goal
            ? `${goal - done} more chunks to hit your daily goal!`
            : "🎉 Daily goal smashed! Keep going!"}
        </p>
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