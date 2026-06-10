import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

import express from "express";
import path from "path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createServer as createViteServer } from "vite";
import TelegramBot from "node-telegram-bot-api";
import bcrypt from "bcryptjs";
import pool from "./database.js";
import { assertCriticalEnvForProduction } from "./config/env.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const frontendRoot = path.join(repoRoot, "frontend");
const app = express();
const PORT = Number(process.env.PORT) || 3030;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_TTL_MS = 1e3 * 60 * 60 * 24 * 7;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 1e3 * 60 * 15;
const TELEGRAM_LINK_CODE_TTL_MS = 1e3 * 60 * 10;
const TELEGRAM_LINK_WINDOW_MS = 1e3 * 60 * 10;
const TELEGRAM_MAX_LINK_REQUESTS = 3;
const TELEGRAM_MAX_VERIFY_ATTEMPTS = 5;
const WORKOUTS_RANGE = "Workouts!A:F";
const ACTIVITY_RANGE = "Activity!A:H";
const GOALS_SHEET = "Goals";
const GOALS_RANGE = `${GOALS_SHEET}!A:N`;
const USERS_SHEET = "Users";
const SESSIONS_SHEET = "Sessions";
const AUDIT_SHEET = "AuditLog";
const BOT_COMMANDS_SHEET = "BotCommands";
const BOT_COMMANDS_RANGE = `${BOT_COMMANDS_SHEET}!A:C`;
const ATTENDANCE_SHEET = "Attendance";
const ATTENDANCE_RANGE = `${ATTENDANCE_SHEET}!A:F`;
const MOTIVATION_QUOTES_SHEET = "MotivationQuotes";
const MOTIVATION_QUOTES_RANGE = `${MOTIVATION_QUOTES_SHEET}!A:C`;
const SUPPORTED_QUOTE_LANGUAGES = /* @__PURE__ */ new Set(["ta", "en", "fr"]);
const MOTIVATION_MESSAGES = [
  "No excuses. Just results. You showed up today \u2014 that\u2019s how champions are built.",
  "Discipline beats motivation. You didn\u2019t feel like it, but you did it anyway \u2014 that\u2019s power.",
  "Every rep counts. Every day matters. Keep stacking wins.",
  "Your future body is watching your decisions today. Make it proud.",
  "Pain is temporary. Progress is permanent. Keep going.",
  "You\u2019re not competing with others \u2014 you\u2019re defeating yesterday\u2019s version of yourself.",
  "Small daily efforts create massive transformations. Stay consistent.",
  "Sweat today. Shine tomorrow. You\u2019re on the right path.",
  "The hardest part is showing up \u2014 and you already did that. Respect.",
  "No shortcuts. No magic. Just hard work \u2014 and you\u2019re doing it.",
  "You didn\u2019t come this far to stop now. Push one more rep.",
  "Consistency is your superpower. Keep showing up.",
  "Strong mind. Strong body. Strong life.",
  "This is not just fitness \u2014 this is self-respect in action.",
  "You are building a body that matches your mindset. Stay locked in."
];
const loginAttemptMap = /* @__PURE__ */ new Map();
const telegramLinkRateMap = /* @__PURE__ */ new Map();
const telegramPendingLinks = /* @__PURE__ */ new Map();
const sqlDt = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 23).replace("T", " ");
};
const sqlNow = () => sqlDt((/* @__PURE__ */ new Date()).toISOString());
const isoFromSql = (value) => {
  if (!value) return "";
  const text = String(value);
  const normalized = text.includes(" ") ? text.replace(" ", "T") : text;
  const withZone = normalized.endsWith("Z") ? normalized : `${normalized}Z`;
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
};
async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason instanceof Error ? reason.stack || reason.message : reason);
});
process.on("uncaughtException", (error) => {
  console.error("[uncaughtException]", error instanceof Error ? error.stack || error.message : error);
});
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;
if (token) {
  bot = new TelegramBot(token, { polling: true });
  console.log(
    `[telegram] polling started (pid=${process.pid}). Only one process may use TELEGRAM_BOT_TOKEN; duplicate pollers cause 409 Conflict.`
  );
  let last409ExplainAt = 0;
  bot.on("polling_error", (err) => {
    const message = err instanceof Error ? err.message : String(err);
    const is409 = message.includes("409") || message.includes("Conflict") || message.includes("getUpdates");
    if (is409) {
      const now = Date.now();
      if (now - last409ExplainAt > 15e3) {
        last409ExplainAt = now;
        console.error(
          "[telegram] 409 Conflict \u2014 another app/process is already polling Telegram with this token.\n  Fix: stop every other Node server, VPS, or PC using the same TELEGRAM_BOT_TOKEN (Task Manager / close extra terminals).\n  Until then, this process may not receive commands reliably (looks like nothing is happening)."
        );
      }
    } else {
      console.error("[telegram] polling_error:", err);
    }
  });
  void bot.getMe().then((me) => {
    console.log(`[telegram] connected as @${me.username} (${me.first_name})`);
  }).catch((e) => {
    console.error("[telegram] getMe failed \u2014 check TELEGRAM_BOT_TOKEN:", e);
  });
} else {
  console.warn("TELEGRAM_BOT_TOKEN not found. Bot functionality disabled.");
}
const normalizeHeader = (value) => value.toLowerCase().replace(/\s/g, "").replace(/_/g, "");
const safeNumber = (value) => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
};
const toIsoDate = (value) => {
  if (!value) return "";
  if (DATE_REGEX.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};
const ATTENDANCE_DDMMYYYY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
function parseAttendanceDateToIso(value) {
  if (!value) return "";
  const trimmed = value.trim();
  if (DATE_REGEX.test(trimmed)) return trimmed;
  const m = trimmed.match(ATTENDANCE_DDMMYYYY);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && y >= 1e3 && y <= 9999) {
      const utc = Date.UTC(y, mo - 1, d);
      const dt = new Date(utc);
      if (dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d) {
        return dt.toISOString().slice(0, 10);
      }
    }
    return "";
  }
  return toIsoDate(trimmed);
}
const todayIsoDate = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
const normalizeUser = (value) => value.trim();
const makeUserId = (username) => normalizeUser(username || "unknown").toLowerCase().replace(/\s+/g, "_");
const hashToken = (tokenValue) => createHash("sha256").update(tokenValue).digest("hex");
const normalizeEmail = (value) => value.trim().toLowerCase();
const normalizeGoalName = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};
const normalizeChatId = (chatId) => String(chatId).trim();
const normalizeTelegramUsername = (value) => (value || "").trim();
const generateOtpCode = () => `${Math.floor(1e5 + Math.random() * 9e5)}`;
const ensureSpreadsheetId = () => true;
const parseDateRange = (fromRaw, toRaw) => {
  const from = toIsoDate(fromRaw) || "1970-01-01";
  const to = toIsoDate(toRaw) || todayIsoDate();
  if (from > to) return { error: "Invalid range: from must be <= to" };
  return { from, to };
};
const isGoalMet = (activity, goal) => {
  const checks = [
    goal.stepsGoal > 0 ? activity.steps >= goal.stepsGoal : true,
    goal.distanceGoalKm > 0 ? activity.distanceKm >= goal.distanceGoalKm : true,
    goal.caloriesGoal > 0 ? activity.calories >= goal.caloriesGoal : true,
    goal.activeMinutesGoal > 0 ? activity.activeMinutes >= goal.activeMinutesGoal : true
  ];
  return checks.every(Boolean);
};
async function ensureSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      userId CHAR(36) NOT NULL,
      email VARCHAR(255) NOT NULL,
      passwordHash VARCHAR(255) NOT NULL,
      displayName VARCHAR(120) NOT NULL,
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      lastLoginAt DATETIME(3) NULL,
      telegramChatId VARCHAR(64) NULL,
      telegramUsername VARCHAR(64) NULL,
      telegramLinkedAt DATETIME(3) NULL,
      phoneNumber VARCHAR(32) NULL,
      address VARCHAR(255) NULL,
      goals TEXT NULL,
      PRIMARY KEY (userId),
      UNIQUE KEY uq_users_email (email),
      KEY idx_users_role_active (role, isActive),
      KEY idx_users_telegram_chat (telegramChatId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS sessions (
      sessionId CHAR(36) NOT NULL,
      userId CHAR(36) NOT NULL,
      tokenHash CHAR(64) NOT NULL,
      expiresAt DATETIME(3) NOT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      revokedAt DATETIME(3) NULL,
      ip VARCHAR(64) NULL,
      userAgent VARCHAR(512) NULL,
      PRIMARY KEY (sessionId),
      UNIQUE KEY uq_sessions_token_hash (tokenHash),
      KEY idx_sessions_user (userId),
      KEY idx_sessions_expires (expiresAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS workouts (
      workoutId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      userId CHAR(36) NOT NULL,
      username VARCHAR(120) NOT NULL,
      date DATE NOT NULL,
      musclegroup VARCHAR(120) NOT NULL,
      exercises TEXT NULL,
      setsreps VARCHAR(120) NULL,
      notes TEXT NULL,
      PRIMARY KEY (workoutId),
      KEY idx_workouts_user_date (userId, date),
      KEY idx_workouts_username_date (username, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS audit_log (
      eventId CHAR(36) NOT NULL,
      userId CHAR(36) NULL,
      eventType VARCHAR(80) NOT NULL,
      targetId VARCHAR(120) NULL,
      metadataJson JSON NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (eventId),
      KEY idx_audit_user_created (userId, createdAt),
      KEY idx_audit_type_created (eventType, createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS goals (
      goalId CHAR(36) NOT NULL,
      userId CHAR(36) NOT NULL,
      username VARCHAR(120) NOT NULL,
      goalName VARCHAR(120) NOT NULL,
      period ENUM('daily', 'weekly') NOT NULL,
      stepsGoal INT UNSIGNED NOT NULL DEFAULT 0,
      distanceGoalKm DECIMAL(8,2) NOT NULL DEFAULT 0.00,
      caloriesGoal INT UNSIGNED NOT NULL DEFAULT 0,
      activeMinutesGoal INT UNSIGNED NOT NULL DEFAULT 0,
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      description TEXT NULL,
      targetValue DECIMAL(10,2) NULL,
      targetUnit VARCHAR(32) NULL,
      PRIMARY KEY (goalId),
      KEY idx_goals_user_active (userId, isActive),
      KEY idx_goals_period (period)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS activity (
      activityId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      userId CHAR(36) NOT NULL,
      username VARCHAR(120) NOT NULL,
      date DATE NOT NULL,
      steps INT UNSIGNED NOT NULL DEFAULT 0,
      distanceKm DECIMAL(8,2) NOT NULL DEFAULT 0.00,
      calories INT UNSIGNED NOT NULL DEFAULT 0,
      activeMinutes INT UNSIGNED NOT NULL DEFAULT 0,
      notes TEXT NULL,
      PRIMARY KEY (activityId),
      UNIQUE KEY uq_activity_user_date (userId, date),
      KEY idx_activity_username_date (username, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS bot_commands (
      command VARCHAR(64) NOT NULL,
      response TEXT NOT NULL,
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (command)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS attendance (
      attendanceId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      date DATE NOT NULL,
      time TIME NULL,
      day VARCHAR(16) NULL,
      userId CHAR(36) NULL,
      chatId VARCHAR(64) NULL,
      PRIMARY KEY (attendanceId),
      UNIQUE KEY uq_attendance_user_date (userId, date),
      KEY idx_attendance_name_date (name, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS motivation_quotes (
      quoteId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      quote TEXT NOT NULL,
      author VARCHAR(120) NULL,
      language ENUM('ta', 'en', 'fr') NOT NULL DEFAULT 'en',
      PRIMARY KEY (quoteId),
      KEY idx_quotes_language (language)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  ];
  for (const statement of statements) {
    await pool.query(statement);
  }
  await reconcileSchema();
}
async function columnExists(table, column) {
  const rows = await query(
    "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1",
    [table, column]
  );
  return rows.length > 0;
}
async function renameColumnIfNeeded(table, oldColumn, newColumn, definition) {
  const hasOld = await columnExists(table, oldColumn);
  const hasNew = await columnExists(table, newColumn);
  if (hasOld && !hasNew) {
    await pool.query(`ALTER TABLE \`${table}\` CHANGE \`${oldColumn}\` \`${newColumn}\` ${definition}`);
    console.log(`Schema reconcile: renamed ${table}.${oldColumn} -> ${newColumn}`);
  }
}
async function dropForeignKeys(table) {
  const rows = await query(
    "SELECT DISTINCT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL",
    [table]
  );
  for (const row of rows) {
    await pool.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``);
    console.log(`Schema reconcile: dropped FK ${table}.${row.CONSTRAINT_NAME}`);
  }
}
async function reconcileSchema() {
  await renameColumnIfNeeded("workouts", "muscle", "musclegroup", "VARCHAR(120) NOT NULL");
  await renameColumnIfNeeded("workouts", "variation", "exercises", "TEXT NULL");
  await renameColumnIfNeeded("workouts", "reps", "setsreps", "VARCHAR(120) NULL");
  for (const table of ["sessions", "workouts", "audit_log", "goals", "activity", "attendance"]) {
    await dropForeignKeys(table);
  }
}
async function ensureAuthSheets() {
  try {
    console.log("Ensuring database schema...");
    await ensureSchema();
    console.log("Fetching existing bot commands...");
    const existingCommands = await getBotCommands();
    if (existingCommands.length === 0) {
      console.log("Populating default bot commands...");
      const defaults = [
        ["/chest", "\u{1F3CB}\uFE0F CHEST WORKOUT (5 Exercises)\n\n1\uFE0F\u20E3 Bench Press\n\u{1F449} 4 sets \xD7 8\u201312 reps\n\u{1F449} Variation: Incline / Decline\n\u{1F449} Tip: Keep your feet planted and control the bar\n\n2\uFE0F\u20E3 Push-Ups\n\u{1F449} 3 sets \xD7 12\u201320 reps\n\u{1F449} Variation: Wide / Diamond\n\u{1F449} Tip: Keep body straight, don\u2019t sag hips\n\n3\uFE0F\u20E3 Dumbbell Fly\n\u{1F449} 3 sets \xD7 10\u201315 reps\n\u{1F449} Variation: Incline Fly\n\u{1F449} Tip: Slight bend in elbows, stretch chest fully\n\n4\uFE0F\u20E3 Chest Dips\n\u{1F449} 3 sets \xD7 8\u201312 reps\n\u{1F449} Variation: Weighted dips\n\u{1F449} Tip: Lean forward to target chest\n\n5\uFE0F\u20E3 Cable Crossover\n\u{1F449} 3 sets \xD7 12\u201315 reps\n\u{1F449} Variation: High to Low / Low to High\n\u{1F449} Tip: Squeeze chest at the center\n\n\u{1F525} Focus: Form > Weight\n\u{1F4A7} Rest: 60\u201390 sec between sets", nowIso()],
        ["/shoulder", "\u{1F3CB}\uFE0F SHOULDER WORKOUT (5 Exercises)\n\n1\uFE0F\u20E3 Overhead Press\n\u{1F449} 4 sets \xD7 8\u201312 reps\n\u{1F449} Variation: Dumbbell / Barbell\n\u{1F449} Tip: Keep core tight, avoid arching back\n\n2\uFE0F\u20E3 Lateral Raises\n\u{1F449} 3 sets \xD7 12\u201315 reps\n\u{1F449} Variation: Single-arm / Cable\n\u{1F449} Tip: Lift to shoulder level, slow control\n\n3\uFE0F\u20E3 Front Raises\n\u{1F449} 3 sets \xD7 10\u201312 reps\n\u{1F449} Variation: Plate / Dumbbell\n\u{1F449} Tip: Don\u2019t swing the weight\n\n4\uFE0F\u20E3 Rear Delt Fly\n\u{1F449} 3 sets \xD7 12\u201315 reps\n\u{1F449} Variation: Machine / Bent-over\n\u{1F449} Tip: Focus on rear shoulder squeeze\n\n5\uFE0F\u20E3 Arnold Press\n\u{1F449} 3 sets \xD7 8\u201310 reps\n\u{1F449} Tip: Rotate wrists during press\n\n\u{1F525} Focus: Full shoulder development\n\u{1F4A7} Rest: 60\u201390 sec", nowIso()],
        ["/lat", "\u{1F3CB}\uFE0F LAT / BACK WORKOUT (5 Exercises)\n\n1\uFE0F\u20E3 Pull-Ups\n\u{1F449} 4 sets \xD7 6\u201310 reps\n\u{1F449} Variation: Wide / Close grip\n\u{1F449} Tip: Full stretch & pull\n\n2\uFE0F\u20E3 Lat Pulldown\n\u{1F449} 3 sets \xD7 10\u201312 reps\n\u{1F449} Variation: Wide / Reverse grip\n\u{1F449} Tip: Pull to chest, not neck\n\n3\uFE0F\u20E3 Seated Row\n\u{1F449} 3 sets \xD7 10\u201312 reps\n\u{1F449} Variation: Cable / Machine\n\u{1F449} Tip: Squeeze shoulder blades\n\n4\uFE0F\u20E3 One-arm Dumbbell Row\n\u{1F449} 3 sets \xD7 10 reps each side\n\u{1F449} Tip: Keep back straight\n\n5\uFE0F\u20E3 Straight Arm Pulldown\n\u{1F449} 3 sets \xD7 12\u201315 reps\n\u{1F449} Tip: Focus on lat stretch\n\n\u{1F525} Focus: Width + Thickness\n\u{1F4A7} Rest: 60\u201390 sec", nowIso()],
        ["/legs", "\u{1F3CB}\uFE0F LEG WORKOUT (5 Exercises)\n\n1\uFE0F\u20E3 Squats\n\u{1F449} 4 sets \xD7 8\u201312 reps\n\u{1F449} Variation: Front / Back squat\n\u{1F449} Tip: Keep chest up\n\n2\uFE0F\u20E3 Leg Press\n\u{1F449} 3 sets \xD7 10\u201315 reps\n\u{1F449} Tip: Don\u2019t lock knees\n\n3\uFE0F\u20E3 Lunges\n\u{1F449} 3 sets \xD7 10 each leg\n\u{1F449} Variation: Walking / Static\n\u{1F449} Tip: Control balance\n\n4\uFE0F\u20E3 Leg Curl\n\u{1F449} 3 sets \xD7 12\u201315 reps\n\u{1F449} Tip: Slow eccentric\n\n5\uFE0F\u20E3 Calf Raises\n\u{1F449} 4 sets \xD7 15\u201320 reps\n\u{1F449} Tip: Full stretch + squeeze\n\n\u{1F525} Focus: Strength + Stability\n\u{1F4A7} Rest: 60\u2013120 sec", nowIso()],
        ["/bicep", "\u{1F3CB}\uFE0F BICEP WORKOUT (5 Exercises)\n\n1\uFE0F\u20E3 Barbell Curl\n\u{1F449} 4 sets \xD7 8\u201312 reps\n\u{1F449} Tip: Don\u2019t swing\n\n2\uFE0F\u20E3 Dumbbell Curl\n\u{1F449} 3 sets \xD7 10\u201312 reps\n\u{1F449} Variation: Alternate\n\u{1F449} Tip: Full stretch\n\n3\uFE0F\u20E3 Hammer Curl\n\u{1F449} 3 sets \xD7 10\u201312 reps\n\u{1F449} Tip: Neutral grip\n\n4\uFE0F\u20E3 Preacher Curl\n\u{1F449} 3 sets \xD7 10\u201312 reps\n\u{1F449} Tip: Strict form\n\n5\uFE0F\u20E3 Concentration Curl\n\u{1F449} 3 sets \xD7 10 reps each arm\n\u{1F449} Tip: Peak contraction\n\n\u{1F525} Focus: Peak + Thickness\n\u{1F4A7} Rest: 45\u201360 sec", nowIso()],
        ["/tricep", "\u{1F3CB}\uFE0F TRICEP WORKOUT (5 Exercises)\n\n1\uFE0F\u20E3 Tricep Pushdown\n\u{1F449} 4 sets \xD7 10\u201312 reps\n\u{1F449} Variation: Rope / Bar\n\u{1F449} Tip: Full extension\n\n2\uFE0F\u20E3 Dips\n\u{1F449} 3 sets \xD7 8\u201312 reps\n\u{1F449} Tip: Keep body upright\n\n3\uFE0F\u20E3 Skull Crushers\n\u{1F449} 3 sets \xD7 10\u201312 reps\n\u{1F449} Tip: Control movement\n\n4\uFE0F\u20E3 Overhead Extension\n\u{1F449} 3 sets \xD7 10\u201312 reps\n\u{1F449} Variation: Dumbbell / Cable\n\u{1F449} Tip: Stretch fully\n\n5\uFE0F\u20E3 Close Grip Bench Press\n\u{1F449} 3 sets \xD7 8\u201310 reps\n\u{1F449} Tip: Keep elbows close\n\n\u{1F525} Focus: Long head activation\n\u{1F4A7} Rest: 45\u201360 sec", nowIso()]
      ];
      for (const row of defaults) {
        await query(
          "INSERT INTO bot_commands (command, response, updatedAt) VALUES (?, ?, ?)",
          [row[0], row[1], sqlNow()]
        );
      }
      console.log("Default bot commands populated.");
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}
async function initDatabaseWithRetry() {
  const baseDelayMs = 3e3;
  const maxDelayMs = 3e4;
  let attempt = 0;
  for (; ; ) {
    attempt += 1;
    try {
      await ensureAuthSheets();
      console.log("Database schema verified.");
      return;
    } catch (error) {
      const delayMs = Math.min(maxDelayMs, baseDelayMs * attempt);
      const reason = error instanceof Error ? error.message : String(error);
      console.error(
        `Database init failed (attempt ${attempt}). API stays up; retrying in ${Math.round(delayMs / 1e3)}s. Cause: ${reason}`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
async function getUsers() {
  const now = Date.now();
  if (usersCache && now - usersCache.at < USERS_CACHE_TTL_MS) {
    return usersCache.data;
  }
  const rows = await query(
    "SELECT userId, email, passwordHash, displayName, role, isActive, createdAt, updatedAt, lastLoginAt, telegramChatId, telegramUsername, telegramLinkedAt, phoneNumber, address, goals FROM users"
  );
  const list = rows.map((row) => ({
    userId: row.userId,
    email: normalizeEmail(row.email || ""),
    passwordHash: row.passwordHash || "",
    displayName: row.displayName || "",
    role: row.role === "admin" ? "admin" : "user",
    isActive: row.isActive !== 0 && row.isActive !== false,
    createdAt: isoFromSql(row.createdAt) || nowIso(),
    updatedAt: isoFromSql(row.updatedAt) || nowIso(),
    lastLoginAt: isoFromSql(row.lastLoginAt),
    telegramChatId: row.telegramChatId ? normalizeChatId(row.telegramChatId) : "",
    telegramUsername: normalizeTelegramUsername(row.telegramUsername || ""),
    telegramLinkedAt: isoFromSql(row.telegramLinkedAt),
    phoneNumber: row.phoneNumber || "",
    address: row.address || "",
    goals: row.goals || ""
  })).filter((user) => Boolean(user.userId && user.email));
  usersCache = { at: now, data: list };
  return list;
}
async function insertUser(user) {
  await query(
    "INSERT INTO users (userId, email, passwordHash, displayName, role, isActive, createdAt, updatedAt, lastLoginAt, telegramChatId, telegramUsername, telegramLinkedAt, phoneNumber, address, goals) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      user.userId,
      user.email,
      user.passwordHash,
      user.displayName,
      user.role,
      user.isActive ? 1 : 0,
      sqlDt(user.createdAt) || sqlNow(),
      sqlDt(user.updatedAt) || sqlNow(),
      sqlDt(user.lastLoginAt),
      user.telegramChatId || null,
      user.telegramUsername || null,
      sqlDt(user.telegramLinkedAt),
      user.phoneNumber || null,
      user.address || null,
      user.goals || null
    ]
  );
  invalidateUsersCache();
}
async function persistUser(user) {
  await query(
    "UPDATE users SET email = ?, passwordHash = ?, displayName = ?, role = ?, isActive = ?, updatedAt = ?, lastLoginAt = ?, telegramChatId = ?, telegramUsername = ?, telegramLinkedAt = ?, phoneNumber = ?, address = ?, goals = ? WHERE userId = ?",
    [
      user.email,
      user.passwordHash,
      user.displayName,
      user.role,
      user.isActive ? 1 : 0,
      sqlDt(user.updatedAt) || sqlNow(),
      sqlDt(user.lastLoginAt),
      user.telegramChatId || null,
      user.telegramUsername || null,
      sqlDt(user.telegramLinkedAt),
      user.phoneNumber || null,
      user.address || null,
      user.goals || null,
      user.userId
    ]
  );
  invalidateUsersCache();
}
function checkTelegramLinkRate(chatId) {
  const now = Date.now();
  const current = telegramLinkRateMap.get(chatId);
  if (!current || now - current.firstAt > TELEGRAM_LINK_WINDOW_MS) {
    telegramLinkRateMap.set(chatId, { attempts: 1, firstAt: now });
    return { blocked: false };
  }
  current.attempts += 1;
  if (current.attempts > TELEGRAM_MAX_LINK_REQUESTS) {
    return { blocked: true };
  }
  return { blocked: false };
}
async function getSessions() {
  const now = Date.now();
  if (sessionsCache && now - sessionsCache.at < SESSIONS_CACHE_TTL_MS) {
    return sessionsCache.data;
  }
  const rows = await query(
    "SELECT sessionId, userId, tokenHash, expiresAt, createdAt, revokedAt, ip, userAgent FROM sessions"
  );
  const list = rows.map((row) => ({
    sessionId: row.sessionId,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: isoFromSql(row.expiresAt),
    createdAt: isoFromSql(row.createdAt),
    revokedAt: isoFromSql(row.revokedAt),
    ip: row.ip || "",
    userAgent: row.userAgent || ""
  })).filter((session) => Boolean(session.sessionId && session.tokenHash));
  sessionsCache = { at: now, data: list };
  return list;
}
async function logAuditEvent(userId, eventType, targetId, metadata) {
  await query(
    "INSERT INTO audit_log (eventId, userId, eventType, targetId, metadataJson, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [randomUUID(), userId || null, eventType, targetId || null, JSON.stringify(metadata ?? {}), sqlNow()]
  );
}
async function getWorkoutRecords() {
  const rows = await query(
    "SELECT userId, username, date, musclegroup, exercises, setsreps, notes FROM workouts ORDER BY date ASC, workoutId ASC"
  );
  return rows.map((row) => ({
    userId: row.userId || makeUserId(row.username || ""),
    username: row.username || "",
    date: toIsoDate(row.date),
    musclegroup: row.musclegroup || "",
    exercises: row.exercises || "",
    setsreps: row.setsreps || "",
    notes: row.notes || ""
  })).filter((entry) => Boolean(entry.date || entry.username));
}
async function insertWorkout(workout) {
  await query(
    "INSERT INTO workouts (userId, username, date, musclegroup, exercises, setsreps, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      makeUserId(workout.username),
      workout.username,
      workout.date,
      workout.muscleGroup,
      workout.exercises,
      workout.setsReps,
      workout.notes
    ]
  );
}
async function getActivityRecords(workouts) {
  const rows = await query(
    "SELECT userId, username, date, steps, distanceKm, calories, activeMinutes, notes FROM activity ORDER BY date ASC, activityId ASC"
  );
  const activityRows = rows.map((row) => ({
    userId: row.userId || makeUserId(row.username || ""),
    username: row.username || "",
    date: toIsoDate(row.date),
    steps: safeNumber(row.steps),
    distanceKm: safeNumber(row.distanceKm),
    calories: safeNumber(row.calories),
    activeMinutes: safeNumber(row.activeMinutes),
    notes: row.notes || ""
  })).filter((entry) => Boolean(entry.date));
  if (activityRows.length) return activityRows;
  const map = /* @__PURE__ */ new Map();
  workouts.forEach((workout) => {
    const key = `${workout.userId}:${workout.date}`;
    const current = map.get(key);
    if (!current) {
      map.set(key, {
        userId: workout.userId,
        username: workout.username,
        date: workout.date,
        steps: 0,
        distanceKm: 0,
        calories: 120,
        activeMinutes: 45,
        notes: "Derived from workout logs"
      });
      return;
    }
    current.calories += 80;
    current.activeMinutes += 20;
  });
  return Array.from(map.values());
}
async function getAttendanceRecords() {
  const rows = await query(
    "SELECT name, date, time, day, userId, chatId FROM attendance ORDER BY date ASC, attendanceId ASC"
  );
  return rows.map((row) => ({
    name: row.name || "",
    date: parseAttendanceDateToIso(row.date),
    time: row.time || "",
    day: row.day || "",
    userId: row.userId || "",
    chatId: row.chatId || ""
  })).filter((entry) => Boolean(entry.date));
}
async function hasAttendanceForDate(userId, isoDate) {
  if (!userId) return false;
  const rows = await query(
    "SELECT 1 FROM attendance WHERE userId = ? AND date = ? LIMIT 1",
    [userId, isoDate]
  );
  return rows.length > 0;
}
async function insertAttendance(record) {
  await query(
    "INSERT INTO attendance (name, date, time, day, userId, chatId) VALUES (?, ?, ?, ?, ?, ?)",
    [record.name, record.date, record.time, record.day, record.userId || null, record.chatId || null]
  );
}
async function getMotivationQuotes() {
  const rows = await query("SELECT quote, author, language FROM motivation_quotes");
  return rows.map((row) => {
    const quote = (row.quote || "").trim();
    const author = (row.author || "").trim();
    const language = (row.language || "").trim().toLowerCase();
    if (!quote || !SUPPORTED_QUOTE_LANGUAGES.has(language)) {
      return null;
    }
    return {
      quote,
      author,
      language
    };
  }).filter((entry) => Boolean(entry));
}
async function getGoalsRecords() {
  const rows = await query(
    "SELECT goalId, userId, username, goalName, period, stepsGoal, distanceGoalKm, caloriesGoal, activeMinutesGoal, description, targetValue, targetUnit, isActive, updatedAt FROM goals"
  );
  return rows.map((row) => ({
    goalId: row.goalId,
    userId: row.userId || (row.username ? makeUserId(row.username) : ""),
    username: row.username || "",
    goalName: row.goalName || "Untitled Goal",
    period: row.period === "weekly" ? "weekly" : "daily",
    stepsGoal: safeNumber(row.stepsGoal),
    distanceGoalKm: safeNumber(row.distanceGoalKm),
    caloriesGoal: safeNumber(row.caloriesGoal),
    activeMinutesGoal: safeNumber(row.activeMinutesGoal),
    description: row.description || "",
    targetValue: safeNumber(row.targetValue),
    targetUnit: row.targetUnit || "",
    isActive: row.isActive !== 0 && row.isActive !== false,
    updatedAt: isoFromSql(row.updatedAt) || nowIso()
  })).filter((goal) => Boolean(goal.userId && goal.goalId));
}
function defaultGoalForUser(userId, username) {
  const updatedAt = nowIso();
  return {
    rowIndex: -1,
    goalId: `${userId}-${updatedAt}`,
    userId,
    username,
    goalName: "Default Goal",
    period: "daily",
    stepsGoal: 8e3,
    distanceGoalKm: 5,
    caloriesGoal: 450,
    activeMinutesGoal: 45,
    description: "Daily fitness maintenance",
    targetValue: 0,
    targetUnit: "",
    isActive: true,
    updatedAt
  };
}
async function insertGoal(goal) {
  await query(
    "INSERT INTO goals (goalId, userId, username, goalName, period, stepsGoal, distanceGoalKm, caloriesGoal, activeMinutesGoal, description, targetValue, targetUnit, isActive, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      goal.goalId,
      goal.userId,
      goal.username,
      goal.goalName,
      goal.period,
      goal.stepsGoal,
      goal.distanceGoalKm,
      goal.caloriesGoal,
      goal.activeMinutesGoal,
      goal.description || null,
      goal.targetValue || 0,
      goal.targetUnit || null,
      goal.isActive ? 1 : 0,
      sqlDt(goal.updatedAt) || sqlNow()
    ]
  );
}
async function persistGoal(goal) {
  await query(
    "UPDATE goals SET userId = ?, username = ?, goalName = ?, period = ?, stepsGoal = ?, distanceGoalKm = ?, caloriesGoal = ?, activeMinutesGoal = ?, description = ?, targetValue = ?, targetUnit = ?, isActive = ?, updatedAt = ? WHERE goalId = ?",
    [
      goal.userId,
      goal.username,
      goal.goalName,
      goal.period,
      goal.stepsGoal,
      goal.distanceGoalKm,
      goal.caloriesGoal,
      goal.activeMinutesGoal,
      goal.description || null,
      goal.targetValue || 0,
      goal.targetUnit || null,
      goal.isActive ? 1 : 0,
      sqlDt(goal.updatedAt) || sqlNow(),
      goal.goalId
    ]
  );
}
async function deleteGoalById(goalId) {
  await query("DELETE FROM goals WHERE goalId = ?", [goalId]);
}
async function getBotCommands() {
  const rows = await query("SELECT command, response, updatedAt FROM bot_commands");
  return rows.map((row) => ({
    command: row.command,
    response: row.response || "",
    updatedAt: isoFromSql(row.updatedAt) || nowIso()
  })).filter((cmd) => Boolean(cmd.command));
}
const SESSIONS_CACHE_TTL_MS = 5e3;
const USERS_CACHE_TTL_MS = 5e3;
let sessionsCache = null;
let usersCache = null;
function invalidateSessionsCache() {
  sessionsCache = null;
}
function invalidateUsersCache() {
  usersCache = null;
}
const BOT_COMMANDS_CACHE_TTL_MS = 45e3;
let botCommandsCache = null;
function invalidateBotCommandsCache() {
  botCommandsCache = null;
}
async function getBotCommandsCached() {
  const now = Date.now();
  if (botCommandsCache && now - botCommandsCache.at < BOT_COMMANDS_CACHE_TTL_MS) {
    return botCommandsCache.commands;
  }
  const commands = await getBotCommands();
  botCommandsCache = { at: now, commands };
  return commands;
}
async function updateBotCommand(command, response) {
  await query(
    "INSERT INTO bot_commands (command, response, updatedAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE response = VALUES(response), updatedAt = VALUES(updatedAt)",
    [command, response, sqlNow()]
  );
  invalidateBotCommandsCache();
}
function toPublicGoal(goal) {
  const { rowIndex, ...publicGoal } = goal;
  return publicGoal;
}
const toSafeUser = (record) => ({
  userId: record.userId,
  email: record.email,
  displayName: record.displayName,
  role: record.role,
  phoneNumber: record.phoneNumber,
  address: record.address,
  goals: record.goals
});
function getAuthToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return "";
  return header.slice(7).trim();
}
function readClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "";
  }
  return req.socket.remoteAddress || "";
}
async function createSession(userId, req) {
  const sessionId = randomUUID();
  const tokenValue = randomBytes(32).toString("hex");
  const tokenHash = hashToken(tokenValue);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await query(
    "INSERT INTO sessions (sessionId, userId, tokenHash, expiresAt, createdAt, revokedAt, ip, userAgent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      sessionId,
      userId,
      tokenHash,
      sqlDt(expiresAt),
      sqlDt(createdAt),
      null,
      readClientIp(req),
      String(req.headers["user-agent"] || "")
    ]
  );
  invalidateSessionsCache();
  return { sessionId, tokenValue, expiresAt };
}
function applyLoginRateLimit(key) {
  const now = Date.now();
  const current = loginAttemptMap.get(key);
  if (!current) return { blocked: false };
  if (current.blockedUntil > now) {
    return { blocked: true, retryAfterSec: Math.ceil((current.blockedUntil - now) / 1e3) };
  }
  if (now - current.firstAt > LOGIN_WINDOW_MS) {
    loginAttemptMap.delete(key);
  }
  return { blocked: false };
}
function recordLoginFailure(key) {
  const now = Date.now();
  const current = loginAttemptMap.get(key);
  if (!current || now - current.firstAt > LOGIN_WINDOW_MS) {
    loginAttemptMap.set(key, { attempts: 1, firstAt: now, blockedUntil: 0 });
    return;
  }
  current.attempts += 1;
  if (current.attempts >= MAX_LOGIN_ATTEMPTS) {
    current.blockedUntil = now + LOGIN_WINDOW_MS;
  }
}
function clearLoginFailures(key) {
  loginAttemptMap.delete(key);
}
const requireAuth = async (req, res, next) => {
  try {
    if (!ensureSpreadsheetId(res)) return;
    const tokenValue = getAuthToken(req);
    if (!tokenValue) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const tokenHash = hashToken(tokenValue);
    const sessions = await getSessions();
    const session = sessions.find((entry) => entry.tokenHash === tokenHash);
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (session.revokedAt) {
      res.status(401).json({ error: "Session revoked" });
      return;
    }
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      res.status(401).json({ error: "Session expired" });
      return;
    }
    const users = await getUsers();
    const user = users.find((entry) => entry.userId === session.userId && entry.isActive);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.authUser = toSafeUser(user);
    req.authSessionToken = tokenValue;
    req.authSessionId = session.sessionId;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Failed to verify session" });
  }
};
const requireRole = (role) => (req, res, next) => {
  if (!req.authUser) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.authUser.role !== role) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};
function scopedUserId(req, userRaw) {
  const authUser = req.authUser;
  if (!authUser) return "all";
  if (authUser.role !== "admin") return authUser.userId;
  if (!userRaw || userRaw === "all") return "all";
  return makeUserId(userRaw);
}
function scopedUsername(req, userRaw) {
  const authUser = req.authUser;
  if (!authUser) return "";
  if (authUser.role !== "admin") return authUser.displayName;
  if (!userRaw || userRaw === "all") return "all";
  return userRaw;
}
function parseWorkoutManual(text, username) {
  const parts = text.split("-").map((value) => value.trim());
  return {
    username: normalizeUser(username),
    date: todayIsoDate(),
    muscleGroup: parts[0] || "Unknown",
    exercises: parts[1] || "Not specified",
    setsReps: parts[2] || "Not specified",
    notes: parts.slice(3).join(" - ") || "None"
  };
}
function normalizeTelegramBotCommand(rawCommand) {
  let s = rawCommand.toLowerCase().split("@")[0].trim();
  s = s.replace(/^[\uFF0F\u2044\u2215\u29F8]/, "/");
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
  s = s.replace(/[^\x00-\x7F]/g, "");
  if (!s.startsWith("/")) {
    const bare = ["start", "link", "verify", "unlink", "today", "in"];
    if (bare.includes(s)) s = `/${s}`;
  }
  return s;
}
function normalizeTelegramCommandLine(text) {
  let s = text.trim();
  s = s.replace(/^[\uFF0F\u2044\u2215\u29F8]/, "/");
  return s;
}
const TELEGRAM_DEBUG_COMMANDS = process.env.TELEGRAM_DEBUG_COMMANDS !== "0";
function charCodesPreview(s, maxChars = 12) {
  return [...s.slice(0, maxChars)].map((ch) => `${JSON.stringify(ch)}:${ch.charCodeAt(0)}`).join(" ");
}
function logTelegramCommandDebug(phase, payload) {
  if (!TELEGRAM_DEBUG_COMMANDS) return;
  console.log(`[tg-cmd] ${phase}`, JSON.stringify(payload, null, 2));
}
const TELEGRAM_BUILTIN_COMMANDS = /* @__PURE__ */ new Set([
  "/start",
  "/link",
  "/verify",
  "/unlink",
  "/in",
  "/today"
]);
function normalizeSheetStoredCommand(stored) {
  const t = stored.trim().toLowerCase().split("@")[0];
  const withSlash = t.startsWith("/") ? t : `/${t}`;
  return normalizeTelegramBotCommand(withSlash);
}
function findSheetBotCommand(normalizedCommand, sheetRows) {
  for (const row of sheetRows) {
    const key = normalizeSheetStoredCommand(row.command);
    if (TELEGRAM_BUILTIN_COMMANDS.has(key)) continue;
    if (key === normalizedCommand) return row;
  }
  return void 0;
}
function formatWorkoutCommandsSection(sheetRows) {
  const names = sheetRows.map((r) => normalizeSheetStoredCommand(r.command)).filter((cmd) => !TELEGRAM_BUILTIN_COMMANDS.has(cmd)).sort((a, b) => a.localeCompare(b));
  if (names.length === 0) return "\u2014";
  return names.map((c) => `\u2022 ${c}`).join("\n");
}
async function telegramBuiltinStart(ctx) {
  await ctx.bot.sendMessage(
    ctx.chatId,
    `Welcome to FitSheet Bot!

Link your account:
1) /link your-email@example.com
2) /verify 123456

Commands:
- /in or /today \u2014 Mark attendance
- /unlink \u2014 Remove link`
  );
}
async function telegramBuiltinLink(ctx) {
  const email = normalizeEmail(ctx.args.join(" "));
  if (!EMAIL_REGEX.test(email)) {
    await ctx.bot.sendMessage(ctx.chatId, "Invalid email format.");
    return;
  }
  try {
    const users = await getUsers();
    const user = users.find((u) => u.email === email && u.isActive);
    if (!user) {
      await ctx.bot.sendMessage(ctx.chatId, "No active account found.");
      return;
    }
    const code = generateOtpCode();
    telegramPendingLinks.set(ctx.chatIdText, {
      userId: user.userId,
      email: user.email,
      code,
      expiresAt: Date.now() + TELEGRAM_LINK_CODE_TTL_MS,
      attempts: 0
    });
    await ctx.bot.sendMessage(
      ctx.chatId,
      `Verification code: ${code}
Use /verify ${code}`
    );
  } catch {
    await ctx.bot.sendMessage(ctx.chatId, "Link failed.");
  }
}
async function telegramBuiltinVerify(ctx) {
  const code = (ctx.args[0] || "").trim();
  const pending = telegramPendingLinks.get(ctx.chatIdText);
  if (!pending) {
    await ctx.bot.sendMessage(ctx.chatId, "Run /link first.");
    return;
  }
  if (pending.code !== code) {
    await ctx.bot.sendMessage(ctx.chatId, "Invalid code.");
    return;
  }
  try {
    const users = await getUsers();
    const user = users.find((u) => u.userId === pending.userId);
    if (!user) {
      await ctx.bot.sendMessage(ctx.chatId, "User not found.");
      return;
    }
    const updatedUser = {
      ...user,
      telegramChatId: ctx.chatIdText,
      telegramUsername: ctx.telegramUsername,
      telegramLinkedAt: nowIso()
    };
    await persistUser(updatedUser);
    telegramPendingLinks.delete(ctx.chatIdText);
    await ctx.bot.sendMessage(ctx.chatId, "\u2705 Linked successfully!");
  } catch {
    await ctx.bot.sendMessage(ctx.chatId, "Verification failed.");
  }
}
async function telegramBuiltinUnlink(ctx) {
  try {
    const users = await getUsers();
    const user = users.find((u) => u.telegramChatId === ctx.chatIdText);
    if (!user) {
      await ctx.bot.sendMessage(ctx.chatId, "No linked account.");
      return;
    }
    const updatedUser = {
      ...user,
      telegramChatId: "",
      telegramUsername: "",
      telegramLinkedAt: ""
    };
    await persistUser(updatedUser);
    await ctx.bot.sendMessage(ctx.chatId, "Unlinked successfully.");
  } catch {
    await ctx.bot.sendMessage(ctx.chatId, "Unlink failed.");
  }
}
async function telegramBuiltinToday(ctx) {
  try {
    const users = await getUsers();
    const linkedUser = users.find(
      (u) => u.telegramChatId === ctx.chatIdText && u.isActive
    );
    if (!linkedUser) {
      await ctx.bot.sendMessage(
        ctx.chatId,
        "\u26A0\uFE0F Please link your account using /link"
      );
      return;
    }
    const name = linkedUser.displayName || ctx.msg.from?.first_name || "Unknown";
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toLocaleDateString("en-GB");
    const timeStr = now.toLocaleTimeString("en-GB");
    const dayStr = now.toLocaleDateString("en-US", { weekday: "long" });
    const isoToday = todayIsoDate();
    const alreadyMarked = await hasAttendanceForDate(linkedUser.userId, isoToday);
    const randomMotivation = MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)];
    let workoutCommandsBlock = "\u2014";
    try {
      const sheetCommands = await getBotCommandsCached();
      workoutCommandsBlock = formatWorkoutCommandsSection(sheetCommands);
    } catch {
    }
    if (alreadyMarked) {
      await ctx.bot.sendMessage(
        ctx.chatId,
        [
          "\u26A0\uFE0F You already marked attendance today.",
          "",
          `\u2728 ${randomMotivation}`,
          "",
          "\u{1F4CB} Workout commands (tap to send):",
          workoutCommandsBlock
        ].join("\n")
      );
      return;
    }
    await insertAttendance({
      name,
      date: isoToday,
      time: timeStr,
      day: dayStr,
      userId: linkedUser.userId,
      chatId: ctx.chatIdText
    });
    await ctx.bot.sendMessage(
      ctx.chatId,
      [
        "\u2705 Attendance recorded successfully!",
        "",
        `\u2728 ${randomMotivation}`,
        "",
        "\u{1F4CB} Workout commands (tap to send):",
        workoutCommandsBlock
      ].join("\n")
    );
  } catch (err) {
    console.error(err);
    await ctx.bot.sendMessage(ctx.chatId, "\u274C Failed to mark attendance.");
  }
}
async function dispatchTelegramBuiltinSlashCommand(ctx) {
  if (!TELEGRAM_BUILTIN_COMMANDS.has(ctx.command)) return false;
  logTelegramCommandDebug("branch", {
    messageId: ctx.msg.message_id,
    route: "builtin",
    command: ctx.command
  });
  switch (ctx.command) {
    case "/start":
      await telegramBuiltinStart(ctx);
      return true;
    case "/link":
      await telegramBuiltinLink(ctx);
      return true;
    case "/verify":
      await telegramBuiltinVerify(ctx);
      return true;
    case "/unlink":
      await telegramBuiltinUnlink(ctx);
      return true;
    case "/in":
    case "/today":
      await telegramBuiltinToday(ctx);
      return true;
    default:
      return false;
  }
}
async function dispatchTelegramSheetSlashCommand(ctx) {
  try {
    const sheetRows = await getBotCommandsCached();
    logTelegramCommandDebug("sheet_lookup", {
      messageId: ctx.msg.message_id,
      command: ctx.command,
      sheetCommandCount: sheetRows.length,
      sheetCommandsSample: sheetRows.slice(0, 15).map((c) => normalizeSheetStoredCommand(c.command))
    });
    const matched = findSheetBotCommand(ctx.command, sheetRows);
    if (!matched) return false;
    logTelegramCommandDebug("branch", {
      messageId: ctx.msg.message_id,
      route: "sheet",
      command: ctx.command,
      responseLength: matched.response?.length ?? 0
    });
    await ctx.bot.sendMessage(ctx.chatId, matched.response);
    return true;
  } catch (err) {
    console.error("[tg-cmd] Command fetch error:", err);
    return false;
  }
}
async function handleTelegramSlashCommand(ctx) {
  const isBuiltin = TELEGRAM_BUILTIN_COMMANDS.has(ctx.command);
  logTelegramCommandDebug("command_message", {
    phase: "parsed",
    messageId: ctx.msg.message_id,
    chatId: ctx.chatId,
    fromId: ctx.msg.from?.id,
    username: ctx.msg.from?.username ?? ctx.msg.from?.first_name,
    trimmedText: ctx.trimmedText,
    commandLine: ctx.commandLine,
    rawCommand: ctx.commandLine.split(/\s+/)[0],
    args: ctx.args,
    normalizedCommand: ctx.command,
    isBuiltin,
    charCodesHead: charCodesPreview(ctx.trimmedText),
    entities: ctx.msg.entities
  });
  if (await dispatchTelegramBuiltinSlashCommand(ctx)) return;
  if (await dispatchTelegramSheetSlashCommand(ctx)) return;
  logTelegramCommandDebug("branch", {
    messageId: ctx.msg.message_id,
    route: "unknown_command",
    command: ctx.command,
    reason: "not_builtin_and_not_in_sheet"
  });
  await ctx.bot.sendMessage(
    ctx.chatId,
    [
      "Unknown command.",
      "",
      "Built-in: /start, /link, /verify, /unlink, /in, /today",
      "( /in and /today both mark attendance )",
      "",
      "Other commands may come from your BotCommands sheet (e.g. /chest)."
    ].join("\n")
  );
}
const TELEGRAM_UPDATE_DEDUP_MS = 12e4;
const processedTelegramUpdates = /* @__PURE__ */ new Map();
function consumeTelegramUpdateIfNew(msg) {
  const key = `${msg.chat.id}:${msg.message_id}`;
  const now = Date.now();
  for (const [k, t] of processedTelegramUpdates) {
    if (now - t > TELEGRAM_UPDATE_DEDUP_MS) processedTelegramUpdates.delete(k);
  }
  if (processedTelegramUpdates.has(key)) return false;
  processedTelegramUpdates.set(key, now);
  return true;
}
if (bot) {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text) return;
    if (!consumeTelegramUpdateIfNew(msg)) {
      logTelegramCommandDebug("dedup_skip", {
        messageId: msg.message_id,
        chatId: msg.chat.id
      });
      return;
    }
    const trimmedText = text.trim();
    if (!trimmedText) return;
    const telegramUsername = normalizeTelegramUsername(
      msg.from?.username || msg.from?.first_name
    );
    const chatIdText = normalizeChatId(chatId);
    const commandLine = normalizeTelegramCommandLine(trimmedText);
    const looksSlashLike = trimmedText.startsWith("/") || /^[\uFF0F\u2044\u2215\u29F8]/.test(trimmedText.trim());
    if (commandLine.startsWith("/")) {
      const [rawCommand, ...args] = commandLine.split(/\s+/);
      const command = normalizeTelegramBotCommand(rawCommand);
      await handleTelegramSlashCommand({
        bot,
        msg,
        chatId,
        chatIdText,
        telegramUsername,
        command,
        args,
        commandLine,
        trimmedText
      });
      return;
    }
    if (looksSlashLike && !commandLine.startsWith("/")) {
      logTelegramCommandDebug("slash_mismatch", {
        messageId: msg.message_id,
        chatId,
        trimmedText,
        commandLine,
        charCodesHead: charCodesPreview(trimmedText),
        note: "Message looked like a slash command after trim but normalized line does not start with /"
      });
    }
    try {
      const users = await getUsers();
      const linkedUser = users.find((u) => u.telegramChatId === chatIdText);
      if (!linkedUser) {
        await bot.sendMessage(chatId, "Link account first using /link");
        return;
      }
      const workout = parseWorkoutManual(trimmedText, linkedUser.displayName);
      await insertWorkout(workout);
      await bot.sendMessage(
        chatId,
        `Logged ${workout.muscleGroup} workout \u{1F4AA}`
      );
    } catch (err) {
      console.error(err);
      await bot.sendMessage(chatId, "Workout log failed.");
    }
  });
}
app.use(express.json());
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.post("/api/auth/signup", async (req, res) => {
  console.log("Signup request:", req.body);
  if (!ensureSpreadsheetId(res)) return;
  const email = normalizeEmail(String(req.body?.email || ""));
  const password = String(req.body?.password || "");
  const displayName = normalizeUser(String(req.body?.displayName || ""));
  const phoneNumber = String(req.body?.phoneNumber || "").trim();
  const address = String(req.body?.address || "").trim();
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (!displayName) {
    return res.status(400).json({ error: "displayName is required" });
  }
  try {
    const users = await getUsers();
    if (users.some((user2) => user2.email === email)) {
      return res.status(409).json({ error: "Email already exists" });
    }
    const now = nowIso();
    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const role = users.length === 0 ? "admin" : "user";
    await insertUser({
      userId,
      email,
      passwordHash,
      displayName,
      role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      telegramChatId: "",
      telegramUsername: "",
      telegramLinkedAt: "",
      phoneNumber,
      address,
      goals: ""
    });
    const session = await createSession(userId, req);
    await logAuditEvent(userId, "signup", userId, { email, role });
    const user = { userId, email, displayName, role, phoneNumber, address, goals: "" };
    res.status(201).json({
      token: session.tokenValue,
      expiresAt: session.expiresAt,
      user
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to sign up user" });
  }
});
app.post("/api/auth/login", async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const email = normalizeEmail(String(req.body?.email || ""));
  const password = String(req.body?.password || "");
  const key = `${email}:${readClientIp(req)}`;
  const limit = applyLoginRateLimit(key);
  if (limit.blocked) {
    return res.status(429).json({ error: "Too many login attempts. Try again later.", retryAfterSec: limit.retryAfterSec });
  }
  if (!EMAIL_REGEX.test(email) || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const users = await getUsers();
    const user = users.find((entry) => entry.email === email && entry.isActive);
    if (!user) {
      recordLoginFailure(key);
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      recordLoginFailure(key);
      await logAuditEvent(user.userId, "login_failed", user.userId, { email });
      return res.status(401).json({ error: "Invalid email or password" });
    }
    clearLoginFailures(key);
    const now = nowIso();
    const updatedUser = {
      ...user,
      updatedAt: now,
      lastLoginAt: now
    };
    await persistUser(updatedUser);
    const session = await createSession(user.userId, req);
    await logAuditEvent(user.userId, "login_success", user.userId, { email });
    res.json({
      token: session.tokenValue,
      expiresAt: session.expiresAt,
      user: toSafeUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});
app.post("/api/auth/logout", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  if (!req.authSessionId || !req.authUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const sessions = await getSessions();
    const session = sessions.find((entry) => entry.sessionId === req.authSessionId);
    if (session) {
      await query("UPDATE sessions SET revokedAt = ? WHERE sessionId = ?", [sqlNow(), session.sessionId]);
      invalidateSessionsCache();
    }
    await logAuditEvent(req.authUser.userId, "logout", req.authUser.userId, {});
    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
});
app.get("/api/auth/me", requireAuth, async (req, res) => {
  if (!req.authUser) return res.status(401).json({ error: "Unauthorized" });
  res.json({ user: req.authUser });
});
app.get("/api/admin/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const users = await getUsers();
    res.json(
      users.map((entry) => ({
        userId: entry.userId,
        email: entry.email,
        displayName: entry.displayName,
        role: entry.role,
        isActive: entry.isActive,
        phoneNumber: entry.phoneNumber,
        address: entry.address,
        goals: entry.goals
      }))
    );
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
app.put("/api/admin/users/:userId", requireAuth, requireRole("admin"), async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const targetUserId = req.params.userId;
  if (!targetUserId) return res.status(400).json({ error: "userId is required" });
  try {
    const users = await getUsers();
    const user = users.find((u) => u.userId === targetUserId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { displayName, email, phoneNumber, address, goals } = req.body || {};
    const updatedUser = {
      ...user,
      displayName: typeof displayName === "string" ? normalizeUser(displayName) : user.displayName,
      email: typeof email === "string" ? normalizeEmail(email) : user.email,
      phoneNumber: typeof phoneNumber === "string" ? phoneNumber.trim() : user.phoneNumber,
      address: typeof address === "string" ? address.trim() : user.address,
      goals: typeof goals === "string" ? goals.trim() : user.goals,
      updatedAt: nowIso()
    };
    if (updatedUser.email !== user.email && !EMAIL_REGEX.test(updatedUser.email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    await persistUser(updatedUser);
    await logAuditEvent(req.authUser.userId, "admin_user_update", targetUserId, {
      updatedFields: { displayName: updatedUser.displayName, email: updatedUser.email, phoneNumber: updatedUser.phoneNumber, address: updatedUser.address, goals: updatedUser.goals }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});
app.get("/api/workouts", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  try {
    const workouts = await getWorkoutRecords();
    const userRaw = typeof req.query.user === "string" ? req.query.user : "all";
    const scopedId = scopedUserId(req, userRaw);
    const scopedName = scopedUsername(req, userRaw);
    const filtered = workouts.filter((entry) => {
      if (scopedId === "all") return true;
      return entry.userId === scopedId || entry.username === scopedName;
    });
    res.json(filtered);
  } catch (error) {
    console.error("Fetch Workouts Error:", error);
    res.status(500).json({ error: "Failed to fetch workouts" });
  }
});
app.get("/api/activity/daily", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const userRaw = typeof req.query.user === "string" ? req.query.user : "all";
  const rangeResult = parseDateRange(
    typeof req.query.from === "string" ? req.query.from : void 0,
    typeof req.query.to === "string" ? req.query.to : void 0
  );
  if ("error" in rangeResult) {
    return res.status(400).json({ error: rangeResult.error });
  }
  try {
    const workouts = await getWorkoutRecords();
    const activity = await getActivityRecords(workouts);
    const scopedId = scopedUserId(req, userRaw);
    const scopedName = scopedUsername(req, userRaw);
    const filtered = activity.filter((entry) => {
      const inRange = entry.date >= rangeResult.from && entry.date <= rangeResult.to;
      if (scopedId === "all") return inRange;
      return inRange && (entry.userId === scopedId || entry.username === scopedName);
    });
    res.json(filtered);
  } catch (error) {
    console.error("Fetch Activity Error:", error);
    res.status(500).json({ error: "Failed to fetch activity data" });
  }
});
app.get("/api/attendance", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const userRaw = typeof req.query.user === "string" ? req.query.user : "all";
  const fromRaw = typeof req.query.from === "string" ? req.query.from : void 0;
  const toRaw = typeof req.query.to === "string" ? req.query.to : void 0;
  const rangeResult = parseDateRange(fromRaw, toRaw);
  if ("error" in rangeResult) {
    return res.status(400).json({ error: rangeResult.error });
  }
  const hasExplicitTo = typeof toRaw === "string" && toRaw.trim() !== "";
  const rangeEnd = hasExplicitTo ? rangeResult.to : "9999-12-31";
  try {
    const records = await getAttendanceRecords();
    const scopedId = scopedUserId(req, userRaw);
    const scopedName = scopedUsername(req, userRaw);
    const filtered = records.filter((entry) => {
      const inRange = entry.date >= rangeResult.from && entry.date <= rangeEnd;
      if (scopedId === "all") return inRange;
      return inRange && (entry.userId === scopedId || entry.name === scopedName);
    });
    res.json(filtered);
  } catch (error) {
    console.error("Fetch Attendance Error:", error);
    res.status(500).json({ error: "Failed to fetch attendance data" });
  }
});
app.get("/api/motivation-quotes", requireAuth, async (_req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  try {
    const quotes = await getMotivationQuotes();
    res.json(quotes);
  } catch (error) {
    console.error("Fetch Motivation Quotes Error:", error);
    res.status(500).json({ error: "Failed to fetch motivation quotes" });
  }
});
app.get("/api/goals", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const userRaw = typeof req.query.user === "string" ? req.query.user : "all";
  try {
    const goals = await getGoalsRecords();
    const scopedId = scopedUserId(req, userRaw);
    const scopedName = scopedUsername(req, userRaw);
    const filtered = scopedId === "all" ? goals : goals.filter((goal) => goal.userId === scopedId || goal.username === scopedName);
    res.json(filtered.map(toPublicGoal));
  } catch (error) {
    console.error("Fetch Goals Error:", error);
    res.status(500).json({ error: "Failed to fetch goals data" });
  }
});
app.post("/api/goals", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  if (!req.authUser) return res.status(401).json({ error: "Unauthorized" });
  const { user, goalName, period, stepsGoal, distanceGoalKm, caloriesGoal, activeMinutesGoal, description, targetValue, targetUnit, isActive } = req.body || {};
  if (period !== "daily" && period !== "weekly") {
    return res.status(400).json({ error: "period must be daily or weekly" });
  }
  const parsedName = normalizeGoalName(goalName);
  if (!parsedName) {
    return res.status(400).json({ error: "goalName is required" });
  }
  const parsedGoals = [
    safeNumber(String(stepsGoal ?? "")),
    safeNumber(String(distanceGoalKm ?? "")),
    safeNumber(String(caloriesGoal ?? "")),
    safeNumber(String(activeMinutesGoal ?? ""))
  ];
  if (parsedGoals.some((value) => value < 0)) {
    return res.status(400).json({ error: "goal values must be >= 0" });
  }
  try {
    let targetUserId = req.authUser.userId;
    let targetUsername = req.authUser.displayName;
    if (req.authUser.role === "admin" && typeof user === "string" && user.trim()) {
      targetUsername = user.trim();
      targetUserId = makeUserId(targetUsername);
    }
    const createdGoal = {
      rowIndex: -1,
      goalId: randomUUID(),
      userId: targetUserId,
      username: targetUsername,
      goalName: parsedName,
      period,
      stepsGoal: parsedGoals[0],
      distanceGoalKm: parsedGoals[1],
      caloriesGoal: parsedGoals[2],
      activeMinutesGoal: parsedGoals[3],
      description: String(description || ""),
      targetValue: safeNumber(targetValue),
      targetUnit: String(targetUnit || ""),
      isActive: isActive === false ? false : true,
      updatedAt: nowIso()
    };
    await insertGoal(createdGoal);
    await logAuditEvent(req.authUser.userId, "goal_create", createdGoal.goalId, {
      userId: targetUserId,
      goalName: parsedName,
      period,
      stepsGoal: parsedGoals[0],
      distanceGoalKm: parsedGoals[1],
      caloriesGoal: parsedGoals[2],
      activeMinutesGoal: parsedGoals[3],
      isActive: createdGoal.isActive
    });
    res.status(201).json(toPublicGoal(createdGoal));
  } catch (error) {
    console.error("Create Goal Error:", error);
    res.status(500).json({ error: "Failed to save goals data" });
  }
});
app.put("/api/goals/:goalId", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  if (!req.authUser) return res.status(401).json({ error: "Unauthorized" });
  const goalId = req.params.goalId?.trim();
  if (!goalId) return res.status(400).json({ error: "goalId is required" });
  const { goalName, period, stepsGoal, distanceGoalKm, caloriesGoal, activeMinutesGoal, description, targetValue, targetUnit, isActive } = req.body || {};
  if (period !== "daily" && period !== "weekly") {
    return res.status(400).json({ error: "period must be daily or weekly" });
  }
  const parsedName = normalizeGoalName(goalName);
  if (!parsedName) {
    return res.status(400).json({ error: "goalName is required" });
  }
  const parsedGoals = [
    safeNumber(String(stepsGoal ?? "")),
    safeNumber(String(distanceGoalKm ?? "")),
    safeNumber(String(caloriesGoal ?? "")),
    safeNumber(String(activeMinutesGoal ?? ""))
  ];
  if (parsedGoals.some((value) => value < 0)) {
    return res.status(400).json({ error: "goal values must be >= 0" });
  }
  try {
    const goals = await getGoalsRecords();
    const existing = goals.find((entry) => entry.goalId === goalId);
    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }
    if (req.authUser.role !== "admin" && existing.userId !== req.authUser.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const updatedGoal = {
      ...existing,
      goalName: parsedName,
      period,
      stepsGoal: parsedGoals[0],
      distanceGoalKm: parsedGoals[1],
      caloriesGoal: parsedGoals[2],
      activeMinutesGoal: parsedGoals[3],
      description: typeof description === "string" ? description : existing.description,
      targetValue: targetValue !== void 0 ? safeNumber(targetValue) : existing.targetValue,
      targetUnit: typeof targetUnit === "string" ? targetUnit : existing.targetUnit,
      isActive: isActive === false ? false : true,
      updatedAt: nowIso()
    };
    await persistGoal(updatedGoal);
    await logAuditEvent(req.authUser.userId, "goal_update", updatedGoal.goalId, {
      userId: updatedGoal.userId,
      goalName: updatedGoal.goalName,
      period: updatedGoal.period,
      isActive: updatedGoal.isActive
    });
    res.json(toPublicGoal(updatedGoal));
  } catch (error) {
    console.error("Update Goal Error:", error);
    res.status(500).json({ error: "Failed to update goal" });
  }
});
app.delete("/api/goals/:goalId", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  if (!req.authUser) return res.status(401).json({ error: "Unauthorized" });
  const goalId = req.params.goalId?.trim();
  if (!goalId) return res.status(400).json({ error: "goalId is required" });
  try {
    const goals = await getGoalsRecords();
    const existing = goals.find((entry) => entry.goalId === goalId);
    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }
    if (req.authUser.role !== "admin" && existing.userId !== req.authUser.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    await deleteGoalById(goalId);
    await logAuditEvent(req.authUser.userId, "goal_delete", existing.goalId, {
      userId: existing.userId,
      goalName: existing.goalName
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete Goal Error:", error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});
app.get("/api/bot-commands", requireAuth, async (req, res) => {
  try {
    const commands = await getBotCommands();
    res.json(commands.map((c) => ({ command: c.command, response: c.response, updatedAt: c.updatedAt })));
  } catch (error) {
    console.error("Fetch Bot Commands Error:", error);
    res.status(500).json({ error: "Failed to fetch bot commands" });
  }
});
app.put("/api/bot-commands/:command", requireAuth, requireRole("admin"), async (req, res) => {
  const command = req.params.command;
  const { response } = req.body || {};
  if (!response) {
    return res.status(400).json({ error: "response is required" });
  }
  try {
    await updateBotCommand(command, response);
    await logAuditEvent(req.authUser.userId, "bot_command_update", command, { response });
    res.json({ success: true });
  } catch (error) {
    console.error("Update Bot Command Error:", error);
    res.status(500).json({ error: "Failed to update bot command" });
  }
});
app.get("/api/streaks", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const userRaw = typeof req.query.user === "string" ? req.query.user : "all";
  try {
    const scopedId = scopedUserId(req, userRaw);
    const scopedName = scopedUsername(req, userRaw);
    if (scopedId === "all") {
      return res.status(400).json({ error: "user query is required when requesting streaks as admin" });
    }
    const workouts = await getWorkoutRecords();
    const activity = (await getActivityRecords(workouts)).filter(
      (entry) => entry.userId === scopedId || entry.username === scopedName
    );
    const goalsForUser = (await getGoalsRecords()).filter(
      (goal) => goal.userId === scopedId || goal.username === scopedName
    );
    const defaultGoal = defaultGoalForUser(
      scopedId,
      scopedName === "all" ? req.authUser?.displayName || "" : scopedName
    );
    const activeGoals = goalsForUser.filter((goal) => goal.isActive);
    const goalsToEvaluate = activeGoals.length ? activeGoals : [defaultGoal];
    const byDate = /* @__PURE__ */ new Map();
    activity.forEach((entry) => {
      const existing = byDate.get(entry.date);
      if (!existing) {
        byDate.set(entry.date, { ...entry });
        return;
      }
      existing.steps += entry.steps;
      existing.distanceKm += entry.distanceKm;
      existing.calories += entry.calories;
      existing.activeMinutes += entry.activeMinutes;
    });
    const dates = Array.from(byDate.keys()).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let running = 0;
    dates.forEach((date) => {
      const record = byDate.get(date);
      if (!record) return;
      if (goalsToEvaluate.every((goal) => isGoalMet(record, goal))) {
        running += 1;
        longestStreak = Math.max(longestStreak, running);
      } else {
        running = 0;
      }
    });
    let probeDate = /* @__PURE__ */ new Date();
    for (let i = 0; i < 365; i += 1) {
      const key = probeDate.toISOString().slice(0, 10);
      const dayData = byDate.get(key);
      if (dayData && goalsToEvaluate.every((goal) => isGoalMet(dayData, goal))) {
        currentStreak += 1;
      } else {
        break;
      }
      probeDate.setUTCDate(probeDate.getUTCDate() - 1);
    }
    const todayData = byDate.get(todayIsoDate());
    const todayGoalMet = Boolean(todayData && goalsToEvaluate.every((goal) => isGoalMet(todayData, goal)));
    const goalStatuses = goalsToEvaluate.map((goal) => ({
      goalId: goal.goalId,
      goalName: goal.goalName,
      met: Boolean(todayData && isGoalMet(todayData, goal))
    }));
    const atRisk = !todayGoalMet;
    const dailyStatus = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, record]) => ({
      date,
      met: goalsToEvaluate.every((goal) => isGoalMet(record, goal))
    }));
    res.json({
      user: goalsToEvaluate[0]?.username || scopedName,
      goals: goalsToEvaluate.map(toPublicGoal),
      goalStatuses,
      currentStreak,
      longestStreak,
      atRisk,
      todayGoalMet,
      dailyStatus
    });
  } catch (error) {
    console.error("Fetch Streaks Error:", error);
    res.status(500).json({ error: "Failed to fetch streaks data" });
  }
});
async function startServer() {
  assertCriticalEnvForProduction();
  void initDatabaseWithRetry();
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: frontendRoot,
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: "API route not found", path: req.path });
      }
      return vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.join(frontendRoot, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
export {
  app,
  startServer
};
