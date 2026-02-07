"use client";

import { useProgress } from '../contexts/ProgressContext';

export default function ProfileHeader() {
  const { xp, level, title } = useProgress();
  const syncRate = (xp % 1000) / 10;
  const isSyncHigh = syncRate > 90;

  return (
    <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200/50 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] group cursor-default">
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isSyncHigh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">CLEARANCE: L{level}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900 leading-none font-mono tracking-tight">{title}</span>
      </div>
      
      {/* Sync Rate Indicator */}
      <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-full shadow-inner text-white font-mono font-bold text-[10px] ring-1 ring-black/5">
        <span className={isSyncHigh ? 'text-green-400' : 'text-gray-200'}>
            {Math.floor(syncRate)}<span className="text-[8px]">%</span>
        </span>
        
        {/* Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
          <path
            className="text-white/10"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className={isSyncHigh ? 'text-green-500 drop-shadow-[0_0_2px_rgba(34,197,94,0.5)]' : 'text-blue-500'}
            strokeDasharray={`${syncRate}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
