import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
const footerModalContent = {
  documentation: {
    title: "Documentation",
    description: "The Fitness Tracking System was developed by a team of students under the guidance of Lokesh K, who led and mentored the project.",
    points: [
      "Team members: Surya Kumar N (Frontend & Integration), Abilash Sakthivel (Data Analyst & Backend Support), and Lokesh K (Team Lead & Full Stack).",
      "The system helps users track daily fitness activities, workouts, and health progress efficiently.",
      "Built with React (TypeScript) for the frontend, Node.js with Express on the backend, and Google Sheets as the data store.",
      "Key features include user login, workout tracking, calorie monitoring, and a concise dashboard.",
      "Modules cover user management, activity tracking, data management, and analytics.",
      "The project enhanced practical skills in full-stack development, teamwork, and problem-solving.",
      "Fitness tracking system designed for users to monitor daily activities, with basic roles, system requirements, and a structured workflow.",
      "It uses React, Node.js, and Google Sheets with REST APIs to handle data storage and communication between frontend and backend.",
      "The system has some limitations like scalability and security but includes proper error handling and follows an Agile development approach.",
      "It helped in learning full-stack development, teamwork, and can be enhanced with AI features, mobile apps, and wearable integration.",
      "The documentation can be enhanced by adding diagrams like use case, sequence, and database schema to explain system design clearly.",
      "It should include UI/UX design, code structure, performance optimization, and security measures for better implementation understanding.",
      "Details about deployment, version control, testing, and risk analysis improve the project\u2019s professionalism and reliability.",
      "Additional sections like user guide, project timeline, and overall workflow help in making the documentation complete and easy to follow."
    ]
  },
  privacy: {
    title: "Privacy",
    description: "We value your privacy and are committed to protecting your personal information. This Fitness Tracking System collects basic details such as your name, email, and fitness activity data (including workouts, calories, and progress) to provide a better user experience.",
    points: [
      "Your data is used only for tracking fitness activities, improving the application, and providing personalized insights; we do not sell, trade, or share personal information with any third parties.",
      "All data is stored securely using cloud-based services, and we take reasonable measures to protect it, but users should avoid sharing sensitive data through this interface.",
      "You have full control over your data and can update or request deletion of your information at any time.",
      "This privacy policy may be updated in the future, and any major changes will be communicated through the application.",
      "For any privacy-related concerns, please contact the development team.",
      "The application collects only necessary data, uses cookies for better experience, and stores data securely for a limited time with user control over deletion.",
      "The application collects only necessary data, uses cookies for better experience, and stores data securely for a limited time with user control over deletion.",
      "It ensures authentication security, restricts access to authorized entities, and avoids collecting sensitive personal information.",
      "Trusted third-party services may be used, while maintaining compliance with standard data protection principles.",
      "The application collects minimal data, uses cookies for functionality, and stores information securely with user control over updates and deletion.",
      "It ensures secure authentication, restricts unauthorized access, and does not collect sensitive personal data.",
      "Third-party services may be used responsibly while following standard privacy and data protection practices.",
      "Users give consent, must provide accurate data, and will be informed of any breaches or permission-based access."
    ]
  },
  support: {
    title: "Support",
    description: "Reach out to the Fit Tracker team for guidance, bug reports, or feature questions.",
    points: [
      "Lokesh K \u2192 \u{1F4E1} Lead Node | \u{1F4DE} 9095498299 | \u2709\uFE0F lokeshkmoorthy@gmail.com | \u{1F4CD} Pondicherry",
      "Abilash Sakthivel \u2192 \u{1F4CA} Data Node | \u{1F4DE} 9600260346 | \u2709\uFE0F Abilash.avms@gmail.com | \u{1F4CD} Pondicherry",
      "Surya Kumar N \u2192 \u{1F4BB} Interface Node | \u{1F4DE} 6382664766 | \u2709\uFE0F suryanaveen347@gmail.com | \u{1F4CD} Pondicherry"
    ]
  }
};
const FooterInfoModal = ({ active, onClose }) => {
  React.useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (active) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, onClose]);
  return /* @__PURE__ */ jsx(AnimatePresence, { children: active ? /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      className: "fixed inset-0 z-40 bg-slate-50/70 backdrop-blur-sm dark:bg-slate-950/70 flex items-center justify-center p-4",
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 16, scale: 0.98 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 10, scale: 0.98 },
          transition: { duration: 0.22 },
          className: "w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_24px_64px_rgba(0,0,0,0.15)] dark:border-white/15 dark:bg-slate-950/95 dark:shadow-[0_24px_64px_rgba(0,0,0,0.45)]",
          onClick: (event) => event.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold tracking-tight text-cyan-600 dark:text-cyan-200", children: footerModalContent[active].title }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: onClose,
                  className: "inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-slate-900 hover:border-cyan-600/60 dark:border-white/15 dark:text-slate-300 dark:hover:text-white dark:hover:border-cyan-200/60 transition-colors",
                  "aria-label": "Close modal",
                  children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 overflow-y-auto space-y-3 text-sm max-h-[68vh] pr-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-base text-slate-700 leading-relaxed dark:text-slate-300", children: footerModalContent[active].description }),
              active === "support" ? /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-4 mt-4", children: [
                {
                  name: "Lokesh K",
                  role: "Lead Node",
                  phone: "9095498299",
                  email: "lokeshkmoorthy@gmail.com",
                  location: "Pondicherry"
                },
                {
                  name: "Abilash Sakthivel",
                  role: "Data Node",
                  phone: "9600260346",
                  email: "Abilash.avms@gmail.com",
                  location: "Pondicherry"
                },
                {
                  name: "Surya Kumar N",
                  role: "Interface Node",
                  phone: "6382664766",
                  email: "suryanaveen347@gmail.com",
                  location: "Chennai"
                }
              ].map((member) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 hover:shadow-lg hover:scale-[1.02] transition-all",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-full bg-cyan-600/20 flex items-center justify-center text-cyan-600 font-semibold", children: member.name.charAt(0) }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("h4", { className: "font-semibold text-slate-800 dark:text-white", children: member.name }),
                        /* @__PURE__ */ jsx("p", { className: "text-xs text-cyan-600", children: member.role })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300", children: [
                      /* @__PURE__ */ jsxs("p", { children: [
                        "\u{1F4DE} ",
                        member.phone
                      ] }),
                      /* @__PURE__ */ jsxs("p", { children: [
                        "\u2709\uFE0F ",
                        member.email
                      ] }),
                      /* @__PURE__ */ jsxs("p", { children: [
                        "\u{1F4CD} ",
                        member.location
                      ] })
                    ] })
                  ]
                },
                member.email
              )) }) : /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: footerModalContent[active].points.map((point) => /* @__PURE__ */ jsxs(
                "li",
                {
                  className: "text-sm text-slate-700 flex gap-2 dark:text-slate-200",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "mt-2 h-1.5 w-1.5 rounded-full bg-cyan-600 shrink-0 dark:bg-cyan-300" }),
                    /* @__PURE__ */ jsx("span", { children: point })
                  ]
                },
                point
              )) })
            ] })
          ]
        }
      )
    }
  ) : null });
};
export {
  FooterInfoModal
};
