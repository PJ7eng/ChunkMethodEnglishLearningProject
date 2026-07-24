import { useState } from "react";
import { Card } from "../Card";
import { C } from "../../../constants/designToken";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_SIZE = 32;

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateKey(year, month, day) {
  return `${year}-${month}-${day}`;
}

function buildMockCompletedDays(year, month) {
  const completed = new Set();
  const today = new Date();
  const daysInMonth = getDaysInMonth(year, month);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (date > today) break;
    if (day % 3 !== 0 || day % 7 === 0) continue;
    completed.add(dateKey(year, month, day));
  }

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d.getMonth() === month && d.getFullYear() === year) {
      completed.add(dateKey(d.getFullYear(), d.getMonth(), d.getDate()));
    }
  }

  return completed;
}

const navBtnStyle = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "none",
  backgroundColor: C.surface3,
  color: C.white,
  fontSize: 16,
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "'Nunito', sans-serif",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const todayBtnStyle = {
  padding: "5px 10px",
  borderRadius: 8,
  border: "none",
  backgroundColor: C.surface3,
  color: C.blue,
  fontSize: 11,
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "'Nunito', sans-serif",
};

/**
 * @param {{ completedDays?: Set<string>, style?: React.CSSProperties }} props
 */
export function Calendar({ completedDays: completedDaysProp, style } = {}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const completedDays =
    completedDaysProp ?? buildMockCompletedDays(viewYear, viewMonth);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Card style={{ padding: "16px 14px 18px", ...style }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={prevMonth}
            style={navBtnStyle}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={nextMonth}
            style={navBtnStyle}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <span style={{ fontWeight: 900, fontSize: 15, color: C.white }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={goToday} style={todayBtnStyle}>
          Today
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          marginBottom: 8,
        }}
      >
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 10,
              fontWeight: 800,
              color: C.gray,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          columnGap: 0,
          rowGap: 10,
        }}
      >
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }

          const key = dateKey(viewYear, viewMonth, day);
          const done = completedDays.has(key);
          const isToday = isSameDay(new Date(viewYear, viewMonth, day), today);
          const col = idx % 7;
          const prevDay = day - 1;
          const nextDay = day + 1;
          const prevDone =
            prevDay >= 1 && completedDays.has(dateKey(viewYear, viewMonth, prevDay));
          const nextDone =
            nextDay <= daysInMonth &&
            completedDays.has(dateKey(viewYear, viewMonth, nextDay));

          // Only link within the same calendar row (Sun–Sat).
          // Saturday ↔ Sunday wraps to a new row, so no connector.
          const linkPrev = done && prevDone && col !== 0;
          const linkNext = done && nextDone && col !== 6;

          return (
            <div
              key={key}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: DAY_SIZE + 4,
                overflow: "visible",
              }}
            >
              {linkPrev && (
                <div
                  style={{
                    position: "absolute",
                    // Overlap 2px into the previous cell to hide subpixel gaps
                    left: -2,
                    right: "50%",
                    top: "50%",
                    height: DAY_SIZE,
                    backgroundColor: C.green,
                    transform: "translateY(-50%)",
                    zIndex: 0,
                  }}
                />
              )}
              {linkNext && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    // Overlap 2px into the next cell to hide subpixel gaps
                    right: -2,
                    top: "50%",
                    height: DAY_SIZE,
                    backgroundColor: C.green,
                    transform: "translateY(-50%)",
                    zIndex: 0,
                  }}
                />
              )}
              <div
                style={{
                  width: DAY_SIZE,
                  height: DAY_SIZE,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: done ? C.white : isToday ? C.orange : C.gray,
                  backgroundColor: done ? C.green : "transparent",
                  border: isToday && !done ? `2px solid ${C.orange}` : "none",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {day}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
