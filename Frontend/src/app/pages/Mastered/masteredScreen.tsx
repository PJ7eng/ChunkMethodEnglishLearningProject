import { useState, useEffect } from "react";
import { Button, SearchBar, CategoryPills } from "../../components";
import { getChunks, type ChunkResponse } from "../../api";
import { getCategoryMeta } from "../../utils/category";
import { usePress } from "../../hooks/usePress";
import { C } from "../../constants/designToken";

interface ChunkWithState extends ChunkResponse {
  needsReview: boolean;
  mastered: boolean;
}

export interface MasteredScreenProps {
  onBack: () => void;
}

function BackButton({ onClick }: { onClick: () => void }) {
  const { pressed, handlers } = usePress();
  const lift = pressed ? 3 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      {...handlers}
      aria-label="Go back"
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
        flexShrink: 0,
      }}
    >
      ←
    </button>
  );
}

export function MasteredScreen({ onBack }: MasteredScreenProps) {
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
          data.map((item, index) => ({
            ...item,
            needsReview: false,
            mastered: index < 3,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chunks");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [filter]);

  const masteredChunks = chunks.filter((c) => c.mastered);
  const filtered = masteredChunks.filter(
    (c) => !search || c.phrase.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "36px 20px 10px", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <BackButton onClick={onBack} />
        </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              minWidth: 0,
              margin: "20px 0"
            }}
          >
            <h2
              style={{
                color: C.white,
                fontWeight: 900,
                fontSize: 22,
                margin: 0,
              }}
            >
              一共掌握到 {masteredChunks.length} chunks!
            </h2>
            <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0, marginLeft: 8 }}>
              🏅
            </span>
          </div>
        

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search chunks..."
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
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏅</div>
            <div style={{ color: C.gray, fontWeight: 700, fontSize: 14 }}>
              No mastered chunks yet
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
