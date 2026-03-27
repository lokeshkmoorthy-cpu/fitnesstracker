import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, HelpCircle } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-slate-50/70 backdrop-blur-sm dark:bg-slate-950/70 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_64px_rgba(0,0,0,0.15)] dark:border-white/15 dark:bg-slate-950/95 dark:shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-cyan-300 to-fuchsia-400 p-2 rounded-lg shadow-[0_0_24px_rgba(34,211,238,0.35)]">
                  <HelpCircle className="text-[#07080D] w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-cyan-600 dark:text-cyan-200">
                  How to Log Workouts
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-slate-900 hover:border-cyan-600/60 dark:border-white/15 dark:text-slate-300 dark:hover:text-white dark:hover:border-cyan-200/60 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-cyan-100/60 text-cyan-700 flex items-center justify-center text-[10px] font-bold border border-cyan-300/60 rounded-md dark:bg-cyan-300/20 dark:text-cyan-100 dark:border-cyan-200/40">1</div>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">Open your Telegram Bot</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-cyan-100/60 text-cyan-700 flex items-center justify-center text-[10px] font-bold border border-cyan-300/60 rounded-md dark:bg-cyan-300/20 dark:text-cyan-100 dark:border-cyan-200/40">2</div>
                <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  Send a message using this format:
                  <br />
                  <span className="bg-slate-100 border border-slate-200 px-2 py-1 inline-block mt-2 font-mono text-xs rounded-md dark:bg-slate-900/70 dark:border-white/10 dark:text-slate-100">"Muscle Group - Exercises - Sets/Reps"</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-cyan-100/60 text-cyan-700 flex items-center justify-center text-[10px] font-bold border border-cyan-300/60 rounded-md dark:bg-cyan-300/20 dark:text-cyan-100 dark:border-cyan-200/40">3</div>
                <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  Example:
                  <br />
                  <span className="bg-slate-100 border border-slate-200 px-2 py-1 inline-block mt-2 font-mono text-xs rounded-md dark:bg-slate-900/70 dark:border-white/10 dark:text-slate-100">"Chest - Bench Press - 3x10"</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};