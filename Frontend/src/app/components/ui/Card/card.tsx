import React from "react";
import { C } from "../../../constants/designToken";

export interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      backgroundColor: C.surface,
      borderRadius: 20,
      padding: 20,
      boxShadow: `0 6px 0 ${C.dim}`,
      ...style,
    }}>
      {children}
    </div>
  );
}