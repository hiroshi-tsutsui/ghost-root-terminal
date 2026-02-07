"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// --- Types ---
export type ModuleId = 
  | 'quadratics' 
  | 'trig' 
  | 'data' 
  | 'vectors' 
  | 'sequences' 
  | 'probability' 
  | 'calculus' 
  | 'complex' 
  | 'logs';

export interface ModuleProgress {
  id: ModuleId;
  completedLevels: number[]; // e.g. [1, 2, 3]
  isMastered: boolean;
  xpEarned: number;
}

interface ProgressContextType {
  xp: number;
  level: number;
  title: string;
  moduleProgress: Record<ModuleId, ModuleProgress>;
  addXp: (amount: number) => void;
  completeLevel: (moduleId: ModuleId, level: number) => void;
  resetProgress: () => void;
}

// --- Defaults ---
const defaultProgress: Record<ModuleId, ModuleProgress> = {
  quadratics: { id: 'quadratics', completedLevels: [], isMastered: false, xpEarned: 0 },
  trig: { id: 'trig', completedLevels: [], isMastered: false, xpEarned: 0 },
  data: { id: 'data', completedLevels: [], isMastered: false, xpEarned: 0 },
  vectors: { id: 'vectors', completedLevels: [], isMastered: false, xpEarned: 0 },
  sequences: { id: 'sequences', completedLevels: [], isMastered: false, xpEarned: 0 },
  probability: { id: 'probability', completedLevels: [], isMastered: false, xpEarned: 0 },
  calculus: { id: 'calculus', completedLevels: [], isMastered: false, xpEarned: 0 },
  complex: { id: 'complex', completedLevels: [], isMastered: false, xpEarned: 0 },
  logs: { id: 'logs', completedLevels: [], isMastered: false, xpEarned: 0 },
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// --- Provider ---
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState(0);
  const [moduleProgress, setModuleProgress] = useState<Record<ModuleId, ModuleProgress>>(defaultProgress);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const savedXp = localStorage.getItem('omega_xp');
    const savedProgress = localStorage.getItem('omega_progress');

    if (savedXp) setXp(parseInt(savedXp, 10));
    if (savedProgress) setModuleProgress(JSON.parse(savedProgress));
    
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('omega_xp', xp.toString());
    localStorage.setItem('omega_progress', JSON.stringify(moduleProgress));
  }, [xp, moduleProgress, isLoaded]);

  // Derived State
  const level = Math.floor(xp / 1000) + 1;
  
  const getTitle = (lvl: number) => {
    if (lvl < 2) return "Novice Operator";
    if (lvl < 5) return "Apprentice";
    if (lvl < 10) return "Analyst";
    if (lvl < 20) return "Architect";
    return "Grand Master";
  };

  const addXp = (amount: number) => {
    setXp(prev => prev + amount);
  };

  const completeLevel = (moduleId: ModuleId, levelNum: number) => {
    setModuleProgress(prev => {
      const module = prev[moduleId];
      if (module.completedLevels.includes(levelNum)) return prev; // Already done

      const newLevels = [...module.completedLevels, levelNum];
      // Simple logic: if 3 levels done, mastered. Adjust per module in real app.
      const isMastered = newLevels.length >= 3; 
      
      return {
        ...prev,
        [moduleId]: {
          ...module,
          completedLevels: newLevels,
          isMastered: isMastered,
          xpEarned: module.xpEarned + 100 // +100 XP per level
        }
      };
    });
    addXp(100);
  };

  const resetProgress = () => {
    setXp(0);
    setModuleProgress(defaultProgress);
    localStorage.removeItem('omega_xp');
    localStorage.removeItem('omega_progress');
  };

  return (
    <ProgressContext.Provider value={{ 
      xp, 
      level, 
      title: getTitle(level), 
      moduleProgress, 
      addXp, 
      completeLevel,
      resetProgress
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

// --- Hook ---
export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
