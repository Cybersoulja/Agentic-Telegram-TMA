export interface UserProfileData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  theme_preference?: string;
  haptic_style?: string;
  last_active?: string;
}

export async function initDatabase(db?: D1Database): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: "D1 database binding (TMA_DB) is not configured or available." };
  }

  try {
    // D1Database.exec() splits its input on newlines and runs each line as its own
    // statement, so a multi-line CREATE TABLE breaks it. Use prepare().run() instead,
    // which executes the full statement regardless of embedded newlines.
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT,
        username TEXT,
        language_code TEXT,
        is_premium BOOLEAN DEFAULT 0,
        theme_preference TEXT DEFAULT 'system',
        haptic_style TEXT DEFAULT 'medium',
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS activity_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS mission_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        narrative TEXT NOT NULL,
        audio_url TEXT,
        bluesky_uri TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
      )
      .run();

    return { success: true, message: "Database tables (users, activity_logs, mission_logs) initialized successfully." };
  } catch (err: any) {
    return { success: false, message: `Failed to initialize D1 tables: ${err.message}` };
  }
}

export async function getUserProfile(
  db?: D1Database,
  kv?: KVNamespace,
  userId?: number,
  ctx?: ExecutionContext
): Promise<UserProfileData | null> {
  if (!userId) return null;

  // 1. Try reading from KV cache first for speed
  if (kv) {
    try {
      const cached = await kv.get(`user:${userId}`, "json");
      if (cached) return cached as UserProfileData;
    } catch (err) {
      console.warn("KV get error:", err);
    }
  }

  // 2. Fallback to D1 query
  if (db) {
    try {
      const row = await db
        .prepare("SELECT * FROM users WHERE id = ?")
        .bind(userId)
        .first<UserProfileData>();

      if (row && kv) {
        // Populate cache for 3600s. Must be registered with ctx.waitUntil, otherwise the
        // Worker runtime may terminate this background write once the response is returned.
        const populateCache = kv
          .put(`user:${userId}`, JSON.stringify(row), { expirationTtl: 3600 })
          .catch((err) => console.warn("KV cache populate error:", err));
        if (ctx) {
          ctx.waitUntil(populateCache);
        } else {
          await populateCache;
        }
      }
      return row || null;
    } catch (err) {
      console.warn("D1 query error:", err);
    }
  }

  return null;
}

export async function saveUserProfile(
  db?: D1Database,
  kv?: KVNamespace,
  profile?: Partial<UserProfileData>
): Promise<{ success: boolean; message: string }> {
  if (!profile || !profile.id) {
    return { success: false, message: "User profile ID is required." };
  }

  const now = new Date().toISOString();
  const fullProfile: UserProfileData = {
    id: profile.id,
    first_name: profile.first_name || "User",
    last_name: profile.last_name || "",
    username: profile.username || "",
    language_code: profile.language_code || "en",
    is_premium: profile.is_premium || false,
    theme_preference: profile.theme_preference || "system",
    haptic_style: profile.haptic_style || "medium",
    last_active: now,
  };

  let savedInD1 = false;
  let savedInKV = false;

  if (db) {
    try {
      await db
        .prepare(`
          INSERT INTO users (id, first_name, last_name, username, language_code, is_premium, theme_preference, haptic_style, last_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            first_name = excluded.first_name,
            last_name = excluded.last_name,
            username = excluded.username,
            language_code = excluded.language_code,
            is_premium = excluded.is_premium,
            theme_preference = coalesce(excluded.theme_preference, users.theme_preference),
            haptic_style = coalesce(excluded.haptic_style, users.haptic_style),
            last_active = excluded.last_active;
        `)
        .bind(
          fullProfile.id,
          fullProfile.first_name,
          fullProfile.last_name,
          fullProfile.username,
          fullProfile.language_code,
          fullProfile.is_premium ? 1 : 0,
          fullProfile.theme_preference,
          fullProfile.haptic_style,
          fullProfile.last_active
        )
        .run();
      savedInD1 = true;
    } catch (err: any) {
      console.error("D1 save error:", err);
    }
  }

  if (kv) {
    try {
      await kv.put(`user:${fullProfile.id}`, JSON.stringify(fullProfile), { expirationTtl: 3600 });
      savedInKV = true;
    } catch (err: any) {
      console.error("KV save error:", err);
    }
  }

  if (!savedInD1 && !savedInKV) {
    return { success: false, message: "No database or KV storage bindings available to save profile." };
  }

  return {
    success: true,
    message: `Profile saved successfully (${[savedInD1 ? "D1" : "", savedInKV ? "KV" : ""].filter(Boolean).join(" + ")}).`,
  };
}

export async function logUserActivity(
  db?: D1Database,
  userId?: number,
  action?: string,
  metadata?: any
): Promise<void> {
  if (!db || !userId || !action) return;
  try {
    await db
      .prepare("INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)")
      .bind(userId, action, metadata ? JSON.stringify(metadata) : null)
      .run();
  } catch (err) {
    console.warn("Log activity error:", err);
  }
}

/**
 * Ensures a `users` row exists for a Telegram user before activity is logged against them —
 * `activity_logs.user_id` has a foreign key to `users.id`, and Telegram message events don't
 * otherwise guarantee a profile row exists yet. Uses ON CONFLICT DO NOTHING so it never
 * overwrites an existing saved profile (unlike saveUserProfile, which is a full upsert).
 */
export async function ensureUserExists(db?: D1Database, user?: { id?: number; first_name?: string }): Promise<void> {
  if (!db || !user?.id) return;
  try {
    await db
      .prepare("INSERT INTO users (id, first_name) VALUES (?, ?) ON CONFLICT(id) DO NOTHING")
      .bind(user.id, user.first_name || "User")
      .run();
  } catch (err) {
    console.warn("ensureUserExists error:", err);
  }
}

/** Reads the most recent `agent_chat` activity log whose logged Oracle tier meets `minTier`. */
export async function getLatestHighTierNarrative(
  db?: D1Database,
  minTier: number = 5
): Promise<{ narrative: string; tier: number } | null> {
  if (!db) return null;
  try {
    const row = await db
      .prepare(
        `SELECT metadata FROM activity_logs
         WHERE action = 'agent_chat' AND CAST(json_extract(metadata, '$.tier') AS INTEGER) >= ?
         ORDER BY created_at DESC LIMIT 1`
      )
      .bind(minTier)
      .first<{ metadata: string }>();
    if (!row?.metadata) return null;
    const parsed = JSON.parse(row.metadata);
    if (!parsed.narrative) return null;
    return { narrative: parsed.narrative, tier: parsed.tier };
  } catch (err) {
    console.warn("getLatestHighTierNarrative error:", err);
    return null;
  }
}

export interface MissionLogEntry {
  narrative: string;
  audio_url: string;
  bluesky_uri: string;
}

export async function saveMissionLog(
  db: D1Database | undefined,
  entry: MissionLogEntry
): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: "D1 database binding (TMA_DB) is not configured or available." };
  }
  try {
    await db
      .prepare("INSERT INTO mission_logs (narrative, audio_url, bluesky_uri) VALUES (?, ?, ?)")
      .bind(entry.narrative, entry.audio_url, entry.bluesky_uri)
      .run();
    return { success: true, message: "Mission log saved." };
  } catch (err: any) {
    return { success: false, message: `Failed to save mission log: ${err.message}` };
  }
}
