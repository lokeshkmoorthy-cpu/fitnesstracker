import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, X } from "lucide-react";
const CreateCommandModal = ({
  isOpen,
  onClose,
  command,
  response,
  onCommandChange,
  onResponseChange,
  onSubmit,
  submitting
}) => {
  return /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsx(
    motion.div,
    {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm",
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        motion.div,
        {
          className: "w-full max-w-lg rounded-3xl bg-white dark:bg-slate-950/90 border border-slate-100 dark:border-white/10 p-6 shadow-[0_35px_90px_rgba(15,23,42,0.35)]",
          initial: { scale: 0.96, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.96, opacity: 0 },
          transition: { duration: 0.16 },
          onClick: (event) => event.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400", children: "Admin" }),
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Create Bot Command" })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: onClose,
                  className: "text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors",
                  "aria-label": "Close create command modal",
                  children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-[0.3em] text-slate-400", children: "Command key" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: command,
                    onChange: (event) => onCommandChange(event.target.value),
                    placeholder: "/legday",
                    className: "w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none transition-all"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-[0.3em] text-slate-400", children: "Workout response" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    value: response,
                    onChange: (event) => onResponseChange(event.target.value),
                    rows: 6,
                    placeholder: "Full workout instruction markdown text...",
                    className: "w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none transition-all resize-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "pt-2 border-t border-slate-100 dark:border-white/10", children: /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: onSubmit,
                  disabled: submitting,
                  className: "w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-600 text-white px-4 py-3 text-sm font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-700 disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                    submitting ? "Creating..." : "Create command"
                  ]
                }
              ) })
            ] })
          ]
        }
      )
    }
  ) });
};
export {
  CreateCommandModal
};
