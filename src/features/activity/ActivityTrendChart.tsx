import React from "react";
import { ActivitySquare } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
  if (!data.length) {
    return (
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] font-bold flex items-center gap-2 text-cyan-200/90">
          <ActivitySquare className="w-4 h-4" />
          Activity Trends
        </h2>
        <p className="mt-6 text-sm text-slate-400">
          No activity records for this date range and user selection.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
      <h2 className="font-mono text-xs uppercase tracking-[0.18em] font-bold flex items-center gap-2 text-cyan-200/90 mb-6">
        <ActivitySquare className="w-4 h-4" />
        Activity Trends
      </h2>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.2)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "monospace", fill: "#CBD5E1" }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fontFamily: "monospace", fill: "#CBD5E1" }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fontFamily: "monospace", fill: "#CBD5E1" }} />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid rgba(186, 230, 253, 0.35)",
                fontFamily: "monospace",
                fontSize: "12px",
                backgroundColor: "#020617",
                color: "#E2E8F0",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
            <Line yAxisId="left" type="monotone" dataKey="steps" stroke="#22D3EE" strokeWidth={2} dot={false} name="Steps" />
            <Line yAxisId="left" type="monotone" dataKey="activeMinutes" stroke="#34D399" strokeWidth={2} dot={false} name="Active Min" />
            <Line yAxisId="right" type="monotone" dataKey="calories" stroke="#F472B6" strokeWidth={2} dot={false} name="Calories" />
            <Line yAxisId="right" type="monotone" dataKey="distanceKm" stroke="#60A5FA" strokeWidth={2} dot={false} name="Distance (km)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
