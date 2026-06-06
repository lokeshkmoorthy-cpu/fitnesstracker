import { jsx, jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { MessageSquare, Save, Loader2, Plus, Trash2, Edit3, ChevronRight, Info, Clock, Terminal, X } from "lucide-react";
import { fitnessApi } from "@/src/services/api";
import { cn } from "@/src/lib/utils";
import { CreateCommandModal } from "@/src/components/CreateCommandModal";
function WorkoutPanel({ onRegisterCreateModalOpener }) {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);
  const [editingCommand, setEditingCommand] = useState(null);
  const [newCommandName, setNewCommandName] = useState("");
  const [newCommandResponse, setNewCommandResponse] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  useEffect(() => {
    if (onRegisterCreateModalOpener) {
      onRegisterCreateModalOpener(() => setIsCreateModalOpen(true));
    }
  }, [onRegisterCreateModalOpener]);
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fitnessApi.getBotCommands();
      setCommands(data);
    } catch (err) {
      setError("Failed to load bot commands");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleUpdate = async (cmd, response) => {
    setSaving(cmd);
    setError(null);
    try {
      await fitnessApi.updateBotCommand(cmd, response);
      await fetchData();
      setEditingCommand(null);
    } catch (err) {
      setError(`Failed to update ${cmd}`);
    } finally {
      setSaving(null);
    }
  };
  const handleCreate = async () => {
    if (!newCommandName.startsWith("/")) {
      setError("Command must start with /");
      return;
    }
    if (!newCommandName || !newCommandResponse) {
      setError("Command name and response are required");
      return;
    }
    setSaving("new");
    try {
      await fitnessApi.updateBotCommand(newCommandName, newCommandResponse);
      await fetchData();
      setNewCommandName("");
      setNewCommandResponse("");
      setIsCreateModalOpen(false);
    } catch (err) {
      setError("Failed to create command");
    } finally {
      setSaving(null);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center p-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-purple-600" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    error && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl text-xs font-bold text-red-500 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 shrink-0" }),
      error
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
      commands.map((cmd) => /* @__PURE__ */ jsx(
        "div",
        {
          className: "group relative bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-white/5 rounded-3xl p-6 hover:bg-white dark:hover:bg-slate-900/60 hover:shadow-premium transition-all duration-300",
          children: editingCommand?.command === cmd.command ? /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("span", { className: "bg-purple-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-purple-100 dark:shadow-none", children: "Editing" }),
                /* @__PURE__ */ jsx("span", { className: "font-mono text-base font-extrabold text-slate-900 dark:text-white", children: cmd.command })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setEditingCommand(null),
                    className: "flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }),
                      "Cancel"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handleUpdate(cmd.command, editingCommand.response),
                    disabled: saving === cmd.command,
                    className: "flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-lg shadow-purple-100 dark:shadow-none transition-all active:scale-95",
                    children: [
                      saving === cmd.command ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-3.5 h-3.5" }),
                      "Update Response"
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: editingCommand.response,
                onChange: (e) => setEditingCommand({ ...editingCommand, response: e.target.value }),
                className: "w-full min-h-[200px] p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-3xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-purple-600/5 focus:border-purple-600 outline-none transition-all resize-none shadow-sm scrollbar-custom",
                placeholder: "Enter workout instructions..."
              }
            )
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "bg-purple-50 dark:bg-purple-900/20 p-2 rounded-xl", children: /* @__PURE__ */ jsx(Terminal, { className: "w-4 h-4 text-purple-600 dark:text-purple-400" }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight", children: cmd.command }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest", children: [
                    /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                    "Updated ",
                    new Date(cmd.updatedAt).toLocaleDateString()
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setEditingCommand(cmd),
                  className: "p-2.5 opacity-0 group-hover:opacity-100 hover:bg-purple-50 dark:hover:bg-purple-900/40 rounded-xl text-slate-400 hover:text-purple-600 transition-all shadow-sm bg-white dark:bg-slate-800",
                  children: /* @__PURE__ */ jsx(Edit3, { className: "w-3 h-3" })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "p-5 bg-white dark:bg-slate-950/40 rounded-2xl border border-slate-50 dark:border-white/5 shadow-premium-sm group-hover:shadow-none transition-all", children: /* @__PURE__ */ jsx("pre", { className: "text-xs font-medium text-slate-600 dark:text-slate-300 font-sans whitespace-pre-wrap line-clamp-3 leading-relaxed tracking-tight", children: cmd.response }) })
          ] })
        },
        cmd.command
      )),
      /* @__PURE__ */ jsx(
        CreateCommandModal,
        {
          isOpen: isCreateModalOpen,
          onClose: () => setIsCreateModalOpen(false),
          command: newCommandName,
          response: newCommandResponse,
          onCommandChange: setNewCommandName,
          onResponseChange: setNewCommandResponse,
          submitting: saving === "new",
          onSubmit: handleCreate
        }
      )
    ] })
  ] });
}
export {
  WorkoutPanel
};
