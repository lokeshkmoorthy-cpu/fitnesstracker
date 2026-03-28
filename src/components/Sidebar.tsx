import React, { useState } from "react";
import {
  LayoutDashboard,
  Activity,
  Map,
  Calendar as CalendarIcon,
  Target,
  LifeBuoy,
  Settings,
  LogOut,
  Bolt,
  ChevronRight,
  User,
  Menu,
  X,
  Moon,
  Sun,
  RefreshCcw,
} from "lucide-react";
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
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const menuAction = (id: string) => {
    setActiveItem(id);
    if (id === "support") {
      onHelp();
    }
    // Auto-close on mobile
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const mainMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
    { icon: Activity, label: "Exercise", id: "exercise", hasSubmenu: true },
    { icon: Map, label: "Run Tracker", id: "run" },
    { icon: CalendarIcon, label: "Calendar", id: "calendar" },
    { icon: Target, label: "Fitness Goals", id: "goals", hasSubmenu: true },
  ];

  const accountItems = [
    { icon: LifeBuoy, label: "Support", id: "support" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-lg shadow-premium border border-slate-100 dark:bg-slate-900 dark:border-white/10 dark:text-white"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-72 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-white/10 z-40 transition-transform duration-300 lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-8">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-purple-200">
              <Bolt className="text-white w-6 h-6 fill-white/20" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Fit Tracker</span>
          </div>

          <nav className="flex-1 space-y-8 overflow-y-auto pr-2">
            {/* Main Menu */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 px-4">Main Menu</h3>
              <div className="space-y-2">
                {mainMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => menuAction(item.id)}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3.5 rounded-2xl transition-all duration-200 group relative",
                      activeItem === item.id
                        ? "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white"
                        : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <item.icon className={cn(
                        "w-5 h-5 transition-colors",
                        activeItem === item.id ? "text-purple-600" : "text-slate-400 group-hover:text-slate-600"
                      )} />
                      <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                    </div>
                    {item.hasSubmenu && <ChevronRight className="w-4 h-4 opacity-50" />}
                    {activeItem === item.id && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-purple-600 rounded-r-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 px-4">Account</h3>
              <div className="space-y-2">
                {accountItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => menuAction(item.id)}
                    className={cn(
                      "flex items-center gap-3.5 w-full px-4 py-3.5 rounded-2xl transition-all duration-200 group text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white",
                      activeItem === item.id && "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white"
                    )}
                  >
                    <item.icon className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                    <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto space-y-6 pt-8 border-t border-slate-100 dark:border-white/10">
             {/* Sync Action */}
             <button 
                onClick={onRefresh}
                disabled={refreshing}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition-all font-bold text-xs"
             >
                <RefreshCcw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                {refreshing ? "Syncing Data..." : "Sync with Sheets"}
             </button>

             {/* Theme Toggle */}
             <div className="flex items-center justify-between px-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Theme</span>
                <button 
                  onClick={toggleTheme}
                  className="p-1.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:text-purple-600 transition-all"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
             </div>

            {/* User Profile */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user.displayName}</span>
                  <span className="text-[10px] font-medium text-slate-400 truncate max-w-[100px]">{user.email}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
