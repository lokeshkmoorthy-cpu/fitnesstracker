import { useMemo, useState, type CSSProperties } from "react";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { clsx } from "clsx";
import type { AttendanceRecord } from "@/src/types/fitness";

/** Standard calendar grid (7 columns). */
const HEATMAP_CELL_PX = 28;

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

function getDaysInMonth(month: number, year: number): Date[] {
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
}

function getIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** GitHub-like contribution colors (light / dark). */
function intensityClass(count: number): string {
    if (count <= 0) {
        return "bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500";
    }
    if (count === 1) return "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50";
    if (count === 2) return "bg-emerald-300 dark:bg-emerald-700 text-emerald-900 dark:text-emerald-100";
    if (count === 3) return "bg-emerald-500 dark:bg-emerald-600 text-white";
    return "bg-emerald-700 dark:bg-emerald-500 text-white";
}

export interface AttendanceUserFilter {
    value: string;
    options: string[];
    onChange: (user: string) => void;
}

export interface AttendanceHeatmapProps {
    records: AttendanceRecord[];
    className?: string;
    title?: string;
    userFilter?: AttendanceUserFilter;
    viewerLabel?: string;
    onRefresh?: () => void | Promise<void>;
    refreshing?: boolean;
    rangeStart?: string;
    rangeEnd?: string;
}

export function AttendanceHeatmap({
    records,
    className,
    title = "Attendance Calendar",
    userFilter,
    viewerLabel,
    onRefresh,
    refreshing = false,
    rangeStart,
    rangeEnd,
}: AttendanceHeatmapProps) {
    const [viewDate, setViewDate] = useState(new Date());

    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const { cells, monthYearLabel } = useMemo(() => {
        const counts = new Map<string, number>();
        for (const r of records) {
            if (!r.date) continue;
            counts.set(r.date, (counts.get(r.date) ?? 0) + 1);
        }

        const days = getDaysInMonth(month, year);
        const firstDayOfWeek = days[0].getDay(); // 0 = Sunday

        const cells: Array<{
            date: string;
            dayNumber: number;
            count: number;
            isCurrentMonth: boolean;
        }> = [];

        // Padding for previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            cells.push({
                date: "",
                dayNumber: prevMonthLastDay - i,
                count: 0,
                isCurrentMonth: false,
            });
        }

        // Current month days
        for (const d of days) {
            const iso = getIsoDate(d);
            cells.push({
                date: iso,
                dayNumber: d.getDate(),
                count: counts.get(iso) ?? 0,
                isCurrentMonth: true,
            });
        }

        // Padding for next month
        const totalCells = Math.ceil(cells.length / 7) * 7;
        const nextMonthPadding = totalCells - cells.length;
        for (let i = 1; i <= nextMonthPadding; i++) {
            cells.push({
                date: "",
                dayNumber: i,
                count: 0,
                isCurrentMonth: false,
            });
        }

        return { cells, monthYearLabel: `${monthNames[month]} ${year}` };
    }, [records, month, year]);

    const changeMonth = (delta: number) => {
        const next = new Date(year, month + delta, 1);
        setViewDate(next);
    };

    const handleJumpToDate = (iso: string) => {
        if (!iso) return;
        const d = new Date(iso);
        if (!isNaN(d.getTime())) {
            setViewDate(d);
        }
    };

    const userOptions = useMemo(() => {
        if (!userFilter) return [];
        const set = new Set<string>(["all", ...userFilter.options]);
        if (userFilter.value && !set.has(userFilter.value)) {
            set.add(userFilter.value);
        }
        return Array.from(set);
    }, [userFilter]);

    return (
        <div className={clsx("w-full bg-white dark:bg-slate-900/50 rounded-2xl p-2.5 shadow-sm border border-slate-200 dark:border-white/5", className)}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {title}
                        </h3>
                        <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Personal Tracking
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 ml-auto">
                    {/* User Filter */}
                    {userFilter && (
                        <select
                            value={userFilter.value}
                            onChange={(e) => userFilter.onChange(e.target.value)}
                            className="h-8 px-2 text-[10px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-purple-500/20 cursor-pointer transition-all"
                        >
                            {userOptions.map((u) => (
                                <option key={u} value={u}>
                                    {u === "all" ? "All Users" : u}
                                </option>
                            ))}
                        </select>
                    )}

                    {!userFilter && viewerLabel && (
                        <div className="h-8 px-2 flex items-center text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-lg text-slate-400 truncate max-w-[120px]">
                            {viewerLabel}
                        </div>
                    )}

                    {/* Month Filter */}
                    <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-lg p-0.5">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <select
                            value={month}
                            onChange={(e) => setViewDate(new Date(year, parseInt(e.target.value), 1))}
                            className="bg-transparent text-[10px] font-bold px-1 py-0.5 outline-none text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                        >
                            {monthNames.map((m, i) => (
                                <option key={m} value={i}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={(e) => setViewDate(new Date(parseInt(e.target.value), month, 1))}
                            className="bg-transparent text-[10px] font-bold px-1 py-0.5 outline-none text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                        >
                            {[year - 1, year, year + 1].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => changeMonth(1)}
                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Date Picker Filter */}
                    <div className="relative group flex items-center justify-center w-8 h-8">
                        <input
                            type="date"
                            value={getIsoDate(viewDate)}
                            onChange={(e) => handleJumpToDate(e.target.value)}
                            className="absolute inset-0 h-full w-full p-0 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-lg text-transparent cursor-pointer outline-none focus:ring-2 ring-purple-500/20 transition-all opacity-0 z-20"
                        />
                        <div className="flex items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 group-hover:text-purple-600 transition-colors pointer-events-none z-10">
                            <CalendarIcon size={14} />
                        </div>
                    </div>

                    {onRefresh && (
                        <button
                            type="button"
                            onClick={() => void onRefresh()}
                            disabled={refreshing}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all hover:shadow-sm"
                            title="Refresh"
                        >
                            {refreshing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                            ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="w-full">
                {/* Day of week headers */}
                <div className="grid grid-cols-7 gap-1.5 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                        <div key={d} className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center py-1">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                    {cells.map((cell, idx) => (
                        <div
                            key={idx}
                            title={
                                cell.date
                                    ? `${cell.date}: ${cell.count} check-in${cell.count === 1 ? "" : "s"}`
                                    : undefined
                            }
                            className={clsx(
                                "w-full h-[28px] flex items-center justify-center rounded-lg text-[9px] font-bold transition-all relative overflow-hidden",
                                cell.isCurrentMonth
                                    ? intensityClass(cell.count)
                                    : "bg-slate-50/50 dark:bg-slate-800/20 text-slate-300 dark:text-slate-600 border border-dashed border-slate-100 dark:border-white/5",
                                cell.date === todayIso() &&
                                "ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-slate-900"
                            )}
                        >
                            <span className="relative z-10">{cell.dayNumber}</span>

                            {cell.count > 0 && cell.isCurrentMonth && (
                                <div className="absolute bottom-1 flex gap-[2px] justify-center">
                                    {Array.from({ length: Math.min(cell.count, 3) }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-[3px] h-[3px] rounded-full bg-current opacity-60"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intensity</span>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3].map(lvl => (
                            <div
                                key={lvl}
                                className={clsx(
                                    "w-2.5 h-2.5 rounded-[3px]",
                                    lvl === 0 ? "bg-slate-100 dark:bg-slate-800" :
                                        lvl === 1 ? "bg-emerald-100 dark:bg-emerald-900/50" :
                                            lvl === 2 ? "bg-emerald-300 dark:bg-emerald-700" : "bg-emerald-600"
                                )}
                            />
                        ))}
                    </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                    Showing {monthNames[month]} {year}
                </div>
            </div>
        </div >
    );
}