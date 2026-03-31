import { useMemo, type CSSProperties } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import type { AttendanceRecord } from "@/src/types/fitness";

const MS_PER_DAY = 86400000;
/** Inclusive day span for the heatmap window (rolling year when no date filter). */
const ONE_YEAR_DAYS = 365;

/** Fixed pixel size (GitHub-style dense grid, not scaled-up squares). */
const HEATMAP_CELL_PX = 10;

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
    const d = new Date(`${iso}T12:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
    const d1 = new Date(`${a}T12:00:00.000Z`).getTime();
    const d2 = new Date(`${b}T12:00:00.000Z`).getTime();
    return Math.round((d2 - d1) / MS_PER_DAY);
}

/** Sunday (UTC) of the week containing `iso`. */
function startOfWeekSunday(iso: string): string {
    const d = new Date(`${iso}T12:00:00.000Z`);
    const dow = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - dow);
    return d.toISOString().slice(0, 10);
}

function maxIso(a: string, b: string): string {
    return a > b ? a : b;
}

/** GitHub-like contribution colors (light / dark). */
function intensityClass(count: number): string {
    if (count <= 0) {
        return "bg-[#ebedf0] dark:bg-slate-700/90";
    }
    if (count === 1) return "bg-[#9be9a8] dark:bg-emerald-800/85";
    if (count === 2) return "bg-[#40c463] dark:bg-emerald-600";
    return "bg-[#216e39] dark:bg-emerald-500";
}

export interface AttendanceUserFilter {
    value: string;
    options: string[];
    onChange: (user: string) => void;
}

export interface AttendanceHeatmapProps {
    records: AttendanceRecord[];
    /** Dashboard filter start (YYYY-MM-DD); empty = no lower bound from UI */
    rangeStart?: string;
    /** Dashboard filter end (YYYY-MM-DD); empty = today */
    rangeEnd?: string;
    className?: string;
    /** Card title */
    title?: string;
    /** Admin-only user scope */
    userFilter?: AttendanceUserFilter;
    /** When `userFilter` is omitted (non-admin), show this label beside refresh */
    viewerLabel?: string;
    onRefresh?: () => void | Promise<void>;
    refreshing?: boolean;
}

/**
 * GitHub-style contribution grid: 7 rows (Sun–Sat) × N week columns.
 * The visible window is at most one year ending at `rangeEnd` (or today / latest record).
 */
export function AttendanceHeatmap({
    records,
    rangeStart = "",
    rangeEnd = "",
    className,
    title = "Gym attendance",
    userFilter,
    viewerLabel,
    onRefresh,
    refreshing = false,
}: AttendanceHeatmapProps) {
    const { cells, numWeeks } = useMemo(() => {
        let maxRecordDate = "";
        for (const r of records) {
            if (r.date && r.date > maxRecordDate) maxRecordDate = r.date;
        }
        const explicitEnd = rangeEnd.trim() !== "";
        // No dashboard end date: extend past "today" so future sheet dates still render in the grid.
        const end = explicitEnd
            ? rangeEnd
            : maxIso(todayIso(), maxRecordDate || todayIso());
        const capStart = addDays(end, -ONE_YEAR_DAYS + 1);
        const renderStart = maxIso(rangeStart || "1970-01-01", capStart);
        const renderEnd = end;

        const counts = new Map<string, number>();
        for (const r of records) {
            if (!r.date) continue;
            counts.set(r.date, (counts.get(r.date) ?? 0) + 1);
        }

        const gridStart = startOfWeekSunday(renderStart);
        const endWeekSunday = startOfWeekSunday(renderEnd);
        const weekSpan = Math.floor(daysBetween(gridStart, endWeekSunday) / 7) + 1;
        const numWeeks = Math.max(1, weekSpan);

        const cells: Array<{
            col: number;
            row: number;
            date: string;
            count: number;
            inRange: boolean;
        }> = [];

        for (let col = 0; col < numWeeks; col += 1) {
            for (let row = 0; row < 7; row += 1) {
                const date = addDays(gridStart, col * 7 + row);
                const inRange = date >= renderStart && date <= renderEnd;
                const count = inRange ? (counts.get(date) ?? 0) : 0;
                cells.push({ col, row, date, count: inRange ? count : 0, inRange });
            }
        }

        return { cells, numWeeks };
    }, [records, rangeStart, rangeEnd]);

    const hasAny = useMemo(
        () => records.some((r) => Boolean(r.date)),
        [records]
    );

    /** Fixed track sizes so cells stay small and dense like GitHub (no huge scaled squares). */
    const gridStyle: CSSProperties = {
        gridTemplateColumns: `repeat(${numWeeks}, ${HEATMAP_CELL_PX}px)`,
        gridTemplateRows: `repeat(7, ${HEATMAP_CELL_PX}px)`,
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
        <div className={clsx("w-full", className)}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-medium text-neutral-700 dark:text-slate-200 shrink-0">
                    {title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                    {userFilter && (
                        <>
                            <label className="sr-only" htmlFor="attendance-user-filter">
                                User
                            </label>
                            <select
                                id="attendance-user-filter"
                                value={userFilter.value}
                                onChange={(e) => userFilter.onChange(e.target.value)}
                                className="text-xs font-semibold text-slate-700 dark:text-white pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer max-w-[200px]"
                            >
                                {userOptions.map((u) => (
                                    <option key={u} value={u}>
                                        {u === "all" ? "All users" : u}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                    {!userFilter && viewerLabel && (
                        <span
                            className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl max-w-[200px] truncate"
                            title={viewerLabel}
                        >
                            {viewerLabel}
                        </span>
                    )}
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={() => void onRefresh()}
                            disabled={refreshing}
                            className="inline-flex items-center justify-center p-1.5 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                            title="Refresh attendance"
                            aria-label="Refresh attendance"
                        >
                            {refreshing ? (
                                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-slate-400 mb-1.5">
                <div className="flex flex-wrap items-center gap-2">
                    <span>Less</span>
                    <span
                        className="inline-block size-2.5 rounded-[2px] bg-[#ebedf0] dark:bg-slate-700/90"
                        aria-hidden
                    />
                    <span
                        className="inline-block size-2.5 rounded-[2px] bg-[#9be9a8] dark:bg-emerald-800/85"
                        aria-hidden
                    />
                    <span
                        className="inline-block size-2.5 rounded-[2px] bg-[#40c463] dark:bg-emerald-600"
                        aria-hidden
                    />
                    <span
                        className="inline-block size-2.5 rounded-[2px] bg-[#216e39] dark:bg-emerald-500"
                        aria-hidden
                    />
                    <span>More</span>
                </div>
            </div>

            {!hasAny ? (
                <p className="text-sm text-neutral-500 dark:text-slate-400 py-2">
                    No attendance in this range yet.
                </p>
            ) : (
                <div className="w-full min-w-0 overflow-x-auto pb-1">
                    <div
                        className="grid w-max max-w-full gap-[3px]"
                        style={gridStyle}
                        role="grid"
                        aria-label="Attendance by day"
                    >
                        {cells.map((cell) => (
                            <div
                                key={`${cell.col}-${cell.row}`}
                                role="gridcell"
                                style={{
                                    gridColumn: cell.col + 1,
                                    gridRow: cell.row + 1,
                                }}
                                title={
                                    cell.inRange
                                        ? `${cell.date}: ${cell.count} check-in${cell.count === 1 ? "" : "s"}`
                                        : cell.date
                                }
                                className={clsx(
                                    "min-w-0 w-full h-full rounded-[2px]",
                                    !cell.inRange &&
                                    "bg-[#f6f8fa] dark:bg-slate-800/50",
                                    cell.inRange &&
                                    (cell.count === 0
                                        ? "bg-[#ebedf0] dark:bg-slate-700/90"
                                        : intensityClass(cell.count))
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}