import React from "react";
import { TrendingUp } from "lucide-react";
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
  if (!data.length) {
    return (
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] font-bold flex items-center gap-2 text-cyan-200/90">
          <TrendingUp className="w-4 h-4" />
          Muscle Group Frequency
        </h2>
        <p className="mt-8 text-sm text-slate-400">No data for current filters. Adjust your filter options to see chart insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] font-bold flex items-center gap-2 text-cyan-200/90">
          <TrendingUp className="w-4 h-4" />
          Muscle Group Frequency
        </h2>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.2)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontFamily: "monospace", fill: "#CBD5E1" }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontFamily: "monospace", fill: "#CBD5E1" }}
            />
            <Tooltip 
              cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
              contentStyle={{ 
                borderRadius: "12px", 
                border: "1px solid rgba(186, 230, 253, 0.35)",
                fontFamily: "monospace",
                fontSize: "12px",
                backgroundColor: "#020617",
                color: "#E2E8F0"
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
