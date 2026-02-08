"use client";

import React from 'react';
import { useProgress } from '../contexts/ProgressContext';
import { GeistMono } from 'geist/font/mono';

export default function XPBar() {
  const { xp, level, title } = useProgress();

  // Level calculation logic (matches context)
  // Level N starts at (N-1)*1000 XP.
  // Current level progress = (xp % 1000) / 1000
  
  const progress = (xp % 1000) / 1000 * 100;
  const nextLevelXp = level * 1000;
  const currentLevelStartXp = (level - 1) * 1000;
  
  return (
    <div className={`fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-white/10 p-2 z-50 ${GeistMono.className}`}>
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4">
        
        {/* Level Indicator */}
        <div className="flex flex-col items-center justify-center min-w-[60px]">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Level</span>
          <span className="text-2xl font-bold text-white">{level}</span>
        </div>

        {/* Title & Bar */}
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-end text-[10px] uppercase tracking-widest">
             <span className="text-white/70 font-bold">{title}</span>
             <span className="text-gray-500">{xp} / {nextLevelXp} XP</span>
          </div>
          
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]"
              style={{ width: `${progress}%` }}
            ></div>
            
            {/* Subtle scanline effect on bar */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>

        {/* XP Gain Indicator (could be animated later) */}
        <div className="hidden md:block text-[10px] text-gray-600 uppercase tracking-widest">
           System // Online
        </div>

      </div>
    </div>
  );
}
