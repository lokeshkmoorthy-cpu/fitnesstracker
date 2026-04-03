import React, { useMemo } from "react";
import { Activity, FileDown } from "lucide-react";
import { StatCard } from "@/src/components/StatCard";
import type { ActivityDailyRecord, Workout, DashboardFilters } from "@/src/types/fitness";
import { ActivityTrendChart } from "@/src/features/activity/ActivityTrendChart";

interface ActivitySectionProps {
  activity: ActivityDailyRecord[];
  workouts: Workout[];
  filters: DashboardFilters;
}

export const ActivitySection: React.FC<ActivitySectionProps & {
  users: string[],
  muscleGroups: string[],
  onFilterChange: (n: Partial<DashboardFilters>) => void,
  onClearFilters: () => void,
  onExportPdf: () => void,
  exportingPdf: boolean,
  canSelectUser: boolean
}> = ({
  activity, workouts, filters, users, muscleGroups, onFilterChange, onClearFilters, onExportPdf, exportingPdf, canSelectUser
}) => {
    const { filteredActivity, muscleWorkouts } = useMemo(() => {
      const muscleWorkouts = filters.muscleGroup === "all"
        ? workouts
        : workouts.filter(w => w.musclegroup === filters.muscleGroup);

      const filteredActivity = filters.muscleGroup === "all"
        ? activity
        : activity.filter(a => muscleWorkouts.some(w => w.date.startsWith(a.date)));

      return { filteredActivity, muscleWorkouts };
    }, [activity, workouts, filters]);


    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-white/5 rounded-[2.5rem] p-8 shadow-premium space-y-10">
        {/* Header section with Filter controls merged */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between pb-6 border-b border-slate-50 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">Unified Analytics</h2>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">Performance tracking & filters</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onExportPdf} disabled={exportingPdf} className="h-10 px-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-2">
                <FileDown className="w-4 h-4" /> Export PDF
              </button>
              <button onClick={onClearFilters} className="h-10 px-5 rounded-xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20">
                Clear Global
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {canSelectUser && (
              <label className="flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                User Selector
                <select
                  value={filters.user}
                  onChange={(e) => onFilterChange({ user: e.target.value })}
                  className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 px-5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none"
                >
                  <option value="all">Global view</option>
                  {users.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Muscle Group
              <select
                value={filters.muscleGroup}
                onChange={(e) => onFilterChange({ muscleGroup: e.target.value })}
                className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 px-5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none"
              >
                <option value="all">All Muscles</option>
                {muscleGroups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Start Date
              <input type="date" value={filters.startDate} onChange={(e) => onFilterChange({ startDate: e.target.value })} className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 px-5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all" />
            </label>
            <label className="flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              End Date
              <input type="date" value={filters.endDate} onChange={(e) => onFilterChange({ endDate: e.target.value })} className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 px-5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all" />
            </label>
          </div>
        </div>

        {/* Trend Chart embedded in the same card */}
        <div className="">
          <ActivityTrendChart data={filteredActivity} />
        </div>

      </div>
    );
  };
