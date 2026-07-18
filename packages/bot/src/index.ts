import { initDatabase, getUserProfile, saveUserProfile, logUserActivity, UserProfileData } from "./db.js";
import { handleIntegrationsRoute, IntegrationsEnv } from "./integrations.js";
import { runAgentChain, formatAgentMessage, AgentEnv } from "./agent.js";

export interface Env extends IntegrationsEnv, AgentEnv {
  TELEGRAM_BOT_TOKEN?: string;
  MINI_APP_URL: string;
  TMA_KV?: KVNamespace;
  TMA_DB?: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ok",
          message: "Telegram Mini App Bot Backend is running with D1/KV + Integrations Hub.",
          endpoints: {
            webhook: "/webhook (POST) - Receive updates from Telegram",
            validate: "/api/validate (POST) - Validate Telegram WebApp initData",
            setup: "/setup-webhook (GET) - Automatically register webhook with Telegram",
            dbInit: "/api/db/init (GET) - Initialize D1 database tables",
            profile: "/api/profile (GET/POST) - Get/Save user preferences in D1 and KV",
            integrations: "/api/integrations/* - Oneseco Hub proxy routes"
          },
        }),
        { headers: corsHeaders }
      );
    }

    if (url.pathname === "/setup-webhook" && request.method === "GET") {
      const token = env.TELEGRAM_BOT_TOKEN;
      if (!token) {
        return new Response(
          JSON.stringify({ error: "TELEGRAM_BOT_TOKEN is not configured." }),
          { status: 500, headers: corsHeaders }
        );
      }

      const webhookUrl = `https://${url.hostname}/webhook`;
      const tgUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

      try {
        const response = await fetch(tgUrl);
        const data: any = await response.json();
        return new Response(
          JSON.stringify({
            message: "Telegram setWebhook response",
            webhook_url: webhookUrl,
            telegram_response: data,
          }),
          { status: response.ok ? 200 : 400, headers: corsHeaders }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: "Failed to setup webhook", details: err.message }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    if (url.pathname === "/webhook" && request.method === "POST") {
      const token = env.TELEGRAM_BOT_TOKEN;
      if (!token) {
        console.error("TELEGRAM_BOT_TOKEN is not set.");
        return new Response("Config Error", { status: 500 });
      }

      try {
        const update: any = await request.json();
        ctx.waitUntil(handleTelegramUpdate(update, token, env.MINI_APP_URL, env.TMA_DB, env.GEMINI_API_KEY));
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      } catch (err: any) {
        console.error("Error processing update:", err);
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 400, headers: corsHeaders });
      }
    }

    if (url.pathname === "/api/validate" && request.method === "POST") {
      const token = env.TELEGRAM_BOT_TOKEN;
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: "TELEGRAM_BOT_TOKEN is not configured on the server." }),
          { status: 500, headers: corsHeaders }
        );
      }

      try {
        const body: any = await request.json();
        const { initData } = body;
        if (!initData) {
          return new Response(
            JSON.stringify({ success: false, error: "initData is required in request body" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const validation = await verifyTelegramInitData(initData, token);
        if (validation.isValid && validation.user) {
          // Log activity asynchronously in D1
          ctx.waitUntil(logUserActivity(env.TMA_DB, validation.user.id, "app_launch", { platform: body.platform }));
          return new Response(
            JSON.stringify({ success: true, user: validation.user }),
            { status: 200, headers: corsHeaders }
          );
        } else {
          return new Response(
            JSON.stringify({ success: false, error: validation.error || "Validation failed" }),
            { status: 403, headers: corsHeaders }
          );
        }
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: "Failed to parse request or perform validation: " + err.message }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    if (url.pathname === "/api/db/init" && request.method === "GET") {
      const result = await initDatabase(env.TMA_DB);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: corsHeaders
      });
    }

    if (url.pathname === "/api/profile" && request.method === "GET") {
      const userId = parseInt(url.searchParams.get("userId") || "0", 10);
      if (!userId) {
        return new Response(JSON.stringify({ success: false, error: "userId query param required" }), { status: 400, headers: corsHeaders });
      }
      const profile = await getUserProfile(env.TMA_DB, env.TMA_KV, userId, ctx);
      return new Response(JSON.stringify({ success: true, profile }), { status: 200, headers: corsHeaders });
    }

    if (url.pathname === "/api/profile" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const result = await saveUserProfile(env.TMA_DB, env.TMA_KV, body);
        if (result.success && body.id) {
          ctx.waitUntil(logUserActivity(env.TMA_DB, body.id, "update_profile", body));
        }
        return new Response(JSON.stringify(result), { status: result.success ? 200 : 500, headers: corsHeaders });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 400, headers: corsHeaders });
      }
    }

    if (url.pathname.startsWith("/api/integrations/")) {
      return handleIntegrationsRoute(request, env, url, corsHeaders);
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: corsHeaders,
    });
  },
};

async function handleTelegramUpdate(update: any, botToken: string, miniAppUrl: string, db?: D1Database, geminiApiKey?: string) {
  if (update.message && update.message.text) {
    const chatId = update.message.chat.id;
    const text = update.message.text;

    if (text.startsWith("/start")) {
      const welcomeText = "👋 Welcome to your Telegram Mini App & Oneseco Media Hub!\n\nClick below to open the multi-tab control center.";

      const payload = {
        chat_id: chatId,
        text: welcomeText,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Open Control Center",
                web_app: { url: miniAppUrl }
              }
            ]
          ]
        }
      };

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (update.message.from && db) {
        logUserActivity(db, update.message.from.id, "bot_start", { chat_id: chatId });
      }
      return;
    }

    if (geminiApiKey) {
      let statusMessageId: number | undefined;
      try {
        const sent = await sendTelegramMessage(chatId, "<i>📡 Establishing uplink...</i>", botToken);
        statusMessageId = sent?.result?.message_id;
      } catch (err: any) {
        console.error("Failed to send agent status message:", err);
      }

      try {
        const result = await runAgentChain(text, geminiApiKey);
        const formatted = formatAgentMessage(result);
        if (statusMessageId) {
          await editTelegramMessage(chatId, statusMessageId, formatted, botToken);
        } else {
          await sendTelegramMessage(chatId, formatted, botToken);
        }
        if (update.message.from && db) {
          logUserActivity(db, update.message.from.id, "agent_chat", { chat_id: chatId, intent: result.intent });
        }
      } catch (err: any) {
        console.error("Agent chain error:", err);
        const failureText = "<i>⚠️ Uplink lost. Connection to Mars habitat timed out.</i>";
        const notify = statusMessageId
          ? editTelegramMessage(chatId, statusMessageId, failureText, botToken)
          : sendTelegramMessage(chatId, failureText, botToken);
        await notify.catch((notifyErr: any) => console.error("Failed to send agent failure notice:", notifyErr));
      }
    }
  }
}

async function sendTelegramMessage(chatId: number, text: string, botToken: string): Promise<any> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
  });
  if (!res.ok) throw new Error(`Telegram sendMessage error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function editTelegramMessage(chatId: number, messageId: number, text: string, botToken: string): Promise<any> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: "HTML" })
  });
  if (!res.ok) throw new Error(`Telegram editMessageText error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function verifyTelegramInitData(
  initDataStr: string,
  botToken: string,
  maxAgeSeconds: number = 86400
): Promise<{ isValid: boolean; user?: any; error?: string }> {
  const params = new URLSearchParams(initDataStr);
  const hash = params.get("hash");
  if (!hash) {
    return { isValid: false, error: "Missing hash parameter" };
  }

  const authDateStr = params.get("auth_date");
  if (!authDateStr) {
    return { isValid: false, error: "Missing auth_date" };
  }

  const authDate = parseInt(authDateStr, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSeconds) {
    return { isValid: false, error: "Init data expired (request created > 24 hours ago)" };
  }

  const keys = Array.from(params.keys()).filter(key => key !== "hash").sort();
  const dataCheckString = keys.map(key => `${key}=${params.get(key)}`).join("\n");

  const encoder = new TextEncoder();

  const webAppDataKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const tokenSignature = await crypto.subtle.sign(
    "HMAC",
    webAppDataKey,
    encoder.encode(botToken)
  );

  const hmacKey = await crypto.subtle.importKey(
    "raw",
    tokenSignature,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const checkSignature = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    encoder.encode(dataCheckString)
  );

  const calculatedHash = Array.from(new Uint8Array(checkSignature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  if (calculatedHash === hash) {
    const userStr = params.get("user");
    return {
      isValid: true,
      user: userStr ? JSON.parse(userStr) : null
    };
  }

  return { isValid: false, error: "Signature mismatch. Invalid verification token." };
}
