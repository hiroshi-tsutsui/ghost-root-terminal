"use client";

import Link from 'next/link';
import { useProgress, ModuleId } from './contexts/ProgressContext';
import { useLanguage } from './contexts/LanguageContext';
import { GeistMono } from 'geist/font/mono';
import SystemMessages from './components/SystemMessages';

export default function Home() {
  const { moduleProgress, calibration } = useProgress();
  const { t } = useLanguage();

  const modules = [
    {
      id: 'math/quadratic',
      title: t('modules.math_quadratic.title') || 'QUADRATIC INNOVATION',
      subtitle: 'Protocol: Architect',
      desc: 'Design the curve. Innovate with parameters.',
      status: 'NEW',
      color: 'text-cyan-500',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-900/10'
    },
    {
      id: 'quadratics',
      title: t('modules.quadratics.title') || 'GRAVITY WELL',
      subtitle: 'Protocol: Singularity',
      desc: 'Contain the singularity. Master the parabolic arc.',
      status: 'STABLE',
      color: 'text-blue-500',
      border: 'border-blue-500/30',
      bg: 'bg-blue-900/10'
    },
    {
      id: 'trig',
      title: t('modules.trig.title'),
      subtitle: 'Protocol: Resonance',
      desc: 'Synchronize the carrier wave. Tune the phase.',
      status: 'ACTIVE',
      color: 'text-indigo-400',
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-900/10'
    },
    {
      id: 'data',
      title: t('modules.data.title'),
      subtitle: 'Protocol: Pattern_Recog',
      desc: 'Filter the noise. Lock the signal vector.',
      status: 'LIVE',
      color: 'text-teal-400',
      border: 'border-teal-500/30',
      bg: 'bg-teal-900/10'
    },
    {
      id: 'vectors',
      title: t('modules.vectors.title'),
      subtitle: 'Protocol: Navigation',
      desc: 'Traverse the grid. Escape the origin.',
      status: 'READY',
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-900/10'
    },
    {
      id: 'sequences',
      title: t('modules.sequences.title'),
      subtitle: 'Protocol: Timeline',
      desc: 'Predict the divergence. Stabilize the loop.',
      status: 'SYNCED',
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-900/10'
    },
    {
      id: 'probability',
      title: t('modules.probability.title') || 'ENTROPY WEAVER',
      subtitle: 'Protocol: Oracle',
      desc: 'Collapse the waveform. Predict the outcome.',
      status: 'ONLINE',
      color: 'text-orange-400',
      border: 'border-orange-500/30',
      bg: 'bg-orange-900/10'
    },
    {
      id: 'calculus',
      title: t('modules.calculus.title'),
      subtitle: 'Protocol: Stabilizer',
      desc: 'Control the flow. Accumulate the mass.',
      status: 'CRITICAL',
      color: 'text-red-500',
      border: 'border-red-500/30',
      bg: 'bg-red-900/10'
    },
    {
      id: 'complex',
      title: t('modules.complex.title') || 'PHASE ANALYZER',
      subtitle: 'Protocol: Void_Shift',
      desc: 'Rotate into the imaginary. See the hidden dimension.',
      status: 'ONLINE',
      color: 'text-pink-400',
      border: 'border-pink-500/30',
      bg: 'bg-pink-900/10'
    },
    {
      id: 'logs',
      title: 'ENTROPY COMPRESSOR',
      subtitle: 'Protocol: Scale_Down',
      desc: 'Compress the infinite. Manage the exponential.',
      status: 'STANDBY',
      color: 'text-rose-400',
      border: 'border-rose-500/30',
      bg: 'bg-rose-900/10'
    },
    {
      id: 'matrices',
      title: 'FABRIC WEAVER',
      subtitle: 'Protocol: Transform',
      desc: 'Warp space-time. Shear the grid.',
      status: 'NEW',
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-900/10'
    },
    {
      id: 'functions',
      title: t('modules.functions.title'),
      subtitle: 'Protocol: Black_Box',
      desc: 'Trace the input. Decode the logic.',
      status: 'BETA',
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-900/10'
    },
    {
      id: 'quiz',
      title: 'THE GAUNTLET',
      subtitle: 'Protocol: Calibration',
      desc: 'Test system stability. Establish baseline sync rate.',
      status: 'CRITICAL',
      color: 'text-red-500',
      border: 'border-red-500/30',
      bg: 'bg-red-900/10'
    }
  ];

  const tiers = [
    {
      name: "PROTOCOL: CALIBRATION",
      desc: "System Initialization Required.",
      ids: ['quiz']
    },
    {
      name: "TIER 1: THE SANDBOX",
      desc: "Master the visible world.",
      ids: ['data', 'functions', 'vectors']
    },
    {
      name: "TIER 2: THE MOTION",
      desc: "Master the flow of reality.",
      ids: ['math/quadratic', 'sequences', 'calculus', 'quadratics', 'logs']
    },
    {
      name: "TIER 3: THE VOID",
      desc: "Step outside the simulation.",
      ids: ['complex', 'matrices']
    },
    {
      name: "TIER 4: THE SOURCE",
      desc: "See the code.",
      ids: ['probability', 'trig']
    }
  ];

  // Operator Logic
  const totalModules = modules.length;
  const masteredCount = modules.filter(m => moduleProgress[m.id as ModuleId]?.isMastered).length;
  const syncRate = Math.round((masteredCount / totalModules) * 100);

  let rank = "CANDIDATE";
  if (syncRate > 20) rank = "INITIATE";
  if (syncRate > 50) rank = "OPERATOR";
  if (syncRate > 80) rank = "ARCHITECT";
  if (syncRate === 100) rank = "OMEGA";

  return (
    <div className={`min-h-screen bg-[#050505] text-white font-mono selection:bg-white/20 ${GeistMono.className}`}>
      
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="relative pt-24 px-6 max-w-7xl mx-auto space-y-16 pb-24">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-8 gap-8">
            <div className="space-y-4">
               <h1 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 whitespace-nowrap">
                  {t('common.app_title')}
               </h1>
               <div className="flex items-center gap-4">
                  <span className="text-xs px-2 py-0.5 border border-white/20 text-white/50 uppercase tracking-widest">System v2.7.0</span>
                  <span className="text-xs text-green-500 animate-pulse">● SERVERS ONLINE</span>
               </div>
            </div>

            {/* Operator Card */}
            <div className="w-full md:w-96 border border-white/10 bg-white/5 p-6 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 text-[10px] text-white/20 uppercase tracking-widest group-hover:text-white/40 transition-colors">
                    ID: {rank}
                </div>
                
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Current Designation</div>
                        <div className={`text-2xl font-bold tracking-widest ${rank === 'OMEGA' ? 'text-purple-400' : 'text-white'}`}>{rank}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-white/10 group-hover:text-white/20 transition-colors">{syncRate}%</div>
                    </div>
                </div>

                {calibration?.status === 'COMPLETED' && (
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Calibration Rating</span>
                        <span className={`font-mono font-bold ${calibration.rate >= 90 ? 'text-cyan-400' : 'text-white'}`}>
                            {calibration.rate.toFixed(1)}%
                        </span>
                    </div>
                )}

                <div className="w-full h-1 bg-white/10 overflow-hidden mb-4">
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${syncRate}%` }}></div>
                </div>

                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest gap-2 flex-wrap">
                    <Link href="/overview" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                        [ BRIEFING ]
                    </Link>
                    <Link href="/codex" className="hover:text-green-400 transition-colors flex items-center gap-1">
                        [ LOGS ]
                    </Link>
                    <Link href="/profile" className="hover:text-purple-400 transition-colors flex items-center gap-1 font-bold animate-pulse">
                        [ DOSSIER ]
                    </Link>
                    <Link href="/manual" className="hover:text-yellow-400 transition-colors flex items-center gap-1">
                        [ MANUAL ]
                    </Link>
                    <Link href="/settings" className="hover:text-red-400 transition-colors flex items-center gap-1">
                        [ CONFIG ]
                    </Link>
                </div>
            </div>
          </div>

          {/* Module Grid by Tier */}
          <div className="space-y-16">
            {tiers.map((tier) => (
              <section key={tier.name}>
                 <div className="flex items-end gap-4 mb-6 border-b border-white/10 pb-2">
                    <h3 className="text-xl font-bold text-white tracking-widest uppercase">
                        {tier.name}
                    </h3>
                    <span className="text-gray-500 text-xs font-mono mb-1">{tier.desc}</span>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tier.ids.map(id => {
                       const m = modules.find(mod => mod.id === id);
                       if (!m) return null;
                       
                       const isMastered = moduleProgress[m.id as ModuleId]?.isMastered;
                       
                       return (
                          <Link key={m.id} href={`/${m.id}`} className={`group relative p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] ${isMastered ? 'border-white/40 bg-white/5' : 'border-white/10 bg-black hover:border-white/30'}`}>
                              {/* Status Light */}
                              <div className="absolute top-4 right-4 flex items-center gap-2">
                                  {isMastered && <span className="text-[10px] text-yellow-400 font-bold tracking-widest">SYNCED</span>}
                                  <div className={`w-1.5 h-1.5 rounded-full ${isMastered ? 'bg-yellow-400' : 'bg-white/20 group-hover:bg-white/50'}`}></div>
                              </div>

                              <div className={`text-[10px] font-bold tracking-[0.2em] mb-2 uppercase ${m.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                                  {m.subtitle}
                              </div>
                              
                              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-white transition-colors">
                                  {m.title}
                              </h2>
                              
                              <p className="text-sm text-gray-500 font-mono leading-relaxed mb-6 group-hover:text-gray-400 transition-colors">
                                  {m.desc}
                              </p>

                              <div className="flex items-center text-[10px] uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">
                                  <span className="mr-2">Initiate Protocol</span>
                                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                              </div>
                          </Link>
                       );
                    })}
                 </div>
              </section>
            ))}
          </div>

          <footer className="pt-12 border-t border-white/10 text-center text-[10px] text-white/20 uppercase tracking-[0.3em]">
              {t('common.app_title')} // {t('common.app_subtitle')} // End of Line
          </footer>

      </div>
      <SystemMessages />
    </div>
  );
}
