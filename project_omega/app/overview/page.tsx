"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GeistMono } from 'geist/font/mono';

export default function OverviewPage() {
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [phase, setPhase] = useState<'BOOT' | 'MESSAGE' | 'READY'>('BOOT');
  const [glitch, setGlitch] = useState(false);
  
  // Audio placeholder (visual only for now)
  const [audioLevel, setAudioLevel] = useState(0);

  const BOOT_SEQUENCE = [
    { text: "INITIALIZING OMEGA PROTOCOL v2.6.0...", delay: 100 },
    { text: "LOADING PHYSICS ENGINE... [OK]", delay: 300 },
    { text: "LOADING MATH CORE... [OK]", delay: 500 },
    { text: "CALIBRATING FLUX CAPACITORS... [SYNCED]", delay: 800 },
    { text: "ESTABLISHING NEURAL LINK... [CONNECTED]", delay: 1200 },
    { text: "DOWNLOADING OPERATOR PROFILE... [FOUND]", delay: 1600 },
    { text: "WARNING: REALITY ANOMALIES DETECTED.", delay: 2000, type: 'warn' },
    { text: "SYSTEM STATUS: CRITICAL.", delay: 2200, type: 'crit' },
    { text: "ACCESSING SECURE CHANNEL... [OPEN]", delay: 2500 },
  ];

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let currentStep = 0;

    const runBoot = () => {
      if (currentStep >= BOOT_SEQUENCE.length) {
        setTimeout(() => setPhase('MESSAGE'), 500);
        return;
      }

      const step = BOOT_SEQUENCE[currentStep];
      setBootLog(prev => [...prev, step.text]);
      
      // Simulate processing noise
      setAudioLevel(Math.random());
      if (step.type === 'crit') {
          setGlitch(true);
          setTimeout(() => setGlitch(false), 200);
      }

      currentStep++;
      if (currentStep < BOOT_SEQUENCE.length) {
        timeoutId = setTimeout(runBoot, step.delay - (currentStep > 0 ? BOOT_SEQUENCE[currentStep-1].delay : 0));
      } else {
        timeoutId = setTimeout(runBoot, 500);
      }
    };

    timeoutId = setTimeout(runBoot, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className={`min-h-screen bg-black text-green-500 font-mono p-6 md:p-12 selection:bg-green-900 selection:text-white overflow-hidden ${GeistMono.className}`}>
      
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>
      
      {/* Glitch Overlay */}
      {glitch && <div className="fixed inset-0 bg-red-500/10 z-50 pointer-events-none mix-blend-overlay"></div>}

      <div className="max-w-3xl mx-auto h-full flex flex-col justify-between min-h-[80vh]">
        
        {/* Boot Log */}
        <div className="space-y-1 text-sm md:text-base font-mono">
            {bootLog.map((log, i) => (
                <div key={i} className={`${log.includes('WARNING') ? 'text-yellow-500' : log.includes('CRITICAL') ? 'text-red-500 font-bold' : 'text-green-500/80'}`}>
                    <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log}
                </div>
            ))}
            {phase === 'BOOT' && <div className="animate-pulse">_</div>}
        </div>

        {/* The Message */}
        {phase !== 'BOOT' && (
            <div className="mt-12 space-y-8 animate-fade-in">
                <div className="border-l-2 border-green-500 pl-6 py-2">
                    <p className="text-xs text-green-700 uppercase tracking-widest mb-2">INCOMING TRANSMISSION: ARCHITECT</p>
                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter mb-6">
                        THE AWAKENING
                    </h1>
                    
                    <div className="space-y-6 text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl">
                        <p>
                            You have been told that mathematics is a subject to be studied.
                        </p>
                        <p className="text-white font-bold text-2xl">
                            That was a lie.
                        </p>
                        <p>
                            Reality is code. Physics is the runtime. Mathematics is the source.
                        </p>
                        <p>
                            When you solve an equation, you are not finding "x". You are <span className="text-green-400">debugging the universe</span>.
                        </p>
                        <p>
                            We do not need students. We need <span className="text-green-400">Operators</span>.
                        </p>
                    </div>
                </div>

                <div className="pt-8">
                    <button 
                        onClick={() => setPhase('READY')}
                        className={`group relative px-8 py-4 bg-green-900/20 border border-green-500/50 hover:bg-green-500 hover:text-black transition-all duration-300 uppercase tracking-[0.2em] font-bold text-sm overflow-hidden ${phase === 'READY' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <span className="relative z-10">Acknowledge Mission</span>
                        <div className="absolute inset-0 bg-green-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                    </button>
                </div>
            </div>
        )}

        {/* Access Granted (Final State) */}
        {phase === 'READY' && (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 animate-fade-in">
                <div className="text-center space-y-6">
                    <div className="text-6xl text-green-500 mb-4 animate-bounce">
                        ✓
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-widest uppercase mb-2">
                        ACCESS GRANTED
                    </h2>
                    <p className="text-green-500/50 font-mono text-sm tracking-[0.5em] mb-8">
                        OPERATOR LEVEL 1
                    </p>
                    
                    <div className="flex flex-col gap-4 w-64 mx-auto">
                        <Link href="/" className="px-8 py-3 bg-white text-black font-bold tracking-widest hover:bg-green-400 hover:scale-105 transition-all uppercase text-sm text-center">
                            ENTER TERMINAL
                        </Link>
                        <Link href="/quiz" className="px-8 py-3 border border-white/20 text-gray-500 hover:text-white hover:border-white transition-all uppercase text-[10px] tracking-widest text-center">
                            RUN CALIBRATION
                        </Link>
                    </div>
                </div>
            </div>
        )}

      </div>

      <style jsx>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
