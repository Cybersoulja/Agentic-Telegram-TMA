import React, { useState } from "react";

interface UserProfile {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface DashboardTabProps {
  user: UserProfile | null;
  initDataRaw: string;
  backendUrl: string;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ user, initDataRaw, backendUrl }) => {
  const [validationResult, setValidationResult] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [hapticStyle, setHapticStyle] = useState<"light" | "medium" | "heavy">("medium");

  const verifyDataWithBackend = async () => {
    if (!initDataRaw) {
      setValidationResult({
        status: "error",
        message: "No Telegram initData found to validate.",
      });
      return;
    }

    setValidationResult({ status: "loading", message: "Verifying signature against Worker backend..." });

    try {
      const response = await fetch(`${backendUrl}/api/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: initDataRaw, platform: window.Telegram?.WebApp?.platform || "browser" }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setValidationResult({
          status: "success",
          message: `Verified successfully via HMAC-SHA256! Welcome, ${data.user?.first_name || "User"}.`,
        });
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
      } else {
        setValidationResult({
          status: "error",
          message: data.error || "Validation failed.",
        });
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
      }
    } catch (err: any) {
      setValidationResult({
        status: "error",
        message: `Failed to connect to backend: ${err.message}`,
      });
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("warning");
    }
  };

  const triggerHaptic = () => {
    const webApp = window.Telegram?.WebApp;
    if (webApp && webApp.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred(hapticStyle);
    } else {
      alert(`[Mock Haptic] ${hapticStyle} vibration triggered!`);
    }
  };

  return (
    <div className="tab-pane">
      {user && (
        <section className="card user-card">
          <div className="card-header">
            <div className="avatar">
              {user.first_name.charAt(0)}
              {user.last_name ? user.last_name.charAt(0) : ""}
            </div>
            <div className="user-details">
              <h3>
                {user.first_name} {user.last_name || ""}
              </h3>
              {user.username && <p className="username">@{user.username}</p>}
            </div>
            {user.is_premium && <span className="premium-badge">★ Premium</span>}
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="label">User ID:</span>
              <span className="value">{user.id}</span>
            </div>
            <div className="info-row">
              <span className="label">Language:</span>
              <span className="value">{user.language_code || "N/A"}</span>
            </div>
            <div className="info-row">
              <span className="label">Platform:</span>
              <span className="value">
                {window.Telegram?.WebApp?.platform || "Web Browser"}
              </span>
            </div>
          </div>
        </section>
      )}

      <section className="card validation-card">
        <h2>Security Validation</h2>
        <p className="description">
          Verify launch parameters (`initData`) against your Cloudflare Workers bot backend (`/api/validate`) using native Web Crypto HMAC-SHA256 signature checking.
        </p>

        <button className="btn btn-primary" onClick={verifyDataWithBackend}>
          Validate Launch Data
        </button>

        {validationResult.status !== "idle" && (
          <div className={`status-box ${validationResult.status}`}>
            {validationResult.status === "loading" && <span className="spinner">⏳</span>}
            {validationResult.status === "success" && <span className="icon">✅</span>}
            {validationResult.status === "error" && <span className="icon">❌</span>}
            <p className="status-text">{validationResult.message}</p>
          </div>
        )}
      </section>

      <section className="card haptics-card">
        <h2>Haptic Feedback</h2>
        <p className="description">
          Trigger mobile device vibration patterns using Telegram's native `HapticFeedback` API.
        </p>
        <div className="haptics-controls">
          <select
            value={hapticStyle}
            onChange={(e) => setHapticStyle(e.target.value as any)}
            className="select-input"
          >
            <option value="light">Light Impact</option>
            <option value="medium">Medium Impact</option>
            <option value="heavy">Heavy Impact</option>
          </select>
          <button className="btn btn-secondary" onClick={triggerHaptic}>
            Vibrate
          </button>
        </div>
      </section>
    </div>
  );
};
