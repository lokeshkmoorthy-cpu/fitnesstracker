import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import { Search, ChevronDown, CheckCircle2, Timer, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
const WorkoutTable = ({
  workouts,
  searchQuery,
  onSearchChange,
  filterValue,
  onFilterChange,
  users,
  selectedUser,
  onUserChange,
  showUserFilter
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium border border-slate-50 dark:border-white/5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold tracking-tight text-slate-900 dark:text-white px-2", children: "My Exercise" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: searchQuery,
              onChange: (e) => onSearchChange(e.target.value),
              placeholder: "Search here..",
              className: "pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 transition-all w-full md:w-56"
            }
          )
        ] }),
        showUserFilter && users.length > 0 && /* @__PURE__ */ jsxs("div", { className: "relative inline-block", children: [
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: selectedUser,
              onChange: (e) => onUserChange(e.target.value),
              className: "appearance-none pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all outline-none focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 cursor-pointer",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "All Users" }),
                users.map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u }, u))
              ]
            }
          ),
          /* @__PURE__ */ jsx(ChevronDown, { className: "absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "This Week" }),
          /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto -mx-2 max-h-[480px] overflow-y-auto scrollbar-custom", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-separate border-spacing-y-2 relative", children: [
      /* @__PURE__ */ jsx("thead", { className: "sticky top-0 z-20", children: /* @__PURE__ */ jsxs("tr", { className: "text-slate-400 font-bold text-[11px] uppercase tracking-[0.15em] leading-none", children: [
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 sticky top-0 z-20 bg-white dark:bg-slate-900 first:rounded-tl-2xl shadow-sm", children: "Name of Exercise" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 sticky top-0 z-20 bg-white dark:bg-slate-900 shadow-sm", children: "Muscle Group" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-center sticky top-0 z-20 bg-white dark:bg-slate-900 shadow-sm", children: "Set/Reps" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 sticky top-0 z-20 bg-white dark:bg-slate-900 shadow-sm", children: "Date" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right sticky top-0 z-20 bg-white dark:bg-slate-900 last:rounded-tr-2xl shadow-sm", children: "Status" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        workouts.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "py-20 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 text-slate-400", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-10 h-10 opacity-20" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "No exercises recorded for this period" })
        ] }) }) }) : null,
        /* @__PURE__ */ jsx(AnimatePresence, { mode: "popLayout", children: workouts.slice().reverse().map((workout, idx) => /* @__PURE__ */ jsxs(
          motion.tr,
          {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: idx * 0.02 },
            className: "group bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all",
            children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 dark:group-hover:border-white/5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs", children: workout.exercises.slice(0, 2).toUpperCase() }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-900 dark:text-white tracking-tight", children: workout.exercises })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5 border-y border-transparent group-hover:border-slate-100 dark:group-hover:border-white/5", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-600 dark:text-slate-300 leading-none mb-1", children: workout.musclegroup }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-widest", children: workout.username })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-center border-y border-transparent group-hover:border-slate-100 dark:group-hover:border-white/5", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: workout.setsreps }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5 border-y border-transparent group-hover:border-slate-100 dark:group-hover:border-white/5", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: new Date(workout.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100 dark:group-hover:border-white/5 text-right", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end gap-2", children: idx % 3 === 0 ? /* @__PURE__ */ jsxs("div", { className: "px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold", children: "Completed" })
              ] }) : /* @__PURE__ */ jsxs("div", { className: "px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Timer, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold", children: "In Progress" })
              ] }) }) })
            ]
          },
          `${workout.username}-${workout.date}-${workout.exercises}-${idx}`
        )) })
      ] })
    ] }) })
  ] });
};
export {
  WorkoutTable
};
