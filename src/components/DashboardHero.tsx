import React from "react";
import { Plus, ArrowUpRight, HeartPulse, Dumbbell, ArrowRight } from "lucide-react";

interface DashboardHeroProps {
  userName: string;
  onAddClick?: () => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({ userName, onAddClick }) => {
  return (
    <section className="mb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 italic">
            Good Morning, <span className="text-purple-600 not-italic">{userName}!</span>
          </h1>
          <p className="text-slate-500 font-medium">Ready to crush your goals today?</p>
        </div>

        <button
          onClick={onAddClick}
          className="flex items-center gap-2 px-6 py-3.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-2xl shadow-lg shadow-purple-100 transition-all font-bold tracking-tight"
        >
          <Plus className="w-5 h-5" />
          Add Exercise
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <HeroProgressCard
          title="Lower Body"
          progress={65}
          tags={["Cardio", "1 Hour"]}
          icon={<HeartPulse className="w-5 h-5" />}
        />
        <HeroProgressCard
          title="Upper Body"
          progress={89}
          tags={["Biceps", "2 Hours"]}
          icon={<Dumbbell className="w-5 h-5" />}
        />
      </div>
    </section>
  );
};

interface HeroProgressCardProps {
  title: string;
  progress: number;
  tags: string[];
  icon: React.ReactNode;
}

const HeroProgressCard: React.FC<HeroProgressCardProps> = ({ title, progress, tags, icon }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-50 flex items-center justify-between group hover:shadow-card-hover transition-all cursor-pointer">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors text-purple-600">
            {icon}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-400 leading-tight">Progress</span>
            <span className="text-lg font-bold text-slate-900 tracking-tight">{title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {tags.map((tag, i) => (
            <span key={i} className="text-[11px] font-bold px-3 py-1 bg-slate-50 text-purple-600 border border-slate-100 rounded-lg group-hover:bg-white transition-colors">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-purple-600 transition-all">
          <span>Continue the exercise</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="40"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-100"
          />
          <circle
            cx="50" cy="50" r="40"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={251.2}
            strokeDashoffset={251.2 * (1 - progress / 100)}
            strokeLinecap="round"
            className="text-purple-600 transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-slate-900">{progress}%</span>
        </div>
      </div>
    </div>
  );
};
