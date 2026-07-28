import type { CSSProperties } from "react";
import { C } from "../../../constants/designToken";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  style,
}: SearchBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: "10px 14px",
        border: `1.5px solid ${value ? C.purple + "88" : "transparent"}`,
        boxShadow: `0 3px 0 ${C.dim}`,
        transition: "border-color 0.2s ease",
        ...style,
      }}
    >
      <span style={{ fontSize: 14, color: C.gray }}>🔍</span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          backgroundColor: "transparent",
          border: "none",
          outline: "none",
          color: C.white,
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700,
          fontSize: 14,
        }}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.gray,
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
