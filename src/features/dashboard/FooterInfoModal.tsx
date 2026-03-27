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
      "Quick guide for this dashboard. Replace these lines with your final product documentation later.",
    points: [
      "Use Smart Filters to narrow the report by user, date range, and muscle group.",
      "Export the currently filtered data as a styled PDF report.",
      "Track patterns through cards, chart insights, and workout table activity.",
    ],
  },
  privacy: {
    title: "Privacy",
    description:
      "Basic privacy placeholder content. Update this with your official privacy policy details later.",
    points: [
      "Workout data is visible only to authorized users of this dashboard.",
      "Sensitive credentials should remain in environment variables and never in UI code.",
      "Exports are generated client-side based on the data loaded for the current user.",
    ],
  },
  support: {
    title: "Support",
    description:
      "Starter support information. You can replace this with team contacts, SLA, and help channels.",
    points: [
      "For data sync issues, use Refresh Data and verify API connectivity.",
      "For report styling requests, collect screenshots and desired layout examples.",
      "For urgent blockers, contact the project owner or engineering team.",
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
            className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_64px_rgba(0,0,0,0.15)] dark:border-white/15 dark:bg-slate-950/95 dark:shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
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

            <p className="mt-3 text-sm text-slate-700 leading-relaxed dark:text-slate-300">
              {footerModalContent[active].description}
            </p>

            <ul className="mt-4 space-y-2">
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
