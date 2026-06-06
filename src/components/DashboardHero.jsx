import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import { Plus } from "lucide-react";
const DashboardHero = ({ userName, onAddClick }) => {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight italic", children: [
        "Good Morning, ",
        /* @__PURE__ */ jsxs("span", { className: "text-purple-600 not-italic", children: [
          userName,
          "!"
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 font-medium text-sm", children: "Ready to crush your goals today?" })
    ] }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onAddClick,
        className: "flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-2xl shadow-lg shadow-purple-100 dark:shadow-none transition-all font-bold tracking-tight",
        children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          "Add Exercise"
        ]
      }
    )
  ] });
};
export {
  DashboardHero
};
