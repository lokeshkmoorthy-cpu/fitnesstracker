export interface Workout {
  userId: string;
  username: string;
  date: string;
  musclegroup: string;
  exercises: string;
  setsreps: string;
  notes: string;
}

export interface AttendanceRecord {
  name: string;
  date: string;
  time: string;
  day: string;
  userId: string;
  chatId: string;
}

export interface ActivityDailyRecord {
  userId: string;
  username: string;
  date: string;
  steps: number;
  distanceKm: number;
  calories: number;
  activeMinutes: number;
  notes: string;
}

export interface GoalsRecord {
  goalId: string;
  userId: string;
  username: string;
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
  updatedAt: string;
}

export interface StreakDayStatus {
  date: string;
  met: boolean;
}

export interface StreaksResponse {
  user: string;
  goals: GoalsRecord[];
  goalStatuses: Array<{ goalId: string; goalName: string; met: boolean }>;
  currentStreak: number;
  longestStreak: number;
  atRisk: boolean;
  todayGoalMet: boolean;
  dailyStatus: StreakDayStatus[];
}

export interface DashboardFilters {
  user: string;
  muscleGroup: string;
  startDate: string;
  endDate: string;
  search: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface BotCommand {
  command: string;
  response: string;
  updatedAt: string;
}

export type MotivationQuoteLanguage = "ta" | "en" | "fr";

export interface MotivationQuote {
  quote: string;
  author: string;
  language: MotivationQuoteLanguage;
}