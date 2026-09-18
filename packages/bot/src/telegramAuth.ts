export async function verifyTelegramInitData(
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

export interface InitDataAuthEnv {
  TELEGRAM_BOT_TOKEN?: string;
}

export interface InitDataAuthResult {
  ok: true;
  userId: number;
}
export interface InitDataAuthFailure {
  ok: false;
  response: Response;
}

/**
 * Shared gate for any route that touches a real per-user Cloudflare resource (D1 rows, a billed
 * Gemini call, a real Craft write) — proves the request came from a genuine Telegram Mini App
 * launch rather than an anonymous caller of this public Worker. Used the same way by rpg.ts's
 * `/api/rpg/*` routes, integrations.ts's `craft` action, and index.ts's `/api/profile` and
 * `/api/mission-log` routes.
 */
export async function authenticateInitData(
  initData: string | null,
  env: InitDataAuthEnv,
  corsHeaders: Record<string, string>
): Promise<InitDataAuthResult | InitDataAuthFailure> {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ success: false, error: "Server is not configured for Telegram auth." }),
        { status: 500, headers: corsHeaders }
      ),
    };
  }
  const auth = await verifyTelegramInitData(initData || "", env.TELEGRAM_BOT_TOKEN);
  if (!auth.isValid || !auth.user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ success: false, error: auth.error || "Unauthorized" }), {
        status: 403,
        headers: corsHeaders,
      }),
    };
  }
  return { ok: true, userId: auth.user.id };
}
