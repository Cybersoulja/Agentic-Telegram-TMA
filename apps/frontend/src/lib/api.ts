import type { GameState } from "../types/game";

/**
 * RPG backend client. Unlike AetherRPG's original (a class-based singleton with a fixed
 * baseUrl and cookie-based Express sessions), every call here takes `backendUrl` and
 * `initDataRaw` explicitly — matching this app's existing pattern (see IntegrationsTab.tsx's
 * handleTrigger) where the backend URL is runtime-configurable and identity comes from the
 * Telegram initData payload, not a server-side session cookie.
 */

async function request<T>(backendUrl: string, endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${backendUrl}/api/rpg${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || response.statusText);
  }
  return data as T;
}

export async function saveCharacter(backendUrl: string, initDataRaw: string, characterData: unknown) {
  return request<{ success: boolean; character: any }>(backendUrl, "/characters", {
    method: "POST",
    body: JSON.stringify({ initData: initDataRaw, characterData }),
  });
}

export async function getCharacters(backendUrl: string, initDataRaw: string) {
  return request<{ success: boolean; characters: any[] }>(
    backendUrl,
    `/characters?initData=${encodeURIComponent(initDataRaw)}`
  );
}

export async function getCharacterById(backendUrl: string, initDataRaw: string, characterId: number) {
  return request<{ success: boolean; character: any }>(
    backendUrl,
    `/characters/${characterId}?initData=${encodeURIComponent(initDataRaw)}`
  );
}

export async function saveGameState(backendUrl: string, initDataRaw: string, gameState: GameState, slot: number = 1) {
  return request<{ success: boolean }>(backendUrl, "/saves", {
    method: "POST",
    body: JSON.stringify({ initData: initDataRaw, slot, gameState }),
  });
}

export async function loadGameState(backendUrl: string, initDataRaw: string, slot: number = 1) {
  return request<{ success: boolean; gameState: GameState }>(
    backendUrl,
    `/saves/${slot}?initData=${encodeURIComponent(initDataRaw)}`
  );
}

export async function getAllSaves(backendUrl: string, initDataRaw: string) {
  return request<{ success: boolean; saves: any[] }>(
    backendUrl,
    `/saves?initData=${encodeURIComponent(initDataRaw)}`
  );
}

export async function getLeaderboard(
  backendUrl: string,
  type: "level" | "playtime" | "achievements" = "level",
  limit: number = 10
) {
  return request<{ success: boolean; entries: any[] }>(backendUrl, `/leaderboard?type=${type}&limit=${limit}`);
}

export async function submitScore(
  backendUrl: string,
  initDataRaw: string,
  entry: {
    characterName: string;
    characterClass: string;
    level: number;
    playtime?: number;
    achievementsUnlocked?: number;
  }
) {
  return request<{ success: boolean; entry: any }>(backendUrl, "/leaderboard", {
    method: "POST",
    body: JSON.stringify({ initData: initDataRaw, ...entry }),
  });
}

export interface DmResponse {
  success: boolean;
  text: string;
  oracle?: { rolls: number[]; hand: string; tier: number };
}

export async function consultDm(
  backendUrl: string,
  initDataRaw: string,
  params: { agentId: string; context?: string; playerName?: string; situation?: string; oracle?: boolean }
) {
  return request<DmResponse>(backendUrl, "/dm", {
    method: "POST",
    body: JSON.stringify({ initData: initDataRaw, ...params }),
  });
}
