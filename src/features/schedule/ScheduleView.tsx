import React, { useState } from "react";
import workoutsData from "@/src/data/workouts.json";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, PlayCircle } from "lucide-react";

const muscleGroups = [
  "chest",
  "bicep",
  "tricep",
  "shoulder",
  "back",
  "leg",
];

export const ScheduleView: React.FC = () => {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const workouts = selectedMuscle
    ? workoutsData[selectedMuscle as keyof typeof workoutsData]
    : [];

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-black">
      <AnimatePresence mode="wait">
        {!selectedMuscle ? (
          <motion.div
            key="muscle-list"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-slate-800 dark:text-white">
              Select Muscle Group 💪
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {muscleGroups.map((muscle) => (
                <motion.div
                  key={muscle}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMuscle(muscle)}
                  className="cursor-pointer p-8 rounded-3xl border backdrop-blur-xl bg-white/70 dark:bg-white/5 shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <h3 className="text-xl font-semibold capitalize text-slate-700 dark:text-white">
                    {muscle}
                  </h3>

                  <p className="text-sm text-slate-500 mt-2">
                    Tap to explore workouts →
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="workout-list"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setSelectedMuscle(null)}
                className="p-2 rounded-full bg-white dark:bg-slate-800 shadow hover:scale-110 transition"
              >
                <ArrowLeft />
              </button>

              <h2 className="text-3xl font-bold capitalize text-slate-800 dark:text-white">
                {selectedMuscle} Workouts
              </h2>
            </div>

            {/* Workout Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workouts.length === 0 ? (
                <p>No workouts added yet.</p>
              ) : (
                workouts.map((workout, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="p-6 rounded-3xl border bg-white dark:bg-slate-900 shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">
                      {workout.name}
                    </h3>

                    <p className="text-sm text-purple-600 mb-2">
                      📊 {workout.reps}
                    </p>

                    <p className="text-slate-600 dark:text-slate-300 mb-2 text-sm">
                      {workout.instruction}
                    </p>

                    <p className="text-green-600 text-sm mb-4">
                      💡 {workout.tip}
                    </p>

                    <a
                      href={workout.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <PlayCircle size={18} />
                      Watch Demo
                    </a>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};