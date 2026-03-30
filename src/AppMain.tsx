import React, { useEffect, useMemo, useState, useRef } from "react";
import { Activity, Loader2, Flame, Zap } from "lucide-react";
import { ActivityTrendChart } from "@/src/features/activity/ActivityTrendChart";
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

  const openAdminConsole = () => setIsAdminModalOpen(true);
  const scrollToGoals = () => goalsSectionRef.current?.scrollIntoView({ behavior: "smooth" });

  const workoutFilterOptions = useMemo(() => buildWorkoutFilters(workouts), [workouts]);
  const filteredWorkouts = useMemo(() => filterWorkouts(workouts, filters), [workouts, filters]);
  const chartData = useMemo(() => aggregateMuscleGroups(filteredWorkouts), [filteredWorkouts]);
  const selectedGoal = useMemo(
    () => goals.find((g) => g.goalId === selectedGoalId) ?? goals[0] ?? null,
    [goals, selectedGoalId]
  );
  const canSelectUser = authUser?.role === "admin";

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) || "";
      if (!token) { setAuthLoading(false); return; }
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
        const [dailyActivity, goalsData] = await Promise.all([
          fitnessApi.getDailyActivity({ user: userParam, from: filters.startDate, to: filters.endDate }),
          fitnessApi.getGoals(userParam),
        ]);
        if (cancelled) return;
        setActivity(Array.isArray(dailyActivity) ? dailyActivity.sort((a, b) => a.date.localeCompare(b.date)) : []);
        if (userParam !== "all") {
          const sorted = [...goalsData].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          setGoals(sorted);
          setSelectedGoalId((prev) => prev && sorted.some((g) => g.goalId === prev) ? prev : (sorted[0]?.goalId ?? null));
          setUserWiseGoals([]);
          setStreaks(await fitnessApi.getStreaks(userParam));
        } else {
          setGoals([]);
          setSelectedGoalId(null);
          setStreaks(null);
          const users = workoutFilterOptions.users;
          const streakResults = await Promise.all(users.map((u) => fitnessApi.getStreaks(u).catch(() => null)));
          const grouped = goalsData.reduce<Record<string, GoalsRecord[]>>((acc, g) => {
            const key = g.username || g.userId;
            if (!acc[key]) acc[key] = [];
            acc[key].push(g);
            return acc;
          }, {});
          if (!cancelled) {
            setUserWiseGoals(users.map((username, i) => ({
              username,
              goals: (grouped[username] || []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
              streaks: streakResults[i],
            })));
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [authUser, filters.user, filters.startDate, filters.endDate, workoutFilterOptions.users]);

  const handleLogin = async (payload: { email: string; password: string }) => {
    setAuthSubmitting(true);
    try {
      const res = await fitnessApi.login(payload);
      localStorage.setItem(AUTH_TOKEN_KEY, res.token);
      setAuthToken(res.token);
      setAuthUser(res.user);
    } finally { setAuthSubmitting(false); }
  };

  const handleSignup = async (payload: { email: string; password: string; displayName: string }) => {
    setAuthSubmitting(true);
    try {
      const res = await fitnessApi.signup(payload);
      localStorage.setItem(AUTH_TOKEN_KEY, res.token);
      setAuthToken(res.token);
      setAuthUser(res.user);
    } finally { setAuthSubmitting(false); }
  };

  const handleLogout = async () => {
    try { await fitnessApi.logout(); } catch { /* ignore */ } finally {
      setAuthToken("");
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setAuthUser(null);
      setWorkouts([]); setActivity([]); setGoals([]);
      setSelectedGoalId(null); setStreaks(null); setUserWiseGoals([]);
    }
  };

  const clearFilters = () => setFilters((prev) => ({
    user: canSelectUser ? "all" : authUser?.displayName || prev.user,
    muscleGroup: "all", startDate: "", endDate: "", search: "",
  }));

  const exportReportToPdf = async () => {
    setExportingPdf(true);
    try {
      await exportDashboardPdf({ filters, workouts: filteredWorkouts, chartData, activity, goal: selectedGoal, streaks });
    } finally { setExportingPdf(false); }
  };

  const refreshGoalsAndStreaks = async (targetUser: string) => {
    const [nextGoals, nextStreaks] = await Promise.all([fitnessApi.getGoals(targetUser), fitnessApi.getStreaks(targetUser)]);
    const sorted = [...nextGoals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setGoals(sorted);
    setSelectedGoalId((prev) => prev && sorted.some((g) => g.goalId === prev) ? prev : (sorted[0]?.goalId ?? null));
    setStreaks(nextStreaks);
  };

  const createGoal = async (goal: GoalEditorValues) => {
    const targetUser = canSelectUser ? filters.user : authUser?.displayName || "";
    if (!targetUser || targetUser === "all") return;
    setSavingGoals(true);
    try {
      await fitnessApi.createGoal({ user: targetUser, ...goal });
      await refreshGoalsAndStreaks(targetUser);
    } finally { setSavingGoals(false); }
  };

  const updateGoal = async (goalId: string, goal: GoalEditorValues) => {
    const targetUser = canSelectUser ? filters.user : authUser?.displayName || "";
    if (!targetUser || targetUser === "all") return;
    setSavingGoals(true);
    try {
      await fitnessApi.updateGoal(goalId, goal);
      await refreshGoalsAndStreaks(targetUser);
      setSelectedGoalId(goalId);
    } finally { setSavingGoals(false); }
  };

  const deleteGoal = async (goalId: string) => {
    const targetUser = canSelectUser ? filters.user : authUser?.displayName || "";
    if (!targetUser || targetUser === "all") return;
    setSavingGoals(true);
    try {
      await fitnessApi.deleteGoal(goalId);
      await refreshGoalsAndStreaks(targetUser);
    } finally { setSavingGoals(false); }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!authUser) {
    return <AuthPanel loading={authSubmitting} onLogin={handleLogin} onSignup={handleSignup} />;
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#f8f9fa] dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    /* ── ROOT: locked to viewport, no scroll ── */
    <div className="h-screen overflow-hidden bg-[#f5f6fa] dark:bg-slate-950 flex font-sans transition-colors">

      {/* ── SIDEBAR ── */}
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

      {/* ── MAIN CONTENT: fills remaining width, full height, no scroll ── */}
      <main className="flex-1 h-full flex flex-col overflow-y-auto px-5 pt-3 pb-12 scrollbar-custom">

        {/* Top bar — compact */}
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

        {/* ═══════════════ DASHBOARD TAB ═══════════════ */}
        {activeTab === "dashboard" && (
          <div
            className="flex-1 grid gap-3"
            style={{ gridTemplateColumns: "1fr 260px", gridTemplateRows: "auto auto auto" }}
          >
            {/* Row 1 Left — greeting + 3 stat cards */}
            <div className="flex flex-col gap-2">
              <DashboardHero userName={authUser.displayName} onAddClick={openAdminConsole} />
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Total Exercises" value={filteredWorkouts.length}
                  icon={<Activity className="w-5 h-5" />} trend="+12%" subtitle="From last week" />
                <StatCard label="Active Time" value={`${Math.round(filteredWorkouts.length * 0.75)}h`}
                  icon={<Flame className="w-5 h-5" />} trend="+5%" subtitle="Total activity" />
                <StatCard label="Workout Days" value={new Set(filteredWorkouts.map((w) => w.date)).size}
                  icon={<Zap className="w-5 h-5" />} trend="+2" subtitle="Consistency" />
              </div>
            </div>

            {/* Row 1+2 Right — Goal card spans 2 rows */}
            <div className="row-span-2">
              <GoalProgressCard
                current={activity.reduce((s, d) => s + (d.steps || 0), 0)}
                total={selectedGoal?.stepsGoal || 10000}
                label=" Steps"
                onSetGoalClick={scrollToGoals}
              />
            </div>

            {/* Row 2 Left — Workout chart */}
            <div>
              <WorkoutChart data={chartData} />
            </div>

            {/* Row 3 Left — Exercise table */}
            <div>
              <WorkoutTable
                workouts={filteredWorkouts}
                searchQuery={filters.search}
                onSearchChange={(search) => setFilters((p) => ({ ...p, search }))}
                filterValue={filters.muscleGroup}
                onFilterChange={(muscleGroup) => setFilters((p) => ({ ...p, muscleGroup }))}
              />
            </div>

            {/* Row 3 Right — Activity trend */}
            <div>
              <ActivityTrendChart data={activity} />
            </div>
          </div>
        )}

        {/* ═══════════════ ACTIVITY TAB ═══════════════ */}
        {activeTab === "activity" && (
          <div className="flex-1 flex flex-col gap-3">
            <FilterPanel
              filters={filters} users={workoutFilterOptions.users}
              muscleGroups={workoutFilterOptions.muscleGroups} canSelectUser={canSelectUser}
              exportingPdf={exportingPdf}
              onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
              onClear={clearFilters} onExportPdf={exportReportToPdf}
            />
            <div className="flex-1">
              <ActivitySection activity={activity} />
            </div>
          </div>
        )}

        {/* ═══════════════ MAPS TAB ═══════════════ */}
        {activeTab === "maps" && (
          <div className="flex-1">
            <MapsView />
          </div>
        )}

        {/* ═══════════════ SCHEDULE TAB ═══════════════ */}
        {activeTab === "schedule" && (
          <div className="flex-1">
            <ScheduleView />
          </div>
        )}

        {/* ═══════════════ GOALS TAB ═══════════════ */}
        {activeTab === "goals" && (
          <div
            className="flex-1 grid gap-3"
            style={{ gridTemplateColumns: "1fr 280px", gridTemplateRows: "auto" }}
          >
            <div ref={goalsSectionRef} className="overflow-auto">
              <GoalsSection
                selectedUser={canSelectUser ? filters.user : authUser.displayName}
                goals={goals} selectedGoalId={selectedGoalId} streaks={streaks}
                userWiseGoals={userWiseGoals} saving={savingGoals}
                onSelectGoal={setSelectedGoalId} onCreate={createGoal}
                onUpdate={updateGoal} onDelete={deleteGoal}
              />
            </div>
            <GoalProgressCard
              current={activity.reduce((s, d) => s + (d.steps || 0), 0)}
              total={selectedGoal?.stepsGoal || 10000}
              label=" Steps"
              onSetGoalClick={() => goalsSectionRef.current?.scrollIntoView()}
            />
          </div>
        )}

        {/* ── Compact Footer Strip — always visible, no extra height ── */}
        <div className="shrink-0 mt-3 pt-3 pb-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 tracking-tight">Fit Tracker Dashboard</span>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hidden lg:block">
            Powered by Fitness Intelligence Team
          </p>
          <div className="flex gap-5">
            <button
              onClick={() => setActiveFooterModal("documentation")}
              className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-colors"
            >
              Docs
            </button>
            <button
              onClick={() => setActiveFooterModal("privacy")}
              className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() => setActiveFooterModal("support")}
              className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-colors"
            >
              Support
            </button>
          </div>
        </div>

      </main>

      <FooterInfoModal active={activeFooterModal} onClose={() => setActiveFooterModal(null)} />
      <AdminConsoleModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}
