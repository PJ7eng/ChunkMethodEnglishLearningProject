import { C } from "../../../constants/designToken";

export interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
}

export function ProgressBar({ value, max, color = C.green }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 10, backgroundColor: C.surface3, borderRadius: 10, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}, ${color}CC)`,
        borderRadius: 10,
        boxShadow: `0 0 10px ${color}66`,
        transition: "width 0.5s cubic-bezier(.34,1.56,.64,1)",
      }} />
    </div>
  );
}