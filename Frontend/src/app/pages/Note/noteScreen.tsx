import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  SearchBar,
  CategoryPills,
  ConfirmModal,
  NoteFormModal,
} from "../../components";
import { ActionError } from "../../components/ActionError";
import type { NoteFormValues } from "../../components";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNotes,
  userFacingError,
} from "../../api";
import { getCategoryMeta } from "../../utils/category";
import { usePress } from "../../hooks/usePress";
import { C } from "../../constants/designToken";

const LONG_PRESS_MS = 450;
const RED_DARK = "#C0392B";

export interface NoteItem {
  id: string;
  english: string;
  translation: string;
  category: string;
  createdAt: number;
}

interface FabButtonProps {
  mode: "add" | "delete";
  onClick: () => void;
  disabled?: boolean;
}

function FabButton({ mode, onClick, disabled }: FabButtonProps) {
  const { pressed, handlers } = usePress();
  const lift = pressed || disabled ? 0 : 4;
  const isDelete = mode === "delete";

  return (
    <button
      type="button"
      onClick={!disabled ? onClick : undefined}
      {...handlers}
      aria-label={isDelete ? "Delete selected notes" : "Add note"}
      disabled={disabled}
      style={{
        position: "absolute",
        right: 20,
        bottom: 16,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "none",
        backgroundColor: isDelete ? C.red : C.green,
        color: C.white,
        fontSize: isDelete ? 24 : 32,
        fontWeight: 900,
        lineHeight: 1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 ${6 - lift}px 0 ${isDelete ? RED_DARK : C.greenDark}`,
        transform: `translateY(${lift}px)`,
        transition:
          "transform 0.08s ease, box-shadow 0.08s ease, background-color 0.2s ease",
        WebkitTapHighlightColor: "transparent",
        fontFamily: "'Nunito', sans-serif",
        zIndex: 15,
      }}
    >
      {isDelete ? "🗑" : "+"}
    </button>
  );
}

interface NoteRowProps {
  note: NoteItem;
  selecting: boolean;
  selected: boolean;
  onOpen: () => void;
  onLongPress: () => void;
  onToggleSelect: () => void;
}

function NoteRow({
  note,
  selecting,
  selected,
  onOpen,
  onLongPress,
  onToggleSelect,
}: NoteRowProps) {
  const cat = getCategoryMeta(note.category);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function handlePointerDown() {
    longPressedRef.current = false;
    clearTimer();
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  }

  function handlePointerUp() {
    clearTimer();
  }

  function handleClick() {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    if (selecting) {
      onToggleSelect();
      return;
    }
    onOpen();
  }

  return (
    <Card
      style={{
        padding: "14px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        border: selected ? `1.5px solid ${C.red}88` : undefined,
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "'Nunito', sans-serif",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            backgroundColor: cat.bg,
            border: `1.5px solid ${cat.color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
            boxShadow: `0 3px 0 ${C.dim}`,
          }}
        >
          {cat.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 900,
              color: C.white,
              fontSize: 15,
              marginBottom: 3,
            }}
          >
            {note.english}
          </div>
          <div style={{ color: C.gray, fontSize: 12, fontWeight: 600 }}>
            {note.translation}
          </div>
        </div>
      </button>

      {selecting && (
        <button
          type="button"
          onClick={onToggleSelect}
          aria-label={selected ? "Deselect note" : "Select note"}
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: selected ? `2px solid ${C.red}` : `2px solid ${C.gray}`,
            backgroundColor: selected ? C.red : "transparent",
            color: C.white,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 900,
            flexShrink: 0,
            padding: 0,
            fontFamily: "'Nunito', sans-serif",
            WebkitTapHighlightColor: "transparent",
            transition: "background-color 0.15s ease, border-color 0.15s ease",
          }}
        >
          {selected ? "✓" : ""}
        </button>
      )}
    </Card>
  );
}

export function NoteScreen() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState<"create" | "edit" | "confirmDelete" | null>(
    null
  );
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function loadNotes() {
    try {
      setError(null);
      setNotes(await getNotes());
    } catch (err) {
      setError(userFacingError(err, "無法載入筆記。請稍後再試。"));
    }
  }

  useEffect(() => {
    void loadNotes();
  }, []);

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      const matchCat = filter === "all" || n.category === filter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        n.english.toLowerCase().includes(q) ||
        n.translation.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [notes, filter, search]);

  function exitSelection() {
    setSelecting(false);
    setSelectedIds(new Set());
  }

  async function handleCreate(data: NoteFormValues) {
    try {
      const next = await createNote(data);
      setNotes((prev) => [next, ...prev]);
      setModal(null);
    } catch (err) {
      setError(userFacingError(err, "無法新增筆記。請稍後再試。"));
    }
  }

  async function handleEdit(data: NoteFormValues) {
    if (!editingNote) return;
    try {
      const next = await updateNote(editingNote.id, data);
      setNotes((prev) =>
        prev.map((n) => (n.id === editingNote.id ? next : n)),
      );
      setEditingNote(null);
      setModal(null);
    } catch (err) {
      setError(userFacingError(err, "無法更新筆記。請稍後再試。"));
    }
  }

  function handleLongPress(id: string) {
    setSelecting(true);
    setSelectedIds(new Set([id]));
    setModal(null);
    setEditingNote(null);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirmDelete() {
    const ids = Array.from(selectedIds);
    try {
      await deleteNotes(ids);
      setNotes((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      setModal(null);
      exitSelection();
    } catch (err) {
      setError(userFacingError(err, "無法刪除筆記。請稍後再試。"));
    }
  }

  const selectedCount = selectedIds.size;

  return (
    <div
      style={{
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "14px 20px 10px", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2
              style={{
                color: C.white,
                fontWeight: 900,
                fontSize: 22,
                margin: 0,
              }}
            >
              {selecting ? `${selectedCount} selected` : "My Notes"}
            </h2>
            {selecting ? (
              <button
                type="button"
                onClick={exitSelection}
                style={{
                  background: "none",
                  border: "none",
                  color: C.blue,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                  padding: "4px 0",
                }}
              >
                Done
              </button>
            ) : (
              <span style={{ fontSize: 28, lineHeight: 1 }}>📝</span>
            )}
          </div>

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search notes..."
          />
        </div>

        <CategoryPills value={filter} onChange={setFilter} />

        <div
          style={{
            padding: "0 16px 96px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {error && (
            <ActionError message={error} onRetry={() => void loadNotes()} />
          )}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
              <div
                style={{
                  color: C.white,
                  fontWeight: 900,
                  fontSize: 16,
                  marginBottom: 6,
                }}
              >
                {notes.length === 0 ? "No notes yet" : "No matching notes"}
              </div>
              <div style={{ color: C.gray, fontWeight: 600, fontSize: 13 }}>
                {notes.length === 0
                  ? "Tap + to save a word or sentence."
                  : "Try another search or category."}
              </div>
            </div>
          ) : (
            filtered.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                selecting={selecting}
                selected={selectedIds.has(note.id)}
                onOpen={() => {
                  setEditingNote(note);
                  setModal("edit");
                }}
                onLongPress={() => handleLongPress(note.id)}
                onToggleSelect={() => toggleSelect(note.id)}
              />
            ))
          )}
        </div>
      </div>

      <FabButton
        mode={selecting ? "delete" : "add"}
        disabled={selecting && selectedCount === 0}
        onClick={() => {
          if (selecting) setModal("confirmDelete");
          else setModal("create");
        }}
      />

      {modal === "create" && (
        <NoteFormModal
          mode="create"
          onClose={() => setModal(null)}
          onSubmit={handleCreate}
        />
      )}
      {modal === "edit" && editingNote && (
        <NoteFormModal
          mode="edit"
          initial={editingNote}
          onClose={() => {
            setModal(null);
            setEditingNote(null);
          }}
          onSubmit={handleEdit}
        />
      )}
      {modal === "confirmDelete" && (
        <ConfirmModal
          title={`Delete ${selectedCount} note${selectedCount === 1 ? "" : "s"}?`}
          message="This action cannot be undone."
          onClose={() => setModal(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
