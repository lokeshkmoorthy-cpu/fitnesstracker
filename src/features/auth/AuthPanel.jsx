import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useState } from "react";
import { LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
const AuthPanel = ({ loading, onLogin, onSignup }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await onLogin({ email, password });
      } else {
        await onSignup({ email, password, displayName, phoneNumber });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#07080D] text-slate-100 flex items-center justify-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-xl bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-pulse tracking-wider", children: "FIT TRACKER" }),
      /* @__PURE__ */ jsx("div", { className: "h-1 w-24 bg-gradient-to-r from-cyan-400 to-purple-600 mx-auto mt-2 rounded-full animate-pulse" })
    ] }),
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold tracking-tight mb-2", children: mode === "login" ? "Login" : "Create Account" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      mode === "signup" ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300", children: [
          "Display Name",
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: displayName,
              onChange: (event) => setDisplayName(event.target.value),
              className: "h-10 rounded-lg bg-slate-900 border border-slate-700 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300/80 hover:border-cyan-400/60 transition-colors",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300", children: [
          "Phone Number",
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "tel",
              value: phoneNumber,
              onChange: (event) => setPhoneNumber(event.target.value),
              className: "h-10 rounded-lg bg-slate-900 border border-slate-700 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300/80 hover:border-cyan-400/60 transition-colors",
              required: true
            }
          )
        ] })
      ] }) : null,
      /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300", children: [
        "Email",
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            value: email,
            onChange: (event) => setEmail(event.target.value),
            className: "h-10 rounded-lg bg-slate-900 border border-slate-700 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300/80 hover:border-cyan-400/60 transition-colors",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300", children: [
        "Password",
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: showPassword ? "text" : "password",
              value: password,
              onChange: (event) => setPassword(event.target.value),
              className: "h-10 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 pr-10 text-sm text-slate-100 outline-none focus:border-cyan-300/80 hover:border-cyan-400/60 transition-colors",
              required: true
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowPassword(!showPassword),
              className: "cursor-pointer absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors hover:scale-110",
              children: showPassword ? /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(EyeOff, { className: "w-4 h-4" })
            }
          )
        ] })
      ] }),
      error ? /* @__PURE__ */ jsx("p", { className: "text-xs text-rose-300", children: error }) : null,
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "cursor-pointer w-full h-10 rounded-lg bg-cyan-300/20 border border-cyan-200/40 text-cyan-100 text-xs uppercase font-mono tracking-[0.14em] flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-cyan-300/30 hover:border-cyan-200/60 transition-all duration-200",
          children: [
            mode === "login" ? /* @__PURE__ */ jsx(LogIn, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ jsx(UserPlus, { className: "w-3.5 h-3.5" }),
            loading ? "Please wait..." : mode === "login" ? "Login" : "Sign up"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => {
          setMode((prev) => prev === "login" ? "signup" : "login");
          setError("");
        },
        className: "cursor-pointer mt-4 text-xs text-slate-400 hover:text-cyan-200 transition-colors",
        children: mode === "login" ? "New here? Create account" : "Already registered? Login"
      }
    )
  ] }) });
};
export {
  AuthPanel
};
