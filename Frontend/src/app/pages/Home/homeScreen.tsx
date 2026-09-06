import { useState, useEffect } from "react";
import { ProgressBar, Pill, ChunkCard, EmptyState } from "../../components";
import {
  getRandomChunk,
  getCategoryStats,
  getTodayProgress,
  recordProgressAnswer,
  type ChunkResponse,
} from "../../api";
import { CATEGORIES } from "../../constants/categories";
import { C } from "../../constants/designToken";

export interface HomeScreenProps {
  onNavigateToLibrary?: () => void;
  onNavigateToStreak?: () => void;
  onNavigateToMastered?: () => void;
  onNavigateToChallenge?: () => void;
  onNavigateToReview?: () => void;
  dailyGoal?: number;
  soundEnabled?: boolean;
}

function playCorrectSound(enabled?: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    /* ignore */
  }
}

export function HomeScreen({
  onNavigateToLibrary,
  onNavigateToStreak,
  onNavigateToMastered,
  onNavigateToChallenge,
  onNavigateToReview,
  dailyGoal = 10,
  soundEnabled = true,
}: HomeScreenProps) {
  const [cat, setCat] = useState("all");
  const [chunk, setChunk] = useState<ChunkResponse | null>(null);
  const [key, setKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  const [goal, setGoal] = useState(dailyGoal);
  const [streak, setStreak] = useState(0);
  const [atGoalBoundary, setAtGoalBoundary] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [shownAt, setShownAt] = useState(Date.now());

  const progressValue = Math.min(done, goal);

  useEffect(() => {
    setGoal(dailyGoal);
  }, [dailyGoal]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const today = await getTodayProgress();
        if (cancelled) return;
        setDone(today.completedCount);
        setGoal(today.goal || dailyGoal);
        setStreak(today.streak);
      } catch {
        /* keep defaults */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dailyGoal]);

  async function refreshStats() {
    try {
      const stats = await getCategoryStats();
      setLearnedCount(stats.totals.learned);
      setMasteredCount(stats.totals.mastered);
      setReviewCount(stats.totals.needsReview);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    refreshStats();
  }, []);

  async function draw() {
    setLoading(true);
    setError(null);
    try {
      const next = await getRandomChunk(cat);
      setChunk({
        ...next,
        pinyin: next.pinyin || "",
        needsReview: next.needsReview ?? false,
        mastered: next.mastered ?? false,
        examples: next.examples || [],
        options: next.options || [],
      });
      setKey((k) => k + 1);
      setShownAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chunk");
    } finally {
      setLoading(false);
    }
  }

  async function recordAndBump(chunkId: string, isCorrect: boolean) {
    try {
      await recordProgressAnswer(chunkId, isCorrect, undefined, Date.now() - shownAt);
      setError(null);
      if (isCorrect) playCorrectSound(soundEnabled);
      const today = await getTodayProgress();
      setDone(today.completedCount);
      setGoal(today.goal || dailyGoal);
      setStreak(today.streak);
      refreshStats();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save progress");
      return false;
    }
  }

  function handleExit() {
    setAtGoalBoundary(false);
    setChunk(null);
  }

  async function handleNextChunk(remembered: boolean) {
    if (!chunk) return;
    const nextDone = done + 1;
    const hitGoal = nextDone > 0 && nextDone % goal === 0;
    const saved = await recordAndBump(chunk.id, remembered);
    if (!saved) return;
    if (hitGoal) {
      setAtGoalBoundary(true);
    }
    await draw();
  }

  function handleCompleteToday() {
    setAtGoalBoundary(false);
    setChunk(null);
  }

  async function handleKeepLearning() {
    setAtGoalBoundary(false);
    await draw();
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
        <button
          type="button"
          onClick={onNavigateToStreak}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            backgroundColor: C.surface,
            borderRadius: 14,
            padding: "7px 12px",
            boxShadow: `0 4px 0 ${C.dim}`,
            flexShrink: 0,
            border: "none",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 19 }}>🔥</span>
          <span style={{ fontWeight: 900, fontSize: 19, color: C.orange }}>
            {streak}
          </span>
        </button>
      </div>

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
            reviewCount={reviewCount}
            onReviewClick={onNavigateToReview}
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
