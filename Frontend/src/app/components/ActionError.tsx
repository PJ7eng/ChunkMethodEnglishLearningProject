import { Button } from "./ui";
import { C } from "../constants/designToken";

export function ActionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ color: C.red, fontWeight: 800, fontSize: 13 }}>{message}</div>
      {onRetry ? (
        <Button
          label="重試"
          bg={C.surface}
          shadow={C.dim}
          fg={C.white}
          size="sm"
          onClick={onRetry}
        />
      ) : null}
    </div>
  );
}
