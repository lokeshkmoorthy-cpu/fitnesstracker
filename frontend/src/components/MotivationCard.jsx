import { jsx, jsxs } from "react/jsx-runtime";
import React, { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
const LANGUAGE_LABELS = {
  ta: "Tamil",
  en: "English",
  fr: "French"
};
const FALLBACK_QUOTES_BY_LANGUAGE = {
  en: { quote: "Consistency turns effort into results.", author: "Fit Tracker", language: "en" },
  ta: { quote: "\u0BA4\u0BCA\u0B9F\u0BB0\u0BCD\u0B9A\u0BCD\u0B9A\u0BBF\u0BAF\u0BBE\u0BA9 \u0BAE\u0BC1\u0BAF\u0BB1\u0BCD\u0B9A\u0BBF \u0BA4\u0BBE\u0BA9\u0BCD \u0BB5\u0BC6\u0BB1\u0BCD\u0BB1\u0BBF\u0BAF\u0BBF\u0BA9\u0BCD \u0BB0\u0B95\u0B9A\u0BBF\u0BAF\u0BAE\u0BCD.", author: "Fit Tracker", language: "ta" },
  fr: { quote: "La constance transforme l'effort en r\xE9sultats.", author: "Fit Tracker", language: "fr" }
};
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDayMs = 1e3 * 60 * 60 * 24;
  return Math.floor(diff / oneDayMs);
}
function pickDailyQuote(quotes, language) {
  const safeQuotes = quotes.length ? quotes : [FALLBACK_QUOTES_BY_LANGUAGE[language]];
  const dayIndex = getDayOfYear(/* @__PURE__ */ new Date());
  return safeQuotes[dayIndex % safeQuotes.length];
}
const MotivationCard = ({ quotes, loading = false }) => {
  const [language] = useState("en");
  const scopedQuotes = useMemo(
    () => quotes.filter((quote) => quote.language === language),
    [quotes, language]
  );
  const dailyQuote = useMemo(() => pickDailyQuote(scopedQuotes, language), [scopedQuotes, language]);
  return /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden rounded-2xl border border-indigo-100/70 dark:border-indigo-400/20 bg-white dark:bg-slate-900 p-4 shadow-premium", children: [
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl dark:bg-fuchsia-500/20" }),
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/20" }),
    /* @__PURE__ */ jsx("div", { className: "relative flex items-center gap-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md", children: /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.18em] font-extrabold text-indigo-500 dark:text-indigo-300", children: "Daily Motivation" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-800 dark:text-slate-100", children: "Futuristic Mindset Feed" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative mt-3 rounded-xl border border-indigo-100/80 dark:border-white/10 bg-gradient-to-r from-white to-indigo-50/60 dark:from-slate-900 dark:to-indigo-950/40 px-4 py-3.5", children: [
      /* @__PURE__ */ jsx("p", { className: "text-base md:text-lg font-medium leading-relaxed text-slate-700 dark:text-slate-100", children: loading ? "Loading quote of the day..." : `"${dailyQuote.quote}"` }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500", children: loading ? "..." : dailyQuote.author || LANGUAGE_LABELS[dailyQuote.language] })
    ] })
  ] });
};
export {
  MotivationCard
};
