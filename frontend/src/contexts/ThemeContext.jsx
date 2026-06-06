import { jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useEffect, useState } from "react";
const ThemeContext = createContext(void 0);
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);
  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", newTheme);
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };
  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("app-theme", newTheme);
      applyTheme(newTheme);
      return newTheme;
    });
  };
  return /* @__PURE__ */ jsx(ThemeContext.Provider, { value: { theme, toggleTheme }, children });
};
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === void 0) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
export {
  ThemeProvider,
  useTheme
};
