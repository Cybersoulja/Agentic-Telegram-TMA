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
