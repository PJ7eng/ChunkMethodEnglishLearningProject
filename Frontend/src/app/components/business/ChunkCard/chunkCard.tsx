import { useState, useEffect } from "react";
import { Card, Button } from "../../ui";
import { getCategoryMeta } from "../../../utils/category";
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
  showGoalChoice?: boolean;
  onExit: () => void;
  onNextChunk: () => void;
  onCompleteToday: () => void;
  onKeepLearning: () => void;
}

export function ChunkCard({
  chunk,
  showGoalChoice = false,
  onExit,
  onNextChunk,
  onCompleteToday,
  onKeepLearning,
}: ChunkCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [blurPct, setBlurPct] = useState(10);
  const [cardIn, setCardIn] = useState(false);
  const cat = getCategoryMeta(chunk.category);

  useEffect(() => {
    const t = setTimeout(() => setCardIn(true), 30);
    return () => clearTimeout(t);
  }, []);

  function handleReveal() {
    setRevealed(true);
    setBlurPct(0);
  }

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

      {/* ── Action buttons ── */}
      <div style={{ display: "flex", gap: 10 }}>
        {showGoalChoice ? (
          <>
            <Button
              label="Complete Today's Learning"
              bg={C.green}
              shadow={C.greenDark}
              size="md"
              style={{ flex: 1 }}
              onClick={onCompleteToday}
            />
            <Button
              label="Keep Learning"
              bg={C.blue}
              shadow={C.blueDark}
              size="md"
              style={{ flex: 1 }}
              onClick={onKeepLearning}
            />
          </>
        ) : (
          <>
            <Button
              label="Exit"
              bg={C.surface}
              shadow={C.dim}
              fg={C.gray}
              size="md"
              style={{ flex: 1 }}
              onClick={onExit}
            />
            <Button
              label="Next Chunk →"
              bg={C.green}
              shadow={C.greenDark}
              size="md"
              style={{ flex: 2 }}
              onClick={onNextChunk}
            />
          </>
        )}
      </div>
    </div>
  );
}
