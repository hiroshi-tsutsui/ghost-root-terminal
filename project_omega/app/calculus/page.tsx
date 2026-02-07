// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useProgress } from '../contexts/ProgressContext';

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
            
            // Lathe expects Vector2(x, y). It rotates around Y.
            // We want distance from axis as X component of Vector2.
            // So Vector2(radius, height).
            // Radius = f(x) = y. Height = x = u.
            pts.push(new THREE.Vector2(Math.abs(y), u)); 
        }
        setPoints(pts);
    } catch (e) {
        console.error(e);
    }
  }, [funcStr, xVal]);

  if (points.length < 2) return null;

  return (
    <group rotation={[0, 0, -Math.PI / 2]}> {/* Rotate so Y-axis (height) becomes X-axis */}
        <mesh ref={meshRef}>
            <latheGeometry args={[points, 32]} />
            <meshStandardMaterial color="#0071e3" side={THREE.DoubleSide} transparent opacity={0.6} roughness={0.3} metalness={0.1} />
        </mesh>
    </group>
  );
}

export default function CalculusPage() {
  const [xVal, setXVal] = useState(1);
  const [funcStr, setFuncStr] = useState("0.5*x^3 - 2*x");
  const [error, setError] = useState<string | null>(null);
  const [senseiMode, setSenseiMode] = useState(false);
  const [lessonStep, setLessonStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // 3D Toggle
  const [is3DMode, setIs3DMode] = useState(false);
  
  // Global Progress
  const { completeLevel } = useProgress();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const evaluateFunc = (expression: string, x: number) => {
    try {
      return math.evaluate(expression, { x });
    } catch (e) {
      return NaN;
    }
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

  // Sensei Logic (Protocol: FLUX_SYNC)
  useEffect(() => {
    if (!senseiMode) return;

    if (lessonStep === 1) {
        // Derivative Lesson: Find slope = 0 for x^2 - 2
        setFuncStr("x^2 - 2");
        if (Math.abs(evaluateDerivative("x^2 - 2", xVal)) < 0.1) {
            setShowConfetti(true);
            completeLevel('calculus', 1); // Level 1 Complete
            setTimeout(() => { setShowConfetti(false); setLessonStep(2); }, 2000);
        }
    } else if (lessonStep === 3) {
        // Integral Lesson: Find Area = 2 for 2*x
        setFuncStr("2");
        const area = integrate("2", xVal);
        if (Math.abs(area - 4) < 0.2 && xVal > 0) {
             setShowConfetti(true);
             completeLevel('calculus', 2); // Level 2 Complete
             setTimeout(() => { setShowConfetti(false); setLessonStep(4); }, 2000);
        }
    } else if (lessonStep === 5) {
        // Level 3: Dimensional Projection
        if (is3DMode) {
            setShowConfetti(true);
            completeLevel('calculus', 3); // Level 3 Complete
            setTimeout(() => { setShowConfetti(false); setLessonStep(6); }, 2000);
        }
    }

  }, [xVal, lessonStep, senseiMode, is3DMode]); // added is3DMode to deps

  // 2D Drawing Effect
  useEffect(() => {
    if (is3DMode) return; // Skip 2D drawing if 3D

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const scale = 50; // Zoomed in a bit more
    const centerX = width / 2;
    const centerY = height / 2;

    try {
        math.evaluate(funcStr, { x: 0 });
        setError(null);
    } catch (e) {
        setError("関数の構文エラー");
        return;
    }

    // Grid
    ctx.strokeStyle = '#f5f5f7';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += scale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += scale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#d1d1d6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); 
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
    ctx.stroke();

    // Area (Integral) - Apple Blue with opacity
    ctx.fillStyle = 'rgba(0, 113, 227, 0.15)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const step = 0.05;
    const start = Math.min(0, xVal);
    const end = Math.max(0, xVal);
    for (let x = start; x <= end; x += step) {
        const y = evaluateFunc(funcStr, x);
        const px = centerX + x * scale;
        const py = centerY - y * scale;
        ctx.lineTo(px, py);
    }
    const finalY = evaluateFunc(funcStr, xVal);
    ctx.lineTo(centerX + xVal * scale, centerY - finalY * scale); // Connect to curve point
    ctx.lineTo(centerX + xVal * scale, centerY); // Drop to axis
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    // Function Curve - Apple Blue
    ctx.strokeStyle = '#0071e3';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let first = true;
    for (let pixelX = 0; pixelX < width; pixelX++) {
      const x = (pixelX - centerX) / scale;
      const y = evaluateFunc(funcStr, x);
      if (isNaN(y) || !isFinite(y)) {
          first = true;
          continue;
      }
      const pixelY = centerY - (y * scale);
      if (pixelY < -height || pixelY > height * 2) {
          first = true;
          continue;
      }
      if (first) {
          ctx.moveTo(pixelX, pixelY);
          first = false;
      } else {
          ctx.lineTo(pixelX, pixelY);
      }
    }
    ctx.stroke();

    // Tangent Line - Apple Red
    const yVal = evaluateFunc(funcStr, xVal);
    const slope = evaluateDerivative(funcStr, xVal);
    const tangentLength = 3;
    const xStart = xVal - tangentLength;
    const xEnd = xVal + tangentLength;
    const yStart = slope * (xStart - xVal) + yVal;
    const yEnd = slope * (xEnd - xVal) + yVal;
    const pXStart = centerX + xStart * scale;
    const pYStart = centerY - yStart * scale;
    const pXEnd = centerX + xEnd * scale;
    const pYEnd = centerY - yEnd * scale;

    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(pXStart, pYStart);
    ctx.lineTo(pXEnd, pYEnd);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tangent Point Pulse
    const pX = centerX + xVal * scale;
    const pY = centerY - yVal * scale;
    
    // Volume of Revolution (Visual Hint) - 2D Hack
    ctx.strokeStyle = 'rgba(0, 113, 227, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    // Draw reflected curve
    let firstRef = true;
    for (let pixelX = 0; pixelX < width; pixelX++) {
      const x = (pixelX - centerX) / scale;
      const y = -evaluateFunc(funcStr, x); // Reflected Y
      const pixelY = centerY - (y * scale);
      if (pixelY < -height || pixelY > height * 2) { firstRef = true; continue; }
      if (firstRef) { ctx.moveTo(pixelX, pixelY); firstRef = false; }
      else { ctx.lineTo(pixelX, pixelY); }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Shading the solid volume (Area between f(x) and -f(x))
    ctx.fillStyle = 'rgba(0, 113, 227, 0.05)';
    ctx.beginPath();
    // Top curve
    for (let pixelX = 0; pixelX < width; pixelX+=5) {
        const x = (pixelX - centerX) / scale;
        const y = evaluateFunc(funcStr, x);
        ctx.lineTo(pixelX, centerY - y * scale);
    }
    // Bottom curve (reverse)
    for (let pixelX = width; pixelX >= 0; pixelX-=5) {
        const x = (pixelX - centerX) / scale;
        const y = -evaluateFunc(funcStr, x);
        ctx.lineTo(pixelX, centerY - y * scale);
    }
    ctx.fill();

    // Outer halo
    ctx.fillStyle = 'rgba(255, 59, 48, 0.2)';
    ctx.beginPath();
    ctx.arc(pX, pY, 14, 0, 2 * Math.PI);
    ctx.fill();

    // Inner dot
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath();
    ctx.arc(pX, pY, 7, 0, 2 * Math.PI);
    ctx.fill();
    
    // Center white dot
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(pX, pY, 3, 0, 2 * Math.PI);
    ctx.fill();

  }, [xVal, funcStr, is3DMode]);

  const currentY = evaluateFunc(funcStr, xVal);
  const currentSlope = evaluateDerivative(funcStr, xVal);
  const currentIntegral = integrate(funcStr, xVal);

  const presets = [
    { label: "PARABOLIC TRAJECTORY", val: "0.5*x^3 - 2*x" },
    { label: "HARMONIC WAVE (SIN)", val: "sin(x)" },
    { label: "PHASE SHIFT (COS)", val: "cos(x)" },
    { label: "EXPONENTIAL RUNAWAY", val: "exp(x)" },
    { label: "ENTROPY COMPRESSION", val: "log(x)" },
    { label: "VERTICAL ASYMPTOTE", val: "tan(x)" }
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#050505] text-[#e0e0e0] font-mono overflow-hidden">
      
       {/* Sidebar */}
       <div className="w-full md:w-[400px] flex flex-col border-r border-[#333] bg-[#0a0a0a]/90 backdrop-blur-xl z-10 h-1/2 md:h-full overflow-y-auto shadow-[4px_0_24px_rgba(0,113,227,0.1)]">
        <header className="p-6 pb-4 border-b border-[#333] sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-20">
            <Link href="/" className="group flex items-center text-xs font-bold text-[#86868b] hover:text-[#0071e3] transition-colors mb-3 tracking-widest uppercase">
              <span className="inline-block transition-transform group-hover:-translate-x-1 mr-1">{'<<'}</span> SYSTEM ROOT
            </Link>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tighter text-[#fff] font-mono">FLUX ENGINE <span className="text-[#0071e3] text-xs align-top">v2.1</span></h1>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIs3DMode(!is3DMode)}
                        className={`px-3 py-1 rounded-sm text-[10px] font-bold tracking-widest border transition-all ${is3DMode ? 'bg-[#0071e3]/20 border-[#0071e3] text-[#0071e3]' : 'border-[#333] text-[#666] hover:border-[#666]'}`}
                    >
                        {is3DMode ? 'VIEW: 3D' : 'VIEW: 2D'}
                    </button>
                    <button 
                        onClick={() => { setSenseiMode(!senseiMode); setLessonStep(0); }}
                        className={`px-3 py-1 rounded-sm text-[10px] font-bold tracking-widest border transition-all ${senseiMode ? 'bg-[#0071e3] border-[#0071e3] text-white' : 'border-[#333] text-[#666] hover:border-[#666]'}`}
                    >
                        {senseiMode ? 'SYNC: ACTIVE' : 'INIT SYNC'}
                    </button>
                </div>
            </div>
            <p className="text-[#666] text-[10px] mt-2 font-mono tracking-[0.2em] uppercase">Temporal Stabilization Protocol</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
           
           {/* Sensei Mode Panel */}
           <AnimatePresence>
            {senseiMode && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-5 border border-[#0071e3] bg-[#0071e3]/10 relative overflow-hidden mb-4"
                >
                    <div className="absolute top-0 right-0 p-2 opacity-20 text-[#0071e3] text-4xl">⚛️</div>
                    <h3 className="font-bold text-[#0071e3] mb-4 tracking-[0.2em] uppercase text-[10px] border-b border-[#0071e3]/30 pb-2">PROTOCOL: FLUX_SYNC</h3>
                    
                    {lessonStep === 0 && (
                        <div>
                            <p className="text-xs mb-4 text-[#ccc]">OPERATOR: Timeline instability detected. Flux Engine requires manual synchronization. <br/><br/><span className="text-[#fff]">OBJECTIVE 1:</span> Predict the turning point.</p>
                            <button onClick={() => setLessonStep(1)} className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold py-2 tracking-widest transition-colors">INITIATE SEQUENCE</button>
                        </div>
                    )}
                    {lessonStep === 1 && (
                        <div>
                            <p className="text-xs font-bold text-[#fff] mb-2 uppercase">Obj: Stabilize Tangent Vector</p>
                            <p className="text-[10px] text-[#aaa] mb-4 font-mono">
                                TARGET: <span className="text-[#fff]">f(x) = x^2 - 2</span><br/>
                                INSTRUCTION: Adjust <span className="text-[#0071e3]">Temporal Coordinate (Slider)</span> until Rate of Change = 0.
                            </p>
                            <div className="text-[10px] bg-[#000]/50 border border-[#333] p-2 font-mono text-[#0071e3]">CURRENT FLUX: {currentSlope.toFixed(3)}</div>
                        </div>
                    )}
                     {lessonStep === 2 && (
                        <div>
                            <p className="text-xs font-bold text-[#fff] mb-2 uppercase">Equilibrium Achieved</p>
                            <p className="text-[10px] text-[#aaa] mb-4 font-mono">
                                Local extremum secured.<br/>
                                <span className="text-[#fff]">OBJECTIVE 2:</span> Accumulate Reality Mass.
                            </p>
                            <button onClick={() => setLessonStep(3)} className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold py-2 tracking-widest transition-colors">PROCEED</button>
                        </div>
                    )}
                    {lessonStep === 3 && (
                        <div>
                            <p className="text-xs font-bold text-[#fff] mb-2 uppercase">Obj: Mass Accumulation</p>
                            <p className="text-[10px] text-[#aaa] mb-4 font-mono">
                                TARGET: <span className="text-[#fff]">f(x) = 2</span> (Constant Flow)<br/>
                                INSTRUCTION: Expand timeline until <span className="text-[#0071e3]">Accumulated Mass (Area)</span> = 4.00.
                            </p>
                            <div className="text-[10px] bg-[#000]/50 border border-[#333] p-2 font-mono text-[#0071e3]">TOTAL MASS: {currentIntegral.toFixed(3)}</div>
                        </div>
                    )}
                    {lessonStep === 4 && (
                        <div>
                            <p className="text-xs font-bold text-[#fff] mb-2 uppercase">Obj: Dimensional Projection</p>
                            <p className="text-[10px] text-[#aaa] mb-4 font-mono">
                                MASS STABILIZED.<br/>
                                <span className="text-[#fff]">OBJECTIVE 3:</span> Project 2D Slice into 3D Manifold.<br/>
                                ACTION: Toggle "VIEW: 3D".
                            </p>
                            <button onClick={() => setLessonStep(5)} className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold py-2 tracking-widest transition-colors">INITIATE PROJECTION</button>
                        </div>
                    )}
                     {lessonStep === 5 && (
                        <div>
                            <p className="text-xs font-bold text-[#fff] mb-2 uppercase">Awaiting Projection</p>
                            <p className="text-[10px] text-[#aaa] mb-4 font-mono">
                                INSTRUCTION: Toggle <span className="text-[#0071e3]">VIEW: 3D</span> button in header.
                            </p>
                        </div>
                    )}
                    {lessonStep === 6 && (
                        <div>
                            <p className="text-xs font-bold text-[#fff] mb-2 uppercase">SYNC COMPLETE</p>
                            <p className="text-[10px] text-[#aaa] mb-4 font-mono">
                                Flux Engine Stabilized.<br/>
                                "The First Derivative is not a number; it is a prophecy."
                            </p>
                            <button onClick={() => setSenseiMode(false)} className="w-full border border-[#333] hover:bg-[#333] text-[#ccc] text-xs font-bold py-2 tracking-widest transition-colors">RETURN TO IDLE</button>
                        </div>
                    )}
                </motion.div>
            )}
           </AnimatePresence>

           {/* Function Input */}
           <div className={`p-5 border border-[#333] bg-[#111] ${senseiMode ? 'opacity-20 pointer-events-none' : ''}`}>
             <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3 block">Input Signal f(x)</label>
             <div className="relative mb-4">
                <input 
                    type="text" 
                    value={funcStr} 
                    onChange={(e) => setFuncStr(e.target.value)}
                    className="w-full bg-[#000] border border-[#333] text-[#fff] p-2 font-mono text-sm focus:border-[#0071e3] outline-none transition-colors"
                    placeholder="e.g. sin(x) + x^2"
                />
             </div>
             {error && <p className="text-[#ff3b30] text-[10px] flex items-center mb-3 font-mono">⚠️ {error}</p>}
             
             <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                    <button 
                        key={p.label}
                        onClick={() => setFuncStr(p.val)}
                        className="px-2 py-1 text-[9px] font-mono border border-[#333] hover:border-[#666] text-[#888] hover:text-[#fff] transition-all uppercase"
                    >
                        {p.label}
                    </button>
                ))}
             </div>
           </div>

           {/* Slider Control */}
           <div className="p-5 border border-[#333] bg-[#111]">
             <div className="flex justify-between items-end mb-4">
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Temporal Coordinate (t)</label>
                <span className="font-mono text-lg font-bold text-[#0071e3]">{xVal.toFixed(2)}</span>
             </div>
             <input 
               type="range" min="-4" max="4" step="0.01" 
               value={xVal} onChange={(e) => setXVal(parseFloat(e.target.value))}
               className="w-full h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
             />
             <div className="flex justify-between text-[9px] text-[#444] font-mono mt-2">
                <span>-4.0</span>
                <span>0.0</span>
                <span>4.0</span>
             </div>
           </div>

           {/* Analysis Panel */}
           <div className="p-5 border border-[#333] bg-[#111] space-y-4">
             <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest border-b border-[#333] pb-2">TELEMETRY: T = {xVal.toFixed(2)}</h3>
             
             <div className="flex justify-between items-center group">
                <span className="text-xs text-[#aaa] font-mono uppercase">Position f(t)</span>
                <span className="font-mono text-sm text-[#fff]">{isNaN(currentY) ? '-' : currentY.toFixed(3)}</span>
             </div>
             
             <div className="flex justify-between items-center group">
                <div className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-[#ff3b30] mr-2"></span>
                    <span className="text-xs text-[#aaa] font-mono uppercase">Flux (Derivative)</span>
                </div>
                <span className="font-mono text-sm text-[#ff3b30]">{isNaN(currentSlope) ? '-' : currentSlope.toFixed(3)}</span>
             </div>

             <div className="flex justify-between items-center group">
                <div className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-[#0071e3] mr-2"></span>
                    <span className="text-xs text-[#aaa] font-mono uppercase">Accumulated Mass</span>
                </div>
                <span className="font-mono text-sm text-[#0071e3]">{isNaN(currentIntegral) ? '-' : currentIntegral.toFixed(3)}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center bg-[#050505] p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
        {showConfetti && (
             <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
                 <div className="text-xs font-mono text-[#0071e3] border border-[#0071e3] p-4 bg-[#000]/80">
                    >> STABILIZATION CONFIRMED
                 </div>
             </div>
        )}
        
        {is3DMode ? (
             <div className="w-full h-full border border-[#333] rounded-sm overflow-hidden relative bg-[#000]">
                <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                     <ambientLight intensity={0.5} />
                     <directionalLight position={[10, 10, 5]} intensity={1} />
                     <Grid infiniteGrid fadeDistance={50} sectionColor="#0071e3" cellColor="#333" />
                     <RevolutionSurface funcStr={funcStr} xVal={xVal} />
                     <OrbitControls makeDefault />
                </Canvas>
                <div className="absolute bottom-4 left-4 bg-[#000]/80 border border-[#333] p-2 text-[10px] font-bold text-[#666] uppercase tracking-widest">
                    Volume of Revolution
                </div>
             </div>
        ) : (
             <div className="border border-[#333] p-1 shadow-2xl z-10 bg-[#0a0a0a]">
                <canvas ref={canvasRef} width={800} height={600} className="w-full h-auto max-h-[85vh] object-contain bg-[#0a0a0a]" />
             </div>
        )}
      </div>
    </div>
  );
}
