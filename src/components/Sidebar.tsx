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
  X
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


  const menuItems = [
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
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-lg shadow-premium border border-slate-100"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-100 z-40 transition-transform duration-300 lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-8">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-purple-200">
              <Bolt className="text-white w-6 h-6 fill-white/20" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">SweatIQ</span>
          </div>


          {/* Menu Bar */}
          <div className="flex-1">
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
              Menu Bar
            </div>
            <div className="grid grid-cols-1 gap-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveItem(item.id)}
                    className={cn(

                      "flex flex-col items-center justify-center w-full aspect-square rounded-lg border border-cyan-300/40 bg-gradient-to-br from-cyan-50 to-cyan-50/30 hover:from-cyan-100 hover:to-cyan-100/30 dark:border-cyan-200/30 dark:from-white/10 dark:to-white/5 dark:hover:from-cyan-300/20 dark:hover:to-cyan-300/10 transition-all group",
                      item.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-6 h-6 text-slate-600 group-hover:text-cyan-600 dark:text-slate-400 dark:group-hover:text-cyan-300 transition-colors",
                        item.id === "refresh" && refreshing && "animate-spin"
                      )}
                    />
                    <span className="mt-1 text-[10px] font-semibold text-slate-600 group-hover:text-cyan-600 dark:text-slate-300 dark:group-hover:text-cyan-300">
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
                  onClick={() => setActiveItem(item.id)}
                  className={cn(
                    "flex items-center gap-3.5 w-full px-4 py-3.5 rounded-2xl transition-all duration-200 group text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                    activeItem === item.id && "bg-slate-100 text-slate-900"
                  )}
                >
                  <item.icon className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                  <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
              <User className="w-6 h-6 text-slate-400 translate-y-1" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-tight">{user.displayName}</span>
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
    </aside >

      {/* Overlay */ }
  {
    isOpen && (
      <div
        className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-30 lg:hidden"
        onClick={() => setIsOpen(false)}
      />
    )
  }
    </>
  );
};
