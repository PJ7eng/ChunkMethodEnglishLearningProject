import { useState } from "react";

export function usePress() {
  const [pressed, setPressed] = useState(false);
  const handlers = {
    onMouseDown:  () => setPressed(true),
    onMouseUp:    () => setPressed(false),
    onMouseLeave: () => setPressed(false),
    onTouchStart: () => setPressed(true),
    onTouchEnd:   () => setPressed(false),
  };
  return { pressed, handlers };
}