import { useState, useEffect } from "react";
import "./App.css";
import { TabBar } from "./components/TabBar";
import type { TabId } from "./components/TabBar";
import { DashboardTab } from "./components/DashboardTab";
import { StorageBiometricsTab } from "./components/StorageBiometricsTab";
import { IntegrationsTab } from "./components/IntegrationsTab";
import { SettingsTab } from "./components/SettingsTab";

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

interface UserProfile {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  theme_preference?: string;
  haptic_style?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [backendUrl, setBackendUrl] = useState<string>(DEFAULT_API_URL);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [initDataRaw, setInitDataRaw] = useState<string>("");

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp && webApp.ready) {
      webApp.ready();
      webApp.expand();

      if (webApp.initDataUnsafe?.user) {
        setUser(webApp.initDataUnsafe.user);
        fetchD1Profile(webApp.initDataUnsafe.user.id);
      } else {
        setMockUser();
      }

      if (webApp.initData) {
        setInitDataRaw(webApp.initData);
      }

      if (webApp.MainButton && webApp.MainButton.setParams) {
        webApp.MainButton.setParams({
          text: "CLOSE CONTROL HUB",
          color: webApp.themeParams?.button_color || "#2481cc",
          text_color: webApp.themeParams?.button_text_color || "#ffffff",
          is_visible: true,
        });

        const handleMainButtonClick = () => {
          webApp.HapticFeedback?.notificationOccurred("success");
          webApp.close();
        };

        webApp.MainButton.onClick(handleMainButtonClick);
        return () => {
          webApp.MainButton.offClick(handleMainButtonClick);
        };
      }
    } else {
      setMockUser();
    }
  }, [backendUrl]);

  const setMockUser = () => {
    const mock: UserProfile = {
      id: 123456789,
      first_name: "Trill",
      last_name: "Astro Buzz",
      username: "space_age_hustle",
      language_code: "en",
      is_premium: true,
      theme_preference: "dark-sci-fi",
    };
    setUser(mock);
    setInitDataRaw("mock_query_id=123&user=mock&auth_date=123&hash=mock");
  };

  const fetchD1Profile = async (userId: number) => {
    try {
      const res = await fetch(`${backendUrl}/api/profile?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.profile) {
          setUser((prev) => ({ ...prev, ...data.profile }));
        }
      }
    } catch (err) {
      console.warn("Could not load D1 profile:", err);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-badge">TMA</div>
        <div className="header-text">
          <h1>Oneseco Media Hub</h1>
          <p className="app-subtitle">React + Cloudflare Workers D1/KV + SDK</p>
        </div>
      </header>

      <main className="app-main">
        {activeTab === "dashboard" && (
          <DashboardTab
            user={user}
            initDataRaw={initDataRaw}
            backendUrl={backendUrl}
          />
        )}
        {activeTab === "storage" && <StorageBiometricsTab />}
        {activeTab === "integrations" && <IntegrationsTab backendUrl={backendUrl} initDataRaw={initDataRaw} />}
        {activeTab === "settings" && (
          <SettingsTab
            backendUrl={backendUrl}
            onUpdateBackendUrl={setBackendUrl}
            userProfile={user}
            onRefreshProfile={() => user && fetchD1Profile(user.id)}
          />
        )}
      </main>

      <TabBar activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}

export default App;
