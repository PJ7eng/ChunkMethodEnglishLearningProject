import React from "react";

export default interface LabelProps {
  color: string;
  children: React.ReactNode;
}

export function Label({ color, children }: LabelProps) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 900,
      color,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}