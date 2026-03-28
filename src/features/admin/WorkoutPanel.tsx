import React, { useEffect, useState } from "react";
import { MessageSquare, Save, Loader2, Plus, Trash2, Edit3, ChevronRight, Info } from "lucide-react";
import { fitnessApi } from "@/src/services/api";
import { BotCommand } from "@/src/types/fitness";

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
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <MessageSquare className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Bot Commands</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage Telegram bot workout responses</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
          <Info className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-amber-500">Admin Only</span>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500 animate-in zoom-in-95 duration-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {commands.map((cmd) => (
          <div
            key={cmd.command}
            className="group relative bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-300 shadow-sm hover:shadow-cyan-500/5"
          >
            {editingCommand?.command === cmd.command ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-cyan-500 uppercase tracking-tight">{cmd.command}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCommand(null)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(cmd.command, editingCommand.response)}
                      disabled={saving === cmd.command}
                      className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all"
                    >
                      {saving === cmd.command ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save Changes
                    </button>
                  </div>
                </div>
                <textarea
                  value={editingCommand.response}
                  onChange={(e) => setEditingCommand({ ...editingCommand, response: e.target.value })}
                  className="w-full min-h-[120px] p-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-sans focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all resize-none"
                  placeholder="Enter workout instructions..."
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                      {cmd.command}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                      Last updated: {new Date(cmd.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingCommand(cmd)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-cyan-500 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <pre className="text-xs text-slate-600 dark:text-slate-400 font-sans whitespace-pre-wrap line-clamp-3 bg-slate-50/50 dark:bg-black/10 p-3 rounded-lg border border-slate-100 dark:border-white/5">
                    {cmd.response}
                  </pre>
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-slate-900/40 pointer-events-none rounded-b-lg opacity-40" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Create New Command */}
        <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-medium text-sm">
              <Plus className="w-4 h-4" />
              <span>Create New Bot Command</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={newCommandName}
                onChange={(e) => setNewCommandName(e.target.value)}
                placeholder="Command (e.g. /abs)"
                className="p-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
              />
              <button
                onClick={handleCreate}
                disabled={saving === "new" || !newCommandName || !newCommandResponse}
                className="flex items-center justify-center gap-2 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-30 rounded-xl text-sm font-bold shadow-lg transition-all"
              >
                {saving === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Command
              </button>
            </div>
            <textarea
              value={newCommandResponse}
              onChange={(e) => setNewCommandResponse(e.target.value)}
              placeholder="Full workout instruction text..."
              className="w-full min-h-[100px] p-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all resize-none shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
