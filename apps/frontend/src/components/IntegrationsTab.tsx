import React, { useState, useEffect } from "react";

interface IntegrationsTabProps {
  backendUrl: string;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ backendUrl }) => {
  const [services, setServices] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [triggerStatus, setTriggerStatus] = useState<Record<string, string>>({});
  const [mirrorLeechLink, setMirrorLeechLink] = useState<string>("");

  useEffect(() => {
    fetchServicesStatus();
  }, [backendUrl]);

  const fetchServicesStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/integrations/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setServices(data.services || {});
      }
    } catch (err) {
      console.warn("Could not check integration statuses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async (serviceKey: string, action: string, payload?: any) => {
    setTriggerStatus((prev) => ({ ...prev, [serviceKey]: "Running..." }));
    try {
      const res = await fetch(`${backendUrl}/api/integrations/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: serviceKey, action, payload }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTriggerStatus((prev) => ({ ...prev, [serviceKey]: `Success: ${JSON.stringify(data.result || data.response || "OK")}` }));
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
      } else {
        setTriggerStatus((prev) => ({ ...prev, [serviceKey]: `Failed: ${data.error || "Unknown error"}` }));
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
      }
    } catch (err: any) {
      setTriggerStatus((prev) => ({ ...prev, [serviceKey]: `Error: ${err.message}` }));
    }
  };

  return (
    <div className="tab-pane">
      <div className="tab-header-bar">
        <h2>Oneseco Media Hub</h2>
        <button className="btn-icon" onClick={fetchServicesStatus} title="Refresh Status">
          🔄
        </button>
      </div>
      <p className="description">Monitor and trigger local/cloud Oneseco pipelines directly from your Telegram Mini App.</p>

      {loading ? (
        <div className="status-box loading">
          <span className="spinner">⏳</span>
          <p className="status-text">Checking service connectivity...</p>
        </div>
      ) : (
        <div className="integrations-list">
          {/* NovelAI Lorebook Agent */}
          <section className="card integration-item">
            <div className="int-header">
              <span className="int-badge ready">READY</span>
              <h3>📚 NovelAI Lorebook Agent</h3>
            </div>
            <p className="description">{services.novelai_lorebook?.description || "Heuristic scoring & key chain generation pipeline"}</p>
            <div className="int-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleTrigger("novelai", "build_chain")}>
                ⚡ Build Key Chain
              </button>
            </div>
            {triggerStatus["novelai"] && <pre className="int-log">{triggerStatus["novelai"]}</pre>}
          </section>

          {/* n8n Workflow Hub */}
          <section className="card integration-item">
            <div className="int-header">
              <span className={`int-badge ${services.n8n_hub?.status === "online" ? "online" : "offline"}`}>
                {services.n8n_hub?.status?.toUpperCase() || "OFFLINE"}
              </span>
              <h3>⚡ n8n Workflow Hub</h3>
            </div>
            <p className="description">{services.n8n_hub?.description || "Self-hosted workflow automation & webhook dispatcher"}</p>
            <div className="int-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => handleTrigger("n8n", "test-webhook", { source: "telegram-app" })}>
                Dispatch Webhook
              </button>
            </div>
            {triggerStatus["n8n"] && <pre className="int-log">{triggerStatus["n8n"]}</pre>}
          </section>

          {/* Qwen3-TTS Studio */}
          <section className="card integration-item">
            <div className="int-header">
              <span className={`int-badge ${services.qwen_tts?.status === "online" ? "online" : "offline"}`}>
                {services.qwen_tts?.status?.toUpperCase() || "OFFLINE"}
              </span>
              <h3>🎙️ Qwen3-TTS Studio</h3>
            </div>
            <p className="description">{services.qwen_tts?.description || "Apple Silicon local voice cloning & TTS API"}</p>
            <div className="int-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleTrigger("qwen_tts", "synthesize_preview", { voice: "trill", text: "Oneseco activated." })}>
                Synthesize Voice Clip
              </button>
            </div>
            {triggerStatus["qwen_tts"] && <pre className="int-log">{triggerStatus["qwen_tts"]}</pre>}
          </section>

          {/* Mirror-Leech Bot */}
          <section className="card integration-item">
            <div className="int-header">
              <span className={`int-badge ${services.mirror_leech?.status === "online" ? "online" : "offline"}`}>
                {services.mirror_leech?.status?.toUpperCase() || "OFFLINE"}
              </span>
              <h3>📥 Mirror-Leech Bot</h3>
            </div>
            <p className="description">{services.mirror_leech?.description || "Remote-download & torrent/leech relay (aria2c/qBittorrent/yt-dlp)"}</p>
            <div className="url-form mt-2">
              <input
                className="select-input"
                type="text"
                placeholder="Paste a magnet/URL to mirror or leech"
                value={mirrorLeechLink}
                onChange={(e) => setMirrorLeechLink(e.target.value)}
              />
            </div>
            <div className="int-actions mt-2">
              <button
                className="btn btn-primary btn-sm"
                disabled={!mirrorLeechLink}
                onClick={() => handleTrigger("mirror_leech", "mirror", { url: mirrorLeechLink })}
              >
                ☁️ Mirror to Drive
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={!mirrorLeechLink}
                onClick={() => handleTrigger("mirror_leech", "leech", { url: mirrorLeechLink })}
              >
                📤 Leech to Telegram
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleTrigger("mirror_leech", "status")}
              >
                📋 Check Queue
              </button>
            </div>
            {triggerStatus["mirror_leech"] && <pre className="int-log">{triggerStatus["mirror_leech"]}</pre>}
          </section>
        </div>
      )}
    </div>
  );
};
