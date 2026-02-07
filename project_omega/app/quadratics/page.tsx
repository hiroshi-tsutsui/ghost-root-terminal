// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProgress } from '../contexts/ProgressContext';

export default function QuadraticsPage() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  
  // Protocol State
  const [isProtocolActive, setIsProtocolActive] = useState(false);
  const [level, setLevel] = useState(1);
  const [protocolStep, setProtocolStep] = useState(0);
  const [systemLog, setSystemLog] = useState("Waiting for Operator input...");
  const [taskCompleted, setTaskCompleted] = useState(false);

  const { completeLevel } = useProgress();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Gravity Well Protocol Logic ---
  const PROTOCOLS = {
    1: {
      title: "PHASE 1: FIELD STRENGTH (a)",
      steps: [
        {
          message: "[SYSTEM]: Gravity Well detected. Singularity unstable.\n[MISSION]: Adjust Field Strength (a) to contain the anomaly.\n[ACTION]: Initialize protocol.",
          check: () => true,
          isBriefing: true
        },
        { 
          message: "[WARNING]: Singularity expanding. Increase Field Strength to +2.0 to compress the event horizon.", 
          check: () => a === 2 
        },
        { 
          message: "[ALERT]: Polarity inversion detected. Invert Field Strength to -1.0 to repel incoming debris.", 
          check: () => a === -1 
        },
        { 
          message: "[SUCCESS]: Field Strength stabilized. Singularity containment field operational. Proceed to Phase 2.", 
          check: () => true,
          isFinal: true
        }
      ]
    },
    2: {
      title: "PHASE 2: VERTICAL OFFSET (c)",
      steps: [
        {
          message: "[SYSTEM]: Spatial drift detected. Singularity depth misalignment.\n[MISSION]: Adjust Vertical Offset (c) to re-align with the galactic plane.\n[ACTION]: Initialize protocol.",
          check: () => true,
          isBriefing: true
        },
        { 
          message: "[WARNING]: Singularity too low. Raise Vertical Offset to +3.0 to breach the observation deck.", 
          check: () => c === 3 
        },
        { 
          message: "[ALERT]: Singularity breaching upper limits. Lower Vertical Offset to -2.0 for deep storage.", 
          check: () => c === -2 
        },
        { 
          message: "[SUCCESS]: Vertical alignment confirmed. Singularity stable in deep storage. Proceed to Phase 3.", 
          check: () => true,
          isFinal: true
        }
      ]
    },
    3: {
      title: "PHASE 3: HORIZON SHIFT (b)",
      steps: [
        {
          message: "[SYSTEM]: Lateral instability detected. Cross-winds approaching critical velocity.\n[MISSION]: Adjust Horizon Shift (b) to compensate for lateral drift.\n[ACTION]: Initialize protocol.",
          check: () => true,
          isBriefing: true
        },
        { 
          message: "[WARNING]: Drift Vector Right. Set Horizon Shift (b) to +2.0 and Field Strength (a) to +1.0 to counter-steer Left.", 
          check: () => b === 2 && a === 1
        },
        { 
            message: "[SUCCESS]: Lateral drift compensated. Apex coordinates locked at x = -b / 2a.\n[SYSTEM]: GRAVITY WELL STABILIZED. OMEGA PROTOCOL SYNCED.",
            check: () => true,
            isFinal: true
        }
      ]
    }
  };

  useEffect(() => {
    if (!isProtocolActive) return;

    const currentLevelData = PROTOCOLS[level];
    if (!currentLevelData) return;

    const currentStepData = currentLevelData.steps[protocolStep];
    if (!currentStepData) return;

    setSystemLog(currentStepData.message);

    // Check condition
    if (currentStepData.check()) {
        if (!taskCompleted) {
             setTaskCompleted(true);
        }
    } else {
        setTaskCompleted(false);
    }
  }, [a, b, c, isProtocolActive, level, protocolStep]);

  const advanceProtocol = () => {
      const currentLevelData = PROTOCOLS[level];
      const currentStepData = currentLevelData.steps[protocolStep];

      if (currentStepData.isFinal) {
          completeLevel('quadratics', level);
          if (PROTOCOLS[level + 1]) {
              setLevel(level + 1);
              setProtocolStep(0);
              setA(1); setB(0); setC(0);
          } else {
              setSystemLog("[SYSTEM]: ALL PHASES COMPLETE. GRAVITY WELL SECURE. RETURNING TO IDLE STATE.");
              setIsProtocolActive(false);
          }
      } else {
          setProtocolStep(protocolStep + 1);
      }
      setTaskCompleted(false);
  };

  // --- Visuals ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Void Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 30;

    // Grid (Cyberpunk Style)
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

    // Parabola - Omega Neon
    // Gradient stroke
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#00f2ff'); // Cyan
    gradient.addColorStop(1, '#bd00ff'); // Purple
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f2ff';
    
    ctx.beginPath();

    let first = true;
    for (let pixelX = 0; pixelX < width; pixelX++) {
      const x = (pixelX - centerX) / scale;
      const y = a * x * x + b * x + c;
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
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // Vertex / Singularity Point
    if (a !== 0) {
        const vx = -b / (2 * a);
        const vy = a * vx * vx + b * vx + c;
        const pVx = centerX + vx * scale;
        const pVy = centerY - (vy * scale);
        
        // Singularity Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0055';
        ctx.fillStyle = '#ff0055'; 
        ctx.beginPath();
        ctx.arc(pVx, pVy, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Core
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(pVx, pVy, 3, 0, 2 * Math.PI);
        ctx.fill();
    }

  }, [a, b, c]);

  const vertexX = a !== 0 ? -b / (2 * a) : 0;
  const vertexY = a * vertexX * vertexX + b * vertexX + c;

  const currentStepIsBriefing = PROTOCOLS[level]?.steps[protocolStep]?.isBriefing;

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-gray-200 font-mono">
       <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800 h-16 flex items-center px-6">
         <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <Link href="/" className="group flex items-center text-xs font-bold text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-widest">
                <span className="inline-block transition-transform group-hover:-translate-x-1 mr-1">←</span> System Root
                </Link>
                <div className="h-4 w-px bg-gray-800"></div>
                <h1 className="text-sm font-bold tracking-[0.2em] text-cyan-500 glow-text">
                  MODULE: GRAVITY_WELL <span className="text-gray-600 ml-2">v2.0.1</span>
                </h1>
             </div>
             
             {/* Protocol Toggle */}
             <button 
                onClick={() => {
                    setIsProtocolActive(!isProtocolActive);
                    if (!isProtocolActive) {
                        setA(1); setB(0); setC(0);
                        setLevel(1);
                        setProtocolStep(0);
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
         </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 pt-24 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Controls */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* System Log */}
            {isProtocolActive && (
                <div className={`p-4 bg-black border-l-2 rounded-r-sm shadow-lg animate-fade-in font-mono text-xs leading-relaxed ${currentStepIsBriefing ? 'border-cyan-500 text-cyan-300' : 'border-purple-500 text-purple-300'}`}>
                    <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-2">
                        <span className="uppercase tracking-widest font-bold">
                           // {PROTOCOLS[level]?.title}
                        </span>
                        {taskCompleted && <span className="text-green-400 animate-pulse">[READY]</span>}
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

            <div className={`p-6 bg-[#111] border border-gray-800 rounded-sm transition-all ${isProtocolActive && level === 1 && 'ring-1 ring-cyan-500'}`}>
                <div className="mb-6 p-4 bg-black rounded-sm border border-gray-800 text-center">
                    <p className="font-mono text-lg font-bold text-gray-300 tracking-wider">
                    ƒ(x) = <span className="text-cyan-400">{a === 0 ? '' : `${a}x²`}</span> {b >= 0 ? '+' : ''} <span className="text-green-400">{b}x</span> {c >= 0 ? '+' : ''} <span className="text-purple-400">{c}</span>
                    </p>
                </div>

                <div className="space-y-8">
                    {/* A Slider */}
                    <div className={`space-y-2 transition-opacity ${isProtocolActive && level !== 1 && level !== 3 && 'opacity-30 blur-[1px] pointer-events-none'}`}>
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">
                                Field Strength (a)
                            </label>
                            <span className="font-mono text-sm font-bold text-cyan-400">{a.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="-5" max="5" step="1" 
                            value={a} onChange={(e) => setA(parseFloat(e.target.value))}
                            className="w-full accent-cyan-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* B Slider */}
                    <div className={`space-y-2 transition-opacity ${isProtocolActive && level !== 3 && 'opacity-30 blur-[1px] pointer-events-none'}`}>
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                                Horizon Shift (b)
                            </label>
                            <span className="font-mono text-sm font-bold text-green-400">{b.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="-10" max="10" step="1" 
                            value={b} onChange={(e) => setB(parseFloat(e.target.value))}
                            className="w-full accent-green-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* C Slider */}
                    <div className={`space-y-2 transition-opacity ${isProtocolActive && level !== 2 && 'opacity-30 blur-[1px] pointer-events-none'}`}>
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">
                                Vertical Offset (c)
                            </label>
                            <span className="font-mono text-sm font-bold text-purple-400">{c.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="-10" max="10" step="1" 
                            value={c} onChange={(e) => setC(parseFloat(e.target.value))}
                            className="w-full accent-purple-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>
          
            <div className="p-4 bg-[#111] border border-gray-800 rounded-sm space-y-3">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Telemetry Data</h3>
                <div className="flex justify-between items-center group">
                    <span className="text-xs text-gray-400">Singularity Coords</span>
                    <span className="font-mono text-sm text-red-400">({vertexX.toFixed(2)}, {vertexY.toFixed(2)})</span>
                </div>
                <div className="flex justify-between items-center group">
                    <span className="text-xs text-gray-400">Axis of Symmetry</span>
                    <span className="font-mono text-sm text-gray-300">x = {vertexX.toFixed(2)}</span>
                </div>
            </div>
        </div>

        {/* Right Panel: Viewport */}
        <div className="lg:col-span-8 bg-black border border-gray-800 rounded-sm relative overflow-hidden flex items-center justify-center min-h-[600px] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
          {/* CRT Scanline Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
          
          <div className="absolute top-4 left-4 z-30 font-mono text-[10px] text-cyan-600 tracking-widest opacity-70">
              VIEWPORT: ORBITAL_PLANE_XZ<br/>
              ZOOM: 30x<br/>
              GRID: ACTIVE
          </div>

          <canvas 
            ref={canvasRef} 
            width={900} 
            height={700} 
            className="w-full h-full object-contain z-10"
          />
        </div>

      </main>
      
      <style jsx global>{`
        .glow-text {
            text-shadow: 0 0 10px rgba(6,182,212,0.5);
        }
      `}</style>
    </div>
  );
}
