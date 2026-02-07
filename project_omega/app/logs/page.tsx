"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProgress } from '../contexts/ProgressContext';

export default function LogsPage() {
  const [signalIntensity, setSignalIntensity] = useState(10); // X Range (1-50)
  const [compressionActive, setCompressionActive] = useState(false); // Log Scale
  const [systemLoad, setSystemLoad] = useState(0);
  const [isStabilized, setIsStabilized] = useState(true);
  const [glitchActive, setGlitchActive] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addXp, completeLevel } = useProgress();

  // Narrative Logic
  useEffect(() => {
    // Calculate "Load" based on max value of 2^x (approximate for visualization)
    // 2^10 = 1024
    // 2^20 = 1,048,576
    // 2^30 = 1,073,741,824
    // 2^50 = 1,125,899,906,842,624 (1 Quadrillion)
    
    if (compressionActive) {
      // Log scale compresses the load: log10(2^50) ~= 15.
      // Load is manageable (linear growth on log scale).
      setSystemLoad(signalIntensity * 2); 
      setIsStabilized(true);
      setGlitchActive(false);

      // Level 2 Completion: Handling massive scale safely
      if (signalIntensity >= 40) {
        completeLevel('logs', 2); 
        addXp(50);
      }
    } else {
      // Linear scale explodes rapidly
      // Visual threshold for screen/graph "breakage" is around x=15 (32,768 vs screen height 500)
      if (signalIntensity > 15) {
        setSystemLoad(100 + (signalIntensity - 15) * 50); // Fake explosion > 100%
        setIsStabilized(false);
        setGlitchActive(true);
      } else {
        // Normalized load for low values (0-15 range)
        // 2^15 = 32768. Let's say max safe load is 100% at x=15.
        // Actually, let's map it so 100% is reached at x=12 visually for drama.
        setSystemLoad((Math.pow(2, signalIntensity) / Math.pow(2, 12)) * 100);
        setIsStabilized(true);
        setGlitchActive(false);

        // Level 1 Completion: Witnessing the initial growth safely
        if (signalIntensity >= 10 && signalIntensity <= 15) {
             completeLevel('logs', 1);
             addXp(25);
        }
      }
    }
  }, [signalIntensity, compressionActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Aesthetics
    const bgColor = isStabilized ? '#050505' : '#1a0000'; // Darker red for overload
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Grid (Faint)
    ctx.strokeStyle = isStabilized ? '#1c1c1e' : '#3a0a0a';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    const padding = 60;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Functions to plot
    const fLinear = (x: number) => x;           
    const fQuad = (x: number) => x * x;         
    const fExp = (x: number) => Math.pow(2, x); 

    // Determine max Y for scaling
    let effectiveMaxY: number;
    let rawMaxY = fExp(signalIntensity);

    if (compressionActive) {
       // In Log Mode, the Y axis represents powers of 10.
       // Max Y needs to accommodate log10(2^50) ~= 15.05.
       // Let's set a fixed max Y for stability or dynamic based on input.
       // Dynamic feels better: scale to current max Log value.
       effectiveMaxY = Math.log10(rawMaxY); 
       if (effectiveMaxY < 1) effectiveMaxY = 1; 
    } else {
       // In Linear Mode, the Y axis represents raw values.
       // We want to show the explosion. If we always scale to fit, the curve looks the same!
       // So we must fix the scale to a "reasonable" max (e.g., screen height) and let it clip.
       // Or, we scale to fit but show the numbers becoming absurd.
       // Narrative choice: The system *tries* to scale, but numbers get too big.
       // Let's scale to fit current max, but visual "Glitch" indicates instability.
       effectiveMaxY = rawMaxY;
    }

    // Coordinate Mapping
    const mapX = (x: number) => padding + (x / signalIntensity) * graphWidth;
    const mapY = (y: number) => {
        let val = y;
        if (compressionActive) {
            val = y <= 0 ? 0 : Math.log10(y);
        }
        // Avoid division by zero
        const max = effectiveMaxY || 1; 
        return (height - padding) - (val / max) * graphHeight;
    };

    // Plotting Helper
    const plot = (fn: (x: number) => number, color: string, label: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        
        let first = true;
        // Resolution: calculate enough points for smooth curve
        const steps = 200;
        
        for (let i = 0; i <= steps; i++) {
            const x = (i / steps) * signalIntensity;
            const y = fn(x);
            
            const plotX = padding + (i / steps) * graphWidth;
            const plotY = mapY(y);
            
            // Clip visual bounds (simple)
            if (plotY < padding) {
                // If point goes above graph area
                if (!first) ctx.lineTo(plotX, padding);
                break; 
            }
            
            if (first) {
                ctx.moveTo(plotX, plotY);
                first = false;
            } else {
                ctx.lineTo(plotX, plotY);
            }
        }
        ctx.stroke();
    };

    // Plot Functions
    // Only plot Linear/Quad if meaningful compared to Exp?
    // Actually, comparing them shows how insane Exp is.
    plot(fLinear, '#30d158', 'Linear'); // Green
    plot(fQuad, '#0a84ff', 'Quadratic'); // Blue
    plot(fExp, isStabilized ? '#ff9f0a' : '#ff453a', 'Exponential'); // Orange/Red

    // Axes
    ctx.strokeStyle = '#86868b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#86868b';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('0', padding - 20, height - padding + 20);
    ctx.fillText(`INTENSITY (x): ${signalIntensity}`, width - padding - 120, height - padding + 20);
    
    // Y-Axis Label
    const topLabel = compressionActive 
        ? `10^${effectiveMaxY.toFixed(1)} (Compressed)` 
        : `${Number(rawMaxY).toExponential(1)} (Raw)`;
    ctx.fillText(topLabel, padding - 40, padding - 10);
    
    // Legend
    const legendY = padding + 20;
    ctx.fillStyle = '#30d158'; ctx.fillText('Linear (x)', width - 120, legendY);
    ctx.fillStyle = '#0a84ff'; ctx.fillText('Quadratic (x²)', width - 120, legendY + 20);
    ctx.fillStyle = isStabilized ? '#ff9f0a' : '#ff453a'; ctx.fillText('Exponential (2^x)', width - 120, legendY + 40);

  }, [signalIntensity, compressionActive, isStabilized]);

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 overflow-hidden ${isStabilized ? 'bg-[#000000]' : 'bg-[#1a0505]'}`}>
        
        {/* HUD Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-16 flex items-center px-6 bg-black/80 backdrop-blur-md">
             <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">
                        ← System Root
                    </Link>
                    <div className="h-4 w-px bg-white/20"></div>
                    <h1 className="text-sm font-bold tracking-widest text-white uppercase">
                        PROTOCOL: ENTROPY_COMPRESSOR
                    </h1>
                </div>
                <div className={`text-xs font-mono px-3 py-1 rounded border ${isStabilized ? 'border-cyan-900 text-cyan-500 bg-cyan-900/10' : 'border-red-900 text-red-500 bg-red-900/10 animate-pulse'}`}>
                    STATUS: {isStabilized ? 'NOMINAL' : 'CRITICAL OVERLOAD'}
                </div>
             </div>
        </header>

        <main className="pt-24 p-6 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
            
            {/* Control Panel */}
            <div className="w-full lg:w-1/3 space-y-6">
                <div className={`bg-[#111] p-6 rounded border ${isStabilized ? 'border-white/10' : 'border-red-500/50'} space-y-6 relative overflow-hidden transition-all duration-300`}>
                    {/* Scanlines */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Input Parameters</h2>
                        
                        {/* Intensity Slider */}
                        <div className="space-y-2 mb-8">
                             <div className="flex justify-between text-xs font-mono text-gray-400">
                                <span>SIGNAL INTENSITY (x)</span>
                                <span className={signalIntensity > 15 && !compressionActive ? 'text-red-500 animate-pulse' : 'text-cyan-500'}>
                                    {signalIntensity} {signalIntensity > 15 && !compressionActive && '⚠️'}
                                </span>
                             </div>
                             <input 
                                type="range" min="1" max="50" step="1" 
                                value={signalIntensity} 
                                onChange={(e) => setSignalIntensity(parseInt(e.target.value))}
                                className={`w-full h-1 rounded-lg appearance-none cursor-pointer hover:opacity-100 opacity-80 transition-opacity ${isStabilized ? 'bg-gray-800 accent-cyan-500' : 'bg-red-900/50 accent-red-500'}`}
                            />
                        </div>

                        {/* Compression Toggle */}
                        <div className={`flex items-center justify-between p-4 rounded border transition-colors duration-300 ${compressionActive ? 'bg-cyan-900/20 border-cyan-500/30' : 'bg-[#0a0a0a] border-white/5'}`}>
                             <div className="space-y-1">
                                <span className={`block text-xs font-bold ${compressionActive ? 'text-cyan-400' : 'text-gray-300'}`}>
                                    LOGARITHMIC COMPRESSION
                                </span>
                                <span className="block text-[10px] text-gray-500">Scale: log₁₀(x)</span>
                             </div>
                             <button 
                                onClick={() => setCompressionActive(!compressionActive)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${compressionActive ? 'bg-cyan-600' : 'bg-gray-800'}`}
                             >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${compressionActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                             </button>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="relative z-10 pt-6 border-t border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-gray-500">ENTROPY LOAD</span>
                            <span className={isStabilized ? 'text-green-500' : 'text-red-500 animate-pulse'}>
                                {Math.min(systemLoad, 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-300 ${isStabilized ? 'bg-cyan-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(systemLoad, 100)}%` }}
                            ></div>
                        </div>
                        <div className="text-[10px] text-gray-600 font-mono mt-2">
                             MAGNITUDE: 2^{signalIntensity} ≈ 10^{ (signalIntensity * 0.301).toFixed(2) }
                        </div>
                    </div>
                </div>

                {/* System Log / Lore */}
                <div className="bg-[#111] p-6 rounded border border-white/10 text-xs text-gray-400 leading-relaxed font-mono h-48 overflow-y-auto custom-scrollbar">
                    <p className="mb-4 text-gray-500 border-b border-white/5 pb-2">SYSTEM LOG // {new Date().toLocaleDateString()}</p>
                    
                    {!compressionActive && signalIntensity <= 15 && (
                        <p>
                            <span className="text-green-500">[NOMINAL]</span> Signal intensity within linear tolerance limits. Exponential growth is observable but contained.
                        </p>
                    )}
                    
                    {!compressionActive && signalIntensity > 15 && (
                        <div className="space-y-2">
                            <p className="text-red-500 animate-pulse">[CRITICAL] ENTROPY RUNAWAY DETECTED.</p>
                            <p>Linear visualization failing. Magnitude exceeding screen buffer (2^{signalIntensity}).</p>
                            <p>RECOMMENDATION: Engage Logarithmic Compression immediately.</p>
                        </div>
                    )}

                    {compressionActive && (
                        <div className="space-y-2">
                            <p className="text-cyan-500">[ACTIVE] LOGARITHMIC SCALE ENGAGED.</p>
                            <p>Explosion contained. Exponential curve ($2^x$) mapped to linear trajectory ($y = x \cdot \log 2$).</p>
                            <p>System stability restored. Massive magnitudes ($10^{15}$) now renderable.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Viewport */}
            <div className={`w-full lg:w-2/3 bg-[#050505] rounded border transition-colors duration-300 ${isStabilized ? 'border-white/10' : 'border-red-500/50 shadow-[0_0_50px_rgba(255,0,0,0.2)]'} p-1 flex justify-center items-center overflow-hidden relative min-h-[500px]`}>
                
                <canvas ref={canvasRef} width={800} height={500} className="w-full h-auto max-w-full z-10" />
                
                {/* Glitch Overlay */}
                {glitchActive && (
                    <>
                        <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay pointer-events-none z-20"></div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                            <div className="bg-black/80 border border-red-500 text-red-500 px-8 py-4 font-bold tracking-[0.2em] text-xl animate-pulse shadow-2xl">
                                SIGNAL LOST
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    </div>
  );
}
