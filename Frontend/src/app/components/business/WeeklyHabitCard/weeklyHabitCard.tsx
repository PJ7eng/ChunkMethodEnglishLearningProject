import type { CSSProperties } from "react";
import { Card, Label } from "../../ui";
import { C } from "../../../constants/designToken";

export interface HabitDay {
  day: string;
  done: boolean;
  count: number;
}

export interface WeeklyHabitCardProps {
  days?: readonly HabitDay[];
  style?: CSSProperties;
}

export function WeeklyHabitCard({
  days,
  style,
}: WeeklyHabitCardProps) {
  const data = days ?? [];
  const weeklyDone = data.filter((d) => d.done).length;

  return (
    <Card style={{ marginBottom: 12, ...style }}>
      <Label color={C.orange}>🔥 This Week's Habit</Label>
      {data.length === 0 ? (
        <div style={{ color: C.gray, padding: "8px 0 16px", fontWeight: 700 }}>
          目前沒有習慣資料
        </div>
      ) : <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
        {data.map((d, i) => (
          <div
            key={`${d.day}-${i}`}
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
      </div>}
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
  );
}
