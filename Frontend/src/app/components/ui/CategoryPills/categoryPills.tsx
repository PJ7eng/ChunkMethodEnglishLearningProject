import type { CSSProperties } from "react";
import { Pill } from "../Pill";
import { CATEGORIES } from "../../../constants/categories";

export interface CategoryPillsProps {
  value: string;
  onChange: (id: string) => void;
  /** Defaults to CATEGORIES (includes "all"). */
  categories?: readonly {
    id: string;
    emoji: string;
    label: string;
    color: string;
    bg: string;
  }[];
  /** Exclude category ids (e.g. ["all"] for form pickers). */
  excludeIds?: string[];
  /** Wrap pills instead of horizontal scroll. */
  wrap?: boolean;
  style?: CSSProperties;
  contentStyle?: CSSProperties;
}

export function CategoryPills({
  value,
  onChange,
  categories = CATEGORIES,
  excludeIds = [],
  wrap = false,
  style,
  contentStyle,
}: CategoryPillsProps) {
  const list = categories.filter((c) => !excludeIds.includes(c.id));

  if (wrap) {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          ...style,
        }}
      >
        {list.map((cat) => (
          <Pill
            key={cat.id}
            cat={cat}
            active={value === cat.id}
            onClick={() => onChange(cat.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: "auto",
        // Room for active Pill lift (translateY -2) + 2px border / shadow
        // so top/bottom edges are not clipped by overflow-x:auto.
        paddingTop: 6,
        paddingBottom: 12,
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "0 20px",
          width: "max-content",
          ...contentStyle,
        }}
      >
        {list.map((cat) => (
          <Pill
            key={cat.id}
            cat={cat}
            active={value === cat.id}
            onClick={() => onChange(cat.id)}
          />
        ))}
      </div>
    </div>
  );
}
