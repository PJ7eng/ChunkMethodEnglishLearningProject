import { useState, useEffect } from "react";
import { Card, Label, OptionBtn, Button } from "../../ui";
import { getCategoryMeta } from "../../../utils/category";
import { shuffled } from "../../../utils/array";
import { C } from "../../../constants/designToken";

interface Chunk {
  id: string;
  phrase: string;
  translation: string;
  pinyin: string;
  category: string;
  options: string[];
  answer: string;
  examples: string[];
  blank: string;
  needsReview: boolean;
  mastered: boolean;
}

export interface ChunkCardProps {
  chunk: Chunk;
  onNext: () => void;
}

export function ChunkCard({ chunk, onNext }: ChunkCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [opts] = useState(() => shuffled(chunk.options));
  const [blurPct, setBlurPct] = useState(10);
  const [cardIn, setCardIn] = useState(false);
  const cat = getCategoryMeta(chunk.category);
  const correct = selected === chunk.answer;

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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        opacity: cardIn ? 1 : 0,
        transform: `translateY(${cardIn ? 0 : 20}px)`,
        transition: "opacity 0.3s ease, transform 0.35s cubic-bezier(.34,1.56,.64,1)",
      }}
    >
      {/* ── Phrase card ── */}
      <Card>
        {/* Top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              backgroundColor: cat.bg,
              border: `1.5px solid ${cat.color}55`,
              borderRadius: 10,
              padding: "4px 10px",
            }}
          >
            <span style={{ fontSize: 13 }}>{cat.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: cat.color }}>
              {cat.label}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.gray, fontWeight: 700 }}>
              🎴 NEW
            </span>
          </div>
        </div>

        {/* Phrase */}
        <div
          style={{
            background: `linear-gradient(135deg, ${C.white}, ${C.gray})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: 30,
            fontWeight: 900,
            lineHeight: 1.2,
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
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
          <div
            style={{
              filter: `blur(${blurPct}px)`,
              transition: "filter 0.4s ease",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                color: C.green,
                fontWeight: 800,
                fontSize: 17,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {chunk.translation}
            </div>
            <div
              style={{
                color: C.gray,
                fontWeight: 600,
                fontSize: 11,
                marginTop: 3,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {chunk.pinyin}
            </div>
          </div>
          {!revealed && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor: "rgba(26,26,28,0.55)",
              }}
            >
              <span style={{ fontSize: 14 }}>👁️</span>
              <span
                style={{
                  color: C.gray,
                  fontWeight: 800,
                  fontSize: 13,
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                Tap to reveal translation
              </span>
            </div>
          )}
        </button>

        {/* Example sentences */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {chunk.examples.map((ex, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "10px 13px",
                backgroundColor: "#12181E",
                borderRadius: 12,
                borderLeft: `3px solid ${C.blue}`,
              }}
            >
              <span
                style={{
                  color: C.blue,
                  fontWeight: 900,
                  fontSize: 11,
                  marginTop: 2,
                  flexShrink: 0,
                  width: 16,
                  height: 16,
                  backgroundColor: C.blue + "22",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  color: "#CCCCCC",
                  fontSize: 13,
                  lineHeight: 1.6,
                  fontWeight: 600,
                }}
              >
                {ex}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Fill in the blank ── */}
      <Card>
        <Label color={C.purple}>🧩 Fill in the blank</Label>
        <p
          style={{
            color: C.white,
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.75,
            margin: "0 0 16px",
          }}
        >
          {chunk.blank.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span
                  style={{
                    display: "inline-block",
                    minWidth: 130,
                    borderBottom: `2.5px solid ${selected ? answerColor : C.purple}`,
                    color: selected ? answerColor : C.purple,
                    fontWeight: 900,
                    padding: "0 6px",
                    textAlign: "center",
                    transition: "all 0.25s ease",
                  }}
                >
                  {selected ?? "___"}
                </span>
              )}
            </span>
          ))}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opts.map((opt) => {
            const isSel = selected === opt;
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
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              backgroundColor: correct ? "#1A3A1A" : "#3A1A1A",
              borderRadius: 12,
              border: `1.5px solid ${answerColor}44`,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              animation: "fadeSlideIn 0.3s ease",
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>
              {correct ? "🎉" : "💡"}
            </span>
            <div>
              <div
                style={{
                  color: answerColor,
                  fontWeight: 800,
                  fontSize: 13,
                  marginBottom: 2,
                }}
              >
                {correct ? "Perfect! You nailed it!" : `Not quite. The answer is:`}
              </div>
              {!correct && (
                <div style={{ color: C.white, fontWeight: 900, fontSize: 14 }}>
                  "{chunk.answer}"
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* ── Action buttons ── */}
      <div style={{ display: "flex", gap: 10 }}>
        <Button
          label="Skip"
          bg={C.surface}
          shadow={C.dim}
          fg={C.gray}
          size="md"
          style={{ flex: 1 }}
          onClick={onNext}
        />
        <Button
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