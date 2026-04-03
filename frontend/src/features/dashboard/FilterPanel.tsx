import React from "react";
import { FileDown, Filter, X } from "lucide-react";
import { motion } from "motion/react";
import type { DashboardFilters } from "@/src/types/fitness";

interface FilterPanelProps {
  filters: DashboardFilters;
  users: string[];
  muscleGroups: string[];
  canSelectUser: boolean;
  exportingPdf: boolean;
  onChange: (next: Partial<DashboardFilters>) => void;
  onClear: () => void;
  onExportPdf: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  users,
  muscleGroups,
  canSelectUser,
  exportingPdf,
  onChange,
  onClear,
  onExportPdf,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-white/5 rounded-3xl p-6 shadow-premium relative z-10"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-purple-600" />
          Analytics Filters
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={onExportPdf}
            disabled={exportingPdf}
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FileDown className="w-3.5 h-3.5" />
            {exportingPdf ? "Exporting..." : "Export PDF"}
          </button>
          <button
            onClick={onClear}
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {canSelectUser ? (
          <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            User Selector
            <select
              value={filters.user}
              onChange={(event) => onChange({ user: event.target.value })}
              className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 px-4 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/5 transition-all w-full [color-scheme:light] dark:[color-scheme:dark]"
            >
              <option value="all">Global view</option>
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Muscle Group
          <select
            value={filters.muscleGroup}
            onChange={(event) => onChange({ muscleGroup: event.target.value })}
            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 px-4 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/5 transition-all w-full [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option value="all">All Muscle Groups</option>
            {muscleGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Start Date
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => onChange({ startDate: event.target.value })}
            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 px-4 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/5 transition-all w-full [color-scheme:light] dark:[color-scheme:dark]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          End Date
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => onChange({ endDate: event.target.value })}
            className="h-11 rounded-xl bg-slate-50 border border-slate-100 px-4 text-xs font-semibold text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/5 transition-all"
          />
        </label>
      </div>
    </motion.div>
  );
};
