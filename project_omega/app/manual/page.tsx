"use client";

import Link from 'next/link';
import { GeistMono } from 'geist/font/mono';
import { useState } from 'react';

export default function ManualPage() {
  const [section, setSection] = useState<'HUD' | 'PROTOCOLS' | 'KEYWORDS' | 'RANKS'>('HUD');

  const CONTENT = {
    HUD: (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-green-400 tracking-widest border-b border-green-900 pb-2">Heads-Up Display (HUD)</h2>
        
        <div className="grid gap-6">
            <div className="bg-white/5 p-4 border border-green-900/50">
                <h3 className="text-sm font-bold text-white mb-2">SYNC RATE</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    The global percentage of systems stabilized.
                    <br/><span className="text-green-500">Goal:</span> Reach 100% to achieve OMEGA status.
                    <br/><span className="text-red-500">Warning:</span> Low sync rate implies simulation instability.
                </p>
            </div>
            
            <div className="bg-white/5 p-4 border border-green-900/50">
                <h3 className="text-sm font-bold text-white mb-2">CALIBRATION RATING</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Your baseline performance metric derived from "The Gauntlet".
                    <br/><span className="text-blue-400">Effect:</span> A high calibration rating unlocks advanced visualization layers in specific modules.
                </p>
            </div>

            <div className="bg-white/5 p-4 border border-green-900/50">
                <h3 className="text-sm font-bold text-white mb-2">SYSTEM MESSAGES</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    The <span className="border border-white/20 px-1 rounded bg-black">Secure Uplink</span> icon (bottom-right).
                    <br/>Contains encrypted directives from The Architect and system status reports.
                    <br/>Check frequently for new protocols.
                </p>
            </div>
        </div>
      </div>
    ),
    PROTOCOLS: (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-purple-400 tracking-widest border-b border-purple-900 pb-2">Protocol Types</h2>
        
        <div className="space-y-4">
            <div className="flex gap-4 items-start">
                <div className="w-24 text-[10px] font-bold text-blue-400 uppercase tracking-widest pt-1">Stabilization</div>
                <div className="flex-1 text-xs text-gray-400">
                    <p className="mb-1">Example: <span className="text-white">Gravity Well (Quadratics), Flux Engine (Calculus)</span></p>
                    <p>Requires containing a volatile value within safety limits. Failure results in singularity collapse.</p>
                </div>
            </div>

            <div className="flex gap-4 items-start">
                <div className="w-24 text-[10px] font-bold text-purple-400 uppercase tracking-widest pt-1">Navigation</div>
                <div className="flex-1 text-xs text-gray-400">
                    <p className="mb-1">Example: <span className="text-white">Void Scout (Vectors), Phase Analyzer (Complex)</span></p>
                    <p>Requires movement from Origin (0,0) to a target Vector. Precision is paramount.</p>
                </div>
            </div>

            <div className="flex gap-4 items-start">
                <div className="w-24 text-[10px] font-bold text-indigo-400 uppercase tracking-widest pt-1">Resonance</div>
                <div className="flex-1 text-xs text-gray-400">
                    <p className="mb-1">Example: <span className="text-white">Harmonic Tuner (Trig)</span></p>
                    <p>Requires matching a target waveform. Use audio cues to fine-tune frequency and phase.</p>
                </div>
            </div>

            <div className="flex gap-4 items-start">
                <div className="w-24 text-[10px] font-bold text-emerald-400 uppercase tracking-widest pt-1">Decryption</div>
                <div className="flex-1 text-xs text-gray-400">
                    <p className="mb-1">Example: <span className="text-white">Causality Engine (Functions), System Codex</span></p>
                    <p>Requires reverse-engineering a black box system to reveal the hidden logic or text.</p>
                </div>
            </div>
        </div>
      </div>
    ),
    KEYWORDS: (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-yellow-400 tracking-widest border-b border-yellow-900 pb-2">System Lexicon</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
                ['RESONANCE', 'The degree of alignment between your input and the target reality wave.'],
                ['ENTROPY', 'The tendency of the simulation to degrade into noise. Must be woven into order.'],
                ['FLUX', 'The rate of change of any system variable. Time is the ultimate flux.'],
                ['SINGULARITY', 'A point of infinite value/density. Avoid at all costs.'],
                ['THE VOID', 'The empty space between defined coordinate points. Navigable only via Vectors.'],
                ['ARCHIVE', 'The repository of all valid signal data. Filtered from noise.'],
            ].map(([term, def]) => (
                <div key={term} className="bg-white/5 p-3 border-l-2 border-yellow-600">
                    <h4 className="text-xs font-bold text-yellow-500 mb-1">{term}</h4>
                    <p className="text-[10px] text-gray-400 leading-tight">{def}</p>
                </div>
            ))}
        </div>
      </div>
    ),
    RANKS: (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-red-400 tracking-widest border-b border-red-900 pb-2">Clearance Levels</h2>
        
        <div className="space-y-6 relative">
            {/* Timeline Line */}
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-800"></div>

            {[
                ['CANDIDATE', '0-20%', 'Restricted Access. Can view public modules only.', 'text-gray-500'],
                ['INITIATE', '21-50%', 'Basic Access. Can run stabilization protocols.', 'text-blue-400'],
                ['OPERATOR', '51-80%', 'Full Access. Can modify system variables.', 'text-green-400'],
                ['ARCHITECT', '81-99%', 'Command Access. Can rewrite local reality segments.', 'text-purple-400'],
                ['OMEGA', '100%', 'Unlimited Access. You are the source code.', 'text-yellow-400 font-bold animate-pulse'],
            ].map(([rank, pct, desc, color], i) => (
                <div key={rank} className="relative pl-8">
                    <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-[#050505] ${color.split(' ')[0].replace('text', 'bg')}`}></div>
                    <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`text-lg tracking-widest ${color}`}>{rank}</h3>
                        <span className="text-xs font-mono text-gray-600">{pct} SYNC</span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{desc}</p>
                </div>
            ))}
        </div>
      </div>
    )
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-white font-mono p-6 md:p-12 ${GeistMono.className}`}>
      
      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-5" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <div className="max-w-4xl mx-auto pb-24 relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-12">
            <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2">FIELD MANUAL</h1>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-[0.2em]">
                    <span>Doc v2.6.0</span>
                    <span>//</span>
                    <span>Ref: OMEGA-MAN-001</span>
                </div>
            </div>
            <Link href="/" className="px-6 py-2 border border-white/20 hover:bg-white hover:text-black transition-all text-xs font-bold tracking-widest uppercase">
                Return to Hub
            </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
            
            {/* Sidebar Nav */}
            <nav className="w-full md:w-48 flex flex-col gap-2">
                {Object.keys(CONTENT).map((key) => (
                    <button
                        key={key}
                        onClick={() => setSection(key as any)}
                        className={`text-left px-4 py-3 text-xs font-bold tracking-widest transition-all border-l-2 ${
                            section === key 
                                ? 'border-green-500 text-green-400 bg-green-900/10 pl-6' 
                                : 'border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
                        }`}
                    >
                        {key}
                    </button>
                ))}
            </nav>

            {/* Content Area */}
            <main className="flex-1 bg-white/5 border border-white/10 p-8 min-h-[400px]">
                {CONTENT[section]}
            </main>

        </div>

      </div>
      
      <style jsx>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateX(10px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
