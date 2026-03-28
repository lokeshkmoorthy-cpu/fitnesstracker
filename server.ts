import express from "express";
import path from "path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createServer as createViteServer } from "vite";
import TelegramBot from "node-telegram-bot-api";
import { google } from "googleapis";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      authUser?: SafeUser;
      authSessionToken?: string;
      authSessionId?: string;
    }
  }
}

const app = express();
const PORT = 3030;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 1000 * 60 * 15;
const TELEGRAM_LINK_CODE_TTL_MS = 1000 * 60 * 10;
const TELEGRAM_LINK_WINDOW_MS = 1000 * 60 * 10;
const TELEGRAM_MAX_LINK_REQUESTS = 3;
const TELEGRAM_MAX_VERIFY_ATTEMPTS = 5;
const WORKOUTS_RANGE = "Workouts!A:F";
const ACTIVITY_RANGE = "Activity!A:H";
const GOALS_SHEET = "Goals";
const GOALS_RANGE = `${GOALS_SHEET}!A:K`;
const USERS_SHEET = "Users";
const SESSIONS_SHEET = "Sessions";
const AUDIT_SHEET = "AuditLog";
const BOT_COMMANDS_SHEET = "BotCommands";
const BOT_COMMANDS_RANGE = `${BOT_COMMANDS_SHEET}!A:C`;

interface WorkoutRecord {
  userId: string;
  username: string;
  date: string;
  musclegroup: string;
  exercises: string;
  setsreps: string;
  notes: string;
}

interface ActivityDailyRecord {
  userId: string;
  username: string;
  date: string;
  steps: number;
  distanceKm: number;
  calories: number;
  activeMinutes: number;
  notes: string;
}

interface GoalsRecord {
  rowIndex: number;
  goalId: string;
  userId: string;
  username: string;
  goalName: string;
  period: "daily" | "weekly";
  stepsGoal: number;
  distanceGoalKm: number;
  caloriesGoal: number;
  activeMinutesGoal: number;
  isActive: boolean;
  updatedAt: string;
}

interface UserRecord {
  rowIndex: number;
  userId: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  telegramChatId: string;
  telegramUsername: string;
  telegramLinkedAt: string;
}

interface SessionRecord {
  rowIndex: number;
  sessionId: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string;
  ip: string;
  userAgent: string;
}

interface BotCommandRecord {
  rowIndex: number;
  command: string;
  response: string;
  updatedAt: string;
}

interface SafeUser {
  userId: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
}

type Role = "user" | "admin";

const loginAttemptMap = new Map<string, { attempts: number; firstAt: number; blockedUntil: number }>();
const telegramLinkRateMap = new Map<string, { attempts: number; firstAt: number }>();
const telegramPendingLinks = new Map<
  string,
  { userId: string; email: string; code: string; expiresAt: number; attempts: number }
>();

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;
if (token) {
  bot = new TelegramBot(token, { polling: true });
  console.log("Telegram bot initialized (polling mode)");
} else {
  console.warn("TELEGRAM_BOT_TOKEN not found. Bot functionality disabled.");
}

const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/\s/g, "").replace(/_/g, "");
const safeNumber = (value: string | undefined) => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
};
const toIsoDate = (value?: string) => {
  if (!value) return "";
  if (DATE_REGEX.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};
const todayIsoDate = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();
const normalizeUser = (value: string) => value.trim();
const makeUserId = (username: string) =>
  normalizeUser(username || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "_");
const hashToken = (tokenValue: string) =>
  createHash("sha256").update(tokenValue).digest("hex");
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizeGoalName = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};
const normalizeChatId = (chatId: string | number) => String(chatId).trim();
const normalizeTelegramUsername = (value: string | undefined) => (value || "").trim();
const generateOtpCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const ensureSpreadsheetId = (res: express.Response) => {
  if (!SPREADSHEET_ID) {
    res.status(500).json({ error: "GOOGLE_SHEET_ID not configured" });
    return false;
  }
  return true;
};

const parseDateRange = (
  fromRaw: string | undefined,
  toRaw: string | undefined
): { from: string; to: string } | { error: string } => {
  const from = toIsoDate(fromRaw) || "1970-01-01";
  const to = toIsoDate(toRaw) || todayIsoDate();
  if (from > to) return { error: "Invalid range: from must be <= to" };
  return { from, to };
};

const isGoalMet = (activity: ActivityDailyRecord, goal: GoalsRecord) => {
  const checks = [
    goal.stepsGoal > 0 ? activity.steps >= goal.stepsGoal : true,
    goal.distanceGoalKm > 0 ? activity.distanceKm >= goal.distanceGoalKm : true,
    goal.caloriesGoal > 0 ? activity.calories >= goal.caloriesGoal : true,
    goal.activeMinutesGoal > 0 ? activity.activeMinutes >= goal.activeMinutesGoal : true,
  ];
  return checks.every(Boolean);
};

async function readSheetRows(range: string) {
  if (!SPREADSHEET_ID) return [];
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return response.data.values || [];
}

async function appendSheetRow(range: string, row: Array<string | number>) {
  if (!SPREADSHEET_ID) return;
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

async function updateSheetRow(range: string, row: Array<string | number>) {
  if (!SPREADSHEET_ID) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

function mapRows<T>(
  rows: string[][],
  fallbackHeaders: string[],
  mapper: (row: string[], headers: string[], rowIndex: number) => T
): T[] {
  if (!rows.length) return [];
  const firstRow = rows[0].map(normalizeHeader);
  const isHeaderRow = firstRow.some((header) => fallbackHeaders.includes(header));
  const headers = isHeaderRow ? firstRow : fallbackHeaders;
  const dataRows = isHeaderRow ? rows.slice(1) : rows;
  const startRow = isHeaderRow ? 2 : 1;
  return dataRows.map((row, index) => mapper(row, headers, startRow + index));
}

async function ensureSheetWithHeaders(title: string, headers: string[]) {
  if (!SPREADSHEET_ID) return;
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets(properties(title))",
  });
  const existingTitles = new Set(
    (meta.data.sheets || []).map((sheet) => sheet.properties?.title).filter(Boolean)
  );

  if (!existingTitles.has(title)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title } } }],
      },
    });
  }

  const firstRow = await readSheetRows(`${title}!1:1`);
  if (!firstRow.length || firstRow[0].length === 0) {
    await updateSheetRow(`${title}!1:1`, headers);
    return;
  }

  const current = [...firstRow[0]];
  const normalizedCurrent = current.map(normalizeHeader);
  let needsUpdate = false;
  headers.forEach((header, index) => {
    const normalizedHeader = normalizeHeader(header);
    const exists = normalizedCurrent.includes(normalizedHeader);
    if (exists) return;
    if (!current[index]) {
      current[index] = header;
      needsUpdate = true;
      return;
    }
    current.push(header);
    needsUpdate = true;
  });

  if (needsUpdate) {
    await updateSheetRow(`${title}!1:1`, current);
  }
}

async function ensureAuthSheets() {
  try {
    console.log("Checking sheets...");
    await ensureSheetWithHeaders(USERS_SHEET, [
      "userId",
      "email",
      "passwordHash",
      "displayName",
      "role",
      "isActive",
      "createdAt",
      "updatedAt",
      "lastLoginAt",
      "telegramChatId",
      "telegramUsername",
      "telegramLinkedAt",
    ]);
    await ensureSheetWithHeaders(SESSIONS_SHEET, [
      "sessionId",
      "userId",
      "tokenHash",
      "expiresAt",
      "createdAt",
      "revokedAt",
      "ip",
      "userAgent",
    ]);
    await ensureSheetWithHeaders(AUDIT_SHEET, [
      "eventId",
      "userId",
      "eventType",
      "targetId",
      "metadataJson",
      "createdAt",
    ]);
    await ensureSheetWithHeaders(GOALS_SHEET, [
      "userId",
      "username",
      "goalId",
      "goalName",
      "period",
      "stepsGoal",
      "distanceGoalKm",
      "caloriesGoal",
      "activeMinutesGoal",
      "isactive",
      "updatedat",
    ]);
    console.log("Ensuring BotCommands sheet...");
    await ensureSheetWithHeaders(BOT_COMMANDS_SHEET, ["command", "response", "updatedAt"]);
    console.log("Fetching existing bot commands...");
    const existingCommands = await getBotCommands();
    if (existingCommands.length === 0) {
      console.log("Populating default bot commands...");
      const defaults = [
        ["/chest", "🏋️ CHEST WORKOUT (5 Exercises)\n\n1️⃣ Bench Press\n👉 4 sets × 8–12 reps\n👉 Variation: Incline / Decline\n👉 Tip: Keep your feet planted and control the bar\n\n2️⃣ Push-Ups\n👉 3 sets × 12–20 reps\n👉 Variation: Wide / Diamond\n👉 Tip: Keep body straight, don’t sag hips\n\n3️⃣ Dumbbell Fly\n👉 3 sets × 10–15 reps\n👉 Variation: Incline Fly\n👉 Tip: Slight bend in elbows, stretch chest fully\n\n4️⃣ Chest Dips\n👉 3 sets × 8–12 reps\n👉 Variation: Weighted dips\n👉 Tip: Lean forward to target chest\n\n5️⃣ Cable Crossover\n👉 3 sets × 12–15 reps\n👉 Variation: High to Low / Low to High\n👉 Tip: Squeeze chest at the center\n\n🔥 Focus: Form > Weight\n💧 Rest: 60–90 sec between sets", nowIso()],
        ["/shoulder", "🏋️ SHOULDER WORKOUT (5 Exercises)\n\n1️⃣ Overhead Press\n👉 4 sets × 8–12 reps\n👉 Variation: Dumbbell / Barbell\n👉 Tip: Keep core tight, avoid arching back\n\n2️⃣ Lateral Raises\n👉 3 sets × 12–15 reps\n👉 Variation: Single-arm / Cable\n👉 Tip: Lift to shoulder level, slow control\n\n3️⃣ Front Raises\n👉 3 sets × 10–12 reps\n👉 Variation: Plate / Dumbbell\n👉 Tip: Don’t swing the weight\n\n4️⃣ Rear Delt Fly\n👉 3 sets × 12–15 reps\n👉 Variation: Machine / Bent-over\n👉 Tip: Focus on rear shoulder squeeze\n\n5️⃣ Arnold Press\n👉 3 sets × 8–10 reps\n👉 Tip: Rotate wrists during press\n\n🔥 Focus: Full shoulder development\n💧 Rest: 60–90 sec", nowIso()],
        ["/lat", "🏋️ LAT / BACK WORKOUT (5 Exercises)\n\n1️⃣ Pull-Ups\n👉 4 sets × 6–10 reps\n👉 Variation: Wide / Close grip\n👉 Tip: Full stretch & pull\n\n2️⃣ Lat Pulldown\n👉 3 sets × 10–12 reps\n👉 Variation: Wide / Reverse grip\n👉 Tip: Pull to chest, not neck\n\n3️⃣ Seated Row\n👉 3 sets × 10–12 reps\n👉 Variation: Cable / Machine\n👉 Tip: Squeeze shoulder blades\n\n4️⃣ One-arm Dumbbell Row\n👉 3 sets × 10 reps each side\n👉 Tip: Keep back straight\n\n5️⃣ Straight Arm Pulldown\n👉 3 sets × 12–15 reps\n👉 Tip: Focus on lat stretch\n\n🔥 Focus: Width + Thickness\n💧 Rest: 60–90 sec", nowIso()],
        ["/legs", "🏋️ LEG WORKOUT (5 Exercises)\n\n1️⃣ Squats\n👉 4 sets × 8–12 reps\n👉 Variation: Front / Back squat\n👉 Tip: Keep chest up\n\n2️⃣ Leg Press\n👉 3 sets × 10–15 reps\n👉 Tip: Don’t lock knees\n\n3️⃣ Lunges\n👉 3 sets × 10 each leg\n👉 Variation: Walking / Static\n👉 Tip: Control balance\n\n4️⃣ Leg Curl\n👉 3 sets × 12–15 reps\n👉 Tip: Slow eccentric\n\n5️⃣ Calf Raises\n👉 4 sets × 15–20 reps\n👉 Tip: Full stretch + squeeze\n\n🔥 Focus: Strength + Stability\n💧 Rest: 60–120 sec", nowIso()],
        ["/bicep", "🏋️ BICEP WORKOUT (5 Exercises)\n\n1️⃣ Barbell Curl\n👉 4 sets × 8–12 reps\n👉 Tip: Don’t swing\n\n2️⃣ Dumbbell Curl\n👉 3 sets × 10–12 reps\n👉 Variation: Alternate\n👉 Tip: Full stretch\n\n3️⃣ Hammer Curl\n👉 3 sets × 10–12 reps\n👉 Tip: Neutral grip\n\n4️⃣ Preacher Curl\n👉 3 sets × 10–12 reps\n👉 Tip: Strict form\n\n5️⃣ Concentration Curl\n👉 3 sets × 10 reps each arm\n👉 Tip: Peak contraction\n\n🔥 Focus: Peak + Thickness\n💧 Rest: 45–60 sec", nowIso()],
        ["/tricep", "🏋️ TRICEP WORKOUT (5 Exercises)\n\n1️⃣ Tricep Pushdown\n👉 4 sets × 10–12 reps\n👉 Variation: Rope / Bar\n👉 Tip: Full extension\n\n2️⃣ Dips\n👉 3 sets × 8–12 reps\n👉 Tip: Keep body upright\n\n3️⃣ Skull Crushers\n👉 3 sets × 10–12 reps\n👉 Tip: Control movement\n\n4️⃣ Overhead Extension\n👉 3 sets × 10–12 reps\n👉 Variation: Dumbbell / Cable\n👉 Tip: Stretch fully\n\n5️⃣ Close Grip Bench Press\n👉 3 sets × 8–10 reps\n👉 Tip: Keep elbows close\n\n🔥 Focus: Long head activation\n💧 Rest: 45–60 sec", nowIso()],
      ];
      for (const row of defaults) {
        await appendSheetRow(BOT_COMMANDS_RANGE, row);
      }
      console.log("Default bot commands populated.");
    }
  } catch (error) {
    console.error("FATAL: Failed to ensure auth sheets:", error);
    process.exit(1);
  }
}

async function getUsers(): Promise<UserRecord[]> {
  const rows = await readSheetRows(`${USERS_SHEET}!A:L`);
  const headers = [
    "userid",
    "email",
    "passwordhash",
    "displayname",
    "role",
    "isactive",
    "createdat",
    "updatedat",
    "lastloginat",
    "telegramchatid",
    "telegramusername",
    "telegramlinkedat",
  ];
  return mapRows(rows, headers, (row, actualHeaders, rowIndex) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    const getWithFallbackIndex = (name: string, fallbackIndex: number) => {
      const value = get(name);
      if (value) return value;
      return row[fallbackIndex] || "";
    };
    const roleValue = get("role");
    const role: Role = roleValue === "admin" ? "admin" : "user";
    return {
      rowIndex,
      userId: get("userid"),
      email: normalizeEmail(get("email")),
      passwordHash: get("passwordhash"),
      displayName: get("displayname"),
      role,
      isActive: get("isactive") !== "false",
      createdAt: get("createdat") || nowIso(),
      updatedAt: get("updatedat") || nowIso(),
      lastLoginAt: get("lastloginat"),
      telegramChatId: normalizeChatId(getWithFallbackIndex("telegramchatid", 9)),
      telegramUsername: normalizeTelegramUsername(getWithFallbackIndex("telegramusername", 10)),
      telegramLinkedAt: getWithFallbackIndex("telegramlinkedat", 11),
    };
  }).filter((user) => Boolean(user.userId && user.email));
}

function serializeUserRow(user: UserRecord): Array<string | number> {
  return [
    user.userId,
    user.email,
    user.passwordHash,
    user.displayName,
    user.role,
    user.isActive ? "true" : "false",
    user.createdAt,
    user.updatedAt,
    user.lastLoginAt,
    user.telegramChatId,
    user.telegramUsername,
    user.telegramLinkedAt,
  ];
}

function checkTelegramLinkRate(chatId: string) {
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

async function getSessions(): Promise<SessionRecord[]> {
  const rows = await readSheetRows(`${SESSIONS_SHEET}!A:H`);
  const headers = [
    "sessionid",
    "userid",
    "tokenhash",
    "expiresat",
    "createdat",
    "revokedat",
    "ip",
    "useragent",
  ];
  return mapRows(rows, headers, (row, actualHeaders, rowIndex) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    return {
      rowIndex,
      sessionId: get("sessionid"),
      userId: get("userid"),
      tokenHash: get("tokenhash"),
      expiresAt: get("expiresat"),
      createdAt: get("createdat"),
      revokedAt: get("revokedat"),
      ip: get("ip"),
      userAgent: get("useragent"),
    };
  }).filter((session) => Boolean(session.sessionId && session.tokenHash));
}

async function logAuditEvent(
  userId: string,
  eventType: string,
  targetId: string,
  metadata: Record<string, unknown>
) {
  await appendSheetRow(`${AUDIT_SHEET}!A:F`, [
    randomUUID(),
    userId,
    eventType,
    targetId,
    JSON.stringify(metadata),
    nowIso(),
  ]);
}

async function getWorkoutRecords(): Promise<WorkoutRecord[]> {
  const rows = await readSheetRows(WORKOUTS_RANGE);
  const headers = ["username", "date", "musclegroup", "exercises", "setsreps", "notes"];
  return mapRows(rows, headers, (row, actualHeaders) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    const username = get("username");
    return {
      userId: makeUserId(username),
      username,
      date: toIsoDate(get("date")),
      musclegroup: get("musclegroup"),
      exercises: get("exercises"),
      setsreps: get("setsreps"),
      notes: get("notes"),
    };
  }).filter((entry) => Boolean(entry.date || entry.username));
}

async function getActivityRecords(workouts: WorkoutRecord[]): Promise<ActivityDailyRecord[]> {
  const rows = await readSheetRows(ACTIVITY_RANGE);
  const headers = [
    "userid",
    "username",
    "date",
    "steps",
    "distancekm",
    "calories",
    "activeminutes",
    "notes",
  ];
  const activityRows = mapRows(rows, headers, (row, actualHeaders) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    const username = get("username");
    return {
      userId: get("userid") || makeUserId(username),
      username,
      date: toIsoDate(get("date")),
      steps: safeNumber(get("steps")),
      distanceKm: safeNumber(get("distancekm")),
      calories: safeNumber(get("calories")),
      activeMinutes: safeNumber(get("activeminutes")),
      notes: get("notes"),
    };
  }).filter((entry) => Boolean(entry.date));

  if (activityRows.length) return activityRows;

  const map = new Map<string, ActivityDailyRecord>();
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
        notes: "Derived from workout logs",
      });
      return;
    }
    current.calories += 80;
    current.activeMinutes += 20;
  });
  return Array.from(map.values());
}

async function getGoalsRecords(): Promise<GoalsRecord[]> {
  const rows = await readSheetRows(GOALS_RANGE);
  const headers = [
    "userid",
    "username",
    "goalid",
    "goalname",
    "period",
    "stepsgoal",
    "distancegoalkm",
    "caloriesgoal",
    "activeminutesgoal",
    "isactive",
    "updatedat",
  ];
  return mapRows(rows, headers, (row, actualHeaders, rowIndex) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    const username = get("username");
    const userId = get("userid") || (username ? makeUserId(username) : "");
    const periodValue = get("period");
    const legacyPeriod = row[2] === "weekly" ? "weekly" : row[2] === "daily" ? "daily" : "";
    const period: GoalsRecord["period"] =
      periodValue === "weekly" || periodValue === "daily"
        ? periodValue
        : legacyPeriod === "weekly"
          ? "weekly"
          : "daily";
    const updatedAt = get("updatedat") || row[7] || nowIso();
    const goalId = get("goalid") || (userId ? `${userId}-${updatedAt}` : "");
    const goalName = get("goalname") || "Untitled Goal";
    const isActiveRaw = get("isactive") || row[8] || "true";
    return {
      rowIndex,
      goalId,
      userId,
      username,
      goalName,
      period,
      stepsGoal: safeNumber(get("stepsgoal")),
      distanceGoalKm: safeNumber(get("distancegoalkm")),
      caloriesGoal: safeNumber(get("caloriesgoal")),
      activeMinutesGoal: safeNumber(get("activeminutesgoal")),
      isActive: isActiveRaw !== "false",
      updatedAt,
    };
  }).filter((goal) => Boolean(goal.userId && goal.goalId));
}

function defaultGoalForUser(userId: string, username: string): GoalsRecord {
  const updatedAt = nowIso();
  return {
    rowIndex: -1,
    goalId: `${userId}-${updatedAt}`,
    userId,
    username,
    goalName: "Default Goal",
    period: "daily",
    stepsGoal: 8000,
    distanceGoalKm: 5,
    caloriesGoal: 450,
    activeMinutesGoal: 45,
    isActive: true,
    updatedAt,
  };
}

function serializeGoalRow(goal: GoalsRecord): Array<string | number> {
  return [
    goal.userId,
    goal.username,
    goal.goalId,
    goal.goalName,
    goal.period,
    goal.stepsGoal,
    goal.distanceGoalKm,
    goal.caloriesGoal,
    goal.activeMinutesGoal,
    goal.isActive ? "true" : "false",
    goal.updatedAt,
  ];
}

async function getBotCommands(): Promise<BotCommandRecord[]> {
  const rows = await readSheetRows(BOT_COMMANDS_RANGE);
  const headers = ["command", "response", "updatedat"];
  return mapRows(rows, headers, (row, actualHeaders, rowIndex) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    return {
      rowIndex,
      command: get("command"),
      response: get("response"),
      updatedAt: get("updatedat") || nowIso(),
    };
  }).filter((cmd) => Boolean(cmd.command));
}

function serializeBotCommandRow(cmd: BotCommandRecord): Array<string | number> {
  return [cmd.command, cmd.response, cmd.updatedAt];
}

async function updateBotCommand(command: string, response: string) {
  const commands = await getBotCommands();
  const existing = commands.find((c) => c.command.toLowerCase() === command.toLowerCase());
  const now = nowIso();
  if (existing) {
    const updated: BotCommandRecord = {
      ...existing,
      response,
      updatedAt: now,
    };
    await updateSheetRow(
      `${BOT_COMMANDS_SHEET}!A${existing.rowIndex}:C${existing.rowIndex}`,
      serializeBotCommandRow(updated)
    );
  } else {
    await appendSheetRow(`${BOT_COMMANDS_SHEET}!A:C`, [command, response, now]);
  }
}

function toPublicGoal(goal: GoalsRecord) {
  const { rowIndex, ...publicGoal } = goal;
  return publicGoal;
}

const toSafeUser = (record: UserRecord): SafeUser => ({
  userId: record.userId,
  email: record.email,
  displayName: record.displayName,
  role: record.role,
});

function getAuthToken(req: express.Request) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return "";
  return header.slice(7).trim();
}

function readClientIp(req: express.Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "";
  }
  return req.socket.remoteAddress || "";
}

async function createSession(userId: string, req: express.Request) {
  const sessionId = randomUUID();
  const tokenValue = randomBytes(32).toString("hex");
  const tokenHash = hashToken(tokenValue);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await appendSheetRow(`${SESSIONS_SHEET}!A:H`, [
    sessionId,
    userId,
    tokenHash,
    expiresAt,
    createdAt,
    "",
    readClientIp(req),
    String(req.headers["user-agent"] || ""),
  ]);
  return { sessionId, tokenValue, expiresAt };
}

function applyLoginRateLimit(key: string) {
  const now = Date.now();
  const current = loginAttemptMap.get(key);
  if (!current) return { blocked: false };
  if (current.blockedUntil > now) {
    return { blocked: true, retryAfterSec: Math.ceil((current.blockedUntil - now) / 1000) };
  }
  if (now - current.firstAt > LOGIN_WINDOW_MS) {
    loginAttemptMap.delete(key);
  }
  return { blocked: false };
}

function recordLoginFailure(key: string) {
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

function clearLoginFailures(key: string) {
  loginAttemptMap.delete(key);
}

const requireAuth: express.RequestHandler = async (req, res, next) => {
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

const requireRole =
  (role: Role): express.RequestHandler =>
  (req, res, next) => {
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

function scopedUserId(req: express.Request, userRaw: string | undefined) {
  const authUser = req.authUser;
  if (!authUser) return "all";
  if (authUser.role !== "admin") return authUser.userId;
  if (!userRaw || userRaw === "all") return "all";
  return makeUserId(userRaw);
}

function scopedUsername(req: express.Request, userRaw: string | undefined) {
  const authUser = req.authUser;
  if (!authUser) return "";
  if (authUser.role !== "admin") return authUser.displayName;
  if (!userRaw || userRaw === "all") return "all";
  return userRaw;
}

function parseWorkoutManual(text: string, username: string) {
  const parts = text.split("-").map((value) => value.trim());
  return {
    username: normalizeUser(username),
    date: todayIsoDate(),
    muscleGroup: parts[0] || "Unknown",
    exercises: parts[1] || "Not specified",
    setsReps: parts[2] || "Not specified",
    notes: parts.slice(3).join(" - ") || "None",
  };
}

if (bot) {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const telegramUsername = normalizeTelegramUsername(msg.from?.username || msg.from?.first_name);
    const chatIdText = normalizeChatId(chatId);
    if (!text) return;
    const trimmedText = text.trim();
    if (!trimmedText) return;

    if (trimmedText.startsWith("/")) {
      const [rawCommand, ...args] = trimmedText.split(/\s+/);
      const command = rawCommand.toLowerCase();

      if (command === "/start") {
        bot?.sendMessage(
          chatId,
          "Welcome to FitSheet Bot!\n\nLink your account first:\n1) /link your-email@example.com\n2) /verify 123456\n\nThen log workouts using:\nMuscle Group - Exercises - Sets/Reps"
        );
        return;
      }

      const botCommands = await getBotCommands();
      const matched = botCommands.find((c) => c.command.toLowerCase() === command);
      if (matched) {
        bot?.sendMessage(chatId, matched.response);
        return;
      }

      if (command === "/link") {
        const email = normalizeEmail(args.join(" "));
        if (!EMAIL_REGEX.test(email)) {
          bot?.sendMessage(chatId, "Invalid email format. Use: /link your-email@example.com");
          return;
        }
        const rate = checkTelegramLinkRate(chatIdText);
        if (rate.blocked) {
          bot?.sendMessage(chatId, "Too many link attempts. Please wait a few minutes and try again.");
          return;
        }
        try {
          const users = await getUsers();
          const user = users.find((entry) => entry.email === email && entry.isActive);
          if (!user) {
            bot?.sendMessage(chatId, "No active account found for this email.");
            return;
          }
          if (user.telegramChatId && user.telegramChatId !== chatIdText) {
            bot?.sendMessage(
              chatId,
              "This account is already linked to another Telegram chat. Use /unlink from that chat first."
            );
            return;
          }
          const linkedElsewhere = users.find(
            (entry) => entry.telegramChatId === chatIdText && entry.userId !== user.userId && entry.isActive
          );
          if (linkedElsewhere) {
            bot?.sendMessage(
              chatId,
              `This Telegram chat is linked to another account (${linkedElsewhere.email}). Use /unlink first.`
            );
            return;
          }
          const code = generateOtpCode();
          telegramPendingLinks.set(chatIdText, {
            userId: user.userId,
            email: user.email,
            code,
            expiresAt: Date.now() + TELEGRAM_LINK_CODE_TTL_MS,
            attempts: 0,
          });
          await logAuditEvent(user.userId, "telegram_link_code_sent", user.userId, {
            chatId: chatIdText,
            telegramUsername,
          });
          bot?.sendMessage(
            chatId,
            `Verification code: ${code}\nUse /verify ${code} within 10 minutes to link this Telegram chat.`
          );
        } catch (error) {
          console.error("Telegram link request error:", error);
          bot?.sendMessage(chatId, "Failed to start account linking. Please try again.");
        }
        return;
      }

      if (command === "/verify") {
        const code = (args[0] || "").trim();
        if (!code) {
          bot?.sendMessage(chatId, "Missing code. Use: /verify 123456");
          return;
        }
        const pending = telegramPendingLinks.get(chatIdText);
        if (!pending) {
          bot?.sendMessage(chatId, "No pending link request. Start with /link your-email@example.com");
          return;
        }
        if (Date.now() > pending.expiresAt) {
          telegramPendingLinks.delete(chatIdText);
          bot?.sendMessage(chatId, "Verification code expired. Run /link again.");
          return;
        }
        if (pending.attempts >= TELEGRAM_MAX_VERIFY_ATTEMPTS) {
          telegramPendingLinks.delete(chatIdText);
          bot?.sendMessage(chatId, "Too many incorrect attempts. Run /link again.");
          return;
        }
        if (pending.code !== code) {
          pending.attempts += 1;
          bot?.sendMessage(chatId, "Invalid code. Please try again.");
          return;
        }
        try {
          const users = await getUsers();
          const user = users.find(
            (entry) => entry.userId === pending.userId && entry.email === pending.email && entry.isActive
          );
          if (!user) {
            telegramPendingLinks.delete(chatIdText);
            bot?.sendMessage(chatId, "User account not found or inactive. Please sign in and try again.");
            return;
          }
          const linkedElsewhere = users.find(
            (entry) => entry.telegramChatId === chatIdText && entry.userId !== user.userId && entry.isActive
          );
          if (linkedElsewhere) {
            bot?.sendMessage(chatId, "This Telegram chat is already linked to another account.");
            return;
          }
          if (user.telegramChatId && user.telegramChatId !== chatIdText) {
            bot?.sendMessage(
              chatId,
              "Your account is linked to another Telegram chat. Use /unlink on that chat first."
            );
            return;
          }
          const updatedUser: UserRecord = {
            ...user,
            updatedAt: nowIso(),
            telegramChatId: chatIdText,
            telegramUsername,
            telegramLinkedAt: nowIso(),
          };
          await updateSheetRow(
            `${USERS_SHEET}!A${user.rowIndex}:L${user.rowIndex}`,
            serializeUserRow(updatedUser)
          );
          telegramPendingLinks.delete(chatIdText);
          await logAuditEvent(user.userId, "telegram_link_success", user.userId, {
            chatId: chatIdText,
            telegramUsername,
          });
          bot?.sendMessage(
            chatId,
            `Linked successfully with ${user.email}. You can now send workout logs.`
          );
        } catch (error) {
          console.error("Telegram verify error:", error);
          bot?.sendMessage(chatId, "Failed to verify code. Please try again.");
        }
        return;
      }

      if (command === "/unlink") {
        try {
          const users = await getUsers();
          const user = users.find((entry) => entry.telegramChatId === chatIdText && entry.isActive);
          if (!user) {
            bot?.sendMessage(chatId, "No linked account found for this Telegram chat.");
            return;
          }
          const updatedUser: UserRecord = {
            ...user,
            updatedAt: nowIso(),
            telegramChatId: "",
            telegramUsername: "",
            telegramLinkedAt: "",
          };
          await updateSheetRow(
            `${USERS_SHEET}!A${user.rowIndex}:L${user.rowIndex}`,
            serializeUserRow(updatedUser)
          );
          telegramPendingLinks.delete(chatIdText);
          await logAuditEvent(user.userId, "telegram_unlink", user.userId, { chatId: chatIdText });
          bot?.sendMessage(chatId, "Telegram chat unlinked successfully.");
        } catch (error) {
          console.error("Telegram unlink error:", error);
          bot?.sendMessage(chatId, "Failed to unlink account. Please try again.");
        }
        return;
      }

      bot?.sendMessage(chatId, "Unknown command. Use /link, /verify, /unlink, or /start.");
      return;
    }

    if (!SPREADSHEET_ID) return;
    try {
      const users = await getUsers();
      const linkedUser = users.find((entry) => entry.telegramChatId === chatIdText && entry.isActive);
      if (!linkedUser) {
        bot?.sendMessage(
          chatId,
          "This Telegram chat is not linked. Link first using /link your-email@example.com"
        );
        await logAuditEvent("system", "telegram_workout_rejected_unlinked", chatIdText, {
          chatId: chatIdText,
          telegramUsername,
        });
        return;
      }
      const workout = parseWorkoutManual(trimmedText, linkedUser.displayName);
      await appendSheetRow(WORKOUTS_RANGE, [
        workout.username,
        workout.date,
        workout.muscleGroup,
        workout.exercises,
        workout.setsReps,
        workout.notes,
      ]);
      await logAuditEvent(linkedUser.userId, "telegram_workout_logged", linkedUser.userId, {
        chatId: chatIdText,
        telegramUsername,
        muscleGroup: workout.muscleGroup,
      });
      bot?.sendMessage(chatId, `Logged ${workout.muscleGroup} workout.`);
    } catch (error) {
      console.error("Google Sheets Error:", error);
      await logAuditEvent("system", "telegram_workout_failed", chatIdText, {
        chatId: chatIdText,
        telegramUsername,
      });
      bot?.sendMessage(chatId, "Failed to log workout.");
    }
  });
}

app.use(express.json());

app.post("/api/auth/signup", async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const email = normalizeEmail(String(req.body?.email || ""));
  const password = String(req.body?.password || "");
  const displayName = normalizeUser(String(req.body?.displayName || ""));

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
    if (users.some((user) => user.email === email)) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const now = nowIso();
    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const role: Role = users.length === 0 ? "admin" : "user";
    await appendSheetRow(`${USERS_SHEET}!A:L`, [
      userId,
      email,
      passwordHash,
      displayName,
      role,
      "true",
      now,
      now,
      now,
      "",
      "",
      "",
    ]);

    const session = await createSession(userId, req);
    await logAuditEvent(userId, "signup", userId, { email, role });

    const user: SafeUser = { userId, email, displayName, role };
    res.status(201).json({
      token: session.tokenValue,
      expiresAt: session.expiresAt,
      user,
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
    return res
      .status(429)
      .json({ error: "Too many login attempts. Try again later.", retryAfterSec: limit.retryAfterSec });
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
    const updatedUser: UserRecord = {
      ...user,
      updatedAt: now,
      lastLoginAt: now,
    };
    await updateSheetRow(
      `${USERS_SHEET}!A${user.rowIndex}:L${user.rowIndex}`,
      serializeUserRow(updatedUser)
    );
    const session = await createSession(user.userId, req);
    await logAuditEvent(user.userId, "login_success", user.userId, { email });
    res.json({
      token: session.tokenValue,
      expiresAt: session.expiresAt,
      user: toSafeUser(user),
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
      await updateSheetRow(`${SESSIONS_SHEET}!A${session.rowIndex}:H${session.rowIndex}`, [
        session.sessionId,
        session.userId,
        session.tokenHash,
        session.expiresAt,
        session.createdAt,
        nowIso(),
        session.ip,
        session.userAgent,
      ]);
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
      }))
    );
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
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
    typeof req.query.from === "string" ? req.query.from : undefined,
    typeof req.query.to === "string" ? req.query.to : undefined
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

app.get("/api/goals", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const userRaw = typeof req.query.user === "string" ? req.query.user : "all";
  try {
    const goals = await getGoalsRecords();
    const scopedId = scopedUserId(req, userRaw);
    const scopedName = scopedUsername(req, userRaw);
    const filtered =
      scopedId === "all"
        ? goals
        : goals.filter((goal) => goal.userId === scopedId || goal.username === scopedName);
    res.json(filtered.map(toPublicGoal));
  } catch (error) {
    console.error("Fetch Goals Error:", error);
    res.status(500).json({ error: "Failed to fetch goals data" });
  }
});

app.post("/api/goals", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  if (!req.authUser) return res.status(401).json({ error: "Unauthorized" });
  const { user, goalName, period, stepsGoal, distanceGoalKm, caloriesGoal, activeMinutesGoal, isActive } =
    req.body || {};
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
    safeNumber(String(activeMinutesGoal ?? "")),
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
    const createdGoal: GoalsRecord = {
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
      isActive: isActive === false ? false : true,
      updatedAt: nowIso(),
    };
    await appendSheetRow(GOALS_RANGE, serializeGoalRow(createdGoal));
    await logAuditEvent(req.authUser.userId, "goal_create", createdGoal.goalId, {
      userId: targetUserId,
      goalName: parsedName,
      period,
      stepsGoal: parsedGoals[0],
      distanceGoalKm: parsedGoals[1],
      caloriesGoal: parsedGoals[2],
      activeMinutesGoal: parsedGoals[3],
      isActive: createdGoal.isActive,
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
  const { goalName, period, stepsGoal, distanceGoalKm, caloriesGoal, activeMinutesGoal, isActive } = req.body || {};
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
    safeNumber(String(activeMinutesGoal ?? "")),
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
    const updatedGoal: GoalsRecord = {
      ...existing,
      goalName: parsedName,
      period,
      stepsGoal: parsedGoals[0],
      distanceGoalKm: parsedGoals[1],
      caloriesGoal: parsedGoals[2],
      activeMinutesGoal: parsedGoals[3],
      isActive: isActive === false ? false : true,
      updatedAt: nowIso(),
    };
    await updateSheetRow(`${GOALS_SHEET}!A${existing.rowIndex}:K${existing.rowIndex}`, serializeGoalRow(updatedGoal));
    await logAuditEvent(req.authUser.userId, "goal_update", updatedGoal.goalId, {
      userId: updatedGoal.userId,
      goalName: updatedGoal.goalName,
      period: updatedGoal.period,
      isActive: updatedGoal.isActive,
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
    await updateSheetRow(`${GOALS_SHEET}!A${existing.rowIndex}:K${existing.rowIndex}`, [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    await logAuditEvent(req.authUser.userId, "goal_delete", existing.goalId, {
      userId: existing.userId,
      goalName: existing.goalName,
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
    await logAuditEvent(req.authUser!.userId, "bot_command_update", command, { response });
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

    const byDate = new Map<string, ActivityDailyRecord>();
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

    let probeDate = new Date();
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
      met: Boolean(todayData && isGoalMet(todayData, goal)),
    }));
    const atRisk = !todayGoalMet;
    const dailyStatus = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, record]) => ({
        date,
        met: goalsToEvaluate.every((goal) => isGoalMet(record, goal)),
      }));

    res.json({
      user: goalsToEvaluate[0]?.username || scopedName,
      goals: goalsToEvaluate.map(toPublicGoal),
      goalStatuses,
      currentStreak,
      longestStreak,
      atRisk,
      todayGoalMet,
      dailyStatus,
    });
  } catch (error) {
    console.error("Fetch Streaks Error:", error);
    res.status(500).json({ error: "Failed to fetch streaks data" });
  }
});

async function startServer() {
  if (SPREADSHEET_ID) {
    try {
      await ensureAuthSheets();
      console.log("Auth sheets verified.");
    } catch (error) {
      console.error("Failed to verify auth sheets:", error);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
/* Legacy duplicated block below is intentionally disabled.
import express from "express";
import path from "path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createServer as createViteServer } from "vite";
import TelegramBot from "node-telegram-bot-api";
import { google } from "googleapis";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      authUser?: SafeUser;
      authSessionToken?: string;
      authSessionId?: string;
    }
  }
}

const app = express();
const PORT = 3030;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 1000 * 60 * 15;
const WORKOUTS_RANGE = "Sheet1!A:F";
const ACTIVITY_RANGE = "Activity!A:H";
const GOALS_RANGE = "Sheet2!A:I";
const USERS_SHEET = "Users";
const SESSIONS_SHEET = "Sessions";
const AUDIT_SHEET = "AuditLog";

interface WorkoutRecord {
  userId: string;
  username: string;
  date: string;
  musclegroup: string;
  exercises: string;
  setsreps: string;
  notes: string;
}

interface ActivityDailyRecord {
  userId: string;
  username: string;
  date: string;
  steps: number;
  distanceKm: number;
  calories: number;
  activeMinutes: number;
  notes: string;
}

interface GoalsRecord {
  userId: string;
  username: string;
  period: "daily" | "weekly";
  stepsGoal: number;
  distanceGoalKm: number;
  caloriesGoal: number;
  activeMinutesGoal: number;
  updatedAt: string;
}

interface UserRecord {
  rowIndex: number;
  userId: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

interface SessionRecord {
  rowIndex: number;
  sessionId: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string;
  ip: string;
  userAgent: string;
}

interface SafeUser {
  userId: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
}

type Role = "user" | "admin";

const loginAttemptMap = new Map<string, { attempts: number; firstAt: number; blockedUntil: number }>();

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;
if (token) {
  bot = new TelegramBot(token, { polling: true });
  console.log("Telegram bot initialized (polling mode)");
} else {
  console.warn("TELEGRAM_BOT_TOKEN not found. Bot functionality disabled.");
}

const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/\s/g, "").replace(/_/g, "");
const safeNumber = (value: string | undefined) => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
};
const toIsoDate = (value?: string) => {
  if (!value) return "";
  if (DATE_REGEX.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};
const todayIsoDate = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();
const normalizeUser = (value: string) => value.trim();
const makeUserId = (username: string) =>
  normalizeUser(username || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "_");
const hashToken = (tokenValue: string) =>
  createHash("sha256").update(tokenValue).digest("hex");
const normalizeEmail = (value: string) => value.trim().toLowerCase();

const ensureSpreadsheetId = (res: express.Response) => {
  if (!SPREADSHEET_ID) {
    res.status(500).json({ error: "GOOGLE_SHEET_ID not configured" });
    return false;
  }
  return true;
};

const parseDateRange = (
  fromRaw: string | undefined,
  toRaw: string | undefined
): { from: string; to: string } | { error: string } => {
  const from = toIsoDate(fromRaw) || "1970-01-01";
  const to = toIsoDate(toRaw) || todayIsoDate();
  if (from > to) return { error: "Invalid range: from must be <= to" };
  return { from, to };
};

const isGoalMet = (activity: ActivityDailyRecord, goal: GoalsRecord) => {
  const checks = [
    goal.stepsGoal > 0 ? activity.steps >= goal.stepsGoal : true,
    goal.distanceGoalKm > 0 ? activity.distanceKm >= goal.distanceGoalKm : true,
    goal.caloriesGoal > 0 ? activity.calories >= goal.caloriesGoal : true,
    goal.activeMinutesGoal > 0 ? activity.activeMinutes >= goal.activeMinutesGoal : true,
  ];
  return checks.every(Boolean);
};

async function readSheetRows(range: string) {
  if (!SPREADSHEET_ID) return [];
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return response.data.values || [];
}

async function appendSheetRow(range: string, row: Array<string | number>) {
  if (!SPREADSHEET_ID) return;
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

async function updateSheetRow(range: string, row: Array<string | number>) {
  if (!SPREADSHEET_ID) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

function mapRows<T>(
  rows: string[][],
  fallbackHeaders: string[],
  mapper: (row: string[], headers: string[], rowIndex: number) => T
): T[] {
  if (!rows.length) return [];
  const firstRow = rows[0].map(normalizeHeader);
  const isHeaderRow = firstRow.some((header) => fallbackHeaders.includes(header));
  const headers = isHeaderRow ? firstRow : fallbackHeaders;
  const dataRows = isHeaderRow ? rows.slice(1) : rows;
  const startRow = isHeaderRow ? 2 : 1;
  return dataRows.map((row, index) => mapper(row, headers, startRow + index));
}

async function ensureSheetWithHeaders(title: string, headers: string[]) {
  if (!SPREADSHEET_ID) return;
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets(properties(title))",
  });
  const existingTitles = new Set(
    (meta.data.sheets || []).map((sheet) => sheet.properties?.title).filter(Boolean)
  );

  if (!existingTitles.has(title)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title } } }],
      },
    });
  }

  const firstRow = await readSheetRows(`${title}!1:1`);
  if (!firstRow.length || firstRow[0].length === 0) {
    await updateSheetRow(`${title}!1:1`, headers);
  }
}

async function ensureAuthSheets() {
  await ensureSheetWithHeaders(USERS_SHEET, [
    "userId",
    "email",
    "passwordHash",
    "displayName",
    "role",
    "isActive",
    "createdAt",
    "updatedAt",
    "lastLoginAt",
  ]);
  await ensureSheetWithHeaders(SESSIONS_SHEET, [
    "sessionId",
    "userId",
    "tokenHash",
    "expiresAt",
    "createdAt",
    "revokedAt",
    "ip",
    "userAgent",
  ]);
  await ensureSheetWithHeaders(AUDIT_SHEET, [
    "eventId",
    "userId",
    "eventType",
    "targetId",
    "metadataJson",
    "createdAt",
  ]);
}

async function getUsers(): Promise<UserRecord[]> {
  const rows = await readSheetRows(`${USERS_SHEET}!A:I`);
  const headers = [
    "userid",
    "email",
    "passwordhash",
    "displayname",
    "role",
    "isactive",
    "createdat",
    "updatedat",
    "lastloginat",
  ];
  return mapRows(rows, headers, (row, actualHeaders, rowIndex) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    return {
      rowIndex,
      userId: get("userid"),
      email: normalizeEmail(get("email")),
      passwordHash: get("passwordhash"),
      displayName: get("displayname"),
      role: get("role") === "admin" ? "admin" : "user",
      isActive: get("isactive") !== "false",
      createdAt: get("createdat") || nowIso(),
      updatedAt: get("updatedat") || nowIso(),
      lastLoginAt: get("lastloginat"),
    };
  }).filter((user) => Boolean(user.userId && user.email));
}

async function getSessions(): Promise<SessionRecord[]> {
  const rows = await readSheetRows(`${SESSIONS_SHEET}!A:H`);
  const headers = [
    "sessionid",
    "userid",
    "tokenhash",
    "expiresat",
    "createdat",
    "revokedat",
    "ip",
    "useragent",
  ];
  return mapRows(rows, headers, (row, actualHeaders, rowIndex) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    return {
      rowIndex,
      sessionId: get("sessionid"),
      userId: get("userid"),
      tokenHash: get("tokenhash"),
      expiresAt: get("expiresat"),
      createdAt: get("createdat"),
      revokedAt: get("revokedat"),
      ip: get("ip"),
      userAgent: get("useragent"),
    };
  }).filter((session) => Boolean(session.sessionId && session.tokenHash));
}

async function logAuditEvent(
  userId: string,
  eventType: string,
  targetId: string,
  metadata: Record<string, unknown>
) {
  await appendSheetRow(`${AUDIT_SHEET}!A:F`, [
    randomUUID(),
    userId,
    eventType,
    targetId,
    JSON.stringify(metadata),
    nowIso(),
  ]);
}

async function getWorkoutRecords(): Promise<WorkoutRecord[]> {
  const rows = await readSheetRows(WORKOUTS_RANGE);
  const headers = ["username", "date", "musclegroup", "exercises", "setsreps", "notes"];
  return mapRows(rows, headers, (row, actualHeaders) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    const username = get("username");
    return {
      userId: makeUserId(username),
      username,
      date: toIsoDate(get("date")),
      musclegroup: get("musclegroup"),
      exercises: get("exercises"),
      setsreps: get("setsreps"),
      notes: get("notes"),
    };
  }).filter((entry) => Boolean(entry.date || entry.username));
}

async function getActivityRecords(workouts: WorkoutRecord[]): Promise<ActivityDailyRecord[]> {
  const rows = await readSheetRows(ACTIVITY_RANGE);
  const headers = [
    "userid",
    "username",
    "date",
    "steps",
    "distancekm",
    "calories",
    "activeminutes",
    "notes",
  ];
  const activityRows = mapRows(rows, headers, (row, actualHeaders) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    const username = get("username");
    return {
      userId: get("userid") || makeUserId(username),
      username,
      date: toIsoDate(get("date")),
      steps: safeNumber(get("steps")),
      distanceKm: safeNumber(get("distancekm")),
      calories: safeNumber(get("calories")),
      activeMinutes: safeNumber(get("activeminutes")),
      notes: get("notes"),
    };
  }).filter((entry) => Boolean(entry.date));

  if (activityRows.length) return activityRows;

  const map = new Map<string, ActivityDailyRecord>();
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
        notes: "Derived from workout logs",
      });
      return;
    }
    current.calories += 80;
    current.activeMinutes += 20;
  });
  return Array.from(map.values());
}

async function getGoalsRecords(): Promise<GoalsRecord[]> {
  const rows = await readSheetRows(GOALS_RANGE);
  const headers = [
    "userid",
    "username",
    "period",
    "stepsgoal",
    "distancegoalkm",
    "caloriesgoal",
    "activeminutesgoal",
    "updatedat",
    "isactive",
  ];
  return mapRows(rows, headers, (row, actualHeaders) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    const username = get("username");
    return {
      userId: get("userid") || makeUserId(username),
      username,
      period: get("period") === "weekly" ? "weekly" : "daily",
      stepsGoal: safeNumber(get("stepsgoal")),
      distanceGoalKm: safeNumber(get("distancegoalkm")),
      caloriesGoal: safeNumber(get("caloriesgoal")),
      activeMinutesGoal: safeNumber(get("activeminutesgoal")),
      updatedAt: get("updatedat") || nowIso(),
    };
  });
}

const toSafeUser = (record: UserRecord): SafeUser => ({
  userId: record.userId,
  email: record.email,
  displayName: record.displayName,
  role: record.role,
});

function getAuthToken(req: express.Request) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return "";
  return header.slice(7).trim();
}

function readClientIp(req: express.Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "";
  }
  return req.socket.remoteAddress || "";
}

async function createSession(userId: string, req: express.Request) {
  const sessionId = randomUUID();
  const tokenValue = randomBytes(32).toString("hex");
  const tokenHash = hashToken(tokenValue);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await appendSheetRow(`${SESSIONS_SHEET}!A:H`, [
    sessionId,
    userId,
    tokenHash,
    expiresAt,
    createdAt,
    "",
    readClientIp(req),
    String(req.headers["user-agent"] || ""),
  ]);
  return { sessionId, tokenValue, expiresAt };
}

function applyLoginRateLimit(key: string) {
  const now = Date.now();
  const current = loginAttemptMap.get(key);
  if (!current) return { blocked: false };
  if (current.blockedUntil > now) {
    return { blocked: true, retryAfterSec: Math.ceil((current.blockedUntil - now) / 1000) };
  }
  if (now - current.firstAt > LOGIN_WINDOW_MS) {
    loginAttemptMap.delete(key);
  }
  return { blocked: false };
}

function recordLoginFailure(key: string) {
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

function clearLoginFailures(key: string) {
  loginAttemptMap.delete(key);
}

const requireAuth: express.RequestHandler = async (req, res, next) => {
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

const requireRole =
  (role: Role): express.RequestHandler =>
  (req, res, next) => {
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

function scopedUserId(req: express.Request, userRaw: string | undefined) {
  const authUser = req.authUser;
  if (!authUser) return "all";
  if (authUser.role !== "admin") return authUser.userId;
  if (!userRaw || userRaw === "all") return "all";
  return makeUserId(userRaw);
}

function scopedUsername(req: express.Request, userRaw: string | undefined) {
  const authUser = req.authUser;
  if (!authUser) return "";
  if (authUser.role !== "admin") return authUser.displayName;
  if (!userRaw || userRaw === "all") return "all";
  return userRaw;
}

// --- Telegram Bot logging ---
function parseWorkoutManual(text: string, username: string) {
  const parts = text.split("-").map((value) => value.trim());
  return {
    username: normalizeUser(username),
    date: todayIsoDate(),
    muscleGroup: parts[0] || "Unknown",
    exercises: parts[1] || "Not specified",
    setsReps: parts[2] || "Not specified",
    notes: parts.slice(3).join(" - ") || "None",
  };
}

if (bot) {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const username = msg.from?.username || msg.from?.first_name || "Unknown";
    if (!text || text.startsWith("/")) {
      if (text === "/start") {
        bot?.sendMessage(
          chatId,
          'Welcome to FitSheet Bot!\n\nLog using: "Muscle Group - Exercises - Sets/Reps"\nExample: "Chest - Bench Press - 3x10"'
        );
      }
      return;
    }

    const workout = parseWorkoutManual(text, username);
    if (!SPREADSHEET_ID) return;
    try {
      await appendSheetRow(WORKOUTS_RANGE, [
        workout.username,
        workout.date,
        workout.muscleGroup,
        workout.exercises,
        workout.setsReps,
        workout.notes,
      ]);
      bot?.sendMessage(chatId, `Logged ${workout.muscleGroup} workout.`);
    } catch (error) {
      console.error("Google Sheets Error:", error);
      bot?.sendMessage(chatId, "Failed to log workout.");
    }
  });
}

app.use(express.json());

app.post("/api/auth/signup", async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const email = normalizeEmail(String(req.body?.email || ""));
  const password = String(req.body?.password || "");
  const displayName = normalizeUser(String(req.body?.displayName || ""));

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
    if (users.some((user) => user.email === email)) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const now = nowIso();
    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const role: Role = users.length === 0 ? "admin" : "user";
    await appendSheetRow(`${USERS_SHEET}!A:I`, [
      userId,
      email,
      passwordHash,
      displayName,
      role,
      "true",
      now,
      now,
      now,
    ]);

    const session = await createSession(userId, req);
    await logAuditEvent(userId, "signup", userId, { email, role });

    const user: SafeUser = { userId, email, displayName, role };
    res.status(201).json({
      token: session.tokenValue,
      expiresAt: session.expiresAt,
      user,
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
    return res
      .status(429)
      .json({ error: "Too many login attempts. Try again later.", retryAfterSec: limit.retryAfterSec });
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
    await updateSheetRow(`${USERS_SHEET}!A${user.rowIndex}:I${user.rowIndex}`, [
      user.userId,
      user.email,
      user.passwordHash,
      user.displayName,
      user.role,
      user.isActive ? "true" : "false",
      user.createdAt,
      now,
      now,
    ]);
    const session = await createSession(user.userId, req);
    await logAuditEvent(user.userId, "login_success", user.userId, { email });
    res.json({
      token: session.tokenValue,
      expiresAt: session.expiresAt,
      user: toSafeUser(user),
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
      await updateSheetRow(`${SESSIONS_SHEET}!A${session.rowIndex}:H${session.rowIndex}`, [
        session.sessionId,
        session.userId,
        session.tokenHash,
        session.expiresAt,
        session.createdAt,
        nowIso(),
        session.ip,
        session.userAgent,
      ]);
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
      }))
    );
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
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
    typeof req.query.from === "string" ? req.query.from : undefined,
    typeof req.query.to === "string" ? req.query.to : undefined
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

app.get("/api/goals", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const userRaw = typeof req.query.user === "string" ? req.query.user : "all";
  try {
    const goals = await getGoalsRecords();
    const scopedId = scopedUserId(req, userRaw);
    const scopedName = scopedUsername(req, userRaw);
    const filtered =
      scopedId === "all"
        ? goals
        : goals.filter((goal) => goal.userId === scopedId || goal.username === scopedName);

    if (filtered.length) return res.json(filtered);
    if (!req.authUser) return res.json([]);

    const fallbackName = scopedName === "all" ? req.authUser.displayName : scopedName;
    const fallbackId = scopedId === "all" ? req.authUser.userId : scopedId;
    res.json([
      {
        userId: fallbackId,
        username: fallbackName,
        period: "daily",
        stepsGoal: 8000,
        distanceGoalKm: 5,
        caloriesGoal: 450,
        activeMinutesGoal: 45,
        updatedAt: nowIso(),
      } satisfies GoalsRecord,
    ]);
  } catch (error) {
    console.error("Fetch Goals Error:", error);
    res.status(500).json({ error: "Failed to fetch goals data" });
  }
});

app.post("/api/goals", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  if (!req.authUser) return res.status(401).json({ error: "Unauthorized" });
  const { user, period, stepsGoal, distanceGoalKm, caloriesGoal, activeMinutesGoal } = req.body || {};
  if (period !== "daily" && period !== "weekly") {
    return res.status(400).json({ error: "period must be daily or weekly" });
  }
  const parsedGoals = [
    safeNumber(String(stepsGoal ?? "")),
    safeNumber(String(distanceGoalKm ?? "")),
    safeNumber(String(caloriesGoal ?? "")),
    safeNumber(String(activeMinutesGoal ?? "")),
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
    const updatedAt = nowIso();
    await appendSheetRow(GOALS_RANGE, [
      targetUserId,
      targetUsername,
      period,
      parsedGoals[0],
      parsedGoals[1],
      parsedGoals[2],
      parsedGoals[3],
      updatedAt,
      "true",
    ]);
    await logAuditEvent(req.authUser.userId, "goal_update", targetUserId, {
      period,
      stepsGoal: parsedGoals[0],
      distanceGoalKm: parsedGoals[1],
      caloriesGoal: parsedGoals[2],
      activeMinutesGoal: parsedGoals[3],
    });
    const payload: GoalsRecord = {
      userId: targetUserId,
      username: targetUsername,
      period,
      stepsGoal: parsedGoals[0],
      distanceGoalKm: parsedGoals[1],
      caloriesGoal: parsedGoals[2],
      activeMinutesGoal: parsedGoals[3],
      updatedAt,
    };
    res.status(201).json(payload);
  } catch (error) {
    console.error("Save Goals Error:", error);
    res.status(500).json({ error: "Failed to save goals data" });
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
    const activeGoal =
      goalsForUser.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ||
      ({
        userId: scopedId,
        username: scopedName === "all" ? req.authUser?.displayName || "" : scopedName,
        period: "daily",
        stepsGoal: 8000,
        distanceGoalKm: 5,
        caloriesGoal: 450,
        activeMinutesGoal: 45,
        updatedAt: nowIso(),
      } satisfies GoalsRecord);

    const byDate = new Map<string, ActivityDailyRecord>();
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
      if (isGoalMet(record, activeGoal)) {
        running += 1;
        longestStreak = Math.max(longestStreak, running);
      } else {
        running = 0;
      }
    });

    let probeDate = new Date();
    for (let i = 0; i < 365; i += 1) {
      const key = probeDate.toISOString().slice(0, 10);
      const dayData = byDate.get(key);
      if (dayData && isGoalMet(dayData, activeGoal)) {
        currentStreak += 1;
      } else {
        break;
      }
      probeDate.setUTCDate(probeDate.getUTCDate() - 1);
    }

    const todayData = byDate.get(todayIsoDate());
    const todayGoalMet = Boolean(todayData && isGoalMet(todayData, activeGoal));
    const atRisk = !todayGoalMet;
    const dailyStatus = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, record]) => ({ date, met: isGoalMet(record, activeGoal) }));

    res.json({
      user: activeGoal.username,
      goal: activeGoal,
      currentStreak,
      longestStreak,
      atRisk,
      todayGoalMet,
      dailyStatus,
    });
  } catch (error) {
    console.error("Fetch Streaks Error:", error);
    res.status(500).json({ error: "Failed to fetch streaks data" });
  }
});

async function startServer() {
  if (SPREADSHEET_ID) {
    try {
      await ensureAuthSheets();
      console.log("Auth sheets verified.");
    } catch (error) {
      console.error("Failed to verify auth sheets:", error);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import TelegramBot from "node-telegram-bot-api";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3030;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const WORKOUTS_RANGE = "Sheet1!A:F";
const ACTIVITY_RANGE = "Activity!A:H";
const GOALS_RANGE = "Goals!A:I";

interface WorkoutRecord {
  userId: string;
  username: string;
  date: string;
  musclegroup: string;
  exercises: string;
  setsreps: string;
  notes: string;
}

interface ActivityDailyRecord {
  userId: string;
  username: string;
  date: string;
  steps: number;
  distanceKm: number;
  calories: number;
  activeMinutes: number;
  notes: string;
}

interface GoalsRecord {
  userId: string;
  username: string;
  period: "daily" | "weekly";
  stepsGoal: number;
  distanceGoalKm: number;
  caloriesGoal: number;
  activeMinutesGoal: number;
  updatedAt: string;
}

// --- Telegram Bot Setup ---
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;

if (token) {
  bot = new TelegramBot(token, { polling: true });
  console.log("Telegram bot initialized (polling mode)");
} else {
  console.warn("TELEGRAM_BOT_TOKEN not found. Bot functionality disabled.");
}

// --- Google Sheets Setup ---
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({
  version: "v4",
  auth,
});
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/\s/g, "").replace(/_/g, "");

const safeNumber = (value: string | undefined) => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
};

const toIsoDate = (value?: string) => {
  if (!value) return "";
  if (DATE_REGEX.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const parseDateRange = (
  fromRaw: string | undefined,
  toRaw: string | undefined
): { from: string; to: string } | { error: string } => {
  const from = toIsoDate(fromRaw) || "1970-01-01";
  const to = toIsoDate(toRaw) || todayIsoDate();
  if (from > to) {
    return { error: "Invalid range: from must be <= to" };
  }
  return { from, to };
};

const normalizeUser = (value: string) => value.trim();
const makeUserId = (username: string) =>
  normalizeUser(username || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "_");

const metricKeys = ["steps", "distancekm", "calories", "activeminutes"] as const;

const isGoalMet = (activity: ActivityDailyRecord, goal: GoalsRecord) => {
  const checks = [
    goal.stepsGoal > 0 ? activity.steps >= goal.stepsGoal : true,
    goal.distanceGoalKm > 0 ? activity.distanceKm >= goal.distanceGoalKm : true,
    goal.caloriesGoal > 0 ? activity.calories >= goal.caloriesGoal : true,
    goal.activeMinutesGoal > 0 ? activity.activeMinutes >= goal.activeMinutesGoal : true,
  ];
  return checks.every(Boolean);
};

const ensureSpreadsheetId = (res: express.Response) => {
  if (!SPREADSHEET_ID) {
    res.status(500).json({ error: "GOOGLE_SHEET_ID not configured" });
    return false;
  }
  return true;
};

async function readSheetRows(range: string) {
  if (!SPREADSHEET_ID) return [];
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return response.data.values || [];
}

async function appendSheetRow(range: string, row: Array<string | number>) {
  if (!SPREADSHEET_ID) return;
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

function mapRows<T>(
  rows: string[][],
  fallbackHeaders: string[],
  mapper: (row: string[], headers: string[]) => T
): T[] {
  if (!rows.length) return [];
  const firstRow = rows[0].map(normalizeHeader);
  const isHeaderRow = firstRow.some((header) => fallbackHeaders.includes(header));
  const headers = isHeaderRow ? firstRow : fallbackHeaders;
  const dataRows = isHeaderRow ? rows.slice(1) : rows;
  return dataRows.map((row) => mapper(row, headers));
}

async function getWorkoutRecords(): Promise<WorkoutRecord[]> {
  const rows = await readSheetRows(WORKOUTS_RANGE);
  const headers = ["username", "date", "musclegroup", "exercises", "setsreps", "notes"];
  return mapRows(rows, headers, (row, actualHeaders) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    const username = get("username");
    return {
      userId: makeUserId(username),
      username,
      date: toIsoDate(get("date")),
      musclegroup: get("musclegroup"),
      exercises: get("exercises"),
      setsreps: get("setsreps"),
      notes: get("notes"),
    };
  }).filter((entry) => Boolean(entry.date || entry.username));
}

async function getActivityRecords(workouts: WorkoutRecord[]): Promise<ActivityDailyRecord[]> {
  const rows = await readSheetRows(ACTIVITY_RANGE);
  const headers = [
    "userid",
    "username",
    "date",
    "steps",
    "distancekm",
    "calories",
    "activeminutes",
    "notes",
  ];
  const activityRows = mapRows(rows, headers, (row, actualHeaders) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    const username = get("username");
    return {
      userId: get("userid") || makeUserId(username),
      username,
      date: toIsoDate(get("date")),
      steps: safeNumber(get("steps")),
      distanceKm: safeNumber(get("distancekm")),
      calories: safeNumber(get("calories")),
      activeMinutes: safeNumber(get("activeminutes")),
      notes: get("notes"),
    };
  }).filter((entry) => Boolean(entry.date));

  if (activityRows.length) return activityRows;

  // Fallback for MVP: derive a minimal daily activity snapshot from workouts only.
  const map = new Map<string, ActivityDailyRecord>();
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
        notes: "Derived from workout logs",
      });
      return;
    }
    current.calories += 80;
    current.activeMinutes += 20;
  });
  return Array.from(map.values());
}

async function getGoalsRecords(): Promise<GoalsRecord[]> {
  const rows = await readSheetRows(GOALS_RANGE);
  const headers = [
    "userid",
    "username",
    "period",
    "stepsgoal",
    "distancegoalkm",
    "caloriesgoal",
    "activeminutesgoal",
    "updatedat",
    "isactive",
  ];
  return mapRows(rows, headers, (row, actualHeaders) => {
    const get = (name: string) => row[actualHeaders.indexOf(name)] || "";
    const username = get("username");
    return {
      userId: get("userid") || makeUserId(username),
      username,
      period: get("period") === "weekly" ? "weekly" : "daily",
      stepsGoal: safeNumber(get("stepsgoal")),
      distanceGoalKm: safeNumber(get("distancegoalkm")),
      caloriesGoal: safeNumber(get("caloriesgoal")),
      activeMinutesGoal: safeNumber(get("activeminutesgoal")),
      updatedAt: get("updatedat") || new Date().toISOString(),
    };
  });
}

// --- Helper: Manual Workout Parser (Non-AI) ---
function parseWorkoutManual(text: string, username: string) {
  // Expected format: "Muscle Group - Exercises - Sets/Reps"
  // Example: "Chest - Bench Press - 3x10"
  const parts = text.split("-").map(p => p.trim());
  
  return {
    username: normalizeUser(username),
    date: new Date().toISOString().split("T")[0],
    muscleGroup: parts[0] || "Unknown",
    exercises: parts[1] || "Not specified",
    setsReps: parts[2] || "Not specified",
    notes: parts.slice(3).join(" - ") || "None"
  };
}

// --- Bot Message Handler ---
if (bot) {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const username = msg.from?.username || msg.from?.first_name || "Unknown";

    if (!text || text.startsWith("/")) {
      if (text === "/start") {
        bot.sendMessage(chatId, "💪 Welcome to FitSheet Bot!\n\nLog your workout using this format:\n`Muscle Group - Exercises - Sets/Reps`\n\nExample:\n`Chest - Bench Press - 3x10`", { parse_mode: "Markdown" });
      }
      return;
    }

    bot.sendMessage(chatId, "📝 Logging your workout...");

    const workout = parseWorkoutManual(text, username);

    if (SPREADSHEET_ID) {
      try {
        await appendSheetRow(WORKOUTS_RANGE, [
          workout.username,
          workout.date,
          workout.muscleGroup,
          workout.exercises,
          workout.setsReps,
          workout.notes,
        ]);
        bot.sendMessage(chatId, `✅ Logged! ${workout.muscleGroup} workout added to your sheet.`);
      } catch (error) {
        console.error("Google Sheets Error:", error);
        bot.sendMessage(chatId, "❌ Failed to save to Google Sheets. Check server logs.");
      }
    }
  });
}

// --- API Routes ---
app.use(express.json());

app.get("/api/workouts", async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;

  try {
    const workouts = await getWorkoutRecords();
    res.json(workouts);
  } catch (error) {
    console.error("Fetch Workouts Error:", error);
    res.status(500).json({ error: "Failed to fetch from Google Sheets" });
  }
});

app.get("/api/activity/daily", async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const userRaw = String(req.query.user || "all");
  const rangeResult = parseDateRange(
    typeof req.query.from === "string" ? req.query.from : undefined,
    typeof req.query.to === "string" ? req.query.to : undefined
  );
  if ("error" in rangeResult) {
    return res.status(400).json({ error: rangeResult.error });
  }
  try {
    const workouts = await getWorkoutRecords();
    const activity = await getActivityRecords(workouts);
    const requestedUserId = userRaw === "all" ? "all" : makeUserId(userRaw);
    const filtered = activity.filter((entry) => {
      const inDateRange = entry.date >= rangeResult.from && entry.date <= rangeResult.to;
      const userMatch = requestedUserId === "all" || entry.userId === requestedUserId || entry.username === userRaw;
      return inDateRange && userMatch;
    });
    res.json(filtered);
  } catch (error) {
    console.error("Fetch Activity Error:", error);
    res.status(500).json({ error: "Failed to fetch activity data" });
  }
});

app.get("/api/goals", async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const userRaw = String(req.query.user || "all");
  try {
    const goals = await getGoalsRecords();
    if (userRaw === "all") return res.json(goals);
    const userId = makeUserId(userRaw);
    const userGoals = goals.filter(
      (goal) => goal.userId === userId || goal.username === userRaw
    );
    if (userGoals.length) return res.json(userGoals);
    return res.json([
      {
        userId,
        username: userRaw,
        period: "daily",
        stepsGoal: 8000,
        distanceGoalKm: 5,
        caloriesGoal: 450,
        activeMinutesGoal: 45,
        updatedAt: new Date().toISOString(),
      } satisfies GoalsRecord,
    ]);
  } catch (error) {
    console.error("Fetch Goals Error:", error);
    res.status(500).json({ error: "Failed to fetch goals data" });
  }
});

app.post("/api/goals", async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const {
    user,
    period,
    stepsGoal,
    distanceGoalKm,
    caloriesGoal,
    activeMinutesGoal,
  } = req.body || {};

  if (typeof user !== "string" || !user.trim()) {
    return res.status(400).json({ error: "user is required" });
  }
  if (period !== "daily" && period !== "weekly") {
    return res.status(400).json({ error: "period must be daily or weekly" });
  }
  const parsedGoals = [
    safeNumber(String(stepsGoal ?? "")),
    safeNumber(String(distanceGoalKm ?? "")),
    safeNumber(String(caloriesGoal ?? "")),
    safeNumber(String(activeMinutesGoal ?? "")),
  ];
  if (parsedGoals.some((goal) => goal < 0)) {
    return res.status(400).json({ error: "goal values must be >= 0" });
  }

  try {
    const username = normalizeUser(user);
    const userId = makeUserId(username);
    const updatedAt = new Date().toISOString();
    await appendSheetRow(GOALS_RANGE, [
      userId,
      username,
      period,
      parsedGoals[0],
      parsedGoals[1],
      parsedGoals[2],
      parsedGoals[3],
      updatedAt,
      "true",
    ]);
    const response: GoalsRecord = {
      userId,
      username,
      period,
      stepsGoal: parsedGoals[0],
      distanceGoalKm: parsedGoals[1],
      caloriesGoal: parsedGoals[2],
      activeMinutesGoal: parsedGoals[3],
      updatedAt,
    };
    res.status(201).json(response);
  } catch (error) {
    console.error("Save Goals Error:", error);
    res.status(500).json({ error: "Failed to save goals data" });
  }
});

app.get("/api/streaks", async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const userRaw = String(req.query.user || "");
  if (!userRaw) {
    return res.status(400).json({ error: "user query is required" });
  }

  try {
    const userId = makeUserId(userRaw);
    const workouts = await getWorkoutRecords();
    const activity = (await getActivityRecords(workouts)).filter(
      (entry) => entry.userId === userId || entry.username === userRaw
    );
    const goalsForUser = (await getGoalsRecords()).filter(
      (goal) => goal.userId === userId || goal.username === userRaw
    );

    const activeGoal =
      goalsForUser.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ||
      ({
        userId,
        username: userRaw,
        period: "daily",
        stepsGoal: 8000,
        distanceGoalKm: 5,
        caloriesGoal: 450,
        activeMinutesGoal: 45,
        updatedAt: new Date().toISOString(),
      } satisfies GoalsRecord);

    const byDate = new Map<string, ActivityDailyRecord>();
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
      const current = byDate.get(date);
      if (!current) return;
      if (isGoalMet(current, activeGoal)) {
        running += 1;
        longestStreak = Math.max(longestStreak, running);
      } else {
        running = 0;
      }
    });

    let probeDate = new Date();
    for (let i = 0; i < 365; i += 1) {
      const key = probeDate.toISOString().slice(0, 10);
      const dayData = byDate.get(key);
      if (dayData && isGoalMet(dayData, activeGoal)) {
        currentStreak += 1;
      } else {
        break;
      }
      probeDate.setUTCDate(probeDate.getUTCDate() - 1);
    }

    const todayKey = todayIsoDate();
    const todayData = byDate.get(todayKey);
    const todayGoalMet = Boolean(todayData && isGoalMet(todayData, activeGoal));
    const atRisk = !todayGoalMet;
    const dailyStatus = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, record]) => ({
        date,
        met: isGoalMet(record, activeGoal),
      }));

    res.json({
      user: userRaw,
      goal: activeGoal,
      currentStreak,
      longestStreak,
      atRisk,
      todayGoalMet,
      dailyStatus,
    });
  } catch (error) {
    console.error("Fetch Streaks Error:", error);
    res.status(500).json({ error: "Failed to fetch streaks data" });
  }
});

// --- Vite Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
*/
