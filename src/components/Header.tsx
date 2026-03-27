import React from "react";
import { Dumbbell, LogOut, RefreshCw } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { AuthUser } from "@/src/types/fitness";

interface HeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
  user: AuthUser;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, refreshing, user, onLogout }) => {
  return (
    <header className="relative border-b border-white/10 p-4 md:p-6 flex justify-between items-center sticky top-0 bg-[#07080D]/70 backdrop-blur-xl z-20">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-cyan-300 to-fuchsia-400 p-2.5 rounded-lg shadow-[0_0_24px_rgba(34,211,238,0.35)]">
          <Dumbbell className="text-[#07080D] w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase">Fit Tracker</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Realtime workout intelligence</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right mr-2">
          <p className="text-xs font-medium text-slate-200">{user.displayName}</p>
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-400">{user.role}</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded-lg border border-cyan-200/30 bg-white/5 hover:bg-cyan-300/15 hover:border-cyan-200/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
          {refreshing ? "Syncing..." : "Refresh Data"}
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-3 py-2 rounded-lg border border-white/20 text-slate-300 hover:text-white hover:border-cyan-200/60 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
};
