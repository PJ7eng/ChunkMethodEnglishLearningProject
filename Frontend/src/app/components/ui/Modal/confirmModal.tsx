import { Button } from "../Button";
import { Modal } from "./modal";
import { C } from "../../../constants/designToken";

const RED_DARK = "#C0392B";

export interface ConfirmModalProps {
  title: string;
  message?: string;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  title,
  message,
  icon = "🗑",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal onClose={onClose} align="center" maxWidth={360} panelStyle={{ padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <h3
        style={{
          margin: "0 0 8px",
          color: C.white,
          fontWeight: 900,
          fontSize: 20,
        }}
      >
        {title}
      </h3>
      {message ? (
        <p
          style={{
            margin: "0 0 20px",
            color: C.gray,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
      ) : (
        <div style={{ height: 12 }} />
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <Button
          label={cancelLabel}
          bg={C.surface}
          shadow={C.dim}
          fg={C.gray}
          size="md"
          style={{ flex: 1 }}
          onClick={onClose}
        />
        <Button
          label={confirmLabel}
          bg={danger ? C.red : C.green}
          shadow={danger ? RED_DARK : C.greenDark}
          size="md"
          style={{ flex: 1 }}
          onClick={onConfirm}
        />
      </div>
    </Modal>
  );
}
