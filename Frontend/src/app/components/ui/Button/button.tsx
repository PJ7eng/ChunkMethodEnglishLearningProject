import React from "react";
import { usePress } from "../../../hooks/usePress";
import { C } from "../../../constants/designToken";

export interface ButtonProps {
  label: string;
  bg?: string;
  shadow?: string;
  fg?: string;
  icon?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  full?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const SIZE_FONT_MAP = { xs: 11, sm: 13, md: 15, lg: 18, xl: 21 };
const SIZE_PADDING_MAP = {
  xs: "6px 12px",
  sm: "9px 18px",
  md: "13px 22px",
  lg: "17px 28px",
  xl: "20px 0",
};

export function Button({
  label,
  bg = C.green,
  shadow = C.greenDark,
  fg = C.white,
  icon,
  size = "md",
  full = false,
  disabled = false,
  onClick,
  style,
}: ButtonProps) {
  const { pressed, handlers } = usePress();
  const lift = pressed || disabled ? 0 : 5;

  return (
    <button
      {...handlers}
      onClick={!disabled ? onClick : undefined}
      style={{
        backgroundColor: bg,
        color: fg,
        fontSize: SIZE_FONT_MAP[size],
        padding: SIZE_PADDING_MAP[size],
        width: full ? "100%" : undefined,
        borderRadius: 16,
        border: "none",
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 900,
        letterSpacing: "0.01em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: `0 ${lift}px 0 ${shadow}`,
        transform: `translateY(${pressed && !disabled ? 5 : 0}px)`,
        transition: "transform 0.08s ease, box-shadow 0.08s ease",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      {icon && <span style={{ fontSize: size === "xl" || size === "lg" ? 22 : 16 }}>{icon}</span>}
      {label}
    </button>
  );
}