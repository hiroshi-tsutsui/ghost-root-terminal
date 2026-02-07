"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProgress } from '../contexts/ProgressContext';

// --- Matrix Logic ---
type Matrix2x2 = [[number, number], [number, number]];

export default function MatricesPage() {
  const [matrix, setMatrix] = useState<Matrix2x2>([[1, 0], [0, 1]]);
  const [targetMatrix, setTargetMatrix] = useState<Matrix2x2>([[0, -1], [1, 0]]); // Default target: Rotation 90 deg
  const [isLocked, setIsLocked] = useState(false);
  const [log, setLog] = useState<string[]>(["[SYSTEM] FABRIC WEAVER INITIALIZED...", "[SYSTEM] WAITING FOR TRANSFORMATION INPUT..."]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addXp, completeLevel } = useProgress();

  // --- Interaction ---
  const applyTransform = (type: 'identity' | 'rotate90' | 'scale2' | 'shearX') => {
    let newM: Matrix2x2 = [[1, 0], [0, 1]];
    switch (type) {
      case 'identity': newM = [[1, 0], [0, 1]]; break;
      case 'rotate90': newM = [[0, -1], [1, 0]]; break; // Rotates +90 (counter-clockwise)
      case 'scale2': newM = [[2, 0], [0, 2]]; break;
      case 'shearX': newM = [[1, 1], [0, 1]]; break;
    }
    setMatrix(newM);
    addLog(`[OP] APPLYING TRANSFORM: ${type.toUpperCase()}`);
  };

  const handleInputChange = (r: number, c: number, val: string) => {
    const num = parseFloat(val) || 0;
    const newM = [...matrix] as Matrix2x2;
    newM[r][c] = num;
    setMatrix(newM);
  };

  const addLog = (msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 6));
  };

  // --- Check Lock ---
  useEffect(() => {
    const isMatch = 
      matrix[0][0] === targetMatrix[0][0] &&
      matrix[0][1] === targetMatrix[0][1] &&
      matrix[1][0] === targetMatrix[1][0] &&
      matrix[1][1] === targetMatrix[1][1];
    
    if (isMatch && !isLocked) {
      setIsLocked(true);
      addLog("[SUCCESS] SPATIAL FABRIC SYNCED. TRANSFORMATION LOCKED.");
      completeLevel('matrices', 1);
    } else if (!isMatch && isLocked) {
      setIsLocked(false);
    }
  }, [matrix, targetMatrix, isLocked, completeLevel]);

  // --- Drawing ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const unit = 40; // Pixels per unit

    // Clear (Void)
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Transform Helper
    const transform = (x: number, y: number, m: Matrix2x2) => {
      // Linear Transform: [x', y'] = [ax + by, cx + dy]
      // Standard math coordinates (y up)
      const nx = m[0][0] * x + m[0][1] * y;
      const ny = m[1][0] * x + m[1][1] * y;
      return { x: cx + nx * unit, y: cy - ny * unit }; // Flip Y for canvas
    };

    // --- Draw Target Grid (Ghost) ---
    ctx.strokeStyle = 'rgba(255, 59, 48, 0.3)'; // Red Ghost
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    
    // Draw target unit square
    ctx.beginPath();
    const t00 = transform(0, 0, targetMatrix);
    const t10 = transform(1, 0, targetMatrix);
    const t11 = transform(1, 1, targetMatrix);
    const t01 = transform(0, 1, targetMatrix);
    
    ctx.moveTo(t00.x, t00.y);
    ctx.lineTo(t10.x, t10.y);
    ctx.lineTo(t11.x, t11.y);
    ctx.lineTo(t01.x, t01.y);
    ctx.closePath();
    ctx.stroke();
    
    // Fill target hint
    ctx.fillStyle = 'rgba(255, 59, 48, 0.1)';
    ctx.fill();
    ctx.setLineDash([]);

    // --- Draw Current Grid ---
    // Draw transformed grid lines
    ctx.strokeStyle = isLocked ? '#30d158' : '#0a84ff'; // Green if locked, Blue otherwise
    ctx.lineWidth = 1;

    // Draw grid lines from -5 to 5
    for (let i = -5; i <= 5; i++) {
        // Vertical lines (transformed)
        const p1 = transform(i, -5, matrix);
        const p2 = transform(i, 5, matrix);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();

        // Horizontal lines (transformed)
        const p3 = transform(-5, i, matrix);
        const p4 = transform(5, i, matrix);
        ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
    }

    // Axes
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    const origin = transform(0, 0, matrix);
    const xAxisEnd = transform(5, 0, matrix);
    const yAxisEnd = transform(0, 5, matrix);
    
    ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(xAxisEnd.x, xAxisEnd.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(yAxisEnd.x, yAxisEnd.y); ctx.stroke();

    // Unit Vectors (Basis)
    const iHat = transform(1, 0, matrix);
    const jHat = transform(0, 1, matrix);

    // I-Hat (Red)
    ctx.strokeStyle = '#ff3b30';
    ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(iHat.x, iHat.y); ctx.stroke();
    
    // J-Hat (Green)
    ctx.strokeStyle = '#30d158';
    ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(jHat.x, jHat.y); ctx.stroke();

    // --- Labels ---
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('i (1,0)', iHat.x + 5, iHat.y - 5);
    ctx.fillText('j (0,1)', jHat.x + 5, jHat.y - 5);

  }, [matrix, targetMatrix, isLocked]);

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-emerald-900">
       <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-14 flex items-center px-6 bg-black/80 backdrop-blur-md">
         <div className="flex items-center gap-4 text-xs tracking-widest">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
               ← OMEGA_ROOT
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-emerald-500 font-bold">PROTOCOL: FABRIC_WEAVER</span>
         </div>
      </header>

      <main className="pt-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-6rem)]">
        
        {/* Left: Controls */}
        <div className="space-y-6">
            
            {/* Matrix Input */}
            <div className={`border p-6 rounded-sm transition-colors duration-500 ${isLocked ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-white/10 bg-white/5'}`}>
                <div className="text-xs text-white/40 uppercase tracking-widest mb-4">Transformation Matrix (T)</div>
                
                <div className="flex items-center gap-4 justify-center font-mono text-2xl">
                    <span className="text-white/20 text-4xl">[</span>
                    <div className="grid grid-cols-2 gap-4">
                        <input 
                            type="number" value={matrix[0][0]} 
                            onChange={(e) => handleInputChange(0, 0, e.target.value)}
                            className="w-16 bg-black border border-white/20 text-center py-2 focus:border-emerald-500 outline-none"
                        />
                        <input 
                            type="number" value={matrix[0][1]} 
                            onChange={(e) => handleInputChange(0, 1, e.target.value)}
                            className="w-16 bg-black border border-white/20 text-center py-2 focus:border-emerald-500 outline-none"
                        />
                        <input 
                            type="number" value={matrix[1][0]} 
                            onChange={(e) => handleInputChange(1, 0, e.target.value)}
                            className="w-16 bg-black border border-white/20 text-center py-2 focus:border-emerald-500 outline-none"
                        />
                        <input 
                            type="number" value={matrix[1][1]} 
                            onChange={(e) => handleInputChange(1, 1, e.target.value)}
                            className="w-16 bg-black border border-white/20 text-center py-2 focus:border-emerald-500 outline-none"
                        />
                    </div>
                    <span className="text-white/20 text-4xl">]</span>
                </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => applyTransform('identity')} className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-colors">
                    RESET (IDENTITY)
                </button>
                <button onClick={() => applyTransform('rotate90')} className="px-4 py-3 bg-white/5 hover:bg-emerald-900/30 border border-white/10 hover:border-emerald-500/50 text-xs font-bold transition-colors">
                    ROTATE 90°
                </button>
                <button onClick={() => applyTransform('scale2')} className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-colors">
                    SCALE 2x
                </button>
                <button onClick={() => applyTransform('shearX')} className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-colors">
                    SHEAR X
                </button>
            </div>

            {/* System Log */}
            <div className="border border-white/10 bg-black p-4 h-48 overflow-hidden flex flex-col font-mono text-xs">
                <div className="text-white/30 mb-2 pb-2 border-b border-white/10">SYSTEM_LOG //</div>
                <div className="flex-1 overflow-y-auto space-y-1">
                    {log.map((entry, i) => (
                        <div key={i} className="text-white/70">
                            <span className="text-emerald-900 mr-2">{`>`}</span>
                            {entry}
                        </div>
                    ))}
                </div>
            </div>

             <div className="text-xs text-white/30 leading-relaxed border-l-2 border-white/10 pl-3">
                <strong className="text-white/50 block mb-1">MISSION BRIEFING:</strong>
                Manipulate the matrix values to warp local space-time. Match the <span className="text-red-400">Target Grid (Red Ghost)</span> to stabilize the fabric.
            </div>

        </div>

        {/* Right: Viewport */}
        <div className="lg:col-span-2 border border-white/10 bg-black relative shadow-[0_0_50px_rgba(16,185,129,0.05)]">
            <div className="absolute top-2 left-2 text-[10px] text-white/20">VIEWPORT_02 // SPATIAL_FABRIC</div>
            <div className="absolute top-2 right-2 text-[10px] text-white/20">
                {isLocked ? <span className="text-emerald-500 animate-pulse">● LOCKED</span> : '○ UNSTABLE'}
            </div>
            
            <canvas 
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-full object-contain"
            />
        </div>

      </main>
    </div>
  );
}
