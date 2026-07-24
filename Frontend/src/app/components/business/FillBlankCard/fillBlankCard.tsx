import { useState, type CSSProperties } from "react";
import { Card, Label, OptionBtn } from "../../ui";
import { shuffled } from "../../../utils/array";
import { C } from "../../../constants/designToken";

export interface FillBlankChunk {
  blank: string;
  options: string[];
  answer: string;
}

export interface FillBlankCardProps {
  chunk: FillBlankChunk;
  onAnswered?: (isCorrect: boolean) => void;
  style?: CSSProperties;
}

export function FillBlankCard({ chunk, onAnswered, style }: FillBlankCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [opts] = useState(() => shuffled(chunk.options));
  const correct = selected === chunk.answer;
  const answerColor = correct ? C.green : C.red;

  function handleSelect(opt: string) {
    if (selected) return;
    setSelected(opt);
    onAnswered?.(opt === chunk.answer);
  }

  return (
    <Card style={style}>
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
              {correct ? "Perfect! You nailed it!" : "Not quite. The answer is:"}
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
  );
}
