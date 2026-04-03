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
      "The project enhanced practical skills in full-stack development, teamwork, and problem-solving.","Fitness tracking system designed for users to monitor daily activities, with basic roles, system requirements, and a structured workflow.","It uses React, Node.js, and Google Sheets with REST APIs to handle data storage and communication between frontend and backend.","The system has some limitations like scalability and security but includes proper error handling and follows an Agile development approach.","It helped in learning full-stack development, teamwork, and can be enhanced with AI features, mobile apps, and wearable integration.","The documentation can be enhanced by adding diagrams like use case, sequence, and database schema to explain system design clearly.","It should include UI/UX design, code structure, performance optimization, and security measures for better implementation understanding.","Details about deployment, version control, testing, and risk analysis improve the project’s professionalism and reliability.","Additional sections like user guide, project timeline, and overall workflow help in making the documentation complete and easy to follow.",
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
      "For any privacy-related concerns, please contact the development team.","The application collects only necessary data, uses cookies for better experience, and stores data securely for a limited time with user control over deletion.","The application collects only necessary data, uses cookies for better experience, and stores data securely for a limited time with user control over deletion.","It ensures authentication security, restricts access to authorized entities, and avoids collecting sensitive personal information.","Trusted third-party services may be used, while maintaining compliance with standard data protection principles.","The application collects minimal data, uses cookies for functionality, and stores information securely with user control over updates and deletion.", "It ensures secure authentication, restricts unauthorized access, and does not collect sensitive personal data.","Third-party services may be used responsibly while following standard privacy and data protection practices.","Users give consent, must provide accurate data, and will be informed of any breaches or permission-based access.",
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
            className="w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_24px_64px_rgba(0,0,0,0.15)] dark:border-white/15 dark:bg-slate-950/95 dark:shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
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

            <div className="mt-4 overflow-y-auto space-y-3 text-sm max-h-[68vh] pr-2">
              <p className="text-base text-slate-700 leading-relaxed dark:text-slate-300">
                {footerModalContent[active].description}
              </p>

              {active === "support" ? (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {[
                    {
                      name: "Lokesh K",
                      role: "Lead Node",
                      phone: "9095498299",
                      email: "lokeshkmoorthy@gmail.com",
                      location: "Pondicherry",
                    },
                    {
                      name: "Abilash Sakthivel",
                      role: "Data Node",
                      phone: "9600260346",
                      email: "Abilash.avms@gmail.com",
                      location: "Pondicherry",
                    },
                    {
                      name: "Surya Kumar N",
                      role: "Interface Node",
                      phone: "6382664766",
                      email: "suryanaveen347@gmail.com",
                      location: "Chennai",
                    },
                  ].map((member) => (
                    <div
                      key={member.email}
                      className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-cyan-600/20 flex items-center justify-center text-cyan-600 font-semibold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-white">
                            {member.name}
                          </h4>
                          <p className="text-xs text-cyan-600">{member.role}</p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <p>📞 {member.phone}</p>
                        <p>✉️ {member.email}</p>
                        <p>📍 {member.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-3">
                  {footerModalContent[active].points.map((point) => (
                    <li
                      key={point}
                      className="text-sm text-slate-700 flex gap-2 dark:text-slate-200"
                    >
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-600 shrink-0 dark:bg-cyan-300" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
