import React, { useMemo } from "react";
import { Flame, Footprints, Route, Timer } from "lucide-react";
import { StatCard } from "@/src/components/StatCard";
import type { ActivityDailyRecord } from "@/src/types/fitness";
import { ActivityTrendChart } from "@/src/features/activity/ActivityTrendChart";

interface ActivitySectionProps {
  activity: ActivityDailyRecord[];
}

export const ActivitySection: React.FC<ActivitySectionProps> = ({ activity }) => {
  const summary = useMemo(() => {
    const total = activity.reduce(
      (acc, current) => {
        acc.steps += current.steps;
        acc.distanceKm += current.distanceKm;
        acc.calories += current.calories;
        acc.activeMinutes += current.activeMinutes;
        return acc;
      },
      { steps: 0, distanceKm: 0, calories: 0, activeMinutes: 0 }
    );
    return total;
  }, [activity]);

  return (
    <section className="space-y-6">
      {/* <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Steps" value={summary.steps.toLocaleString()} icon={<Footprints className="w-4 h-4" />} />
        <StatCard label="Distance (km)" value={summary.distanceKm.toFixed(1)} icon={<Route className="w-4 h-4" />} />
        <StatCard label="Calories" value={summary.calories.toLocaleString()} icon={<Flame className="w-4 h-4" />} />
        <StatCard
          label="Active Minutes"
          value={summary.activeMinutes.toLocaleString()}
          icon={<Timer className="w-4 h-4" />}
        />
      </div> */}

      <ActivityTrendChart data={activity} />
    </section>
  );
};
