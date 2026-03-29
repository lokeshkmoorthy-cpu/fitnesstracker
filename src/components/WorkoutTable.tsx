import React from "react";
import { Search, ChevronDown, CheckCircle2, Timer, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

interface Workout {
  username: string;
  date: string;
  musclegroup: string;
  exercises: string;
  setsreps: string;
  notes: string;
}

interface WorkoutTableProps {
  workouts: Workout[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterValue: string;
  onFilterChange: (val: string) => void;
}

export const WorkoutTable: React.FC<WorkoutTableProps> = ({ 
  workouts, 
  searchQuery, 
  onSearchChange,
  filterValue,
  onFilterChange
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium border border-slate-50 dark:border-white/5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white px-2">My Exercise</h2>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search here.."
              className="pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 transition-all w-full md:w-64"
            />
          </div>
          
          <button className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group">
            <span className="text-sm font-bold text-slate-700 dark:text-white">This Week</span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.15em] leading-none">
              <th className="px-6 py-4">Name of Exercise</th>
              <th className="px-6 py-4">Muscle Group</th>
              <th className="px-6 py-4 text-center">Set/Reps</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {workouts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Clock className="w-10 h-10 opacity-20" />
                    <span className="text-sm font-medium">No exercises recorded for this period</span>
                  </div>
                </td>
              </tr>
            ) : null}
            <AnimatePresence mode="popLayout">
              {workouts.slice().reverse().map((workout, idx) => (
                <motion.tr 
                  key={`${workout.username}-${workout.date}-${workout.exercises}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="group bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all"
                >
                  <td className="px-6 py-5 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 dark:group-hover:border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
                        {workout.exercises.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{workout.exercises}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 border-y border-transparent group-hover:border-slate-100 dark:group-hover:border-white/5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-none mb-1">{workout.musclegroup}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{workout.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center border-y border-transparent group-hover:border-slate-100 dark:group-hover:border-white/5">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{workout.setsreps}</span>
                  </td>
                  <td className="px-6 py-5 border-y border-transparent group-hover:border-slate-100 dark:group-hover:border-white/5">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </td>
                  <td className="px-6 py-5 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100 dark:group-hover:border-white/5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {idx % 3 === 0 ? (
                        <div className="px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold">Completed</span>
                        </div>
                       ) : (
                        <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg flex items-center gap-1.5">
                          <Timer className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold">In Progress</span>
                        </div>
                       )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};
