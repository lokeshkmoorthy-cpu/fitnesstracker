import { jsx, jsxs } from "react/jsx-runtime";
import React, { useMemo } from "react";
import { Activity, FileDown } from "lucide-react";
import { StatCard } from "@/src/components/StatCard";
import { ActivityTrendChart } from "@/src/features/activity/ActivityTrendChart";
const ActivitySection = ({
  activity,
  workouts,
  filters,
  users,
  muscleGroups,
  onFilterChange,
  onClearFilters,
  onExportPdf,
  exportingPdf,
  canSelectUser
}) => {
  const { filteredActivity, muscleWorkouts } = useMemo(() => {
    const muscleWorkouts2 = filters.muscleGroup === "all" ? workouts : workouts.filter((w) => w.musclegroup === filters.muscleGroup);
    const filteredActivity2 = filters.muscleGroup === "all" ? activity : activity.filter((a) => muscleWorkouts2.some((w) => w.date.startsWith(a.date)));
    return { filteredActivity: filteredActivity2, muscleWorkouts: muscleWorkouts2 };
  }, [activity, workouts, filters]);
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-50 dark:border-white/5 rounded-[2.5rem] p-8 shadow-premium space-y-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-6 border-b border-slate-50 dark:border-white/5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Activity, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200", children: "Unified Analytics" }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 tracking-wider mt-0.5", children: "Performance tracking & filters" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("button", { onClick: onExportPdf, disabled: exportingPdf, className: "h-10 px-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(FileDown, { className: "w-4 h-4" }),
            " Export PDF"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: onClearFilters, className: "h-10 px-5 rounded-xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20", children: "Clear Global" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
        canSelectUser && /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400", children: [
          "User Selector",
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: filters.user,
              onChange: (e) => onFilterChange({ user: e.target.value }),
              className: "h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 px-5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "Global view" }),
                users.map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u }, u))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400", children: [
          "Muscle Group",
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: filters.muscleGroup,
              onChange: (e) => onFilterChange({ muscleGroup: e.target.value }),
              className: "h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 px-5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "All Muscles" }),
                muscleGroups.map((g) => /* @__PURE__ */ jsx("option", { value: g, children: g }, g))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400", children: [
          "Start Date",
          /* @__PURE__ */ jsx("input", { type: "date", value: filters.startDate, onChange: (e) => onFilterChange({ startDate: e.target.value }), className: "h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 px-5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400", children: [
          "End Date",
          /* @__PURE__ */ jsx("input", { type: "date", value: filters.endDate, onChange: (e) => onFilterChange({ endDate: e.target.value }), className: "h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 px-5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "", children: /* @__PURE__ */ jsx(ActivityTrendChart, { data: filteredActivity }) })
  ] });
};
export {
  ActivitySection
};
