import React from "react";
import { clsx } from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, subtitle, trend, className }) => {
  return (
    <div className={clsx(
      "bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-premium border border-slate-50 dark:border-white/5 flex flex-col justify-between hover:shadow-card-hover transition-all group overflow-hidden relative",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 dark:group-hover:bg-purple-500/20 dark:group-hover:text-purple-400 transition-colors">
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-bold px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{label}</span>
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">{value}</div>
        {subtitle && <span className="text-[10px] font-medium text-slate-400 mt-0.5 block">{subtitle}</span>}
      </div>
    </div>
  );
};
