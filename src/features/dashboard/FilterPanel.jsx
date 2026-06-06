import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import { FileDown, Filter, X } from "lucide-react";
import { motion } from "motion/react";
const FilterPanel = ({
  filters,
  users,
  muscleGroups,
  canSelectUser,
  exportingPdf,
  onChange,
  onClear,
  onExportPdf
}) => {
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.35 },
      className: "bg-white dark:bg-slate-900 border border-slate-50 dark:border-white/5 rounded-3xl p-6 shadow-premium relative z-10",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Filter, { className: "w-3.5 h-3.5 text-purple-600" }),
            "Analytics Filters"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: onExportPdf,
                disabled: exportingPdf,
                className: "text-[10px] font-bold uppercase tracking-[0.18em] text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed",
                children: [
                  /* @__PURE__ */ jsx(FileDown, { className: "w-3.5 h-3.5" }),
                  exportingPdf ? "Exporting..." : "Export PDF"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: onClear,
                className: "text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }),
                  "Clear"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4", children: [
          canSelectUser ? /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500", children: [
            "User Selector",
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: filters.user,
                onChange: (event) => onChange({ user: event.target.value }),
                className: "h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 px-4 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/5 transition-all w-full [color-scheme:light] dark:[color-scheme:dark]",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "all", children: "Global view" }),
                  users.map((user) => /* @__PURE__ */ jsx("option", { value: user, children: user }, user))
                ]
              }
            )
          ] }) : null,
          /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500", children: [
            "Muscle Group",
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: filters.muscleGroup,
                onChange: (event) => onChange({ muscleGroup: event.target.value }),
                className: "h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 px-4 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/5 transition-all w-full [color-scheme:light] dark:[color-scheme:dark]",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "all", children: "All Muscle Groups" }),
                  muscleGroups.map((group) => /* @__PURE__ */ jsx("option", { value: group, children: group }, group))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500", children: [
            "Start Date",
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: filters.startDate,
                onChange: (event) => onChange({ startDate: event.target.value }),
                className: "h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 px-4 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/5 transition-all w-full [color-scheme:light] dark:[color-scheme:dark]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500", children: [
            "End Date",
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: filters.endDate,
                onChange: (event) => onChange({ endDate: event.target.value }),
                className: "h-11 rounded-xl bg-slate-50 border border-slate-100 px-4 text-xs font-semibold text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/5 transition-all"
              }
            )
          ] })
        ] })
      ]
    }
  );
};
export {
  FilterPanel
};
