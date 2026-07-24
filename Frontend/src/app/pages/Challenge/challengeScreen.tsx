import { useState, useEffect } from "react";
import { Button, ProgressBar, FillBlankCard } from "../../components";
import { usePress } from "../../hooks/usePress";
import { getRandomChunk, type ChunkResponse } from "../../api";
import { C } from "../../constants/designToken";

export interface ChallengeScreenProps {
  onBack: () => void;
  totalQuestions?: number;
}

const DEFAULT_TOTAL = 10;

function BackButton({ onClick }: { onClick: () => void }) {
  const { pressed, handlers } = usePress();
  const lift = pressed ? 3 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      {...handlers}
      aria-label="Exit challenge"
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        border: "none",
        backgroundColor: C.surface,
        color: C.white,
        fontSize: 18,
        fontWeight: 900,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 ${4 - lift}px 0 ${C.dim}`,
        transform: `translateY(${lift}px)`,
        transition: "transform 0.08s ease, box-shadow 0.08s ease",
        WebkitTapHighlightColor: "transparent",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      ←
    </button>
  );
}

export function ChallengeScreen({
  onBack,
  totalQuestions = DEFAULT_TOTAL,
}: ChallengeScreenProps) {
  const [chunk, setChunk] = useState<ChunkResponse | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  async function loadChunk() {
    setLoading(true);
    setError(null);
    setAnswered(false);
    try {
      const next = await getRandomChunk();
      setChunk(next);
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

  function advance() {
    if (questionIndex >= totalQuestions) {
      setFinished(true);
      return;
    }
    setQuestionIndex((i) => i + 1);
    loadChunk();
  }

  function handleSkip() {
    advance();
  }

  function handleNext() {
    if (!answered) return;
    advance();
  }

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        padding: "36px 20px 28px",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr 36px",
          alignItems: "center",
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <BackButton onClick={onBack} />
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

      {/* Progress */}
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
              {Math.min(questionIndex, totalQuestions)}/{totalQuestions}
            </span>
          </div>
          <ProgressBar
            value={Math.min(questionIndex, totalQuestions)}
            max={totalQuestions}
            color={C.purple}
          />
        </div>
      )}

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 0,
        }}
      >
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
            <div style={{ fontSize: 64, lineHeight: 1 }}>🏆</div>
            <h3
              style={{
                margin: 0,
                color: C.white,
                fontWeight: 900,
                fontSize: 24,
              }}
            >
              Challenge complete!
            </h3>
            <p
              style={{
                margin: 0,
                color: C.gray,
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.5,
                maxWidth: 280,
              }}
            >
              You finished all {totalQuestions} questions. Great work — keep the streak
              going!
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
              <div style={{ color: C.red, fontWeight: 800, fontSize: 13 }}>
                {error}
              </div>
            )}
            {loading && !chunk && (
              <div
                style={{
                  color: C.gray,
                  fontWeight: 700,
                  fontSize: 14,
                  textAlign: "center",
                  padding: "48px 0",
                }}
              >
                Loading challenge...
              </div>
            )}
            {chunk && (
              <div
                style={{
                  opacity: loading ? 0.55 : 1,
                  transition: "opacity 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  flex: 1,
                }}
              >
                <FillBlankCard
                  key={cardKey}
                  chunk={chunk}
                  onAnswered={() => setAnswered(true)}
                />
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: "auto",
                paddingTop: 8,
                flexShrink: 0,
              }}
            >
              <Button
                label="Skip"
                bg={C.surface}
                shadow={C.dim}
                fg={C.gray}
                size="md"
                style={{ flex: 1 }}
                onClick={handleSkip}
                disabled={loading}
              />
              <Button
                label="Next Chunk →"
                bg={C.purple}
                shadow={C.purpleDk}
                size="md"
                style={{ flex: 2 }}
                onClick={handleNext}
                disabled={loading || !answered}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
