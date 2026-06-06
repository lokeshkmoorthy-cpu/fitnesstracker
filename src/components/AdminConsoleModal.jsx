import { jsx, jsxs } from "react/jsx-runtime";
import React, { useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Users, X, Plus } from "lucide-react";
import { WorkoutPanel } from "@/src/features/admin/WorkoutPanel";
const AdminConsoleModal = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);
  const createOpenerRef = useRef();
  const registerOpener = useCallback((open) => {
    createOpenerRef.current = open;
  }, []);
  const openCreateModal = useCallback(() => {
    createOpenerRef.current?.();
  }, []);
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
          className: "w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_40px_120px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-950/90 dark:shadow-[0_40px_120px_rgba(0,0,0,0.65)]",
          onClick: (event) => event.stopPropagation(),
          initial: { y: 32, opacity: 0.5, scale: 0.98 },
          animate: { y: 0, opacity: 1, scale: 1 },
          exit: { y: 16, opacity: 0, scale: 0.98 },
          transition: { duration: 0.2 },
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-white/10", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-2xl bg-purple-50 dark:bg-purple-900/40 flex items-center justify-center text-purple-600", children: /* @__PURE__ */ jsx(Users, { className: "w-5 h-5" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: "Admin" }),
                  /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Bot Command Console" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: openCreateModal,
                    className: "flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5" }),
                      "Add command"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: onClose,
                    className: "text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors",
                    "aria-label": "Close admin console",
                    children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 max-h-[70vh] overflow-auto space-y-4 pr-2", children: /* @__PURE__ */ jsx(WorkoutPanel, { onRegisterCreateModalOpener: registerOpener }) })
          ]
        }
      )
    }
  ) });
};
export {
  AdminConsoleModal
};
