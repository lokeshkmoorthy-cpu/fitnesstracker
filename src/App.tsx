import React, { useEffect, useMemo, useState } from "react";
import { Activity, Calendar, Loader2, TrendingUp } from "lucide-react";
import { Header } from "@/src/components/Header";
import { HowToLog } from "@/src/components/HowToLog";
import { StatCard } from "@/src/components/StatCard";
import { WorkoutChart } from "@/src/components/WorkoutChart";
import { WorkoutTable } from "@/src/components/WorkoutTable";
import { ActivitySection } from "@/src/features/activity/ActivitySection";
import { AuthPanel } from "@/src/features/auth/AuthPanel";
import { FilterPanel } from "@/src/features/dashboard/FilterPanel";
import { FooterInfoModal, type FooterModalKey } from "@/src/features/dashboard/FooterInfoModal";
import { GoalsSection } from "@/src/features/goals/GoalsSection";
import { exportDashboardPdf } from "@/src/features/reporting/exportDashboardPdf";
import { aggregateMuscleGroups, buildWorkoutFilters, filterWorkouts } from "@/src/features/workouts/utils";
import { fitnessApi, setAuthToken } from "@/src/services/api";
import type {
  ActivityDailyRecord,
  AuthUser,
  DashboardFilters,
  GoalsRecord,
  StreaksResponse,
  Workout,
} from "@/src/types/fitness";

const AUTH_TOKEN_KEY = "fitsheet_auth_token";

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activity, setActivity] = useState<ActivityDailyRecord[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalsRecord | null>(null);
  const [streaks, setStreaks] = useState<StreaksResponse | null>(null);
  const [userWiseGoals, setUserWiseGoals] = useState<
    Array<{ username: string; goal: GoalsRecord | null; streaks: StreaksResponse | null }>
  >([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [activeFooterModal, setActiveFooterModal] = useState<FooterModalKey | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    user: "all",
    muscleGroup: "all",
    startDate: "",
    endDate: "",
    search: "",
  });

  const workoutFilterOptions = useMemo(() => buildWorkoutFilters(workouts), [workouts]);
  const filteredWorkouts = useMemo(() => filterWorkouts(workouts, filters), [workouts, filters]);
  const chartData = useMemo(() => aggregateMuscleGroups(filteredWorkouts), [filteredWorkouts]);
  const canSelectUser = authUser?.role === "admin";

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) || "";
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        setAuthToken(token);
        const me = await fitnessApi.me();
        setAuthUser(me.user);
      } catch (error) {
        console.error("Session restore failed:", error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setAuthToken("");
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    setFilters((prev) => ({
      ...prev,
      user: authUser.role === "admin" ? prev.user : authUser.displayName,
    }));
  }, [authUser]);

  const fetchWorkouts = async () => {
    if (!authUser) return;
    setRefreshing(true);
    if (!workouts.length) setLoading(true);
    try {
      const data = await fitnessApi.getWorkouts();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch workouts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authUser) return;
    fetchWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;

    const loadRelatedData = async () => {
      try {
        const userParam = authUser.role === "admin" ? filters.user : authUser.displayName;
        const [dailyActivity, goals] = await Promise.all([
          fitnessApi.getDailyActivity({
            user: userParam,
            from: filters.startDate,
            to: filters.endDate,
          }),
          fitnessApi.getGoals(userParam),
        ]);

        if (cancelled) return;
        setActivity(
          Array.isArray(dailyActivity) ? dailyActivity.sort((a, b) => a.date.localeCompare(b.date)) : []
        );

        if (userParam !== "all") {
          const latestGoal = goals.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
          setSelectedGoal(latestGoal);
          setUserWiseGoals([]);
          const streakData = await fitnessApi.getStreaks(userParam);
          if (!cancelled) setStreaks(streakData);
        } else {
          setSelectedGoal(null);
          setStreaks(null);
          const users = workoutFilterOptions.users;
          const streakResults = await Promise.all(
            users.map(async (username) => {
              try {
                return await fitnessApi.getStreaks(username);
              } catch {
                return null;
              }
            })
          );
          if (!cancelled) {
            const goalGroups = goals.reduce<Record<string, GoalsRecord[]>>((acc, goal) => {
              const key = goal.username || goal.userId;
              if (!acc[key]) acc[key] = [];
              acc[key].push(goal);
              return acc;
            }, {});

            const summaries = users.map((username, index) => {
              const userGoals = (goalGroups[username] || []).sort((a, b) =>
                b.updatedAt.localeCompare(a.updatedAt)
              );
              return {
                username,
                goal: userGoals[0] ?? null,
                streaks: streakResults[index],
              };
            });
            setUserWiseGoals(summaries);
          }
        }
      } catch (error) {
        console.error("Failed to fetch activity/goals/streaks:", error);
      }
    };

    loadRelatedData();
    return () => {
      cancelled = true;
    };
  }, [
    authUser,
    filters.user,
    filters.startDate,
    filters.endDate,
    workoutFilterOptions.users,
  ]);

  const handleLogin = async (payload: { email: string; password: string }) => {
    setAuthSubmitting(true);
    try {
      const response = await fitnessApi.login(payload);
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      setAuthToken(response.token);
      setAuthUser(response.user);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignup = async (payload: {
    email: string;
    password: string;
    displayName: string;
  }) => {
    setAuthSubmitting(true);
    try {
      const response = await fitnessApi.signup(payload);
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      setAuthToken(response.token);
      setAuthUser(response.user);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fitnessApi.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAuthUser(null);
      setAuthToken("");
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setWorkouts([]);
      setActivity([]);
      setSelectedGoal(null);
      setStreaks(null);
      setUserWiseGoals([]);
    }
  };

  const clearFilters = () => {
    setFilters((prev) => ({
      user: canSelectUser ? "all" : authUser?.displayName || prev.user,
      muscleGroup: "all",
      startDate: "",
      endDate: "",
      search: "",
    }));
  };

  const exportReportToPdf = async () => {
    try {
      setExportingPdf(true);
      await exportDashboardPdf({
        filters,
        workouts: filteredWorkouts,
        chartData,
        activity,
        goal: selectedGoal,
        streaks,
      });
    } catch (error) {
      console.error("Failed to export PDF report:", error);
    } finally {
      setExportingPdf(false);
    }
  };

  const saveGoals = async (goal: Omit<GoalsRecord, "userId" | "username" | "updatedAt">) => {
    const targetUser = canSelectUser ? filters.user : authUser?.displayName || "";
    if (!targetUser || targetUser === "all") return;
    try {
      setSavingGoals(true);
      const savedGoal = await fitnessApi.saveGoals({
        user: targetUser,
        period: goal.period,
        stepsGoal: goal.stepsGoal,
        distanceGoalKm: goal.distanceGoalKm,
        caloriesGoal: goal.caloriesGoal,
        activeMinutesGoal: goal.activeMinutesGoal,
      });
      setSelectedGoal(savedGoal);
      const streakData = await fitnessApi.getStreaks(targetUser);
      setStreaks(streakData);
    } catch (error) {
      console.error("Failed to save goals:", error);
    } finally {
      setSavingGoals(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07080D] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#6FFFE9]" />
      </div>
    );
  }

  if (!authUser) {
    return <AuthPanel loading={authSubmitting} onLogin={handleLogin} onSignup={handleSignup} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080D] flex items-center justify-center p-6">
        <div className="w-full max-w-5xl animate-pulse space-y-6">
          <div className="h-16 rounded-2xl bg-slate-800/60 border border-white/10" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-24 rounded-2xl bg-slate-800/60 border border-white/10" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-24 rounded-xl bg-slate-800/60 border border-white/10" />
                <div className="h-24 rounded-xl bg-slate-800/60 border border-white/10" />
                <div className="h-24 rounded-xl bg-slate-800/60 border border-white/10" />
              </div>
              <div className="h-72 rounded-2xl bg-slate-800/60 border border-white/10" />
              <div className="h-56 rounded-2xl bg-slate-800/60 border border-white/10" />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="h-80 rounded-2xl bg-slate-800/60 border border-white/10" />
              <div className="h-44 rounded-2xl bg-slate-800/60 border border-white/10" />
            </div>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-slate-300/70 text-center">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080D] text-slate-100 font-sans selection:bg-cyan-500/60 selection:text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(65,204,255,0.2),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(182,97,255,0.2),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(26,255,168,0.18),transparent_35%)]" />
      <Header onRefresh={fetchWorkouts} refreshing={refreshing} user={authUser} onLogout={handleLogout} />

      <main className="relative max-w-9xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 space-y-6">
          <FilterPanel
            filters={filters}
            users={workoutFilterOptions.users}
            muscleGroups={workoutFilterOptions.muscleGroups}
            canSelectUser={canSelectUser}
            exportingPdf={exportingPdf}
            onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
            onClear={clearFilters}
            onExportPdf={exportReportToPdf}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Visible Workouts" value={filteredWorkouts.length} icon={<Activity className="w-4 h-4" />} />
            <StatCard label="Muscle Groups" value={chartData.length} icon={<TrendingUp className="w-4 h-4" />} />
            <StatCard
              label="Active Days"
              value={new Set(filteredWorkouts.map((workout) => workout.date)).size}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>

          <ActivitySection activity={activity} />
          <WorkoutChart data={chartData} />
          <WorkoutTable workouts={filteredWorkouts} />
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <GoalsSection
            selectedUser={canSelectUser ? filters.user : authUser.displayName}
            goal={selectedGoal}
            streaks={streaks}
            userWiseGoals={userWiseGoals}
            saving={savingGoals}
            onSave={saveGoals}
          />
          <HowToLog />
        </aside>
      </main>

      <FooterInfoModal active={activeFooterModal} onClose={() => setActiveFooterModal(null)} />

      <footer className="relative max-w-7xl mx-auto p-12 border-t border-white/10 mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
          Powered by Goalplay Intern&apos;s Team
        </div>
        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setActiveFooterModal("documentation")}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-cyan-200 transition-colors"
          >
            Documentation
          </button>
          <button
            type="button"
            onClick={() => setActiveFooterModal("privacy")}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-cyan-200 transition-colors"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => setActiveFooterModal("support")}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-cyan-200 transition-colors"
          >
            Support
          </button>
        </div>
      </footer>
    </div>
  );
}
import React, { useEffect, useMemo, useState } from "react";
import { Activity, Calendar, Loader2, TrendingUp } from "lucide-react";
import { Header } from "@/src/components/Header";
import { HowToLog } from "@/src/components/HowToLog";
import { StatCard } from "@/src/components/StatCard";
import { WorkoutChart } from "@/src/components/WorkoutChart";
import { WorkoutTable } from "@/src/components/WorkoutTable";
import { ActivitySection } from "@/src/features/activity/ActivitySection";
import { AuthPanel } from "@/src/features/auth/AuthPanel";
import { FilterPanel } from "@/src/features/dashboard/FilterPanel";
import { FooterInfoModal, type FooterModalKey } from "@/src/features/dashboard/FooterInfoModal";
import { GoalsSection } from "@/src/features/goals/GoalsSection";
import { exportDashboardPdf } from "@/src/features/reporting/exportDashboardPdf";
import { aggregateMuscleGroups, buildWorkoutFilters, filterWorkouts } from "@/src/features/workouts/utils";
import { fitnessApi, setAuthToken } from "@/src/services/api";
import type {
  ActivityDailyRecord,
  AuthUser,
  DashboardFilters,
  GoalsRecord,
  StreaksResponse,
  Workout,
} from "@/src/types/fitness";

const AUTH_TOKEN_KEY = "fitsheet_auth_token";

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activity, setActivity] = useState<ActivityDailyRecord[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalsRecord | null>(null);
  const [streaks, setStreaks] = useState<StreaksResponse | null>(null);
  const [userWiseGoals, setUserWiseGoals] = useState<
    Array<{ username: string; goal: GoalsRecord | null; streaks: StreaksResponse | null }>
  >([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [activeFooterModal, setActiveFooterModal] = useState<FooterModalKey | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    user: "all",
    muscleGroup: "all",
    startDate: "",
    endDate: "",
    search: "",
  });

  const workoutFilterOptions = useMemo(() => buildWorkoutFilters(workouts), [workouts]);
  const filteredWorkouts = useMemo(() => filterWorkouts(workouts, filters), [workouts, filters]);
  const chartData = useMemo(() => aggregateMuscleGroups(filteredWorkouts), [filteredWorkouts]);
  const canSelectUser = authUser?.role === "admin";

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) || "";
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        setAuthToken(token);
        const me = await fitnessApi.me();
        setAuthUser(me.user);
      } catch (error) {
        console.error("Session restore failed:", error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setAuthToken("");
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    setFilters((prev) => ({
      ...prev,
      user: authUser.role === "admin" ? prev.user : authUser.displayName,
    }));
  }, [authUser]);

  const fetchWorkouts = async () => {
    if (!authUser) return;
    setRefreshing(true);
    if (!workouts.length) setLoading(true);
    try {
      const data = await fitnessApi.getWorkouts();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch workouts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authUser) return;
    fetchWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;

    const loadRelatedData = async () => {
      try {
        const userParam = authUser.role === "admin" ? filters.user : authUser.displayName;
        const [dailyActivity, goals] = await Promise.all([
          fitnessApi.getDailyActivity({
            user: userParam,
            from: filters.startDate,
            to: filters.endDate,
          }),
          fitnessApi.getGoals(userParam),
        ]);

        if (cancelled) return;
        setActivity(
          Array.isArray(dailyActivity) ? dailyActivity.sort((a, b) => a.date.localeCompare(b.date)) : []
        );

        if (userParam !== "all") {
          const latestGoal = goals.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
          setSelectedGoal(latestGoal);
          setUserWiseGoals([]);
          const streakData = await fitnessApi.getStreaks(userParam);
          if (!cancelled) setStreaks(streakData);
        } else {
          setSelectedGoal(null);
          setStreaks(null);
          const users = workoutFilterOptions.users;
          const streakResults = await Promise.all(
            users.map(async (username) => {
              try {
                return await fitnessApi.getStreaks(username);
              } catch {
                return null;
              }
            })
          );
          if (!cancelled) {
            const goalGroups = goals.reduce<Record<string, GoalsRecord[]>>((acc, goal) => {
              const key = goal.username || goal.userId;
              if (!acc[key]) acc[key] = [];
              acc[key].push(goal);
              return acc;
            }, {});

            const summaries = users.map((username, index) => {
              const userGoals = (goalGroups[username] || []).sort((a, b) =>
                b.updatedAt.localeCompare(a.updatedAt)
              );
              return {
                username,
                goal: userGoals[0] ?? null,
                streaks: streakResults[index],
              };
            });
            setUserWiseGoals(summaries);
          }
        }
      } catch (error) {
        console.error("Failed to fetch activity/goals/streaks:", error);
      }
    };

    loadRelatedData();
    return () => {
      cancelled = true;
    };
  }, [
    authUser,
    filters.user,
    filters.startDate,
    filters.endDate,
    workoutFilterOptions.users,
  ]);

  const handleLogin = async (payload: { email: string; password: string }) => {
    setAuthSubmitting(true);
    try {
      const response = await fitnessApi.login(payload);
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      setAuthToken(response.token);
      setAuthUser(response.user);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignup = async (payload: {
    email: string;
    password: string;
    displayName: string;
  }) => {
    setAuthSubmitting(true);
    try {
      const response = await fitnessApi.signup(payload);
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      setAuthToken(response.token);
      setAuthUser(response.user);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fitnessApi.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAuthUser(null);
      setAuthToken("");
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setWorkouts([]);
      setActivity([]);
      setSelectedGoal(null);
      setStreaks(null);
      setUserWiseGoals([]);
    }
  };

  const clearFilters = () => {
    setFilters((prev) => ({
      user: canSelectUser ? "all" : authUser?.displayName || prev.user,
      muscleGroup: "all",
      startDate: "",
      endDate: "",
      search: "",
    }));
  };

  const exportReportToPdf = async () => {
    try {
      setExportingPdf(true);
      await exportDashboardPdf({
        filters,
        workouts: filteredWorkouts,
        chartData,
        activity,
        goal: selectedGoal,
        streaks,
      });
    } catch (error) {
      console.error("Failed to export PDF report:", error);
    } finally {
      setExportingPdf(false);
    }
  };

  const saveGoals = async (goal: Omit<GoalsRecord, "userId" | "username" | "updatedAt">) => {
    const targetUser = canSelectUser ? filters.user : authUser?.displayName || "";
    if (!targetUser || targetUser === "all") return;
    try {
      setSavingGoals(true);
      const savedGoal = await fitnessApi.saveGoals({
        user: targetUser,
        period: goal.period,
        stepsGoal: goal.stepsGoal,
        distanceGoalKm: goal.distanceGoalKm,
        caloriesGoal: goal.caloriesGoal,
        activeMinutesGoal: goal.activeMinutesGoal,
      });
      setSelectedGoal(savedGoal);
      const streakData = await fitnessApi.getStreaks(targetUser);
      setStreaks(streakData);
    } catch (error) {
      console.error("Failed to save goals:", error);
    } finally {
      setSavingGoals(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07080D] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#6FFFE9]" />
      </div>
    );
  }

  if (!authUser) {
    return <AuthPanel loading={authSubmitting} onLogin={handleLogin} onSignup={handleSignup} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080D] flex items-center justify-center p-6">
        <div className="w-full max-w-5xl animate-pulse space-y-6">
          <div className="h-16 rounded-2xl bg-slate-800/60 border border-white/10" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-24 rounded-2xl bg-slate-800/60 border border-white/10" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-24 rounded-xl bg-slate-800/60 border border-white/10" />
                <div className="h-24 rounded-xl bg-slate-800/60 border border-white/10" />
                <div className="h-24 rounded-xl bg-slate-800/60 border border-white/10" />
              </div>
              <div className="h-72 rounded-2xl bg-slate-800/60 border border-white/10" />
              <div className="h-56 rounded-2xl bg-slate-800/60 border border-white/10" />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="h-80 rounded-2xl bg-slate-800/60 border border-white/10" />
              <div className="h-44 rounded-2xl bg-slate-800/60 border border-white/10" />
            </div>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-slate-300/70 text-center">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080D] text-slate-100 font-sans selection:bg-cyan-500/60 selection:text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(65,204,255,0.2),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(182,97,255,0.2),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(26,255,168,0.18),transparent_35%)]" />
      <Header onRefresh={fetchWorkouts} refreshing={refreshing} user={authUser} onLogout={handleLogout} />

      <main className="relative max-w-9xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 space-y-6">
          <FilterPanel
            filters={filters}
            users={workoutFilterOptions.users}
            muscleGroups={workoutFilterOptions.muscleGroups}
            canSelectUser={canSelectUser}
            exportingPdf={exportingPdf}
            onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
            onClear={clearFilters}
            onExportPdf={exportReportToPdf}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Visible Workouts" value={filteredWorkouts.length} icon={<Activity className="w-4 h-4" />} />
            <StatCard label="Muscle Groups" value={chartData.length} icon={<TrendingUp className="w-4 h-4" />} />
            <StatCard
              label="Active Days"
              value={new Set(filteredWorkouts.map((workout) => workout.date)).size}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>

          <ActivitySection activity={activity} />
          <WorkoutChart data={chartData} />
          <WorkoutTable workouts={filteredWorkouts} />
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <GoalsSection
            selectedUser={canSelectUser ? filters.user : authUser.displayName}
            goal={selectedGoal}
            streaks={streaks}
            userWiseGoals={userWiseGoals}
            saving={savingGoals}
            onSave={saveGoals}
          />
          <HowToLog />
        </aside>
      </main>

      <FooterInfoModal active={activeFooterModal} onClose={() => setActiveFooterModal(null)} />

      <footer className="relative max-w-7xl mx-auto p-12 border-t border-white/10 mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
          Powered by Goalplay Intern&apos;s Team
        </div>
        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setActiveFooterModal("documentation")}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-cyan-200 transition-colors"
          >
            Documentation
          </button>
          <button
            type="button"
            onClick={() => setActiveFooterModal("privacy")}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-cyan-200 transition-colors"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => setActiveFooterModal("support")}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-cyan-200 transition-colors"
          >
            Support
          </button>
        </div>
      </footer>
    </div>
  );
}
import React, { useEffect, useMemo, useState } from "react";
import { Activity, Calendar, Loader2, TrendingUp } from "lucide-react";
import { Header } from "@/src/components/Header";
import { HowToLog } from "@/src/components/HowToLog";
import { StatCard } from "@/src/components/StatCard";
import { WorkoutChart } from "@/src/components/WorkoutChart";
import { WorkoutTable } from "@/src/components/WorkoutTable";
import { ActivitySection } from "@/src/features/activity/ActivitySection";
import { FilterPanel } from "@/src/features/dashboard/FilterPanel";
import { FooterInfoModal, type FooterModalKey } from "@/src/features/dashboard/FooterInfoModal";
import { GoalsSection } from "@/src/features/goals/GoalsSection";
import { exportDashboardPdf } from "@/src/features/reporting/exportDashboardPdf";
import { aggregateMuscleGroups, buildWorkoutFilters, filterWorkouts } from "@/src/features/workouts/utils";
import { fitnessApi } from "@/src/services/api";
import type {
  ActivityDailyRecord,
  DashboardFilters,
  GoalsRecord,
  StreaksResponse,
  Workout,
} from "@/src/types/fitness";

export default function App() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activity, setActivity] = useState<ActivityDailyRecord[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalsRecord | null>(null);
  const [streaks, setStreaks] = useState<StreaksResponse | null>(null);
  const [userWiseGoals, setUserWiseGoals] = useState<
    Array<{ username: string; goal: GoalsRecord | null; streaks: StreaksResponse | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [activeFooterModal, setActiveFooterModal] = useState<FooterModalKey | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    user: "all",
    muscleGroup: "all",
    startDate: "",
    endDate: "",
    search: "",
  });

  const workoutFilterOptions = useMemo(() => buildWorkoutFilters(workouts), [workouts]);
  const filteredWorkouts = useMemo(() => filterWorkouts(workouts, filters), [workouts, filters]);
  const chartData = useMemo(() => aggregateMuscleGroups(filteredWorkouts), [filteredWorkouts]);

  const fetchWorkouts = async () => {
    setRefreshing(true);
    try {
      const data = await fitnessApi.getWorkouts();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch workouts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRelatedData = async () => {
      try {
        const [dailyActivity, goals] = await Promise.all([
          fitnessApi.getDailyActivity({
            user: filters.user,
            from: filters.startDate,
            to: filters.endDate,
          }),
          fitnessApi.getGoals(filters.user),
        ]);

        if (cancelled) return;
        setActivity(Array.isArray(dailyActivity) ? dailyActivity.sort((a, b) => a.date.localeCompare(b.date)) : []);

        if (filters.user !== "all") {
          const latestGoal = goals.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
          setSelectedGoal(latestGoal);
          setUserWiseGoals([]);
          const streakData = await fitnessApi.getStreaks(filters.user);
          if (!cancelled) setStreaks(streakData);
        } else {
          setSelectedGoal(null);
          setStreaks(null);
          const users = workoutFilterOptions.users;
          const streakResults = await Promise.all(
            users.map(async (username) => {
              try {
                return await fitnessApi.getStreaks(username);
              } catch {
                return null;
              }
            })
          );
          if (!cancelled) {
            const goalGroups = goals.reduce<Record<string, GoalsRecord[]>>((acc, goal) => {
              const key = goal.username || goal.userId;
              if (!acc[key]) acc[key] = [];
              acc[key].push(goal);
              return acc;
            }, {});

            const summaries = users.map((username, index) => {
              const userGoals = (goalGroups[username] || []).sort((a, b) =>
                b.updatedAt.localeCompare(a.updatedAt)
              );
              return {
                username,
                goal: userGoals[0] ?? null,
                streaks: streakResults[index],
              };
            });
            setUserWiseGoals(summaries);
          }
        }
      } catch (error) {
        console.error("Failed to fetch activity/goals/streaks:", error);
      }
    };

    loadRelatedData();
    return () => {
      cancelled = true;
    };
  }, [filters.user, filters.startDate, filters.endDate, workoutFilterOptions.users]);

  const clearFilters = () => {
    setFilters({
      user: "all",
      muscleGroup: "all",
      startDate: "",
      endDate: "",
      search: "",
    });
  };

  const exportReportToPdf = async () => {
    try {
      setExportingPdf(true);
      await exportDashboardPdf({
        filters,
        workouts: filteredWorkouts,
        chartData,
        activity,
        goal: selectedGoal,
        streaks,
      });
    } catch (error) {
      console.error("Failed to export PDF report:", error);
    } finally {
      setExportingPdf(false);
    }
  };

  const saveGoals = async (goal: Omit<GoalsRecord, "userId" | "username" | "updatedAt">) => {
    if (filters.user === "all") return;
    try {
      setSavingGoals(true);
      const savedGoal = await fitnessApi.saveGoals({
        user: filters.user,
        period: goal.period,
        stepsGoal: goal.stepsGoal,
        distanceGoalKm: goal.distanceGoalKm,
        caloriesGoal: goal.caloriesGoal,
        activeMinutesGoal: goal.activeMinutesGoal,
      });
      setSelectedGoal(savedGoal);
      const streakData = await fitnessApi.getStreaks(filters.user);
      setStreaks(streakData);
    } catch (error) {
      console.error("Failed to save goals:", error);
    } finally {
      setSavingGoals(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080D] flex items-center justify-center p-6">
        <div className="w-full max-w-5xl animate-pulse space-y-6">
          <div className="h-16 rounded-2xl bg-slate-800/60 border border-white/10" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-24 rounded-2xl bg-slate-800/60 border border-white/10" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-24 rounded-xl bg-slate-800/60 border border-white/10" />
                <div className="h-24 rounded-xl bg-slate-800/60 border border-white/10" />
                <div className="h-24 rounded-xl bg-slate-800/60 border border-white/10" />
              </div>
              <div className="h-72 rounded-2xl bg-slate-800/60 border border-white/10" />
              <div className="h-56 rounded-2xl bg-slate-800/60 border border-white/10" />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="h-80 rounded-2xl bg-slate-800/60 border border-white/10" />
              <div className="h-44 rounded-2xl bg-slate-800/60 border border-white/10" />
            </div>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-slate-300/70 text-center">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080D] text-slate-100 font-sans selection:bg-cyan-500/60 selection:text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(65,204,255,0.2),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(182,97,255,0.2),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(26,255,168,0.18),transparent_35%)]" />
      <Header onRefresh={fetchWorkouts} refreshing={refreshing} />

      <main className="relative max-w-9xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 space-y-6">
          <FilterPanel
            filters={filters}
            users={workoutFilterOptions.users}
            muscleGroups={workoutFilterOptions.muscleGroups}
            exportingPdf={exportingPdf}
            onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
            onClear={clearFilters}
            onExportPdf={exportReportToPdf}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Visible Workouts" value={filteredWorkouts.length} icon={<Activity className="w-4 h-4" />} />
            <StatCard label="Muscle Groups" value={chartData.length} icon={<TrendingUp className="w-4 h-4" />} />
            <StatCard
              label="Active Days"
              value={new Set(filteredWorkouts.map((workout) => workout.date)).size}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>

          <ActivitySection activity={activity} />
          <WorkoutChart data={chartData} />
          <WorkoutTable workouts={filteredWorkouts} />
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <GoalsSection
            selectedUser={filters.user}
            goal={selectedGoal}
            streaks={streaks}
            userWiseGoals={userWiseGoals}
            saving={savingGoals}
            onSave={saveGoals}
          />
          <HowToLog />
        </aside>
      </main>

      <FooterInfoModal active={activeFooterModal} onClose={() => setActiveFooterModal(null)} />

      <footer className="relative max-w-7xl mx-auto p-12 border-t border-white/10 mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
          Powered by Goalplay Intern&apos;s Team
        </div>
        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setActiveFooterModal("documentation")}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-cyan-200 transition-colors"
          >
            Documentation
          </button>
          <button
            type="button"
            onClick={() => setActiveFooterModal("privacy")}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-cyan-200 transition-colors"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => setActiveFooterModal("support")}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-cyan-200 transition-colors"
          >
            Support
          </button>
        </div>
      </footer>
    </div>
  );
}
