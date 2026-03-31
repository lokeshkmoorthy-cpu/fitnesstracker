import React from "react";
import { ActivitySquare } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActivityDailyRecord } from "@/src/types/fitness";

interface ActivityTrendChartProps {
  data: ActivityDailyRecord[];
}

export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-xl">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400 mb-8">
          <ActivitySquare className="w-4 h-4 text-purple-500" />
          Activity Trends
        </h2>
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
           <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
             <ActivitySquare className="w-6 h-6 text-slate-600" />
           </div>
           <p className="text-sm font-bold text-slate-500">No activity data available for the selected period</p>
        </div>
      </div>
    );
  }

  // Strictly limit to 15-20 days as requested
  const chartData = data.slice(-18);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-8 rounded-[2rem] shadow-premium transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
            <ActivitySquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">Activity Trends</h2>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">Last {chartData.length} Days Performance</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-white/5">
           <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
             <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Bar Chart View</span>
           </div>
        </div>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }} barGap={8} barCategoryGap="25%">
            <defs>
              <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818CF8" stopOpacity={1} />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F472B6" stopOpacity={1} />
                <stop offset="100%" stopColor="#DB2777" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="distanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148,163,184,0.1)" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 9, fontWeight: 800, fill: "#64748B" }} 
              axisLine={false}
              tickLine={false}
              dy={15}
              tickFormatter={(date) => {
                const d = new Date(date);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              yAxisId="left" 
              tick={{ fontSize: 9, fontWeight: 700, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              hide
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fontSize: 9, fontWeight: 700, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              hide
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 12 }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 pb-2 border-b border-white/10">
                        {new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                      <div className="space-y-2">
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-[11px] font-bold text-slate-300">{entry.name}</span>
                            </div>
                            <span className="text-xs font-black text-white">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: 30, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }} 
              iconType="circle"
              iconSize={8}
            />
            <Bar yAxisId="left" dataKey="steps" fill="url(#stepsGradient)" radius={[6, 6, 0, 0]} name="Steps" barSize={24} />
            <Bar yAxisId="left" dataKey="activeMinutes" fill="url(#activeGradient)" radius={[6, 6, 0, 0]} name="Active Min" barSize={24} />
            <Bar yAxisId="right" dataKey="calories" fill="url(#caloriesGradient)" radius={[6, 6, 0, 0]} name="Calories" barSize={24} />
            <Bar yAxisId="right" dataKey="distanceKm" fill="url(#distanceGradient)" radius={[6, 6, 0, 0]} name="Distance" barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
