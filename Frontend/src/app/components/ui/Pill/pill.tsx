import React from "react";
import { usePress } from "../../../hooks/usePress";
import { C } from "../../../constants/designToken";

interface Category {
  id: string;
  emoji: string;
  label: string;
  color: string;
  bg: string;
}

export default interface PillProps {
  cat: Category;
  active: boolean;
  onClick: () => void;
}

export function Pill({ cat, active, onClick }: PillProps) {
  const { pressed, handlers } = usePress();
  
  return (
    <button
      {...handlers}
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 24,
        border: active ? `2px solid ${cat.color}` : "2px solid transparent",
        backgroundColor: active ? cat.bg : C.surface,
        color: active ? cat.color : C.gray,
        fontWeight: 800,
        fontSize: 13,
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: "'Nunito', sans-serif",
        boxShadow: active ? `0 4px 0 ${cat.color}33` : `0 3px 0 ${C.dim}`,
        transform: `translateY(${pressed ? 2 : active ? -2 : 0}px)`,
        transition: "all 0.15s ease",
        WebkitTapHighlightColor: "transparent",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span>{cat.emoji}</span>
      <span>{cat.label}</span>
    </button>
  );
}