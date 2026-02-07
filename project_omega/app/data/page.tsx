// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GeistMono } from 'geist/font/mono';
import { useProgress } from '../contexts/ProgressContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type NodeType = 'SIGNAL' | 'NOISE' | 'ANOMALY';
type Point = { id: number; x: number; y: number; type: NodeType };

// --- Constants ---
const MODULE_ID = 'data';
const LEVELS = [
  { id: 1, name: 'SIGNAL INJECTION', targetR: 0.90, desc: 'Establish a baseline Carrier Wave. Inject 5+ nodes.' },
  { id: 2, name: 'NOISE PURGE', targetR: 0.95, desc: 'Eliminate interference. Remove Anomalies to restore integrity.' },
  { id: 3, name: 'ARCHIVE LOCK', targetR: 0.99, desc: 'Achieve full synchronization. Maintain stability > 0.99 with 10+ nodes.' }
];

export default function ArchivePage() {
  const { moduleProgress, completeLevel } = useProgress();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [points, setPoints] = useState<Point[]>([]);
  const [showResiduals, setShowResiduals] = useState(true);
  const [protocolState, setProtocolState] = useState<'IDLE' | 'ACTIVE' | 'LOCKED' | 'FAILED'>('IDLE');
  const [log, setLog] = useState<string[]>([]);
  const [showUnlock, setShowUnlock] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextId = useRef(0);

  // Initialize Levels
  useEffect(() => {
    // Find first incomplete level
    const progress = moduleProgress[MODULE_ID]?.completedLevels || [];
    let nextLvl = 1;
    if (progress.includes(1)) nextLvl = 2;
    if (progress.includes(2)) nextLvl = 3;
    setCurrentLevel(nextLvl);
    initLevel(nextLvl);
  }, [moduleProgress]);

  const initLevel = (lvl: number) => {
    setProtocolState('IDLE');
    setLog([`[SYSTEM] INITIALIZING LEVEL 0${lvl}: ${LEVELS[lvl-1].name}...`]);
    nextId.current = 0;

    if (lvl === 1) {
       // Start Empty
       setPoints([]);
       addLog("[OP] INJECT SIGNAL NODES TO ESTABLISH CARRIER WAVE.");
    } else if (lvl === 2) {
       // Start with Noise
       const noisy: Point[] = [];
       // Create a line y = x + 1
       for(let i=0; i<8; i++) {
         noisy.push({ id: nextId.current++, x: i, y: i + 1 + (Math.random() * 0.5 - 0.25), type: 'SIGNAL' });
       }
       // Add Outliers
       noisy.push({ id: nextId.current++, x: 2, y: 8, type: 'ANOMALY' }); // Obvious outlier
       noisy.push({ id: nextId.current++, x: 6, y: 1, type: 'ANOMALY' }); // Obvious outlier
       noisy.push({ id: nextId.current++, x: 8, y: 4, type: 'ANOMALY' }); // Obvious outlier
       setPoints(noisy);
       addLog("[WARNING] SIGNAL CORRUPTION DETECTED. PURGE ANOMALIES.");
    } else if (lvl === 3) {
       // Start with Weak Signal
       const weak: Point[] = [];
       for(let i=0; i<5; i++) {
         weak.push({ id: nextId.current++, x: i*2, y: i*2 + (Math.random() * 0.2), type: 'SIGNAL' });
       }
       setPoints(weak);
       addLog("[OP] STABILIZE SIGNAL. INCREASE NODE DENSITY TO > 10.");
    }
  };

  const addLog = (msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 8));
  };

  // --- Statistics ---
  const calculateStats = (pts: Point[]) => {
    const n = pts.length;
    if (n < 2) return { r: 0, slope: 0, intercept: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    pts.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
      sumY2 += p.y * p.y;
    });

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const r = denominator === 0 ? 0 : numerator / denominator;
    
    const slopeNum = n * sumXY - sumX * sumY;
    const slopeDenom = n * sumX2 - sumX * sumX;
    const slope = slopeDenom === 0 ? 0 : slopeNum / slopeDenom;
    const intercept = (sumY - slope * sumX) / n;

    return { r, slope, intercept };
  };

  const { r, slope, intercept } = calculateStats(points);

  // --- Win Condition ---
  useEffect(() => {
    const target = LEVELS[currentLevel-1].targetR;
    const currentR = Math.abs(r);
    
    if (currentLevel === 1 && points.length >= 5 && currentR >= target) {
        handleWin();
    } else if (currentLevel === 2 && currentR >= target && !points.some(p => p.type === 'ANOMALY')) {
        // Also ensure we didn't just delete everything
        if (points.length >= 5) handleWin();
    } else if (currentLevel === 3 && points.length >= 10 && currentR >= target) {
        handleWin();
    }
  }, [points, r, currentLevel]);

  const handleWin = () => {
    if (protocolState === 'LOCKED') return;
    setProtocolState('LOCKED');
    addLog(`[SUCCESS] LEVEL 0${currentLevel} COMPLETE. PROTOCOL SYNCED.`);
    
    setTimeout(() => {
        completeLevel(MODULE_ID, currentLevel);
        setShowUnlock(true);
    }, 1000);
  };

  const handleNextLevel = () => {
    setShowUnlock(false);
    if (currentLevel < 3) {
        // State update will trigger via effect, but we force init here to be safe
        // Actually, allow the effect to handle it via moduleProgress change
    }
  };

  // --- Interaction ---
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (protocolState === 'LOCKED') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const margin = 60;
    const w = canvas.width - 2 * margin;
    const h = canvas.height - 2 * margin;
    
    const mathX = (x - margin) / w * 10;
    const mathY = (canvas.height - margin - y) / h * 10;

    // Check hit
    const hitIndex = points.findIndex(p => Math.abs(p.x - mathX) < 0.5 && Math.abs(p.y - mathY) < 0.5);

    if (hitIndex >= 0) {
        // Remove
        const pt = points[hitIndex];
        const newPts = [...points];
        newPts.splice(hitIndex, 1);
        setPoints(newPts);
        addLog(`[OP] NODE REMOVED [${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}]`);
    } else {
        // Add
        if (mathX >= 0 && mathX <= 10 && mathY >= 0 && mathY <= 10) {
            const newPt: Point = { id: nextId.current++, x: mathX, y: mathY, type: 'SIGNAL' };
            setPoints([...points, newPt]);
            addLog(`[OP] NODE INJECTED [${mathX.toFixed(1)}, ${mathY.toFixed(1)}]`);
        }
    }
  };

  // --- Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const margin = 60;
    const w = canvas.width - 2 * margin;
    const h = canvas.height - 2 * margin;

    const toCx = (mx: number) => margin + (mx / 10) * w;
    const toCy = (my: number) => canvas.height - margin - (my / 10) * h;

    // Clear
    ctx.fillStyle = '#050505';
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for(let i=0; i<=10; i++) {
        ctx.beginPath(); ctx.moveTo(toCx(i), toCy(0)); ctx.lineTo(toCx(i), toCy(10)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(toCx(0), toCy(i)); ctx.lineTo(toCx(10), toCy(i)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toCx(0), toCy(0)); ctx.lineTo(toCx(10), toCy(0));
    ctx.moveTo(toCx(0), toCy(0)); ctx.lineTo(toCx(0), toCy(10));
    ctx.stroke();

    // Regression Line
    if (points.length >= 2) {
        ctx.strokeStyle = protocolState === 'LOCKED' ? '#00ff9d' : '#0071e3';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(toCx(0), toCy(intercept));
        ctx.lineTo(toCx(10), toCy(slope * 10 + intercept));
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Points
    points.forEach(p => {
        const cx = toCx(p.x);
        const cy = toCy(p.y);
        
        ctx.fillStyle = p.type === 'ANOMALY' ? '#ff3b30' : '#0071e3';
        if (protocolState === 'LOCKED' && p.type !== 'ANOMALY') ctx.fillStyle = '#00ff9d';
        
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Residuals
        if (showResiduals && points.length >= 2) {
             const predY = slope * p.x + intercept;
             ctx.strokeStyle = 'rgba(255,255,255,0.1)';
             ctx.setLineDash([2,4]);
             ctx.beginPath();
             ctx.moveTo(cx, cy);
             ctx.lineTo(cx, toCy(predY));
             ctx.stroke();
             ctx.setLineDash([]);
        }
    });

  }, [points, protocolState, r, slope, intercept, showResiduals]);

  return (
    <div className={`min-h-screen bg-black text-white font-mono selection:bg-cyan-900 ${GeistMono.className}`}>
       
       {/* Header */}
       <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-14 flex items-center px-6 bg-black/80 backdrop-blur-md justify-between">
         <div className="flex items-center gap-4 text-xs tracking-widest">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
               ← OMEGA_ROOT
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-cyan-500 font-bold">PROTOCOL: SIGNAL_ARCHIVE</span>
         </div>
         <div className="text-xs text-white/40">
            LEVEL 0{currentLevel} // {LEVELS[currentLevel-1].name}
         </div>
      </header>

      <main className="pt-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-6rem)]">
        
        {/* Left Panel */}
        <div className="space-y-6">
            
            {/* Stats Card */}
            <div className="border border-white/10 bg-white/5 p-6 rounded-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 text-[10px] text-white/20">
                    ID: {MODULE_ID.toUpperCase()}_L0{currentLevel}
                </div>
                
                <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Coherence Integrity (r)</div>
                <div className={`text-5xl font-bold tracking-tighter mb-4 ${
                    Math.abs(r) >= LEVELS[currentLevel-1].targetR ? 'text-green-400' : 'text-cyan-500'
                }`}>
                    {isNaN(r) ? '0.0000' : Math.abs(r).toFixed(4)}
                </div>
                <div className="text-[10px] text-white/30 mb-4">TARGET: {LEVELS[currentLevel-1].targetR.toFixed(2)}</div>
                
                <div className="w-full h-1 bg-white/10 overflow-hidden mb-4">
                    <div className={`h-full transition-all duration-500 ${
                         Math.abs(r) >= LEVELS[currentLevel-1].targetR ? 'bg-green-400' : 'bg-cyan-500'
                    }`} style={{ width: `${(Math.abs(r)) * 100}%` }}></div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                     <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-white/40">CARRIER WAVE</span>
                        <span className="text-cyan-400">y = {slope.toFixed(2)}x + {intercept.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-white/40">SIGNAL NODES</span>
                        <span>{points.length} UNITS</span>
                    </div>
                     <div className="flex justify-between pt-1">
                        <span className="text-white/40">NOISE VISUALIZER</span>
                        <button onClick={() => setShowResiduals(!showResiduals)} className="text-white hover:text-cyan-400 underline decoration-dotted">
                            {showResiduals ? 'ACTIVE' : 'DISABLED'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs */}
            <div className="border border-white/10 bg-black p-4 h-64 overflow-hidden flex flex-col font-mono text-xs relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent opacity-50"></div>
                <div className="text-white/30 mb-2 pb-2 border-b border-white/10 flex justify-between">
                    <span>SYSTEM_LOG //</span>
                    <span className="animate-pulse text-cyan-500">● LIVE</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                    {log.map((entry, i) => (
                        <div key={i} className="text-white/70">
                            <span className="text-cyan-900 mr-2">{`>`}</span>
                            {entry}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Briefing */}
             <div className="text-xs text-white/40 leading-relaxed border-l-2 border-cyan-900/50 pl-3">
                <strong className="text-cyan-500 block mb-1">MISSION: {LEVELS[currentLevel-1].name}</strong>
                {LEVELS[currentLevel-1].desc}
            </div>
        </div>

        {/* Right Panel (Viewport) */}
        <div className="lg:col-span-2 border border-white/10 bg-black relative group">
            <div className="absolute top-2 left-2 text-[10px] text-white/20 group-hover:text-white/40 transition-colors">
                VIEWPORT_01 // SIGNAL_ANALYSIS
            </div>
             <canvas 
                ref={canvasRef}
                width={800}
                height={600}
                onClick={handleCanvasClick}
                className="w-full h-full cursor-crosshair object-contain"
            />
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-20"></div>
        </div>

      </main>

      {/* Unlock Modal */}
      <AnimatePresence>
        {showUnlock && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            >
                <div className="bg-black border border-cyan-500/30 p-8 max-w-md w-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tighter">PROTOCOL SYNCED</h2>
                    <div className="text-cyan-500 text-sm mb-6">LEVEL 0{currentLevel} COMPLETE</div>
                    
                    <p className="text-white/60 text-xs mb-8 leading-relaxed">
                        Signal integrity restored. The Archive acknowledges your contribution.
                        XP AWARDED: <span className="text-white">+100</span>
                    </p>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={handleNextLevel}
                            className="flex-1 bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 py-3 text-xs hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest"
                        >
                            {currentLevel < 3 ? 'Initiate Next Phase' : 'Return to Root'}
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
