import { useState, useEffect } from "react";
import { Card, Button } from "../../components";
import { getChunks, type ChunkResponse } from "../../api";
import { CATEGORIES } from "../../constants/categories";
import { getCategoryMeta } from "../../utils/category";
import { C } from "../../constants/designToken";

// 扩展类型，添加本地状态字段
interface ChunkWithState extends ChunkResponse {
  needsReview: boolean;
  mastered: boolean;
}

export function LibraryScreen() {
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
        const data = await getChunks(filter === "all" ? undefined : filter);
        setChunks(
          data.map((item) => ({ ...item, needsReview: false, mastered: false }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chunks");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [filter]);

  const filtered = chunks.filter(
    (c) =>
      !search || c.phrase.toLowerCase().includes(search.toLowerCase())
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
      {/* Header */}
      <div style={{ padding: "14px 20px 10px", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 4,
          }}
        >
          <div>
            <h2 style={{ color: C.white, fontWeight: 900, fontSize: 22, margin: 0 }}>
              My Chunks
            </h2>
            <p style={{ color: C.gray, fontSize: 12, fontWeight: 700, margin: "3px 0 0" }}>
              {chunks.length} collected ·{" "}
              {chunks.filter((c) => c.mastered).length} mastered
            </p>
          </div>
          {reviewCount > 0 && (
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
          )}
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: C.surface,
            borderRadius: 14,
            padding: "10px 14px",
            marginTop: 12,
            border: `1.5px solid ${search ? C.purple + "88" : "transparent"}`,
            boxShadow: `0 3px 0 ${C.dim}`,
            transition: "border-color 0.2s ease",
          }}
        >
          <span style={{ fontSize: 14, color: C.gray }}>🔍</span>
          <input
            placeholder="Search chunks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              color: C.white,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: 14,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.gray,
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ overflowX: "auto", paddingBottom: 12, flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 7,
            padding: "0 20px",
            width: "max-content",
          }}
        >
          {[
            { id: "all", emoji: "⭐", label: "All", color: C.gray, bg: C.surface },
            ...CATEGORIES.slice(1),
          ].map((cat) => {
            const active = filter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: active
                    ? `2px solid ${cat.color}`
                    : "2px solid transparent",
                  backgroundColor: active ? cat.bg || C.surface : C.surface,
                  color: active ? cat.color : C.gray,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chunk list */}
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
                  {/* Red dot */}
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
                  {/* Icon */}
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
                {/* Expanded detail */}
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
                      {chunk.examples.map((ex, i) => (
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
                        label="Practice this chunk →"
                        bg={cat.color}
                        shadow={cat.color + "88"}
                        size="sm"
                        full
                        style={{ marginTop: 4 }}
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