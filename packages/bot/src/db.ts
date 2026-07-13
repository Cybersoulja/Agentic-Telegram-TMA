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
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT,
        username TEXT,
        language_code TEXT,
        is_premium BOOLEAN DEFAULT 0,
        theme_preference TEXT DEFAULT 'system',
        haptic_style TEXT DEFAULT 'medium',
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    return { success: true, message: "Database tables (users, activity_logs) initialized successfully." };
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
