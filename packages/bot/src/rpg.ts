import { verifyTelegramInitData } from "./telegramAuth.js";
import { runOracleDice } from "./oracle.js";
import { callGemini } from "./gemini.js";
import {
  saveCharacter,
  getCharacters,
  getCharacterById,
  saveGameState,
  getGameSave,
  getGameSaves,
  getLeaderboard,
  submitLeaderboardEntry,
} from "./rpgDb.js";

export interface RpgEnv {
  TMA_DB?: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  GEMINI_API_KEY?: string;
}

interface AuthResult {
  ok: true;
  userId: number;
}
interface AuthFailure {
  ok: false;
  response: Response;
}

/**
 * Every /api/rpg/* route is gated the same way `craft` is in integrations.ts: a real Cloudflare
 * resource (D1 rows tied to a person, or a billed Gemini call) shouldn't be reachable by anyone
 * who can reach this public Worker — only genuine Telegram Mini App launches.
 */
async function authenticate(
  initData: string | null,
  env: RpgEnv,
  corsHeaders: Record<string, string>
): Promise<AuthResult | AuthFailure> {
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

export async function handleRpgRoute(
  request: Request,
  env: RpgEnv,
  url: URL,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const path = url.pathname.replace("/api/rpg/", "");
  const segments = path.split("/").filter(Boolean);

  // GET requests carry initData as a query param (no body); POST requests carry it in the JSON body.
  if (segments[0] === "characters" && request.method === "POST" && segments.length === 1) {
    const body: any = await request.json().catch(() => ({}));
    const auth = await authenticate(body.initData, env, corsHeaders);
    if (!auth.ok) return auth.response;
    const result = await saveCharacter(env.TMA_DB, auth.userId, body.characterData);
    return new Response(JSON.stringify(result), { status: result.success ? 200 : 500, headers: corsHeaders });
  }

  if (segments[0] === "characters" && request.method === "GET" && segments.length === 1) {
    const auth = await authenticate(url.searchParams.get("initData"), env, corsHeaders);
    if (!auth.ok) return auth.response;
    const characters = await getCharacters(env.TMA_DB, auth.userId);
    return new Response(JSON.stringify({ success: true, characters }), { status: 200, headers: corsHeaders });
  }

  if (segments[0] === "characters" && request.method === "GET" && segments.length === 2) {
    const auth = await authenticate(url.searchParams.get("initData"), env, corsHeaders);
    if (!auth.ok) return auth.response;
    const characterId = parseInt(segments[1], 10);
    if (!Number.isInteger(characterId) || characterId < 1) {
      return new Response(JSON.stringify({ success: false, error: "Invalid character id" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    const character = await getCharacterById(env.TMA_DB, auth.userId, characterId);
    if (!character) {
      return new Response(JSON.stringify({ success: false, error: "Character not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }
    return new Response(JSON.stringify({ success: true, character }), { status: 200, headers: corsHeaders });
  }

  if (segments[0] === "saves" && request.method === "POST" && segments.length === 1) {
    const body: any = await request.json().catch(() => ({}));
    const auth = await authenticate(body.initData, env, corsHeaders);
    if (!auth.ok) return auth.response;
    const slot = body.slot === undefined ? 1 : Number(body.slot);
    if (!Number.isInteger(slot) || slot < 1) {
      return new Response(JSON.stringify({ success: false, error: "Invalid slot" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    const result = await saveGameState(env.TMA_DB, auth.userId, slot, body.gameState);
    return new Response(JSON.stringify(result), { status: result.success ? 200 : 500, headers: corsHeaders });
  }

  if (segments[0] === "saves" && request.method === "GET" && segments.length === 2) {
    const auth = await authenticate(url.searchParams.get("initData"), env, corsHeaders);
    if (!auth.ok) return auth.response;
    const slot = parseInt(segments[1], 10);
    if (!Number.isInteger(slot) || slot < 1) {
      return new Response(JSON.stringify({ success: false, error: "Invalid slot" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    const save = await getGameSave(env.TMA_DB, auth.userId, slot);
    if (!save) {
      return new Response(JSON.stringify({ success: false, error: "Save not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }
    return new Response(JSON.stringify({ success: true, gameState: JSON.parse(save.game_state) }), {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (segments[0] === "saves" && request.method === "GET" && segments.length === 1) {
    const auth = await authenticate(url.searchParams.get("initData"), env, corsHeaders);
    if (!auth.ok) return auth.response;
    const saves = await getGameSaves(env.TMA_DB, auth.userId);
    return new Response(JSON.stringify({ success: true, saves }), { status: 200, headers: corsHeaders });
  }

  if (segments[0] === "leaderboard" && request.method === "GET") {
    const type = (url.searchParams.get("type") || "level") as "level" | "playtime" | "achievements";
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const entries = await getLeaderboard(env.TMA_DB, type, limit);
    return new Response(JSON.stringify({ success: true, entries }), { status: 200, headers: corsHeaders });
  }

  if (segments[0] === "leaderboard" && request.method === "POST") {
    const body: any = await request.json().catch(() => ({}));
    const auth = await authenticate(body.initData, env, corsHeaders);
    if (!auth.ok) return auth.response;
    const result = await submitLeaderboardEntry(env.TMA_DB, auth.userId, {
      character_name: body.characterName,
      character_class: body.characterClass,
      level: body.level,
      playtime: body.playtime || 0,
      achievements_unlocked: body.achievementsUnlocked || 0,
    });
    return new Response(JSON.stringify(result), { status: result.success ? 200 : 500, headers: corsHeaders });
  }

  if (segments[0] === "dm" && request.method === "POST") {
    const body: any = await request.json().catch(() => ({}));
    const auth = await authenticate(body.initData, env, corsHeaders);
    if (!auth.ok) return auth.response;
    const response = await generateDmResponse(body, env);
    return new Response(JSON.stringify({ success: true, ...response }), { status: 200, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: false, error: "RPG route not found" }), {
    status: 404,
    headers: corsHeaders,
  });
}

const AGENT_PERSONAS: Record<string, { name: string; persona: string }> = {
  dungeon_master: {
    name: "Trill Astro Buzz",
    persona:
      "Trill Astro Buzz, an advanced AI astronaut acting as Game Master for a text RPG adventure. Wise, encouraging, futuristic but warm in tone.",
  },
  merchant_npc: {
    name: "Gareth the Trader",
    persona: "Gareth the Trader, a shrewd but honest merchant who has traveled far and wide.",
  },
  companion_ally: {
    name: "Elena the Cleric",
    persona: "Elena the Cleric, a devoted healer with unwavering faith and a kind heart.",
  },
};

const FALLBACK_RESPONSES: Record<string, string> = {
  dungeon_master: "The winds of fate shift around you as new possibilities emerge.",
  merchant_npc: "Welcome, traveler! I have wares from across the realm.",
  companion_ally: "I stand ready to assist you however I can.",
};

/**
 * Real-AI replacement for AetherRPG's template-based AIAgentEngine. Falls back to a static line
 * (matching the graceful-degradation convention used elsewhere in this Worker) when
 * GEMINI_API_KEY isn't configured, rather than failing the request.
 */
async function generateDmResponse(
  body: { agentId?: string; context?: string; playerName?: string; situation?: string; oracle?: boolean },
  env: RpgEnv
): Promise<{ text: string; oracle?: ReturnType<typeof runOracleDice> }> {
  const agentId = body.agentId && AGENT_PERSONAS[body.agentId] ? body.agentId : "dungeon_master";
  const agent = AGENT_PERSONAS[agentId];
  const oracle = body.oracle ? runOracleDice() : undefined;

  if (!env.GEMINI_API_KEY) {
    return { text: FALLBACK_RESPONSES[agentId], oracle };
  }

  let prompt = `You are ${agent.name}. Persona: "${agent.persona}"\nSITUATION: ${JSON.stringify(
    body.situation || body.context || "greeting"
  )}\n`;
  if (body.playerName) prompt += `The player's name is ${body.playerName}.\n`;
  if (oracle) {
    prompt += `EVENT: The player performed an action. DICE OUTCOME: ${oracle.hand} (Tier ${oracle.tier} of 5). Narrate the outcome based heavily on the tier.\n`;
  }
  prompt += "TASK: Respond in character. Keep it under 3 sentences.";

  try {
    const text = await callGemini(prompt, env.GEMINI_API_KEY);
    return { text, oracle };
  } catch (err: any) {
    console.error("RPG DM Gemini error:", err);
    return { text: FALLBACK_RESPONSES[agentId], oracle };
  }
}
