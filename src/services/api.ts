import type {
  ActivityDailyRecord,
  AttendanceRecord,
  AuthResponse,
  AuthUser,
  MotivationQuote,
  GoalsRecord,
  StreaksResponse,
  Workout,
} from "@/src/types/fitness";

interface GoalPayload {
  user: string;
  goalName: string;
  period: "daily" | "weekly";
  stepsGoal: number;
  distanceGoalKm: number;
  caloriesGoal: number;
  activeMinutesGoal: number;
  description?: string;
  targetValue?: number;
  targetUnit?: string;
  isActive: boolean;
}

interface GoalUpdatePayload {
  goalName: string;
  period: "daily" | "weekly";
  stepsGoal: number;
  distanceGoalKm: number;
  caloriesGoal: number;
  activeMinutesGoal: number;
  description?: string;
  targetValue?: number;
  targetUnit?: string;
  isActive: boolean;
}

interface SignupPayload {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

let authToken = "";

export const setAuthToken = (token: string) => {
  authToken = token;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const fitnessApi = {
  signup: (payload: SignupPayload) =>
    fetchJson<AuthResponse>("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  login: (payload: LoginPayload) =>
    fetchJson<AuthResponse>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  logout: () =>
    fetchJson<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
    }),
  me: () => fetchJson<{ user: AuthUser }>("/api/auth/me"),
  getAdminUsers: () => fetchJson<AuthUser[]>("/api/admin/users"),
  getWorkouts: () => fetchJson<Workout[]>("/api/workouts"),
  getDailyActivity: (params: { user?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params.user) query.set("user", params.user);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    return fetchJson<ActivityDailyRecord[]>(`/api/activity/daily?${query.toString()}`);
  },
  getAttendance: (params: { user?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params.user) query.set("user", params.user);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    return fetchJson<AttendanceRecord[]>(`/api/attendance?${query.toString()}`);
  },
  getGoals: (user: string) => fetchJson<GoalsRecord[]>(`/api/goals?user=${encodeURIComponent(user)}`),
  createGoal: (payload: GoalPayload) =>
    fetchJson<GoalsRecord>("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateGoal: (goalId: string, payload: GoalUpdatePayload) =>
    fetchJson<GoalsRecord>(`/api/goals/${encodeURIComponent(goalId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteGoal: (goalId: string) =>
    fetchJson<{ success: boolean }>(`/api/goals/${encodeURIComponent(goalId)}`, {
      method: "DELETE",
    }),
  getStreaks: (user: string) =>
    fetchJson<StreaksResponse>(`/api/streaks?user=${encodeURIComponent(user)}`),
  getMotivationQuotes: () => fetchJson<MotivationQuote[]>("/api/motivation-quotes"),
  getBotCommands: () => fetchJson<import("@/src/types/fitness").BotCommand[]>("/api/bot-commands"),
  updateBotCommand: (command: string, response: string) =>
    fetchJson<{ success: boolean }>(`/api/bot-commands/${encodeURIComponent(command)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    }),
};