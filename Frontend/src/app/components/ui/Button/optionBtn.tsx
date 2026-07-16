import { usePress } from "../../../hooks/usePress";
import { C } from "../../../constants/designToken";

export interface OptionBtnProps {
  label: string;
  selected: boolean;
  correct: boolean;
  wrong: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function OptionBtn({
  label,
  selected,
  correct,
  wrong,
  disabled,
  onClick,
}: OptionBtnProps) {
  const { pressed, handlers } = usePress();
  
  let bg = C.surface3;
  let border = "transparent";
  let fg = C.white;
  let shadow = C.dim;
  
  if (correct) {
    bg = "#1A3A1A";
    border = C.green;
    fg = C.green;
    shadow = "#0D200D";
  }
  if (wrong) {
    bg = "#3A1A1A";
    border = C.red;
    fg = C.red;
    shadow = "#200D0D";
  }

  return (
    <button
      {...handlers}
      onClick={!disabled ? onClick : undefined}
      style={{
        width: "100%",
        padding: "13px 16px",
        backgroundColor: bg,
        border: `2px solid ${border}`,
        borderRadius: 13,
        color: fg,
        fontWeight: 800,
        fontSize: 14,
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
        fontFamily: "'Nunito', sans-serif",
        boxShadow: `0 ${selected ? 0 : pressed ? 0 : 3}px 0 ${shadow}`,
        transform: `translateY(${selected || pressed ? 3 : 0}px)`,
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        gap: 10,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          backgroundColor: correct
            ? C.green + "33"
            : wrong
            ? C.red + "33"
            : C.surface2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 900,
          color: fg,
          flexShrink: 0,
        }}
      >
        {correct ? "✓" : wrong ? "✗" : ""}
      </span>
      {label}
    </button>
  );
}