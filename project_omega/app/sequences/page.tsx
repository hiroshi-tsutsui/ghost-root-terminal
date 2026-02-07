// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProgress } from '../contexts/ProgressContext';

export default function SequencesPage() {
  const [n, setN] = useState(20); // Simulation Depth
  const [a, setA] = useState(1);  // Anchor Point
  const [d, setD] = useState(1);  // Linear Velocity
  const [r, setR] = useState(1.1); // Divergence Factor
  
  // Protocol State
  const [isProtocolActive, setIsProtocolActive] = useState(false);
  const [level, setLevel] = useState(1);
  const [protocolStep, setProtocolStep] = useState(0);
  const [systemLog, setSystemLog] = useState("System Idle. Awaiting Chronos Protocol initialization...");
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [syncStatus, setSyncStatus] = useState("STABLE");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { completeLevel } = useProgress();

  // --- Chronos Protocols ---
  const PROTOCOLS = {
    1: {
      title: "PHASE 1: LINEAR ANCHOR",
      steps: [
        {
          message: "[SYSTEM]: Temporal drift detected. The timeline is fluctuating unpredictably.\n[MISSION]: Establish a stable linear flow. Set Linear Velocity (Δt) to +2.0 to sync with the Universal Clock.\n[STATUS]: WAITING...",
          check: () => d === 2 && r === 1, // Ensure r is 1 for pure linear
          setup: () => { setA(0); setD(1); setR(1); },
          isBriefing: true
        },
        {
          message: "[ALERT]: Linear Velocity deviation. Adjust 'd' to exactly 2.0. Ensure Divergence 'r' is locked at 1.0 (Stasis).",
          check: () => d === 2 && r === 1
        },
        {
          message: "[SUCCESS]: Linear flow established. Temporal anchor secured.\n[SYSTEM]: Proceed to Phase 2.",
          check: () => true,
          isFinal: true
        }
      ]
    },
    2: {
      title: "PHASE 2: ENTROPY DAMPENING",
      steps: [
        {
          message: "[SYSTEM]: CRITICAL ALERT. Exponential runaway detected in Sector 7. The signal is growing uncontrollably.\n[MISSION]: Apply an Entropy Dampener. Set Divergence Factor (φ) to 0.5 to collapse the wave.\n[STATUS]: DANGER",
          check: () => r === 0.5,
          setup: () => { setA(100); setD(0); setR(2); }, // Start with runaway
          isBriefing: true
        },
        {
          message: "[WARNING]: Signal strength critical (200% growth/step). Reduce 'r' immediately to decay range (< 1.0). Target: 0.5x.",
          check: () => r === 0.5
        },
        {
          message: "[SUCCESS]: Entropy stabilized. Signal decaying within safe limits.\n[SYSTEM]: Proceed to Phase 3.",
          check: () => true,
          isFinal: true
        }
      ]
    },
    3: {
      title: "PHASE 3: STASIS LOCK",
      steps: [
        {
          message: "[SYSTEM]: The timeline needs to be frozen for inspection. We need absolute zero change.\n[MISSION]: Achieve Total Stasis. Linear Velocity = 0. Divergence = 1.0.\n[STATUS]: PENDING",
          check: () => d === 0 && r === 1,
          setup: () => { setA(50); setD(5); setR(0.9); },
          isBriefing: true
        },
        {
          message: "[GUIDANCE]: Kill the momentum. Set Δt (d) to 0. Lock the multiplier φ (r) to 1.0.",
          check: () => d === 0 && r === 1
        },
        {
          message: "[SUCCESS]: TIME FREEZE SUCCESSFUL. CHRONOS MODULE SYNCHRONIZED.\n[SYSTEM]: GOOD WORK, OPERATOR.",
          check: () => true,
          isFinal: true
        }
      ]
    }
  };

  // --- Protocol Logic ---
  useEffect(() => {
    if (!isProtocolActive) {
        // Sandbox logic for status
        if (r > 1.5) setSyncStatus("CRITICAL: EXPONENTIAL RUNAWAY");
        else if (r < 0.5) setSyncStatus("WARNING: SIGNAL DECAY");
        else if (r === 1 && d === 0) setSyncStatus("STASIS: ABSOLUTE ZERO");
        else if (r === 1) setSyncStatus("STASIS: LINEAR LOCK");
        else setSyncStatus("OPERATIONAL: FLUX WITHIN LIMITS");
        return;
    }

    const currentLevelData = PROTOCOLS[level];
    if (!currentLevelData) return;

    const currentStepData = currentLevelData.steps[protocolStep];
    if (!currentStepData) return;

    // Run setup if needed
    if (currentStepData.setup && !taskCompleted) {
        // Simple check to prevent infinite loop: if we are already "close" to setup, don't run. 
        // Or better: use a ref or just rely on the user moving sliders away.
        // For now, we only run setup on the FIRST step of a level.
        if (protocolStep === 0 && systemLog !== currentStepData.message) {
             currentStepData.setup();
        }
    }

    setSystemLog(currentStepData.message);
    setSyncStatus(currentLevelData.title);

    if (currentStepData.check()) {
        if (!taskCompleted) setTaskCompleted(true);
    } else {
        setTaskCompleted(false);
    }
  }, [n, a, d, r, isProtocolActive, level, protocolStep, taskCompleted]);

  const advanceProtocol = () => {
      const currentLevelData = PROTOCOLS[level];
      const currentStepData = currentLevelData.steps[protocolStep];

      if (currentStepData.isFinal) {
          completeLevel('sequences', level);
          if (PROTOCOLS[level + 1]) {
              setLevel(level + 1);
              setProtocolStep(0);
          } else {
              setSystemLog("[SYSTEM]: CHRONOS PROTOCOL COMPLETE. TIMELINE STABILIZED.");
              setIsProtocolActive(false);
              setSyncStatus("OPTIMAL");
          }
      } else {
          setProtocolStep(protocolStep + 1);
      }
      setTaskCompleted(false);
  };

  // --- Drawing ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear with Void Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Grid System
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let i = 0; i < height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    // Padding & Scaling
    const padding = 60;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const arithmeticData: number[] = [];
    const geometricData: number[] = [];
    
    for (let i = 0; i < n; i++) {
        arithmeticData.push(a + i * d);
        geometricData.push(a * Math.pow(r, i));
    }

    const maxVal = Math.max(...arithmeticData, ...geometricData, 10);
    const minVal = Math.min(...arithmeticData, ...geometricData, 0);
    const range = maxVal - minVal || 1;

    // Helper: Map coordinates
    const mapX = (i: number) => padding + (i / (n - 1)) * graphWidth;
    const mapY = (val: number) => (height - padding) - ((val - minVal) / range) * graphHeight;

    // Helper: Draw Glowing Line
    const drawTrace = (data: number[], color: string, glowColor: string, active: boolean) => {
        if (!active) return;
        ctx.shadowBlur = 15;
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        data.forEach((val, i) => {
            if (i === 0) ctx.moveTo(mapX(i), mapY(val));
            else ctx.lineTo(mapX(i), mapY(val));
        });
        ctx.stroke();
        
        // Reset Shadow for dots
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        data.forEach((val, i) => {
            ctx.beginPath();
            ctx.arc(mapX(i), mapY(val), 3, 0, Math.PI * 2);
            ctx.fill();
        });
    };

    // Draw Traces
    // In Protocol mode, highlighting specific traces could be cool
    drawTrace(arithmeticData, '#00f2ff', '#00f2ff', true); // Cyan (Linear)
    drawTrace(geometricData, '#ff0055', '#ff0055', true); // Magenta (Exponential)

    // UI Overlay on Canvas
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#00f2ff';
    ctx.fillText(`LINEAR_TRACE: +${d}/step`, padding, 30);
    ctx.fillStyle = '#ff0055';
    ctx.fillText(`DIVERGENCE_TRACE: x${r}/step`, padding, 50);

  }, [n, a, d, r]);

  const currentStepIsBriefing = PROTOCOLS[level]?.steps[protocolStep]?.isBriefing;

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-mono selection:bg-cyan-900 selection:text-white">
        <header className="border-b border-gray-800 h-16 flex items-center justify-between px-6 bg-black/90 backdrop-blur fixed w-full z-20">
             <div className="flex items-center gap-4">
                 <Link href="/" className="text-xs text-cyan-500 hover:text-cyan-400 tracking-widest uppercase">
                    &lt; SYSTEM_ROOT
                 </Link>
                 <h1 className="text-lg font-bold tracking-widest text-white">
                    <span className="text-cyan-500">CHRONOS</span> // PATTERN_RECOGNITION
                 </h1>
             </div>
             <div className="flex items-center gap-4">
                <button 
                    onClick={() => {
                        setIsProtocolActive(!isProtocolActive);
                        if (!isProtocolActive) {
                            setLevel(1);
                            setProtocolStep(0);
                            setA(0); setD(1); setR(1);
                        }
                    }}
                    className={`px-4 py-1.5 rounded-sm text-xs font-bold tracking-widest border transition-all ${
                        isProtocolActive 
                        ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                        : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}
                >
                    {isProtocolActive ? 'PROTOCOL: ACTIVE' : 'PROTOCOL: STANDBY'}
                </button>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${syncStatus.includes("CRITICAL") ? "bg-red-500 animate-pulse" : "bg-green-500"}`}></div>
                    <span className="text-xs text-gray-400 tracking-wider hidden md:block">{syncStatus}</span>
                </div>
             </div>
        </header>

        <main className="pt-24 p-6 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
            
            {/* Control Panel */}
            <div className="w-full lg:w-1/3 space-y-6 order-2 lg:order-1">
                
                {/* Protocol Log */}
                {isProtocolActive && (
                    <div className={`p-4 bg-black border-l-2 rounded-r-sm shadow-lg animate-fade-in font-mono text-xs leading-relaxed ${currentStepIsBriefing ? 'border-cyan-500 text-cyan-300' : 'border-pink-500 text-pink-300'}`}>
                        <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-2">
                            <span className="uppercase tracking-widest font-bold">
                            // {PROTOCOLS[level]?.title}
                            </span>
                            {taskCompleted && <span className="text-green-400 animate-pulse">[SYNCED]</span>}
                        </div>
                        <div className="whitespace-pre-wrap opacity-90 mb-4">
                            {systemLog}
                        </div>
                        {taskCompleted && (
                            <button 
                                onClick={advanceProtocol}
                                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-widest border border-white/20 transition-all"
                            >
                                {currentStepIsBriefing ? 'EXECUTE SEQUENCE >>' : 'NEXT SEQUENCE >>'}
                            </button>
                        )}
                    </div>
                )}

                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-transparent opacity-50"></div>
                    <h2 className="text-sm font-bold text-cyan-500 mb-6 tracking-widest uppercase flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                        Temporal Parameters
                    </h2>
                    
                    <div className="space-y-6">
                        {/* Anchor Point */}
                        <div className="relative">
                            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Anchor Point (t=0)</label>
                            <input 
                                type="number" 
                                value={a} 
                                onChange={(e) => setA(parseFloat(e.target.value))} 
                                className="w-full bg-black border border-gray-700 text-cyan-400 font-mono p-2 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                        
                        {/* Linear Velocity */}
                        <div className="relative p-4 border border-cyan-900/30 bg-cyan-900/10">
                            <label className="block text-[10px] text-cyan-600 uppercase tracking-widest mb-2">Linear Velocity (Arithmetic)</label>
                            <div className="flex items-center gap-2">
                                <span className="text-cyan-700 text-xs">Δt:</span>
                                <input 
                                    type="number" 
                                    step="0.5" 
                                    value={d} 
                                    onChange={(e) => setD(parseFloat(e.target.value))} 
                                    className="w-full bg-black border border-gray-700 text-cyan-400 font-mono p-2 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Divergence Factor */}
                        <div className="relative p-4 border border-pink-900/30 bg-pink-900/10">
                            <label className="block text-[10px] text-pink-600 uppercase tracking-widest mb-2">Divergence Factor (Geometric)</label>
                             <div className="flex items-center gap-2">
                                <span className="text-pink-700 text-xs">φ:</span>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="2.5" 
                                    step="0.1" 
                                    value={r} 
                                    onChange={(e) => setR(parseFloat(e.target.value))} 
                                    className="w-full accent-pink-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-pink-400 text-xs w-12 text-right">{r.toFixed(1)}x</span>
                            </div>
                        </div>

                         {/* Steps */}
                         <div className="pt-4 border-t border-gray-800">
                            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Simulation Depth (n)</label>
                            <input 
                                type="range" 
                                min="5" 
                                max="100" 
                                value={n} 
                                onChange={(e) => setN(parseInt(e.target.value))} 
                                className="w-full accent-gray-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" 
                            />
                            <div className="text-right text-[10px] text-gray-500 mt-1">{n} ITERATIONS</div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Visualization */}
            <div className="w-full lg:w-2/3 order-1 lg:order-2">
                <div className="bg-black border border-gray-800 rounded-sm shadow-2xl relative aspect-video flex justify-center items-center overflow-hidden">
                    {/* CRT Scanline Effect Overlay */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none"></div>
                    
                    <canvas ref={canvasRef} width={1200} height={700} className="w-full h-full object-contain mix-blend-screen" />
                    
                    <div className="absolute bottom-4 right-4 text-[10px] text-gray-600 tracking-widest">
                        RENDER_ENGINE: CANVAS_2D // VSYNC: ON
                    </div>
                </div>
            </div>
        </main>
    </div>
  );
}

