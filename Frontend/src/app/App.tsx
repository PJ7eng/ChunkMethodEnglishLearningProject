import { useState } from "react";
import { TabBar } from "./components/ui";
import { HomeScreen, LibraryScreen, SettingsScreen, LoginScreen, RegisterScreen} from "./pages";
import { C } from "./constants/designToken";

type TabId = "home" | "library" | "settings";
type AuthMode = "login" | "register";

export default function App() {

  const [tab, setTab] = useState<TabId>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  // 认证状态管理
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("chunk_auth_token")
  );
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem("chunk_auth_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleAuthSuccess = (newToken: string, authUser: any) => {
    localStorage.setItem("chunk_auth_token", newToken);
    localStorage.setItem("chunk_auth_user", JSON.stringify(authUser));
    setToken(newToken);
    setUser(authUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("chunk_auth_token");
    localStorage.removeItem("chunk_auth_user");
    setToken(null);
    setUser(null);
  };

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
        {/* App header */}
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
          <div
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
            }}
          >
            JL
          </div>
        </div>

        {/* Screen */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {tab === "home" && <HomeScreen />}
          {tab === "library" && <LibraryScreen />}
          {tab === "settings" && <SettingsScreen />}
        </div>

        {/* Tab bar */}
        <TabBar active={tab} onChange={setTab} />
      </div>
    </>
  );
}