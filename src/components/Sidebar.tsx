import React, { useState } from "react";
import { Menu, X, BarChart3, Dumbbell, Target, Moon, Sun, RefreshCw, LogOut, User, HelpCircle } from "lucide-react";
import { useTheme } from "@/src/contexts/ThemeContext";
import { cn } from "@/src/lib/utils";
import type { AuthUser } from "@/src/types/fitness";

interface SidebarProps {
  user: AuthUser;
  onRefresh: () => void;
  refreshing: boolean;
  onLogout: () => void;
  onHelp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onRefresh, refreshing, onLogout, onHelp }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { icon: BarChart3, label: "Dashboard", id: "dashboard" },
    { icon: Dumbbell, label: "Workouts", id: "workouts" },
    { icon: Target, label: "Goals", id: "goals" },
    {
      icon: User,
      label: user.displayName,
      sublabel: user.role,
      id: "user",
      custom: true
    },
    {
      icon: RefreshCw,
      label: refreshing ? "Syncing..." : "Refresh",
      id: "refresh",
      custom: true,
      onClick: onRefresh,
      disabled: refreshing
    },
    {
      icon: LogOut,
      label: "Logout",
      id: "logout",
      custom: true,
      onClick: onLogout
    },
    {
      icon: HelpCircle,
      label: "Help",
      id: "help",
      custom: true,
      onClick: onHelp
    },
    {
      icon: theme === "dark" ? Sun : Moon,
      label: theme === "dark" ? "Light Mode" : "Dark Mode",
      id: "theme",
      custom: true,
      onClick: toggleTheme
    },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 rounded-lg border border-cyan-300/40 bg-cyan-50 hover:bg-cyan-100 dark:border-cyan-200/30 dark:bg-white/5 dark:hover:bg-cyan-300/15 transition-all"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white/95 border-r border-slate-200 dark:bg-[#07080D]/95 dark:border-white/10 z-20 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0 lg:top-0 lg:h-screen`}
      >
        <div className="p-6 space-y-6 h-full flex flex-col">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-300 to-fuchsia-400 p-2.5 rounded-lg shadow-[0_0_24px_rgba(34,211,238,0.35)]">
              <Dumbbell className="text-[#07080D] w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase text-slate-900 dark:text-white">Fit Tracker</h1>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Realtime workout intelligence</p>
            </div>
          </div>

          {/* Square Menu Grid */}
          <div className="flex-1">
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
              Quick Access
            </div>
            <div className="grid grid-cols-2 gap-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    disabled={item.disabled}
                    aria-label={item.label}
                    className={cn(
                      "flex items-center justify-center w-full aspect-square rounded-lg border border-cyan-300/40 bg-gradient-to-br from-cyan-50 to-cyan-50/30 hover:from-cyan-100 hover:to-cyan-100/30 dark:border-cyan-200/30 dark:from-white/10 dark:to-white/5 dark:hover:from-cyan-300/20 dark:hover:to-cyan-300/10 transition-all group",
                      item.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon className={cn(
                      "w-6 h-6 text-slate-600 group-hover:text-cyan-600 dark:text-slate-400 dark:group-hover:text-cyan-300 transition-colors",
                      item.id === "refresh" && refreshing && "animate-spin"
                    )} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
