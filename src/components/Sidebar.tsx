import React, { useState, useEffect } from "react";
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
  Moon,
  ChevronLeft,
  ChevronRight
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  useEffect(() => {
    // Auto-collapse on smaller screens
    const handleResize = () => {
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
        setIsCollapsed(true);
      }
    };

    // Slight delay so it doesn't override manual setting immediately if not needed
    // Actually safe to just run on mount/resize
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar_collapsed", nextState.toString());
  };

  const mainMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
    { icon: Activity, label: "Activity", id: "activity" },
    // { icon: Map, label: "Maps", id: "maps" },
    { icon: CalendarIcon, label: "Schedule", id: "schedule" },
    // { icon: Target, label: "Goals", id: "goals" },
  ];

  const accountItems = [
    { icon: Settings, label: "Settings", id: "settings" },
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
          "fixed left-0 top-0 h-screen bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-white/10 z-40 transition-all duration-300 lg:translate-x-0 lg:static flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <div className={cn(
          "flex flex-col h-full overflow-y-auto scrollbar-custom",
          isCollapsed ? "px-2 py-8 items-center" : "p-8"
        )}>
          {/* Logo Section */}
          <div className={cn("flex flex-col items-center w-full mb-6", isCollapsed ? "gap-6" : "gap-4")}>
            <div className={cn("flex items-center w-full", isCollapsed ? "justify-center" : "justify-between")}>
              <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-purple-500/20 dark:shadow-purple-900/40 shrink-0">
                  <Bolt className="text-white w-6 h-6 fill-white/20" />
                </div>
                {!isCollapsed && (
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate whitespace-nowrap">
                    Fit Tracker
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <button
                  onClick={toggleCollapse}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors shrink-0"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
            </div>

            {isCollapsed && (
              <button
                onClick={toggleCollapse}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors shrink-0 bg-slate-50 dark:bg-slate-900/50"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* User Profile Info */}
          <div className={cn(
            "flex items-center w-full mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/60",
            isCollapsed ? "justify-center" : "justify-start gap-3 min-w-0 px-2"
          )}>
            <div className="w-12 h-12 shrink-0 rounded-full bg-slate-100 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden">
              <User className="w-6 h-6 text-slate-400 translate-y-1" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {user.displayName}
                </span>
                <span className="text-[11px] font-medium text-slate-400 truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
            )}
          </div>

          <nav className="w-full space-y-4">
            {user.role === "admin" && onOpenAdmin && (
              <div>
                {!isCollapsed ? (
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 px-4">Admin</h3>
                ) : (
                  <div className="w-8 h-px bg-slate-100 dark:bg-slate-800/60 mx-auto mb-3" />
                )}
                <button
                  title={isCollapsed ? "Admin Console" : undefined}
                  onClick={() => {
                    onNavigate("admin");
                    onOpenAdmin();
                    if (window.innerWidth < 1024) {
                      setIsOpen(false);
                    }
                  }}
                  className={cn(
                    "flex items-center rounded-2xl transition-all duration-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800",
                    isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3.5 px-4 py-3.5 w-full"
                  )}
                >
                  <Users className="w-5 h-5 shrink-0 text-purple-600 dark:text-purple-400" />
                  {!isCollapsed && (
                    <span className="text-sm font-semibold tracking-tight whitespace-nowrap">Command Console</span>
                  )}
                </button>
              </div>
            )}

            {/* Main Menu */}
            <div>
              {!isCollapsed ? (
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 px-4">Main Menu</h3>
              ) : (
                <div className="w-8 h-px bg-slate-100 dark:bg-slate-800/60 mx-auto mb-3" />
              )}
              <div className="space-y-2">
                {mainMenuItems.map((item) => (
                  <button
                    key={item.id}
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => menuAction(item.id)}
                    className={cn(
                      "flex items-center rounded-2xl transition-all duration-200 group relative",
                      isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3.5 px-4 py-3.5 w-full",
                      activeItem === item.id
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-900/50 dark:hover:text-slate-200"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 shrink-0 transition-colors",
                        activeItem === item.id
                          ? "text-cyan-600 dark:text-cyan-400"
                          : "text-slate-500 group-hover:text-cyan-600 dark:text-slate-400 dark:group-hover:text-cyan-300"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              {!isCollapsed ? (
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 px-4">Account</h3>
              ) : (
                <div className="w-8 h-px bg-slate-100 dark:bg-slate-800/60 mx-auto mb-3" />
              )}
              <div className="space-y-2">
                {accountItems.map((item) => (
                  <button
                    key={item.id}
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => menuAction(item.id)}
                    className={cn(
                      "flex items-center rounded-2xl transition-all duration-200 group w-full",
                      isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3.5 px-4 py-3.5",
                      activeItem === item.id
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-900/50 dark:hover:text-slate-200"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors",
                      item.id === "refresh" && refreshing && "animate-spin"
                    )} />
                    {!isCollapsed && (
                      <span className="text-sm font-semibold tracking-tight whitespace-nowrap">{item.label}</span>
                    )}
                  </button>
                ))}


              </div>
            </div>


          </nav>

          {/* Log Out Section */}
          <div className={cn(
            "mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex w-full",
            isCollapsed ? "justify-center" : "justify-start"
          )}>
            <button
              title={isCollapsed ? "Log out" : undefined}
              onClick={onLogout}
              className={cn(
                "flex items-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all w-full",
                isCollapsed ? "w-10 h-10 justify-center" : "gap-3.5 px-4 py-3.5"
              )}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-semibold tracking-tight whitespace-nowrap">Log Out</span>
              )}
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

