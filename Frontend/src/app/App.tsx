import { useState, useEffect, useRef } from "react";
import { TabBar } from "./components/ui";
import {
  HomeScreen,
  LibraryScreen,
  SettingsScreen,
  LoginScreen,
  RegisterScreen,
  StreakScreen,
  MasteredScreen,
  ChallengeScreen,
  NoteScreen,
  ProfileScreen,
  ReviewScreen,
  AdminScreen,
  AccountActionScreen,
} from "./pages";
import {
  getCurrentUser,
  getPreferences,
  type PreferencesResponse,
  logoutUser,
} from "./api";
import { C } from "./constants/designToken";

type TabId = "home" | "notes" | "profile";
type AuthMode = "login" | "register";
type OverlayId =
  | "streak"
  | "mastered"
  | "challenge"
  | "library"
  | "settings"
  | "review"
  | null;

const DEFAULT_DAILY_GOAL = 10;

export default function App() {
  const [isAdminPath, setIsAdminPath] = useState(
    () => window.location.pathname.startsWith("/admin"),
  );
  const [tab, setTab] = useState<TabId>("home");
  const [overlay, setOverlay] = useState<OverlayId>(null);
  const [homeKey, setHomeKey] = useState(0);
  const prevTabRef = useRef<TabId>(tab);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_DAILY_GOAL);
  const [prefs, setPrefs] = useState<PreferencesResponse | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("chunk_auth_token"),
  );
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem("chunk_auth_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (tab === "home" && prevTabRef.current !== "home") {
      setHomeKey((k) => k + 1);
    }
    prevTabRef.current = tab;
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!token) {
        setBootstrapping(false);
        return;
      }
      try {
        const me = await getCurrentUser();
        if (cancelled) return;
        if (me.user) {
          setUser(me.user);
          localStorage.setItem("chunk_auth_user", JSON.stringify(me.user));
        }
        const preferences = await getPreferences();
        if (cancelled) return;
        setPrefs(preferences);
        setDailyGoal(preferences.dailyGoal);
      } catch {
        if (!cancelled) {
          localStorage.removeItem("chunk_auth_token");
          localStorage.removeItem("chunk_auth_user");
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAuthSuccess = (newToken: string, authUser: any) => {
    localStorage.setItem("chunk_auth_token", newToken);
    localStorage.setItem("chunk_auth_user", JSON.stringify(authUser));
    setToken(newToken);
    setUser(authUser);
  };

  const handleLogout = () => {
    void logoutUser().catch(() => undefined);
    localStorage.removeItem("chunk_auth_token");
    localStorage.removeItem("chunk_auth_user");
    setToken(null);
    setUser(null);
    setOverlay(null);
    setTab("home");
    setAuthMode("login");
    setPrefs(null);
  };

  if (
    window.location.pathname.startsWith("/verify-email") ||
    window.location.pathname.startsWith("/reset-password")
  ) {
    return (
      <AccountActionScreen
        onDone={() => {
          window.history.replaceState({}, "", "/");
          window.location.reload();
        }}
      />
    );
  }

  if (!token) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          body { margin: 0; background: #121212; }
          input::placeholder { color: #A1A1AA; }
        `}</style>
        {authMode === "login" ? (
          <LoginScreen
            onAuthSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setAuthMode("register")}
          />
        ) : (
          <RegisterScreen
            onAuthSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setAuthMode("login")}
          />
        )}
      </>
    );
  }

  if (bootstrapping) {
    return (
      <div
        style={{
          minHeight: "100svh",
          backgroundColor: C.bg,
          color: C.gray,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 800,
        }}
      >
        Loading...
      </div>
    );
  }

  const canAdmin =
    user?.role === "content_reviewer" ||
    user?.role === "content_admin" ||
    user?.role === "super_admin";
  if (isAdminPath && canAdmin) {
    return (
      <AdminScreen
        onExit={() => {
          window.history.pushState({}, "", "/");
          setIsAdminPath(false);
        }}
      />
    );
  }

  const showShell = !overlay;
  const showAppHeader = showShell && tab !== "profile";

  const displayName =
    user?.name || (user?.email ? String(user.email).split("@")[0] : "Learner");
  const initials =
    String(displayName)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p: string) => p[0]?.toUpperCase() || "")
      .join("") || "JL";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
        body { margin: 0; background: #0A0A0A; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        input::placeholder { color: #A1A1AA; }
      `}</style>

      <div
        style={{
          minHeight: "100svh",
          height: "100svh",
          width: "100vw",
          backgroundColor: C.bg,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Nunito', sans-serif",
          overflow: "hidden",
        }}
      >
        {showAppHeader && (
          <div
            style={{
              padding: "36px 20px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${C.green}, #89E219)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  boxShadow: `0 3px 0 ${C.greenDark}`,
                }}
              >
                🎴
              </div>
              <div>
                <span style={{ fontWeight: 900, fontSize: 20, color: C.green }}>
                  Chunk
                </span>
                <span style={{ fontWeight: 900, fontSize: 20, color: C.white }}>
                  Master
                </span>
              </div>
            </div>
            <button
              type="button"
              aria-label={canAdmin ? "Open admin dashboard" : "User profile"}
              onClick={() => {
                if (!canAdmin) return;
                window.history.pushState({}, "", "/admin");
                setIsAdminPath(true);
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.purple} 0%, ${C.blue} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                boxShadow: `0 3px 0 ${C.dim}`,
                fontWeight: 700,
                color: C.white,
                border: "none",
                cursor: canAdmin ? "pointer" : "default",
              }}
            >
              {initials}
            </button>
          </div>
        )}

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {overlay === "streak" && (
            <StreakScreen onBack={() => setOverlay(null)} />
          )}
          {overlay === "mastered" && (
            <MasteredScreen onBack={() => setOverlay(null)} />
          )}
          {overlay === "challenge" && (
            <ChallengeScreen onBack={() => setOverlay(null)} />
          )}
          {overlay === "library" && (
            <LibraryScreen onBack={() => setOverlay(null)} />
          )}
          {overlay === "review" && (
            <ReviewScreen onBack={() => setOverlay(null)} />
          )}
          {overlay === "settings" && (
            <SettingsScreen
              onBack={() => setOverlay(null)}
              onLogout={handleLogout}
              onPreferencesChange={(p) => {
                setPrefs(p);
                setDailyGoal(p.dailyGoal);
              }}
            />
          )}
          {!overlay && tab === "home" && (
            <HomeScreen
              key={homeKey}
              dailyGoal={dailyGoal}
              soundEnabled={prefs?.soundEnabled ?? true}
              onNavigateToLibrary={() => setOverlay("library")}
              onNavigateToStreak={() => setOverlay("streak")}
              onNavigateToMastered={() => setOverlay("mastered")}
              onNavigateToChallenge={() => setOverlay("challenge")}
              onNavigateToReview={() => setOverlay("review")}
            />
          )}
          {!overlay && tab === "notes" && <NoteScreen />}
          {!overlay && tab === "profile" && (
            <ProfileScreen
              userName={displayName}
              avatarInitials={initials}
              dailyGoal={dailyGoal}
              onDailyGoalChange={setDailyGoal}
              onOpenSettings={() => setOverlay("settings")}
            />
          )}
        </div>

        {showShell && <TabBar active={tab} onChange={setTab} />}
      </div>
    </>
  );
}
