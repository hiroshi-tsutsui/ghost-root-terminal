"use client";

import Link from 'next/link';
import { useProgress, ModuleId } from './contexts/ProgressContext';

export default function Home() {
  const { moduleProgress } = useProgress();

  const modules = [
    {
      id: 'quadratics',
      title: 'Gravity Well',
      desc: 'PROTOCOL: SINGULARITY\n二次関数 - 放物線の重力場制御',
      colorClass: 'text-blue-600 bg-blue-50 group-hover:bg-blue-100',
      level: 'Math I / Protocol',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'trig',
      title: 'Harmonic Tuner',
      desc: 'PROTOCOL: RESONANCE\n三角比 - 波形同期と振動解析',
      colorClass: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100',
      level: 'Math I / Protocol',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'data',
      title: 'Signal Archive',
      desc: 'PROTOCOL: PATTERN_RECOG\nデータの分析 - ノイズ除去と信号同期',
      colorClass: 'text-teal-600 bg-teal-50 group-hover:bg-teal-100',
      level: 'Math I / Protocol',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'vectors',
      title: 'Void Scout',
      desc: 'PROTOCOL: NAVIGATION\nベクトル - 空間機動と座標制御',
      colorClass: 'text-purple-600 bg-purple-50 group-hover:bg-purple-100',
      level: 'Math B / Protocol',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      id: 'sequences',
      title: 'Chronos Pattern',
      desc: 'PROTOCOL: TIMELINE\n数列 - 時間軸の発散と収束',
      colorClass: 'text-cyan-600 bg-cyan-50 group-hover:bg-cyan-100',
      level: 'Math B / Protocol',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    },
    {
      id: 'probability',
      title: 'Entropy Weaver',
      desc: 'PROTOCOL: ORACLE\n確率 - 不確定性事象の観測',
      colorClass: 'text-orange-600 bg-orange-50 group-hover:bg-orange-100',
      level: 'Math A / Protocol',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      )
    },
    {
      id: 'calculus',
      title: 'Flux Engine',
      desc: 'PROTOCOL: STABILIZER\n微分積分 - 変化率と蓄積量の制御',
      colorClass: 'text-red-600 bg-red-50 group-hover:bg-red-100',
      level: 'Math III / Protocol',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      id: 'complex',
      title: 'Phase Analyzer',
      desc: 'PROTOCOL: VOID_SHIFT\n複素数平面 - 虚数軸への位相回転',
      colorClass: 'text-cyan-600 bg-cyan-50 group-hover:bg-cyan-100',
      level: 'Math III / Protocol',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'logs',
      title: 'Entropy Compressor',
      desc: 'PROTOCOL: SCALE_DOWN\n指数対数 - 爆発的増加の圧縮',
      colorClass: 'text-pink-600 bg-pink-50 group-hover:bg-pink-100',
      level: 'Math II / Protocol',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
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
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900 font-sans selection:bg-blue-500/30">
      
      <div className="flex flex-col items-center justify-center pt-16 pb-16 px-6">
        <div className="max-w-7xl w-full text-center space-y-12">
          
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginTop: '4rem' }} className="space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
              PROJECT <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">OMEGA</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 font-mono font-normal max-w-2xl mx-auto leading-relaxed tracking-wider">
              PHASE 2: THE AWAKENING<br/>
              <span className="text-sm text-gray-400 mt-2 block">Operator Synchronization In Progress...</span>
            </p>
          </div>

          {/* Operator HUD */}
          <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] font-mono text-left animate-fade-in-up transition-all hover:shadow-md">
            <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-4">
                <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Identity</div>
                    <div className="text-lg font-bold text-gray-900">OPERATOR: LOCAL</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Clearance Level</div>
                    <div className={`text-lg font-bold ${rank === 'OMEGA' ? 'text-purple-600' : 'text-gray-900'}`}>{rank}</div>
                </div>
            </div>
            <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                <div>
                    <span className="text-[10px] font-bold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-50 border border-blue-100">
                    Sync Rate
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold inline-block text-blue-600">
                    {syncRate}%
                    </span>
                </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
                    <div style={{ width: `${syncRate}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-out"></div>
                </div>
                <div className="text-[10px] text-gray-400 text-center uppercase tracking-widest">
                    {masteredCount} / {totalModules} Protocols Stabilized
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 text-left">
            {modules.map((m) => {
              const isMastered = moduleProgress[m.id as ModuleId]?.isMastered;
              return (
                <Link key={m.id} href={`/${m.id}`} className="group relative block p-8 bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl transition-colors ${m.colorClass}`}>
                       {m.icon}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {isMastered && (
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 shadow-sm border border-yellow-200">
                                SYNCED ⚡
                             </span>
                        )}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase ${m.colorClass.split(' ').slice(0, 2).join(' ')}`}>
                        {m.level}
                        </span>
                    </div>
                </div>
                <h2 className={`text-2xl font-bold text-gray-900 mb-2 transition-colors ${m.colorClass.split(' ')[0].replace('text-', 'group-hover:text-')}`}>{m.title}</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed whitespace-pre-line font-mono">
                    {m.desc}
                </p>
                <div className={`flex items-center text-sm font-semibold opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all ${m.colorClass.split(' ')[0]}`}>
                    INITIALIZE <span className="ml-1">→</span>
                </div>
                </Link>
              );
            })}
          </div>
          
           {/* Mastery Quiz Link */}
           <div className="mt-16 pt-8 border-t border-gray-200">
                <Link href="/quiz" className="inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                    🏆 Operator Exam
                </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
