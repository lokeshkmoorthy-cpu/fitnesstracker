import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, Save, Trash2, Target, TrendingUp, Trophy, Award, Calendar, CheckCircle2, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { GoalsRecord, StreaksResponse } from "@/src/types/fitness";

export interface GoalEditorValues {
  goalName: string;
  period: "daily" | "weekly";
  stepsGoal: number;
  distanceGoalKm: number;
  caloriesGoal: number;
  activeMinutesGoal: number;
  description: string;
  targetValue: number;
  targetUnit: string;
  isActive: boolean;
}

interface GoalsSectionProps {
  selectedUser: string;
  currentUserName: string;
  isAdmin: boolean;
  goals: GoalsRecord[];
  selectedGoalId: string | null;
  streaks: StreaksResponse | null;
  userWiseGoals: Array<{ username: string; goals: GoalsRecord[]; streaks: StreaksResponse | null }>;
  saving: boolean;
  onSelectGoal: (goalId: string) => void;
  onCreate: (goal: GoalEditorValues) => Promise<void>;
  onUpdate: (goalId: string, goal: GoalEditorValues) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  selectedUser,
  currentUserName,
  isAdmin,
  goals,
  selectedGoalId,
  streaks,
  userWiseGoals,
  saving,
  onSelectGoal,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [creatingNew, setCreatingNew] = useState(false);
  const [draft, setDraft] = useState<GoalEditorValues>({
    goalName: "",
    period: "daily",
    stepsGoal: 0,
    distanceGoalKm: 0,
    caloriesGoal: 0,
    activeMinutesGoal: 0,
    description: "",
    targetValue: 0,
    targetUnit: "",
    isActive: true,
  });

  const selectedGoal = useMemo(
    () => goals.find((goal) => goal.goalId === selectedGoalId) ?? null,
    [goals, selectedGoalId]
  );

  useEffect(() => {
    if (!creatingNew) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [creatingNew]);

  useEffect(() => {
    if (creatingNew) return;
    if (!selectedGoal) {
      setDraft({
        goalName: "",
        period: "daily",
        stepsGoal: 0,
        distanceGoalKm: 0,
        caloriesGoal: 0,
        activeMinutesGoal: 0,
        description: "",
        targetValue: 0,
        targetUnit: "",
        isActive: true,
      });
      return;
    }
    setDraft({
      goalName: selectedGoal.goalName,
      period: selectedGoal.period,
      stepsGoal: selectedGoal.stepsGoal,
      distanceGoalKm: selectedGoal.distanceGoalKm,
      caloriesGoal: selectedGoal.caloriesGoal,
      activeMinutesGoal: selectedGoal.activeMinutesGoal,
      description: selectedGoal.description || "",
      targetValue: selectedGoal.targetValue || 0,
      targetUnit: selectedGoal.targetUnit || "",
      isActive: selectedGoal.isActive,
    });
  }, [creatingNew, selectedGoal]);

  const isAllView = selectedUser === "all";
  const disabled = isAllView && !isAdmin;

  const statusLabel = useMemo(() => {
    if (!streaks) return "No streak data";
    return streaks.todayGoalMet ? "On Track" : "Needs Progress";
  }, [streaks]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.goalName.trim()) return;
    if (creatingNew || !selectedGoal) {
      await onCreate(draft);
      setCreatingNew(false);
      return;
    }
    await onUpdate(selectedGoal.goalId, draft);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* CARD 1: PERFORMANCE OVERVIEW & ADMIN INSIGHTS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-white/5 rounded-2xl p-6 shadow-premium dark:shadow-none transition-all">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-600 dark:text-cyan-400 mb-1">
              {isAllView ? "Team Performance" : "Personal Insights"}
            </h2>
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {isAllView ? "Global Overview" : "Your Streak Status"}
            </p>
          </div>
          {isAllView && isAdmin && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setCreatingNew(true);
                onSelectGoal(""); // Clear selection
              }}
              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              Create Goal
            </button>
          )}
        </div>

        {isAllView ? (
          /* ADMIN VIEW: USER-WISE SUMMARY */
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Monitoring activity and goal completion rates across all registered users.
            </p>
            {userWiseGoals.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                <p className="text-sm text-slate-400 italic">No user-wise goals available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userWiseGoals.map((entry) => (
                  <div key={entry.username} className="group bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl p-4 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-500/10 flex items-center justify-center">
                          <span className="text-cyan-700 dark:text-cyan-300 font-bold uppercase text-sm">{entry.username.slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{entry.username}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-mono">{entry.streaks?.todayGoalMet ? "Active Today" : "Inactive"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-cyan-600 dark:text-cyan-400">{entry.streaks?.currentStreak ?? 0}d</p>
                        <p className="text-[9px] uppercase font-mono text-slate-400">Streak</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                      <div className="bg-white dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                        <p className="text-[9px] uppercase text-slate-400 mb-0.5">Active Goals</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{entry.goals.filter(g => g.isActive).length}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                        <p className="text-[9px] uppercase text-slate-400 mb-0.5">Top Streak</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{entry.streaks?.longestStreak ?? 0}d</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* USER VIEW: STREAK STATS */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl shadow-indigo-500/20">
              <TrendingUp className="absolute top-2 right-2 w-20 h-20 text-white/10 -rotate-12" />
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-100 mb-2">Current Streak</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{streaks?.currentStreak ?? 0}</span>
                <span className="text-indigo-100 font-bold uppercase text-[10px]">Days</span>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-premium">
              <Trophy className="absolute top-2 right-2 w-16 h-16 text-amber-500/5" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Personal Best</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800 dark:text-white">{streaks?.longestStreak ?? 0}</span>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Days</span>
              </div>
            </div>

            <div className={`relative overflow-hidden border rounded-2xl p-5 shadow-premium ${streaks?.todayGoalMet ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20" : "bg-rose-50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20"}`}>
               <CheckCircle2 className={`absolute top-2 right-2 w-16 h-16 ${streaks?.todayGoalMet ? "text-emerald-500/10" : "text-rose-500/10"}`} />
               <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${streaks?.todayGoalMet ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>Daily Status</p>
               <div className="flex flex-col">
                  <span className={`text-2xl font-black ${streaks?.todayGoalMet ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                    {statusLabel}
                  </span>
                  {streaks?.atRisk && !streaks?.todayGoalMet && (
                    <div className="flex items-center gap-1.5 mt-2 bg-amber-500/10 py-1 px-2 rounded-lg">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter">Streak At Risk</span>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* CARD 2: GOAL MANAGEMENT */}
      {!isAllView && (
        <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-white/5 rounded-2xl shadow-premium dark:shadow-none overflow-hidden transition-all">
          <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                {creatingNew ? "Define New Objective" : "Goal Masterlist"}
              </h2>
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {isAllView ? `New Personal Goal` : `Your Fitness Targets`}
              </p>
            </div>
            {!creatingNew && goals.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCreatingNew(true);
                  onSelectGoal("");
                }}
                className="group h-9 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4 text-indigo-500 group-hover:scale-125 transition-transform" />
                New Goal
              </button>
            )}
          </div>

          <div className="p-6">
            {!creatingNew && !selectedGoalId && goals.length === 0 ? (
              /* PREMIUM EMPTY STATE */
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-cyan-400/20 blur-3xl rounded-full" />
                  <div className="relative w-20 h-20 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-3xl flex items-center justify-center transform rotate-3 shadow-2xl">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Launch Your Fitness Journey</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
                  You haven't set any specific targets yet. Define your steps, calories, or distance goals to start tracking your daily progress and building streaks.
                </p>
                <button
                  type="button"
                  onClick={() => setCreatingNew(true)}
                  className="px-8 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl text-sm font-bold uppercase tracking-widest transition-all shadow-xl shadow-cyan-600/30 flex items-center gap-3 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Create First Goal
                </button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* LEFT CONTEXT: GOAL LISTING (Only if not in all view) */}
                {!isAllView && (
                  <div className="w-full lg:w-[320px] flex flex-col gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                      Registered Goals ({goals.length})
                    </p>
                    <div className="grid grid-cols-1 gap-2.5 max-h-[480px] overflow-auto pr-2 custom-scrollbar">
                      {goals.map((goal) => (
                        <button
                          key={goal.goalId}
                          type="button"
                          onClick={() => {
                            setCreatingNew(false);
                            onSelectGoal(goal.goalId);
                          }}
                          className={`group text-left p-4 rounded-2xl border transition-all relative ${selectedGoalId === goal.goalId && !creatingNew
                            ? "border-cyan-500/50 bg-cyan-50/50 dark:border-cyan-500/40 dark:bg-cyan-400/5 ring-1 ring-cyan-500/20 shadow-md"
                            : "border-slate-100 bg-slate-50/30 dark:border-white/5 dark:bg-slate-950/20 hover:border-cyan-500/30 hover:bg-slate-50 dark:hover:bg-slate-900/40 shadow-sm"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                               <div className={`w-2 h-2 rounded-full ${goal.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                               <p className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">{goal.goalName}</p>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${selectedGoalId === goal.goalId ? "text-cyan-500 rotate-90" : "text-slate-300 group-hover:translate-x-1"}`} />
                          </div>
                          
                          <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-500 uppercase">{goal.period}</span>
                            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-500">{goal.stepsGoal} Steps</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* RIGHT CONTEXT: EDITOR FORM */}
                {selectedGoalId && !creatingNew ? (
                  <div className="flex-1 bg-slate-50/30 dark:bg-slate-950/20 border border-slate-100 dark:border-white/5 rounded-3xl p-6 relative">
                    <form onSubmit={onSubmit} className="space-y-6">
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          <Target className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                             Update Parameters
                          </p>
                          <h4 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                            {draft.goalName || "Objective Settings"}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <section className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2">Core Objective</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex flex-col gap-2 md:col-span-2">
                              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 ml-1">Goal identifier</span>
                              <input
                                type="text"
                                required
                                value={draft.goalName}
                                onChange={(event) => setDraft((prev) => ({ ...prev, goalName: event.target.value }))}
                                placeholder="e.g. Bulk Up: Reach 85kg"
                                className="h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 text-[13px] font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                              />
                            </label>

                            <label className="flex flex-col gap-2 md:col-span-2">
                              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 ml-1">Detailed Description</span>
                              <textarea
                                value={draft.description}
                                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                                placeholder="Explain the context or secondary requirements for this goal..."
                                className="min-h-[80px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 text-[13px] font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all resize-none"
                              />
                            </label>

                            <label className="flex flex-col gap-2">
                              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 ml-1">Frequency</span>
                              <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                  value={draft.period}
                                  onChange={(event) => setDraft((prev) => ({ ...prev, period: event.target.value as "daily" | "weekly" }))}
                                  className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[13px] font-bold text-slate-800 dark:text-white outline-none appearance-none cursor-pointer focus:ring-2 ring-indigo-500/20 transition-all"
                                >
                                  <option value="daily">Daily Objective</option>
                                  <option value="weekly">Weekly Target</option>
                                </select>
                              </div>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                              <label className="flex flex-col gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 ml-1">Target Value</span>
                                <input
                                  type="number"
                                  value={draft.targetValue}
                                  onChange={(event) => setDraft((prev) => ({ ...prev, targetValue: Number(event.target.value) || 0 }))}
                                  className="h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 text-[13px] font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                                />
                              </label>
                              <label className="flex flex-col gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 ml-1">Unit</span>
                                <input
                                  type="text"
                                  value={draft.targetUnit}
                                  onChange={(event) => setDraft((prev) => ({ ...prev, targetUnit: event.target.value }))}
                                  placeholder="kg, lbs, %"
                                  className="h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 text-[13px] font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                                />
                              </label>
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-2">Activity Metrics (Optional)</p>
                          <div className="grid grid-cols-2 gap-4">
                            <label className="flex flex-col gap-2">
                              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 ml-1">Steps</span>
                              <input
                                type="number"
                                min={0}
                                value={draft.stepsGoal}
                                onChange={(event) => setDraft((prev) => ({ ...prev, stepsGoal: Number(event.target.value) || 0 }))}
                                className="h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 text-[12px] font-bold text-slate-800 dark:text-white outline-none focus:ring-1 ring-cyan-500/20 transition-all"
                              />
                            </label>

                            <label className="flex flex-col gap-2">
                              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 ml-1">Distance (km)</span>
                              <input
                                type="number"
                                min={0}
                                step="0.1"
                                value={draft.distanceGoalKm}
                                onChange={(event) => setDraft((prev) => ({ ...prev, distanceGoalKm: Number(event.target.value) || 0 }))}
                                className="h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 text-[12px] font-bold text-slate-800 dark:text-white outline-none focus:ring-1 ring-cyan-500/20 transition-all"
                              />
                            </label>

                            <label className="flex flex-col gap-2">
                              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 ml-1">Calories</span>
                              <input
                                type="number"
                                min={0}
                                value={draft.caloriesGoal}
                                onChange={(event) => setDraft((prev) => ({ ...prev, caloriesGoal: Number(event.target.value) || 0 }))}
                                className="h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 text-[12px] font-bold text-slate-800 dark:text-white outline-none focus:ring-1 ring-cyan-500/20 transition-all"
                              />
                            </label>

                            <label className="flex flex-col gap-2">
                              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 ml-1">Active Mins</span>
                              <input
                                type="number"
                                min={0}
                                value={draft.activeMinutesGoal}
                                onChange={(event) => setDraft((prev) => ({ ...prev, activeMinutesGoal: Number(event.target.value) || 0 }))}
                                className="h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 text-[12px] font-bold text-slate-800 dark:text-white outline-none focus:ring-1 ring-cyan-500/20 transition-all"
                              />
                            </label>
                          </div>
                        </section>

                        <button
                          type="button"
                          onClick={() => setDraft((prev) => ({ ...prev, isActive: !prev.isActive }))}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${draft.isActive ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-slate-500/5 border-slate-500/20 text-slate-600 dark:text-slate-400"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${draft.isActive ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-white/10"}`}>
                              {draft.isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-tight">Active tracking enabled</span>
                          </div>
                          <span className="text-[10px] font-mono opacity-60">{draft.isActive ? "ONLINE" : "PAUSED"}</span>
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-slate-100 dark:border-white/5">
                        <p className="text-[11px] text-slate-500 leading-tight max-w-[240px]">
                          Changes are applied immediately after saving. Deleting a goal will remove all historical streak connections for that target.
                        </p>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {selectedGoal && (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => onDelete(selectedGoal.goalId)}
                              className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center disabled:opacity-50"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                          
                          <button
                            type="submit"
                            disabled={saving || !draft.goalName.trim()}
                            className="flex-1 sm:flex-none h-11 px-8 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                          >
                            <Save className="w-4 h-4" />
                            {saving ? "Syncing..." : "Apply Changes"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                ) : goals.length > 0 && !creatingNew ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 px-8 text-center bg-slate-50/30 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-white/5 rounded-[40px]">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/5 rounded-full flex items-center justify-center mb-6">
                      <Target className="w-10 h-10 text-indigo-400 opacity-20" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-400 dark:text-slate-500">Selection Required</h4>
                    <p className="text-sm text-slate-400 dark:text-slate-600 max-w-xs mt-2">
                       Select one of your existing goals from the list on the left to view metrics or make adjustments.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GOAL CREATION MODAL */}
      <AnimatePresence>
        {creatingNew && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCreatingNew(false)}
          >
            <motion.div
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_32px_80px_rgba(0,0,0,0.4)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.8)] border border-slate-100 dark:border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="relative p-8">
                <button 
                  onClick={() => setCreatingNew(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Target className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Create New Goal</h2>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       Define Your Path <div className="w-1 h-1 bg-indigo-500 rounded-full" /> Personal
                    </p>
                  </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                  <div className="space-y-6">
                    {/* PRIMARY OBJECTIVE SECTION */}
                    <section className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-[24px] border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Primary Objective</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <label className="flex flex-col gap-2 md:col-span-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Goal identifier</span>
                          <input
                            type="text"
                            required
                            autoFocus
                            value={draft.goalName}
                            onChange={(event) => setDraft((prev) => ({ ...prev, goalName: event.target.value }))}
                            placeholder="e.g. Gain 20 kg in 3 months"
                            className="h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-5 text-[15px] font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all placeholder:font-normal placeholder:opacity-40"
                          />
                        </label>

                        <label className="flex flex-col gap-2 md:col-span-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Detailed Description</span>
                          <textarea
                            value={draft.description}
                            onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                            placeholder="Briefly explain what you want to achieve..."
                            className="min-h-[100px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 text-[14px] font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all resize-none"
                          />
                        </label>

                        <label className="flex flex-col gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Frequency</span>
                          <select
                            value={draft.period}
                            onChange={(event) => setDraft((prev) => ({ ...prev, period: event.target.value as "daily" | "weekly" }))}
                            className="h-14 pl-5 pr-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[14px] font-bold text-slate-800 dark:text-white outline-none appearance-none cursor-pointer focus:ring-2 ring-indigo-500/20 transition-all"
                          >
                            <option value="daily">Daily Target</option>
                            <option value="weekly">Weekly Target</option>
                          </select>
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Target Value</span>
                            <input
                              type="number"
                              value={draft.targetValue}
                              onChange={(event) => setDraft((prev) => ({ ...prev, targetValue: Number(event.target.value) || 0 }))}
                              className="h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-5 text-[14px] font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                            />
                          </label>
                          <label className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Unit</span>
                            <input
                              type="text"
                              value={draft.targetUnit}
                              onChange={(event) => setDraft((prev) => ({ ...prev, targetUnit: event.target.value }))}
                              placeholder="kg, %, lbs"
                              className="h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-5 text-[14px] font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                            />
                          </label>
                        </div>
                      </div>
                    </section>

                    {/* METRICS SECTION */}
                    <section className="px-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-3 bg-cyan-500 rounded-full" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Activity Metrics (Optional)</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <label className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Steps</span>
                          <input
                            type="number"
                            min={0}
                            value={draft.stepsGoal}
                            onChange={(event) => setDraft((prev) => ({ ...prev, stepsGoal: Number(event.target.value) || 0 }))}
                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-white/5 px-4 text-[13px] font-bold text-slate-700 dark:text-white outline-none focus:ring-1 ring-cyan-500/30"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dist (km)</span>
                          <input
                            type="number"
                            min={0}
                            step="0.1"
                            value={draft.distanceGoalKm}
                            onChange={(event) => setDraft((prev) => ({ ...prev, distanceGoalKm: Number(event.target.value) || 0 }))}
                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-white/5 px-4 text-[13px] font-bold text-slate-700 dark:text-white outline-none focus:ring-1 ring-cyan-500/30"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Calories</span>
                          <input
                            type="number"
                            min={0}
                            value={draft.caloriesGoal}
                            onChange={(event) => setDraft((prev) => ({ ...prev, caloriesGoal: Number(event.target.value) || 0 }))}
                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-white/5 px-4 text-[13px] font-bold text-slate-700 dark:text-white outline-none focus:ring-1 ring-cyan-500/30"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mins</span>
                          <input
                            type="number"
                            min={0}
                            value={draft.activeMinutesGoal}
                            onChange={(event) => setDraft((prev) => ({ ...prev, activeMinutesGoal: Number(event.target.value) || 0 }))}
                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-white/5 px-4 text-[13px] font-bold text-slate-700 dark:text-white outline-none focus:ring-1 ring-cyan-500/30"
                          />
                        </label>
                      </div>
                    </section>
                  </div>

                  <div className="flex items-center gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setCreatingNew(false)}
                      className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      Wait, Back
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !draft.goalName.trim()}
                      className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {saving ? "Deploying..." : "Launch This Goal"}
                      {!saving && <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
