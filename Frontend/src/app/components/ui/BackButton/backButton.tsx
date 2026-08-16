import { usePress } from "../../../hooks/usePress";
import { C } from "../../../constants/designToken";

export interface BackButtonProps {
  onClick: () => void;
  ariaLabel?: string;
}

export function BackButton({ onClick, ariaLabel = "Go back" }: BackButtonProps) {
  const { pressed, handlers } = usePress();
  const lift = pressed ? 3 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      {...handlers}
      aria-label={ariaLabel}
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
        flexShrink: 0,
      }}
    >
      ←
    </button>
  );
}
