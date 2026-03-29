import React from "react";
import { Calendar } from "lucide-react";

export const ScheduleView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm min-h-[400px]">
      <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
        <Calendar className="w-8 h-8 text-purple-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Workout Schedule</h2>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
        Plan your upcoming workouts and view your historical training calendar.
      </p>
    </div>
  );
};
