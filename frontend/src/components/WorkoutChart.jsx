import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import { ChevronDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
const WorkoutChart = ({ data }) => {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-premium border border-slate-50 dark:border-white/5 h-full flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold tracking-tight text-slate-900 dark:text-white", children: "Workout Statistic" }),
      /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "This Week" }),
        /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 w-full min-h-0", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 6, right: 8, left: -20, bottom: 0 }, children: [
      /* @__PURE__ */ jsx(CartesianGrid, { vertical: false, strokeDasharray: "3 3", stroke: "#f1f5f9" }),
      /* @__PURE__ */ jsx(
        XAxis,
        {
          dataKey: "name",
          axisLine: false,
          tickLine: false,
          tick: { fill: "#94a3b8", fontSize: 11, fontWeight: 600 },
          dy: 8
        }
      ),
      /* @__PURE__ */ jsx(
        YAxis,
        {
          axisLine: false,
          tickLine: false,
          tick: { fill: "#94a3b8", fontSize: 11, fontWeight: 600 }
        }
      ),
      /* @__PURE__ */ jsx(
        Tooltip,
        {
          cursor: { fill: "#f8fafc" },
          content: ({ active, payload }) => {
            if (active && payload?.length) {
              return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-3 shadow-xl border border-slate-50 dark:border-white/10 rounded-2xl text-center", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1", children: payload[0].payload.name }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-slate-900 dark:text-white", children: [
                  "Total Calories: ",
                  payload[0].value,
                  " KCal"
                ] })
              ] });
            }
            return null;
          }
        }
      ),
      /* @__PURE__ */ jsx(Bar, { dataKey: "value", radius: [6, 6, 6, 6], barSize: 28, children: data.map((_, index) => /* @__PURE__ */ jsx(
        Cell,
        {
          fill: index === Math.floor(data.length / 2) ? "#7c3aed" : "#a78bfa",
          fillOpacity: index === Math.floor(data.length / 2) ? 1 : 0.6
        },
        `cell-${index}`
      )) })
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "pt-2 flex items-center justify-center gap-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-purple-600" }),
        /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-slate-500 uppercase tracking-wider", children: "Completed" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-purple-200 dark:bg-purple-900/40" }),
        /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-slate-500 uppercase tracking-wider", children: "Target" })
      ] })
    ] })
  ] });
};
export {
  WorkoutChart
};
