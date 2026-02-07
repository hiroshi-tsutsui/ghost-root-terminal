// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GeistMono } from 'geist/font/mono';

// --- Data Types ---
type Point = { x: number; y: number; type: 'signal' | 'noise' };

export default function ArchivePage() {
  // --- State ---
  const [points, setPoints] = useState<Point[]>([
    { x: 2, y: 3, type: 'signal' }, 
    { x: 3, y: 5, type: 'signal' }, 
    { x: 5, y: 4, type: 'signal' }, 
    { x: 7, y: 8, type: 'signal' }, 
    { x: 8, y: 9, type: 'signal' }
  ]);
  const [showResiduals, setShowResiduals] = useState(true);
  const [targetSync, setTargetSync] = useState<number | null>(0.95); 
  
  // Protocol State
  const [protocolState, setProtocolState] = useState<'idle' | 'analyzing' | 'locked' | 'failed'>('idle');
  const [log, setLog] = useState<string[]>(["[SYSTEM] ARCHIVE INTERFACE INITIALIZED...", "[SYSTEM] WAITING FOR SIGNAL INPUT..."]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Statistics Logic ---
  const calculateStats = (pts: Point[]) => {
    const n = pts.length;
    if (n < 2) return { r: 0, slope: 0, intercept: 0, xBar: 0, yBar: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    pts.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
      sumY2 += p.y * p.y;
    });

    const xBar = sumX / n;
    const yBar = sumY / n;

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    const r = denominator === 0 ? 0 : numerator / denominator;
    
    const slopeNum = n * sumXY - sumX * sumY;
    const slopeDenom = n * sumX2 - sumX * sumX;
    const slope = slopeDenom === 0 ? 0 : slopeNum / slopeDenom;
    const intercept = yBar - slope * xBar;

    return { r, slope, intercept, xBar, yBar };
  };

  const { r, slope, intercept } = calculateStats(points);

  // --- Interaction ---
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const width = canvas.width;
    const height = canvas.height;
    const margin = 60;
    const plotW = width - 2 * margin;
    const plotH = height - 2 * margin;

    const mathX = (clickX - margin) / plotW * 10;
    const mathY = (height - margin - clickY) / plotH * 10;

    const tolerance = 0.5; 
    const existingIndex = points.findIndex(p => 
      Math.abs(p.x - mathX) < tolerance && Math.abs(p.y - mathY) < tolerance
    );

    if (existingIndex >= 0) {
      // Remove Node
      const newPoints = [...points];
      const removed = newPoints.splice(existingIndex, 1)[0];
      setPoints(newPoints);
      addLog(`[OP] NODE REMOVED AT [${removed.x.toFixed(1)}, ${removed.y.toFixed(1)}]`);
    } else {
      // Add Node
      if (mathX >= 0 && mathX <= 10 && mathY >= 0 && mathY <= 10) {
        setPoints([...points, { x: mathX, y: mathY, type: 'signal' }]);
        addLog(`[OP] SIGNAL NODE INJECTED AT [${mathX.toFixed(1)}, ${mathY.toFixed(1)}]`);
      }
    }
  };

  const addLog = (msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 6));
  };

  // --- Protocol Logic ---
  useEffect(() => {
    if (Math.abs(r) >= 0.98) {
        if (protocolState !== 'locked') {
            setProtocolState('locked');
            addLog("[SUCCESS] SIGNAL FREQUENCY LOCKED. CARRIER WAVE STABLE.");
        }
    } else if (Math.abs(r) < 0.5 && points.length > 5) {
         if (protocolState !== 'failed') {
            setProtocolState('failed');
            addLog("[WARNING] SIGNAL DEGRADATION DETECTED. HIGH NOISE LEVELS.");
        }
    } else {
        setProtocolState('analyzing');
    }
  }, [r, points.length]);

  // --- Drawing ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const margin = 60;
    const plotW = width - 2 * margin;
    const plotH = height - 2 * margin;

    const toCx = (x: number) => margin + (x / 10) * plotW;
    const toCy = (y: number) => height - margin - (y / 10) * plotH;

    // Clear (Void Background)
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Grid (Cyberpunk)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
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

    // Regression Line (Signal Vector)
    if (points.length >= 2) {
        ctx.strokeStyle = protocolState === 'locked' ? '#00ff9d' : '#0071e3'; 
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle;
        
        ctx.beginPath();
        const yAt0 = intercept;
        const yAt10 = slope * 10 + intercept;
        ctx.moveTo(toCx(0), toCy(yAt0));
        ctx.lineTo(toCx(10), toCy(yAt10));
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }

    // Residuals (Noise)
    if (showResiduals && points.length >= 2) {
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        points.forEach(p => {
            const predictedY = slope * p.x + intercept;
            // Color based on error magnitude
            const error = Math.abs(p.y - predictedY);
            ctx.strokeStyle = error > 1.5 ? '#ff3b30' : 'rgba(255, 255, 255, 0.3)';
            
            ctx.beginPath();
            ctx.moveTo(toCx(p.x), toCy(p.y));
            ctx.lineTo(toCx(p.x), toCy(predictedY));
            ctx.stroke();
        });
        ctx.setLineDash([]);
    }

    // Nodes
    points.forEach(p => {
        const cx = toCx(p.x);
        const cy = toCy(p.y);
        
        ctx.fillStyle = '#000';
        ctx.strokeStyle = protocolState === 'locked' ? '#00ff9d' : '#0071e3';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Glow center
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, 2 * Math.PI);
        ctx.fill();
    });

  }, [points, showResiduals, r, slope, intercept, protocolState]);

  return (
    <div className={`min-h-screen bg-black text-white font-mono selection:bg-cyan-900 ${GeistMono.className}`}>
       <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-14 flex items-center px-6 bg-black/80 backdrop-blur-md">
         <div className="flex items-center gap-4 text-xs tracking-widest">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
               ← OMEGA_ROOT
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-cyan-500 font-bold">PROTOCOL: SIGNAL_ARCHIVE</span>
         </div>
      </header>

      <main className="pt-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-6rem)]">
        
        {/* Left: Terminal / Stats */}
        <div className="space-y-6">
            
            {/* Status Card */}
            <div className="border border-white/10 bg-white/5 p-6 rounded-sm">
                <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Sync Rate (r)</div>
                <div className={`text-5xl font-bold tracking-tighter mb-4 ${
                    protocolState === 'locked' ? 'text-green-400' : 
                    protocolState === 'failed' ? 'text-red-500' : 'text-cyan-500'
                }`}>
                    {isNaN(r) ? '---' : r.toFixed(4)}
                </div>
                
                <div className="w-full h-1 bg-white/10 overflow-hidden mb-4">
                    <div className={`h-full transition-all duration-500 ${
                         protocolState === 'locked' ? 'bg-green-400' : 'bg-cyan-500'
                    }`} style={{ width: `${(Math.abs(r)) * 100}%` }}></div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                        <span className="text-white/40">SIGNAL_VECTOR</span>
                        <span className="text-cyan-400">y = {slope.toFixed(2)}x {intercept >= 0 ? '+' : ''} {intercept.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/40">NODE_COUNT</span>
                        <span>{points.length} UNITS</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/40">NOISE_VISUALIZER</span>
                        <button onClick={() => setShowResiduals(!showResiduals)} className="text-white hover:text-cyan-400 underline decoration-dotted">
                            {showResiduals ? 'ACTIVE' : 'DISABLED'}
                        </button>
                    </div>
                </div>
            </div>

            {/* System Log */}
            <div className="border border-white/10 bg-black p-4 h-64 overflow-hidden flex flex-col font-mono text-xs">
                <div className="text-white/30 mb-2 pb-2 border-b border-white/10">SYSTEM_LOG //</div>
                <div className="flex-1 overflow-y-auto space-y-1">
                    {log.map((entry, i) => (
                        <div key={i} className="text-white/70">
                            <span className="text-cyan-900 mr-2">{`>`}</span>
                            {entry}
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-xs text-white/30 leading-relaxed border-l-2 border-white/10 pl-3">
                <strong className="text-white/50 block mb-1">MISSION BRIEFING:</strong>
                Identify the signal pattern within the void. Inject nodes to stabilize the carrier wave. 
                Achieve <span className="text-cyan-500">Sync Rate &gt; 0.98</span> to lock the signal.
                <br/><br/>
                <span className="text-red-900/80">WARNING: Anomalous data points (outliers) will destabilize the connection. Purge them immediately.</span>
            </div>

        </div>

        {/* Right: Viewport */}
        <div className="lg:col-span-2 border border-white/10 bg-black relative">
            <div className="absolute top-2 left-2 text-[10px] text-white/20">VIEWPORT_01 // SIGNAL_ANALYSIS</div>
            <div className="absolute top-2 right-2 text-[10px] text-white/20">
                {protocolState === 'locked' ? <span className="text-green-500 animate-pulse">● LOCKED</span> : '○ SCANNING'}
            </div>
            
            <canvas 
                ref={canvasRef}
                width={800}
                height={600}
                onClick={handleCanvasClick}
                className="w-full h-full cursor-crosshair object-contain"
            />
        </div>

      </main>
    </div>
  );
}
