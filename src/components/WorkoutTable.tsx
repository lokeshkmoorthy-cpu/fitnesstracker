import React from "react";
import { List } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
}

export const WorkoutTable: React.FC<WorkoutTableProps> = ({ workouts }) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40 text-slate-100">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] font-bold flex items-center gap-2 text-cyan-200/90">
          <List className="w-4 h-4" />
          Recent Activity
        </h2>
        <span className="text-[10px] text-slate-400">Showing {workouts.length} matching entries</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-slate-900/40">
              <th className="p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400">Date</th>
              <th className="p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400">Username</th>
              <th className="p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400">Muscle Group</th>
              <th className="p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400">Exercises</th>
              <th className="p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400">Sets/Reps</th>
              <th className="p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400">Notes</th>
            </tr>
          </thead>
          <tbody>
            {workouts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-slate-400">
                  No workouts found for these filters. Try broadening the date range or user selection.
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
                  className="border-b border-white/5 hover:bg-cyan-300/5 transition-colors group"
                >
                  <td className="p-4 font-mono text-xs text-slate-200">{workout.date}</td>
                  <td className="p-4 font-mono text-xs text-slate-200">{workout.username}</td>
                  <td className="p-4">
                    <span className="bg-cyan-300/15 border border-cyan-200/40 text-cyan-100 text-[10px] px-2 py-1 rounded-full uppercase tracking-tighter">
                      {workout.musclegroup}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-100">{workout.exercises}</td>
                  <td className="p-4 text-xs text-slate-300">{workout.setsreps}</td>
                  <td className="p-4 text-xs text-slate-400">{workout.notes || "-"}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};
