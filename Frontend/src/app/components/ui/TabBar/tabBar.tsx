import { C } from "../../../constants/designToken";

type TabId = "home" | "library" | "settings";

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "library", icon: "📚", label: "Library" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

export interface TabBarProps {
  active: TabId;
  onChange: (t: TabId) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div
      style={{
        height: 68,
        flexShrink: 0,
        backgroundColor: C.surface2,
        borderTop: `1px solid rgba(255,255,255,0.07)`,
        display: "flex",
        boxShadow: "0 -8px 28px rgba(0,0,0,0.55)",
        position: "sticky",
        bottom: 0,
        zIndex: 20,
      }}
    >
      {TABS.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              height: "100%",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              position: "relative",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {/* Active indicator */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: on ? 40 : 0,
                height: 3,
                backgroundColor: C.green,
                borderRadius: "0 0 4px 4px",
                boxShadow: on ? `0 0 12px ${C.green}99` : "none",
                transition:
                  "width 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease",
              }}
            />
            <span
              style={{
                fontSize: 22,
                filter: on ? "none" : "grayscale(1) opacity(0.4)",
                transform: `scale(${on ? 1.18 : 1}) translateY(${on ? -1 : 0}px)`,
                transition: "all 0.2s cubic-bezier(.34,1.56,.64,1)",
              }}
            >
              {t.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
}