import { jsx, jsxs } from "react/jsx-runtime";
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
  "leg"
];
const ScheduleView = () => {
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const workouts = selectedMuscle ? workoutsData[selectedMuscle] : [];
  return /* @__PURE__ */ jsx("div", { className: "p-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-black", children: /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: !selectedMuscle ? /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 40 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -40 },
      transition: { duration: 0.4 },
      children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold mb-8 text-slate-800 dark:text-white", children: "Select Muscle Group \u{1F4AA}" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-6", children: muscleGroups.map((muscle) => /* @__PURE__ */ jsxs(
          motion.div,
          {
            whileHover: { scale: 1.05 },
            whileTap: { scale: 0.95 },
            onClick: () => setSelectedMuscle(muscle),
            className: "cursor-pointer p-8 rounded-3xl border backdrop-blur-xl bg-white/70 dark:bg-white/5 shadow-lg hover:shadow-2xl transition-all duration-300",
            children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold capitalize text-slate-700 dark:text-white", children: muscle }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-2", children: "Tap to explore workouts \u2192" })
            ]
          },
          muscle
        )) })
      ]
    },
    "muscle-list"
  ) : /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, x: 80 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -80 },
      transition: { duration: 0.4 },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedMuscle(null),
              className: "p-2 rounded-full bg-white dark:bg-slate-800 shadow hover:scale-110 transition",
              children: /* @__PURE__ */ jsx(ArrowLeft, {})
            }
          ),
          /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold capitalize text-slate-800 dark:text-white", children: [
            selectedMuscle,
            " Workouts"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: workouts.length === 0 ? /* @__PURE__ */ jsx("p", { children: "No workouts added yet." }) : workouts.map((workout, index) => /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: index * 0.05 },
            whileHover: { y: -5 },
            className: "p-6 rounded-3xl border bg-white dark:bg-slate-900 shadow-md hover:shadow-xl transition-all duration-300",
            children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold mb-2 text-slate-800 dark:text-white", children: workout.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-purple-600 mb-2", children: [
                "\u{1F4CA} ",
                workout.reps
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-300 mb-2 text-sm", children: workout.instruction }),
              /* @__PURE__ */ jsxs("p", { className: "text-green-600 text-sm mb-4", children: [
                "\u{1F4A1} ",
                workout.tip
              ] }),
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: workout.youtube,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "flex items-center gap-2 text-blue-600 hover:underline",
                  children: [
                    /* @__PURE__ */ jsx(PlayCircle, { size: 18 }),
                    "Watch Demo"
                  ]
                }
              )
            ]
          },
          index
        )) })
      ]
    },
    "workout-list"
  ) }) });
};
export {
  ScheduleView
};
