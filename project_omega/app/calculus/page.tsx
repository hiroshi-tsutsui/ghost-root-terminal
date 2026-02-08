// @ts-nocheck
"use client";

// --- Project Omega: Calculus Module (Flux Engine) ---
// Structure:
// Level 1: Basics (Differential Intuition)
// Level 2: Theory (Derivative Definition)
// Level 3: Visualization (Integral/Area & Volume)
// Level 4: Applications (Physics/ML/Economics)
// Refactored by Tony (Architect) - V2.3 (Verified & Localized 2026-02-08 - Final Check)
// Status: READY FOR DEPLOYMENT

import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import Link from 'next/link';
import { GeistMono } from 'geist/font/mono';
import { useProgress } from '../contexts/ProgressContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

// --- Types ---
type ProtocolState = 'IDLE' | 'ACTIVE' | 'LOCKED' | 'FAILED';

// --- Constants ---
const MODULE_ID = 'calculus';

// --- 3D Components ---
function RevolutionSurface({ funcStr, xVal, state }: { funcStr: string, xVal: number, state: ProtocolState }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [points, setPoints] = useState<THREE.Vector2[]>([]);

  useEffect(() => {
    try {
        const pts = [];
        const steps = 60;
        const limit = Math.max(0.1, Math.abs(xVal));
        
        // Generate points for lathe geometry
        for (let i = 0; i <= steps; i++) {
            const u = (i / steps) * limit;
            let y = 0;
            try {
                y = math.evaluate(funcStr, { x: u });
                if (!isFinite(y)) y = 0;
            } catch { y = 0; }
            pts.push(new THREE.Vector2(Math.abs(y), u)); 
        }
        setPoints(pts);
    } catch (e) {
        console.error(e);
    }
  }, [funcStr, xVal]);

  if (points.length < 2) return null;

  return (
    <group rotation={[0, 0, -Math.PI / 2]}>
        <mesh ref={meshRef}>
            <latheGeometry args={[points, 32]} />
            <meshStandardMaterial 
                color={state === 'LOCKED' ? "#00ff9d" : "#0071e3"}
                side={THREE.DoubleSide} 
                transparent 
                opacity={0.6} 
                roughness={0.2} 
                metalness={0.5} 
                emissive={state === 'LOCKED' ? "#00442a" : "#001e3d"}
            />
        </mesh>
         <mesh>
            <latheGeometry args={[points, 16]} />
            <meshBasicMaterial color={state === 'LOCKED' ? "#00ff9d" : "#00ffff"} wireframe={true} transparent opacity={0.1} />
        </mesh>
    </group>
  );
}

export default function CalculusPage() {
  const { moduleProgress, completeLevel } = useProgress();
  const { t, locale, setLocale } = useLanguage();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showUnlock, setShowUnlock] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [protocolState, setProtocolState] = useState<ProtocolState>('IDLE');
  
  // --- Flux Engine State ---
  const [xVal, setXVal] = useState(1);
  const [funcStr, setFuncStr] = useState("0.5*x^2");
  const [error, setError] = useState<string | null>(null);
  const [is3DMode, setIs3DMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Level Configuration
  const LEVELS = [
    { id: 1, type: 'slope', val: 1.0, op: '>' },
    { id: 2, type: 'slope', val: 0.1, op: '<abs' }, // |slope| < 0.1
    { id: 3, type: 'area', val: 5.0, op: '>' },
    { id: 4, type: 'manual', val: 0, op: 'none' }
  ];

  // Initialize Level
  useEffect(() => {
    const progress = moduleProgress[MODULE_ID]?.completedLevels || [];
    let nextLvl = 1;
    if (progress.includes(1)) nextLvl = 2;
    if (progress.includes(2)) nextLvl = 3;
    if (progress.includes(3)) nextLvl = 4;
    setCurrentLevel(nextLvl);
    initLevel(nextLvl);
  }, [moduleProgress]);

  const initLevel = (lvl: number) => {
    setProtocolState('IDLE');
    // Reset state slightly per level if needed
    if (lvl === 1) {
        setFuncStr("0.5*x^2");
        setXVal(0);
    } else if (lvl === 2) {
        setFuncStr("sin(x)");
        setXVal(-2);
    } else if (lvl === 3) {
        setFuncStr("0.5*x^2 + 1");
        setXVal(1);
    }
    
    setTimeout(() => {
        setLog([
            `[SYSTEM] LEVEL 0${lvl}: ${t(`modules.calculus.levels.${lvl}.name`)}`,
            `[OP] ${t(`modules.calculus.levels.${lvl}.log_guide`)}`
        ]);
    }, 100);
  };

  const addLog = (msg: string) => {
      setLog(prev => [msg, ...prev].slice(0, 8));
  };

  const handleWin = () => {
      if (protocolState === 'LOCKED') return; 
      setProtocolState('LOCKED');
      addLog(`[SUCCESS] LEVEL 0${currentLevel} ${t('modules.calculus.completion.synced')}`);
      setTimeout(() => {
          completeLevel(MODULE_ID, currentLevel);
          setShowUnlock(true);
      }, 1000);
  };

  const handleNextLevel = () => {
    setShowUnlock(false);
    // Level update happens via moduleProgress effect
  };

  // --- Math Helpers ---
  const evaluateFunc = (expression: string, x: number) => {
    try { return math.evaluate(expression, { x }); } catch (e) { return NaN; }
  };

  const evaluateDerivative = (expression: string, x: number) => {
    try {
        const d = math.derivative(expression, 'x');
        return d.evaluate({ x });
    } catch (e) {
        const h = 0.001;
        return (evaluateFunc(expression, x + h) - evaluateFunc(expression, x - h)) / (2 * h);
    }
  };

  const integrate = (expression: string, end: number) => {
      const start = 0;
      const n = 100;
      const h = (end - start) / n;
      let sum = 0.5 * (evaluateFunc(expression, start) + evaluateFunc(expression, end));
      for (let i = 1; i < n; i++) {
          sum += evaluateFunc(expression, start + i * h);
      }
      return sum * h;
  };

  // --- 2D Drawing Effect ---
  useEffect(() => {
    if (is3DMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scale = 40; 
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Validate Input
    try {
        math.evaluate(funcStr, { x: 0 });
        setError(null);
    } catch (e) {
        setError("SYNTAX ERROR");
        return;
    }

    // Grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += scale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += scale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); 
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
    ctx.stroke();

    // Integral Area (Visual for Level 3)
    if (currentLevel >= 3) {
        ctx.fillStyle = protocolState === 'LOCKED' ? 'rgba(0, 255, 157, 0.2)' : 'rgba(0, 113, 227, 0.2)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        const step = 0.05;
        const start = 0;
        const end = Math.max(0, xVal);
        for (let x = start; x <= end; x += step) {
            const y = evaluateFunc(funcStr, x);
            ctx.lineTo(centerX + x * scale, centerY - y * scale);
        }
        const finalY = evaluateFunc(funcStr, end);
        ctx.lineTo(centerX + end * scale, centerY - finalY * scale);
        ctx.lineTo(centerX + end * scale, centerY);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
    }

    // Function Curve
    ctx.strokeStyle = protocolState === 'LOCKED' ? '#00ff9d' : '#0071e3';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath();
    let first = true;
    for (let pixelX = 0; pixelX < width; pixelX++) {
      const x = (pixelX - centerX) / scale;
      const y = evaluateFunc(funcStr, x);
      if (isNaN(y) || !isFinite(y)) { first = true; continue; }
      
      const pixelY = centerY - (y * scale);
      if (pixelY < -height || pixelY > height * 2) { first = true; continue; }
      
      if (first) { ctx.moveTo(pixelX, pixelY); first = false; }
      else { ctx.lineTo(pixelX, pixelY); }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tangent Line (Level 1 & 2 Focus)
    if (currentLevel <= 2) {
        const yVal = evaluateFunc(funcStr, xVal);
        const slope = evaluateDerivative(funcStr, xVal);
        const tangentLength = 4;
        const xStart = xVal - tangentLength;
        const xEnd = xVal + tangentLength;
        const yStart = slope * (xStart - xVal) + yVal;
        const yEnd = slope * (xEnd - xVal) + yVal;

        ctx.strokeStyle = '#ff3b30'; // Red for tangent
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX + xStart * scale, centerY - yStart * scale);
        ctx.lineTo(centerX + xEnd * scale, centerY - yEnd * scale);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Current Point
    const yVal = evaluateFunc(funcStr, xVal);
    const pX = centerX + xVal * scale;
    const pY = centerY - yVal * scale;
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath(); ctx.arc(pX, pY, 5, 0, Math.PI * 2); ctx.fill();

  }, [xVal, funcStr, is3DMode, currentLevel, protocolState]);

  // --- Real-time Logic Checks ---
  const currentY = evaluateFunc(funcStr, xVal);
  const currentSlope = evaluateDerivative(funcStr, xVal);
  const currentIntegral = integrate(funcStr, xVal);

  useEffect(() => {
      if (protocolState === 'LOCKED') return;
      
      const levelConfig = LEVELS.find(l => l.id === currentLevel);
      if (!levelConfig || levelConfig.type === 'manual') return;

      let passed = false;
      if (levelConfig.type === 'slope') {
          if (levelConfig.op === '>' && currentSlope > levelConfig.val) passed = true;
          if (levelConfig.op === '<abs' && Math.abs(currentSlope) < levelConfig.val) passed = true;
      } else if (levelConfig.type === 'area') {
          if (levelConfig.op === '>' && currentIntegral > levelConfig.val) passed = true;
      }

      if (passed) handleWin();

  }, [currentSlope, currentIntegral, currentLevel, protocolState]);


  const presets = [
    { label: "PARABOLA", val: "0.5*x^2" },
    { label: "CUBIC", val: "0.1*x^3 - x" },
    { label: "SINE", val: "2*sin(x)" },
    { label: "EXP", val: "0.5*exp(x)" }
  ];

  return (
    <div className={`min-h-screen bg-black text-white font-mono selection:bg-cyan-900 ${GeistMono.className}`}>
       
       {/* --- HEADER --- */}
       <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-14 flex items-center px-6 bg-black/80 backdrop-blur-md justify-between">
         <div className="flex items-center gap-4 text-xs tracking-widest">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
               {t('common.back_root')}
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-cyan-500 font-bold">{t('common.protocol')}: {t('modules.calculus.title')}</span>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')} className="text-xs text-white/40 hover:text-white transition-colors uppercase">
                 [{locale.toUpperCase()}]
             </button>
            <div className="text-xs text-white/40">
                {t('common.level')} 0{currentLevel} // {t(`modules.calculus.levels.${currentLevel}.name`)}
            </div>
         </div>
      </header>

      <main className="pt-20 px-6 max-w-7xl mx-auto space-y-16 pb-20">
        
        {/* --- LEVEL 1: BASICS --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.calculus.concepts.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-white/70 leading-relaxed">
                <div>
                    <h3 className="text-white font-bold mb-2">{t('modules.calculus.concepts.diff_title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('modules.calculus.concepts.diff_body') }} />
                </div>
                <div>
                    <h3 className="text-white font-bold mb-2">{t('modules.calculus.concepts.int_title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('modules.calculus.concepts.int_body') }} />
                </div>
            </div>
        </section>

        {/* --- LEVEL 2: THEORY --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.calculus.theory.title')}
            </h2>
            <div className="bg-white/5 border border-white/10 p-6 rounded-sm font-mono text-xs">
                 <div className="mb-4">
                    <span className="text-white/40">{t('modules.calculus.theory.def_title')}</span> <span className="text-white">{t('modules.calculus.theory.def_term')}</span>
                 </div>
                 <div className="flex flex-col md:flex-row gap-8 items-center justify-center py-8">
                     <div className="text-xl md:text-2xl tracking-widest text-cyan-400">
                        f'(x) = lim(h→0) [f(x+h) - f(x)] / h
                     </div>
                     <div className="text-white/50 text-sm space-y-1 border-l border-white/10 pl-4">
                        <div className="text-green-400 font-bold">∫[a,b] f(x) dx</div>
                        <div>AREA ACCUMULATION</div>
                     </div>
                 </div>
                 <p className="text-white/60 text-center max-w-2xl mx-auto mt-4" dangerouslySetInnerHTML={{ __html: t('modules.calculus.theory.derivative_desc') }} />
            </div>
        </section>

        {/* --- LEVEL 3: VISUALIZATION (FLUX ENGINE) --- */}
        <section className="space-y-6">
             <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.calculus.viz.title')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                {/* Left Panel (Controls & Stats) */}
                <div className="space-y-6 flex flex-col h-full">
                    
                    {/* Controls */}
                    <div className="border border-white/10 bg-white/5 p-6 rounded-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-2 text-[10px] text-white/20">
                            ID: {MODULE_ID.toUpperCase()}_L0{currentLevel}
                        </div>
                        
                        {/* Function Input */}
                        <div className="mb-4">
                            <label className="text-[10px] text-white/40 block mb-1 tracking-widest">{t('modules.calculus.viz.controls.function_label')}</label>
                            <input 
                                type="text" 
                                value={funcStr} 
                                onChange={(e) => { setFuncStr(e.target.value); addLog(`[OP] FUNCTION SET: ${e.target.value}`); }}
                                className="w-full bg-black border border-white/20 text-white p-2 text-sm font-mono focus:border-cyan-500 outline-none transition-colors"
                            />
                            {error && <div className="text-red-500 text-[9px] mt-1 animate-pulse">{error}</div>}
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {presets.map(p => (
                                    <button key={p.label} onClick={() => { setFuncStr(p.val); addLog(`[OP] PRESET: ${p.label}`); }} className="text-[9px] border border-white/10 px-2 py-1 text-white/60 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-900/20 transition-all">
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Slider */}
                        <div className="mb-4">
                            <div className="flex justify-between text-[10px] text-white/40 mb-1 tracking-widest">
                                <span>{t('modules.calculus.viz.controls.time_label')}</span>
                                <span className="text-cyan-400 font-bold">{xVal.toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" min="-4" max="4" step="0.01" 
                                value={xVal} onChange={(e) => { setXVal(parseFloat(e.target.value)); }}
                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                            />
                        </div>

                        {/* Stats */}
                        <div className="space-y-2 text-xs font-mono border-t border-white/10 pt-4">
                             <div className="flex justify-between border-b border-white/5 pb-1">
                                 <span className="text-white/40">{t('modules.calculus.viz.controls.value')}</span>
                                 <span className="text-white">{isNaN(currentY) ? '-' : currentY.toFixed(4)}</span>
                             </div>
                             <div className="flex justify-between border-b border-white/5 pb-1">
                                 <span className="text-white/40">{t('modules.calculus.viz.controls.slope')}</span>
                                 <span className={Math.abs(currentSlope) > 0.5 && currentLevel === 1 ? 'text-green-400' : 'text-cyan-400'}>
                                    {isNaN(currentSlope) ? '-' : currentSlope.toFixed(4)}
                                 </span>
                             </div>
                             <div className="flex justify-between pt-1">
                                 <span className="text-white/40">{t('modules.calculus.viz.controls.area')}</span>
                                 <span className={currentIntegral > 5.0 && currentLevel === 3 ? 'text-green-400' : 'text-cyan-400'}>
                                     {isNaN(currentIntegral) ? '-' : currentIntegral.toFixed(4)}
                                 </span>
                             </div>
                        </div>
                    </div>

                    {/* Log */}
                    <div className="border border-white/10 bg-black p-4 h-48 overflow-hidden flex flex-col font-mono text-xs relative flex-1">
                        <div className="text-white/30 mb-2 pb-2 border-b border-white/10 flex justify-between">
                            <span>{t('common.system_log')}</span>
                            <span className="animate-pulse text-cyan-500">{t('common.live')}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                            {log.map((entry, i) => (
                                <div key={i} className="text-white/70">
                                    <span className="text-cyan-900 mr-2">{`>`}</span>
                                    {entry}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="text-xs text-white/40 leading-relaxed border-l-2 border-cyan-900/50 pl-3">
                        <strong className="text-cyan-500 block mb-1">MISSION: {t(`modules.calculus.levels.${currentLevel}.name`)}</strong>
                        {t(`modules.calculus.levels.${currentLevel}.desc`)}
                    </div>
                    
                     <button 
                        onClick={() => { setIs3DMode(!is3DMode); addLog(`[OP] 3D MODE: ${!is3DMode}`); }}
                        className={`w-full py-2 text-center border transition-all text-[10px] tracking-widest uppercase ${is3DMode ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400' : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'}`}
                    >
                        {is3DMode ? t('modules.calculus.viz.controls.disable_3d') : t('modules.calculus.viz.controls.enable_3d')}
                    </button>

                </div>

                {/* Right Panel (Canvas) */}
                <div className="lg:col-span-2 border border-white/10 bg-black relative group h-full">
                    <div className="absolute top-2 left-2 text-[10px] text-white/20 group-hover:text-white/40 transition-colors z-10 pointer-events-none">
                        {t('modules.calculus.viz.viewport_label')}
                    </div>
                    {is3DMode ? (
                        <div className="w-full h-full cursor-move">
                            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                                <ambientLight intensity={0.5} />
                                <directionalLight position={[10, 10, 5]} intensity={1} />
                                <Grid infiniteGrid fadeDistance={50} sectionColor="#0071e3" cellColor="#333" />
                                <RevolutionSurface funcStr={funcStr} xVal={xVal} state={protocolState} />
                                <OrbitControls makeDefault />
                            </Canvas>
                        </div>
                    ) : (
                        <canvas 
                            ref={canvasRef}
                            width={800}
                            height={600}
                            className="w-full h-full cursor-crosshair object-contain"
                        />
                    )}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-20"></div>
                </div>
            </div>
        </section>

        {/* --- LEVEL 4: APPLICATION --- */}
        <section className="space-y-6 border-t border-white/10 pt-16">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.calculus.apps.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/60">
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.calculus.apps.physics_title')}</h3>
                    <p>{t('modules.calculus.apps.physics_body')}</p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.calculus.apps.ml_title')}</h3>
                    <p>{t('modules.calculus.apps.ml_body')}</p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.calculus.apps.econ_title')}</h3>
                    <p>{t('modules.calculus.apps.econ_body')}</p>
                </div>
            </div>
             {currentLevel === 4 && (
                 <button 
                    onClick={() => handleWin()} 
                    className="mt-4 border border-cyan-500/30 text-cyan-400 px-6 py-3 text-xs hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest bg-cyan-900/10"
                 >
                    {t('modules.calculus.actions.sync')}
                 </button>
            )}
        </section>

      </main>

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
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tighter">{t('modules.calculus.completion.synced')}</h2>
                    <div className="text-cyan-500 text-sm mb-6">{t('common.level')} 0{currentLevel} COMPLETE</div>
                    <p className="text-white/60 text-xs mb-8 leading-relaxed">
                        {t('modules.calculus.completion.msg')}<br/>
                        {t('common.xp_awarded')}: <span className="text-white">+100</span>
                    </p>
                    <div className="flex gap-4">
                        <button 
                            onClick={handleNextLevel}
                            className="flex-1 bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 py-3 text-xs hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest"
                        >
                            {currentLevel < 4 ? t('common.next') : t('common.root')}
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
