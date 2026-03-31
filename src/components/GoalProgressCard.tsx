import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface GoalProgressCardProps {
  current: number;
  total: number;
  label: string;
  onSetGoalClick?: () => void;
  /** When true, card fills parent height (e.g. Goals sidebar). Default: natural height for dashboard flex layout. */
  fillHeight?: boolean;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
  current,
  total,
  label,
  onSetGoalClick,
  fillHeight = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  // Semi-circle path calculation
  const radius = 40;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage / 100);

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium border border-slate-50 dark:border-white/5 flex flex-col hover:shadow-card-hover transition-all group",
        fillHeight && "h-full"
      )}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Set your Fitness Goals <br />
            <span className="text-slate-400">for the quality of your health</span>
          </h3>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col items-center justify-center relative py-6",
          fillHeight && "flex-1"
        )}
      >
        <svg className="w-48 h-24" viewBox="0 0 100 50">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-slate-100 dark:text-slate-800"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-purple-600 transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="text-center -mt-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Goal</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{current}/{total}{label}</div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">You have reached {Math.round(percentage)}% of your goal this month</span>
      </div>

      <button
        onClick={onSetGoalClick}
        className="mt-4 flex items-center justify-between w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl group-hover:bg-purple-600 dark:group-hover:bg-purple-500 group-hover:text-white transition-all text-sm font-bold text-slate-600 dark:text-slate-300"
      >
        <span>Set Fitness Goals</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};