import { useState, useEffect } from "react";
import { Button, SearchBar, CategoryPills, BackButton } from "../../components";
import { getLearningProgress, type ChunkResponse } from "../../api";
import { getCategoryMeta } from "../../utils/category";
import { C } from "../../constants/designToken";

interface ChunkWithState extends ChunkResponse {
  needsReview: boolean;
  mastered: boolean;
}

export interface LibraryScreenProps {
  onBack: () => void;
  masteredOnly?: boolean;
  reviewOnly?: boolean;
  titleEmoji?: string;
  titlePrefix?: string;
}

export function LibraryScreen({
  onBack,
  masteredOnly = false,
  reviewOnly = false,
  titleEmoji = "📚",
  titlePrefix = "一共學習到了",
}: LibraryScreenProps) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chunks, setChunks] = useState<ChunkWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const learning = await getLearningProgress();
        let merged: ChunkWithState[] = learning
          .map((entry) => ({
            ...entry.chunk,
            pinyin: entry.chunk.pinyin || "",
            needsReview: entry.needsReview,
            mastered: entry.mastered,
          }))
          .filter((chunk) => filter === "all" || chunk.category === filter);

        if (masteredOnly) {
          merged = learning
            .filter((l) => l.mastered)
            .map((l) => ({
              ...l.chunk,
              pinyin: l.chunk.pinyin || "",
              needsReview: l.needsReview,
              mastered: true,
            }))
            .filter((c) => filter === "all" || c.category === filter);
        } else if (reviewOnly) {
          merged = learning
            .filter((l) => l.needsReview)
            .map((l) => ({
              ...l.chunk,
              pinyin: l.chunk.pinyin || "",
              needsReview: true,
              mastered: l.mastered,
            }))
            .filter((c) => filter === "all" || c.category === filter);
        }

        setChunks(merged);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chunks");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [filter, masteredOnly, reviewOnly]);

  const filtered = chunks.filter(
    (c) => !search || c.phrase.toLowerCase().includes(search.toLowerCase()),
  );

  const reviewCount = chunks.filter((c) => c.needsReview).length;

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "calc(var(--safe-top) + 20px) 20px 10px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <BackButton onClick={onBack} />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: reviewCount > 0 && !masteredOnly ? 8 : 0,
          }}
        >
          <h2 style={{ color: C.white, fontWeight: 900, fontSize: 22, margin: 0 }}>
            {titlePrefix} {chunks.length} chunks!
          </h2>
          <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{titleEmoji}</span>
        </div>
        {reviewCount > 0 && !masteredOnly && !reviewOnly && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
            <div
              style={{
                backgroundColor: C.red + "22",
                border: `1.5px solid ${C.red}55`,
                borderRadius: 10,
                padding: "5px 10px",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: C.red,
                  boxShadow: `0 0 6px ${C.red}`,
                }}
              />
              <span style={{ color: C.red, fontSize: 11, fontWeight: 900 }}>
                {reviewCount} to review
              </span>
            </div>
          </div>
        )}

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search chunks..."
          style={{ marginTop: 12 }}
        />
      </div>

      <CategoryPills value={filter} onChange={setFilter} />

      <div
        style={{
          padding: "0 16px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {error && (
          <div style={{ color: C.red, fontWeight: 800, fontSize: 13, marginBottom: 10 }}>
            {error}
          </div>
        )}
        {loading ? (
          <div style={{ color: C.gray, fontWeight: 700 }}>Loading chunks...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <div style={{ color: C.gray, fontWeight: 700, fontSize: 14 }}>
              No chunks found
            </div>
          </div>
        ) : (
          filtered.map((chunk) => {
            const cat = getCategoryMeta(chunk.category);
            const isOpen = expanded === chunk.id;
            return (
              <div key={chunk.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : chunk.id)}
                  style={{
                    width: "100%",
                    backgroundColor: C.surface,
                    borderRadius: isOpen ? "16px 16px 0 0" : 16,
                    padding: "13px 14px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    boxShadow: isOpen ? "none" : `0 4px 0 ${C.dim}`,
                    position: "relative",
                    fontFamily: "'Nunito', sans-serif",
                    transition: "border-radius 0.2s ease",
                  }}
                >
                  {chunk.needsReview && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        backgroundColor: C.red,
                        boxShadow: `0 0 8px ${C.red}`,
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 13,
                      backgroundColor: cat.bg,
                      border: `1.5px solid ${cat.color}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      flexShrink: 0,
                      boxShadow: `0 3px 0 ${C.dim}`,
                    }}
                  >
                    {cat.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <div
                      style={{
                        fontWeight: 900,
                        color: C.white,
                        fontSize: 15,
                        marginBottom: 3,
                      }}
                    >
                      {chunk.phrase}
                    </div>
                    <div style={{ color: C.gray, fontSize: 12, fontWeight: 600 }}>
                      {chunk.translation}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 5,
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {chunk.mastered && (
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 900,
                          color: C.green,
                          backgroundColor: C.green + "1A",
                          border: `1.5px solid ${C.green}44`,
                          padding: "2px 7px",
                          borderRadius: 6,
                        }}
                      >
                        ✓ MASTERED
                      </div>
                    )}
                    {chunk.needsReview && (
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 900,
                          color: C.red,
                          backgroundColor: C.red + "1A",
                          padding: "2px 7px",
                          borderRadius: 6,
                        }}
                      >
                        REVIEW
                      </div>
                    )}
                    <span style={{ color: C.gray, fontSize: 14, marginLeft: 4 }}>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                </button>
                {isOpen && (
                  <div
                    style={{
                      backgroundColor: "#1E1E24",
                      borderRadius: "0 0 16px 16px",
                      padding: "0 14px 14px",
                      boxShadow: `0 4px 0 ${C.dim}`,
                      borderTop: `1px solid ${C.surface3}`,
                      animation: "fadeSlideIn 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                        paddingTop: 12,
                      }}
                    >
                      {(chunk.examples || []).map((ex, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "9px 12px",
                            backgroundColor: "#12181E",
                            borderRadius: 10,
                            borderLeft: `3px solid ${C.blue}`,
                          }}
                        >
                          <span
                            style={{
                              color: "#CCC",
                              fontSize: 12,
                              fontWeight: 600,
                              lineHeight: 1.6,
                            }}
                          >
                            {ex}
                          </span>
                        </div>
                      ))}
                      <Button
                        label={
                          typeof window !== "undefined" && "speechSynthesis" in window
                            ? "🔊 Hear phrase"
                            : "Practice this chunk →"
                        }
                        bg={cat.color}
                        shadow={cat.color + "88"}
                        size="sm"
                        full
                        style={{ marginTop: 4 }}
                        onClick={() => {
                          if ("speechSynthesis" in window) {
                            const u = new SpeechSynthesisUtterance(chunk.phrase);
                            u.lang = "en-US";
                            window.speechSynthesis.speak(u);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
