import React from "react";
import { FileDown, Filter, Search, X } from "lucide-react";
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
      className="bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-200/90 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          Smart Filters
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={onExportPdf}
            disabled={exportingPdf}
            className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-600 hover:text-cyan-700 dark:text-cyan-200 dark:hover:text-cyan-100 transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FileDown className="w-3.5 h-3.5" />
            {exportingPdf ? "Exporting..." : "Export PDF"}
          </button>
          <button
            onClick={onClear}
            className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors flex items-center gap-1.5"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {canSelectUser ? (
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
            User
            <select
              value={filters.user}
              onChange={(event) => onChange({ user: event.target.value })}
              className="h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-cyan-600 dark:bg-slate-950/60 dark:border-white/15 dark:text-slate-100 dark:focus:border-cyan-300/80 transition-colors"
            >
              <option value="all">All users</option>
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
          Muscle Group
          <select
            value={filters.muscleGroup}
            onChange={(event) => onChange({ muscleGroup: event.target.value })}
            className="h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-cyan-600 dark:bg-slate-950/60 dark:border-white/15 dark:text-slate-100 dark:focus:border-cyan-300/80 transition-colors"
          >
            <option value="all">All groups</option>
            {muscleGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
          Start Date
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => onChange({ startDate: event.target.value })}
            className="h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-cyan-600 dark:bg-slate-950/60 dark:border-white/15 dark:text-slate-100 dark:focus:border-cyan-300/80 transition-colors"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
          End Date
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => onChange({ endDate: event.target.value })}
            className="h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-cyan-600 dark:bg-slate-950/60 dark:border-white/15 dark:text-slate-100 dark:focus:border-cyan-300/80 transition-colors"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
          Search
          <div className="h-10 rounded-lg bg-white border border-sla