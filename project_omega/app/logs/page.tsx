"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProgress } from '../contexts/ProgressContext';

export default function LogsPage() {
  const [signalIntensity, setSignalIntensity] = useState(10); // X Range
  const [compressionActive, setCompressionActive] = useState(false); // Log Scale
  const [systemLoad, setSystemLoad] = useState(0);
  const [isStabilized, setIsStabilized] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addXp, completeLevel } = useProgress();

  // Narrative Logic
  useEffect(() => {
    // Calculate "Load" based on max value of 2^x
    const maxVal = Math.pow(2, signalIntensity);
    
    if (compressionActive) {
      // Log scale compresses the load
      setSystemLoad(signalIntensity * 10); // Linear growth
      setIsStabilized(true);
      if (signalIntensity >= 40) {
        completeLevel('logs', 1); // Award XP for handling max intensity safely
      }
    } else {
      // Linear scale explodes
      if (signalIntensity > 15) {
        setSystemLoad(100 + (signalIntensity - 15) * 1000); // Fake explosion
        setIsStabilized(false);
      } else {
        setSystemLoad(maxVal / 100); // Normalized for low values
        setIsStabilized(true);
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
    const bgColor = isStabilized ? '#0a0a0a' : '#1a0505';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Grid
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
    // In Linear mode, max Y is determined by fExp(signalIntensity)
    // In Log mode, max Y is log10(fExp(signalIntensity)) which is approx 0.3 * signalIntensity
    
    let effectiveMaxY: number;
    let rawMaxY = fExp(signalIntensity);

    if (compressionActive) {
       effectiveMaxY = Math.log10(rawMaxY); // The visual max is the log value
    } else {
       effectiveMaxY = rawMaxY;
       // Cap visual max to prevent drawing flatness for low values if range is huge
       // But here we want to show the explosion
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
        for (let pixelX = 0; pixelX <= graphWidth; pixelX++) {
            const x = (pixelX / graphWidth) * signalIntensity;
            const y = fn(x);
            const plotX = padding + pixelX;
            const plotY = mapY(y);
            
            // Clip
            if (plotY < padding) {
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
    ctx.fillText(`INTENSITY: ${signalIntensity}`, width - padding - 80, height - padding + 20);
    
    // Y-Axis Label
    const topLabel = compressionActive 
        ? `10^${Math.round(effectiveMaxY)} (Compressed)` 
        : `${Number(rawMaxY).toExponential(1)} (Raw)`;
    ctx.fillText(topLabel, padding - 40, padding - 10);

  }, [signalIntensity, compressionActive, isStabilized]);

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${isStabilized ? 'bg-[#000000]' : 'bg-[#1a0505]'}`}>
        
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
                <div className={`text-xs font-mono px-3 py-1 rounded border ${isStabilized ? 'border-green-900 text-green-500 bg-green-900/10' : 'border-red-900 text-red-500 bg-red-900/10 animate-pulse'}`}>
                    STATUS: {isStabilized ? 'STABLE' : 'CRITICAL OVERLOAD'}
                </div>
             </div>
        </header>

        <main className="pt-24 p-6 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
            
            {/* Control Panel */}
            <div className="w-full lg:w-1/3 space-y-6">
                <div className="bg-[#111] p-6 rounded border border-white/10 space-y-6 relative overflow-hidden">
                    {/* Scanlines */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Input Parameters</h2>
                        
                        {/* Intensity Slider */}
                        <div className="space-y-2 mb-8">
                             <div className="flex justify-between text-xs font-mono text-gray-400">
                                <span>SIGNAL INTENSITY</span>
                                <span className={signalIntensity > 30 ? 'text-red-500' : 'text-cyan-500'}>
                                    {signalIntensity} {signalIntensity > 30 && '⚠️'}
                                </span>
                             </div>
                             <input 
                                type="range" min="5" max="50" step="1" 
                                value={signalIntensity} 
                                onChange={(e) => setSignalIntensity(parseInt(e.target.value))}
                                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                            />
                        </div>

                        {/* Compression Toggle */}
                        <div className="flex items-center justify-between bg-[#0a0a0a] p-4 rounded border border-white/5">
                             <div className="space-y-1">
                                <span className="block text-xs font-bold text-gray-300">LOGARITHMIC COMPRESSION</span>
                                <span className="block text-[10px] text-gray-600">Scale: log₁₀(x)</span>
                             </div>
                             <button 
                                onClick={() => setCompressionActive(!compressionActive)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${compressionActive ? 'bg-cyan-900' : 'bg-gray-800'}`}
                             >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${compressionActive ? 'translate-x-6 bg-cyan-400' : 'translate-x-0'}`}></div>
                             </button>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="relative z-10 pt-6 border-t border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-gray-500">LINEAR LOAD</span>
                            <span className={isStabilized ? 'text-green-500' : 'text-red-500'}>
                                {isStabilized ? 'NOMINAL' : 'CRITICAL (EXPONENTIAL)'}
                            </span>
                        </div>
                        <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-300 ${isStabilized ? 'bg-cyan-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(systemLoad, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Briefing */}
                <div className="bg-[#111] p-6 rounded border border-white/10 text-xs text-gray-400 leading-relaxed font-mono">
                    <p className="mb-2">
                        <span className="text-cyan-500">SYSTEM ADVISORY:</span> Unchecked exponential growth (2^x) rapidly exceeds system limits.
                    </p>
                    <p>
                        Engage <span className="text-white">Logarithmic Compression</span> to map exponential data into linear space. This allows visualization of massive entropy scales without rendering failure.
                    </p>
                </div>
            </div>
            
            {/* Viewport */}
            <div className="w-full lg:w-2/3 bg-[#050505] rounded border border-white/10 p-1 flex justify-center items-center overflow-hidden relative min-h-[500px] shadow-2xl">
                <canvas ref={canvasRef} width={800} height={500} className="w-full h-auto max-w-full z-10" />
                
                {/* Warning Overlay */}
                {!isStabilized && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 backdrop-blur-[2px] z-20 pointer-events-none animate-pulse">
                        <div className="border border-red-500 bg-black/80 px-6 py-4 rounded text-red-500 font-bold tracking-widest uppercase text-sm shadow-[0_0_30px_rgba(255,0,0,0.5)]">
                            ⚠️ SIGNAL OVERLOAD
                        </div>
                    </div>
                )}
            </div>
        </main>
    </div>
  );
}
