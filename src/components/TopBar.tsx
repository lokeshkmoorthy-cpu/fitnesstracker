import React from "react";
import { 
  Bell, 
  MessageSquare, 
  ChevronLeft,
  Globe,
  ChevronDown
} from "lucide-react";

interface TopBarProps {
  title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
  return (
    <header className="flex items-center justify-between mb-10">
      <div className="flex items-center gap-6">
        <button className="p-2.5 bg-white rounded-xl shadow-premium border border-slate-50 text-slate-400 hover:text-purple-600 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 p-1 bg-white rounded-2xl shadow-premium border border-slate-50">
          <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-slate-50 rounded-xl transition-all relative">
            <Bell className="w-5 h-5" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-slate-50 rounded-xl transition-all">
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        <button className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-premium border border-slate-50 hover:bg-slate-50 transition-all group">
          <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-slate-100">
            <Globe className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Eng (US)</span>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
        </button>
      </div>
    </header>
  );
};
