import React, { useEffect, useMemo, useState, useRef } from "react";
import { Activity, Calendar, Loader2, Flame, Zap, Bolt } from "lucide-react";
import { Sidebar } from "@/src/components/Sidebar";
import { TopBar } from "@/src/components/TopBar";
import { DashboardHero } from "@/src/components/DashboardHero";
import { GoalProgressCard } from "@/src/components/GoalProgressCard";
import { HelpModal } from "@/src/components/HelpModal";
import { StatCard } from "@/src/components/StatCard";
import { WorkoutChart } from "@/src/components/WorkoutChart";
import { WorkoutTable } from "@/src/components/WorkoutTable";
import { ActivitySection } from "@/src/features/activity/ActivitySection";
import { AuthPanel } from "@/src/features/auth/AuthPanel";
import { FilterPanel } from "@/src/features/dashboard/FilterPanel";
import { FooterInfoModal, type FooterModalKey } from "@/src/features/dashboard/FooterInfoModal";
import { GoalsSection, type GoalEditorValues } from "@/src/features/goals/GoalsSection";
import { MapsView } from "@/src/features/maps/MapsView";
import { ScheduleView } from "@/src/features/schedule/ScheduleView";
import { AdminConsoleModal } from "@/src/components/AdminConsoleModal";
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

export default function AppMain() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activity, setActivity] = useState<ActivityDailyRecord[]>([]);
  const [goals, setGoals] = useState<GoalsRecord[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [streaks, setStreaks] = useState<StreaksResponse | null>(null);
  const [userWiseGoals, setUserWiseGoals] = useState<
    Array<{ username: string; goals: GoalsRecord[]; streaks: StreaksResponse | null }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [activeFooterModal, setActiveFooterModal] = useState<FooterModalKey | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    user: "all",
    muscleGroup: "all",
    startDate: "",
    endDate: "",
    search: "",
  });

  const [activeTab, setActiveTab] = useState("dashboard");

  const goalsSectionRef = useRef<HTMLDivElement>(null);

  const openAdminConsole = () => {
    setIsAdminModalOpen(true);
  };

  const scrollToGoals = () => {
    goalsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const workoutFilterOptions = useMemo(() => buildWorkoutFilters(workouts), [workouts]);
  const filteredWorkouts = useMemo(() => filterWorkouts(workouts, filters), [workouts, filters]);
  const chartData = useMemo(() => aggregateMuscleGroups(filteredWorkouts), [filteredWorkouts]);
  const selectedGoal = useMemo(
    () => goals.find((goal) => goal.goalId === selectedGoalId) ?? goals[0] ?? null,
    [goals, selectedGoalId]
  );
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
      } catch {
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
    const load = async () => {
      const userParam = authUser.role === "admin" ? filters.user : authUser.displayName;
      try {
        const [dailyActivity, goals] = await Promise.all([
          fitnessApi.getDailyActivity({ user: userParam, from: filters.startDate, to: filters.endDate }),
          fitnessApi.getGoals(userParam),
        ]);
        if (cancelled) return;
        setActivity(Array.isArray(dailyActivity) ? dailyActivity.sort((a, b) => a.date.localeCompare(b.date)) : []);
        if (userParam !== "all") {
          const sortedGoals = [...goals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          setGoals(sortedGoals);
          setSelectedGoalId((prev) =>
            prev && sortedGoals.some((goal) => goal.goalId === prev) ? prev : (sortedGoals[0]?.goalId ?? null)
          );
          setUserWiseGoals([]);
          setStreaks(await fitnessApi.getStreaks(userParam));
        } else {
          setGoals([]);
          setSelectedGoalId(null);
          setStreaks(null);
          const users = workoutFilterOptions.users;
          const streakResults = await Promise.all(users.map((username) => fitnessApi.getStreaks(username).catch(() => null)));
          const grouped = goals.reduce<Record<string, GoalsRecord[]>>((acc, goal) => {
            const key = goal.username || goal.userId;
            if (!acc[key]) acc[key] = [];
            acc[key].push(goal);
            return acc;
          }, {});
          if (!cancelled) {
            setUserWiseGoals(
              users.map((username, index) => ({
                username,
                goals: (grouped[username] || []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
                streaks: streakResults[index],
              }))
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch related dashboard data:", error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [authUser, filters.user, filters.startDate, filters.endDate, workoutFilterOptions.users]);

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

  const handleSignup = async (payload: { email: string; password: string; displayName: string }) => {
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
    } catch {
      // ignore logout errors, clear client state anyway
    } finally {
      setAuthToken("");
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setAuthUser(null);
      setWorkouts([]);
      setActivity([]);
      setGoals([]);
      setSelectedGoalId(null);
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
    setExportingPdf(true);
    try {
      await exportDashboardPdf({
        filters,
        workouts: filteredWorkouts,
        chartData,
        activity,
        goal: selectedGoal,
        streaks,
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const refreshGoalsAndStreaks = async (targetUser: string) => {
    const [nextGoals, nextStreaks] = await Promise.all([
      fitnessApi.getGoals(targetUser),
      fitnessApi.getStreaks(targetUser),
    ]);
    const sortedGoals = [...nextGoals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setGoals(sortedGoals);
    setSelectedGoalId((prev) =>
      prev && sortedGoals.some((goal) => goal.goalId === prev) ? prev : (sortedGoals[0]?.goalId ?? null)
    );
    setStreaks(nextStreaks);
  };

  const createGoal = async (goal: GoalEditorValues) => {
    const targetUser = canSelectUser ? filters.user : authUser?.displayName || "";
    if (!targetUser || targetUser === "all") return;
    setSavingGoals(true);
    try {
      await fitnessApi.createGoal({
        user: targetUser,
        goalName: goal.goalName,
        period: goal.period,
        stepsGoal: goal.stepsGoal,
        distanceGoalKm: goal.distanceGoalKm,
        caloriesGoal: goal.caloriesGoal,
        activeMinutesGoal: goal.activeMinutesGoal,
        isActive: goal.isActive,
      });
      await refreshGoalsAndStreaks(targetUser);
    } finally {
      setSavingGoals(false);
    }
  };

  const updateGoal = async (goalId: string, goal: GoalEditorValues) => {
    const targetUser = canSelectUser ? filters.user : authUser?.displayName || "";
    if (!targetUser || targetUser === "all") return;
    setSavingGoals(true);
    try {
      await fitnessApi.updateGoal(goalId, goal);
      await refreshGoalsAndStreaks(targetUser);
      setSelectedGoalId(goalId);
    } finally {
      setSavingGoals(false);
    }
  };

  const deleteGoal = async (goalId: string) => {
    const targetUser = canSelectUser ? filters.user : authUser?.displayName || "";
    if (!targetUser || targetUser === "all") return;
    setSavingGoals(true);
    try {
      await fitnessApi.deleteGoal(goalId);
      await refreshGoalsAndStreaks(targetUser);
    } finally {
      setSavingGoals(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!authUser) {
    return <AuthPanel loading={authSubmitting} onLogin={handleLogin} onSignup={handleSignup} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl animate-pulse space-y-8">
          <div className="h-20 bg-white dark:bg-white/5 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-white dark:bg-white/5 rounded-3xl" />
            <div className="h-48 bg-white dark:bg-white/5 rounded-3xl" />
          </div>
          <div className="h-96 bg-white dark:bg-white/5 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-950 flex font-sans overflow-x-hidden transition-colors">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="metro-scatter" />
      </div>

      <Sidebar
        user={authUser}
        onRefresh={fetchWorkouts}
        refreshing={refreshing}
        onLogout={handleLogout}
        onHelp={() => setIsHelpModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        activeItem={activeTab}
        onNavigate={setActiveTab}
      />

      <main className="flex-1 relative z-10 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <TopBar
          title={
            activeTab === "dashboard" ? "Dashboard" :
            activeTab === "activity" ? "Activity" :
            activeTab === "maps" ? "Maps" :
            activeTab === "schedule" ? "Schedule" :
            activeTab === "goals" ? "Goals" : "Dashboard"
          }
          onRefresh={fetchWorkouts}
          refreshing={refreshing}
        />

        {activeTab === "dashboard" && (
          <>
            <DashboardHero
              userName={authUser.displayName}
              onAddClick={openAdminConsole}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                label="Total Exercises"
                value={filteredWorkouts.length}
                icon={<Activity className="w-5 h-5" />}
                trend="+12%"
                subtitle="From last week"
              />
              <StatCard
                label="Active Time"
                value={`${Math.round(filteredWorkouts.length * 0.75)}h`}
                icon={<Flame className="w-5 h-5" />}
                trend="+5%"
                subtitle="Total activity"
              />
              <StatCard
                label="Workout Days"
                value={new Set(filteredWorkouts.map((w) => w.date)).size}
                icon={<Zap className="w-5 h-5" />}
                trend="+2"
                subtitle="Consistency"
              />
            </div>

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

            <WorkoutChart data={chartData} />

            <WorkoutTable
              workouts={filteredWorkouts}
              searchQuery={filters.search}
              onSearchChange={(search) => setFilters(p => ({ ...p, search }))}
              filterValue={filters.muscleGroup}
              onFilterChange={(muscleGroup) => setFilters(p => ({ ...p, muscleGroup }))}
            />

            <ActivitySection activity={activity} />
          </div>

          <div className="lg:col-span-4 space-y-8">
            <GoalProgressCard
              current={activity.reduce((sum, day) => sum + (day.steps || 0), 0)}
              total={selectedGoal?.stepsGoal || 10000}
              label=" Steps"
              onSetGoalClick={scrollToGoals}
            />

            <div ref={goalsSectionRef} className="scroll-mt-8">
              <GoalsSection
                selectedUser={canSelectUser ? filters.user : authUser.displayName}
                goals={goals}
                selectedGoalId={selectedGoalId}
                streaks={streaks}
                userWiseGoals={userWiseGoals}
                saving={savingGoals}
                onSelectGoal={setSelectedGoalId}
                onCreate={createGoal}
                onUpdate={updateGoal}
                onDelete={deleteGoal}
              />
            </div>
          </div>
        </div>
        </>
        )}

        {activeTab === "activity" && (
          <div className="mt-8 space-y-8">
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
            <ActivitySection activity={activity} />
          </div>
        )}

        {activeTab === "maps" && (
          <div className="mt-8">
            <MapsView />
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="mt-8">
            <ScheduleView />
          </div>
        )}

        {activeTab === "goals" && (
          <div className="mt-8 space-y-8">
            <GoalProgressCard
              current={activity.reduce((sum, day) => sum + (day.steps || 0), 0)}
              total={selectedGoal?.stepsGoal || 10000}
              label=" Steps"
              onSetGoalClick={scrollToGoals}
            />
            <GoalsSection
              selectedUser={canSelectUser ? filters.user : authUser.displayName}
              goals={goals}
              selectedGoalId={selectedGoalId}
              streaks={streaks}
              userWiseGoals={userWiseGoals}
              saving={savingGoals}
              onSelectGoal={setSelectedGoalId}
              onCreate={createGoal}
              onUpdate={updateGoal}
              onDelete={deleteGoal}
            />
          </div>
        )}

        <footer className="mt-20 pt-12 border-t border-slate-100 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 pb-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Bolt className="w-4 h-4 text-white fill-white/20" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Fit Tracker Dashboard</span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Powered by Fitness Intelligence Team
          </p>
          <div className="flex gap-8">
            <button onClick={() => setActiveFooterModal("documentation")} className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-colors">Docs</button>
            <button onClick={() => setActiveFooterModal("privacy")} className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-colors">Privacy</button>
            <button onClick={() => setActiveFooterModal("support")} className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-colors">Support</button>
          </div>
        </footer>
      </main>

      <FooterInfoModal active={activeFooterModal} onClose={() => setActiveFooterModal(null)} />
      <AdminConsoleModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}
