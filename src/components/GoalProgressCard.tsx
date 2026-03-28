import React from "react";
import { ArrowRight, Target } from "lucide-react";

interface GoalProgressCardProps {
  current: number;
  total: number;
  label: string;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({ current, total, label }) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  
  // Semi-circle path calculation
  const radius = 40;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage / 100);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-premium border border-slate-50 flex flex-col h-full hover:shadow-card-hover transition-all group">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
            Set your Fitness Goals <br />
            <span className="text-slate-400">for the quality of your health</span>
          </h3>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative py-6">
        <svg className="w-48 h-24" viewBox="0 0 100 50">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-slate-100"
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
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{current}/{total}{label}</div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">You have reached {Math.round(percentage)}% of your goal this month</span>
      </div>
      
      <button className="mt-4 flex items-center justify-between w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all text-sm font-bold text-slate-600">
        <span>Set Fitness Goals</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
