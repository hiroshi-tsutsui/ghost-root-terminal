// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

// --- 3D Components ---
function RevolutionSurface({ funcStr, xVal }: { funcStr: string, xVal: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create geometry based on function
  // We rotate f(x) around x-axis.
  // Parametric surface:
  // x = u (from 0 to xVal)
  // y = f(u) * cos(v)
  // z = f(u) * sin(v)
  // v from 0 to 2PI
  
  // We need to construct geometry manually or use ParametricGeometry (which is deprecated/moved in newer three)
  // Or easier: Use a LatheGeometry?
  // LatheGeometry rotates a path around Y axis.
  // Our function is y = f(x). We want rotation around x-axis.
  // We can swap coordinates or rotate the mesh.
  // Points for Lathe: (y, x) -> rotates around Y (which maps to X in our mental model if we rotate mesh)
  
  const [points, setPoints] = useState<THREE.Vector2[]>([]);

  useEffect(() => {
    try {
        const pts = [];
        const steps = 50;
        // Range 0 to xVal (or slightly more/less)
        // If xVal is negative, handle gracefully? Assumed > 0 for volume usually.
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

  // Sensei Logic
  useEffect(() => {
    if (!senseiMode) return;

    if (lessonStep === 1) {
        // Derivative Lesson: Find slope = 0 for x^2 - 2
        setFuncStr("x^2 - 2");
        if (Math.abs(evaluateDerivative("x^2 - 2", xVal)) < 0.1) {
            setShowConfetti(true);
            setTimeout(() => { setShowConfetti(false); setLessonStep(2); }, 2000);
        }
    } else if (lessonStep === 3) {
        // Integral Lesson: Find Area = 2 for 2*x
        setFuncStr("2");
        const area = integrate("2", xVal);
        if (Math.abs(area - 4) < 0.2 && xVal > 0) {
             setShowConfetti(true);
             setTimeout(() => { setShowConfetti(false); setLessonStep(4); }, 2000);
        }
    }

  }, [xVal, lessonStep, senseiMode]);


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
    { label: "二次関数", val: "0.5*x^3 - 2*x" },
    { label: "サイン", val: "sin(x)" },
    { label: "コサイン", val: "cos(x)" },
    { label: "指数", val: "exp(x)" },
    { label: "対数", val: "log(x)" },
    { label: "タンジェント", val: "tan(x)" }
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans overflow-hidden">
      
       {/* Sidebar */}
       <div className="w-full md:w-[400px] flex flex-col border-r border-white/20 bg-white/70 backdrop-blur-xl z-10 h-1/2 md:h-full overflow-y-auto shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <header className="p-6 pb-4 border-b border-gray-200/50 sticky top-0 bg-white/50 backdrop-blur-md z-20">
            <Link href="/" className="group flex items-center text-sm font-medium text-[#86868b] hover:text-[#0071e3] transition-colors mb-3">
              <span className="inline-block transition-transform group-hover:-translate-x-1 mr-1">←</span> ホームに戻る
            </Link>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">Calculus / The Flux Engine</h1>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIs3DMode(!is3DMode)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${is3DMode ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                    >
                        {is3DMode ? '3D View' : '2D View'}
                    </button>
                    <button 
                        onClick={() => { setSenseiMode(!senseiMode); setLessonStep(0); }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${senseiMode ? 'bg-[#0071e3] text-white' : 'bg-gray-200 text-gray-500'}`}
                    >
                        {senseiMode ? 'SYNC MODE' : 'Initiate Sync'}
                    </button>
                </div>
            </div>
            <p className="text-[#86868b] text-sm mt-1 font-medium">OMEGA SIMULATION // TEMPORAL STABILIZER</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
           
           {/* Sensei Mode Panel */}
           <AnimatePresence>
            {senseiMode && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="apple-card p-5 border-2 border-[#0071e3] bg-[#0071e3]/5 relative overflow-hidden"
                >
                    {/* ... (Existing Sensei Content) ... */}
                    <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl">⚛️</div>
                    <h3 className="font-bold text-[#0071e3] mb-2 tracking-widest uppercase text-xs">PROTOCOL: FLUX_SYNC</h3>
                    
                    {lessonStep === 0 && (
                        <div>
                            <p className="text-sm mb-4">Operator, the timeline is unstable. We must synchronize the Flux Engine. First objective: <span className="font-bold">Predict the turning point.</span></p>
                            <button onClick={() => setLessonStep(1)} className="btn-apple-primary w-full">INITIATE SEQUENCE</button>
                        </div>
                    )}
                    {lessonStep === 1 && (
                        <div>
                            <p className="text-sm font-bold mb-1">Objective: Stabilize the Tangent</p>
                            <p className="text-xs text-gray-600 mb-4">
                                Function <span className="font-mono">f(x) = x^2 - 2</span> detected.<br/>
                                Adjust the timeline (slider) until the <span className="text-[#ff3b30] font-bold">Predictive Tangent</span> is perfectly horizontal (Rate of Change = 0).
                            </p>
                            <div className="text-xs bg-white/50 p-2 rounded font-mono">CURRENT FLUX: {currentSlope.toFixed(3)}</div>
                        </div>
                    )}
                     {lessonStep === 2 && (
                        <div>
                            <p className="text-sm font-bold mb-1">Equilibrium Achieved. 🎉</p>
                            <p className="text-xs text-gray-600 mb-4">
                                The turning point is secured. This is a local extremum.<br/>
                                Next objective: <span className="font-bold">Accumulate Reality Mass.</span>
                            </p>
                            <button onClick={() => setLessonStep(3)} className="btn-apple-primary w-full">PROCEED</button>
                        </div>
                    )}
                    {lessonStep === 3 && (
                        <div>
                            <p className="text-sm font-bold mb-1">Objective: Reality Accumulation</p>
                            <p className="text-xs text-gray-600 mb-4">
                                Function <span className="font-mono">f(x) = 2</span> (Constant Flow).<br/>
                                Expand the timeline until the <span className="text-[#0071e3] font-bold">Accumulated Area</span> reaches precisely 4.0 units.
                            </p>
                            <div className="text-xs bg-white/50 p-2 rounded font-mono">TOTAL MASS: {currentIntegral.toFixed(3)}</div>
                        </div>
                    )}
                    {lessonStep === 4 && (
                        <div>
                            <p className="text-sm font-bold mb-1">SYNC COMPLETE 🎓</p>
                            <p className="text-xs text-gray-600 mb-4">
                                Excellent work, Operator. You have mastered the Flux.<br/>
                                "The First Derivative is not a number; it is a prophecy."<br/>
                                The timeline is stable.
                            </p>
                            <button onClick={() => setSenseiMode(false)} className="btn-apple-secondary w-full text-xs">RETURN TO IDLE</button>
                        </div>
                    )}
                </motion.div>
            )}
           </AnimatePresence>

           {/* Function Input */}
           <div className={`apple-card p-5 fade-in-up delay-100 ${senseiMode ? 'opacity-50 pointer-events-none' : ''}`}>
             <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-3 block">関数 f(x)</label>
             <div className="relative mb-4">
                <input 
                    type="text" 
                    value={funcStr} 
                    onChange={(e) => setFuncStr(e.target.value)}
                    className="input-apple text-lg font-mono tracking-wide"
                    placeholder="e.g. sin(x) + x^2"
                />
             </div>
             {error && <p className="text-[#ff3b30] text-xs flex items-center mb-3">⚠️ {error}</p>}
             
             <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                    <button 
                        key={p.label}
                        onClick={() => setFuncStr(p.val)}
                        className="px-3 py-1.5 text-[11px] font-medium bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] rounded-full transition-colors active:scale-95"
                    >
                        {p.label}
                    </button>
                ))}
             </div>
           </div>

           {/* Slider Control */}
           <div className="apple-card p-5 fade-in-up delay-200">
             <div className="flex justify-between items-end mb-4">
                <label className="text-sm font-semibold text-[#1d1d1f]">x の値</label>
                <span className="font-mono text-xl font-bold text-[#0071e3]">{xVal.toFixed(2)}</span>
             </div>
             <input 
               type="range" min="-4" max="4" step="0.01" 
               value={xVal} onChange={(e) => setXVal(parseFloat(e.target.value))}
               className="w-full"
             />
             <div className="flex justify-between text-[10px] text-[#86868b] font-mono mt-2">
                <span>-4.0</span>
                <span>0.0</span>
                <span>4.0</span>
             </div>
           </div>

           {/* Analysis Panel */}
           <div className="apple-card p-5 space-y-4 fade-in-up delay-300">
             <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider border-b border-gray-100 pb-3">TEMPORAL COORDINATE: T = {xVal.toFixed(2)}</h3>
             
             <div className="flex justify-between items-center group">
                <span className="text-sm text-[#1d1d1f] font-medium">Position f(t)</span>
                <span className="font-mono text-base text-[#1d1d1f]">{isNaN(currentY) ? '-' : currentY.toFixed(3)}</span>
             </div>
             
             <div className="flex justify-between items-center group">
                <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-[#ff3b30] mr-2 shadow-sm group-hover:scale-125 transition-transform"></span>
                    <span className="text-sm text-[#1d1d1f] font-medium">Velocity (Flux)</span>
                </div>
                <span className="font-mono text-base text-[#ff3b30]">{isNaN(currentSlope) ? '-' : currentSlope.toFixed(3)}</span>
             </div>

             <div className="flex justify-between items-center group">
                <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-[#0071e3] mr-2 shadow-sm group-hover:scale-125 transition-transform"></span>
                    <span className="text-sm text-[#1d1d1f] font-medium">Accumulated Mass</span>
                </div>
                <span className="font-mono text-base text-[#0071e3]">{isNaN(currentIntegral) ? '-' : currentIntegral.toFixed(3)}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center bg-[#F5F5F7] p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
        {showConfetti && (
             <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
                 <div className="text-6xl animate-bounce">🎉</div>
             </div>
        )}
        
        {is3DMode ? (
             <div className="w-full h-full shadow-2xl rounded-xl overflow-hidden relative bg-black/5">
                <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                     <ambientLight intensity={0.5} />
                     <directionalLight position={[10, 10, 5]} intensity={1} />
                     <Grid infiniteGrid fadeDistance={50} sectionColor="#0071e3" cellColor="#ccc" />
                     <RevolutionSurface funcStr={funcStr} xVal={xVal} />
                     <OrbitControls makeDefault />
                </Canvas>
                <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur p-2 rounded text-xs font-bold text-gray-500">
                    回転体の体積 (Volume of Revolution)
                </div>
             </div>
        ) : (
             <div className="apple-card p-2 shadow-2xl z-10 bg-white">
                <canvas ref={canvasRef} width={800} height={600} className="rounded-xl w-full h-auto max-h-[85vh] object-contain bg-white" />
             </div>
        )}
      </div>
    </div>
  );
}
