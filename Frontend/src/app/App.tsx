import { useState, useEffect, useRef } from "react";
import { getChunks, getRandomChunk, type ChunkResponse } from "./api";

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",       emoji: "⭐", label: "All",        color: "#A1A1AA", bg: "#2A2A2E" },
  { id: "workplace", emoji: "💼", label: "Workplace",  color: "#1CB0F6", bg: "#0D2233" },
  { id: "smalltalk", emoji: "☕", label: "Small Talk", color: "#58CC02", bg: "#0D2210" },
  { id: "travel",    emoji: "✈️", label: "Travel",     color: "#CE82FF", bg: "#22123A" },
  { id: "emotions",  emoji: "❤️", label: "Emotions",   color: "#FF4B4B", bg: "#2A0D0D" },
  { id: "random",    emoji: "🎲", label: "Random",     color: "#FF9600", bg: "#2A1A00" },
];

const CHUNKS: Array<ChunkResponse & { needsReview: boolean; mastered: boolean }> = [];

const WEEK_DATA = [
  { day: "M", done: true,  count: 7  },
  { day: "T", done: true,  count: 5  },
  { day: "W", done: true,  count: 8  },
  { day: "T", done: false, count: 2  },
  { day: "F", done: true,  count: 6  },
  { day: "S", done: false, count: 0  },
  { day: "S", done: false, count: 0  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:       "#121212",
  surface:  "#2A2A2E",
  surface2: "#1E1E22",
  surface3: "#3A3A3E",
  green:    "#58CC02",
  greenDark:"#3D8F00",
  blue:     "#1CB0F6",
  blueDark: "#0A7AB0",
  purple:   "#CE82FF",
  purpleDk: "#8A40CC",
  orange:   "#FF9600",
  red:      "#FF4B4B",
  white:    "#FFFFFF",
  gray:     "#A1A1AA",
  dim:      "#1A1A1E",
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getCategoryMeta(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: 3D PRESS
// ─────────────────────────────────────────────────────────────────────────────

function usePress() {
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

// ─────────────────────────────────────────────────────────────────────────────
// CHUNKY BUTTON
// ─────────────────────────────────────────────────────────────────────────────

interface BtnProps {
  label: string;
  bg?: string;
  shadow?: string;
  fg?: string;
  icon?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  full?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

function Btn({ label, bg = C.green, shadow = C.greenDark, fg = C.white,
               icon, size = "md", full = false, disabled = false,
               onClick, style }: BtnProps) {
  const { pressed, handlers } = usePress();
  const lift = pressed || disabled ? 0 : 5;

  const fsMap  = { xs: 11, sm: 13, md: 15, lg: 18, xl: 21 };
  const padMap = { xs: "6px 12px", sm: "9px 18px", md: "13px 22px", lg: "17px 28px", xl: "20px 0" };

  return (
    <button
      {...handlers}
      onClick={!disabled ? onClick : undefined}
      style={{
        backgroundColor: bg,
        color: fg,
        fontSize: fsMap[size],
        padding: padMap[size],
        width: full ? "100%" : undefined,
        borderRadius: 16,
        border: "none",
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 900,
        letterSpacing: "0.01em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: `0 ${lift}px 0 ${shadow}`,
        transform: `translateY(${pressed && !disabled ? 5 : 0}px)`,
        transition: "transform 0.08s ease, box-shadow 0.08s ease",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      {icon && <span style={{ fontSize: size === "xl" || size === "lg" ? 22 : 16 }}>{icon}</span>}
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE SWITCH
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// CARD SHELL
// ─────────────────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────

function Label({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 900,
      color, letterSpacing: "0.12em",
      textTransform: "uppercase",
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color = C.green }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 10, backgroundColor: C.surface3, borderRadius: 10, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}, ${color}CC)`,
        borderRadius: 10,
        boxShadow: `0 0 10px ${color}66`,
        transition: "width 0.5s cubic-bezier(.34,1.56,.64,1)",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY PILL
// ─────────────────────────────────────────────────────────────────────────────

function Pill({ cat, active, onClick }: { cat: typeof CATEGORIES[0]; active: boolean; onClick: () => void }) {
  const { pressed, handlers } = usePress();
  return (
    <button
      {...handlers}
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 24,
        border: active ? `2px solid ${cat.color}` : "2px solid transparent",
        backgroundColor: active ? cat.bg : C.surface,
        color: active ? cat.color : C.gray,
        fontWeight: 800, fontSize: 13,
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: "'Nunito', sans-serif",
        boxShadow: active ? `0 4px 0 ${cat.color}33` : `0 3px 0 ${C.dim}`,
        transform: `translateY(${pressed ? 2 : active ? -2 : 0}px)`,
        transition: "all 0.15s ease",
        WebkitTapHighlightColor: "transparent",
        display: "flex", alignItems: "center", gap: 5,
      }}
    >
      <span>{cat.emoji}</span>
      <span>{cat.label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// XP ORBS (decorative dots for progress)
// ─────────────────────────────────────────────────────────────────────────────

function XpDots({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: 16, height: 16, borderRadius: "50%",
          backgroundColor: i < filled ? color : C.surface3,
          boxShadow: i < filled ? `0 0 6px ${color}88` : "none",
          transition: "all 0.3s ease",
          transitionDelay: `${i * 0.04}s`,
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHUNK CARD (full interactive card)
// ─────────────────────────────────────────────────────────────────────────────

type ChunkType = typeof CHUNKS[0];

function ChunkCard({ chunk, onNext }: { chunk: ChunkType; onNext: () => void }) {
  const [revealed, setRevealed]     = useState(false);
  const [selected, setSelected]     = useState<string | null>(null);
  const [opts]                      = useState(() => shuffled(chunk.options));
  const [blurPct, setBlurPct]       = useState(10);
  const [cardIn, setCardIn]         = useState(false);
  const cat                         = getCategoryMeta(chunk.category);
  const correct                     = selected === chunk.answer;

  useEffect(() => {
    const t = setTimeout(() => setCardIn(true), 30);
    return () => clearTimeout(t);
  }, []);

  function handleReveal() {
    setRevealed(true);
    setBlurPct(0);
  }

  function handleSelect(opt: string) {
    if (selected) return;
    setSelected(opt);
  }

  const answerColor = correct ? C.green : C.red;

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 12,
      opacity: cardIn ? 1 : 0,
      transform: `translateY(${cardIn ? 0 : 20}px)`,
      transition: "opacity 0.3s ease, transform 0.35s cubic-bezier(.34,1.56,.64,1)",
    }}>
      {/* ── Phrase card ── */}
      <Card>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            backgroundColor: cat.bg,
            border: `1.5px solid ${cat.color}55`,
            borderRadius: 10, padding: "4px 10px",
          }}>
            <span style={{ fontSize: 13 }}>{cat.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: cat.color }}>{cat.label}</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.gray, fontWeight: 700 }}>🎴 NEW</span>
          </div>
        </div>

        {/* Phrase */}
        <div style={{
          background: `linear-gradient(135deg, ${C.white}, ${C.gray})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: 30,
          fontWeight: 900,
          lineHeight: 1.2,
          marginBottom: 16,
          letterSpacing: "-0.02em",
        }}>
          "{chunk.phrase}"
        </div>

        {/* Translation (blur-reveal) */}
        <button
          onClick={handleReveal}
          style={{
            width: "100%",
            padding: "13px 16px",
            background: revealed
              ? `linear-gradient(135deg, #1A3A1A, #0D2210)`
              : `linear-gradient(135deg, ${C.surface3}, #2A2A30)`,
            border: `2px solid ${revealed ? C.green + "88" : "transparent"}`,
            borderRadius: 14,
            cursor: revealed ? "default" : "pointer",
            marginBottom: 16,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s ease",
          }}
        >
          <div style={{
            filter: `blur(${blurPct}px)`,
            transition: "filter 0.4s ease",
            pointerEvents: "none",
          }}>
            <div style={{ color: C.green, fontWeight: 800, fontSize: 17, fontFamily: "'Nunito', sans-serif" }}>
              {chunk.translation}
            </div>
            <div style={{ color: C.gray, fontWeight: 600, fontSize: 11, marginTop: 3, fontFamily: "'Nunito', sans-serif" }}>
              {chunk.pinyin}
            </div>
          </div>
          {!revealed && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              backgroundColor: "rgba(26,26,28,0.55)",
            }}>
              <span style={{ fontSize: 14 }}>👁️</span>
              <span style={{ color: C.gray, fontWeight: 800, fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>
                Tap to reveal translation
              </span>
            </div>
          )}
        </button>

        {/* Example sentences */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {chunk.examples.map((ex, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              padding: "10px 13px",
              backgroundColor: "#12181E",
              borderRadius: 12,
              borderLeft: `3px solid ${C.blue}`,
            }}>
              <span style={{
                color: C.blue, fontWeight: 900, fontSize: 11,
                marginTop: 2, flexShrink: 0,
                width: 16, height: 16,
                backgroundColor: C.blue + "22",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {i + 1}
              </span>
              <span style={{ color: "#CCCCCC", fontSize: 13, lineHeight: 1.6, fontWeight: 600 }}>{ex}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Fill in the blank ── */}
      <Card>
        <Label color={C.purple}>🧩 Fill in the blank</Label>
        <p style={{
          color: C.white, fontSize: 15, fontWeight: 700,
          lineHeight: 1.75, margin: "0 0 16px",
        }}>
          {chunk.blank.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span style={{
                  display: "inline-block",
                  minWidth: 130,
                  borderBottom: `2.5px solid ${selected ? answerColor : C.purple}`,
                  color: selected ? answerColor : C.purple,
                  fontWeight: 900, padding: "0 6px",
                  textAlign: "center",
                  transition: "all 0.25s ease",
                }}>
                  {selected ?? "___"}
                </span>
              )}
            </span>
          ))}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opts.map(opt => {
            const isSel   = selected === opt;
            const isRight = isSel && correct;
            const isWrong = isSel && !correct;
            return (
              <OptionBtn
                key={opt}
                label={opt}
                selected={isSel}
                correct={isRight}
                wrong={isWrong}
                disabled={!!selected}
                onClick={() => handleSelect(opt)}
              />
            );
          })}
        </div>

        {selected && (
          <div style={{
            marginTop: 14,
            padding: "12px 14px",
            backgroundColor: correct ? "#1A3A1A" : "#3A1A1A",
            borderRadius: 12,
            border: `1.5px solid ${answerColor}44`,
            display: "flex", alignItems: "flex-start", gap: 10,
            animation: "fadeSlideIn 0.3s ease",
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{correct ? "🎉" : "💡"}</span>
            <div>
              <div style={{ color: answerColor, fontWeight: 800, fontSize: 13, marginBottom: 2 }}>
                {correct ? "Perfect! You nailed it!" : `Not quite. The answer is:`}
              </div>
              {!correct && (
                <div style={{ color: C.white, fontWeight: 900, fontSize: 14 }}>"{chunk.answer}"</div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* ── Action buttons ── */}
      <div style={{ display: "flex", gap: 10 }}>
        <Btn
          label="Skip"
          bg={C.surface}
          shadow={C.dim}
          fg={C.gray}
          size="md"
          style={{ flex: 1 }}
          onClick={onNext}
        />
        <Btn
          label={selected ? "Next Chunk →" : "Reveal Answer"}
          bg={selected ? C.green : C.purple}
          shadow={selected ? C.greenDark : C.purpleDk}
          size="md"
          style={{ flex: 2 }}
          onClick={selected ? onNext : () => handleSelect(chunk.answer)}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION BUTTON
// ─────────────────────────────────────────────────────────────────────────────

function OptionBtn({
  label, selected, correct, wrong, disabled, onClick,
}: {
  label: string; selected: boolean; correct: boolean;
  wrong: boolean; disabled: boolean; onClick: () => void;
}) {
  const { pressed, handlers } = usePress();
  let bg = C.surface3;
  let border = "transparent";
  let fg = C.white;
  let shadow = C.dim;
  if (correct) { bg = "#1A3A1A"; border = C.green; fg = C.green; shadow = "#0D200D"; }
  if (wrong)   { bg = "#3A1A1A"; border = C.red;   fg = C.red;   shadow = "#200D0D"; }

  return (
    <button
      {...handlers}
      onClick={!disabled ? onClick : undefined}
      style={{
        width: "100%",
        padding: "13px 16px",
        backgroundColor: bg,
        border: `2px solid ${border}`,
        borderRadius: 13,
        color: fg,
        fontWeight: 800, fontSize: 14,
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
        fontFamily: "'Nunito', sans-serif",
        boxShadow: `0 ${selected ? 0 : pressed ? 0 : 3}px 0 ${shadow}`,
        transform: `translateY(${selected || pressed ? 3 : 0}px)`,
        transition: "all 0.15s ease",
        display: "flex", alignItems: "center", gap: 10,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{
        width: 22, height: 22, borderRadius: 6,
        backgroundColor: correct ? C.green + "33" : wrong ? C.red + "33" : C.surface2,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 900, color: fg, flexShrink: 0,
      }}>
        {correct ? "✓" : wrong ? "✗" : ""}
      </span>
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function HomeScreen() {
  const [cat, setCat]       = useState("all");
  const [chunk, setChunk]   = useState<ChunkResponse | null>(null);
  const [key, setKey]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streak = 12;
  const done   = 8;
  const goal   = 12;

  async function draw() {
    setLoading(true);
    setError(null);
    try {
      const next = await getRandomChunk(cat);
      setChunk(next);
      setKey(k => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chunk');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* ── Top bar ── */}
      <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginBottom: 7,
          }}>
            <span style={{ fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Daily Progress
            </span>
            <span style={{ fontSize: 11, fontWeight: 900, color: C.green }}>{done}/{goal} chunks</span>
          </div>
          <ProgressBar value={done} max={goal} />
        </div>
        {/* Streak pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          backgroundColor: C.surface,
          borderRadius: 14, padding: "7px 12px",
          boxShadow: `0 4px 0 ${C.dim}`,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 19 }}>🔥</span>
          <span style={{ fontWeight: 900, fontSize: 19, color: C.orange }}>{streak}</span>
        </div>
      </div>

      {/* ── Category pills ── */}
      <div style={{ overflowX: "auto", paddingBottom: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, padding: "5px 20px", width: "max-content" }}>
          {CATEGORIES.map(c => (
            <Pill key={c.id} cat={c} active={cat === c.id} onClick={() => setCat(c.id)} />
          ))}
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, padding: "0 20px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
        {error && <div style={{ color: C.red, fontWeight: 800, fontSize: 13 }}>{error}</div>}
        {!chunk ? (
          <EmptyState onDraw={draw} done={done} goal={goal} loading={loading} />
        ) : (
          <ChunkCard key={key} chunk={chunk} onNext={draw} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE (home before first draw)
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onDraw, done, goal, loading }: { onDraw: () => void; done: number; goal: number; loading: boolean }) {
  return (
    <>
      {/* Hero draw area */}
      <Card style={{ textAlign: "center", padding: "32px 20px" }}>
        <div style={{ fontSize: 60, marginBottom: 12, lineHeight: 1 }}>🎴</div>
        <h2 style={{ color: C.white, fontWeight: 900, fontSize: 22, margin: "0 0 8px" }}>
          Ready to learn?
        </h2>
        <p style={{ color: C.gray, fontSize: 14, fontWeight: 600, margin: "0 0 24px", lineHeight: 1.6 }}>
          Draw a chunk, learn its meaning, and practise using it in context.
        </p>
        <Btn label={loading ? "Loading..." : "Draw a Chunk"} icon="✨" bg={C.green} shadow={C.greenDark} size="xl" full onClick={onDraw} disabled={loading} />
      </Card>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { icon: "📚", value: "47",    label: "Learned"      },
          { icon: "🔥", value: "12",    label: "Day Streak"   },
          { icon: "🏅", value: "3",     label: "Mastered"     },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, backgroundColor: C.surface, borderRadius: 16,
            padding: "14px 10px", boxShadow: `0 4px 0 ${C.dim}`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 20, color: C.white }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.gray, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Today's dots */}
      <Card>
        <Label color={C.purple}>🎯 Today's goal</Label>
        <XpDots filled={done} total={goal} color={C.green} />
        <p style={{ color: C.gray, fontSize: 12, fontWeight: 700, margin: "10px 0 0" }}>
          {done < goal
            ? `${goal - done} more chunks to hit your daily goal!`
            : "🎉 Daily goal smashed! Keep going!"}
        </p>
      </Card>

      {/* Quick hint */}
      <div style={{
        padding: "12px 16px",
        backgroundColor: C.blue + "14",
        borderRadius: 14,
        border: `1.5px solid ${C.blue}33`,
        display: "flex", gap: 10, alignItems: "center",
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <span style={{ color: C.gray, fontSize: 12, fontWeight: 700, lineHeight: 1.5 }}>
          <span style={{ color: C.blue }}>Chunking tip:</span> Learn phrases as whole units, not word-by-word. Your brain stores them like muscle memory!
        </span>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIBRARY SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function LibraryScreen() {
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Array<ChunkResponse & { needsReview: boolean; mastered: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getChunks(filter === 'all' ? undefined : filter);
        setChunks(data.map((item) => ({ ...item, needsReview: false, mastered: false })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chunks');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [filter]);

  const filtered = chunks
    .filter(c => !search || c.phrase.toLowerCase().includes(search.toLowerCase()));

  const reviewCount = chunks.filter(c => c.needsReview).length;

  return (
    <div style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px 10px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <h2 style={{ color: C.white, fontWeight: 900, fontSize: 22, margin: 0 }}>My Chunks</h2>
            <p style={{ color: C.gray, fontSize: 12, fontWeight: 700, margin: "3px 0 0" }}>
              {chunks.length} collected · {chunks.filter(c => c.mastered).length} mastered
            </p>
          </div>
          {reviewCount > 0 && (
            <div style={{
              backgroundColor: C.red + "22",
              border: `1.5px solid ${C.red}55`,
              borderRadius: 10, padding: "5px 10px",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: C.red, boxShadow: `0 0 6px ${C.red}` }} />
              <span style={{ color: C.red, fontSize: 11, fontWeight: 900 }}>{reviewCount} to review</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          backgroundColor: C.surface, borderRadius: 14,
          padding: "10px 14px", marginTop: 12,
          border: `1.5px solid ${search ? C.purple + "88" : "transparent"}`,
          boxShadow: `0 3px 0 ${C.dim}`,
          transition: "border-color 0.2s ease",
        }}>
          <span style={{ fontSize: 14, color: C.gray }}>🔍</span>
          <input
            placeholder="Search chunks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, backgroundColor: "transparent", border: "none", outline: "none",
              color: C.white, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 14,
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.gray, fontSize: 14, lineHeight: 1,
            }}>✕</button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ overflowX: "auto", paddingBottom: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 7, padding: "0 20px", width: "max-content" }}>
          {[{ id: "all", emoji: "⭐", label: "All", color: C.gray, bg: C.surface },
            ...CATEGORIES.slice(1)].map(cat => {
            const active = filter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                style={{
                  padding: "5px 12px", borderRadius: 20,
                  border: active ? `2px solid ${cat.color}` : "2px solid transparent",
                  backgroundColor: active ? (cat as typeof CATEGORIES[0]).bg || C.surface : C.surface,
                  color: active ? cat.color : C.gray,
                  fontWeight: 800, fontSize: 12,
                  cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                  transition: "all 0.15s ease",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chunk list */}
      <div style={{ padding: "0 16px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
        {error && <div style={{ color: C.red, fontWeight: 800, fontSize: 13, marginBottom: 10 }}>{error}</div>}
        {loading ? <div style={{ color: C.gray, fontWeight: 700 }}>Loading chunks...</div> : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <div style={{ color: C.gray, fontWeight: 700, fontSize: 14 }}>No chunks found</div>
          </div>
        ) : filtered.map(chunk => {
          const cat = getCategoryMeta(chunk.category);
          const isOpen = expanded === chunk.id;
          return (
            <div key={chunk.id}>
              <button
                onClick={() => setExpanded(isOpen ? null : chunk.id)}
                style={{
                  width: "100%",
                  backgroundColor: C.surface,
                  borderRadius: isOpen ? "16px 16px 0 0" : 16,
                  padding: "13px 14px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  boxShadow: isOpen ? "none" : `0 4px 0 ${C.dim}`,
                  position: "relative",
                  fontFamily: "'Nunito', sans-serif",
                  transition: "border-radius 0.2s ease",
                }}
              >
                {/* Red dot */}
                {chunk.needsReview && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    width: 9, height: 9, borderRadius: "50%",
                    backgroundColor: C.red,
                    boxShadow: `0 0 8px ${C.red}`,
                  }} />
                )}
                {/* Icon */}
                <div style={{
                  width: 46, height: 46, borderRadius: 13,
                  backgroundColor: cat.bg,
                  border: `1.5px solid ${cat.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                  boxShadow: `0 3px 0 ${C.dim}`,
                }}>
                  {cat.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontWeight: 900, color: C.white, fontSize: 15, marginBottom: 3 }}>
                    {chunk.phrase}
                  </div>
                  <div style={{ color: C.gray, fontSize: 12, fontWeight: 600 }}>
                    {chunk.translation}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                  {chunk.mastered && (
                    <div style={{
                      fontSize: 10, fontWeight: 900, color: C.green,
                      backgroundColor: C.green + "1A",
                      border: `1.5px solid ${C.green}44`,
                      padding: "2px 7px", borderRadius: 6,
                    }}>
                      ✓ MASTERED
                    </div>
                  )}
                  {chunk.needsReview && (
                    <div style={{
                      fontSize: 10, fontWeight: 900, color: C.red,
                      backgroundColor: C.red + "1A",
                      padding: "2px 7px", borderRadius: 6,
                    }}>
                      REVIEW
                    </div>
                  )}
                  <span style={{ color: C.gray, fontSize: 14, marginLeft: 4 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>
              {/* Expanded detail */}
              {isOpen && (
                <div style={{
                  backgroundColor: "#1E1E24",
                  borderRadius: "0 0 16px 16px",
                  padding: "0 14px 14px",
                  boxShadow: `0 4px 0 ${C.dim}`,
                  borderTop: `1px solid ${C.surface3}`,
                  animation: "fadeSlideIn 0.2s ease",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 12 }}>
                    {chunk.examples.map((ex, i) => (
                      <div key={i} style={{
                        padding: "9px 12px",
                        backgroundColor: "#12181E",
                        borderRadius: 10,
                        borderLeft: `3px solid ${C.blue}`,
                      }}>
                        <span style={{ color: "#CCC", fontSize: 12, fontWeight: 600, lineHeight: 1.6 }}>{ex}</span>
                      </div>
                    ))}
                    <Btn
                      label="Practice this chunk →"
                      bg={cat.color}
                      shadow={cat.color + "88"}
                      size="sm"
                      full
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function SettingsScreen() {
  const [goal, setGoal]         = useState(5);
  const [sound, setSound]       = useState(true);
  const [remind, setRemind]     = useState(true);
  const [haptic, setHaptic]     = useState(false);
  const [autoNext, setAutoNext] = useState(false);

  const longestStreak  = 18;
  const totalChunks    = 47;
  const weeklyDone     = WEEK_DATA.filter(d => d.done).length;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "14px 20px 28px" }}>
      <h2 style={{ color: C.white, fontWeight: 900, fontSize: 22, margin: "0 0 16px" }}>Settings</h2>

      {/* ── Weekly habit grid ── */}
      <Card style={{ marginBottom: 12 }}>
        <Label color={C.orange}>🔥 This Week's Habit</Label>
        <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
          {WEEK_DATA.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{
                width: "100%", aspectRatio: "1",
                borderRadius: 12,
                background: d.done
                  ? `linear-gradient(135deg, ${C.green}, #89E219)`
                  : d.count > 0 ? "#1A3A1A" : C.surface3,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: d.done ? `0 3px 0 ${C.greenDark}` : `0 3px 0 ${C.dim}`,
                fontSize: 12, fontWeight: 900,
                color: d.done ? C.white : d.count > 0 ? C.green : C.gray,
                position: "relative", overflow: "hidden",
              }}>
                {d.done ? "✓" : d.count > 0 ? d.count : ""}
                {d.done && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)",
                  }} />
                )}
              </div>
              <span style={{ fontSize: 10, color: d.done ? C.green : C.gray, fontWeight: 900 }}>{d.day}</span>
            </div>
          ))}
        </div>
        <div style={{
          padding: "10px 14px",
          background: `linear-gradient(135deg, #1A3A1A, #0D2210)`,
          borderRadius: 11,
          border: `1.5px solid ${C.green}33`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>🏆</span>
          <span style={{ color: C.green, fontWeight: 800, fontSize: 13 }}>
            {weeklyDone}-day streak this week! Keep going!
          </span>
        </div>
      </Card>

      {/* ── Stats row ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {[
          { label: "Total Chunks", value: totalChunks, color: C.blue,   icon: "📚" },
          { label: "Best Streak",  value: `${longestStreak}🔥`, color: C.orange, icon: "🏅" },
          { label: "This Week",    value: `${WEEK_DATA.reduce((s,d) => s+d.count,0)}`, color: C.purple, icon: "📅" },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, backgroundColor: C.surface, borderRadius: 15,
            padding: "13px 8px", boxShadow: `0 4px 0 ${C.dim}`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 17, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: C.gray, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Daily goal stepper ── */}
      <Card style={{ marginBottom: 12 }}>
        <Label color={C.blue}>🎯 Daily Chunk Goal</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <StepBtn icon="−" onClick={() => setGoal(g => Math.max(1, g - 1))} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              fontWeight: 900, fontSize: 52, lineHeight: 1,
              background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {goal}
            </div>
            <div style={{ color: C.gray, fontSize: 13, fontWeight: 700, marginTop: 4 }}>chunks per day</div>
          </div>
          <StepBtn icon="+" onClick={() => setGoal(g => Math.min(20, g + 1))} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[3, 5, 7, 10, 15].map(n => (
            <button
              key={n}
              onClick={() => setGoal(n)}
              style={{
                flex: 1, padding: "9px 0",
                borderRadius: 11,
                backgroundColor: goal === n ? "#1A2A3A" : C.surface3,
                border: `2px solid ${goal === n ? C.blue : "transparent"}`,
                color: goal === n ? C.blue : C.gray,
                fontWeight: 900, fontSize: 14,
                cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                transition: "all 0.15s ease",
                boxShadow: goal === n ? `0 3px 0 ${C.blueDark}44` : `0 3px 0 ${C.dim}`,
              }}
            >{n}</button>
          ))}
        </div>
      </Card>

      {/* ── Toggle preferences ── */}
      <Card style={{ marginBottom: 12 }}>
        <Label color={C.purple}>⚙️ Preferences</Label>
        {[
          { label: "Sound Effects",   sub: "Play sounds on correct answers",       icon: "🔊", val: sound,   set: () => setSound(v => !v)   },
          { label: "Daily Reminders", sub: "Notify me to keep my streak alive",    icon: "🔔", val: remind,  set: () => setRemind(v => !v)  },
          { label: "Haptic Feedback", sub: "Vibrate on interactions (mobile)",     icon: "📳", val: haptic,  set: () => setHaptic(v => !v)  },
          { label: "Auto-Next Card",  sub: "Skip animation, go straight to next",  icon: "⚡", val: autoNext,set: () => setAutoNext(v => !v) },
        ].map((item, i, arr) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, backgroundColor: C.surface3, margin: "13px 0" }} />}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                backgroundColor: C.surface3,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
                boxShadow: `0 3px 0 ${C.dim}`,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.white, fontWeight: 800, fontSize: 14 }}>{item.label}</div>
                <div style={{ color: C.gray, fontSize: 11, fontWeight: 600, marginTop: 2 }}>{item.sub}</div>
              </div>
              <Toggle on={item.val} onChange={item.set} />
            </div>
          </div>
        ))}
      </Card>

      {/* ── App info ── */}
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          backgroundColor: C.surface, borderRadius: 12, padding: "8px 14px",
          boxShadow: `0 3px 0 ${C.dim}`, marginBottom: 10,
        }}>
          <span style={{ fontSize: 18 }}>🌍</span>
          <span style={{ fontWeight: 900, fontSize: 14 }}>
            <span style={{ color: C.green }}>Chunk</span>
            <span style={{ color: C.white }}>Master</span>
          </span>
          <span style={{ color: C.gray, fontSize: 11, fontWeight: 700 }}>v1.0.0</span>
        </div>
        <div style={{ color: C.gray, fontSize: 11, fontWeight: 700 }}>
          Built for ambitious language learners ✨
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP BUTTON (for goal stepper)
// ─────────────────────────────────────────────────────────────────────────────

function StepBtn({ icon, onClick }: { icon: string; onClick: () => void }) {
  const { pressed, handlers } = usePress();
  return (
    <button
      {...handlers}
      onClick={onClick}
      style={{
        width: 48, height: 48, borderRadius: 13,
        backgroundColor: C.surface3,
        border: "none", cursor: "pointer",
        color: C.white, fontWeight: 900, fontSize: 24,
        fontFamily: "'Nunito', sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: pressed ? "none" : `0 4px 0 ${C.dim}`,
        transform: `translateY(${pressed ? 4 : 0}px)`,
        transition: "transform 0.08s ease, box-shadow 0.08s ease",
        WebkitTapHighlightColor: "transparent",
        flexShrink: 0,
      }}
    >
      {icon}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB BAR
// ─────────────────────────────────────────────────────────────────────────────

type TabId = "home" | "library" | "settings";
const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "home",     icon: "🏠", label: "Home"     },
  { id: "library",  icon: "📚", label: "Library"  },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div style={{
      height: 68, flexShrink: 0,
      backgroundColor: C.surface2,
      borderTop: `1px solid rgba(255,255,255,0.07)`,
      display: "flex",
      boxShadow: "0 -8px 28px rgba(0,0,0,0.55)",
      position: "sticky",
      bottom: 0,
      zIndex: 20,
    }}>
      {TABS.map(t => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1, height: "100%",
              border: "none", backgroundColor: "transparent",
              cursor: "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 3, position: "relative",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {/* Active indicator */}
            <div style={{
              position: "absolute", top: 0,
              left: "50%", transform: "translateX(-50%)",
              width: on ? 40 : 0, height: 3,
              backgroundColor: C.green,
              borderRadius: "0 0 4px 4px",
              boxShadow: on ? `0 0 12px ${C.green}99` : "none",
              transition: "width 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease",
            }} />
            <span style={{
              fontSize: 22,
              filter: on ? "none" : "grayscale(1) opacity(0.4)",
              transform: `scale(${on ? 1.18 : 1}) translateY(${on ? -1 : 0}px)`,
              transition: "all 0.2s cubic-bezier(.34,1.56,.64,1)",
            }}>
              {t.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<TabId>("home");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
        body { margin: 0; background: #0A0A0A; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        input::placeholder { color: #A1A1AA; }
      `}</style>

      <div style={{
        minHeight: "100svh",
        height: "100svh",
        width: "100vw",
        backgroundColor: C.bg,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Nunito', sans-serif",
        overflow: "hidden",
      }}>

        {/* App header */}
        <div style={{
          padding: "36px 20px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.green}, #89E219)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, boxShadow: `0 3px 0 ${C.greenDark}`,
            }}>🎴</div>
            <div>
              <span style={{ fontWeight: 900, fontSize: 20, color: C.green }}>Chunk</span>
              <span style={{ fontWeight: 900, fontSize: 20, color: C.white }}>Master</span>
            </div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.purple} 0%, ${C.blue} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: `0 3px 0 ${C.dim}`,
            fontWeight: 700, color: C.white,
          }}>
            JL
          </div>
        </div>

        {/* Screen */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
          {tab === "home"     && <HomeScreen />}
          {tab === "library"  && <LibraryScreen />}
          {tab === "settings" && <SettingsScreen />}
        </div>

        {/* Tab bar */}
        <TabBar active={tab} onChange={setTab} />
      </div>
    </>
  );
}
