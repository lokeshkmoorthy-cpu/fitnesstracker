import React, { useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Users, X, Plus } from "lucide-react";
import { WorkoutPanel } from "@/src/features/admin/WorkoutPanel";

interface AdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const createOpenerRef = useRef<() => void>();
  const registerOpener = useCallback((open: () => void) => {
    createOpenerRef.current = open;
  }, []);

  const openCreateModal = useCallback(() => {
    createOpenerRef.current?.();
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_40px_120px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-950/90 dark:shadow-[0_40px_120px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
            initial={{ y: 32, opacity: 0.5, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-white/10">
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
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  aria-label="Close admin console"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 max-h-[70vh] overflow-auto space-y-4 pr-2">
              <WorkoutPanel onRegisterCreateModalOpener={registerOpener} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
