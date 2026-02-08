// @ts-nocheck
"use client";

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

// --- Constants ---
const MODULE_ID = 'calculus';

// --- Localization Content (Self-Contained) ---
const LOCAL_CONTENT = {
    en: {
        title: "FLUX ENGINE",
        levels: {
            1: { name: "BASICS", desc: "Intuition: Speed vs Distance." },
            2: { name: "THEORY", desc: "Limits & Accumulation." },
            3: { name: "VISUALIZATION", desc: "The Flux Visualization." },
            4: { name: "APPLY", desc: "Real-world Dynamics." }
        },
        concepts: {
            title: "Concept: The Study of Change",
            diff_title: "Differentiation (The Slope)",
            diff_body: "Measures <strong>instantaneous change</strong>. If you drive a car, the speedometer shows your derivative (velocity) at that exact moment.",
            int_title: "Integration (The Area)",
            int_body: "Measures <strong>accumulation</strong>. The odometer shows your integral (total distance) accumulated over time."
        },
        theory: {
            title: "Theory: Infinite Precision",
            def_title: "DEFINITION",
            derivative_term: "The Derivative",
            derivative_desc: "We shrink the time step 'h' to zero. The secant line becomes a tangent line.",
            integral_term: "The Integral",
            integral_desc: "We sum up infinite tiny rectangles under the curve to find the total area."
        },
        viz: {
            title: "Protocol: Flux Engine",
            integrity: "ENGINE INTEGRITY",
            target: "TARGET FLUX",
            log_start: "FLUX ENGINE INITIALIZED...",
            log_guide: "ADJUST PARAMETER (t) TO EXCEED TARGET ACCUMULATION.",
            controls: {
                function_label: "INPUT FUNCTION f(x)",
                time_label: "TIME PARAMETER (t)",
                telemetry: "TELEMETRY",
                value: "POSITION f(t)",
                slope: "VELOCITY f'(t)",
                area: "ACCUMULATION ∫f(x)dx",
                enable_3d: "ENABLE 3D MANIFOLD",
                disable_3d: "RETURN TO 2D PLANE",
                rotation_active: "ORBITAL CONTROLS ACTIVE"
            },
            viewport_label: "VIEWPORT_RENDER"
        },
        apps: {
            title: "Applications: System Dynamics",
            physics_title: "Physics Engine",
            physics_body: "Simulating motion, forces, and collisions in video games and engineering.",
            ml_title: "Machine Learning",
            ml_body: "Gradient Descent uses derivatives to minimize the 'loss' (error) of AI models.",
            econ_title: "Economics",
            econ_body: "Marginal cost/revenue analysis to optimize profit in changing markets."
        },
        completion: {
            synced: "MODULE SYNCED",
            msg: "You have mastered the language of change. The Flux Engine is now online."
        }
    },
    ja: {
        title: "フラックス・エンジン (微積分)",
        levels: {
            1: { name: "基礎 (Basics)", desc: "直感：変化のスピードと蓄積。" },
            2: { name: "理論 (Logic)", desc: "極限と無限の和。" },
            3: { name: "可視化 (Viz)", desc: "フラックス・エンジンの起動。" },
            4: { name: "応用 (Applications)", desc: "世界を記述する言語。" }
        },
        concepts: {
            title: "概念：変化の学問",
            diff_title: "微分（瞬間の勢い）",
            diff_body: "<strong>瞬間の変化率</strong>を捉えます。過去や未来ではなく、「今この瞬間」の勢い（Velocity）を数値化します。",
            int_title: "積分（積み重なる成果）",
            int_body: "<strong>蓄積量</strong>を測定します。瞬間の変化が積み重なって、最終的にどれだけの量（Distance/Total）になるかを計算します。"
        },
        theory: {
            title: "理論：無限の精度",
            def_title: "定義",
            derivative_term: "導関数 (Derivative)",
            derivative_desc: "時間ステップ「h」を限りなくゼロ（極限）に近づけることで、平均ではなく「瞬間」の傾きを厳密に定義します。",
            integral_term: "積分 (Integral)",
            integral_desc: "無限に細分化された領域（長方形）の面積を足し合わせることで、曲線下の正確な総量を導き出します。"
        },
        viz: {
            title: "プロトコル：フラックス・エンジン",
            integrity: "FLUX INTEGRITY",
            target: "TARGET FLUX",
            log_start: "フラックス・エンジン初期化中...",
            log_guide: "パラメータ(t)を調整し、目標蓄積量(Area)を超過せよ。",
            controls: {
                function_label: "入力関数 f(x)",
                time_label: "時間パラメータ (t)",
                telemetry: "テレメトリ",
                value: "位置 f(t)",
                slope: "速度 f'(t)",
                area: "蓄積量 ∫f(x)dx",
                enable_3d: "3Dマニホールド起動 (回転体)",
                disable_3d: "2D平面に戻る",
                rotation_active: "軌道制御アクティブ"
            },
            viewport_label: "VIEWPORT_RENDER"
        },
        apps: {
            title: "応用：システムダイナミクス",
            physics_title: "物理エンジン",
            physics_body: "ゲームやシミュレーションにおいて、物体の運動、衝突、流体の動きを計算する基盤技術です。",
            ml_title: "機械学習 (AI)",
            ml_body: "AIの学習（Backpropagation）は、微分の連鎖律（Chain Rule）そのものです。誤差を最小化するために「下るべき坂の方向」を計算します。",
            econ_title: "経済・最適化",
            econ_body: "コストの最小化や利益の最大化。変化する環境の中で「最適なポイント」を見つけるために使われます。"
        },
        completion: {
            synced: "モジュール同期完了",
            msg: "「変化の言語」を習得しました。フラックス・エンジン、正常稼働中。"
        }
    }
};

// --- 3D Components ---
function RevolutionSurface({ funcStr, xVal }: { funcStr: string, xVal: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [points, setPoints] = useState<THREE.Vector2[]>([]);

  useEffect(() => {
    try {
        const pts = [];
        const steps = 50;
        const limit = Math.max(0.1, xVal);
        
        for (let i = 0; i <= steps; i++) {
            const u = (i / steps) * limit;
            let y = 0;
            try {
                y = math.evaluate(funcStr, { x: u });
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
            <meshStandardMaterial color="#0071e3" side={THREE.DoubleSide} transparent opacity={0.6} roughness={0.3} metalness={0.1} />
        </mesh>
    </group>
  );
}

export default function CalculusPage() {
  const { moduleProgress, completeLevel } = useProgress();
  const { locale, setLocale, t: globalT } = useLanguage();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showUnlock, setShowUnlock] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  // Helper for local content
  const t = (key: string) => {
      const keys = key.split('.');
      if (keys[0] === 'modules' && keys[1] === 'calculus') {
          let obj = LOCAL_CONTENT[locale as 'en' | 'ja'];
          for (let i = 2; i < keys.length; i++) {
              if (obj) obj = obj[keys[i]];
          }
          if (obj) return obj;
      }
      return globalT(key);
  };

  // --- Flux Engine State ---
  const [xVal, setXVal] = useState(1);
  const [funcStr, setFuncStr] = useState("0.5*x^3 - 2*x");
  const [error, setError] = useState<string | null>(null);
  const [is3DMode, setIs3DMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [targetAccumulation] = useState(5.0); // Win condition

  // Initialize Level
  useEffect(() => {
    const progress = moduleProgress[MODULE_ID]?.completedLevels || [];
    let nextLvl = 1;
    if (progress.includes(1)) nextLvl = 2;
    if (progress.includes(2)) nextLvl = 3;
    if (progress.includes(3)) nextLvl = 4;
    setCurrentLevel(nextLvl);
    
    // Initialize Log
    if (nextLvl === 3) {
        setLog([`[SYSTEM] ${t('modules.calculus.viz.log_start')}`, `[OP] ${t('modules.calculus.viz.log_guide')}`]);
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
    // Logic handled by effect
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

    ctx.clearRect(0, 0, width, height);

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

    // Integral Area
    ctx.fillStyle = 'rgba(0, 113, 227, 0.15)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const step = 0.05;
    const start = Math.min(0, xVal);
    const end = Math.max(0, xVal);
    for (let x = start; x <= end; x += step) {
        const y = evaluateFunc(funcStr, x);
        ctx.lineTo(centerX + x * scale, centerY - y * scale);
    }
    const finalY = evaluateFunc(funcStr, xVal);
    ctx.lineTo(centerX + xVal * scale, centerY - finalY * scale);
    ctx.lineTo(centerX + xVal * scale, centerY);
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    // Function Curve
    ctx.strokeStyle = '#0071e3';
    ctx.lineWidth = 3;
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

    // Tangent Line
    const yVal = evaluateFunc(funcStr, xVal);
    const slope = evaluateDerivative(funcStr, xVal);
    const tangentLength = 4;
    const xStart = xVal - tangentLength;
    const xEnd = xVal + tangentLength;
    const yStart = slope * (xStart - xVal) + yVal;
    const yEnd = slope * (xEnd - xVal) + yVal;

    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX + xStart * scale, centerY - yStart * scale);
    ctx.lineTo(centerX + xEnd * scale, centerY - yEnd * scale);
    ctx.stroke();
    ctx.setLineDash([]);

    // Point
    const pX = centerX + xVal * scale;
    const pY = centerY - yVal * scale;
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath(); ctx.arc(pX, pY, 5, 0, Math.PI * 2); ctx.fill();

  }, [xVal, funcStr, is3DMode]);

  const currentY = evaluateFunc(funcStr, xVal);
  const currentSlope = evaluateDerivative(funcStr, xVal);
  const currentIntegral = integrate(funcStr, xVal);

  // Check Win Condition
  useEffect(() => {
      if (currentLevel === 3 && Math.abs(currentIntegral) > targetAccumulation) {
          handleLevelComplete(3);
      }
  }, [currentIntegral, currentLevel, targetAccumulation]);

  const presets = [
    { label: "PARABOLA", val: "0.5*x^3 - 2*x" },
    { label: "SINE WAVE", val: "sin(x)" },
    { label: "EXPONENTIAL", val: "exp(x)" },
    { label: "LOGARITHM", val: "log(x)" }
  ];

  return (
    <div className={`min-h-screen bg-black text-white font-mono selection:bg-cyan-900 ${GeistMono.className}`}>
       
       <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-14 flex items-center px-6 bg-black/80 backdrop-blur-md justify-between">
         <div className="flex items-center gap-4 text-xs tracking-widest">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
               {globalT('common.back_root')}
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-cyan-500 font-bold">{globalT('common.protocol')}: {t('modules.calculus.title')}</span>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')} className="text-xs text-white/40 hover:text-white transition-colors uppercase">
                 [{locale.toUpperCase()}]
             </button>
            <div className="text-xs text-white/40">
                {t('modules.calculus.viz.target')} 0{currentLevel} // {t(`modules.calculus.levels.${currentLevel}.name`)}
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
            {currentLevel === 1 && (
                 <button onClick={() => handleLevelComplete(1)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {globalT('common.level')} 01
                 </button>
            )}
        </section>

        {/* --- LEVEL 2: THEORY --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.calculus.theory.title')}
            </h2>
            <div className="bg-white/5 border border-white/10 p-6 rounded-sm font-mono text-xs grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                     <div className="mb-4"><span className="text-white/40">{t('modules.calculus.theory.def_title')}</span> <span className="text-white">{t('modules.calculus.theory.derivative_term')}</span></div>
                     <div className="text-xl tracking-widest text-cyan-400 mb-2">f'(x) = lim(h→0) [f(x+h) - f(x)] / h</div>
                     <p className="text-white/50">{t('modules.calculus.theory.derivative_desc')}</p>
                </div>
                <div>
                     <div className="mb-4"><span className="text-white/40">{t('modules.calculus.theory.def_title')}</span> <span className="text-white">{t('modules.calculus.theory.integral_term')}</span></div>
                     <div className="text-xl tracking-widest text-green-400 mb-2">∫[a,b] f(x) dx = F(b) - F(a)</div>
                     <p className="text-white/50">{t('modules.calculus.theory.integral_desc')}</p>
                </div>
            </div>
             {currentLevel === 2 && (
                 <button onClick={() => handleLevelComplete(2)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {globalT('common.level')} 02
                 </button>
            )}
        </section>

        {/* --- LEVEL 3: FLUX ENGINE --- */}
        <section className="space-y-6">
             <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.calculus.viz.title')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                {/* Left Panel (Controls) */}
                <div className="space-y-6 flex flex-col h-full">
                    
                    {/* Input */}
                    <div className="bg-white/5 p-4 border border-white/10">
                        <label className="text-[10px] text-white/40 block mb-2">{t('modules.calculus.viz.controls.function_label')}</label>
                        <input 
                            type="text" 
                            value={funcStr} 
                            onChange={(e) => { setFuncStr(e.target.value); addLog(`[OP] FUNCTION SET: ${e.target.value}`); }}
                            className="w-full bg-black border border-white/20 text-white p-2 text-sm font-mono focus:border-cyan-500 outline-none"
                        />
                         <div className="flex gap-2 mt-2 flex-wrap">
                            {presets.map(p => (
                                <button key={p.label} onClick={() => { setFuncStr(p.val); addLog(`[OP] PRESET: ${p.label}`); }} className="text-[9px] border border-white/10 px-2 py-1 text-white/60 hover:text-white hover:border-white/40 transition-all">
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slider */}
                     <div className="bg-white/5 p-4 border border-white/10">
                         <div className="flex justify-between text-[10px] text-white/40 mb-2">
                            <span>{t('modules.calculus.viz.controls.time_label')}</span>
                            <span className="text-cyan-400 font-bold">{xVal.toFixed(2)}</span>
                         </div>
                         <input 
                            type="range" min="-4" max="4" step="0.01" 
                            value={xVal} onChange={(e) => { setXVal(parseFloat(e.target.value)); }}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                     </div>

                    {/* Stats & Log */}
                    <div className="flex-1 bg-black border border-white/10 p-4 font-mono text-xs flex flex-col">
                         <div className="border-b border-white/10 pb-2 mb-2 text-white/30">{t('modules.calculus.viz.controls.telemetry')}</div>
                         
                         <div className="space-y-2 mb-4">
                             <div className="flex justify-between">
                                 <span className="text-white/60">{t('modules.calculus.viz.controls.value')}</span>
                                 <span>{isNaN(currentY) ? '-' : currentY.toFixed(4)}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-white/60">{t('modules.calculus.viz.controls.slope')}</span>
                                 <span className="text-red-400">{isNaN(currentSlope) ? '-' : currentSlope.toFixed(4)}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-white/60">{t('modules.calculus.viz.controls.area')}</span>
                                 <div className="text-right">
                                    <span className={`block ${Math.abs(currentIntegral) > targetAccumulation ? 'text-green-400 animate-pulse font-bold' : 'text-cyan-400'}`}>
                                        {isNaN(currentIntegral) ? '-' : currentIntegral.toFixed(4)}
                                    </span>
                                    <span className="text-[9px] text-white/20">TARGET: &gt; {targetAccumulation.toFixed(1)}</span>
                                 </div>
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

                         <div className="pt-4 border-t border-white/10">
                             <button 
                                onClick={() => { setIs3DMode(!is3DMode); addLog(`[OP] 3D MODE: ${!is3DMode}`); }}
                                className={`w-full py-2 text-center border transition-all ${is3DMode ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400' : 'border-white/20 text-white/60 hover:text-white'}`}
                            >
                                {is3DMode ? t('modules.calculus.viz.controls.disable_3d') : t('modules.calculus.viz.controls.enable_3d')}
                            </button>
                         </div>
                    </div>
                </div>

                {/* Right Panel (Canvas) */}
                <div className="lg:col-span-2 border border-white/10 bg-black relative h-full overflow-hidden group">
                    <div className="absolute top-2 left-2 text-[10px] text-white/20 z-10 group-hover:text-white/40 transition-colors">
                        {t('modules.calculus.viz.viewport_label')} {is3DMode ? 'THREE.JS_RENDERER' : 'CANVAS_2D'}
                    </div>
                    
                    {is3DMode ? (
                        <div className="w-full h-full cursor-move">
                            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                                <ambientLight intensity={0.5} />
                                <directionalLight position={[10, 10, 5]} intensity={1} />
                                <Grid infiniteGrid fadeDistance={50} sectionColor="#0071e3" cellColor="#333" />
                                <RevolutionSurface funcStr={funcStr} xVal={xVal} />
                                <OrbitControls makeDefault />
                            </Canvas>
                             <div className="absolute bottom-4 left-4 text-[10px] text-cyan-500 bg-black/80 px-2 py-1 border border-cyan-900">
                                {t('modules.calculus.viz.controls.rotation_active')}
                            </div>
                        </div>
                    ) : (
                        <canvas 
                            ref={canvasRef}
                            width={800}
                            height={600}
                            className="w-full h-full object-contain"
                        />
                    )}
                </div>
            </div>
            {/* Completion is now automatic based on target */}
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
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tighter">{t('modules.calculus.completion.synced')}</h2>
                    <div className="text-cyan-500 text-sm mb-6">{globalT('common.level')} 0{currentLevel} COMPLETE</div>
                    <p className="text-white/60 text-xs mb-8 leading-relaxed">
                        {t('modules.calculus.completion.msg')}<br/>
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
