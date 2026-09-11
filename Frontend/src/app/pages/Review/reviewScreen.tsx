import { useState, useEffect } from "react";
import { Button, ProgressBar, FillBlankCard, BackButton } from "../../components";
import { ActionError } from "../../components/ActionError";
import {
  getReviewQueue,
  recordProgressAnswer,
  userFacingError,
  type ChunkResponse,
} from "../../api";
import { C } from "../../constants/designToken";

export interface ReviewScreenProps {
  onBack: () => void;
}

export function ReviewScreen({ onBack }: ReviewScreenProps) {
  const [queue, setQueue] = useState<ChunkResponse[]>([]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const items = await getReviewQueue();
      setQueue(
        items.map((c) => ({
          ...c,
          pinyin: c.pinyin || "",
          examples: c.examples || [],
          options: c.options || [],
          needsReview: c.needsReview ?? true,
          mastered: c.mastered ?? false,
        })),
      );
    } catch (err) {
      setError(userFacingError(err, "無法載入複習。請稍後再試。"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const chunk = queue[index];
  const total = queue.length;

  async function advance(isCorrect: boolean) {
    if (chunk) {
      try {
        await recordProgressAnswer(chunk.id, isCorrect);
      } catch (err) {
        setError(userFacingError(err, "無法儲存進度。請稍後再試。"));
        return;
      }
    }
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setAnswered(false);
    setLastCorrect(false);
    setCardKey((k) => k + 1);
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
          Review
        </h2>
        <div />
      </div>

      {!finished && total > 0 && (
        <div style={{ marginBottom: 16 }}>
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
              Wrong book {Math.min(index + 1, total)} / {total}
            </span>
          </div>
          <ProgressBar value={index + 1} max={total} color={C.orange} />
        </div>
      )}

      {error && (
        <ActionError message={error} onRetry={() => void load()} />
      )}
      {loading && (
        <div style={{ color: C.gray, fontWeight: 700 }}>Loading review...</div>
      )}
      {!loading && !error && !finished && total === 0 && (
        <div style={{ textAlign: "center", padding: "48px 12px" }}>
          <div style={{ fontSize: 52 }}>✅</div>
          <h3 style={{ color: C.white, fontWeight: 900 }}>目前沒有到期複習</h3>
          <p style={{ color: C.gray }}>完成新學習後，系統會依間隔排程提醒你。</p>
          <Button
            label="返回首頁"
            bg={C.green}
            shadow={C.greenDark}
            size="lg"
            onClick={onBack}
          />
        </div>
      )}

      {finished ? (
        <div style={{ textAlign: "center", padding: "48px 12px" }}>
          <div style={{ fontSize: 56 }}>✨</div>
          <h3 style={{ color: C.white, fontWeight: 900, fontSize: 22 }}>
            Review complete!
          </h3>
          <Button
            label="Back to Home"
            bg={C.green}
            shadow={C.greenDark}
            size="lg"
            onClick={onBack}
            style={{ marginTop: 16, minWidth: 200 }}
          />
        </div>
      ) : (
        chunk && (
          <>
            <FillBlankCard
              key={cardKey}
              chunk={chunk}
              onAnswered={(correct) => {
                setAnswered(true);
                setLastCorrect(correct);
              }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <Button
                label="Skip"
                bg={C.surface}
                shadow={C.dim}
                fg={C.gray}
                size="md"
                style={{ flex: 1 }}
                onClick={() => advance(false)}
              />
              <Button
                label="Next →"
                bg={C.orange}
                shadow="#C07000"
                size="md"
                style={{ flex: 2 }}
                disabled={!answered}
                onClick={() => advance(lastCorrect)}
              />
            </div>
          </>
        )
      )}
    </div>
  );
}
