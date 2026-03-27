import React from "react";

export const HowToLog: React.FC = () => {
  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold mb-4 text-cyan-200/90">How to log</h3>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="w-6 h-6 bg-cyan-300/20 text-cyan-100 flex items-center justify-center text-[10px] font-bold border border-cyan-200/40 rounded-md">1</div>
          <p className="text-xs leading-tight text-slate-200">Open your Telegram Bot</p>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 bg-cyan-300/20 text-cyan-100 flex items-center justify-center text-[10px] font-bold border border-cyan-200/40 rounded-md">2</div>
          <p className="text-xs leading-tight text-slate-200">
            Send a message using this format:
            <br />
            <span className="bg-slate-900/70 border border-white/10 px-1.5 py-1 inline-block mt-1 font-mono text-[11px] rounded-md">"Muscle Group - Exercises - Sets/Reps"</span>
          </p>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 bg-cyan-300/20 text-cyan-100 flex items-center justify-center text-[10px] font-bold border border-cyan-200/40 rounded-md">3</div>
          <p className="text-xs leading-tight text-slate-200">
            Example:
            <br />
            <span className="bg-slate-900/70 border border-white/10 px-1.5 py-1 inline-block mt-1 font-mono text-[11px] rounded-md">"Chest - Bench Press - 3x10"</span>
          </p>
        </div>
      </div>
    </div>
  );
};
