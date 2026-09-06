import { useState, useEffect } from "react";
import { Button, ProgressBar, FillBlankCard, BackButton } from "../../components";
import { getRandomChunk, recordProgressAnswer, type ChunkResponse } from "../../api";
import { C } from "../../constants/designToken";

export interface ChallengeScreenProps {
  onBack: () => void;
  totalQuestions?: number;
}

const DEFAULT_TOTAL = 10;

export function ChallengeScreen({
  onBack,
  totalQuestions = DEFAULT_TOTAL,
}: ChallengeScreenProps) {
  const [chunk, setChunk] = useState<ChunkResponse | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  async function loadChunk() {
    setLoading(true);
    setError(null);
    setAnswered(false);
    setLastCorrect(false);
    try {
      const next = await getRandomChunk();
      setChunk({
        ...next,
        pinyin: next.pinyin || "",
        examples: next.examples || [],
        options: next.options || [],
        needsReview: next.needsReview ?? false,
        mastered: next.mastered ?? false,
      });
      setCardKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load challenge");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChunk();
  }, []);

  async function advance(isCorrect: boolean | null) {
    if (chunk && isCorrect !== null) {
      try {
        await recordProgressAnswer(chunk.id, isCorrect);
        if (isCorrect) setScore((s) => s + 1);
      } catch {
        /* continue */
      }
    }
    if (questionIndex >= totalQuestions) {
      setFinished(true);
      return;
    }
    setQuestionIndex((i) => i + 1);
    loadChunk();
  }

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        padding: "calc(var(--safe-top) + 20px) 20px calc(var(--safe-bottom) + 28px)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr 36px",
          alignItems: "center",
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <BackButton onClick={onBack} ariaLabel="Exit challenge" />
        <h2
          style={{
            margin: 0,
            textAlign: "center",
            color: C.white,
            fontWeight: 900,
            fontSize: 22,
          }}
        >
          Challenge
        </h2>
        <div />
      </div>

      {!finished && (
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 7,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: C.gray,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Question {Math.min(questionIndex, totalQuestions)} of {totalQuestions}
            </span>
            <span style={{ fontSize: 11, fontWeight: 900, color: C.purple }}>
              Score {score}
            </span>
          </div>
          <ProgressBar
            value={Math.min(questionIndex, totalQuestions)}
            max={totalQuestions}
            color={C.purple}
          />
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {finished ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: 16,
              padding: "40px 12px",
            }}
          >
            <div style={{ fontSize: 64 }}>🏆</div>
            <h3 style={{ margin: 0, color: C.white, fontWeight: 900, fontSize: 24 }}>
              Challenge complete!
            </h3>
            <p style={{ margin: 0, color: C.gray, fontSize: 14, fontWeight: 600 }}>
              You scored {score}/{totalQuestions}. Progress has been saved.
            </p>
            <Button
              label="Back to Home"
              bg={C.green}
              shadow={C.greenDark}
              size="lg"
              onClick={onBack}
              style={{ marginTop: 8, minWidth: 200 }}
            />
          </div>
        ) : (
          <>
            {error && (
              <div style={{ color: C.red, fontWeight: 800, fontSize: 13 }}>{error}</div>
            )}
            {loading && !chunk && (
              <div style={{ color: C.gray, fontWeight: 700, textAlign: "center", padding: 48 }}>
                Loading challenge...
              </div>
            )}
            {chunk && (
              <FillBlankCard
                key={cardKey}
                chunk={chunk}
                onAnswered={(correct) => {
                  setAnswered(true);
                  setLastCorrect(correct);
                }}
              />
            )}
            <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 8 }}>
              <Button
                label="Skip"
                bg={C.surface}
                shadow={C.dim}
                fg={C.gray}
                size="md"
                style={{ flex: 1 }}
                onClick={() => advance(false)}
                disabled={loading}
              />
              <Button
                label="Next Chunk →"
                bg={C.purple}
                shadow={C.purpleDk}
                size="md"
                style={{ flex: 2 }}
                onClick={() => {
                  if (!answered) return;
                  advance(lastCorrect);
                }}
                disabled={loading || !answered}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
