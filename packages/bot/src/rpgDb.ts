export interface RpgCharacterRow {
  id: number;
  telegram_user_id: number;
  character_data: string;
  created_at: string;
  updated_at: string;
}

export async function saveCharacter(
  db: D1Database | undefined,
  telegramUserId: number,
  characterData: unknown
): Promise<{ success: boolean; message: string; character?: RpgCharacterRow }> {
  if (!db) return { success: false, message: "D1 database binding (TMA_DB) is not configured or available." };
  try {
    const now = new Date().toISOString();
    const result = await db
      .prepare(
        `INSERT INTO rpg_characters (telegram_user_id, character_data, created_at, updated_at) VALUES (?, ?, ?, ?) RETURNING *`
      )
      .bind(telegramUserId, JSON.stringify(characterData), now, now)
      .first<RpgCharacterRow>();
    return { success: true, message: "Character saved.", character: result ?? undefined };
  } catch (err: any) {
    return { success: false, message: `Failed to save character: ${err.message}` };
  }
}

export async function getCharacters(db: D1Database | undefined, telegramUserId: number): Promise<RpgCharacterRow[]> {
  if (!db) return [];
  try {
    const { results } = await db
      .prepare("SELECT * FROM rpg_characters WHERE telegram_user_id = ? ORDER BY updated_at DESC")
      .bind(telegramUserId)
      .all<RpgCharacterRow>();
    return results ?? [];
  } catch (err) {
    console.warn("getCharacters error:", err);
    return [];
  }
}

export async function getCharacterById(
  db: D1Database | undefined,
  telegramUserId: number,
  characterId: number
): Promise<RpgCharacterRow | null> {
  if (!db) return null;
  try {
    const row = await db
      .prepare("SELECT * FROM rpg_characters WHERE id = ? AND telegram_user_id = ?")
      .bind(characterId, telegramUserId)
      .first<RpgCharacterRow>();
    return row ?? null;
  } catch (err) {
    console.warn("getCharacterById error:", err);
    return null;
  }
}

export interface RpgSaveRow {
  id: number;
  telegram_user_id: number;
  slot: number;
  game_state: string;
  last_saved: string;
}

export async function saveGameState(
  db: D1Database | undefined,
  telegramUserId: number,
  slot: number,
  gameState: unknown
): Promise<{ success: boolean; message: string; save?: RpgSaveRow }> {
  if (!db) return { success: false, message: "D1 database binding (TMA_DB) is not configured or available." };
  try {
    const now = new Date().toISOString();
    const result = await db
      .prepare(
        `INSERT INTO rpg_saves (telegram_user_id, slot, game_state, last_saved) VALUES (?, ?, ?, ?)
         ON CONFLICT(telegram_user_id, slot) DO UPDATE SET
           game_state = excluded.game_state,
           last_saved = excluded.last_saved
         RETURNING *`
      )
      .bind(telegramUserId, slot, JSON.stringify(gameState), now)
      .first<RpgSaveRow>();
    return { success: true, message: "Game saved.", save: result ?? undefined };
  } catch (err: any) {
    return { success: false, message: `Failed to save game: ${err.message}` };
  }
}

export async function getGameSave(
  db: D1Database | undefined,
  telegramUserId: number,
  slot: number
): Promise<RpgSaveRow | null> {
  if (!db) return null;
  try {
    const row = await db
      .prepare("SELECT * FROM rpg_saves WHERE telegram_user_id = ? AND slot = ?")
      .bind(telegramUserId, slot)
      .first<RpgSaveRow>();
    return row ?? null;
  } catch (err) {
    console.warn("getGameSave error:", err);
    return null;
  }
}

export async function getGameSaves(db: D1Database | undefined, telegramUserId: number): Promise<RpgSaveRow[]> {
  if (!db) return [];
  try {
    const { results } = await db
      .prepare("SELECT * FROM rpg_saves WHERE telegram_user_id = ? ORDER BY slot ASC")
      .bind(telegramUserId)
      .all<RpgSaveRow>();
    return results ?? [];
  } catch (err) {
    console.warn("getGameSaves error:", err);
    return [];
  }
}

export interface RpgLeaderboardEntry {
  character_name: string;
  character_class: string;
  level: number;
  playtime: number;
  achievements_unlocked: number;
}

export interface RpgLeaderboardRow extends RpgLeaderboardEntry {
  id: number;
  telegram_user_id: number;
  created_at: string;
}

const LEADERBOARD_ORDER_COLUMNS = {
  level: "level",
  playtime: "playtime",
  achievements: "achievements_unlocked",
} as const;

export async function getLeaderboard(
  db: D1Database | undefined,
  type: keyof typeof LEADERBOARD_ORDER_COLUMNS,
  limit: number
): Promise<RpgLeaderboardRow[]> {
  if (!db) return [];
  const column = LEADERBOARD_ORDER_COLUMNS[type] ?? LEADERBOARD_ORDER_COLUMNS.achievements;
  try {
    const { results } = await db
      .prepare(`SELECT * FROM rpg_leaderboard ORDER BY ${column} DESC LIMIT ?`)
      .bind(limit)
      .all<RpgLeaderboardRow>();
    return results ?? [];
  } catch (err) {
    console.warn("getLeaderboard error:", err);
    return [];
  }
}

export async function submitLeaderboardEntry(
  db: D1Database | undefined,
  telegramUserId: number,
  entry: RpgLeaderboardEntry
): Promise<{ success: boolean; message: string; entry?: RpgLeaderboardRow }> {
  if (!db) return { success: false, message: "D1 database binding (TMA_DB) is not configured or available." };
  try {
    const result = await db
      .prepare(
        `INSERT INTO rpg_leaderboard (telegram_user_id, character_name, character_class, level, playtime, achievements_unlocked)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING *`
      )
      .bind(
        telegramUserId,
        entry.character_name,
        entry.character_class,
        entry.level,
        entry.playtime,
        entry.achievements_unlocked
      )
      .first<RpgLeaderboardRow>();
    return { success: true, message: "Leaderboard entry submitted.", entry: result ?? undefined };
  } catch (err: any) {
    return { success: false, message: `Failed to submit leaderboard entry: ${err.message}` };
  }
}
