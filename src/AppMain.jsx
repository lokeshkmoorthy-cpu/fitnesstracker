import { jsx, jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Activity, Loader2, Flame, Zap } from "lucide-react";
import { ActivityTrendChart } from "@/src/features/activity/ActivityTrendChart";
import { Sidebar } from "@/src/components/Sidebar";
import { TopBar } from "@/src/components/TopBar";
import { DashboardHero } from "@/src/components/DashboardHero";
import { MotivationCard } from "@/src/components/MotivationCard";
import { GoalProgressCard } from "@/src/components/GoalProgressCard";
import { HelpModal } from "@/src/components/HelpModal";
import { StatCard } from "@/src/components/StatCard";
import { AttendanceHeatmap } from "@/src/components/AttendanceHeatmap";
import { WorkoutChart } from "@/src/components/WorkoutChart";
import { WorkoutTable } from "@/src/components/WorkoutTable";
import { ActivitySection } from "@/src/features/activity/ActivitySection";
import { AuthPanel } from "@/src/features/auth/AuthPanel";
import { FilterPanel } from "@/src/features/dashboard/FilterPanel";
import { FooterInfoModal } from "@/src/features/dashboard/FooterInfoModal";
import { GoalsSection } from "@/src/features/goals/GoalsSection";
import { MapsView } from "@/src/features/maps/MapsView";
import { ScheduleView } from "@/src/features/schedule/ScheduleView";
import { AdminConsoleModal } from "@/src/components/AdminConsoleModal";
import { AdminConsoleView } from "@/src/features/admin/AdminConsoleView";
import { AdminUserInfoView } from "@/src/features/admin/AdminUserInfoView";
import { exportDashboardPdf } from "@/src/features/reporting/exportDashboardPdf";
import { aggregateMuscleGroups, buildWorkoutFilters, filterWorkouts } from "@/src/features/workouts/utils";
import { fitnessApi, setAuthToken } from "@/src/services/api";
const AUTH_TOKEN_KEY = "fitsheet_auth_token";
function todayIsoDate() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function addDaysIso(iso, delta) {
  const d = /* @__PURE__ */ new Date(`${iso}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
function resolveDashboardApiRange(startDate, endDate) {
  const end = endDate.trim() || todayIsoDate();
  const start = startDate.trim();
  if (start) {
    return { from: start, to: endDate.trim() || end };
  }
  return { from: addDaysIso(end, -30), to: end };
}
function resolveAttendanceApiRange(startDate, endDate) {
  const end = endDate.trim() || todayIsoDate();
  const start = startDate.trim();
  if (start) {
    return { from: start, to: endDate.trim() || end };
  }
  return { from: addDaysIso(end, -364), to: end };
}
function AppMain() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [goals, setGoals] = useState([]);
  const [motivationQuotes, setMotivationQuotes] = useState([]);
  const [motivationLoading, setMotivationLoading] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [streaks, setStreaks] = useState(null);
  const [userWiseGoals, setUserWiseGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceRefreshing, setAttendanceRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [activeFooterModal, setActiveFooterModal] = useState(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    user: "all",
    muscleGroup: "all",
    startDate: "",
    endDate: "",
    search: ""
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const goalsSectionRef = useRef(null);
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
  const dashboardApiRange = useMemo(
    () => resolveDashboardApiRange(filters.startDate, filters.endDate),
    [filters.startDate, filters.endDate]
  );
  const attendanceApiRange = useMemo(
    () => resolveAttendanceApiRange(filters.startDate, filters.endDate),
    [filters.startDate, filters.endDate]
  );
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
      user: authUser.role === "admin" ? prev.user : authUser.displayName
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
  const refetchAttendance = async () => {
    if (!authUser) return;
    const userParam = authUser.role === "admin" ? filters.user : authUser.displayName;
    const { from: rangeFrom, to: rangeTo } = attendanceApiRange;
    setAttendanceRefreshing(true);
    try {
      const attendanceData = await fitnessApi.getAttendance({
        user: userParam,
        from: rangeFrom,
        to: rangeTo
      });
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (attErr) {
      console.error("Failed to fetch attendance:", attErr);
      setAttendance([]);
    } finally {
      setAttendanceRefreshing(false);
    }
  };
  useEffect(() => {
    if (!authUser) return;
    fetchWorkouts();
  }, [authUser]);
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    const load = async () => {
      const userParam = authUser.role === "admin" ? filters.user : authUser.displayName;
      const { from: rangeFrom, to: rangeTo } = dashboardApiRange;
      const { from: attFrom, to: attTo } = attendanceApiRange;
      try {
        const [dailyActivity, goalsData] = await Promise.all([
          fitnessApi.getDailyActivity({ user: userParam, from: rangeFrom, to: rangeTo }),
          fitnessApi.getGoals(userParam)
        ]);
        if (cancelled) return;
        setActivity(Array.isArray(dailyActivity) ? dailyActivity.sort((a, b) => a.date.localeCompare(b.date)) : []);
        try {
          const attendanceData = await fitnessApi.getAttendance({
            user: userParam,
            from: attFrom,
            to: attTo
          });
          if (!cancelled) {
            setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
          }
        } catch (attErr) {
          console.error("Failed to fetch attendance:", attErr);
          if (!cancelled) setAttendance([]);
        }
        if (userParam !== "all") {
          const sorted = [...goalsData].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          setGoals(sorted);
          setSelectedGoalId((prev) => prev && sorted.some((g) => g.goalId === prev) ? prev : sorted[0]?.goalId ?? null);
          setUserWiseGoals([]);
          setStreaks(await fitnessApi.getStreaks(userParam));
        } else {
          setGoals([]);
          setSelectedGoalId(null);
          setStreaks(null);
          const users = workoutFilterOptions.users;
          const streakResults = await Promise.all(users.map((u) => fitnessApi.getStreaks(u).catch(() => null)));
          const grouped = goalsData.reduce((acc, g) => {
            const key = g.username || g.userId;
            if (!acc[key]) acc[key] = [];
            acc[key].push(g);
            return acc;
          }, {});
          if (!cancelled) {
            setUserWiseGoals(users.map((username, i) => ({
              username,
              goals: (grouped[username] || []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
              streaks: streakResults[i]
            })));
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [authUser, filters.user, dashboardApiRange, attendanceApiRange, workoutFilterOptions.users]);
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    const loadQuotes = async () => {
      setMotivationLoading(true);
      try {
        const data = await fitnessApi.getMotivationQuotes();
        if (cancelled) return;
        const normalized = (Array.isArray(data) ? data : []).filter(
          (entry) => Boolean(entry?.quote) && (entry.language === "ta" || entry.language === "en" || entry.language === "fr")
        );
        setMotivationQuotes(normalized);
      } catch (error) {
        console.error("Failed to fetch motivation quotes:", error);
        if (!cancelled) setMotivationQuotes([]);
      } finally {
        if (!cancelled) setMotivationLoading(false);
      }
    };
    loadQuotes();
    return () => {
      cancelled = true;
    };
  }, [authUser]);
  const handleLogin = async (payload) => {
    setAuthSubmitting(true);
    try {
      const res = await fitnessApi.login(payload);
      localStorage.setItem(AUTH_TOKEN_KEY, res.token);
      setAuthToken(res.token);
      setAuthUser(res.user);
    } finally {
      setAuthSubmitting(false);
    }
  };
  const handleSignup = async (payload) => {
    setAuthSubmitting(true);
    try {
      const res = await fitnessApi.signup(payload);
      localStorage.setItem(AUTH_TOKEN_KEY, res.token);
      setAuthToken(res.token);
      setAuthUser(res.user);
    } finally {
      setAuthSubmitting(false);
    }
  };
  const handleLogout = async () => {
    try {
      await fitnessApi.logout();
    } catch {
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
  const clearFilters = () => setFilters((prev) => ({
    user: canSelectUser ? "all" : authUser?.displayName || prev.user,
    muscleGroup: "all",
    startDate: "",
    endDate: "",
    search: ""
  }));
  const exportReportToPdf = async () => {
    setExportingPdf(true);
    try {
      await exportDashboardPdf({ filters, workouts: filteredWorkouts, chartData, activity, goal: selectedGoal, streaks });
    } finally {
      setExportingPdf(false);
    }
  };
  const refreshGoalsAndStreaks = async (targetUser) => {
    const [nextGoals, nextStreaks] = await Promise.all([fitnessApi.getGoals(targetUser), fitnessApi.getStreaks(targetUser)]);
    const sorted = [...nextGoals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setGoals(sorted);
    setSelectedGoalId((prev) => prev && sorted.some((g) => g.goalId === prev) ? prev : sorted[0]?.goalId ?? null);
    setStreaks(nextStreaks);
  };
  const createGoal = async (goal) => {
    const targetUser = canSelectUser && filters.user !== "all" ? filters.user : authUser?.displayName || "";
    if (!targetUser) return;
    setSavingGoals(true);
    try {
      await fitnessApi.createGoal({ user: targetUser, ...goal });
      await refreshGoalsAndStreaks(targetUser);
    } finally {
      setSavingGoals(false);
    }
  };
  const updateGoal = async (goalId, goal) => {
    const targetUser = canSelectUser && filters.user !== "all" ? filters.user : authUser?.displayName || "";
    if (!targetUser) return;
    setSavingGoals(true);
    try {
      await fitnessApi.updateGoal(goalId, goal);
      await refreshGoalsAndStreaks(targetUser);
      setSelectedGoalId(goalId);
    } finally {
      setSavingGoals(false);
    }
  };
  const deleteGoal = async (goalId) => {
    const targetUser = canSelectUser && filters.user !== "all" ? filters.user : authUser?.displayName || "";
    if (!targetUser) return;
    setSavingGoals(true);
    try {
      await fitnessApi.deleteGoal(goalId);
      await refreshGoalsAndStreaks(targetUser);
    } finally {
      setSavingGoals(false);
    }
  };
  if (authLoading) {
    return /* @__PURE__ */ jsx("div", { className: "h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-10 h-10 animate-spin text-purple-600" }) });
  }
  if (!authUser) {
    return /* @__PURE__ */ jsx(AuthPanel, { loading: authSubmitting, onLogin: handleLogin, onSignup: handleSignup });
  }
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "h-screen bg-[#f8f9fa] dark:bg-slate-950 flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-purple-600" }) });
  }
  return (
    /* ── ROOT: locked to viewport, no scroll ── */
    /* @__PURE__ */ jsxs("div", { className: "h-screen overflow-hidden bg-[#f5f6fa] dark:bg-slate-950 flex font-sans transition-colors", children: [
      /* @__PURE__ */ jsx(
        Sidebar,
        {
          user: authUser,
          onRefresh: fetchWorkouts,
          refreshing,
          onLogout: handleLogout,
          onHelp: () => setIsHelpModalOpen(true),
          onOpenAdmin: () => setIsAdminModalOpen(true),
          activeItem: activeTab,
          onNavigate: setActiveTab
        }
      ),
      /* @__PURE__ */ jsxs("main", { className: "flex-1 h-full flex flex-col overflow-y-auto px-5 pt-3 pb-12 scrollbar-custom", children: [
        /* @__PURE__ */ jsx(
          TopBar,
          {
            title: activeTab === "dashboard" ? "Dashboard" : activeTab === "admin" ? "Command Console" : activeTab === "admin-users" ? "User Info" : activeTab === "activity" ? "Activity" : activeTab === "maps" ? "Maps" : activeTab === "schedule" ? "Schedule" : activeTab === "goals" ? "Goals" : "Dashboard",
            onRefresh: fetchWorkouts,
            refreshing,
            onHelp: () => setIsHelpModalOpen(true)
          }
        ),
        activeTab === "dashboard" && /* @__PURE__ */ jsx("div", { className: "flex-1 flex gap-3 min-h-0", children: /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col gap-2 min-w-0 min-h-0", children: [
          /* @__PURE__ */ jsx(DashboardHero, { userName: authUser.displayName, onAddClick: openAdminConsole }),
          /* @__PURE__ */ jsx(MotivationCard, { quotes: motivationQuotes, loading: motivationLoading }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-3 min-h-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "col-span-4 flex flex-col gap-3", children: [
              /* @__PURE__ */ jsx(
                StatCard,
                {
                  label: "Total Exercises",
                  value: filteredWorkouts.length,
                  icon: /* @__PURE__ */ jsx(Activity, { className: "w-5 h-5" }),
                  trend: "+12%",
                  subtitle: "From last week",
                  className: "flex-1"
                }
              ),
              /* @__PURE__ */ jsx(
                StatCard,
                {
                  label: "Workout Days",
                  value: new Set(filteredWorkouts.map((w) => w.date)).size,
                  icon: /* @__PURE__ */ jsx(Zap, { className: "w-5 h-5" }),
                  trend: "+2",
                  subtitle: "Consistency",
                  className: "flex-1"
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              AttendanceHeatmap,
              {
                className: "col-span-8",
                records: attendance,
                userFilter: canSelectUser ? {
                  value: filters.user,
                  options: workoutFilterOptions.users,
                  onChange: (user) => setFilters((p) => ({ ...p, user }))
                } : void 0,
                viewerLabel: canSelectUser ? void 0 : `Your attendance \xB7 ${authUser.displayName}`,
                onRefresh: refetchAttendance,
                refreshing: attendanceRefreshing
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 flex flex-col", children: /* @__PURE__ */ jsx(
            WorkoutTable,
            {
              workouts: filteredWorkouts,
              searchQuery: filters.search,
              onSearchChange: (search) => setFilters((p) => ({ ...p, search })),
              filterValue: filters.muscleGroup,
              onFilterChange: (muscleGroup) => setFilters((p) => ({ ...p, muscleGroup })),
              users: workoutFilterOptions.users,
              selectedUser: filters.user,
              onUserChange: (user) => setFilters((p) => ({ ...p, user })),
              showUserFilter: canSelectUser
            }
          ) })
        ] }) }),
        activeTab === "admin" && /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col min-h-0", children: /* @__PURE__ */ jsx(AdminConsoleView, {}) }),
        activeTab === "admin-users" && /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col min-h-0", children: /* @__PURE__ */ jsx(AdminUserInfoView, {}) }),
        activeTab === "activity" && /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
          ActivitySection,
          {
            activity,
            workouts,
            filters,
            users: workoutFilterOptions.users,
            muscleGroups: workoutFilterOptions.muscleGroups,
            canSelectUser,
            exportingPdf,
            onFilterChange: (next) => setFilters((prev) => ({ ...prev, ...next })),
            onClearFilters: clearFilters,
            onExportPdf: exportReportToPdf
          }
        ) }),
        activeTab === "maps" && /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(MapsView, {}) }),
        activeTab === "schedule" && /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(ScheduleView, {}) }),
        activeTab === "goals" && /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col gap-3 min-h-0", children: [
          canSelectUser && /* @__PURE__ */ jsxs("div", { className: "shrink-0 bg-white dark:bg-slate-900 border border-slate-50 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-premium dark:shadow-none", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 text-indigo-600 dark:text-indigo-400" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-[9px] font-black uppercase tracking-[0.2em] text-slate-400", children: "Administration" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-slate-100", children: "User Goal Filter" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2", children: "Viewing:" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: filters.user,
                  onChange: (e) => setFilters((p) => ({ ...p, user: e.target.value })),
                  className: "h-9 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-100 outline-none focus:ring-2 ring-indigo-500/20 appearance-none cursor-pointer transition-all",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "all", children: "Global (All Users)" }),
                    workoutFilterOptions.users.map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u }, u))
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { ref: goalsSectionRef, className: "flex-1 overflow-auto custom-scrollbar pr-1", children: /* @__PURE__ */ jsx(
            GoalsSection,
            {
              selectedUser: canSelectUser ? filters.user : authUser.displayName,
              currentUserName: authUser.displayName,
              isAdmin: canSelectUser,
              goals,
              selectedGoalId,
              streaks,
              userWiseGoals,
              saving: savingGoals,
              onSelectGoal: setSelectedGoalId,
              onCreate: createGoal,
              onUpdate: updateGoal,
              onDelete: deleteGoal
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(FooterInfoModal, { active: activeFooterModal, onClose: () => setActiveFooterModal(null) }),
      /* @__PURE__ */ jsx(AdminConsoleModal, { isOpen: isAdminModalOpen, onClose: () => setIsAdminModalOpen(false) }),
      /* @__PURE__ */ jsx(HelpModal, { isOpen: isHelpModalOpen, onClose: () => setIsHelpModalOpen(false) })
    ] })
  );
}
export {
  AppMain as default
};
