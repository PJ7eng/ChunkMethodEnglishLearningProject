import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  createGenerationJob,
  editAdminChunk,
  getAdminContent,
  getAdminDashboard,
  getGenerationJob,
  getGenerationJobs,
  transitionAdminContent,
  type AdminContentItem,
} from "../../api";
import { BackButton, Button, ConfirmModal } from "../../components/ui";
import { usePress } from "../../hooks/usePress";
import { C } from "../../constants/designToken";

const CATEGORY_OPTIONS = [
  { value: "workplace", label: "職場 Workplace" },
  { value: "smalltalk", label: "閒聊 Small Talk" },
  { value: "travel", label: "旅遊 Travel" },
  { value: "emotions", label: "情緒 Emotions" },
  { value: "random", label: "隨機 Random" },
] as const;

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "簡單 Easy" },
  { value: "medium", label: "中等 Medium" },
  { value: "hard", label: "困難 Hard" },
] as const;

const STATUS_OPTIONS = [
  { value: "pending_review", label: "待審", countKey: "pending", bg: C.orange, shadow: "#B36A00" },
  { value: "published", label: "已發布", countKey: "published", bg: C.green, shadow: C.greenDark },
  { value: "rejected", label: "已拒絕", countKey: "rejected", bg: C.red, shadow: "#B33333" },
  { value: "retired", label: "已下架", countKey: "retired", bg: C.purple, shadow: C.purpleDk },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];
type Dashboard = Awaited<ReturnType<typeof getAdminDashboard>>;
type GenerationNotice = { tone: "success" | "error"; text: string } | null;

const JOB_POLL_MS = 3_000;
const JOB_STUCK_MS = 6 * 60_000;

const controlStyle: CSSProperties = {
  width: "100%",
  maxWidth: 260,
  appearance: "none",
  WebkitAppearance: "none",
  backgroundColor: C.surface2,
  color: C.white,
  border: `1.5px solid ${C.surface3}`,
  borderRadius: 12,
  padding: "10px 36px 10px 12px",
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 700,
  fontSize: 14,
  outline: "none",
  cursor: "pointer",
  boxSizing: "border-box",
};

const card: CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.surface3}`,
  borderRadius: 14,
  padding: 16,
};

function FormRow({
  label,
  htmlFor,
  children,
  showChevron = false,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  showChevron?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "12px 0",
        borderBottom: `1px solid ${C.surface3}`,
      }}
    >
      <label
        htmlFor={htmlFor}
        style={{
          color: C.gray,
          fontWeight: 800,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative", flex: "0 1 260px", minWidth: 160 }}>
        {children}
        {showChevron && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.gray,
              pointerEvents: "none",
              fontSize: 12,
            }}
          >
            ▾
          </span>
        )}
      </div>
    </div>
  );
}

function StatusEntryButton({
  label,
  count,
  bg,
  shadow,
  onClick,
}: {
  label: string;
  count?: number;
  bg: string;
  shadow: string;
  onClick: () => void;
}) {
  const { pressed, handlers } = usePress();
  const lift = pressed ? 0 : 5;

  return (
    <button
      type="button"
      {...handlers}
      onClick={onClick}
      style={{
        minHeight: 88,
        padding: "16px 14px",
        backgroundColor: bg,
        color: C.white,
        border: "none",
        borderRadius: 16,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 900,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 6,
        boxShadow: `0 ${lift}px 0 ${shadow}`,
        transform: `translateY(${pressed ? 5 : 0}px)`,
        transition: "transform 0.08s ease, box-shadow 0.08s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ fontSize: 18 }}>{label}</span>
      <span style={{ fontSize: 13, opacity: 0.85 }}>
        {count == null ? "查看內容" : `${count} 則`}
      </span>
    </button>
  );
}

function ContentList({
  items,
  busy,
  onTransition,
  onEdit,
}: {
  items: AdminContentItem[];
  busy: string | null;
  onTransition: (item: AdminContentItem, action: "approve" | "reject" | "retire" | "restore") => void;
  onEdit: (item: AdminContentItem, chunk: AdminContentItem["chunks"][number]) => void;
}) {
  if (items.length === 0) {
    return <div style={card}>目前沒有此狀態的內容。</div>;
  }

  return (
    <>
      {items.map((item) => (
        <article key={item.id} style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <strong>{item.category} · {item.difficulty}</strong>
              <span style={{ color: C.gray }}>　QC {Math.round(item.qualityScore * 100)}%</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {item.status === "pending_review" && <>
                <button disabled={busy === item.id} onClick={() => onTransition(item, "approve")}>核准</button>
                <button disabled={busy === item.id} onClick={() => onTransition(item, "reject")}>拒絕</button>
              </>}
              {item.status === "published" &&
                <button disabled={busy === item.id} onClick={() => onTransition(item, "retire")}>下架</button>}
              {item.status === "retired" &&
                <button disabled={busy === item.id} onClick={() => onTransition(item, "restore")}>恢復</button>}
            </div>
          </div>
          {item.generationJob && (
            <div style={{ color: C.gray, fontSize: 12, marginTop: 8 }}>
              {item.generationJob.provider || "AI"} / {item.generationJob.model || "unknown"}
              {" · prompt "}{item.generationJob.promptVersion || "unknown"}
              {" · tokens "}{item.generationJob.inputTokens}+{item.generationJob.outputTokens}
              {" · US$"}{item.generationJob.estimatedCost.toFixed(6)}
              {" · retries "}{item.generationJob.retryCount}
            </div>
          )}
          {item.chunks.map((chunk) => (
            <div key={chunk.id} style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.surface3}` }}>
              <h3 style={{ margin: "0 0 6px" }}>{chunk.phrase}</h3>
              <div>{chunk.translation}</div>
              <div style={{ color: C.gray, marginTop: 6 }}>
                {chunk.cefr || "未分級"} · {chunk.register || "未標示語域"} · {chunk.usage || "未填用法"}
              </div>
              <div style={{ color: C.gray, marginTop: 6 }}>{chunk.examples.map((example) => example.sentence).join(" / ")}</div>
              <div style={{ marginTop: 6 }}>{chunk.blank}　答案：{chunk.answer}</div>
              {["pending_review", "rejected", "draft"].includes(item.status) &&
                <button onClick={() => onEdit(item, chunk)} style={{ marginTop: 8 }}>編輯內容</button>}
            </div>
          ))}
        </article>
      ))}
    </>
  );
}

export function AdminScreen({ onExit }: { onExit: () => void }) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [viewingStatus, setViewingStatus] = useState<StatusValue | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<GenerationNotice>(null);
  const [generationCategory, setGenerationCategory] = useState("workplace");
  const [generationDifficulty, setGenerationDifficulty] = useState("easy");
  const [generationBatchSize, setGenerationBatchSize] = useState(10);
  const generationLocked = busy === "generate" || Boolean(activeJobId);

  const loadDashboard = useCallback(async () => {
    const summary = await getAdminDashboard();
    setDashboard(summary);
    return summary;
  }, []);

  const loadContent = useCallback(async (status: StatusValue) => {
    const content = await getAdminContent(status);
    setItems(content);
    return content;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadHome() {
      try {
        setMessage(null);
        await loadDashboard();
        const jobs = await getGenerationJobs();
        const active = jobs.find((job) => job.status === "pending" || job.status === "running");
        if (!cancelled && active) setActiveJobId(active.id);
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "載入管理資料失敗");
        }
      }
    }
    void loadHome();
    return () => {
      cancelled = true;
    };
  }, [loadDashboard]);

  useEffect(() => {
    if (!activeJobId) return;
    let cancelled = false;
    const startedAt = Date.now();

    async function settle(jobId: string) {
      try {
        const job = await getGenerationJob(jobId);
        if (cancelled) return true;
        if (job.status === "success") {
          setActiveJobId(null);
          setGenerationNotice({ tone: "success", text: "生成完成，內容已進入待審。" });
          await loadDashboard();
          return true;
        }
        if (job.status === "failed") {
          setActiveJobId(null);
          setGenerationNotice({
            tone: "error",
            text: job.errorMessage || "生成任務失敗",
          });
          await loadDashboard();
          return true;
        }
        if (Date.now() - startedAt >= JOB_STUCK_MS) {
          setActiveJobId(null);
          setGenerationNotice({
            tone: "error",
            text: "任務逾時仍未結束，可能已卡住。請稍後再試或檢查後端狀態。",
          });
          return true;
        }
      } catch {
        return false;
      }
      return false;
    }

    void settle(activeJobId);
    const timer = setInterval(() => {
      void settle(activeJobId);
    }, JOB_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeJobId, loadDashboard]);

  useEffect(() => {
    if (!viewingStatus) {
      setItems([]);
      return;
    }
    const status = viewingStatus;
    let cancelled = false;
    async function loadStatus() {
      try {
        setMessage(null);
        await loadContent(status);
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "載入內容失敗");
        }
      }
    }
    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [viewingStatus, loadContent]);

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
      if (viewingStatus) await loadContent(viewingStatus);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失敗");
    } finally {
      setBusy(null);
    }
  }

  function clampBatchSize(value: number) {
    if (!Number.isFinite(value)) return 1;
    return Math.min(50, Math.max(1, Math.round(value)));
  }

  async function generate() {
    if (generationLocked) return;
    const batchSize = clampBatchSize(generationBatchSize);
    setGenerationBatchSize(batchSize);
    setConfirmGenerate(false);
    setGenerationNotice(null);
    setBusy("generate");
    try {
      const job = await createGenerationJob({
        category: generationCategory,
        difficulty: generationDifficulty,
        batchSize,
        triggerReason: "admin-v1-batch",
      });
      setActiveJobId(job.id);
    } catch (error) {
      setGenerationNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "建立任務失敗",
      });
    } finally {
      setBusy(null);
    }
  }

  async function edit(item: AdminContentItem, chunk: AdminContentItem["chunks"][number]) {
    const phrase = window.prompt("Phrase", chunk.phrase);
    if (!phrase) return;
    const translation = window.prompt("繁中翻譯", chunk.translation);
    if (!translation) return;
    const usage = window.prompt("用法說明", chunk.usage || "");
    if (!usage) return;
    const register = window.prompt("語域（例如 neutral / informal / formal）", chunk.register || "neutral");
    if (!register) return;
    const cefr = window.prompt("CEFR（A1–C2）", chunk.cefr || "A2");
    if (!cefr) return;
    const blank = window.prompt("填空題（須包含 ___）", chunk.blank);
    if (!blank) return;
    const answer = window.prompt("答案", chunk.answer);
    if (!answer) return;
    const options = window.prompt("選項（每行一個，至少 3 個）", chunk.options.join("\n"));
    if (!options) return;
    const examples = window.prompt(
      "例句（每行一個，至少 2 句）",
      chunk.examples.map((example) => example.sentence).join("\n"),
    );
    if (!examples) return;
    setBusy(item.id);
    try {
      await editAdminChunk(item.id, chunk.id, {
        phrase,
        translation,
        usage,
        register,
        cefr,
        blank,
        answer,
        options: options.split("\n").map((value) => value.trim()).filter(Boolean),
        examples: examples.split("\n").map((sentence, index) => ({
          sentence: sentence.trim(),
          translation: chunk.examples[index]?.translation,
        })).filter((example) => example.sentence),
      });
      if (viewingStatus) await loadContent(viewingStatus);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "編輯失敗");
    } finally {
      setBusy(null);
    }
  }

  const shell: CSSProperties = {
    height: "100dvh",
    maxHeight: "100dvh",
    overflowX: "hidden",
    overflowY: "hidden",
    background: C.bg,
    color: C.white,
    padding: "calc(var(--safe-top) + 20px) 20px calc(var(--safe-bottom) + 20px)",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Nunito', sans-serif",
    position: "relative",
  };

  if (viewingStatus) {
    const statusMeta = STATUS_OPTIONS.find((option) => option.value === viewingStatus);
    return (
      <div style={shell}>
        <header
          style={{
            display: "grid",
            gridTemplateColumns: "36px 1fr 36px",
            alignItems: "center",
            marginBottom: 16,
            flexShrink: 0,
          }}
        >
          <BackButton
            onClick={() => {
              setViewingStatus(null);
              setMessage(null);
              void loadDashboard();
            }}
            ariaLabel="返回 Admin"
          />
          <h1
            style={{
              margin: 0,
              textAlign: "center",
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            {statusMeta?.label ?? viewingStatus}
          </h1>
          <div />
        </header>
        {message && <p role="status" style={{ color: C.orange, flexShrink: 0 }}>{message}</p>}
        <section
          style={{
            display: "grid",
            gap: 12,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            paddingBottom: 8,
            overscrollBehavior: "contain",
          }}
        >
          <ContentList
            items={items}
            busy={busy}
            onTransition={(item, action) => void transition(item, action)}
            onEdit={(item, chunk) => void edit(item, chunk)}
          />
        </section>
      </div>
    );
  }

  return (
    <div style={{ ...shell, overflowY: "auto" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", width: "100%" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0 }}>ChunkMaster Admin</h1>
            <p style={{ color: C.gray }}>AI 內容必須經人工核准才會發布</p>
          </div>
          <button type="button" onClick={onExit}>返回學習端</button>
        </header>

        {message && <p role="status" style={{ color: C.orange }}>{message}</p>}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 8 }}>
          {[
            { key: "users", label: "users", value: dashboard?.users },
            { key: "pending", label: "pending", value: dashboard?.pending },
            { key: "published", label: "published", value: dashboard?.published },
            { key: "rejected", label: "rejected", value: dashboard?.rejected },
            { key: "retired", label: "retired", value: dashboard?.retired },
            { key: "failedJobs", label: "failedJobs", value: dashboard?.failedJobs },
          ].map((stat) => (
            <div key={stat.key} style={card}>
              <div style={{ color: C.gray, fontSize: 12 }}>{stat.label}</div>
              <strong style={{ fontSize: 26 }}>{stat.value ?? "—"}</strong>
            </div>
          ))}
        </section>

        <section style={{ ...card, marginTop: 18 }}>
          <FormRow label="句子種類" htmlFor="admin-category" showChevron>
            <select
              id="admin-category"
              value={generationCategory}
              onChange={(event) => setGenerationCategory(event.target.value)}
              aria-label="句子種類"
              style={controlStyle}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormRow>
          <FormRow label="句子難易度" htmlFor="admin-difficulty" showChevron>
            <select
              id="admin-difficulty"
              value={generationDifficulty}
              onChange={(event) => setGenerationDifficulty(event.target.value)}
              aria-label="句子難易度"
              style={controlStyle}
            >
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormRow>
          <FormRow label="要生成的句子數量" htmlFor="admin-batch-size">
            <input
              id="admin-batch-size"
              type="number"
              min={1}
              max={50}
              value={Number.isFinite(generationBatchSize) ? generationBatchSize : ""}
              onChange={(event) => setGenerationBatchSize(Number(event.target.value))}
              onBlur={() => setGenerationBatchSize((value) => clampBatchSize(value))}
              aria-label="要生成的句子數量"
              style={{ ...controlStyle, cursor: "text", paddingRight: 12 }}
            />
          </FormRow>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Button
                label={generationLocked ? "任務已排程..." : "建立生成任務"}
                bg={C.green}
                shadow={C.greenDark}
                size="sm"
                full
                disabled={generationLocked}
                onClick={() => setConfirmGenerate(true)}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Button
                label="重新整理"
                bg={C.blue}
                shadow={C.blueDark}
                size="sm"
                full
                onClick={() => {
                  setMessage(null);
                  setGenerationNotice(null);
                  void loadDashboard().catch((error) => {
                    setMessage(error instanceof Error ? error.message : "載入管理資料失敗");
                  });
                }}
              />
            </div>
          </div>
          {generationNotice && (
            <p
              role="status"
              style={{
                margin: "12px 0 0",
                color: generationNotice.tone === "success" ? C.green : C.red,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {generationNotice.text}
            </p>
          )}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
            marginTop: 18,
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <StatusEntryButton
              key={option.value}
              label={option.label}
              count={dashboard?.[option.countKey]}
              bg={option.bg}
              shadow={option.shadow}
              onClick={() => setViewingStatus(option.value)}
            />
          ))}
        </section>
      </div>
      {confirmGenerate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <ConfirmModal
            title="開始生成任務？"
            message={`將生成 ${clampBatchSize(generationBatchSize)} 條「${
              CATEGORY_OPTIONS.find((option) => option.value === generationCategory)?.label ?? generationCategory
            }／${
              DIFFICULTY_OPTIONS.find((option) => option.value === generationDifficulty)?.label ?? generationDifficulty
            }」內容，完成後會進入待審。`}
            icon="✨"
            confirmLabel="確定"
            cancelLabel="取消"
            danger={false}
            onClose={() => setConfirmGenerate(false)}
            onConfirm={() => void generate()}
          />
        </div>
      )}
    </div>
  );
}
