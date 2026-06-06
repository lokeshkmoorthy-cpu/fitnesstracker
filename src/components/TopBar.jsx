import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import {
  ChevronLeft,
  RefreshCw,
  HelpCircle,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useTheme } from "@/src/contexts/ThemeContext";
const TopBar = ({ title, onRefresh, refreshing, onHelp }) => {
  const { theme, toggleTheme } = useTheme();
  return /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between mb-8 px-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-1.5 h-8 bg-purple-600 rounded-full" }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black tracking-tight text-slate-900 dark:text-white", children: title })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: toggleTheme,
          className: cn(
            "relative w-[76px] h-9 flex items-center rounded-full cursor-pointer p-1.5 transition-all duration-500 overflow-hidden",
            "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-inner",
            theme === "light" ? "shadow-[inset_0_0_12px_rgba(245,158,11,0.1)]" : "shadow-[inset_0_0_12px_rgba(129,140,248,0.1)]"
          ),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex justify-between items-center px-2.5 pointer-events-none", children: [
              /* @__PURE__ */ jsx(Sun, { className: cn("w-3.5 h-3.5 transition-all duration-500", theme === "light" ? "text-amber-500 opacity-100 scale-110" : "text-slate-400 opacity-20") }),
              /* @__PURE__ */ jsx(Moon, { className: cn("w-3.5 h-3.5 transition-all duration-500", theme === "dark" ? "text-indigo-400 opacity-100 scale-110" : "text-slate-500 opacity-20") })
            ] }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "relative z-10 w-7 h-6.5 rounded-full flex items-center justify-center transition-all duration-500 ease-out",
                  "bg-white dark:bg-slate-950 shadow-md",
                  theme === "dark" ? "translate-x-9" : "translate-x-0"
                ),
                children: theme === "dark" ? /* @__PURE__ */ jsx(Moon, { className: "w-3.5 h-3.5 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" }) : /* @__PURE__ */ jsx(Sun, { className: "w-3.5 h-3.5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" })
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "absolute top-0 left-0 h-full w-1/2 transition-all duration-700 blur-xl opacity-40",
                  theme === "light" ? "bg-amber-400 scale-125 translate-x-[-20%]" : "opacity-0"
                )
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "absolute top-0 right-0 h-full w-1/2 transition-all duration-700 blur-xl opacity-40",
                  theme === "dark" ? "bg-indigo-500 scale-125 translate-x-[20%]" : "opacity-0"
                )
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "h-6 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onHelp,
            className: "flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl shadow-premium border border-slate-50 dark:border-white/5 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all active:scale-95 group",
            children: [
              /* @__PURE__ */ jsx(HelpCircle, { className: "w-4 h-4 group-hover:rotate-12 transition-transform" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black uppercase tracking-wider", children: "Help" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onRefresh,
            disabled: refreshing,
            className: cn(
              "flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl shadow-premium border border-slate-50 dark:border-white/5 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all active:scale-95 group",
              refreshing && "opacity-50 cursor-not-allowed"
            ),
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: cn("w-4 h-4", refreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500") }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black uppercase tracking-wider", children: refreshing ? "Syncing" : "Refresh" })
            ]
          }
        )
      ] })
    ] })
  ] });
};
export {
  TopBar
};
