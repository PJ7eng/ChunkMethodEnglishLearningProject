import { useEffect, useState } from "react";
import {
  WeeklyHabitCard,
  DailyGoalCard,
  CategoryPieChart,
} from "../../components";
import type { CategorySlice } from "../../components";
import {
  getStreakStats,
  getCategoryStats,
  getNoteCategoryStats,
  updatePreferences,
} from "../../api";
import { usePress } from "../../hooks/usePress";
import { C } from "../../constants/designToken";

const AVATAR_SIZE = 96;

export interface ProfileScreenProps {
  userName?: string;
  avatarInitials?: string;
  dailyGoal: number;
  onDailyGoalChange: (goal: number) => void;
  onOpenSettings: () => void;
}

function SettingsIconButton({ onClick }: { onClick: () => void }) {
  const { pressed, handlers } = usePress();
  const lift = pressed ? 3 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      {...handlers}
      aria-label="Open settings"
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        border: "none",
        backgroundColor: "rgba(0,0,0,0.22)",
        color: C.white,
        fontSize: 20,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 ${4 - lift}px 0 rgba(0,0,0,0.25)`,
        transform: `translateY(${lift}px)`,
        transition: "transform 0.08s ease, box-shadow 0.08s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      ⚙️
    </button>
  );
}

export function ProfileScreen({
  userName = "Learner",
  avatarInitials = "JL",
  dailyGoal,
  onDailyGoalChange,
  onOpenSettings,
}: ProfileScreenProps) {
  const [weekData, setWeekData] = useState<
    { day: string; done: boolean; count: number }[] | undefined
  >();
  const [learned, setLearned] = useState<CategorySlice[] | undefined>();
  const [mastered, setMastered] = useState<CategorySlice[] | undefined>();
  const [notes, setNotes] = useState<CategorySlice[] | undefined>();
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    getStreakStats()
      .then((s) => setWeekData(s.weekData))
      .catch(() => setStatsError("無法載入本週習慣"));
    getCategoryStats()
      .then((s) => {
        setLearned(s.learned);
        setMastered(s.mastered);
      })
      .catch(() => setStatsError("無法載入學習統計"));
    getNoteCategoryStats()
      .then(setNotes)
      .catch(() => setStatsError("無法載入筆記統計"));
  }, []);

  async function handleGoalChange(goal: number) {
    onDailyGoalChange(goal);
    try {
      await updatePreferences({ dailyGoal: goal });
    } catch {
      /* local state already updated */
    }
  }

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        backgroundColor: C.bg,
      }}
    >
      <div
        style={{
          position: "relative",
          height: "33%",
          minHeight: 168,
          backgroundColor: C.green,
          backgroundImage: `linear-gradient(160deg, ${C.green} 0%, #89E219 55%, ${C.greenDark} 100%)`,
          flexShrink: 0,
          paddingTop: 36,
        }}
      >
        <div style={{ position: "absolute", top: 40, right: 16, zIndex: 2 }}>
          <SettingsIconButton onClick={onOpenSettings} />
        </div>
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            top: -30,
            left: -20,
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          marginTop: -(AVATAR_SIZE / 2),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 3,
          padding: "0 20px 28px",
        }}
      >
        <div
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.purple} 0%, ${C.blue} 100%)`,
            border: `4px solid ${C.bg}`,
            boxShadow: `0 6px 0 ${C.dim}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 32,
            color: C.white,
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          {avatarInitials}
        </div>

        <h2
          style={{
            margin: "14px 0 18px",
            color: C.white,
            fontWeight: 900,
            fontSize: 24,
            textAlign: "center",
          }}
        >
          {userName}
        </h2>

        <div style={{ width: "100%", maxWidth: 480 }}>
          {statsError && <p role="alert" style={{ color: C.red }}>{statsError}</p>}
          <WeeklyHabitCard days={weekData} />
          <DailyGoalCard goal={dailyGoal} onChange={handleGoalChange} />
          <CategoryPieChart
            learned={learned}
            mastered={mastered}
            notes={notes}
          />
        </div>
      </div>
    </div>
  );
}
