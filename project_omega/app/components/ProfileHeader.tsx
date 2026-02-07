"use client";

import { useProgress } from '../contexts/ProgressContext';

export default function ProfileHeader() {
  const { xp, level, title } = useProgress();

  return (
    <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200/50 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
      <div className="flex flex-col items-end">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Level {level}</span>
        <span className="text-sm font-semibold text-gray-900 leading-none">{title}</span>
      </div>
      <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-inner text-white font-bold text-xs">
        {Math.floor(xp / 100)}%
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
          <path
            className="text-white/20"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="text-white"
            strokeDasharray={`${(xp % 1000) / 10}, 100`}
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
