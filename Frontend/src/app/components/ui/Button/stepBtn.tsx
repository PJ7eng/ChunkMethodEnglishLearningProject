import { usePress } from "../../../hooks/usePress";
import { C } from "../../../constants/designToken";

export interface StepBtnProps {
  icon: string;  // "+" 或 "-"
  onClick: () => void;
}

export function StepBtn({ icon, onClick }: StepBtnProps) {
  const { pressed, handlers } = usePress();
  
  return (
    <button
      {...handlers}
      onClick={onClick}
      style={{
        width: 48,
        height: 48,
        borderRadius: 13,
        backgroundColor: C.surface3,
        border: "none",
        cursor: "pointer",
        color: C.white,
        fontWeight: 900,
        fontSize: 24,
        fontFamily: "'Nunito', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: pressed ? "none" : `0 4px 0 ${C.dim}`,
        transform: `translateY(${pressed ? 4 : 0}px)`,
        transition: "transform 0.08s ease, box-shadow 0.08s ease",
        WebkitTapHighlightColor: "transparent",
        flexShrink: 0,
      }}
    >
      {icon}
    </button>
  );
}