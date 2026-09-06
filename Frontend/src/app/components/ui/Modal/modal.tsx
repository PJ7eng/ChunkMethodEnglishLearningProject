import type { CSSProperties, ReactNode, MouseEvent } from "react";
import { C } from "../../../constants/designToken";

export interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  /** Bottom sheet for forms; center for confirm dialogs. */
  align?: "center" | "bottom";
  maxWidth?: number;
  panelStyle?: CSSProperties;
  style?: CSSProperties;
}

export function Modal({
  children,
  onClose,
  align = "center",
  maxWidth = 420,
  panelStyle,
  style,
}: ModalProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: align === "bottom" ? "flex-end" : "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.65)",
        padding: "20px calc(var(--safe-right) + 20px) calc(var(--safe-bottom) + 20px) calc(var(--safe-left) + 20px)",
        animation: "fadeSlideIn 0.2s ease",
        ...style,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e: MouseEvent) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth,
          backgroundColor: C.surface2,
          borderRadius: 20,
          padding: 20,
          boxShadow: `0 8px 0 ${C.dim}`,
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: align === "bottom" ? 8 : 0,
          maxHeight: "min(88dvh, 720px)",
          overflowY: "auto",
          ...panelStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
