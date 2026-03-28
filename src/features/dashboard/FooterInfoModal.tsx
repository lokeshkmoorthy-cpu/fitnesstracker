import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

export type FooterModalKey = "documentation" | "privacy" | "support";

const footerModalContent: Record<
  FooterModalKey,
  { title: string; description: string; points: string[] }
> = {
  documentation: {
    title: "Documentation",
    description:
      "The Fitness Tracking System was developed by a team of students under the guidance of Lokesh K, who led and mentored the project.",
    points: [
      "Team members: Surya Kumar N (Frontend & Integration), Abilash Sakthivel (Data Analyst & Backend Support), and Lokesh K (Team Lead & Full Stack).",
      "The system helps users track daily fitness activities, workouts, and health progress efficiently.",
      "Built with React (TypeScript) for the frontend, Node.js with Express on the backend, and Google Sheets as the data store.",
      "Key features include user login, workout tracking, calorie monitoring, and a concise dashboard.",
      "Modules cover user management, activity tracking, data management, and analytics.",
      "Overall, the project enhanced practical skills in full-stack development, teamwork, and problem-solving.",
    ],
  },
  privacy: {
    title: "Privacy",
    description:
      "We value your privacy and are committed to protecting your personal information. This Fitness Tracking System collects basic details such as your name, email, and fitness activity data (including workouts, calories, and progress) to provide a better user experience.",
    points: [
      "Your data is used only for tracking fitness activities, improving the application, and providing personalized insights; we do not sell, trade, or share personal information with any third parties.",
      "All data is stored securely using cloud-based services, and we take reasonable measures to protect it, but users should avoid sharing sensitive data through this interface.",
      "You have full control over your data and can update or request deletion of your information at any time.",
      "This privacy policy may be updated in the future, and any major changes will be communicated through the application.",
      "For any privacy-related concerns, please contact the development team.",
    ],
  },
  support: {
    title: "Support",
    description:
      "Reach out to the Fit Tracker team for guidance, bug reports, or feature questions.",
    points: [
      "Lokesh K → 📡 Lead Node | 📞 9095498299 | ✉️ lokeshkmoorthy@gmail.com | 📍 Pondicherry",
      "Abilash Sakthivel → 📊 Data Node | 📞 9600260346 | ✉️ Abilash.avms@gmail.com | 📍 Pondicherry",
      "Surya Kumar N → 💻 Interface Node | 📞 6382664766 | ✉️ suryanaveen347@gmail.com | 📍 Pondicherry",
    ],
  },
};

interface FooterInfoModalProps {
  active: FooterModalKey | null;
  onClose: () => void;
}

export const FooterInfoModal: React.FC<FooterInfoModalProps> = ({ active, onClose }) => {
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (active) {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, onClose]);

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-slate-50/70 backdrop-blur-sm dark:bg-slate-950/70 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_24px_64px_rgba(0,0,0,0.15)] dark:border-white/15 dark:bg-slate-950/95 dark:shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold tracking-tight text-cyan-600 dark:text-cyan-200">
                {footerModalContent[active].title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-slate-900 hover:border-cyan-600/60 dark:border-white/15 dark:text-slate-300 dark:hover:text-white dark:hover:border-cyan-200/60 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-base text-slate-700 leading-relaxed dark:text-slate-300">
              {footerModalContent[active].description}
            </p>

            <ul className="mt-4 space-y-3">
              {footerModalContent[active].points.map((point) => (
                <li key={point} className="text-sm text-slate-700 flex gap-2 dark:text-slate-200">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-600 shrink-0 dark:bg-cyan-300" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
