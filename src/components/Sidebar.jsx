import { Fragment, jsx, jsxs } from "react/jsx-runtime";
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
const Sidebar = ({ user, onRefresh, refreshing, onLogout, onHelp, onOpenAdmin, activeItem, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    { icon: CalendarIcon, label: "Schedule", id: "schedule" }
    // { icon: Target, label: "Goals", id: "goals" },
  ];
  const accountItems = [
    { icon: Settings, label: "Settings", id: "settings" }
  ];
  const menuAction = (id) => {
    onNavigate(id);
    if (id === "help" || id === "support") {
      onHelp();
    }
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setIsOpen(!isOpen),
        className: "fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-lg shadow-premium border border-slate-100 dark:bg-slate-900 dark:border-white/10 dark:text-white",
        children: isOpen ? /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Menu, { className: "w-5 h-5" })
      }
    ),
    /* @__PURE__ */ jsx(
      "aside",
      {
        className: cn(
          "fixed left-0 top-0 h-screen bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-white/10 z-40 transition-all duration-300 lg:translate-x-0 lg:static flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-20" : "w-72"
        ),
        children: /* @__PURE__ */ jsxs("div", { className: cn(
          "flex flex-col h-full overflow-y-auto scrollbar-custom",
          isCollapsed ? "px-2 py-8 items-center" : "p-8"
        ), children: [
          /* @__PURE__ */ jsxs("div", { className: cn("flex flex-col items-center w-full mb-6", isCollapsed ? "gap-6" : "gap-4"), children: [
            /* @__PURE__ */ jsxs("div", { className: cn("flex items-center w-full", isCollapsed ? "justify-center" : "justify-between"), children: [
              /* @__PURE__ */ jsxs("div", { className: cn("flex items-center", isCollapsed ? "justify-center" : "gap-3"), children: [
                /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-purple-500/20 dark:shadow-purple-900/40 shrink-0", children: /* @__PURE__ */ jsx(Bolt, { className: "text-white w-6 h-6 fill-white/20" }) }),
                !isCollapsed && /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate whitespace-nowrap", children: "Lokesh Fitness" })
              ] }),
              !isCollapsed && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: toggleCollapse,
                  className: "p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors shrink-0",
                  title: "Collapse Sidebar",
                  children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-5 h-5" })
                }
              )
            ] }),
            isCollapsed && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: toggleCollapse,
                className: "p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors shrink-0 bg-slate-50 dark:bg-slate-900/50",
                title: "Expand Sidebar",
                children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: cn(
            "flex items-center w-full mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/60",
            isCollapsed ? "justify-center" : "justify-start gap-3 min-w-0 px-2"
          ), children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 shrink-0 rounded-full bg-slate-100 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx(User, { className: "w-6 h-6 text-slate-400 translate-y-1" }) }),
            !isCollapsed && /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-w-0 pr-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-900 dark:text-white leading-tight truncate", children: user.displayName }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] font-medium text-slate-400 truncate max-w-[120px]", children: user.email })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("nav", { className: "w-full space-y-4", children: [
            user.role === "admin" && onOpenAdmin && /* @__PURE__ */ jsxs("div", { children: [
              !isCollapsed ? /* @__PURE__ */ jsx("h3", { className: "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 px-4", children: "Admin" }) : /* @__PURE__ */ jsx("div", { className: "w-8 h-px bg-slate-100 dark:bg-slate-800/60 mx-auto mb-3" }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  title: isCollapsed ? "Command Console" : void 0,
                  onClick: () => {
                    onNavigate("admin");
                    if (window.innerWidth < 1024) {
                      setIsOpen(false);
                    }
                  },
                  className: cn(
                    "flex items-center rounded-2xl transition-all duration-200",
                    isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3.5 px-4 py-3.5 w-full",
                    activeItem === "admin" ? "bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-100 shadow-sm" : "text-slate-500 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/30 dark:hover:text-purple-300"
                  ),
                  children: [
                    /* @__PURE__ */ jsx(Users, { className: cn("w-5 h-5 shrink-0 transition-colors", activeItem === "admin" ? "text-purple-700 dark:text-purple-300" : "text-slate-400") }),
                    !isCollapsed && /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold tracking-tight whitespace-nowrap", children: "Command Console" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  title: isCollapsed ? "User Info" : void 0,
                  onClick: () => {
                    onNavigate("admin-users");
                    if (window.innerWidth < 1024) {
                      setIsOpen(false);
                    }
                  },
                  className: cn(
                    "flex items-center rounded-2xl transition-all duration-200 mt-2",
                    isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3.5 px-4 py-3.5 w-full",
                    activeItem === "admin-users" ? "bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-100 shadow-sm" : "text-slate-500 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/30 dark:hover:text-purple-300"
                  ),
                  children: [
                    /* @__PURE__ */ jsx(User, { className: cn("w-5 h-5 shrink-0 transition-colors", activeItem === "admin-users" ? "text-purple-700 dark:text-purple-300" : "text-slate-400") }),
                    !isCollapsed && /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold tracking-tight whitespace-nowrap", children: "User Info" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              !isCollapsed ? /* @__PURE__ */ jsx("h3", { className: "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 px-4", children: "Main Menu" }) : /* @__PURE__ */ jsx("div", { className: "w-8 h-px bg-slate-100 dark:bg-slate-800/60 mx-auto mb-3" }),
              /* @__PURE__ */ jsx("div", { className: "space-y-2", children: mainMenuItems.map((item) => /* @__PURE__ */ jsxs(
                "button",
                {
                  title: isCollapsed ? item.label : void 0,
                  onClick: () => menuAction(item.id),
                  className: cn(
                    "flex items-center rounded-2xl transition-all duration-200 group relative",
                    isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3.5 px-4 py-3.5 w-full",
                    activeItem === item.id ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-900/50 dark:hover:text-slate-200"
                  ),
                  children: [
                    /* @__PURE__ */ jsx(
                      item.icon,
                      {
                        className: cn(
                          "w-5 h-5 shrink-0 transition-colors",
                          activeItem === item.id ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 group-hover:text-cyan-600 dark:text-slate-400 dark:group-hover:text-cyan-300"
                        )
                      }
                    ),
                    !isCollapsed && /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold tracking-tight whitespace-nowrap", children: item.label })
                  ]
                },
                item.id
              )) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              !isCollapsed ? /* @__PURE__ */ jsx("h3", { className: "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 px-4", children: "Account" }) : /* @__PURE__ */ jsx("div", { className: "w-8 h-px bg-slate-100 dark:bg-slate-800/60 mx-auto mb-3" }),
              /* @__PURE__ */ jsx("div", { className: "space-y-2", children: accountItems.map((item) => /* @__PURE__ */ jsxs(
                "button",
                {
                  title: isCollapsed ? item.label : void 0,
                  onClick: () => menuAction(item.id),
                  className: cn(
                    "flex items-center rounded-2xl transition-all duration-200 group w-full",
                    isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3.5 px-4 py-3.5",
                    activeItem === item.id ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-900/50 dark:hover:text-slate-200"
                  ),
                  children: [
                    /* @__PURE__ */ jsx(item.icon, { className: cn(
                      "w-5 h-5 shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors",
                      item.id === "refresh" && refreshing && "animate-spin"
                    ) }),
                    !isCollapsed && /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold tracking-tight whitespace-nowrap", children: item.label })
                  ]
                },
                item.id
              )) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: cn(
            "mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex w-full",
            isCollapsed ? "justify-center" : "justify-start"
          ), children: /* @__PURE__ */ jsxs(
            "button",
            {
              title: isCollapsed ? "Log out" : void 0,
              onClick: onLogout,
              className: cn(
                "flex items-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all w-full",
                isCollapsed ? "w-10 h-10 justify-center" : "gap-3.5 px-4 py-3.5"
              ),
              children: [
                /* @__PURE__ */ jsx(LogOut, { className: "w-5 h-5 shrink-0" }),
                !isCollapsed && /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold tracking-tight whitespace-nowrap", children: "Log Out" })
              ]
            }
          ) })
        ] })
      }
    ),
    isOpen && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-30 lg:hidden",
        onClick: () => setIsOpen(false)
      }
    )
  ] });
};
export {
  Sidebar
};
