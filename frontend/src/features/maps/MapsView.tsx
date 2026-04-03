import React from "react";
import { Map } from "lucide-react";

export const MapsView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm min-h-[400px]">
      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
        <Map className="w-8 h-8 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Activities Map</h2>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
        Connect your GPS data to see your running and cycling routes visually on the map.
      </p>
    </div>
  );
};
