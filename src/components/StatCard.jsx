import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import { clsx } from "clsx";
const StatCard = ({ label, value, icon, subtitle, trend, className }) => {
  return /* @__PURE__ */ jsxs("div", { className: clsx(
    "bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-premium border border-slate-50 dark:border-white/5 flex flex-col justify-between hover:shadow-card-hover transition-all group overflow-hidden relative",
    className
  ), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsx("div", { className: "p-2 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 dark:group-hover:bg-purple-500/20 dark:group-hover:text-purple-400 transition-colors", children: icon }),
      trend && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg", children: trend })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5", children: label }),
      /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none", children: value }),
      subtitle && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-medium text-slate-400 mt-0.5 block", children: subtitle })
    ] })
  ] });
};
export {
  StatCard
};
