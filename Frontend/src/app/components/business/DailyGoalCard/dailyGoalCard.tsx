import type { CSSProperties } from "react";
import { Card, Label, StepBtn } from "../../ui";
import { C } from "../../../constants/designToken";

const PRESETS = [3, 5, 7, 10, 15] as const;

export interface DailyGoalCardProps {
  goal: number;
  onChange: (goal: number) => void;
  min?: number;
  max?: number;
  style?: CSSProperties;
}

export function DailyGoalCard({
  goal,
  onChange,
  min = 1,
  max = 20,
  style,
}: DailyGoalCardProps) {
  return (
    <Card style={{ marginBottom: 12, ...style }}>
      <Label color={C.blue}>🎯 Daily Chunk Goal</Label>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <StepBtn icon="−" onClick={() => onChange(Math.max(min, goal - 1))} />
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
        <StepBtn icon="+" onClick={() => onChange(Math.min(max, goal + 1))} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
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
  );
}
