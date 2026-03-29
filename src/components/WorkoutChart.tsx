import React from "react";
import { ChevronDown, TrendingUp } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

const COLORS = ["#22D3EE", "#818CF8", "#34D399", "#F472B6", "#F59E0B", "#60A5FA"];

interface WorkoutChartProps {
  data: { name: string; value: number }[];
}

export const WorkoutChart: React.FC<WorkoutChartProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium border border-slate-50 dark:border-white/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white px-2">Workout Statistic</h2>
        <button className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group">
          <span className="text-sm font-bold text-slate-700 dark:text-white">This Week</span>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
        </button>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }} 
            />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-slate-800 p-4 shadow-xl border border-slate-50 dark:border-white/10 rounded-2xl text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Total Calories: {payload[0].value} KCal</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="value" 
              radius={[6, 6, 6, 6]} 
              barSize={32}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === Math.floor(data.length / 2) ? "#7c3aed" : "#a78bfa"} 
                  fillOpacity={index === Math.floor(data.length / 2) ? 1 : 0.6}
                  className="transition-all duration-300 hover:fill-purple-700"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-200 dark:bg-purple-900/40" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target</span>
        </div>
      </div>
    </div>
  );
};
