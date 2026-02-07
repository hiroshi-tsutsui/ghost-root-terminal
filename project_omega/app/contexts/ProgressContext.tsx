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
  | 'logs'
  | 'matrices'
  | 'functions';

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
  calibration: { status: 'PENDING' | 'COMPLETED'; rate: number };
  completeCalibration: (rate: number) => void;
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
  matrices: { id: 'matrices', completedLevels: [], isMastered: false, xpEarned: 0 },
  functions: { id: 'functions', completedLevels: [], isMastered: false, xpEarned: 0 },
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// --- Provider ---
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState(0);
  const [moduleProgress, setModuleProgress] = useState<Record<ModuleId, ModuleProgress>>(defaultProgress);
  const [calibration, setCalibration] = useState<{ status: 'PENDING' | 'COMPLETED'; rate: number }>({ status: 'PENDING', rate: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const savedXp = localStorage.getItem('omega_xp');
    const savedProgress = localStorage.getItem('omega_progress');
    const savedCalibration = localStorage.getItem('omega_calibration');

    if (savedXp) setXp(parseInt(savedXp, 10));
    if (savedProgress) setModuleProgress(JSON.parse(savedProgress));
    if (savedCalibration) setCalibration(JSON.parse(savedCalibration));
    
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('omega_xp', xp.toString());
    localStorage.setItem('omega_progress', JSON.stringify(moduleProgress));
    localStorage.setItem('omega_calibration', JSON.stringify(calibration));
  }, [xp, moduleProgress, calibration, isLoaded]);

  // Derived State
  const level = Math.floor(xp / 1000) + 1;
  
  const getTitle = (lvl: number) => {
    if (calibration.status === 'COMPLETED') {
      if (calibration.rate === 100) return "OMEGA Operator";
      if (calibration.rate >= 75) return "Architect";
      if (calibration.rate >= 50) return "Operator";
    }
    if (lvl < 2) return "Novice Operator";
    if (lvl < 5) return "Apprentice";
    if (lvl < 10) return "Analyst";
    if (lvl < 20) return "Architect";
    return "Grand Master";
  };

  const addXp = (amount: number) => {
    setXp(prev => prev + amount);
  };

  const completeCalibration = (rate: number) => {
    setCalibration({ status: 'COMPLETED', rate });
    // Award XP based on rate
    const xpReward = rate * 10; // e.g., 1000 XP for 100%
    addXp(xpReward);
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
    setCalibration({ status: 'PENDING', rate: 0 });
    localStorage.removeItem('omega_xp');
    localStorage.removeItem('omega_progress');
    localStorage.removeItem('omega_calibration');
  };

  return (
    <ProgressContext.Provider value={{ 
      xp, 
      level, 
      title: getTitle(level), 
      moduleProgress, 
      addXp, 
      completeLevel,
      resetProgress,
      calibration,
      completeCalibration
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
