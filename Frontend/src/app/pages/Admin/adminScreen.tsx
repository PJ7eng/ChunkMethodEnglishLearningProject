import { useCallback, useEffect, useState } from "react";
import {
  createGenerationJob,
  editAdminChunk,
  getAdminContent,
  getAdminDashboard,
  transitionAdminContent,
  type AdminContentItem,
} from "../../api";
import { C } from "../../constants/designToken";

export function AdminScreen({ onExit }: { onExit: () => void }) {
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof getAdminDashboard>> | null>(null);
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [status, setStatus] = useState("pending_review");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [generationCategory, setGenerationCategory] = useState("workplace");
  const [generationDifficulty, setGenerationDifficulty] = useState("easy");
  const [generationBatchSize, setGenerationBatchSize] = useState(10);

  const load = useCallback(async () => {
    try {
      setMessage(null);
      const [summary, content] = await Promise.all([
        getAdminDashboard(),
        getAdminContent(status),
      ]);
      setDashboard(summary);
      setItems(content);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "載入管理資料失敗");
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function transition(
    item: AdminContentItem,
    action: "approve" | "reject" | "retire" | "restore",
  ) {
    setBusy(item.id);
    try {
      const reason = action === "reject" || action === "retire"
        ? window.prompt("請輸入原因") || undefined
        : undefined;
      await transitionAdminContent(item.id, action, reason);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失敗");
    } finally {
      setBusy(null);
    }
  }

  async function generate() {
    setBusy("generate");
    try {
      await createGenerationJob({
        category: generationCategory,
        difficulty: generationDifficulty,
        batchSize: generationBatchSize,
        triggerReason: "admin-v1-batch",
      });
      setMessage("生成任務已排程；完成後會進入待審佇列。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "建立任務失敗");
    } finally {
      setBusy(null);
    }
  }

  async function edit(item: AdminContentItem, chunk: AdminContentItem["chunks"][number]) {
    const phrase = window.prompt("Phrase", chunk.phrase);
    if (!phrase) return;
    const translation = window.prompt("繁中翻譯", chunk.translation);
    if (!translation) return;
    setBusy(item.id);
    try {
      await editAdminChunk(item.id, chunk.id, { phrase, translation });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "編輯失敗");
    } finally {
      setBusy(null);
    }
  }

  const card = {
    background: C.surface,
    border: `1px solid ${C.surface3}`,
    borderRadius: 14,
    padding: 16,
  };

  return (
    <div style={{ minHeight: "100svh", background: C.bg, color: C.white, padding: 24, overflowY: "auto" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0 }}>ChunkMaster Admin</h1>
            <p style={{ color: C.gray }}>AI 內容必須經人工核准才會發布</p>
          </div>
          <button onClick={onExit}>返回學習端</button>
        </header>

        {message && <p role="status" style={{ color: C.orange }}>{message}</p>}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {dashboard && Object.entries(dashboard).map(([key, value]) => (
            <div key={key} style={card}>
              <div style={{ color: C.gray, fontSize: 12 }}>{key}</div>
              <strong style={{ fontSize: 26 }}>{value}</strong>
            </div>
          ))}
        </section>

        <section style={{ ...card, marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <select value={generationCategory} onChange={(event) => setGenerationCategory(event.target.value)} aria-label="Generation category">
            {["workplace", "smalltalk", "travel", "emotions", "random"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={generationDifficulty} onChange={(event) => setGenerationDifficulty(event.target.value)} aria-label="Generation difficulty">
            {["easy", "medium", "hard"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <input
            type="number"
            min={1}
            max={50}
            value={generationBatchSize}
            onChange={(event) => setGenerationBatchSize(Number(event.target.value))}
            aria-label="Generation batch size"
            style={{ width: 70 }}
          />
          <button disabled={busy === "generate"} onClick={generate}>
            {busy === "generate" ? "排程中…" : "建立生成任務"}
          </button>
          <label>
            狀態{" "}
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="pending_review">待審</option>
              <option value="published">已發布</option>
              <option value="rejected">已拒絕</option>
              <option value="retired">已下架</option>
            </select>
          </label>
          <button onClick={() => void load()}>重新整理</button>
        </section>

        <section style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {items.length === 0 && <div style={card}>目前沒有此狀態的內容。</div>}
          {items.map((item) => (
            <article key={item.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong>{item.category} · {item.difficulty}</strong>
                  <span style={{ color: C.gray }}>　QC {Math.round(item.qualityScore * 100)}%</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {item.status === "pending_review" && <>
                    <button disabled={busy === item.id} onClick={() => void transition(item, "approve")}>核准</button>
                    <button disabled={busy === item.id} onClick={() => void transition(item, "reject")}>拒絕</button>
                  </>}
                  {item.status === "published" &&
                    <button disabled={busy === item.id} onClick={() => void transition(item, "retire")}>下架</button>}
                  {item.status === "retired" &&
                    <button disabled={busy === item.id} onClick={() => void transition(item, "restore")}>恢復</button>}
                </div>
              </div>
              {item.chunks.map((chunk) => (
                <div key={chunk.id} style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.surface3}` }}>
                  <h3 style={{ margin: "0 0 6px" }}>{chunk.phrase}</h3>
                  <div>{chunk.translation}</div>
                  <div style={{ color: C.gray, marginTop: 6 }}>{chunk.examples.map((example) => example.sentence).join(" / ")}</div>
                  <div style={{ marginTop: 6 }}>{chunk.blank}　答案：{chunk.answer}</div>
                  {["pending_review", "rejected", "draft"].includes(item.status) &&
                    <button onClick={() => void edit(item, chunk)} style={{ marginTop: 8 }}>編輯內容</button>}
                </div>
              ))}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
