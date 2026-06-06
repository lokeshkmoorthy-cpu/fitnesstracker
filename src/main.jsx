import { jsx } from "react/jsx-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./AppMain.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import "./index.css";
createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsx(StrictMode, { children: /* @__PURE__ */ jsx(ThemeProvider, { children: /* @__PURE__ */ jsx(App, {}) }) })
);
