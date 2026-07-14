import { verifyTelegramInitData } from "./telegramAuth.js";

export interface IntegrationsEnv {
  N8N_URL?: string;
  QWEN_TTS_URL?: string;
  NOVELAI_AGENT_PATH?: string;
  CRAFT_API_URL?: string;
  TELEGRAM_BOT_TOKEN?: string;
}

export async function handleIntegrationsRoute(
  request: Request,
  env: IntegrationsEnv,
  url: URL,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const path = url.pathname.replace("/api/integrations/", "");

  if (path === "status" && request.method === "GET") {
    // Check status of local / tunnel integrations
    const n8nUrl = env.N8N_URL || "http://localhost:5678";
    const qwenUrl = env.QWEN_TTS_URL || "http://localhost:8080";
    const novelaiPath = env.NOVELAI_AGENT_PATH || "<path-to-novelai-lorebook-agent>";
    const craftUrl = env.CRAFT_API_URL?.replace(/\/$/, "");

    const [n8nStatus, qwenStatus, craftStatus] = await Promise.all([
      checkHealth(n8nUrl + "/healthz", "n8n Workflow Hub"),
      checkHealth(qwenUrl + "/docs", "Qwen3-TTS Studio"),
      craftUrl
        ? checkHealth(craftUrl + "/connection", "Craft")
        : Promise.resolve({ online: false, message: "CRAFT_API_URL is not configured" }),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        services: {
          novelai_lorebook: {
            name: "NovelAI Lorebook Agent",
            status: "ready",
            type: "local_sandbox",
            path: novelaiPath,
            description: "Heuristic scoring & key chain generation pipeline"
          },
          n8n_hub: {
            name: "n8n Workflow Hub",
            status: n8nStatus.online ? "online" : "offline",
            url: n8nUrl,
            message: n8nStatus.message,
            description: "Self-hosted workflow automation & webhook dispatcher"
          },
          qwen_tts: {
            name: "Qwen3-TTS Voice Studio",
            status: qwenStatus.online ? "online" : "offline",
            url: qwenUrl,
            message: qwenStatus.message,
            description: "Apple Silicon local voice cloning & TTS API"
          },
          craft: {
            name: "Craft Quick Capture",
            // CRAFT_API_URL is a bearer credential embedded in the URL itself — never echo it back.
            status: craftStatus.online ? "online" : "offline",
            configured: Boolean(craftUrl),
            message: craftStatus.message,
            description: "Capture quick notes and tasks straight into your Craft space"
          }
        }
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  if (path === "trigger" && request.method === "POST") {
    try {
      const body: any = await request.json();
      const { service, action, payload } = body;

      if (service === "novelai") {
        // Mock / Proxy trigger for NovelAI Lorebook Agent operation
        return new Response(
          JSON.stringify({
            success: true,
            service: "NovelAI Lorebook Agent",
            action: action || "build_chain",
            result: {
              status: "executed",
              chain_length: 5,
              activated_keys: ["[Trill Astro Buzz]", "[Space Age Hustle]", "[Relay713]"],
              cycle_detected: false,
              timestamp: new Date().toISOString()
            }
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      if (service === "n8n") {
        const n8nUrl = env.N8N_URL || "http://localhost:5678";
        const webhookPath = action || "test-webhook";
        const targetUrl = `${n8nUrl}/webhook/${webhookPath}`;

        try {
          const resp = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload || { source: "telegram-mini-app", time: Date.now() })
          });
          const text = await resp.text();
          return new Response(
            JSON.stringify({
              success: resp.ok,
              service: "n8n Hub",
              status_code: resp.status,
              response: text
            }),
            { status: resp.ok ? 200 : 502, headers: corsHeaders }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              success: false,
              service: "n8n Hub",
              error: `Could not reach n8n server at ${n8nUrl}: ${err.message}`
            }),
            { status: 502, headers: corsHeaders }
          );
        }
      }

      if (service === "qwen_tts") {
        const qwenUrl = env.QWEN_TTS_URL || "http://localhost:8080";
        // Proxy check or mock synth response
        return new Response(
          JSON.stringify({
            success: true,
            service: "Qwen3-TTS Studio",
            action: action || "synthesize_preview",
            voice: payload?.voice || "default_trill",
            text: payload?.text || "Welcome to the Space Age Hustle Mini App.",
            audio_url: `${qwenUrl}/static/preview.wav`,
            status: "ready"
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      if (service === "craft") {
        const craftUrl = env.CRAFT_API_URL?.replace(/\/$/, "");
        if (!craftUrl) {
          return new Response(
            JSON.stringify({ success: false, service: "Craft", error: "CRAFT_API_URL is not configured." }),
            { status: 502, headers: corsHeaders }
          );
        }

        // CRAFT_API_URL is a bearer credential to a real personal space — require a valid
        // Telegram initData on every write so only genuine app launches can trigger one.
        if (!env.TELEGRAM_BOT_TOKEN) {
          return new Response(
            JSON.stringify({ success: false, service: "Craft", error: "Server is not configured for Telegram auth." }),
            { status: 500, headers: corsHeaders }
          );
        }
        const initDataAuth = await verifyTelegramInitData(body.initData || "", env.TELEGRAM_BOT_TOKEN);
        if (!initDataAuth.isValid) {
          return new Response(
            JSON.stringify({ success: false, service: "Craft", error: initDataAuth.error || "Unauthorized" }),
            { status: 403, headers: corsHeaders }
          );
        }

        const text = payload?.text;
        if (!text) {
          return new Response(
            JSON.stringify({ success: false, service: "Craft", error: "payload.text is required." }),
            { status: 400, headers: corsHeaders }
          );
        }

        const isTask = action === "add_task";
        const targetUrl = `${craftUrl}${isTask ? "/tasks" : "/blocks"}`;
        const requestBody = isTask
          ? { tasks: [{ markdown: text, location: { type: "inbox" } }] }
          : { markdown: text, position: { position: "end", date: "today" } };

        try {
          const resp = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
          });
          const responseText = await resp.text();
          let data: any;
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { rawResponse: responseText };
          }
          return new Response(
            JSON.stringify({
              success: resp.ok,
              service: "Craft",
              action: isTask ? "add_task" : "quick_note",
              result: data
            }),
            { status: resp.ok ? 200 : 502, headers: corsHeaders }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ success: false, service: "Craft", error: `Could not reach Craft API: ${err.message}` }),
            { status: 502, headers: corsHeaders }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: false, error: `Unknown integration service: ${service}` }),
        { status: 400, headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ success: false, error: `Trigger error: ${err.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }
  }

  return new Response(
    JSON.stringify({ success: false, error: "Integration route not found" }),
    { status: 404, headers: corsHeaders }
  );
}

async function checkHealth(url: string, serviceName: string): Promise<{ online: boolean; message: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(timeout);
    return {
      online: res.status >= 200 && res.status < 500,
      message: `Status ${res.status} (${res.statusText})`
    };
  } catch (err: any) {
    return {
      online: false,
      message: err.name === "AbortError" ? "Connection timed out (2s)" : "Server offline or unreachable"
    };
  }
}
