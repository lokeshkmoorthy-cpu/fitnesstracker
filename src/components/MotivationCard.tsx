import React, { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { clsx } from "clsx";
import type { MotivationQuote, MotivationQuoteLanguage } from "@/src/types/fitness";

interface MotivationCardProps {
  quotes: MotivationQuote[];
  loading?: boolean;
}

const LANGUAGE_LABELS: Record<MotivationQuoteLanguage, string> = {
  ta: "Tamil",
  en: "English",
  fr: "French",
};

const FALLBACK_QUOTES_BY_LANGUAGE: Record<MotivationQuoteLanguage, MotivationQuote> = {
  en: { quote: "Consistency turns effort into results.", author: "Fit Tracker", language: "en" },
  ta: { quote: "தொடர்ச்சியான முயற்சி தான் வெற்றியின் ரகசியம்.", author: "Fit Tracker", language: "ta" },
  fr: { quote: "La constance transforme l'effort en résultats.", author: "Fit Tracker", language: "fr" },
};

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDayMs = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDayMs);
}

function pickDailyQuote(quotes: MotivationQuote[], language: MotivationQuoteLanguage): MotivationQuote {
  const safeQuotes = quotes.length ? quotes : [FALLBACK_QUOTES_BY_LANGUAGE[language]];
  const dayIndex = getDayOfYear(new Date());
  return safeQuotes[dayIndex % safeQuotes.length];
}

export const MotivationCard: React.FC<MotivationCardProps> = ({ quotes, loading = false }) => {
  const [language, setLanguage] = useState<MotivationQuoteLanguage>("en");

  const scopedQuotes = useMemo(
    () => quotes.filter((quote) => quote.language === language),
    [quotes, language]
  );
  const dailyQuote = useMemo(() => pickDailyQuote(scopedQuotes, language), [scopedQuotes, language]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-indigo-100/70 dark:border-indigo-400/20 bg-white dark:bg-slate-900 p-4 shadow-premium">
      <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl dark:bg-fuchsia-500/20" />
      <div className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/20" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-indigo-500 dark:text-indigo-300">
              Daily Motivation
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Futuristic Mindset Feed
            </p>
          </div>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/50 p-1.5">
          {(["ta", "en", "fr"] as MotivationQuoteLanguage[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={clsx(
                "px-3.5 py-1.5 text-xs md:text-sm font-bold rounded-lg transition-colors",
                language === lang
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-3 rounded-xl border border-indigo-100/80 dark:border-white/10 bg-gradient-to-r from-white to-indigo-50/60 dark:from-slate-900 dark:to-indigo-950/40 px-4 py-3.5">
        <p className="text-base md:text-lg font-medium leading-relaxed text-slate-700 dark:text-slate-100">
          {loading ? "Loading quote of the day..." : `"${dailyQuote.quote}"`}
        </p>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          {loading ? "..." : dailyQuote.author || LANGUAGE_LABELS[dailyQuote.language]}
        </p>
      </div>
    </section>
  );
};
