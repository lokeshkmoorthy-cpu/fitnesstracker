import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, HelpCircle, Bot, Zap, Layout, Send } from "lucide-react";
const HelpModal = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);
  return /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen ? /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      className: "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4",
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, scale: 0.95, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.95, y: 20 },
          className: "w-full max-w-2xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "relative h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 flex items-end justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-black text-white tracking-tight flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Bot, { className: "w-8 h-8" }),
                  "Fit Tracker Guide"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-white/80 text-xs font-bold uppercase tracking-widest mt-1", children: "Everything you need to master your fitness" })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onClose,
                  className: "absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md",
                  children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-8 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800", children: [
              /* @__PURE__ */ jsxs("section", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg", children: /* @__PURE__ */ jsx(Layout, { className: "w-4 h-4 text-indigo-600" }) }),
                  /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider", children: "What is Fit Tracker?" })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-slate-600 dark:text-slate-400 text-sm leading-relaxed", children: [
                  "Fit Tracker is a premium fitness management platform designed to help you track workouts, monitor progress, and achieve your health goals. It combines high-performance visualization with seamless automation through our ",
                  /* @__PURE__ */ jsx("span", { className: "text-indigo-600 font-bold", children: "Telegram Integration" }),
                  "."
                ] })
              ] }),
              /* @__PURE__ */ jsxs("section", { className: "bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-white/5", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
                  /* @__PURE__ */ jsx("div", { className: "p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg", children: /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 text-purple-600" }) }),
                  /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider", children: "Telegram Logging Guide" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-black text-indigo-600 border border-slate-200 dark:border-white/10 shadow-sm", children: "1" }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-white", children: "Connect with the Bot" }),
                      /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [
                        "Search for ",
                        /* @__PURE__ */ jsx("span", { className: "font-mono bg-slate-200 px-1 dark:bg-slate-800 rounded", children: "@FitTracker_Bot" }),
                        " on Telegram and tap Start."
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-black text-indigo-600 border border-slate-200 dark:border-white/10 shadow-sm", children: "2" }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-white", children: "Log Workouts instantly" }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1 mb-3", children: "Send your workout details using this format for automatic analysis:" }),
                      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-xs", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-indigo-500 italic", children: "Muscle Group" }),
                        " - ",
                        /* @__PURE__ */ jsx("span", { className: "text-purple-500 italic", children: "Exercise" }),
                        " - ",
                        /* @__PURE__ */ jsx("span", { className: "text-pink-500 italic", children: "Sets/Reps" })
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-2 italic", children: 'Example: "Chest - Bench Press - 3 x 10 @ 60kg"' })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-black text-indigo-600 border border-slate-200 dark:border-white/10 shadow-sm", children: "3" }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-white", children: "Real-time Syncing" }),
                      /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [
                        "Every message you send is instantly parsed and reflected in your Dashboard. Click ",
                        /* @__PURE__ */ jsx("span", { className: "font-bold text-purple-600", children: "Refresh" }),
                        " to see the latest updates."
                      ] })
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                    /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4 text-indigo-600" }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-900 dark:text-white", children: "Quick Log" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500 leading-relaxed", children: "No apps to open. Just one message to log daily sets." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100/50 dark:border-purple-500/10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                    /* @__PURE__ */ jsx(Bot, { className: "w-4 h-4 text-purple-600" }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-900 dark:text-white", children: "Smart Parsing" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500 leading-relaxed", children: "AI analyzes your text to identify volume and intensity." })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-white/5 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 font-medium tracking-tight", children: [
              "For advanced support, contact the ",
              /* @__PURE__ */ jsx("span", { className: "text-indigo-600 font-bold underline cursor-pointer", children: "Fitness Intelligence Team" })
            ] }) })
          ]
        }
      )
    }
  ) : null });
};
export {
  HelpModal
};
