import React, { useEffect, useState } from "react";
import { MessageSquare, Save, Loader2, Plus, Trash2, Edit3, ChevronRight, Info, Clock, Terminal, X } from "lucide-react";
import { fitnessApi } from "@/src/services/api";
import { BotCommand } from "@/src/types/fitness";
import { cn } from "@/src/lib/utils";

export function WorkoutPanel() {
  const [commands, setCommands] = useState<BotCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingCommand, setEditingCommand] = useState<BotCommand | null>(null);
  const [newCommandName, setNewCommandName] = useState("");
  const [newCommandResponse, setNewCommandResponse] = useState("");

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

  const handleUpdate = async (cmd: string, response: string) => {
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
    } catch (err) {
      setError("Failed to create command");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl text-xs font-bold text-red-500 flex items-center gap-3">
          <Info className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {commands.map((cmd) => (
          <div
            key={cmd.command}
            className="group relative bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-white/5 rounded-3xl p-6 hover:bg-white dark:hover:bg-slate-900/60 hover:shadow-premium transition-all duration-300"
          >
            {editingCommand?.command === cmd.command ? (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-purple-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-purple-100 dark:shadow-none">Editing</span>
                    <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">{cmd.command}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingCommand(null)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(cmd.command, editingCommand.response)}
                      disabled={saving === cmd.command}
                      className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-lg shadow-purple-100 dark:shadow-none transition-all active:scale-95"
                    >
                      {saving === cmd.command ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Update Response
                    </button>
                  </div>
                </div>
                <textarea
                  value={editingCommand.response}
                  onChange={(e) => setEditingCommand({ ...editingCommand, response: e.target.value })}
                  className="w-full min-h-[200px] p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-3xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-purple-600/5 focus:border-purple-600 outline-none transition-all resize-none shadow-sm scrollbar-custom"
                  placeholder="Enter workout instructions..."
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-xl">
                      <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                        {cmd.command}
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        Updated {new Date(cmd.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingCommand(cmd)}
                    className="p-2.5 opacity-0 group-hover:opacity-100 hover:bg-purple-50 dark:hover:bg-purple-900/40 rounded-xl text-slate-400 hover:text-purple-600 transition-all shadow-sm bg-white dark:bg-slate-800"
                  >
                    <Edit3 className="w-4.5 h-4.5" />
                  </button>
                </div>
                <div className="p-5 bg-white dark:bg-slate-950/40 rounded-2xl border border-slate-50 dark:border-white/5 shadow-premium-sm group-hover:shadow-none transition-all">
                  <pre className="text-xs font-medium text-slate-600 dark:text-slate-300 font-sans whitespace-pre-wrap line-clamp-3 leading-relaxed tracking-tight">
                    {cmd.response}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Create New Command */}
        <div className="bg-white dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-8 hover:border-purple-600/50 transition-all duration-300 shadow-sm mt-4">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                  <Plus className="w-4 h-4 text-slate-400" />
               </div>
               <div>
                 <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight block">Add New Response</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Create a custom bot trigger</span>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={newCommandName}
                  onChange={(e) => setNewCommandName(e.target.value)}
                  placeholder="Command key (e.g. /legday)"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-purple-600/5 focus:border-purple-600 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={saving === "new" || !newCommandName || !newCommandResponse}
                className="flex items-center justify-center gap-2 p-3.5 bg-slate-900 dark:bg-purple-600 text-white hover:bg-slate-800 dark:hover:bg-purple-700 disabled:opacity-30 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95"
              >
                {saving === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create
              </button>
            </div>
            <textarea
              value={newCommandResponse}
              onChange={(e) => setNewCommandResponse(e.target.value)}
              placeholder="Full workout instruction markdown text..."
              className="w-full min-h-[140px] p-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-purple-600/5 focus:border-purple-600 outline-none transition-all resize-none placeholder:text-slate-400 scrollbar-custom"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
