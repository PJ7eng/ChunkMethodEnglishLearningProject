import { useState } from "react";
import { Button, Input, Modal, CategoryPills } from "../../ui";
import { C } from "../../../constants/designToken";

export interface NoteFormValues {
  english: string;
  translation: string;
  category: string;
}

export interface NoteFormModalProps {
  mode: "create" | "edit";
  initial?: Partial<NoteFormValues> | null;
  onClose: () => void;
  onSubmit: (values: NoteFormValues) => void;
}

export function NoteFormModal({
  mode,
  initial,
  onClose,
  onSubmit,
}: NoteFormModalProps) {
  const [english, setEnglish] = useState(initial?.english ?? "");
  const [translation, setTranslation] = useState(initial?.translation ?? "");
  const [category, setCategory] = useState(initial?.category ?? "random");
  const canSubmit = english.trim().length > 0 && translation.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      english: english.trim(),
      translation: translation.trim(),
      category,
    });
  }

  return (
    <Modal onClose={onClose} align="bottom" maxWidth={420}>
      <h3
        style={{
          margin: "0 0 16px",
          color: C.white,
          fontWeight: 900,
          fontSize: 20,
        }}
      >
        {mode === "edit" ? "Edit note" : "Add a note"}
      </h3>

      <Input
        label="English word or sentence"
        placeholder="e.g. How's it going?"
        value={english}
        onChange={(e) => setEnglish(e.target.value)}
      />
      <Input
        label="Translation"
        placeholder="e.g. 最近怎么样？"
        value={translation}
        onChange={(e) => setTranslation(e.target.value)}
      />

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.gray,
            marginBottom: 8,
          }}
        >
          Category
        </div>
        <CategoryPills
          value={category}
          onChange={setCategory}
          excludeIds={["all"]}
          wrap
        />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Button
          label="Cancel"
          bg={C.surface}
          shadow={C.dim}
          fg={C.gray}
          size="md"
          style={{ flex: 1 }}
          onClick={onClose}
        />
        <Button
          label={mode === "edit" ? "Save" : "Create"}
          bg={C.green}
          shadow={C.greenDark}
          size="md"
          style={{ flex: 1 }}
          onClick={handleSubmit}
          disabled={!canSubmit}
        />
      </div>
    </Modal>
  );
}
