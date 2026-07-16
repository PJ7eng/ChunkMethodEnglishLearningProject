import { C } from "../../../constants/designToken";

export default interface XpDotsProps {
  filled: number;
  total: number;
  color: string;
}

export function XpDots({ filled, total, color }: XpDotsProps) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: i < filled ? color : C.surface3,
            boxShadow: i < filled ? `0 0 6px ${color}88` : "none",
            transition: "all 0.3s ease",
            transitionDelay: `${i * 0.04}s`,
          }}
        />
      ))}
    </div>
  );
}