"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useProgress, ModuleId } from '../contexts/ProgressContext';

export default function Profile() {
  const { xp, level, title, moduleProgress, calibration } = useProgress();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-black text-green-500 font-mono p-12">INITIALIZING PROFILE...</div>;

  // Calculate total mastery percentage
  const totalModules = Object.keys(moduleProgress).length;
  const masteredCount = Object.values(moduleProgress).filter(m => m.isMastered).length;
  const syncRate = Math.round((masteredCount / totalModules) * 100);

  // Determine Rank Icon based on Level
  const getRankIcon = (lvl: number) => {
    if (lvl < 5) return "👻"; // Ghost
    if (lvl < 10) return "🌐"; // Grid
    if (lvl < 20) return "🧊"; // Cube
    return "💠"; // Tesseract
  };

  const rankIcon = getRankIcon(level);

  // Group modules for display
  const modules = Object.values(moduleProgress);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 md:p-8 selection:bg-green-900 selection:text-white overflow-hidden relative">
      
      {/* Background Matrix Effect (Static for now) */}
      <div className="fixed inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(0,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center mb-12 border-b border-green-800 pb-4 relative z-10"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tighter">OPERATOR DOSSIER</h1>
          <p className="text-xs text-green-700 mt-1">ID: OMEGA-7X-{Math.floor(Math.random() * 9999)} // CLASSIFIED</p>
        </div>
        <Link href="/" className="text-sm hover:text-white transition-colors underline decoration-green-800 underline-offset-4">
          ← TERMINAL
        </Link>
      </motion.div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Column: ID Card */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* ID Card Component */}
          <div className="bg-green-900/10 border border-green-500/50 p-6 rounded-sm shadow-[0_0_20px_rgba(0,255,0,0.1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-green-500 rounded-tr-sm"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-green-500 rounded-bl-sm"></div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-full border-4 border-green-500/30 flex items-center justify-center text-6xl bg-black relative shadow-[0_0_30px_rgba(0,255,0,0.2)] animate-pulse-slow">
                {rankIcon}
                <div className="absolute inset-0 rounded-full border border-green-500/50 animate-spin-slow-reverse opacity-50"></div>
              </div>
              
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-widest">{title.toUpperCase()}</h2>
                <div className="text-xs text-green-600 font-bold tracking-[0.2em]">CLEARANCE LEVEL {level}</div>
              </div>

              <div className="w-full bg-green-900/30 h-1 mt-4">
                <div 
                  className="bg-green-500 h-full transition-all duration-1000 ease-out" 
                  style={{ width: `${(xp % 1000) / 10}%` }}
                ></div>
              </div>
              <div className="flex justify-between w-full text-[10px] text-green-700">
                <span>XP: {xp}</span>
                <span>NEXT: {(Math.floor(xp/1000) + 1) * 1000}</span>
              </div>
            </div>
          </div>

          {/* Calibration Status */}
          <div className="border border-green-900 p-4 bg-black">
            <h3 className="text-sm font-bold text-green-600 mb-2 tracking-widest">CALIBRATION STATUS</h3>
            {calibration.status === 'COMPLETED' ? (
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-green-400">{calibration.rate}%</div>
                <div className="text-[10px] text-green-700 mt-1">SYSTEM OPTIMAL</div>
              </div>
            ) : (
              <div className="text-center py-4 text-red-500 text-xs animate-pulse">
                WARNING: UNCALIBRATED
                <div className="mt-2">
                  <Link href="/quiz" className="underline hover:text-red-400">INITIATE PROTOCOL</Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Middle/Right Column: Module Stats */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Sync Stability Header */}
          <div className="flex items-end justify-between border-b border-green-900 pb-2">
            <h3 className="text-xl font-bold tracking-widest text-green-400">SECTOR STABILITY</h3>
            <div className="text-2xl font-bold text-white">{syncRate}% <span className="text-xs text-green-600 font-normal align-middle">SYNC</span></div>
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod, i) => (
              <motion.div 
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.5 }}
                className={`border ${mod.isMastered ? 'border-green-500/50 bg-green-900/10' : 'border-green-900/30 bg-black'} p-4 relative group hover:border-green-500 transition-colors`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold uppercase tracking-widest text-sm">{mod.id}</span>
                  {mod.isMastered && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 border border-green-500/30">MASTERED</span>}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-green-900/20 h-2 mb-2 relative overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_20%,rgba(0,255,0,0.1)_20%,rgba(0,255,0,0.1)_21%,transparent_21%)] bg-[size:10px_100%]"></div>
                    
                    <div 
                        className={`h-full transition-all duration-1000 ${mod.isMastered ? 'bg-green-500 shadow-[0_0_10px_rgba(0,255,0,0.5)]' : 'bg-green-800'}`}
                        style={{ width: `${Math.min((mod.completedLevels.length / 3) * 100, 100)}%` }}
                    ></div>
                </div>

                <div className="flex justify-between text-[10px] text-green-700 font-mono">
                    <span>Lvl {mod.completedLevels.length} / 3</span>
                    <span>XP: {mod.xpEarned}</span>
                </div>

                {/* Hover Effect: Show Details */}
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </motion.div>
            ))}
          </div>

          {/* Footer Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-green-900">
            <div className="text-center">
                <div className="text-2xl font-bold text-white">{totalModules}</div>
                <div className="text-[10px] text-green-600 tracking-widest">SECTORS</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-white">{masteredCount}</div>
                <div className="text-[10px] text-green-600 tracking-widest">STABILIZED</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-white">{xp}</div>
                <div className="text-[10px] text-green-600 tracking-widest">TOTAL FLUX</div>
            </div>
          </div>

        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
        }
        .animate-spin-slow-reverse {
            animation: spin-slow-reverse 10s linear infinite;
        }
        .animate-pulse-slow {
            animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

    </div>
  );
}
