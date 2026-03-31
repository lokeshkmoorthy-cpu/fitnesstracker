import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, Save, Trash2 } from "lucide-react";
import type { GoalsRecord, StreaksResponse } from "@/src/types/fitness";

export interface GoalEditorValues {
  goalName: string;
  period: "daily" | "weekly";
  stepsGoal: number;
  distanceGoalKm: number;
  caloriesGoal: number;
  activeMinutesGoal: number;
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
  const selectedGoal = useMemo(
    () => goals.find((goal) => goal.goalId === selectedGoalId) ?? null,
    [goals, selectedGoalId]
  );
  const [creatingNew, setCreatingNew] = useState(false);
  const [draft, setDraft] = useState<GoalEditorValues>({
    goalName: "",
    period: "daily",
    stepsGoal: 8000,
    distanceGoalKm: 5,
    caloriesGoal: 450,
    activeMinutesGoal: 45,
    isActive: true,
  });

  useEffect(() => {
    if (creatingNew) return;
    if (!selectedGoal) {
      setDraft({
        goalName: "",
        period: "daily",
        stepsGoal: 8000,
        distanceGoalKm: 5,
        caloriesGoal: 450,
        activeMinutesGoal: 45,
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
    <section className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-white/5 rounded-2xl p-5 shadow-premium dark:shadow-none transition-all">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] font-bold text-cyan-700 dark:text-cyan-200/90 mb-4">
          Goals & Streaks
        </h2>
        {isAllView ? (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Viewing summary of all users.</p>
              {isAdmin && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setCreatingNew(true);
                    onSelectGoal(""); // Clear selection
                  }}
                  className="h-8 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-300/15 border border-indigo-200 dark:border-indigo-200/35 text-indigo-600 dark:text-indigo-100 text-[10px] uppercase font-mono tracking-[0.14em] flex items-center gap-2 disabled:opacity-60 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Create your own goal
                </button>
              )}
            </div>
            {userWiseGoals.length === 0 ? (
              <p className="text-sm text-slate-400">No user-wise goals available yet.</p>
            ) : (
              userWiseGoals.map((entry) => (
                <div key={entry.username} className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase font-mono tracking-[0.15em] text-cyan-600 dark:text-cyan-200">{entry.username}</p>
                    <p className="text-[10px] uppercase font-mono tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      {entry.goals.filter((goal) => goal.isActive).length} active / {entry.goals.length} total
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p className="text-slate-600 dark:text-slate-300">Goal records: <span className="text-slate-900 dark:text-slate-100 font-bold">{entry.goals.length}</span></p>
                    <p className="text-slate-600 dark:text-slate-300">Active goals: <span className="text-slate-900 dark:text-slate-100 font-bold">{entry.goals.filter((goal) => goal.isActive).length}</span></p>
                    <p className="text-slate-600 dark:text-slate-300">Current Streak: <span className="text-slate-900 dark:text-slate-100 font-bold">{entry.streaks?.currentStreak ?? 0}d</span></p>
                    <p className="text-slate-600 dark:text-slate-300">Longest Streak: <span className="text-slate-900 dark:text-slate-100 font-bold">{entry.streaks?.longestStreak ?? 0}d</span></p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {(!isAllView || (isAdmin && creatingNew)) ? (
          <>
            {!isAllView && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/10 rounded-xl p-4">
                  <p className="text-[10px] uppercase font-mono tracking-[0.15em] text-slate-500 dark:text-slate-400">Current Streak</p>
                  <p className="mt-2 text-1xl font-semibold text-slate-900 dark:text-white">{streaks?.currentStreak ?? 0} days</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/10 rounded-xl p-4">
                  <p className="text-[10px] uppercase font-mono tracking-[0.15em] text-slate-500 dark:text-slate-400">Longest Streak</p>
                  <p className="mt-2 text-1xl font-semibold text-slate-900 dark:text-white">{streaks?.longestStreak ?? 0} days</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/10 rounded-xl p-4">
                  <p className="text-[10px] uppercase font-mono tracking-[0.15em] text-slate-500 dark:text-slate-400">Today's Status</p>
                  <p className="mt-2 text-1xl font-semibold text-slate-900 dark:text-white">{statusLabel}</p>
                  {streaks?.atRisk ? (
                    <p className="mt-1 text-xs text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      At risk of breaking streak
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAllView ? `Creating new goal for you (${currentUserName})` : `Manage goals for ${selectedUser}`}
              </p>
              {!creatingNew && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setCreatingNew(true);
                    setDraft({
                      goalName: "",
                      period: "daily",
                      stepsGoal: 8000,
                      distanceGoalKm: 5,
                      caloriesGoal: 450,
                      activeMinutesGoal: 45,
                      isActive: true,
                    });
                  }}
                  className="h-9 px-3 rounded-lg bg-cyan-50 dark:bg-cyan-300/15 border border-cyan-200 dark:border-cyan-200/35 text-cyan-600 dark:text-cyan-100 text-xs uppercase font-mono tracking-[0.14em] flex items-center gap-2 disabled:opacity-60 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create goal
                </button>
              )}
            </div>

            {!isAllView && (
              <div className="grid grid-cols-1 gap-2 mb-5 max-h-52 overflow-auto pr-1">
                {goals.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-lg p-3">
                    No goals created yet.
                  </p>
                ) : (
                  goals.map((goal) => (
                    <button
                      key={goal.goalId}
                      type="button"
                      onClick={() => {
                        setCreatingNew(false);
                        onSelectGoal(goal.goalId);
                      }}
                      className={`text-left rounded-lg border px-3 py-2 transition-colors ${selectedGoalId === goal.goalId && !creatingNew
                        ? "border-cyan-300 bg-cyan-50 dark:border-cyan-300/60 dark:bg-cyan-400/10"
                        : "border-slate-100 bg-slate-50 hover:border-cyan-200 dark:border-white/10 dark:bg-slate-950/40 dark:hover:border-cyan-200/30"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.12em] font-mono text-cyan-700 dark:text-cyan-100">{goal.goalName}</p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${goal.isActive
                            ? "bg-emerald-400/20 text-emerald-200 border border-emerald-300/25"
                            : "bg-slate-500/20 text-slate-300 border border-slate-400/20"
                            }`}
                        >
                          {goal.isActive ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {goal.period} | {goal.stepsGoal} steps | {goal.distanceGoalKm}km
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300 md:col-span-2">
                  Goal Name
                  <input
                    type="text"
                    value={draft.goalName}
                    onChange={(event) => setDraft((prev) => ({ ...prev, goalName: event.target.value }))}
                    placeholder="e.g. Fat loss weekdays"
                    className="h-10 rounded-lg bg-slate-950/60 border border-white/15 px-3 text-xs text-slate-100 outline-none disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                  Goal Period
                  <select
                    value={draft.period}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        period: event.target.value as "daily" | "weekly",
                      }))
                    }
                    className="h-10 rounded-lg bg-slate-950/60 border border-white/15 px-3 text-xs text-slate-100 outline-none disabled:opacity-60"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                  Steps Goal
                  <input
                    type="number"
                    min={0}
                    value={draft.stepsGoal}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, stepsGoal: Number(event.target.value) || 0 }))
                    }
                    className="h-10 rounded-lg bg-slate-950/60 border border-white/15 px-3 text-xs text-slate-100 outline-none disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                  Distance Goal (km)
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={draft.distanceGoalKm}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, distanceGoalKm: Number(event.target.value) || 0 }))
                    }
                    className="h-10 rounded-lg bg-slate-950/60 border border-white/15 px-3 text-xs text-slate-100 outline-none disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                  Calories Goal
                  <input
                    type="number"
                    min={0}
                    value={draft.caloriesGoal}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, caloriesGoal: Number(event.target.value) || 0 }))
                    }
                    className="h-10 rounded-lg bg-slate-950/60 border border-white/15 px-3 text-xs text-slate-100 outline-none disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300 md:col-span-2">
                  Active Minutes Goal
                  <input
                    type="number"
                    min={0}
                    value={draft.activeMinutesGoal}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, activeMinutesGoal: Number(event.target.value) || 0 }))
                    }
                    className="h-10 rounded-lg bg-slate-950/60 border border-white/15 px-3 text-xs text-slate-100 outline-none disabled:opacity-60"
                  />
                </label>
                <label className="md:col-span-2 inline-flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))}
                    className="rounded border-white/20 bg-slate-900"
                  />
                  Include this goal in streak calculations
                </label>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Save updates to persist goals and keep streak calculations in sync.</p>
                <div className="flex items-center gap-2">
                  {creatingNew && isAllView && (
                    <button
                      type="button"
                      onClick={() => setCreatingNew(false)}
                      className="h-10 px-3 rounded-lg bg-slate-800 border border-white/10 text-slate-300 text-xs uppercase font-mono tracking-[0.14em]"
                    >
                      Cancel
                    </button>
                  )}
                  {!creatingNew && selectedGoal ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onDelete(selectedGoal.goalId)}
                      className="h-10 px-3 rounded-lg bg-rose-400/10 border border-rose-300/30 text-rose-100 text-xs uppercase font-mono tracking-[0.14em] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-10 px-4 rounded-lg bg-cyan-300/20 border border-cyan-200/40 text-cyan-100 text-xs uppercase font-mono tracking-[0.14em] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Saving..." : (creatingNew || !selectedGoal) ? "Create Goal" : "Save Goal"}
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <p className="text-xs text-slate-500 italic mt-8 border-t border-white/5 pt-6">
            Select a specific user in the global filters to manage their goals, or select yourself to set personal fitness objectives.
          </p>
        )}
      </div>
    </section>
  );
};
