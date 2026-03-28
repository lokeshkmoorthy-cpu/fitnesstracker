import React from "react";
import { Plus, HeartPulse, Dumbbell, ArrowRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface DashboardHeroProps {
  userName: string;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({ userName }) => {
  return (
    <div className="space-y-8 mb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Hello {userName} 👋</h1>
          <p className="text-slate-400 font-medium">Today is the best to start exercise</p>
        </div>

        <button className="flex items-center gap-2 px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-lg shadow-purple-100 transition-all font-bold tracking-tight">
          <Plus className="w-5 h-5" />
          Add Exercise
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HeroProgressCard 
          title="Lower Body"
          progress={65}
          tags={["Cardio", "1 Hour"]}
          icon={<HeartPulse className="w-5 h-5 text-purple-600" />}
        />
        <HeroProgressCard 
            title="Upper Body"
            progress={89}
            tags={["Biceps", "2 Hours"]}
            icon={<Dumbbell className="w-5 h-5 text-purple-600" />}
        />
      </div>
    </div>
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
          <div className="p-2.5 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
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
