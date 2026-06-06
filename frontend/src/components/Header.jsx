import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import { Dumbbell, HelpCircle, LogOut, Moon, RefreshCw, Sun } from "lucide-react";
import { useTheme } from "@/src/contexts/ThemeContext";
import { cn } from "@/src/lib/utils";
const Header = ({ onRefresh, refreshing, user, onLogout, onHelp }) => {
  const { theme, toggleTheme } = useTheme();
  return /* @__PURE__ */ jsxs("header", { className: "relative border-b border-white/10 dark:border-white/10 p-4 md:p-6 flex justify-between items-center sticky top-0 bg-[#07080D]/70 dark:bg-[#07080D]/70 backdrop-blur-xl z-20 data-[theme=light]:bg-white/90 data-[theme=light]:border-slate-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-br from-cyan-300 to-fuchsia-400 p-2.5 rounded-lg shadow-[0_0_24px_rgba(34,211,238,0.35)]", children: /* @__PURE__ */ jsx(Dumbbell, { className: "text-[#07080D] w-5 h-5" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl md:text-2xl font-bold tracking-tight uppercase dark:text-white data-[theme=light]:text-slate-900", children: "Fit Tracker" }),
        /* @__PURE__ */ jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400 data-[theme=light]:text-slate-500", children: "Realtime workout intelligence" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-right mr-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-slate-200 dark:text-slate-200 data-[theme=light]:text-slate-700", children: user.displayName }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-mono uppercase tracking-[0.15em] text-slate-400 dark:text-slate-400 data-[theme=light]:text-slate-500", children: user.role })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onHelp,
          className: "flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-3 py-2 rounded-lg border border-white/20 dark:border-white/20 data-[theme=light]:border-slate-300 text-slate-300 dark:text-slate-300 data-[theme=light]:text-slate-600 hover:text-white dark:hover:text-white data-[theme=light]:hover:text-slate-900 hover:border-cyan-200/60 dark:hover:border-cyan-200/60 data-[theme=light]:hover:border-cyan-400 transition-all",
          children: [
            /* @__PURE__ */ jsx(HelpCircle, { className: "w-3.5 h-3.5" }),
            "Help"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: toggleTheme,
          className: "flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-3 py-2 rounded-lg border border-white/20 dark:border-white/20 data-[theme=light]:border-slate-300 text-slate-300 dark:text-slate-300 data-[theme=light]:text-slate-600 hover:text-white dark:hover:text-white data-[theme=light]:hover:text-slate-900 hover:border-cyan-200/60 dark:hover:border-cyan-200/60 data-[theme=light]:hover:border-cyan-400 transition-all",
          children: [
            theme === "dark" ? /* @__PURE__ */ jsx(Sun, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ jsx(Moon, { className: "w-3.5 h-3.5" }),
            theme === "dark" ? "Light" : "Dark"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onRefresh,
          disabled: refreshing,
          className: "flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded-lg border border-cyan-200/30 dark:border-cyan-200/30 data-[theme=light]:border-cyan-300/40 bg-white/5 dark:bg-white/5 data-[theme=light]:bg-cyan-50 hover:bg-cyan-300/15 dark:hover:bg-cyan-300/15 data-[theme=light]:hover:bg-cyan-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-300 data-[theme=light]:text-slate-700",
          children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: cn("w-3 h-3", refreshing && "animate-spin") }),
            refreshing ? "Syncing..." : "Refresh"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onLogout,
          className: "flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-3 py-2 rounded-lg border border-white/20 dark:border-white/20 data-[theme=light]:border-slate-300 text-slate-300 dark:text-slate-300 data-[theme=light]:text-slate-600 hover:text-white dark:hover:text-white data-[theme=light]:hover:text-slate-900 hover:border-cyan-200/60 dark:hover:border-cyan-200/60 data-[theme=light]:hover:border-cyan-400 transition-all",
          children: [
            /* @__PURE__ */ jsx(LogOut, { className: "w-3.5 h-3.5" }),
            "Logout"
          ]
        }
      )
    ] })
  ] });
};
export {
  Header
};
