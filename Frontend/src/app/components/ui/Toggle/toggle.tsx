import { C } from "../../../constants/designToken";

export interface ToggleProps {
  on: boolean;
  onChange: () => void;
}

export function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 56, height: 30, borderRadius: 15,
        backgroundColor: on ? C.green : C.surface3,
        border: "none", cursor: "pointer", position: "relative",
        flexShrink: 0,
        boxShadow: on ? `0 4px 0 ${C.greenDark}` : `0 4px 0 ${C.dim}`,
        transition: "background-color 0.22s ease, box-shadow 0.22s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        backgroundColor: C.white,
        position: "absolute", top: 4,
        left: on ? 30 : 4,
        transition: "left 0.22s cubic-bezier(.34,1.56,.64,1)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
      }} />
    </button>
  );
}