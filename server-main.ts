import "./server";
/*
import "./server";
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
const WORKOUTS_RANGE = "Workouts!A:F";
const ACTIVITY_RANGE = "Activity!A:H";
const GOALS_RANGE = "Goals!A:I";
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
const hashToken = (tokenValue: string) => createHash("sha256").update(tokenValue).digest("hex");
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
  const existing = new Set((meta.data.sheets || []).map((sheet) => sheet.properties?.title).filter(Boolean));
  if (!existing.has(title)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
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
    };
  }).filter((user) => Boolean(user.userId && user.email));
}

async function getSessions(): Promise<SessionRecord[]> {
  const rows = await readSheetRows(`${SESSIONS_SHEET}!A:H`);
  const headers = ["sessionid", "userid", "tokenhash", "expiresat", "createdat", "revokedat", "ip", "useragent"];
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
  await appendSheetRow(`${AUDIT_SHEET}!A:F`, [randomUUID(), userId, eventType, targetId, JSON.stringify(metadata), nowIso()]);
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
  const headers = ["userid", "username", "date", "steps", "distancekm", "calories", "activeminutes", "notes"];
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
  const headers = ["userid", "username", "period", "stepsgoal", "distancegoalkm", "caloriesgoal", "activeminutesgoal", "updatedat", "isactive"];
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
  await appendSheetRow(`${SESSIONS_SHEET}!A:H`, [sessionId, userId, tokenHash, expiresAt, createdAt, "", readClientIp(req), String(req.headers["user-agent"] || "")]);
  return { sessionId, tokenValue, expiresAt };
}

function applyLoginRateLimit(key: string) {
  const now = Date.now();
  const current = loginAttemptMap.get(key);
  if (!current) return { blocked: false };
  if (current.blockedUntil > now) return { blocked: true, retryAfterSec: Math.ceil((current.blockedUntil - now) / 1000) };
  if (now - current.firstAt > LOGIN_WINDOW_MS) loginAttemptMap.delete(key);
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
  if (current.attempts >= MAX_LOGIN_ATTEMPTS) current.blockedUntil = now + LOGIN_WINDOW_MS;
}

function clearLoginFailures(key: string) {
  loginAttemptMap.delete(key);
}

const requireAuth: express.RequestHandler = async (req, res, next) => {
  try {
    if (!ensureSpreadsheetId(res)) return;
    const tokenValue = getAuthToken(req);
    if (!tokenValue) return res.status(401).json({ error: "Unauthorized" });
    const tokenHash = hashToken(tokenValue);
    const sessions = await getSessions();
    const session = sessions.find((entry) => entry.tokenHash === tokenHash);
    if (!session || session.revokedAt || new Date(session.expiresAt).getTime() < Date.now()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const users = await getUsers();
    const user = users.find((entry) => entry.userId === session.userId && entry.isActive);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.authUser = toSafeUser(user);
    req.authSessionId = session.sessionId;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Failed to verify session" });
  }
};

const requireRole = (role: Role): express.RequestHandler => (req, res, next) => {
  if (!req.authUser) return res.status(401).json({ error: "Unauthorized" });
  if (req.authUser.role !== role) return res.status(403).json({ error: "Forbidden" });
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
    const username = msg.from?.username || msg.from?.first_name || "Unknown";
    if (!text || text.startsWith("/")) {
      if (text === "/start") {
        bot?.sendMessage(chatId, 'Welcome to FitSheet Bot!\n\nLog using: "Muscle Group - Exercises - Sets/Reps"\nExample: "Chest - Bench Press - 3x10"');
      }
      return;
    }
    const workout = parseWorkoutManual(text, username);
    if (!SPREADSHEET_ID) return;
    try {
      await appendSheetRow(WORKOUTS_RANGE, [workout.username, workout.date, workout.muscleGroup, workout.exercises, workout.setsReps, workout.notes]);
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
  if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: "Valid email is required" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  if (!displayName) return res.status(400).json({ error: "displayName is required" });
  try {
    const users = await getUsers();
    if (users.some((user) => user.email === email)) return res.status(409).json({ error: "Email already exists" });
    const now = nowIso();
    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const role: Role = users.length === 0 ? "admin" : "user";
    await appendSheetRow(`${USERS_SHEET}!A:I`, [userId, email, passwordHash, displayName, role, "true", now, now, now]);
    const session = await createSession(userId, req);
    await logAuditEvent(userId, "signup", userId, { email, role });
    res.status(201).json({ token: session.tokenValue, expiresAt: session.expiresAt, user: { userId, email, displayName, role } });
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
  if (limit.blocked) return res.status(429).json({ error: "Too many login attempts. Try again later.", retryAfterSec: limit.retryAfterSec });
  if (!EMAIL_REGEX.test(email) || !password) return res.status(400).json({ error: "Email and password are required" });
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
    await updateSheetRow(`${USERS_SHEET}!A${user.rowIndex}:I${user.rowIndex}`, [user.userId, user.email, user.passwordHash, user.displayName, user.role, user.isActive ? "true" : "false", user.createdAt, now, now]);
    const session = await createSession(user.userId, req);
    await logAuditEvent(user.userId, "login_success", user.userId, { email });
    res.json({ token: session.tokenValue, expiresAt: session.expiresAt, user: toSafeUser(user) });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

app.post("/api/auth/logout", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  if (!req.authSessionId || !req.authUser) return res.status(401).json({ error: "Unauthorized" });
  try {
    const sessions = await getSessions();
    const session = sessions.find((entry) => entry.sessionId === req.authSessionId);
    if (session) {
      await updateSheetRow(`${SESSIONS_SHEET}!A${session.rowIndex}:H${session.rowIndex}`, [session.sessionId, session.userId, session.tokenHash, session.expiresAt, session.createdAt, nowIso(), session.ip, session.userAgent]);
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

app.get("/api/admin/users", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const users = await getUsers();
    res.json(users.map((entry) => ({ userId: entry.userId, email: entry.email, displayName: entry.displayName, role: entry.role, isActive: entry.isActive })));
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
    res.json(workouts.filter((entry) => scopedId === "all" || entry.userId === scopedId || entry.username === scopedName));
  } catch (error) {
    console.error("Fetch Workouts Error:", error);
    res.status(500).json({ error: "Failed to fetch workouts" });
  }
});

app.get("/api/activity/daily", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  const userRaw = typeof req.query.user === "string" ? req.query.user : "all";
  const rangeResult = parseDateRange(typeof req.query.from === "string" ? req.query.from : undefined, typeof req.query.to === "string" ? req.query.to : undefined);
  if ("error" in rangeResult) return res.status(400).json({ error: rangeResult.error });
  try {
    const workouts = await getWorkoutRecords();
    const activity = await getActivityRecords(workouts);
    const scopedId = scopedUserId(req, userRaw);
    const scopedName = scopedUsername(req, userRaw);
    res.json(activity.filter((entry) => {
      const inRange = entry.date >= rangeResult.from && entry.date <= rangeResult.to;
      if (scopedId === "all") return inRange;
      return inRange && (entry.userId === scopedId || entry.username === scopedName);
    }));
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
    const filtered = scopedId === "all" ? goals : goals.filter((goal) => goal.userId === scopedId || goal.username === scopedName);
    if (filtered.length) return res.json(filtered);
    if (!req.authUser) return res.json([]);
    const fallbackName = scopedName === "all" ? req.authUser.displayName : scopedName;
    const fallbackId = scopedId === "all" ? req.authUser.userId : scopedId;
    res.json([{ userId: fallbackId, username: fallbackName, period: "daily", stepsGoal: 8000, distanceGoalKm: 5, caloriesGoal: 450, activeMinutesGoal: 45, updatedAt: nowIso() } satisfies GoalsRecord]);
  } catch (error) {
    console.error("Fetch Goals Error:", error);
    res.status(500).json({ error: "Failed to fetch goals data" });
  }
});

app.post("/api/goals", requireAuth, async (req, res) => {
  if (!ensureSpreadsheetId(res)) return;
  if (!req.authUser) return res.status(401).json({ error: "Unauthorized" });
  const { user, period, stepsGoal, distanceGoalKm, caloriesGoal, activeMinutesGoal } = req.body || {};
  if (period !== "daily" && period !== "weekly") return res.status(400).json({ error: "period must be daily or weekly" });
  const parsedGoals = [safeNumber(String(stepsGoal ?? "")), safeNumber(String(distanceGoalKm ?? "")), safeNumber(String(caloriesGoal ?? "")), safeNumber(String(activeMinutesGoal ?? ""))];
  if (parsedGoals.some((value) => value < 0)) return res.status(400).json({ error: "goal values must be >= 0" });
  try {
    let targetUserId = req.authUser.userId;
    let targetUsername = req.authUser.displayName;
    if (req.authUser.role === "admin" && typeof user === "string" && user.trim()) {
      targetUsername = user.trim();
      targetUserId = makeUserId(targetUsername);
    }
    const updatedAt = nowIso();
    await appendSheetRow(GOALS_RANGE, [targetUserId, targetUsername, period, parsedGoals[0], parsedGoals[1], parsedGoals[2], parsedGoals[3], updatedAt, "true"]);
    await logAuditEvent(req.authUser.userId, "goal_update", targetUserId, { period, stepsGoal: parsedGoals[0], distanceGoalKm: parsedGoals[1], caloriesGoal: parsedGoals[2], activeMinutesGoal: parsedGoals[3] });
    res.status(201).json({ userId: targetUserId, username: targetUsername, period, stepsGoal: parsedGoals[0], distanceGoalKm: parsedGoals[1], caloriesGoal: parsedGoals[2], activeMinutesGoal: parsedGoals[3], updatedAt } satisfies GoalsRecord);
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
    if (scopedId === "all") return res.status(400).json({ error: "user query is required when requesting streaks as admin" });
    const workouts = await getWorkoutRecords();
    const activity = (await getActivityRecords(workouts)).filter((entry) => entry.userId === scopedId || entry.username === scopedName);
    const goalsForUser = (await getGoalsRecords()).filter((goal) => goal.userId === scopedId || goal.username === scopedName);
    const activeGoal = goalsForUser.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || ({ userId: scopedId, username: scopedName === "all" ? req.authUser?.displayName || "" : scopedName, period: "daily", stepsGoal: 8000, distanceGoalKm: 5, caloriesGoal: 450, activeMinutesGoal: 45, updatedAt: nowIso() } satisfies GoalsRecord);
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
      if (dayData && isGoalMet(dayData, activeGoal)) currentStreak += 1;
      else break;
      probeDate.setUTCDate(probeDate.getUTCDate() - 1);
    }
    const todayData = byDate.get(todayIsoDate());
    const todayGoalMet = Boolean(todayData && isGoalMet(todayData, activeGoal));
    const atRisk = !todayGoalMet;
    const dailyStatus = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, record]) => ({ date, met: isGoalMet(record, activeGoal) }));
    res.json({ user: activeGoal.username, goal: activeGoal, currentStreak, longestStreak, atRisk, todayGoalMet, dailyStatus });
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
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
*/
