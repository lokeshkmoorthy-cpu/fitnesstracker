import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, subtitle, trend }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-premium border border-slate-50 dark:border-white/5 flex flex-col justify-between h-36 hover:shadow-card-hover transition-all group overflow-hidden relative">
      <div className="flex items-start justify-between">
        <div className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 dark:group-hover:bg-purple-500/20 dark:group-hover:text-purple-400 transition-colors">
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-bold px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">{label}</span>
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">{value}</div>
        {subtitle && <span className="text-[10px] font-medium text-slate-400 mt-1 block">{subtitle}</span>}
      </div>
      
      {/* Decorative background accent */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
        <div className="w-24 h-24 text-purple-600 rotate-12 scale-150">
          {icon}
        </div>
      </div>
    </div>
  );
};
