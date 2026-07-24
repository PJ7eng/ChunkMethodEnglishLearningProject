import { useState } from "react";
import { ProgressBar, Pill, ChunkCard, EmptyState } from "../../components";
import { getRandomChunk, type ChunkResponse } from "../../api";
import { CATEGORIES } from "../../constants/categories";
import { C } from "../../constants/designToken";

export interface HomeScreenProps {
  onNavigateToLibrary?: () => void;
  onNavigateToStreak?: () => void;
  onNavigateToMastered?: () => void;
  onNavigateToChallenge?: () => void;
}

export function HomeScreen({
  onNavigateToLibrary,
  onNavigateToStreak,
  onNavigateToMastered,
  onNavigateToChallenge,
}: HomeScreenProps) {
  const [cat, setCat] = useState("all");
  const [chunk, setChunk] = useState<ChunkResponse | null>(null);
  const [key, setKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  const [atGoalBoundary, setAtGoalBoundary] = useState(false);
  const streak = 12;
  const goal = 12;
  const learnedCount = 47;
  const masteredCount = 3;

  const progressValue = Math.min(done, goal);

  async function draw() {
    setLoading(true);
    setError(null);
    try {
      const next = await getRandomChunk(cat);
      setChunk(next);
      setKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chunk");
    } finally {
      setLoading(false);
    }
  }

  function handleExit() {
    setAtGoalBoundary(false);
    setChunk(null);
  }

  function handleNextChunk() {
    setDone((d) => {
      const next = d + 1;
      if (next > 0 && next % goal === goal - 1) {
        setAtGoalBoundary(true);
      }
      return next;
    });
    draw();
  }

  function handleCompleteToday() {
    setDone((d) => d + 1);
    setAtGoalBoundary(false);
    setChunk(null);
  }

  function handleKeepLearning() {
    setDone((d) => d + 1);
    setAtGoalBoundary(false);
    draw();
  }

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          padding: "14px 20px 10px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1 }}>
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
              Daily Progress
            </span>
            <span style={{ fontSize: 11, fontWeight: 900, color: C.green }}>
              {progressValue}/{goal} chunks
            </span>
          </div>
          <ProgressBar value={progressValue} max={goal} />
        </div>
        {/* Streak pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            backgroundColor: C.surface,
            borderRadius: 14,
            padding: "7px 12px",
            boxShadow: `0 4px 0 ${C.dim}`,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 19 }}>🔥</span>
          <span style={{ fontWeight: 900, fontSize: 19, color: C.orange }}>
            {streak}
          </span>
        </div>
      </div>

      {/* ── Category pills ── */}
      <div style={{ overflowX: "auto", paddingBottom: 12, flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "5px 20px",
            width: "max-content",
          }}
        >
          {CATEGORIES.map((c) => (
            <Pill
              key={c.id}
              cat={c}
              active={cat === c.id}
              onClick={() => setCat(c.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Main ── */}
      <div
        style={{
          flex: 1,
          padding: "0 20px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {error && (
          <div style={{ color: C.red, fontWeight: 800, fontSize: 13 }}>
            {error}
          </div>
        )}
        {!chunk ? (
          <EmptyState
            onDraw={draw}
            loading={loading}
            learnedCount={learnedCount}
            streakCount={streak}
            masteredCount={masteredCount}
            onLearnedClick={onNavigateToLibrary}
            onStreakClick={onNavigateToStreak}
            onMasteredClick={onNavigateToMastered}
            onStartChallenge={onNavigateToChallenge}
          />
        ) : (
          <ChunkCard
            key={key}
            chunk={chunk}
            showGoalChoice={atGoalBoundary}
            onExit={handleExit}
            onNextChunk={handleNextChunk}
            onCompleteToday={handleCompleteToday}
            onKeepLearning={handleKeepLearning}
          />
        )}
      </div>
    </div>
  );
}
