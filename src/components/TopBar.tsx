import React from "react";
import {
  ChevronLeft,
  RefreshCw,
  HelpCircle,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useTheme } from "@/src/contexts/ThemeContext";

interface TopBarProps {
  title: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  onHelp?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onRefresh, refreshing, onHelp }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between mb-10">
      <div className="flex items-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10">
          <button
            onClick={() => theme !== "light" && toggleTheme()}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              theme === "light"
                ? "bg-white text-amber-500 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
            title="Light Mode"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => theme !== "dark" && toggleTheme()}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              theme === "dark"
                ? "bg-slate-900 text-purple-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
            title="Dark Mode"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>
        {/* Help Button */}
        <button
          onClick={onHelp}
          className="flex items-center gap-2 p-2 px-3 bg-white dark:bg-slate-900 rounded-xl shadow-premium border border-slate-50 dark:border-white/5 text-slate-500 hover:text-cyan-600 transition-all active:scale-95"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-sm font-bold">Help</span>
        </button>

        {/* Sync/Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(
            "flex items-center gap-2 p-2 px-3 bg-white dark:bg-slate-900 rounded-xl shadow-premium border border-slate-50 dark:border-white/5 text-slate-500 hover:text-purple-600 transition-all active:scale-95",
            refreshing && "opacity-50 cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          <span className="text-sm font-bold">{refreshing ? "Syncing..." : "Refresh"}</span>
        </button>


      </div>
    </header>
  );
};

