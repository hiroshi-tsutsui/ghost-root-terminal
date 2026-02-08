"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgress } from '../contexts/ProgressContext';

// --- Protocol Definition ---
const PROTOCOLS = {
    1: {
        title: "PHASE 1: LINEAR OBSERVATION",
        mission: "Observe the growth curve in standard linear space.",
        target: "Reach Intensity 12.",
        trigger: (val: number, mode: boolean) => !mode && val >= 12 && val < 16
    },
    2: {
        title: "PHASE 2: BOUNDARY FAILURE",
        mission: "Push the signal beyond system limits. Witness the overflow.",
        target: "Reach Intensity 16 (CRITICAL).",
        trigger: (val: number, mode: boolean) => !mode && val >= 16
    },
    3: {
        title: "PHASE 3: LOGARITHMIC CONTAINMENT",
        mission: "Activate Compression. Stabilize the infinite signal.",
        target: "Enable Log Mode. Reach Intensity 50.",
        trigger: (val: number, mode: boolean) => mode && val >= 50
    }
};

export default function LogsPage() {
  const { completeLevel } = useProgress();
  
  // State
  const [signalIntensity, setSignalIntensity] = useState(5); // Start low
  const [compressionActive, setCompressionActive] = useState(false);
  const [systemLoad, setSystemLoad] = useState(0);
  const [isStabilized, setIsStabilized] = useState(true);
  const [glitchActive, setGlitchActive] = useState(false);
  
  // Protocol State
  const [level, setLevel] = useState(1); // 1, 2, 3
  const [showComplete, setShowComplete] = useState(false);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addLog = (msg: string) => setSystemLogs(prev => [msg, ...prev].slice(0, 5));

  // --- Game Loop ---
  useEffect(() => {
    // 1. Calculate Load
    let currentLoad = 0;
    
    if (compressionActive) {
      // Log Scale: 2^50 is handled easily.
      // 50 input -> 100% load visually for feedback
      currentLoad = (signalIntensity / 50) * 80; 
      setIsStabilized(true);
      setGlitchActive(false);
    } else {
      // Linear Scale: Explodes at 16
      if (signalIntensity >= 16) {
        currentLoad = 120; // Critical
        setIsStabilized(false);
        setGlitchActive(true);
      } else {
        // 0-15 maps to 0-100%
        currentLoad = (signalIntensity / 15) * 100;
        setIsStabilized(true);
        setGlitchActive(false);
      }
    }
    setSystemLoad(currentLoad);

    // 2. Check Protocol Triggers
    const currentProtocol = PROTOCOLS[level as keyof typeof PROTOCOLS];
    if (currentProtocol && currentProtocol.trigger(signalIntensity, compressionActive)) {
        if (level === 1) {
            setLevel(2);
            completeLevel('logs', 1);
            addLog("PHASE 1 COMPLETE. LINEAR LIMIT REACHED.");
        } else if (level === 2) {
            setLevel(3);
            addLog("SYSTEM FAILURE CONFIRMED. UNLOCKING COMPRESSION PROTOCOL.");
        } else if (level === 3) {
            completeLevel('logs', 3);
            addLog("PHASE 3 COMPLETE. INFINITY STABILIZED.");
            setShowComplete(true);
        }
    }

  }, [signalIntensity, compressionActive, level, completeLevel]);

  // --- Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background
    const bgColor = isStabilized ? '#050505' : '#1a0000';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = isStabilized ? '#1c1c1e' : '#3a0a0a';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let i = 0; i < width; i += gridSize) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let i = 0; i < height; i += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    const padding = 60;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Functions
    const fExp = (x: number) => Math.pow(2, x); 

    // Scaling Logic
    let maxValY = 0;
    if (compressionActive) {
        // Log Mode: Max Y is log10(2^50) ≈ 15.05
        maxValY = 16; 
    } else {
        // Linear Mode: Max Y is fixed to screen height relative to 2^15
        maxValY = 32768; 
    }

    // Plotter
    const plot = (fn: (x: number) => number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        const steps = 100;
        let first = true;

        for (let i = 0; i <= steps; i++) {
            const x = (i / steps) * signalIntensity;
            let y = fn(x);

            // Apply Log if active
            if (compressionActive) {
                y = y <= 0 ? 0 : Math.log10(y);
            }

            const px = padding + (x / signalIntensity) * graphWidth; // X scales to fit width always
            
            // Y Scaling
            // In Linear Mode, if y > maxValY, it goes off screen.
            const py = (height - padding) - (y / maxValY) * graphHeight;

            if (py < padding) {
                if (!first) ctx.lineTo(px, padding);
                break;
            }

            if (first) { ctx.moveTo(px, py); first = false; }
            else { ctx.lineTo(px, py); }
        }
        ctx.stroke();
    };

    plot(fExp, isStabilized ? '#f59e0b' : '#ef4444'); // Amber or Red

    // Labels
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText("0", padding - 10, height - padding + 15);
    ctx.fillText(`x=${signalIntensity}`, width - padding - 20, height - padding + 15);

    // Y Axis Label
    const yLabel = compressionActive ? "10^16 (LOG)" : "3.2e4 (LIN)";
    ctx.fillText(yLabel, padding - 40, padding - 10);

  }, [signalIntensity, compressionActive, isStabilized]);


  return (
    <div className={`min-h-screen font-mono transition-colors duration-500 selection:bg-rose-900 ${isStabilized ? 'bg-black text-white' : 'bg-[#1a0000] text-red-100'}`}>
        
        {/* Completion Modal */}
        <AnimatePresence>
        {showComplete && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            >
                <div className="max-w-md w-full border border-rose-500/50 bg-black p-8 relative overflow-hidden shadow-[0_0_100px_rgba(244,63,94,0.2)]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse"></div>
                    
                    <h2 className="text-2xl font-bold text-rose-500 mb-2 tracking-widest uppercase">PROTOCOL COMPLETE</h2>
                    <p className="text-xs text-gray-500 mb-6 font-mono">ENTROPY COMPRESSOR ONLINE. SCALE STABILIZED.</p>
                    
                    <div className="space-y-4 mb-8 border-l-2 border-rose-500/20 pl-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">STATUS</span>
                            <span className="text-rose-400">OPTIMAL</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-400">SYSTEM LOG</span>
                            <span className="text-white animate-pulse">FILE_009 DECRYPTED</span>
                        </div>
                    </div>

                    <Link href="/codex" className="block w-full text-center py-3 bg-rose-600 text-black font-bold tracking-[0.2em] hover:bg-white transition-colors uppercase text-xs">
                        ACCESS CODEX
                    </Link>
                     <Link href="/" className="block w-full text-center py-3 mt-2 border border-white/10 text-gray-500 hover:text-white transition-colors uppercase text-[10px] tracking-widest">
                        RETURN TO TERMINAL
                    </Link>
                </div>
            </motion.div>
        )}
        </AnimatePresence>

        {/* Header */}
        <header className="fixed top-0 w-full border-b border-white/10 bg-black/80 backdrop-blur-md z-50 h-16 flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
                <Link href="/" className="text-xs text-gray-500 hover:text-white uppercase tracking-widest transition-colors">
                    ← SYSTEM ROOT
                </Link>
                <div className="h-4 w-px bg-white/20"></div>
                <h1 className="text-sm font-bold tracking-widest text-rose-500 uppercase">
                    PROTOCOL: ENTROPY_COMPRESSOR
                </h1>
            </div>
            <div className="flex gap-4 text-xs font-bold">
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded">PHASE {level}/3</div>
                <div className={`px-3 py-1 border rounded transition-colors ${isStabilized ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'}`}>
                    {isStabilized ? 'STABLE' : 'CRITICAL'}
                </div>
            </div>
        </header>

        <main className="pt-24 p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-6rem)]">
            
            {/* Sidebar Controls */}
            <div className="space-y-6">
                
                {/* Mission Card */}
                <div className={`p-4 border-l-2 rounded-r bg-[#0a0a0a] ${isStabilized ? 'border-rose-500' : 'border-red-500 animate-pulse'}`}>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Current Objective</div>
                    <div className="text-sm font-bold text-white mb-2">{PROTOCOLS[level as keyof typeof PROTOCOLS]?.title}</div>
                    <div className="text-xs text-gray-400 font-mono mb-4">{PROTOCOLS[level as keyof typeof PROTOCOLS]?.mission}</div>
                    <div className="text-[10px] px-2 py-1 bg-white/10 inline-block rounded text-rose-400">
                        TARGET: {PROTOCOLS[level as keyof typeof PROTOCOLS]?.target}
                    </div>
                </div>

                {/* Controls */}
                <div className="p-6 border border-white/10 bg-[#111] rounded space-y-8">
                    
                    {/* Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono text-gray-400">
                            <span>INPUT INTENSITY</span>
                            <span className={!isStabilized ? 'text-red-500 font-bold' : 'text-rose-400'}>{signalIntensity}</span>
                        </div>
                        <input 
                            type="range" min="1" max={compressionActive ? "60" : "20"} step="1"
                            value={signalIntensity}
                            onChange={(e) => setSignalIntensity(Number(e.target.value))}
                            className={`w-full h-1 appearance-none cursor-pointer rounded ${isStabilized ? 'bg-gray-800 accent-rose-500' : 'bg-red-900 accent-red-600'}`}
                        />
                        <div className="flex justify-between text-[10px] text-gray-600">
                            <span>1</span>
                            <span>{compressionActive ? 'INF' : 'FAIL_POINT'}</span>
                        </div>
                    </div>

                    {/* Toggle */}
                    <div className={`flex items-center justify-between p-4 rounded border transition-all ${level < 3 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'} ${compressionActive ? 'bg-rose-900/20 border-rose-500/50' : 'bg-black border-white/10'}`}>
                        <div className="space-y-1">
                            <span className="block text-xs font-bold text-gray-300">LOG MODE</span>
                            <span className="block text-[10px] text-gray-600">COMPRESSION ALGORITHM</span>
                        </div>
                        <button 
                            onClick={() => level >= 3 && setCompressionActive(!compressionActive)}
                            disabled={level < 3}
                            className={`w-10 h-5 rounded-full p-1 transition-colors ${compressionActive ? 'bg-rose-500' : 'bg-gray-800'}`}
                        >
                            <div className={`w-3 h-3 rounded-full bg-white transition-transform ${compressionActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    {/* System Log */}
                    <div className="h-32 overflow-hidden border-t border-white/10 pt-4 flex flex-col-reverse text-[10px] font-mono text-gray-500 gap-1">
                        {systemLogs.map((log, i) => (
                            <div key={i} className="text-rose-500/70">
                                <span className="text-gray-700 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log}
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            {/* Visualizer */}
            <div className="lg:col-span-2 border border-white/10 bg-black relative shadow-[0_0_50px_rgba(244,63,94,0.05)]">
                <div className="absolute top-2 left-2 text-[10px] text-white/20">VIEWPORT_01 // ENTROPY_VISUALIZER</div>
                {glitchActive && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-red-900/20 backdrop-blur-[2px]">
                        <div className="text-4xl font-black text-red-500 tracking-[0.5em] animate-pulse">SYSTEM OVERLOAD</div>
                    </div>
                )}
                <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />
            </div>

        </main>
    </div>
  );
}
