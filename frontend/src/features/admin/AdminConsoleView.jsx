import { jsx, jsxs } from "react/jsx-runtime";
import React, { useCallback, useRef } from "react";
import { Users, Plus } from "lucide-react";
import { WorkoutPanel } from "@/src/features/admin/WorkoutPanel";
const AdminConsoleView = () => {
  const createOpenerRef = useRef(null);
  const registerOpener = useCallback((open) => {
    createOpenerRef.current = open;
  }, []);
  const openCreateModal = useCallback(() => {
    createOpenerRef.current?.();
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-slate-100 p-6 dark:border-white/10 shrink-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-2xl bg-purple-50 dark:bg-purple-900/40 flex items-center justify-center text-purple-600", children: /* @__PURE__ */ jsx(Users, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: "Admin" }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Bot Command Console" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
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
      ) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto p-6 space-y-4", children: /* @__PURE__ */ jsx(WorkoutPanel, { onRegisterCreateModalOpener: registerOpener }) })
  ] });
};
export {
  AdminConsoleView
};
