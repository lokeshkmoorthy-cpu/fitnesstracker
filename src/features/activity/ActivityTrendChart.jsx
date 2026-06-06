import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import { ActivitySquare, Flame, Timer } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
const ActivityTrendChart = ({ data }) => {
  const summary = React.useMemo(() => {
    return data.reduce(
      (acc, current) => {
        acc.calories += current.calories || 0;
        acc.activeMinutes += current.activeMinutes || 0;
        return acc;
      },
      { calories: 0, activeMinutes: 0 }
    );
  }, [data]);
  if (!data || data.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-12 rounded-[2rem] flex flex-col items-center justify-center text-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center", children: /* @__PURE__ */ jsx(ActivitySquare, { className: "w-8 h-8 text-slate-400 dark:text-slate-600" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest", children: "No Activity Records" }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-slate-400 mt-1", children: "Try adjusting your filters or date range" })
      ] })
    ] });
  }
  const chartData = data.slice(-18);
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-8 rounded-[2rem] shadow-premium transition-all", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(ActivitySquare, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200", children: "Activity Trends" }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold text-slate-400 tracking-wider mt-0.5", children: [
            "Last ",
            chartData.length,
            " Days Performance"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-white/5", children: /* @__PURE__ */ jsx("div", { className: "px-3 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm", children: /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest", children: "Bar Chart View" }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 pt-2 border-b border-slate-50 dark:border-white/5 mb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "p-6 rounded-[1.5rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Flame, { className: "w-5 h-5 text-orange-600 dark:text-orange-400" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400", children: "Calories Burned" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xl font-black text-slate-900 dark:text-white", children: [
            summary.calories.toLocaleString(),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-400", children: "kCal" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "p-6 rounded-[1.5rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Timer, { className: "w-5 h-5 text-teal-600 dark:text-teal-400" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400", children: "Active Time" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xl font-black text-slate-900 dark:text-white", children: [
            summary.activeMinutes,
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-400", children: "Min" })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "h-[360px] w-full", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: chartData, margin: { top: 10, right: 20, left: -10, bottom: 0 }, barGap: 8, barCategoryGap: "25%", children: [
      /* @__PURE__ */ jsxs("defs", { children: [
        /* @__PURE__ */ jsxs("linearGradient", { id: "stepsGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#818CF8", stopOpacity: 1 }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#4F46E5", stopOpacity: 0.8 })
        ] }),
        /* @__PURE__ */ jsxs("linearGradient", { id: "caloriesGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#F472B6", stopOpacity: 1 }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#DB2777", stopOpacity: 0.8 })
        ] }),
        /* @__PURE__ */ jsxs("linearGradient", { id: "activeGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#34D399", stopOpacity: 1 }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#10B981", stopOpacity: 0.8 })
        ] }),
        /* @__PURE__ */ jsxs("linearGradient", { id: "distanceGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#60A5FA", stopOpacity: 1 }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#2563EB", stopOpacity: 0.8 })
        ] })
      ] }),
      /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "4 4", vertical: false, stroke: "rgba(148,163,184,0.1)" }),
      /* @__PURE__ */ jsx(
        XAxis,
        {
          dataKey: "date",
          tick: { fontSize: 9, fontWeight: 800, fill: "#64748B" },
          axisLine: false,
          tickLine: false,
          dy: 15,
          tickFormatter: (date) => {
            const d = new Date(date);
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }
        }
      ),
      /* @__PURE__ */ jsx(
        YAxis,
        {
          yAxisId: "left",
          tick: { fontSize: 9, fontWeight: 700, fill: "#94A3B8" },
          axisLine: false,
          tickLine: false,
          hide: true
        }
      ),
      /* @__PURE__ */ jsx(
        YAxis,
        {
          yAxisId: "right",
          orientation: "right",
          tick: { fontSize: 9, fontWeight: 700, fill: "#94A3B8" },
          axisLine: false,
          tickLine: false,
          hide: true
        }
      ),
      /* @__PURE__ */ jsx(
        Tooltip,
        {
          cursor: { fill: "rgba(255,255,255,0.03)", radius: 12 },
          content: ({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 pb-2 border-b border-white/10", children: new Date(label).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) }),
                /* @__PURE__ */ jsx("div", { className: "space-y-2", children: payload.map((entry, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-6", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full", style: { backgroundColor: entry.color } }),
                    /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-slate-300", children: entry.name })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-white", children: entry.value })
                ] }, index)) })
              ] });
            }
            return null;
          }
        }
      ),
      /* @__PURE__ */ jsx(
        Legend,
        {
          wrapperStyle: { paddingTop: 30, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" },
          iconType: "circle",
          iconSize: 8
        }
      ),
      /* @__PURE__ */ jsx(Bar, { yAxisId: "left", dataKey: "steps", fill: "url(#stepsGradient)", radius: [6, 6, 0, 0], name: "Steps", barSize: 24 }),
      /* @__PURE__ */ jsx(Bar, { yAxisId: "left", dataKey: "activeMinutes", fill: "url(#activeGradient)", radius: [6, 6, 0, 0], name: "Active Min", barSize: 24 }),
      /* @__PURE__ */ jsx(Bar, { yAxisId: "right", dataKey: "calories", fill: "url(#caloriesGradient)", radius: [6, 6, 0, 0], name: "Calories", barSize: 24 }),
      /* @__PURE__ */ jsx(Bar, { yAxisId: "right", dataKey: "distanceKm", fill: "url(#distanceGradient)", radius: [6, 6, 0, 0], name: "Distance", barSize: 24 })
    ] }) }) })
  ] });
};
export {
  ActivityTrendChart
};
