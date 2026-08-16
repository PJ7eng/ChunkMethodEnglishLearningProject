import { useMemo, useState, type CSSProperties } from "react";
import { Card, Label } from "../../ui";
import { CATEGORIES } from "../../../constants/categories";
import { C } from "../../../constants/designToken";

export type PieChartMode = "learned" | "mastered" | "notes";

export interface CategorySlice {
  id: string;
  value: number;
}

export interface CategoryPieChartProps {
  learned?: CategorySlice[];
  mastered?: CategorySlice[];
  notes?: CategorySlice[];
  defaultMode?: PieChartMode;
  style?: CSSProperties;
}

const MODE_META: {
  id: PieChartMode;
  label: string;
  emoji: string;
}[] = [
  { id: "learned", label: "Learned", emoji: "📚" },
  { id: "mastered", label: "Mastered", emoji: "🏅" },
  { id: "notes", label: "Notes", emoji: "📝" },
];

const SIZE = 200;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 78;
const INNER_R = 42;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutPath(
  cx: number,
  cy: number,
  r: number,
  innerR: number,
  startAngle: number,
  endAngle: number
) {
  const large = endAngle - startAngle > 180 ? 1 : 0;
  const s = polar(cx, cy, r, endAngle);
  const e = polar(cx, cy, r, startAngle);
  const si = polar(cx, cy, innerR, endAngle);
  const ei = polar(cx, cy, innerR, startAngle);
  return [
    `M ${s.x} ${s.y}`,
    `A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${innerR} ${innerR} 0 ${large} 1 ${si.x} ${si.y}`,
    "Z",
  ].join(" ");
}

function resolveMeta(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function CategoryPieChart({
  learned = [],
  mastered = [],
  notes = [],
  defaultMode = "learned",
  style,
}: CategoryPieChartProps) {
  const [mode, setMode] = useState<PieChartMode>(defaultMode);

  const slices = useMemo(() => {
    const raw =
      mode === "learned" ? learned : mode === "mastered" ? mastered : notes;
    return raw
      .map((s) => ({ ...s, meta: resolveMeta(s.id) }))
      .filter((s) => s.value > 0);
  }, [mode, learned, mastered, notes]);

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  const arcs = useMemo(() => {
    if (total === 0) return [];
    let angle = 0;
    return slices.map((s) => {
      const span = (s.value / total) * 360;
      // Avoid full-circle arc edge case
      const start = angle;
      const end = angle + Math.min(span, 359.99);
      angle += span;
      const mid = start + span / 2;
      const labelPos = polar(CX, CY, (R + INNER_R) / 2, mid);
      return { ...s, start, end, labelPos, span };
    });
  }, [slices, total]);

  return (
    <Card style={{ marginBottom: 12, ...style }}>
      <Label color={C.purple}>📊 Category Mix</Label>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {MODE_META.map((m) => {
          const on = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              style={{
                flex: 1,
                minWidth: 90,
                padding: "8px 10px",
                borderRadius: 12,
                border: on ? `2px solid ${C.purple}` : "2px solid transparent",
                backgroundColor: on ? "#2A1A3A" : C.surface3,
                color: on ? C.purple : C.gray,
                fontWeight: 800,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
                boxShadow: on ? `0 3px 0 ${C.purpleDk}55` : `0 3px 0 ${C.dim}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ position: "relative", width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {/* Soft cartoon outline ring */}
            <circle
              cx={CX}
              cy={CY}
              r={R + 4}
              fill={C.surface3}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={3}
            />
            {total === 0 ? (
              <circle cx={CX} cy={CY} r={R} fill={C.surface3} />
            ) : arcs.length === 1 ? (
              <>
                <circle cx={CX} cy={CY} r={R} fill={arcs[0].meta.color} />
                <circle cx={CX} cy={CY} r={INNER_R} fill={C.surface} />
              </>
            ) : (
              arcs.map((a) => (
                <path
                  key={a.id}
                  d={donutPath(CX, CY, R, INNER_R, a.start, a.end)}
                  fill={a.meta.color}
                  stroke={C.surface}
                  strokeWidth={3}
                />
              ))
            )}
            <circle cx={CX} cy={CY} r={INNER_R - 2} fill={C.surface} />
            {arcs.map(
              (a) =>
                a.span >= 28 && (
                  <text
                    key={`${a.id}-emoji`}
                    x={a.labelPos.x}
                    y={a.labelPos.y + 5}
                    textAnchor="middle"
                    fontSize="16"
                  >
                    {a.meta.emoji}
                  </text>
                )
            )}
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 22, color: C.white, lineHeight: 1 }}>
              {total}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: C.gray,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginTop: 2,
              }}
            >
              chunks
            </div>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {total === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: C.gray,
                fontWeight: 700,
                fontSize: 13,
                padding: "8px 0",
              }}
            >
              No data yet for this view
            </div>
          ) : (
            arcs.map((a) => {
              const pct = Math.round((a.value / total) * 100);
              return (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 4,
                      backgroundColor: a.meta.color,
                      boxShadow: `0 2px 0 ${C.dim}`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13 }}>{a.meta.emoji}</span>
                  <span
                    style={{
                      flex: 1,
                      color: C.white,
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    {a.meta.label}
                  </span>
                  <span style={{ color: C.gray, fontWeight: 700, fontSize: 12 }}>
                    {a.value} · {pct}%
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
