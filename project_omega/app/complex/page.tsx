"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function ComplexPage() {
  const [re1, setRe1] = useState(1);
  const [im1, setIm1] = useState(0);
  const [re2, setRe2] = useState(0);
  const [im2, setIm2] = useState(1); // i
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Narrative State
  const [resonance, setResonance] = useState(false);

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

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Grid (The Void Grid)
    ctx.strokeStyle = '#e5e7eb'; // Light gray
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += scale) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let i = 0; i < height; i += scale) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    // Axes (Material vs Void)
    ctx.strokeStyle = '#6b7280'; // Gray 500
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(width, cy); // Real (Material)
    ctx.moveTo(cx, 0); ctx.lineTo(cx, height); // Imaginary (Void)
    ctx.stroke();

    // Helper: Draw Vector
    const drawVector = (re: number, im: number, color: string, label: string, isResult = false) => {
        const x = cx + re * scale;
        const y = cy - im * scale; // Invert Y
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = isResult ? 4 : 3;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Arrowhead / Node
        ctx.beginPath();
        ctx.arc(x, y, isResult ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.font = isResult ? 'bold 16px monospace' : '14px monospace';
        ctx.fillStyle = isResult ? color : '#6b7280';
        ctx.fillText(label, x + 12, y - 5);
    };

    // Draw Source Signal (z1)
    drawVector(re1, im1, '#3b82f6', 'SOURCE [z1]'); // Blue
    
    // Draw Phase Operator (z2)
    drawVector(re2, im2, '#10b981', 'OPERATOR [z2]'); // Green

    // Calculate Result (Shifted Signal)
    const pRe = re1 * re2 - im1 * im2;
    const pIm = re1 * im2 + im1 * re2;

    // Resonance Check (Pure Real or Pure Imaginary)
    const isResonant = (Math.abs(pRe) < 0.1 && Math.abs(pIm) > 0.1) || (Math.abs(pIm) < 0.1 && Math.abs(pRe) > 0.1);
    setResonance(isResonant);

    const resultColor = isResonant ? '#f59e0b' : '#ef4444'; // Gold if resonant, Red if unstable
    drawVector(pRe, pIm, resultColor, isResonant ? 'RESONANCE [Synced]' : 'OUTPUT [Unstable]', true);

  }, [re1, im1, re2, im2]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] text-gray-900 font-sans">
        {/* HUD Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center px-6 fixed w-full z-10 justify-between">
             <div className="flex items-center gap-4">
                 <Link href="/" className="text-xs font-mono text-gray-500 hover:text-black tracking-widest">
                    // SYSTEM_ROOT
                 </Link>
                 <div className="h-4 w-[1px] bg-gray-300"></div>
                 <h1 className="font-mono font-bold text-gray-800 tracking-tight">
                    VOID PHASE ANALYZER <span className="text-gray-400 font-normal ml-2">v2.0</span>
                 </h1>
             </div>
             <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${resonance ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`}></div>
                 <span className="text-xs font-mono text-gray-500">{resonance ? 'PHASE_LOCKED' : 'MONITORING'}</span>
             </div>
        </header>

        <main className="pt-24 p-6 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
            {/* Control Panel */}
            <div className="w-full lg:w-1/3 space-y-6">
                
                {/* Mission Brief */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-2">
                    <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Protocol Description</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Reality consists of <span className="font-bold text-gray-800">Material (Real)</span> and <span className="font-bold text-gray-800">Void (Imaginary)</span> components.
                        <br/><br/>
                        Use the <span className="text-green-600 font-mono">Phase Operator</span> to rotate the <span className="text-blue-600 font-mono">Source Signal</span> through the Void dimension.
                        <br/><br/>
                        <span className="italic text-gray-400 text-xs">"Multiplication by $i$ is a 90° rotation into the unseen."</span>
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-6">
                    <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Signal Parameters</h2>
                    
                    {/* z1 Controls */}
                    <div className="space-y-3">
                        <div className="flex justify-between font-mono text-xs items-center">
                            <span className="text-gray-500">SOURCE SIGNAL [z1]</span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                {re1} {im1 >= 0 ? '+' : ''} {im1}i
                            </span>
                        </div>
                        <div className="flex gap-3 items-center">
                            <label className="w-6 text-[10px] font-bold text-gray-400 text-right">MAT</label>
                            <input type="range" min="-3" max="3" step="0.5" value={re1} onChange={(e) => setRe1(parseFloat(e.target.value))} className="flex-1 accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div className="flex gap-3 items-center">
                            <label className="w-6 text-[10px] font-bold text-gray-400 text-right">VOID</label>
                            <input type="range" min="-3" max="3" step="0.5" value={im1} onChange={(e) => setIm1(parseFloat(e.target.value))} className="flex-1 accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>

                    <div className="h-[1px] bg-gray-100 w-full"></div>

                    {/* z2 Controls */}
                    <div className="space-y-3">
                        <div className="flex justify-between font-mono text-xs items-center">
                            <span className="text-gray-500">PHASE OPERATOR [z2]</span>
                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                                {re2} {im2 >= 0 ? '+' : ''} {im2}i
                            </span>
                        </div>
                        <div className="flex gap-3 items-center">
                            <label className="w-6 text-[10px] font-bold text-gray-400 text-right">MAT</label>
                            <input type="range" min="-2" max="2" step="0.5" value={re2} onChange={(e) => setRe2(parseFloat(e.target.value))} className="flex-1 accent-green-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div className="flex gap-3 items-center">
                            <label className="w-6 text-[10px] font-bold text-gray-400 text-right">VOID</label>
                            <input type="range" min="-2" max="2" step="0.5" value={im2} onChange={(e) => setIm2(parseFloat(e.target.value))} className="flex-1 accent-green-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* Status Output */}
                 <div className={`p-4 rounded-xl border ${resonance ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    <div className="flex items-start gap-3">
                        <div className="pt-1">
                            {resonance ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            )}
                        </div>
                        <div>
                            <p className="font-mono text-xs font-bold uppercase mb-1">
                                {resonance ? 'Resonance Achieved' : 'Signal Unstable'}
                            </p>
                            <p className="text-sm opacity-90">
                                {resonance 
                                    ? "Phase alignment confirmed. The signal is now orthogonal to the noise floor." 
                                    : "Rotate the operator to align the output with a cardinal axis."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Main Visualizer */}
            <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex justify-center items-center relative overflow-hidden">
                <div className="absolute top-4 left-4 font-mono text-xs text-gray-300">
                    VISUAL_FEED: ACTIVE<br/>
                    SCALE: 50:1
                </div>
                <canvas ref={canvasRef} width={800} height={600} className="w-full h-auto max-w-[800px]" />
            </div>
        </main>
    </div>
  );
}
