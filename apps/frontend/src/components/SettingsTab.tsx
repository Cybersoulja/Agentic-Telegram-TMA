import React, { useState } from "react";

interface SettingsTabProps {
  backendUrl: string;
  onUpdateBackendUrl: (url: string) => void;
  userProfile: any;
  onRefreshProfile: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  backendUrl,
  onUpdateBackendUrl,
  userProfile,
  onRefreshProfile,
}) => {
  const [customUrl, setCustomUrl] = useState<string>(backendUrl);
  const [dbInitStatus, setDbInitStatus] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [themePref, setThemePref] = useState<string>(userProfile?.theme_preference || "system");

  const handleInitDb = async () => {
    setDbInitStatus("Initializing D1 tables (`users`, `activity_logs`)...");
    try {
      const res = await fetch(`${backendUrl}/api/db/init`);
      const data = await res.json();
      setDbInitStatus(data.message || (res.ok ? "Database initialized!" : "Failed"));
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(res.ok ? "success" : "error");
    } catch (err: any) {
      setDbInitStatus(`Error: ${err.message}`);
    }
  };

  const handleSavePreferences = async () => {
    if (!userProfile?.id) {
      setSaveStatus("No authenticated Telegram user profile found.");
      return;
    }
    setSaveStatus("Saving to Cloudflare D1 + KV...");
    try {
      const res = await fetch(`${backendUrl}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...userProfile, theme_preference: themePref }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus(data.message || "Saved successfully.");
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
        onRefreshProfile();
      } else {
        setSaveStatus(`Save error: ${data.message || data.error || "Unknown"}`);
      }
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    }
  };

  const handleApplyUrl = () => {
    onUpdateBackendUrl(customUrl.trim());
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("medium");
  };

  return (
    <div className="tab-pane">
      <section className="card settings-card">
        <h2>Database & Cloudflare Sync</h2>
        <p className="description">Persist user settings and preferences across `TMA_DB` (D1 SQL) and `TMA_KV` caching.</p>
        <div className="db-controls">
          <button className="btn btn-secondary" onClick={handleInitDb}>
            ⚙️ Initialize D1 Tables
          </button>
        </div>
        {dbInitStatus && <p className="status-hint">{dbInitStatus}</p>}

        <div className="pref-section">
          <label className="pref-label">App Theme Preference:</label>
          <select
            value={themePref}
            onChange={(e) => setThemePref(e.target.value)}
            className="select-input"
          >
            <option value="system">System (Telegram Client Default)</option>
            <option value="dark-sci-fi">Dark Sci-Fi (Space Age Hustle)</option>
            <option value="cyber-blue">Cyber Blue Glass</option>
            <option value="emerald">Emerald Neon</option>
          </select>
          <button className="btn btn-primary mt-2" onClick={handleSavePreferences}>
            Save Preferences to D1/KV
          </button>
          {saveStatus && <p className="status-hint">{saveStatus}</p>}
        </div>
      </section>

      <section className="card settings-card">
        <h2>Backend API Override</h2>
        <p className="description">Override the Cloudflare Worker URL (e.g., pointing to your local `wrangler dev` on `localhost:8787` or a Cloudflare Tunnel).</p>
        <div className="url-form">
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="select-input"
          />
          <button className="btn btn-secondary" onClick={handleApplyUrl}>
            Apply URL
          </button>
        </div>
      </section>

      <section className="card settings-card">
        <h2>Telegram SDK Diagnostics</h2>
        <div className="card-body">
          <div className="info-row">
            <span className="label">SDK Version:</span>
            <span className="value">{window.Telegram?.WebApp?.version || "N/A"}</span>
          </div>
          <div className="info-row">
            <span className="label">Client Platform:</span>
            <span className="value">{window.Telegram?.WebApp?.platform || "External Browser"}</span>
          </div>
          <div className="info-row">
            <span className="label">Color Scheme:</span>
            <span className="value">{window.Telegram?.WebApp?.colorScheme || "dark"}</span>
          </div>
          <div className="info-row">
            <span className="label">Stable Height:</span>
            <span className="value">{window.Telegram?.WebApp?.viewportStableHeight || window.innerHeight}px</span>
          </div>
        </div>
      </section>
    </div>
  );
};
