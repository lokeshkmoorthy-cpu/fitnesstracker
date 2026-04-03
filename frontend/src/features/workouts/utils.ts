import type { DashboardFilters, Workout } from "@/src/types/fitness";

const asDate = (value: string): number | null => {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

export const buildWorkoutFilters = (workouts: Workout[]) => ({
  users: Array.from(new Set(workouts.map((workout) => workout.username).filter(Boolean))).sort(),
  muscleGroups: Array.from(new Set(workouts.map((workout) => workout.musclegroup).filter(Boolean))).sort(),
});

export const filterWorkouts = (workouts: Workout[], filters: DashboardFilters) => {
  const from = filters.startDate ? new Date(filters.startDate).getTime() : null;
  const to = filters.endDate ? new Date(filters.endDate).getTime() : null;
  const query = filters.search.trim().toLowerCase();

  return workouts.filter((workout) => {
    if (filters.user !== "all" && workout.username !== filters.user) return false;
    if (filters.muscleGroup !== "all" && workout.musclegroup !== filters.muscleGroup) return false;

    const workoutTime = asDate(workout.date);
    if (from !== null && (workoutTime === null || workoutTime < from)) return false;
    if (to !== null && (workoutTime === null || workoutTime > to)) return false;

    if (!query) return true;
    const text = `${workout.username} ${workout.musclegroup} ${workout.exercises} ${workout.setsreps} ${workout.notes}`.toLowerCase();
    return text.includes(query);
  });
};

export const aggregateMuscleGroups = (workouts: Workout[]) => {
  const counts: Record<string, number> = {};
  workouts.forEach((workout) => {
    const group = workout.musclegroup || "Other";
    counts[group] = (counts[group] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};
