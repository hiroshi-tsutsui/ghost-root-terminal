// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GeistMono } from 'geist/font/mono';
import { useProgress } from '../contexts/ProgressContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants ---
const MODULE_ID = 'sequences';

// --- Localization Content ---
const LOCAL_CONTENT = {
    en: {
        title: "CHRONOS PATTERN",
        levels: {
            1: { name: "BASICS", desc: "Steps & Multipliers." },
            2: { name: "THEORY", desc: "The General Term." },
            3: { name: "VISUALIZATION", desc: "Timeline Simulation." },
            4: { name: "APPLY", desc: "Growth & Decay." }
        },
        concepts: {
            title: "Concept: The Flow of Time",
            arith_title: "Arithmetic (Linear)",
            arith_body: "Adding the same amount every step. Like walking up stairs. 1, 2, 3, 4... Steady, predictable progress.",
            geo_title: "Geometric (Exponential)",
            geo_body: "Multiplying by the same factor. Like cell division or viral spread. 1, 2, 4, 8... Explosive growth or rapid decay."
        },
        theory: {
            title: "Theory: Prediction Algorithms",
            arith_term: "Arithmetic Sequence",
            arith_eq: "a_n = a + (n-1)d",
            arith_desc: "To find the n-th term, we start at 'a' and add the difference 'd', (n-1) times.",
            geo_term: "Geometric Sequence",
            geo_eq: "a_n = a * r^(n-1)",
            geo_desc: "To find the n-th term, we start at 'a' and multiply by the ratio 'r', (n-1) times."
        },
        viz: {
            title: "Protocol: Chronos Pattern",
            log_start: "TIMELINE SIMULATION INITIALIZED...",
            log_guide: "ESTABLISH STASIS. TARGET LINEAR VELOCITY (d) = 0 AND DIVERGENCE (r) = 1.0.",
            controls: {
                anchor: "ANCHOR POINT (a)",
                linear: "LINEAR VELOCITY (d)",
                divergence: "DIVERGENCE FACTOR (r)",
                depth: "SIMULATION DEPTH (n)",
                telemetry: "TELEMETRY",
                status_critical: "CRITICAL: RUNAWAY",
                status_decay: "WARNING: DECAY",
                status_stable: "STABLE: LINEAR",
                status_stasis: "COMPLETE: STASIS LOCK"
            },
            viewport: "TIMELINE_RENDER"
        },
        apps: {
            title: "Applications: Future Casting",
            finance_title: "Compound Interest",
            finance_body: "Money grows geometrically. A small interest rate, given enough time (n), creates massive wealth.",
            bio_title: "Population Growth",
            bio_body: "Populations multiply. One bacteria becomes two, then four. Understanding 'r' helps us predict pandemics.",
            algo_title: "Algorithms",
            algo_body: "Binary Search cuts the problem size in half each step (r=0.5). It's a geometric decay of complexity."
        },
        completion: {
            synced: "TIMELINE STABILIZED",
            msg: "You have mastered the patterns of time. The future is now calculable."
        }
    },
    ja: {
        title: "クロノス・パターン (数列)",
        levels: {
            1: { name: "基礎 (Basics)", desc: "足し算と掛け算の連鎖。" },
            2: { name: "理論 (Logic)", desc: "一般項の導出。" },
            3: { name: "可視化 (Viz)", desc: "タイムライン・シミュレーション。" },
            4: { name: "応用 (Applications)", desc: "増殖と減衰。" }
        },
        concepts: {
            title: "概念：時の流れ",
            arith_title: "等差数列 (Linear)",
            arith_body: "一定の数を足し続ける変化。階段を上るようなもの。1, 2, 3, 4... 着実で予測可能な進歩です。",
            geo_title: "等比数列 (Exponential)",
            geo_body: "一定の数を掛け続ける変化。細胞分裂やウイルスの拡散。1, 2, 4, 8... 爆発的な成長、あるいは急速な消滅。",
        },
        theory: {
            title: "理論：予測アルゴリズム",
            arith_term: "等差数列の一般項",
            arith_eq: "a_n = a + (n-1)d",
            arith_desc: "n番目の数を知るには、初項 a に、公差 d を (n-1)回 足します。",
            geo_term: "等比数列の一般項",
            geo_eq: "a_n = a * r^(n-1)",
            geo_desc: "n番目の数を知るには、初項 a に、公比 r を (n-1)回 掛けます。"
        },
        viz: {
            title: "プロトコル：クロノス・パターン",
            log_start: "タイムライン予測機、起動...",
            log_guide: "「完全な静止」を実現せよ。線形速度(d)を0、発散係数(r)を1.0に固定し、時間を凍結しろ。",
            controls: {
                anchor: "起点 (Anchor a)",
                linear: "線形速度 (Velocity d)",
                divergence: "発散係数 (Factor r)",
                depth: "シミュレーション深度 (n)",
                telemetry: "テレメトリ",
                status_critical: "危険：指数関数的暴走",
                status_decay: "警告：シグナル減衰",
                status_stable: "安定：線形推移",
                status_stasis: "完了：完全静止 (STASIS)"
            },
            viewport: "TIMELINE_RENDER"
        },
        apps: {
            title: "応用：未来予測",
            finance_title: "複利計算",
            finance_body: "お金は等比数列で増えます。わずかな金利も、時間(n)さえあれば巨万の富を生み出します。",
            bio_title: "人口爆発",
            bio_body: "生物は掛け算で増えます。1匹が2匹、4匹... 「公比 r」を理解することが、パンデミック予測の鍵です。",
            algo_title: "アルゴリズム",
            algo_body: "バイナリサーチは、探索範囲を毎回半分にします（r=0.5）。これは複雑性の「幾何学的減衰」を利用した高速化手法です。"
        },
        completion: {
            synced: "時間軸安定化",
            msg: "時のパターンを解読しました。未来は計算可能です。"
        }
    }
};

export default function SequencesPage() {
  const { moduleProgress, completeLevel } = useProgress();
  const { locale, setLocale, t: globalT } = useLanguage();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showUnlock, setShowUnlock] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  // Chronos State
  const [n, setN] = useState(20); 
  const [a, setA] = useState(1);  
  const [d, setD] = useState(1);  
  const [r, setR] = useState(1.1);
  
  const [status, setStatus] = useState("STABLE");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper for local content
  const t = (key: string) => {
      const keys = key.split('.');
      if (keys[0] === 'modules' && keys[1] === 'sequences') {
          let obj = LOCAL_CONTENT[locale as 'en' | 'ja'];
          for (let i = 2; i < keys.length; i++) {
              if (obj) obj = obj[keys[i]];
          }
          if (obj) return obj;
      }
      return globalT(key);
  };

  useEffect(() => {
    const progress = moduleProgress[MODULE_ID]?.completedLevels || [];
    let nextLvl = 1;
    if (progress.includes(1)) nextLvl = 2;
    if (progress.includes(2)) nextLvl = 3;
    if (progress.includes(3)) nextLvl = 4;
    setCurrentLevel(nextLvl);
    
    if (nextLvl === 3) {
        setLog([`[SYSTEM] ${t('modules.sequences.viz.log_start')}`, `[OP] ${t('modules.sequences.viz.log_guide')}`]);
    }
  }, [moduleProgress, locale]);

  const addLog = (msg: string) => {
      setLog(prev => [msg, ...prev].slice(0, 8));
  };

  const handleLevelComplete = (lvl: number) => {
      completeLevel(MODULE_ID, lvl);
      setShowUnlock(true);
  };

  const handleNextLevel = () => {
    setShowUnlock(false);
  };

  // Logic & Drawing
  useEffect(() => {
    // Status Logic
    let newStatus = "status_stable";
    if (r > 1.2) newStatus = "status_critical";
    else if (r < 0.8) newStatus = "status_decay";
    else if (Math.abs(d) < 0.1 && Math.abs(r - 1.0) < 0.05) newStatus = "status_stasis";
    
    setStatus(newStatus);

    if (currentLevel === 3 && newStatus === "status_stasis") {
        // Win condition for Viz level
        // Need to hold it? Or just instant? Let's give it a moment or just instant for now.
        if (!showUnlock) { // simple check to avoid loop
            handleLevelComplete(3);
             addLog(`[SUCCESS] CHRONOS LOCK ESTABLISHED.`);
        }
    }

    // Canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    const padding = 60;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const arithmeticData: number[] = [];
    const geometricData: number[] = [];
    
    for (let i = 0; i < n; i++) {
        arithmeticData.push(a + i * d);
        geometricData.push(a * Math.pow(r, i));
    }

    const maxVal = Math.max(...arithmeticData, ...geometricData, 10);
    const minVal = Math.min(...arithmeticData, ...geometricData, 0);
    const range = maxVal - minVal || 1;

    const mapX = (i: number) => padding + (i / (n - 1)) * graphWidth;
    const mapY = (val: number) => (height - padding) - ((val - minVal) / range) * graphHeight;

    const drawTrace = (data: number[], color: string, label: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        data.forEach((val, i) => {
            if (i === 0) ctx.moveTo(mapX(i), mapY(val));
            else ctx.lineTo(mapX(i), mapY(val));
        });
        ctx.stroke();
        
        ctx.fillStyle = color;
        data.forEach((val, i) => {
            ctx.beginPath(); ctx.arc(mapX(i), mapY(val), 4, 0, Math.PI * 2); ctx.fill();
        });
    };

    drawTrace(arithmeticData, '#00f2ff', 'LINEAR');
    drawTrace(geometricData, '#ff0055', 'EXPONENTIAL');

  }, [n, a, d, r, currentLevel, showUnlock]);

  return (
    <div className={`min-h-screen bg-black text-white font-mono selection:bg-cyan-900 ${GeistMono.className}`}>
       
       <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-14 flex items-center px-6 bg-black/80 backdrop-blur-md justify-between">
         <div className="flex items-center gap-4 text-xs tracking-widest">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
               {globalT('common.back_root')}
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-cyan-500 font-bold">{globalT('common.protocol')}: {t('modules.sequences.title')}</span>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')} className="text-xs text-white/40 hover:text-white transition-colors uppercase">
                 [{locale.toUpperCase()}]
             </button>
            <div className="text-xs text-white/40">
                {t('modules.sequences.viz.viewport')} 0{currentLevel} // {t(`modules.sequences.levels.${currentLevel}.name`)}
            </div>
         </div>
      </header>

      <main className="pt-20 px-6 max-w-7xl mx-auto space-y-16 pb-20">
        
        {/* --- LEVEL 1: BASICS --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.sequences.concepts.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-white/70 leading-relaxed">
                <div>
                    <h3 className="text-white font-bold mb-2">{t('modules.sequences.concepts.arith_title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('modules.sequences.concepts.arith_body') }} />
                </div>
                <div>
                    <h3 className="text-white font-bold mb-2">{t('modules.sequences.concepts.geo_title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('modules.sequences.concepts.geo_body') }} />
                </div>
            </div>
            {currentLevel === 1 && (
                 <button onClick={() => handleLevelComplete(1)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {globalT('common.level')} 01
                 </button>
            )}
        </section>

        {/* --- LEVEL 2: THEORY --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.sequences.theory.title')}
            </h2>
            <div className="bg-white/5 border border-white/10 p-6 rounded-sm font-mono text-xs grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                     <div className="mb-4"><span className="text-white/40">{t('modules.sequences.theory.arith_term')}</span></div>
                     <div className="text-xl tracking-widest text-cyan-400 mb-2">{t('modules.sequences.theory.arith_eq')}</div>
                     <p className="text-white/50">{t('modules.sequences.theory.arith_desc')}</p>
                </div>
                <div>
                     <div className="mb-4"><span className="text-white/40">{t('modules.sequences.theory.geo_term')}</span></div>
                     <div className="text-xl tracking-widest text-pink-400 mb-2">{t('modules.sequences.theory.geo_eq')}</div>
                     <p className="text-white/50">{t('modules.sequences.theory.geo_desc')}</p>
                </div>
            </div>
             {currentLevel === 2 && (
                 <button onClick={() => handleLevelComplete(2)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {globalT('common.level')} 02
                 </button>
            )}
        </section>

        {/* --- LEVEL 3: CHRONOS VIZ --- */}
        <section className="space-y-6">
             <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.sequences.viz.title')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                {/* Left Panel (Controls) */}
                <div className="space-y-6 flex flex-col h-full">
                    
                    {/* Controls */}
                    <div className="bg-white/5 p-4 border border-white/10 space-y-4">
                        <div>
                            <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                <span>{t('modules.sequences.viz.controls.anchor')}</span>
                                <span>{a}</span>
                            </div>
                            <input type="number" value={a} onChange={e => { setA(parseFloat(e.target.value)); addLog(`[OP] ANCHOR SET: ${e.target.value}`); }} className="w-full bg-black border border-white/20 text-white p-1 text-xs text-center focus:border-cyan-500 outline-none" />
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                <span>{t('modules.sequences.viz.controls.linear')}</span>
                                <span className="text-cyan-400">+{d}</span>
                            </div>
                            <input type="range" min="-5" max="5" step="0.5" value={d} onChange={e => { setD(parseFloat(e.target.value)); }} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                        </div>
                         <div>
                            <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                <span>{t('modules.sequences.viz.controls.divergence')}</span>
                                <span className="text-pink-400">x{r}</span>
                            </div>
                            <input type="range" min="0.1" max="2.0" step="0.1" value={r} onChange={e => { setR(parseFloat(e.target.value)); }} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500" />
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                <span>{t('modules.sequences.viz.controls.depth')}</span>
                                <span>{n}</span>
                            </div>
                            <input type="range" min="5" max="50" step="1" value={n} onChange={e => setN(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
                        </div>
                    </div>

                    {/* Stats & Log */}
                    <div className="flex-1 bg-black border border-white/10 p-4 font-mono text-xs flex flex-col">
                         <div className="border-b border-white/10 pb-2 mb-2 text-white/30">{t('modules.sequences.viz.controls.telemetry')}</div>
                         
                         <div className="space-y-2 mb-4">
                             <div className="flex justify-between items-center">
                                 <span className="text-white/60">STATUS</span>
                                 <span className={`
                                     ${status.includes('critical') ? 'text-red-500 animate-pulse' : ''}
                                     ${status.includes('decay') ? 'text-yellow-500' : ''}
                                     ${status.includes('stable') ? 'text-cyan-500' : ''}
                                     ${status.includes('stasis') ? 'text-green-500 font-bold' : ''}
                                 `}>
                                     {t(`modules.sequences.viz.controls.${status}`)}
                                 </span>
                             </div>
                         </div>

                         {/* System Log */}
                         <div className="flex-1 border-t border-white/10 pt-2 overflow-hidden flex flex-col">
                             <div className="text-[9px] text-white/30 mb-1">SYSTEM_LOG</div>
                             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                {log.map((entry, i) => (
                                    <div key={i} className="text-[10px] text-white/60 truncate">
                                        <span className="text-cyan-900 mr-1">{`>`}</span>
                                        {entry}
                                    </div>
                                ))}
                             </div>
                         </div>
                    </div>
                </div>

                {/* Right Panel (Canvas) */}
                <div className="lg:col-span-2 border border-white/10 bg-black relative h-full overflow-hidden group">
                    <div className="absolute top-2 left-2 text-[10px] text-white/20 z-10 group-hover:text-white/40 transition-colors">
                        {t('modules.sequences.viz.viewport')}
                    </div>
                    
                    <canvas 
                        ref={canvasRef}
                        width={800}
                        height={600}
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
        </section>

        {/* --- LEVEL 4: APPLICATION --- */}
        <section className="space-y-6 border-t border-white/10 pt-16">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.sequences.apps.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/60">
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.sequences.apps.finance_title')}</h3>
                    <p>{t('modules.sequences.apps.finance_body')}</p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.sequences.apps.bio_title')}</h3>
                    <p>{t('modules.sequences.apps.bio_body')}</p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.sequences.apps.algo_title')}</h3>
                    <p>{t('modules.sequences.apps.algo_body')}</p>
                </div>
            </div>
             {currentLevel === 4 && (
                 <button onClick={() => handleLevelComplete(4)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {globalT('common.level')} 04
                 </button>
            )}
        </section>

      </main>

      {/* Completion Modal */}
      <AnimatePresence>
        {showUnlock && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            >
                <div className="bg-black border border-cyan-500/30 p-8 max-w-md w-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tighter">{t('modules.sequences.completion.synced')}</h2>
                    <div className="text-cyan-500 text-sm mb-6">{globalT('common.level')} 0{currentLevel} COMPLETE</div>
                    <p className="text-white/60 text-xs mb-8 leading-relaxed">
                        {t('modules.sequences.completion.msg')}<br/>
                        {globalT('common.xp_awarded')}: <span className="text-white">+100</span>
                    </p>
                    <button 
                        onClick={handleNextLevel}
                        className="w-full bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 py-3 text-xs hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest"
                    >
                        {currentLevel < 4 ? globalT('common.next') : globalT('common.root')}
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
