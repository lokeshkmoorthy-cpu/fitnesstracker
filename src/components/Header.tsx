import React from "react";
import { Dumbbell, HelpCircle, LogOut, Moon, RefreshCw, Sun } from "lucide-react";
import { useTheme } from "@/src/contexts/ThemeContext";
import { cn } from "@/src/lib/utils";
import type { AuthUser } from "@/src/types/fitness";

interface HeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
  user: AuthUser;
  onLogout: () => void;
  onHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, refreshing, user, onLogout, onHelp }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="relative border-b border-white/10 dark:border-white/10 p-4 md:p-6 flex justify-between items-center sticky top-0 bg-[#07080D]/70 dark:bg-[#07080D]/70 backdrop-blur-xl z-20 data-[theme=light]:bg-white/90 data-[theme=light]:border-slate-200">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-cyan-300 to-fuchsia-400 p-2.5 rounded-lg shadow-[0_0_24px_rgba(34,211,238,0.35)]">
          <Dumbbell className="text-[#07080D] w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase dark:text-white data-[theme=light]:text-slate-900">Fit Tracker</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400 data-[theme=light]:text-slate-500">Realtime workout intelligence</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right mr-2">
          <p className="text-xs font-medium text-slate-200 dark:text-slate-200 data-[theme=light]:text-slate-700">{user.displayName}</p>
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-400 dark:text-slate-400 data-[theme=light]:text-slate-500">{user.role}</p>
        </div>
        <button
          onClick={onHelp}
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-3 py-2 rounded-lg border border-white/20 dark:border-white/20 data-[theme=light]:border-slate-300 text-slate-300 dark:text-slate-300 data-[theme=light]:text-slate-600 hover:text-white dark:hover:text-white data-[theme=light]:hover:text-slate-900 hover:border-cyan-200/60 dark:hover:border-cyan-200/60 data-[theme=light]:hover:border-cyan-400 transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Help
        </button>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-3 py-2 rounded-lg border border-white/20 dark:border-white/20 data-[theme=light]:border-slate-300 text-slate-300 dark:text-slate-300 data-[theme=light]:text-slate-600 hover:text-white dark:hover:text-white data-[theme=light]:hover:text-slate-900 hover:border-cyan-200/60 dark:hover:border-cyan-200/60 data-[theme=light]:hover:border-cyan-400 transition-all"
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {theme === "dark" ? "Light" : "Dark"}
        </button>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded-lg border border-cyan-200/30 dark:border-cyan-200/30 data-[theme=light]:border-cyan-300/40 bg-white/5 dark:bg-white/5 data-[theme=light]:bg-cyan-50 hover:bg-cyan-300/15 dark:hover:bg-cyan-300/15 data-[theme=light]:hover:bg-cyan-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-300 data-[theme=light]:text-slate-700"
        >
          <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
          {refreshing ? "Syncing..." : "Refresh"}
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-3 py-2 rounded-lg border border-white/20 dark:border-white/20 data-[theme=light]:border-slate-300 text-slate-300 dark:text-slate-300 data-[theme=light]:text-slate-600 hover:text-white dark:hover:text-white data-[theme=light]:hover:text-slate-900 hover:border-cyan-200/60 dark:hover:border-cyan-200/60 data-[theme=light]:hover:border-cyan-400 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
};
