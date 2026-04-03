import React from "react";
import { Plus } from "lucide-react";

interface DashboardHeroProps {
  userName: string;
  onAddClick?: () => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({ userName, onAddClick }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight italic">
          Good Morning, <span className="text-purple-600 not-italic">{userName}!</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Ready to crush your goals today?</p>
      </div>
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-2xl shadow-lg shadow-purple-100 dark:shadow-none transition-all font-bold tracking-tight"
      >
        <Plus className="w-4 h-4" />
        Add Exercise
      </button>
    </div>
  );
};
