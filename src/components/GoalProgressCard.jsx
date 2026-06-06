import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/src/lib/utils";
const GoalProgressCard = ({
  current,
  total,
  label,
  onSetGoalClick,
  fillHeight = false,
  hasGoal = true
}) => {
  const percentage = total > 0 ? Math.min(100, Math.max(0, current / total * 100)) : 0;
  const radius = 40;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference * (1 - (hasGoal ? percentage : 0) / 100);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium border border-slate-50 dark:border-white/5 flex flex-col hover:shadow-card-hover transition-all group",
        fillHeight && "h-full"
      ),
      children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-8", children: /* @__PURE__ */ jsx("div", { className: "space-y-1", children: hasGoal ? /* @__PURE__ */ jsxs("h3", { className: "text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight", children: [
          "Set your Fitness Goals ",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "for the quality of your health" })
        ] }) : /* @__PURE__ */ jsxs("h3", { className: "text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight", children: [
          "You don't have goals ",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-slate-400 italic", children: "Create a goal to track progress" })
        ] }) }) }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "flex flex-col items-center justify-center relative py-6",
              fillHeight && "flex-1"
            ),
            children: [
              /* @__PURE__ */ jsxs("svg", { className: "w-48 h-24", viewBox: "0 0 100 50", children: [
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M 10 50 A 40 40 0 0 1 90 50",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "8",
                    strokeLinecap: "round",
                    className: "text-slate-100 dark:text-slate-800"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M 10 50 A 40 40 0 0 1 90 50",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "8",
                    strokeLinecap: "round",
                    strokeDasharray: circumference,
                    strokeDashoffset,
                    className: "text-purple-600 transition-all duration-1000 ease-out"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-center -mt-2", children: hasGoal ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-400 uppercase tracking-widest", children: "Daily Goal" }),
                /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-slate-900 dark:text-white tracking-tight", children: [
                  current,
                  "/",
                  total,
                  label
                ] })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-400 uppercase tracking-widest", children: "No Active Goal" }),
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-slate-300 dark:text-slate-600 tracking-tight", children: "-- / --" })
              ] }) })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-slate-400", children: hasGoal ? `You have reached ${Math.round(percentage)}% of your goal this month` : "Set a goal to see your monthly progress here" }) }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onSetGoalClick,
            className: "mt-4 flex items-center justify-between w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl group-hover:bg-purple-600 dark:group-hover:bg-purple-500 group-hover:text-white transition-all text-sm font-bold text-slate-600 dark:text-slate-300",
            children: [
              /* @__PURE__ */ jsx("span", { children: hasGoal ? "Update Fitness Goals" : "Create Goal Now" }),
              /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
            ]
          }
        )
      ]
    }
  );
};
export {
  GoalProgressCard
};
