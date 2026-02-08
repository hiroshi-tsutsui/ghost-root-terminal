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

// --- 3D Components ---
function RevolutionSurface({ funcStr, xVal }: { funcStr: string, xVal: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [points, setPoints] = useState<THREE.Vector2[]>([]);

  useEffect(() => {
    try {
        const pts = [];
        const steps = 50;
        const limit = Math.max(0.1, Math.abs(xVal));
        
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
            <meshStandardMaterial color="#0071e3" side={THREE.DoubleSide} transparent opacity={0.6} roughness={0.3} metalness={0.1} wireframe={false} />
        </mesh>
         <mesh ref={meshRef}>
            <latheGeometry args={[points, 32]} />
            <meshStandardMaterial color="#00ffff" side={THREE.DoubleSide} wireframe={true} opacity={0.3} transparent />
        </mesh>
    </group>
  );
}

export default function CalculusPage() {
  const { moduleProgress, completeLevel } = useProgress();
  const { locale, setLocale } = useLanguage();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showUnlock, setShowUnlock] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  
  // --- Flux Engine State ---
  const [xVal, setXVal] = useState(1);
  const [funcStr, setFuncStr] = useState("0.5*x^2"); // Simpler default
  const [error, setError] = useState<string | null>(null);
  const [is3DMode, setIs3DMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Win Conditions
  const targetSlopeL1 = 1.0;
  const targetSlopeL2 = 0.1; // |slope| < 0.1
  const targetAreaL3 = 5.0;

  // --- Localization Content ---
  const content = {
    en: {
        title: "FLUX ENGINE",
        subtitle: "Calculus Protocol",
        levels: {
            1: { name: "CHANGERATE", desc: "Analyze instantaneous velocity." },
            2: { name: "EQUILIBRIUM", desc: "Locate points of zero change." },
            3: { name: "ACCUMULATION", desc: "Calculate total accumulated value." },
            4: { name: "OPTIMIZATION", desc: "Apply gradients to real-world systems." }
        },
        concepts: {
            title: "CORE CONCEPTS",
            diff_title: "Differentiation (Change)",
            diff_body: "The study of <span class='text-cyan-400'>how things change</span>. If position is a function of time, the derivative is velocity. It captures the 'now'.",
            int_title: "Integration (Accumulation)",
            int_body: "The study of <span class='text-cyan-400'>how much has happened</span>. Adding up infinite slices to find the whole. Area under the curve."
        },
        theory: {
            title: "THEORETICAL FRAMEWORK",
            def_title: "DEFINITION",
            derivative_term: "The Derivative",
            derivative_desc: "The slope of the tangent line at a specific point. It represents the instantaneous rate of change.",
            integral_term: "The Integral",
            integral_desc: "The signed area between the function graph and the x-axis. Represents total accumulation."
        },
        viz: {
            title: "FLUX ENGINE // VISUALIZATION",
            controls: {
                function_label: "INPUT FUNCTION f(x)",
                time_label: "PARAMETER (t)",
                telemetry: "LIVE TELEMETRY",
                value: "VALUE f(t)",
                slope: "SLOPE f'(t)",
                area: "AREA ∫f(x)dx",
                enable_3d: "ENABLE 3D RENDER",
                disable_3d: "DISABLE 3D RENDER",
                rotation_active: "ROTATION LOCK: OFF"
            },
            viewport_label: "VIEWPORT: "
        },
        apps: {
            title: "APPLIED MATHEMATICS",
            physics_title: "Kinematics",
            physics_body: "Predicting motion. From apples falling to orbital mechanics, calculus defines the trajectory.",
            ml_title: "Machine Learning",
            ml_body: "Gradient Descent. AI learns by sliding down the 'slope' of error to find the minimum loss.",
            econ_title: "Economics",
            econ_body: "Marginal Analysis. Determining the cost or profit of producing 'one more unit'."
        },
        actions: {
            sync: "SYNC MODULE"
        },
        completion: {
            synced: "SYNC COMPLETE",
            msg: "Flux Engine parameters optimized. The flow of time is now quantifiable."
        }
    },
    ja: {
        title: "フラックス・エンジン",
        subtitle: "微分・積分プロトコル",
        levels: {
            1: { name: "変化率 (Change)", desc: "瞬間の速度を解析せよ。" },
            2: { name: "均衡点 (Equilibrium)", desc: "変化が「ゼロ」になる特異点を特定せよ。" },
            3: { name: "累積 (Accumulation)", desc: "総量を計算し、領域を展開せよ。" },
            4: { name: "最適化 (Optimization)", desc: "勾配を現実世界に応用せよ。" }
        },
        concepts: {
            title: "基本概念 (CONCEPTS)",
            diff_title: "微分 (瞬間の勢い)",
            diff_body: "世界は静止していない。<span class='text-cyan-400'>「今、この瞬間」</span>にどう変化しているか。それが微分だ。位置の微分は速度となり、速度の微分は加速度となる。",
            int_title: "積分 (積み重ねた結果)",
            int_body: "過去からの<span class='text-cyan-400'>「積み重ね」</span>。無限に薄いスライスを足し合わせることで、移動距離や体積、エネルギー総量を算出する。"
        },
        theory: {
            title: "理論体系 (THEORY)",
            def_title: "定義",
            derivative_term: "導関数 (Derivative)",
            derivative_desc: "ある一点における接線の傾き。極限（limit）を用いて、瞬間の変化率を捉える。",
            integral_term: "積分 (Integral)",
            integral_desc: "グラフとX軸の間に挟まれた「面積」。微小な変化を累積した総量を示す。"
        },
        viz: {
            title: "フラックス・エンジン // 可視化",
            controls: {
                function_label: "関数入力 f(x)",
                time_label: "時間パラメータ (t)",
                telemetry: "ライブ・テレメトリ",
                value: "値 f(t)",
                slope: "傾き f'(t)",
                area: "面積 ∫f(x)dx",
                enable_3d: "3Dモード起動",
                disable_3d: "2Dモードへ戻る",
                rotation_active: "回転ロック: 解除"
            },
            viewport_label: "ビューポート: "
        },
        apps: {
            title: "応用分野 (APPLICATIONS)",
            physics_title: "物理学 (Kinematics)",
            physics_body: "運動の予測。リンゴの落下からロケットの軌道計算まで、全ての動きは微分方程式で記述される。",
            ml_title: "機械学習 (Machine Learning)",
            ml_body: "勾配降下法。AIは誤差の「坂」を下る（微分する）ことで、正解への最短ルートを学習する。",
            econ_title: "経済学 (Economics)",
            econ_body: "限界分析。「あと1つ生産したら利益はどうなるか？」限界費用・限界効用の計算に不可欠。"
        },
        actions: {
            sync: "モジュール同期"
        },
        completion: {
            synced: "同期完了",
            msg: "フラックス・エンジンのパラメータが最適化されました。時間の流れは今、数値化されています。"
        }
    }
  };

  const t_local = (path: string) => {
      const keys = path.split('.');
      let obj = content[locale];
      for (const k of keys) {
          if (obj && obj[k]) obj = obj[k];
          else return path;
      }
      return obj;
  };

  // Initialize Level
  useEffect(() => {
    const progress = moduleProgress[MODULE_ID]?.completedLevels || [];
    let nextLvl = 1;
    if (progress.includes(1)) nextLvl = 2;
    if (progress.includes(2)) nextLvl = 3;
    if (progress.includes(3)) nextLvl = 4;
    setCurrentLevel(nextLvl);
    
    // Initialize Log
    setLog([
        `[SYSTEM] LEVEL 0${nextLvl}: ${t_local(`levels.${nextLvl}.name`)}`,
        `[OP] ${t_local(`levels.${nextLvl}.desc`)}`
    ]);
  }, [moduleProgress, locale]);

  const addLog = (msg: string) => {
      setLog(prev => [msg, ...prev].slice(0, 8));
  };

  const handleLevelComplete = (lvl: number) => {
      if (showUnlock) return; 
      completeLevel(MODULE_ID, lvl);
      setShowUnlock(true);
      addLog(`[SUCCESS] LEVEL 0${lvl} ${t_local('completion.synced')}`);
  };

  const handleNextLevel = () => {
    setShowUnlock(false);
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
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

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
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#0071e3';
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

    // Point
    const pX = centerX + xVal * scale;
    const pY = centerY - yVal * scale;
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath(); ctx.arc(pX, pY, 5, 0, Math.PI * 2); ctx.fill();

  }, [xVal, funcStr, is3DMode]);

  // --- Real-time Logic Checks ---
  const currentY = evaluateFunc(funcStr, xVal);
  const currentSlope = evaluateDerivative(funcStr, xVal);
  const currentIntegral = integrate(funcStr, xVal);

  useEffect(() => {
      if (showUnlock) return;

      if (currentLevel === 1) {
          // Task: Find slope > 1.0
          if (currentSlope > targetSlopeL1) {
              handleLevelComplete(1);
          }
      } else if (currentLevel === 2) {
          // Task: Find slope approx 0 (|slope| < 0.1)
          if (Math.abs(currentSlope) < targetSlopeL2) {
              handleLevelComplete(2);
          }
      } else if (currentLevel === 3) {
          // Task: Accumulate Area > 5.0
          if (currentIntegral > targetAreaL3) {
              handleLevelComplete(3);
          }
      }
  }, [currentSlope, currentIntegral, currentLevel, showUnlock]);


  const presets = [
    { label: "PARABOLA", val: "0.5*x^2" },
    { label: "CUBIC", val: "0.1*x^3 - x" },
    { label: "SINE", val: "2*sin(x)" },
    { label: "EXP", val: "0.5*exp(x)" }
  ];

  return (
    <div className={`min-h-screen bg-black text-white font-mono selection:bg-cyan-900 ${GeistMono.className}`}>
       
       <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-14 flex items-center px-6 bg-black/80 backdrop-blur-md justify-between">
         <div className="flex items-center gap-4 text-xs tracking-widest">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
               {t_local('actions.sync')}
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-cyan-500 font-bold">{t_local('subtitle')}: {t_local('title')}</span>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')} className="text-xs text-white/40 hover:text-white transition-colors uppercase">
                 [{locale.toUpperCase()}]
             </button>
            <div className="text-xs text-white/40">
                {t_local('levels.' + currentLevel + '.name')}
            </div>
         </div>
      </header>

      <main className="pt-20 px-6 max-w-7xl mx-auto space-y-16 pb-20">
        
        {/* --- LEVEL 1: BASICS --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t_local('concepts.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-white/70 leading-relaxed">
                <div>
                    <h3 className="text-white font-bold mb-2">{t_local('concepts.diff_title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t_local('concepts.diff_body') }} />
                </div>
                <div>
                    <h3 className="text-white font-bold mb-2">{t_local('concepts.int_title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t_local('concepts.int_body') }} />
                </div>
            </div>
            {currentLevel === 1 && (
                <div className="mt-4 p-4 bg-cyan-900/10 border border-cyan-500/30 text-cyan-400 text-xs animate-pulse">
                     {`>>`} {t_local('levels.1.desc')}
                     <br/>
                     <span className="text-white/60">SCROLL DOWN TO FLUX ENGINE & ADJUST T-PARAMETER</span>
                </div>
            )}
        </section>

        {/* --- LEVEL 2: THEORY --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t_local('theory.title')}
            </h2>
            <div className="bg-white/5 border border-white/10 p-6 rounded-sm font-mono text-xs grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                     <div className="mb-4 flex items-center gap-2">
                        <span className="text-white/40">{t_local('theory.def_title')}</span> 
                        <span className="text-white font-bold">{t_local('theory.derivative_term')}</span>
                     </div>
                     <div className="text-xl tracking-widest text-cyan-400 mb-4 font-bold">f'(x) = lim(h→0) [f(x+h) - f(x)] / h</div>
                     <p className="text-white/50 leading-relaxed">{t_local('theory.derivative_desc')}</p>
                </div>
                <div>
                     <div className="mb-4 flex items-center gap-2">
                        <span className="text-white/40">{t_local('theory.def_title')}</span> 
                        <span className="text-white font-bold">{t_local('theory.integral_term')}</span>
                     </div>
                     <div className="text-xl tracking-widest text-green-400 mb-4 font-bold">∫[a,b] f(x) dx = F(b) - F(a)</div>
                     <p className="text-white/50 leading-relaxed">{t_local('theory.integral_desc')}</p>
                </div>
            </div>
             {currentLevel === 2 && (
                 <div className="mt-4 p-4 bg-cyan-900/10 border border-cyan-500/30 text-cyan-400 text-xs animate-pulse">
                    {`>>`} {t_local('levels.2.desc')}
                    <br/>
                    <span className="text-white/60">FIND THE EQUILIBRIUM POINT (SLOPE ≈ 0)</span>
               </div>
            )}
        </section>

        {/* --- LEVEL 3: FLUX ENGINE --- */}
        <section className="space-y-6" id="flux-engine">
             <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t_local('viz.title')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                {/* Left Panel (Controls) */}
                <div className="space-y-6 flex flex-col h-full">
                    
                    {/* Input */}
                    <div className="bg-white/5 p-4 border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-1 text-[9px] text-white/10 group-hover:text-cyan-500 transition-colors">INPUT_STREAM</div>
                        <label className="text-[10px] text-white/40 block mb-2 tracking-widest">{t_local('viz.controls.function_label')}</label>
                        <input 
                            type="text" 
                            value={funcStr} 
                            onChange={(e) => { setFuncStr(e.target.value); addLog(`[OP] FUNCTION SET: ${e.target.value}`); }}
                            className="w-full bg-black border border-white/20 text-white p-2 text-sm font-mono focus:border-cyan-500 outline-none transition-colors"
                        />
                         <div className="flex gap-2 mt-2 flex-wrap">
                            {presets.map(p => (
                                <button key={p.label} onClick={() => { setFuncStr(p.val); addLog(`[OP] PRESET: ${p.label}`); }} className="text-[9px] border border-white/10 px-2 py-1 text-white/60 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-900/20 transition-all">
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slider */}
                     <div className="bg-white/5 p-4 border border-white/10">
                         <div className="flex justify-between text-[10px] text-white/40 mb-2 tracking-widest">
                            <span>{t_local('viz.controls.time_label')}</span>
                            <span className="text-cyan-400 font-bold">{xVal.toFixed(2)}</span>
                         </div>
                         <input 
                            type="range" min="-4" max="4" step="0.01" 
                            value={xVal} onChange={(e) => { setXVal(parseFloat(e.target.value)); }}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                        />
                     </div>

                    {/* Stats & Log */}
                    <div className="flex-1 bg-black border border-white/10 p-4 font-mono text-xs flex flex-col relative">
                         <div className="absolute top-2 right-2 text-[9px] text-white/20">TELEMETRY_LINK_ESTABLISHED</div>
                         <div className="border-b border-white/10 pb-2 mb-2 text-white/30 tracking-widest">{t_local('viz.controls.telemetry')}</div>
                         
                         <div className="space-y-2 mb-4">
                             <div className="flex justify-between border-b border-white/5 pb-1">
                                 <span className="text-white/60">{t_local('viz.controls.value')}</span>
                                 <span className="font-bold">{isNaN(currentY) ? '-' : currentY.toFixed(4)}</span>
                             </div>
                             <div className="flex justify-between border-b border-white/5 pb-1">
                                 <span className="text-white/60">{t_local('viz.controls.slope')}</span>
                                 <span className={`font-bold ${
                                     (currentLevel === 1 && currentSlope > targetSlopeL1) || (currentLevel === 2 && Math.abs(currentSlope) < targetSlopeL2) ? 'text-green-400 animate-pulse' : 'text-red-400'
                                 }`}>
                                    {isNaN(currentSlope) ? '-' : currentSlope.toFixed(4)}
                                 </span>
                             </div>
                             <div className="flex justify-between items-center pt-1">
                                 <span className="text-white/60">{t_local('viz.controls.area')}</span>
                                 <div className="text-right">
                                    <span className={`block ${currentIntegral > targetAreaL3 ? 'text-green-400 animate-pulse font-bold' : 'text-cyan-400 font-bold'}`}>
                                        {isNaN(currentIntegral) ? '-' : currentIntegral.toFixed(4)}
                                    </span>
                                    {currentLevel === 3 && <span className="text-[9px] text-white/20">TARGET: &gt; {targetAreaL3.toFixed(1)}</span>}
                                 </div>
                             </div>
                         </div>

                         {/* System Log */}
                         <div className="flex-1 border-t border-white/10 pt-2 overflow-hidden flex flex-col bg-white/5 p-2 rounded-sm">
                             <div className="text-[9px] text-white/30 mb-1 flex justify-between">
                                 <span>{t_local('viz.controls.telemetry')} LOG</span>
                                 <span className="text-green-500/50">{t_local('viz.controls.telemetry')} LIVE</span>
                             </div>
                             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                {log.map((entry, i) => (
                                    <div key={i} className="text-[10px] text-white/60 truncate hover:text-white transition-colors">
                                        <span className="text-cyan-500 mr-1">{`>`}</span>
                                        {entry}
                                    </div>
                                ))}
                             </div>
                         </div>

                         <div className="pt-4 border-t border-white/10">
                             <button 
                                onClick={() => { setIs3DMode(!is3DMode); addLog(`[OP] 3D MODE: ${!is3DMode}`); }}
                                className={`w-full py-2 text-center border transition-all text-[10px] tracking-widest uppercase ${is3DMode ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400' : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'}`}
                            >
                                {is3DMode ? t_local('viz.controls.disable_3d') : t_local('viz.controls.enable_3d')}
                            </button>
                         </div>
                    </div>
                </div>

                {/* Right Panel (Canvas) */}
                <div className="lg:col-span-2 border border-white/10 bg-black relative h-full overflow-hidden group">
                    <div className="absolute top-2 left-2 text-[10px] text-white/20 z-10 group-hover:text-white/40 transition-colors pointer-events-none">
                        {t_local('viz.viewport_label')} {is3DMode ? 'THREE.JS_RENDERER' : 'CANVAS_2D'}
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
                                {t_local('viz.controls.rotation_active')}
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
        </section>

        {/* --- LEVEL 4: APPLICATION --- */}
        <section className="space-y-6 border-t border-white/10 pt-16">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t_local('apps.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/60">
                <div className="bg-white/5 p-4 border border-white/10 hover:border-cyan-500/30 transition-colors">
                    <h3 className="text-white font-bold mb-2 text-sm">{t_local('apps.physics_title')}</h3>
                    <p>{t_local('apps.physics_body')}</p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10 hover:border-cyan-500/30 transition-colors">
                    <h3 className="text-white font-bold mb-2 text-sm">{t_local('apps.ml_title')}</h3>
                    <p>{t_local('apps.ml_body')}</p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10 hover:border-cyan-500/30 transition-colors">
                    <h3 className="text-white font-bold mb-2 text-sm">{t_local('apps.econ_title')}</h3>
                    <p>{t_local('apps.econ_body')}</p>
                </div>
            </div>
             {currentLevel === 4 && (
                 <button 
                    onClick={() => handleLevelComplete(4)} 
                    className="mt-4 border border-cyan-500/30 text-cyan-400 px-6 py-3 text-xs hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest bg-cyan-900/10"
                 >
                    {t_local('actions.sync')}
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
                <div className="bg-black border border-cyan-500/30 p-8 max-w-md w-full relative overflow-hidden shadow-2xl shadow-cyan-900/20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tighter">{t_local('completion.synced')}</h2>
                    <div className="text-cyan-500 text-sm mb-6 flex justify-between items-center">
                        <span>{t_local('levels.' + currentLevel + '.name')} COMPLETE</span>
                        <span className="text-white/20 text-[10px]">{currentLevel < 4 ? 'UPLOADING...' : 'ALL_SYSTEMS_GO'}</span>
                    </div>
                    <p className="text-white/60 text-xs mb-8 leading-relaxed border-l-2 border-white/10 pl-4">
                        {t_local('completion.msg')}<br/>
                        <span className="text-green-400 mt-2 block">XP AWARDED: +100</span>
                    </p>
                    <button 
                        onClick={handleNextLevel}
                        className="w-full bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 py-3 text-xs hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest font-bold"
                    >
                        {currentLevel < 4 ? 'NEXT LEVEL' : 'RETURN TO ROOT'}
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
