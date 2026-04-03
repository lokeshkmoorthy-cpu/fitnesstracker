import React, { useCallback, useRef } from "react";
import { Users, Plus } from "lucide-react";
import { WorkoutPanel } from "@/src/features/admin/WorkoutPanel";

export const AdminConsoleView: React.FC = () => {
  const createOpenerRef = useRef<(() => void) | null>(null);
  const registerOpener = useCallback((open: () => void) => {
    createOpenerRef.current = open;
  }, []);

  const openCreateModal = useCallback(() => {
    createOpenerRef.current?.();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-6 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-purple-50 dark:bg-purple-900/40 flex items-center justify-center text-purple-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Admin</p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Bot Command Console</h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add command
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        <WorkoutPanel onRegisterCreateModalOpener={registerOpener} />
      </div>
    </div>
  );
};
