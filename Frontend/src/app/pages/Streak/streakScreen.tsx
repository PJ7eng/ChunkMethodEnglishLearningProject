import { useEffect, useState } from "react";
import { Card, Calendar, BackButton } from "../../components";
import { getStreakStats, getProgressCalendar } from "../../api";
import { C } from "../../constants/designToken";

export interface StreakScreenProps {
  onBack: () => void;
}

function StatMiniCard({ value, label }: { value: number; label: string }) {
  return (
    <Card style={{ flex: 1, padding: "8px 16px 14px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>🔥</span>
        <div style={{ fontWeight: 900, fontSize: 22, color: C.white, lineHeight: 1.1 }}>
          {value}
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.gray, marginTop: 2 }}>
        {label}
      </div>
    </Card>
  );
}

export function StreakScreen({ onBack }: StreakScreenProps) {
  const [streak, setStreak] = useState(0);
  const [totalPracticed, setTotalPracticed] = useState(0);
  const [dayPracticed, setDayPracticed] = useState(0);
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  useEffect(() => {
    getStreakStats()
      .then((s) => {
        setStreak(s.currentStreak);
        setTotalPracticed(s.totalPracticedDays);
        setDayPracticed(s.weekData.filter((d) => d.done).length);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    getProgressCalendar(viewYear, viewMonth)
      .then((res) => {
        const set = new Set<string>();
        for (const d of res.days) {
          // Calendar uses `year-month-day` with 0-based month
          const [y, m, day] = d.date.split("-").map(Number);
          set.add(`${y}-${m - 1}-${day}`);
        }
        setCompletedDays(set);
      })
      .catch(() => setCompletedDays(new Set()));
  }, [viewYear, viewMonth]);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        padding: "36px 20px 28px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr 36px",
          alignItems: "center",
          marginBottom: 20,
          flexShrink: 0,
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
          Streak
        </h2>
        <div />
      </div>

      <Card
        style={{
          marginBottom: 16,
          padding: "24px 16px",
          backgroundColor: "transparent",
          background: `linear-gradient(135deg, ${C.orange} 0%, ${C.bg} 100%)`,
          border: "1px solid rgba(255, 255, 255, 0.28)",
          boxShadow: `
            0 6px 0 ${C.dim},
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2)
          `,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 64,
                color: C.white,
                lineHeight: 1,
                marginBottom: 2,
              }}
            >
              {streak}
            </div>
            <div style={{ fontWeight: 900, fontSize: 18, color: C.white }}>
              day Streak!
            </div>
          </div>
          <span style={{ fontSize: 72, lineHeight: 1 }}>🔥</span>
        </div>
      </Card>

      <Card style={{ marginBottom: 12, padding: "24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontSize: 40, lineHeight: 1, flexShrink: 0 }}>🔥</span>
          <p
            style={{
              margin: 0,
              color: C.white,
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.45,
            }}
          >
            Keep your{" "}
            <span style={{ color: C.orange }}>Perfect Streak flame</span> by doing a
            lesson every day!
          </p>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <StatMiniCard value={totalPracticed} label="Total Practiced" />
        <StatMiniCard value={dayPracticed} label="Day Practiced" />
      </div>

      <Calendar
        completedDays={completedDays}
        onMonthChange={(y, m) => {
          setViewYear(y);
          setViewMonth(m);
        }}
      />
    </div>
  );
}
