"use client";

import Link from 'next/link';
import { useProgress, ModuleId } from '../contexts/ProgressContext';
import { useState, useEffect } from 'react';

export default function Codex() {
  const { moduleProgress } = useProgress();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loreEntries = [
    {
      id: 'genesis',
      title: 'FILE_000: GENESIS',
      moduleId: null, // Always unlocked
      content: "The Omega Protocol was initiated to stabilize the collapse of the rational sub-layer. You are the Operator. Your mind is the CPU. Mathematics is the source code.",
      unlockedDate: '2026-02-05'
    },
    {
      id: 'quadratics',
      title: 'FILE_001: GRAVITY WELL',
      moduleId: 'quadratics',
      content: "Gravity is not a force; it is the curvature of the dataset. By mastering the Parabola, you have learned to contain singularities within a defined horizon. The void no longer pulls you; you surf its edge.",
    },
    {
      id: 'trig',
      title: 'FILE_002: HARMONIC RESONANCE',
      moduleId: 'trig',
      content: "All reality is vibration. The Sine Wave is the heartbeat of the simulation. You have successfully tuned the universal carrier wave, allowing clear transmission through the noise.",
    },
    {
      id: 'vectors',
      title: 'FILE_003: VOID NAVIGATION',
      moduleId: 'vectors',
      content: "Position is relative. Direction is absolute. By mastering the Vector, you have unlocked the ability to traverse the grid without a tether. You are no longer a passenger.",
    },
    {
      id: 'data',
      title: 'FILE_004: SIGNAL ARCHIVE',
      moduleId: 'data',
      content: "The world is drowning in noise. You have learned to extract the Signal. The correlation coefficient is your compass; it points to the truth hidden in the chaos.",
    },
    {
      id: 'sequences',
      title: 'FILE_005: CHRONOS PATTERN',
      moduleId: 'sequences',
      content: "Time is a sequence, but it is not linear. It is recursive. You have seen the pattern of divergence and convergence. You can now predict the next frame before it renders.",
    },
    {
      id: 'probability',
      title: 'FILE_006: ENTROPY WEAVER',
      moduleId: 'probability',
      content: "Chance is an illusion caused by incomplete data. The Bell Curve is the shape of fate. You have learned to weave probability into certainty.",
    },
    {
      id: 'calculus',
      title: 'FILE_007: FLUX ENGINE',
      moduleId: 'calculus',
      content: "Static existence is a lie. Everything flows. You have touched the Derivative—the instant of change—and the Integral—the accumulation of history. You control the flow of time itself.",
    },
    {
      id: 'complex',
      title: 'FILE_008: VOID PHASE',
      moduleId: 'complex',
      content: "There are dimensions orthogonal to reality. The Imaginary Unit 'i' is the key to the door. You have rotated your perception 90 degrees and seen the hidden side of the universe.",
    },
    {
      id: 'logs',
      title: 'FILE_009: ENTROPY COMPRESSOR',
      moduleId: 'logs',
      content: "Growth can be terrifying. The Exponential threatens to consume all memory. The Logarithm is your shield—a way to compress the infinite into the manageable.",
    },
    {
      id: 'matrices',
      title: 'FILE_010: FABRIC WEAVER',
      moduleId: 'matrices',
      content: "Space is malleable. The Matrix is the loom. You have learned to stretch, skew, and rotate the very fabric of the simulation. You are not just in the world; you are shaping it.",
    },
    {
      id: 'functions',
      title: 'FILE_011: CAUSALITY ENGINE',
      moduleId: 'functions',
      content: "Cause and effect are not random. They are functional mappings. By tracing the signal from input to output, you have learned to reverse-engineer reality itself. The Black Box is no longer closed.",
    },
  ];

  if (!mounted) return <div className="min-h-screen bg-black text-green-500 font-mono p-12">INITIALIZING...</div>;

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-6 md:p-12 selection:bg-green-900 selection:text-white">
      {/* Background Matrix Rain Effect (Simplified) */}
      <div className="fixed inset-0 pointer-events-none opacity-10 overflow-hidden font-mono text-[10px] leading-3 whitespace-pre text-green-500/50 -z-10">
        {Array(50).fill(0).map((_, i) => (
            <div key={i} style={{ left: `${Math.random() * 100}%`, animationDuration: `${Math.random() * 5 + 2}s` }} className="absolute top-0 animate-rain">
                {Array(20).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join('\n')}
            </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-green-900 pb-4">
            <div>
                <h1 className="text-4xl font-bold tracking-tighter animate-pulse">SYSTEM CODEX</h1>
                <p className="text-xs text-green-700 mt-1">RESTRICTED ACCESS // OPERATOR EYES ONLY</p>
            </div>
            <Link href="/" className="text-sm hover:text-white transition-colors underline decoration-green-800 underline-offset-4">
                ← RETURN TO TERMINAL
            </Link>
        </div>

        {/* Entries Grid */}
        <div className="grid grid-cols-1 gap-4">
            {loreEntries.map((entry) => {
                const isUnlocked = entry.moduleId === null || (moduleProgress[entry.moduleId as ModuleId]?.isMastered);
                
                return (
                    <div 
                        key={entry.id} 
                        className={`relative border p-6 transition-all duration-500 group ${
                            isUnlocked 
                                ? 'border-green-800 bg-green-900/10 hover:bg-green-900/20 shadow-[0_0_15px_rgba(0,255,0,0.1)]' 
                                : 'border-gray-900 bg-black opacity-60'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h2 className={`text-lg font-bold tracking-widest ${isUnlocked ? 'text-green-400' : 'text-gray-700'}`}>
                                {entry.title}
                            </h2>
                            <span className={`text-[10px] px-2 py-0.5 border ${isUnlocked ? 'border-green-700 text-green-700' : 'border-red-900 text-red-900'}`}>
                                {isUnlocked ? 'DECRYPTED' : 'ENCRYPTED'}
                            </span>
                        </div>
                        
                        <div className={`leading-relaxed text-sm font-mono`}>
                            {isUnlocked ? (
                                <span className="text-green-300/80 shadow-green-500/50 drop-shadow-sm">{entry.content}</span>
                            ) : (
                                <span className="text-gray-800 select-none break-all blur-[1px]">
                                    {entry.content.split('').map(() => Math.random() > 0.5 ? '0' : '1').join('')}
                                </span>
                            )}
                        </div>

                        {!isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                                <span className="text-red-600 font-bold text-xs tracking-[0.2em] bg-black px-3 py-1 border border-red-900/50 shadow-[0_0_10px_rgba(255,0,0,0.2)]">
                                    [ LOCK: {entry.moduleId?.toUpperCase()} ]
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-green-900 mt-12 flex justify-between uppercase tracking-widest">
            <span>Omega System OS v2.6.0</span>
            <span className="animate-pulse">Connection: Secure</span>
        </div>

      </div>

      <style jsx>{`
        @keyframes rain {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(100vh); opacity: 0; }
        }
        .animate-rain {
            animation-name: rain;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}
