import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, HelpCircle, Bot, Zap, Layout, Send } from "lucide-react";

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
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Bot className="w-8 h-8" />
                  Fit Tracker Guide
                </h2>
                <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">
                  Everything you need to master your fitness
                </p>
              </div>
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {/* Introduction Section */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                    <Layout className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">What is Fit Tracker?</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Fit Tracker is a premium fitness management platform designed to help you track workouts, monitor progress, and achieve your health goals. 
                  It combines high-performance visualization with seamless automation through our <span className="text-indigo-600 font-bold">Telegram Integration</span>.
                </p>
              </section>

              {/* Bot Guide Section */}
              <section className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                    <Send className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Telegram Logging Guide</h3>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-black text-indigo-600 border border-slate-200 dark:border-white/10 shadow-sm">1</div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Connect with the Bot</p>
                      <p className="text-xs text-slate-500 mt-1">Search for <span className="font-mono bg-slate-200 px-1 dark:bg-slate-800 rounded">@FitTracker_Bot</span> on Telegram and tap Start.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-black text-indigo-600 border border-slate-200 dark:border-white/10 shadow-sm">2</div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Log Workouts instantly</p>
                      <p className="text-xs text-slate-500 mt-1 mb-3">Send your workout details using this format for automatic analysis:</p>
                      <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-xs">
                        <span className="text-indigo-500 italic">Muscle Group</span> - <span className="text-purple-500 italic">Exercise</span> - <span className="text-pink-500 italic">Sets/Reps</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 italic">Example: "Chest - Bench Press - 3 x 10 @ 60kg"</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-black text-indigo-600 border border-slate-200 dark:border-white/10 shadow-sm">3</div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Real-time Syncing</p>
                      <p className="text-xs text-slate-500 mt-1">Every message you send is instantly parsed and reflected in your Dashboard. Click <span className="font-bold text-purple-600">Refresh</span> to see the latest updates.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Bot Features */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Quick Log</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">No apps to open. Just one message to log daily sets.</p>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100/50 dark:border-purple-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Smart Parsing</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">AI analyzes your text to identify volume and intensity.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-white/5 text-center">
              <p className="text-xs text-slate-400 font-medium tracking-tight">
                For advanced support, contact the <span className="text-indigo-600 font-bold underline cursor-pointer">Fitness Intelligence Team</span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};