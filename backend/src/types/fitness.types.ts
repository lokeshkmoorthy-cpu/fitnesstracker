export interface WorkoutRecord {
  userId: string;
  username: string;
  date: string;
  musclegroup: string;
  exercises: string;
  setsreps: string;
  notes: string;
}

export interface ActivityDailyRecord {
  userId: string;
  username: string;
  date: string;
  steps: number;
  distanceKm: number;
  calories: number;
  activeMinutes: number;
  notes: string;
}
