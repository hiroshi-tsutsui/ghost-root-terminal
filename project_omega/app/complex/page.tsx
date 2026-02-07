// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProgress } from '../contexts/ProgressContext';

export default function ComplexPage() {
  const [re1, setRe1] = useState(1);
  const [im1, setIm1] = useState(0);
  const [re2, setRe2] = useState(0);
  const [im2, setIm2] = useState(1); // i
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { completeLevel } = useProgress();

  // Narrative State
  const [resonance, setResonance] = useState(false);
  const [systemLog, setSystemLog] = useState<string[]>([]);

  const addLog = (msg: string) => setSystemLog(prev => [msg, ...prev].slice(0, 3));

  useEffect(() => {
    addLog("[SYSTEM]: VOID PHASE ANALYZER ONLINE.");
    addLog("[MISSION]: Align output vector with cardinal axes to achieve resonance.");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const scale = 50; // 50px = 1 unit

    // Clear Canvas (Void)
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Grid (Cyberpunk)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += scale) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let i = 0; i < height; i += scale) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    // Axes
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Real Axis (Matter)
    ctx.strokeStyle = '#333';
    ctx.moveTo(0, cy); ctx.lineTo(width, cy); 
    ctx.stroke();

    // Imaginary Axis (Void)
    ctx.strokeStyle = '#333'; 
    ctx.moveTo(cx, 0); ctx.lineTo(cx, height); 
    ctx.stroke();

    // Helper: Draw Vector
    const drawVector = (re: number, im: number, color: string, glowColor: string, label: string, isResult = false) => {
        const x = cx + re * scale;
        const y = cy - im * scale; // Invert Y
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = isResult ? 4 : 2;
        ctx.shadowBlur = isResult ? 20 : 10;
        ctx.shadowColor = glowColor;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Arrowhead / Node
        ctx.beginPath();
        ctx.arc(x, y, isResult ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.shadowBlur = 0;
        ctx.font = isResult ? 'bold 14px "JetBrains Mono", monospace' : '12px "JetBrains Mono", monospace';
        ctx.fillStyle = isResult ? color : '#6b7280';
        ctx.fillText(label, x + 15, y);
    };

    // Draw Source Signal (z1)
    drawVector(re1, im1, '#3b82f6', '#3b82f6', 'SOURCE [z1]'); // Blue
    
    // Draw Phase Operator (z2)
    drawVector(re2, im2, '#10b981', '#10b981', 'OPERATOR [z2]'); // Green

    // Calculate Result (Shifted Signal)
    const pRe = re1 * re2 - im1 * im2;
    const pIm = re1 * im2 + im1 * re2;

    // Resonance Check (Pure Real or Pure Imaginary)
    // We allow a small epsilon for floating point floatiness
    const isResonant = (Math.abs(pRe) < 0.1 && Math.abs(pIm) > 0.1) || (Math.abs(pIm) < 0.1 && Math.abs(pRe) > 0.1);
    
    if (isResonant && !resonance) {
        setResonance(true);
        addLog("[SUCCESS]: RESONANCE ACHIEVED. PHASE LOCKED.");
        completeLevel('complex', 1);
    } else if (!isResonant && resonance) {
        setResonance(false);
        addLog("[WARNING]: SIGNAL DRIFT DETECTED.");
    }

    const resultColor = isResonant ? '#f59e0b' : '#ef4444'; // Gold / Red
    drawVector(pRe, pIm, resultColor, resultColor, isResonant ? 'RESONANCE [Synced]' : 'OUTPUT [Unstable]', true);
    
    // HUD overlay on canvas
    ctx.fillStyle = '#fff';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('AXIS: REAL (MATTER)', 10, cy - 10);
    ctx.fillText('AXIS: IMAGINARY (VOID)', cx + 10, 20);

  }, [re1, im1, re2, im2, resonance]);

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-gray-300 font-mono selection:bg-amber-900">
        {/* HUD Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 h-16 flex items-center px-6 justify-between">
             <div className="flex items-center gap-4">
                 <Link href="/" className="text-xs text-gray-500 hover:text-white uppercase tracking-widest transition-colors">
                    ← SYSTEM ROOT
                 </Link>
                 <div className="h-4 w-px bg-white/20"></div>
                 <h1 className="text-sm font-bold tracking-[0.2em] text-amber-500 uppercase glow-text">
                    MODULE: VOID_PHASE_ANALYZER
                 </h1>
             </div>
             <div className="flex items-center gap-3">
                 <div className={`px-3 py-1 rounded border text-[10px] font-bold tracking-widest ${resonance ? 'bg-amber-900/20 border-amber-500 text-amber-400 animate-pulse' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>
                    {resonance ? 'STATUS: RESONANT' : 'STATUS: UNSTABLE'}
                 </div>
             </div>
        </header>

        <main className="pt-24 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-6rem)]">
            {/* Control Panel */}
            <div className="lg:col-span-4 space-y-6 flex flex-col">
                
                {/* Log */}
                <div className="bg-[#080808] border border-white/10 p-4 rounded-sm font-mono text-xs h-32 overflow-hidden flex flex-col justify-end">
                    {systemLog.map((log, i) => (
                        <div key={i} className="mb-1 text-gray-400">
                            <span className="text-amber-600 mr-2">➜</span> {log}
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-sm space-y-8 flex-1">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Signal Parameters</h2>
                    </div>
                    
                    {/* z1 Controls */}
                    <div className="space-y-4">
                        <div className="flex justify-between font-mono text-xs items-center">
                            <span className="text-blue-400 font-bold tracking-wider">SOURCE [z1]</span>
                            <span className="bg-blue-900/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
                                {re1} {im1 >= 0 ? '+' : ''} {im1}i
                            </span>
                        </div>
                        <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <label className="text-[9px] text-gray-500 w-8">REAL</label>
                                <input type="range" min="-3" max="3" step="0.5" value={re1} onChange={(e) => setRe1(parseFloat(e.target.value))} className="w-full accent-blue-500 h-1 bg-gray-800 rounded appearance-none" />
                             </div>
                             <div className="flex items-center gap-2">
                                <label className="text-[9px] text-gray-500 w-8">IMAG</label>
                                <input type="range" min="-3" max="3" step="0.5" value={im1} onChange={(e) => setIm1(parseFloat(e.target.value))} className="w-full accent-blue-500 h-1 bg-gray-800 rounded appearance-none" />
                             </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5"></div>

                    {/* z2 Controls */}
                    <div className="space-y-4">
                        <div className="flex justify-between font-mono text-xs items-center">
                            <span className="text-green-400 font-bold tracking-wider">OPERATOR [z2]</span>
                            <span className="bg-green-900/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                                {re2} {im2 >= 0 ? '+' : ''} {im2}i
                            </span>
                        </div>
                        <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <label className="text-[9px] text-gray-500 w-8">REAL</label>
                                <input type="range" min="-2" max="2" step="0.5" value={re2} onChange={(e) => setRe2(parseFloat(e.target.value))} className="w-full accent-green-500 h-1 bg-gray-800 rounded appearance-none" />
                             </div>
                             <div className="flex items-center gap-2">
                                <label className="text-[9px] text-gray-500 w-8">IMAG</label>
                                <input type="range" min="-2" max="2" step="0.5" value={im2} onChange={(e) => setIm2(parseFloat(e.target.value))} className="w-full accent-green-500 h-1 bg-gray-800 rounded appearance-none" />
                             </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 text-[10px] text-gray-600 italic leading-relaxed">
                        "Rotation by 90° utilizes the Imaginary Axis to bypass conventional barriers. Align the output to resonate."
                    </div>
                </div>
            </div>
            
            {/* Main Visualizer */}
            <div className="lg:col-span-8 bg-black border border-white/10 rounded-sm relative shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center">
                {/* Overlay Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>

                <div className="absolute top-4 left-4 font-mono text-[10px] text-amber-500/50 tracking-widest z-10">
                    VIEWPORT: COMPLEX_PLANE_Z<br/>
                    GRID: CARTESIAN<br/>
                    SCALE: 50PX/UNIT
                </div>

                <canvas ref={canvasRef} width={900} height={700} className="w-full h-full object-contain relative z-0" />
            </div>
        </main>
        
        <style jsx global>{`
        .glow-text {
            text-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
        }
        `}</style>
    </div>
  );
}
