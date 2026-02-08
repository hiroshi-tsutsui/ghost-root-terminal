"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function OverviewPage() {
  const [initSequence, setInitSequence] = useState(false);

  useEffect(() => {
    // Simple fade-in effect on mount
    const timer = setTimeout(() => setInitSequence(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen bg-black text-white font-mono selection:bg-cyan-500/30 transition-opacity duration-1000 ${initSequence ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Background Grid - subtle */}
      <div className="fixed inset-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-24 space-y-24">
        
        {/* Section 1: The Breach */}
        <section className="space-y-8 animate-fade-in-up">
          <div className="inline-block border border-cyan-500/30 px-3 py-1 text-xs text-cyan-400 tracking-[0.2em] uppercase">
            Protocol: Omega // Phase 2
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none">
            THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">AWAKENING</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 leading-relaxed max-w-2xl border-l-2 border-cyan-500/20 pl-6">
            You have been told that mathematics is a subject to be studied.<br/>
            <span className="text-white font-bold">That was a lie.</span>
          </p>
        </section>

        {/* Section 2: The Truth */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
              THE SIMULATION
            </h2>
            <p className="text-gray-400 leading-7">
              Reality is code. Physics is the runtime. Mathematics is the source.
              <br/><br/>
              When you solve an equation, you are not finding "x". You are debugging the universe.
              The tools you use—<span className="text-cyan-400">Calculus, Vectors, Probability</span>—are not abstract concepts.
              They are the administrative privileges of reality.
            </p>
          </div>

          <div className="p-6 border border-white/10 bg-white/5 rounded-xl backdrop-blur-sm">
            <div className="text-xs text-gray-500 mb-4 tracking-widest uppercase border-b border-white/10 pb-2">
              System Diagnostics
            </div>
            <ul className="space-y-3 font-mono text-sm">
              <li className="flex justify-between">
                <span className="text-gray-400">Quadratics...</span>
                <span className="text-cyan-400">Gravity Well Control</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Vectors...</span>
                <span className="text-purple-400">Spatial Navigation</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Complex...</span>
                <span className="text-pink-400">Phase Shift Analysis</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Calculus...</span>
                <span className="text-red-400">Flux Stabilization</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3: The Role */}
        <section className="space-y-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto"></div>
          
          <h2 className="text-3xl font-bold">YOUR DESIGNATION: <span className="text-cyan-400">OPERATOR</span></h2>
          
          <p className="text-gray-400 text-lg">
            We do not need students. We need Pilots. Architects. Visionaries.
            <br/>
            Your goal is not to pass a test. It is to achieve <span className="text-white font-bold">Synchronization</span>.
          </p>

          <div className="pt-8 flex justify-center gap-6">
            <Link href="/" className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-cyan-400 hover:text-black transition-all">
              INITIATE SYNC
            </Link>
            <Link href="/quiz" className="px-8 py-3 border border-white/20 hover:border-cyan-500 hover:text-cyan-400 transition-all">
              CALIBRATION TEST
            </Link>
          </div>
        </section>

        <footer className="pt-24 text-center text-xs text-gray-600 uppercase tracking-widest">
            Project Omega // Internal Use Only // Auth: Architecture
        </footer>
      </div>
    </div>
  );
}
