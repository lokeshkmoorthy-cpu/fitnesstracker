import React from "react";
import {
  Bell,
  MessageSquare,
  ChevronLeft,
  Globe,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface TopBarProps {
  title: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onRefresh, refreshing }) => {
  return (
    <header className="flex items-center justify-between mb-10">
      <div className="flex items-center gap-6">
        <button className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-premium border border-slate-50 dark:border-white/5 text-slate-400 hover:text-purple-600 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>

        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900 rounded-2xl shadow-premium border border-slate-50 dark:border-white/5">
          <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all relative">
            <Bell className="w-5 h-5" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
          </button>
          <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all">
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(
            "flex items-center p-2 bg-white dark:bg-slate-900 rounded-xl shadow-premium border border-slate-50 dark:border-white/5 text-slate-400 hover:text-purple-600 transition-all active:scale-95",
            refreshing && "opacity-50 cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          <span className="ml-2">Refresh</span>
        </button>
      </div>
    </header>
  );
};
