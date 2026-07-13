import React from "react";

export type TabId = "dashboard" | "storage" | "integrations" | "settings";

interface TabBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "storage", label: "Cloud & Bio", icon: "🔐" },
    { id: "integrations", label: "Oneseco Hub", icon: "🤖" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <nav className="tab-bar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`tab-btn ${isActive ? "active" : ""}`}
            onClick={() => {
              window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
              onSelectTab(tab.id);
            }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
