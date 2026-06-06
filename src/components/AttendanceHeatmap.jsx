import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { clsx } from "clsx";
const HEATMAP_CELL_PX = 28;
function todayIso() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function getDaysInMonth(month, year) {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}
function getIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function intensityClass(count) {
  if (count <= 0) {
    return "bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500";
  }
  if (count === 1) return "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50";
  if (count === 2) return "bg-emerald-300 dark:bg-emerald-700 text-emerald-900 dark:text-emerald-100";
  if (count === 3) return "bg-emerald-500 dark:bg-emerald-600 text-white";
  return "bg-emerald-700 dark:bg-emerald-500 text-white";
}
function AttendanceHeatmap({
  records,
  className,
  title = "Attendance Calendar",
  userFilter,
  viewerLabel,
  onRefresh,
  refreshing = false,
  rangeStart,
  rangeEnd
}) {
  const [viewDate, setViewDate] = useState(/* @__PURE__ */ new Date());
  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  const { cells, monthYearLabel } = useMemo(() => {
    const counts = /* @__PURE__ */ new Map();
    for (const r of records) {
      if (!r.date) continue;
      counts.set(r.date, (counts.get(r.date) ?? 0) + 1);
    }
    const days = getDaysInMonth(month, year);
    const firstDayOfWeek = days[0].getDay();
    const cells2 = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells2.push({
        date: "",
        dayNumber: prevMonthLastDay - i,
        count: 0,
        isCurrentMonth: false
      });
    }
    for (const d of days) {
      const iso = getIsoDate(d);
      cells2.push({
        date: iso,
        dayNumber: d.getDate(),
        count: counts.get(iso) ?? 0,
        isCurrentMonth: true
      });
    }
    const totalCells = Math.ceil(cells2.length / 7) * 7;
    const nextMonthPadding = totalCells - cells2.length;
    for (let i = 1; i <= nextMonthPadding; i++) {
      cells2.push({
        date: "",
        dayNumber: i,
        count: 0,
        isCurrentMonth: false
      });
    }
    return { cells: cells2, monthYearLabel: `${monthNames[month]} ${year}` };
  }, [records, month, year]);
  const changeMonth = (delta) => {
    const next = new Date(year, month + delta, 1);
    setViewDate(next);
  };
  const handleJumpToDate = (iso) => {
    if (!iso) return;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      setViewDate(d);
    }
  };
  const userOptions = useMemo(() => {
    if (!userFilter) return [];
    const set = /* @__PURE__ */ new Set(["all", ...userFilter.options]);
    if (userFilter.value && !set.has(userFilter.value)) {
      set.add(userFilter.value);
    }
    return Array.from(set);
  }, [userFilter]);
  return /* @__PURE__ */ jsxs("div", { className: clsx("w-full bg-white dark:bg-slate-900/50 rounded-2xl p-2.5 shadow-sm border border-slate-200 dark:border-white/5", className), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4 mb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(CalendarIcon, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-800 dark:text-slate-100", children: title }),
          /* @__PURE__ */ jsx("p", { className: "text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Personal Tracking" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 ml-auto", children: [
        userFilter && /* @__PURE__ */ jsx(
          "select",
          {
            value: userFilter.value,
            onChange: (e) => userFilter.onChange(e.target.value),
            className: "h-8 px-2 text-[10px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-purple-500/20 cursor-pointer transition-all",
            children: userOptions.map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u === "all" ? "All Users" : u }, u))
          }
        ),
        !userFilter && viewerLabel && /* @__PURE__ */ jsx("div", { className: "h-8 px-2 flex items-center text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-lg text-slate-400 truncate max-w-[120px]", children: viewerLabel }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-lg p-0.5", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => changeMonth(-1),
              className: "p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors",
              children: /* @__PURE__ */ jsx(ChevronLeft, { size: 14 })
            }
          ),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: month,
              onChange: (e) => setViewDate(new Date(year, parseInt(e.target.value), 1)),
              className: "bg-transparent text-[10px] font-bold px-1 py-0.5 outline-none text-slate-700 dark:text-slate-200 appearance-none cursor-pointer",
              children: monthNames.map((m, i) => /* @__PURE__ */ jsx("option", { value: i, children: m }, m))
            }
          ),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: year,
              onChange: (e) => setViewDate(new Date(parseInt(e.target.value), month, 1)),
              className: "bg-transparent text-[10px] font-bold px-1 py-0.5 outline-none text-slate-700 dark:text-slate-200 appearance-none cursor-pointer",
              children: [year - 1, year, year + 1].map((y) => /* @__PURE__ */ jsx("option", { value: y, children: y }, y))
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => changeMonth(1),
              className: "p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors",
              children: /* @__PURE__ */ jsx(ChevronRight, { size: 14 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative group flex items-center justify-center w-8 h-8", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: getIsoDate(viewDate),
              onChange: (e) => handleJumpToDate(e.target.value),
              className: "absolute inset-0 h-full w-full p-0 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-lg text-transparent cursor-pointer outline-none focus:ring-2 ring-purple-500/20 transition-all opacity-0 z-20"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 group-hover:text-purple-600 transition-colors pointer-events-none z-10", children: /* @__PURE__ */ jsx(CalendarIcon, { size: 14 }) })
        ] }),
        onRefresh && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => void onRefresh(),
            disabled: refreshing,
            className: "h-8 w-8 flex items-center justify-center rounded-lg border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all hover:shadow-sm",
            title: "Refresh",
            children: refreshing ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin text-purple-600" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1.5 mb-2", children: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => /* @__PURE__ */ jsx("div", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400 text-center py-1", children: d }, d)) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1.5", children: cells.map((cell, idx) => /* @__PURE__ */ jsxs(
        "div",
        {
          title: cell.date ? `${cell.date}: ${cell.count} check-in${cell.count === 1 ? "" : "s"}` : void 0,
          className: clsx(
            "w-full h-[28px] flex items-center justify-center rounded-lg text-[9px] font-bold transition-all relative overflow-hidden",
            cell.isCurrentMonth ? intensityClass(cell.count) : "bg-slate-50/50 dark:bg-slate-800/20 text-slate-300 dark:text-slate-600 border border-dashed border-slate-100 dark:border-white/5",
            cell.date === todayIso() && "ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-slate-900"
          ),
          children: [
            /* @__PURE__ */ jsx("span", { className: "relative z-10", children: cell.dayNumber }),
            cell.count > 0 && cell.isCurrentMonth && /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 flex gap-[2px] justify-center", children: Array.from({ length: Math.min(cell.count, 3) }).map((_, i) => /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-[3px] h-[3px] rounded-full bg-current opacity-60"
              },
              i
            )) })
          ]
        },
        idx
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400", children: "Intensity" }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: [0, 1, 2, 3].map((lvl) => /* @__PURE__ */ jsx(
          "div",
          {
            className: clsx(
              "w-2.5 h-2.5 rounded-[3px]",
              lvl === 0 ? "bg-slate-100 dark:bg-slate-800" : lvl === 1 ? "bg-emerald-100 dark:bg-emerald-900/50" : lvl === 2 ? "bg-emerald-300 dark:bg-emerald-700" : "bg-emerald-600"
            )
          },
          lvl
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-[10px] font-bold text-slate-400", children: [
        "Showing ",
        monthNames[month],
        " ",
        year
      ] })
    ] })
  ] });
}
export {
  AttendanceHeatmap
};
