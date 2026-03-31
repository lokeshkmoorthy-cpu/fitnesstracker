import React, { useState } from "react";
import {
  LayoutDashboard,
  Activity,
  Map,
  Calendar as CalendarIcon,
  Target,
  Settings,
  LogOut,
  Bolt,
  Users,
  User,
  Menu,
  X,
  RefreshCw,
  Info,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { AuthUser } from "@/src/types/fitness";

interface SidebarProps {
  user: AuthUser;
  onRefresh: () => void;
  refreshing: boolean;
  onLogout: () => void;
  onHelp: () => void;
  onOpenAdmin?: () => void;
  activeItem: string;
  onNavigate: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onRefresh, refreshing, onLogout, onHelp, onOpenAdmin, activeItem, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  React.useEffect(() => {
    // Check initial state applied by index.html script
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const isDarkMode = !isDark;
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const mainMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
    { icon: Activity, label: "Activity", id: "activity" },
    { icon: Map, label: "Maps", id: "maps" },
    { icon: CalendarIcon, label: "Schedule", id: "schedule" },
    { icon: Target, label: "Goals", id: "goals" },
  ];

  const accountItems = [
    { icon: Settings, label: "Settings", id: "settings" },
    { icon: Info, label: "Help", id: "help" },
    // { icon: RefreshCw, label: refreshing ? "Syncing..." : "Refresh", id: "refresh" },
  ];

  const menuAction = (id: string) => {
    onNavigate(id);
    if (id === "help" || id === "support") {
      onHelp();
    }
    // if (id === "refresh" && !refreshing) {
    //   onRefresh();
    // }
    // Auto-close on mobile
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

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
        <div className="flex flex-col h-full p-8 overflow-y-auto scrollbar-custom">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-purple-200">
              <Bolt className="text-white w-6 h-6 fill-white/20" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Fit Tracker</span>
          </div>

          <nav className="flex-1 space-y-8">
            {/* Main Menu */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 px-4">Main Menu</h3>
              <div className="space-y-2">
                {mainMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => menuAction(item.id)}
                    className={cn(
                      "flex items-center gap-3.5 w-full px-4 py-3.5 rounded-2xl transition-all duration-200 group relative",
                      activeItem === item.id
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 text-slate-500 group-hover:text-cyan-600 dark:text-slate-400 dark:group-hover:text-cyan-300 transition-colors",
                        activeItem === item.id && "text-cyan-600"
                      )}
                    />
                    <span className="text-sm font-semibold tracking-tight">
                      {item.label}
                    </span>
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
                      "flex items-center gap-3.5 w-full px-4 py-3.5 rounded-2xl transition-all duration-200 group text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                      activeItem === item.id && "bg-slate-100 text-slate-900"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 text-slate-400 group-hover:text-slate-600",
                      item.id === "refresh" && refreshing && "animate-spin"
                    )} />
                    <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                  </button>
                ))}

                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-2xl transition-all duration-200 group text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-900/50 dark:hover:text-slate-200"
                >
                  {isDark ? (
                    <Sun className="w-5 h-5 text-slate-400 group-hover:text-amber-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-slate-400 group-hover:text-amber-500" />
                  )}
                  <span className="text-sm font-semibold tracking-tight">
                    {isDark ? "Light Mode" : "Dark Mode"}
                  </span>
                </button>
              </div>
            </div>

            {user.role === "admin" && onOpenAdmin && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 px-4">Admin</h3>
                <button
                  onClick={() => {
                    onNavigate("admin");
                    onOpenAdmin();
                    if (window.innerWidth < 1024) {
                      setIsOpen(false);
                    }
                  }}
                  className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-2xl transition-all duration-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800"
                >
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold tracking-tight">Admin Console</span>
                </button>
              </div>
            )}
          </nav>

          {/* User Profile */}
          <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                <User className="w-6 h-6 text-slate-400 translate-y-1" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-tight">{user.displayName}</span>
                <span className="text-[11px] font-medium text-slate-400 truncate max-w-[120px]">{user.email}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
