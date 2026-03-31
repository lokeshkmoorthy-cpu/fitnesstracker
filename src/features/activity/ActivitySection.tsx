import React, { useMemo } from "react";
import { Activity, Flame, Footprints, Route, Timer } from "lucide-react";
import { StatCard } from "@/src/components/StatCard";
import type { ActivityDailyRecord, Workout, DashboardFilters } from "@/src/types/fitness";
import { ActivityTrendChart } from "@/src/features/activity/ActivityTrendChart";

interface ActivitySectionProps {
  activity: ActivityDailyRecord[];
  workouts: Workout[];
  filters: DashboardFilters;
}

export const ActivitySection: React.FC<ActivitySectionProps> = ({ activity, workouts, filters }) => {
  const { filteredActivity, muscleWorkouts } = useMemo(() => {
    // Workout summary respects BOTH user and muscle group filters
    const muscleWorkouts = filters.muscleGroup === "all"
      ? workouts
      : workouts.filter(w => w.musclegroup === filters.muscleGroup);

    // Filter activity days to only show days where the selected muscle group was trained (if a filter is active)
    const filteredActivity = filters.muscleGroup === "all"
      ? activity
      : activity.filter(a => muscleWorkouts.some(w => w.date.startsWith(a.date)));

    return { filteredActivity, muscleWorkouts };
  }, [activity, workouts, filters]);

  const summary = useMemo(() => {
    // Summarize the filtered activity
    const totalActivity = filteredActivity.reduce(
      (acc, current) => {
        acc.steps += current.steps;
        acc.distanceKm += current.distanceKm;
        acc.calories += current.calories;
        acc.activeMinutes += current.activeMinutes;
        return acc;
      },
      { steps: 0, distanceKm: 0, calories: 0, activeMinutes: 0 }
    );

    return {
      ...totalActivity,
      sessionCount: muscleWorkouts.length,
      isMuscleFilter: filters.muscleGroup !== "all"
    };
  }, [filteredActivity, muscleWorkouts, filters]);

  return (
    <div className="space-y-6">
      {/* Dynamic Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Calories"
          value={`${summary.calories.toLocaleString()} kCal`}
          icon={<Flame className="w-4 h-4" />}
          subtitle="Energy burnt"
        />
        <StatCard
          label="Active Min"
          value={summary.activeMinutes.toLocaleString()}
          icon={<Timer className="w-4 h-4" />}
          subtitle="Heart rate zone"
        />
      </div>

      <ActivityTrendChart data={filteredActivity} />
    </div>
  );
};
