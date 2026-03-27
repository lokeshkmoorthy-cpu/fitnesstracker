import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => {
  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col justify-between h-24 backdrop-blur-md hover:border-cyan-200/60 hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(0,0,0,0.28)] transition-all duration-300 cursor-default">
      <div className="flex justify-between items-start">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</span>
        <div className="text-cyan-200/80">{icon}</div>
      </div>
      <div className="text-2xl font-semibold tracking-tight text-slate-100">{value}</div>
    </div>
  );
};
