// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgress } from '../contexts/ProgressContext';

// --- Matrix Logic ---
type Matrix2x2 = [[number, number], [number, number]];

const PROTOCOLS = {
    1: {
        title: "PHASE 1: ORIENTATION LOCK",
        steps: [
            {
                text: "SYSTEM: FABRIC WEAVER INITIALIZED.\nWARNING: LOCAL GRAVITY SPIN DETECTED.\n\nMISSION: ROTATE THE GRID 90° COUNTER-CLOCKWISE.\n\nHINT: i (1,0) -> (0,1). j (0,1) -> (-1,0).",
                isBriefing: true
            },
            {
                text: "EXECUTE ROTATION PROTOCOL.\nTARGET: 90° COUNTER-CLOCKWISE.",
                target: [[0, -1], [1, 0]] as Matrix2x2
            },
            {
                text: "STATUS: ORIENTATION LOCKED.\nPREPARING FOR PHASE 2...",
                isFinal: true
            }
        ]
    },
    2: {
        title: "PHASE 2: EXPANSION PROTOCOL",
        steps: [
            {
                text: "SYSTEM: SPATIAL COMPRESSION DETECTED.\n\nMISSION: EXPAND THE GRID BY A FACTOR OF 2.\n\nHINT: SCALE BOTH AXES UNIFORMLY.",
                isBriefing: true
            },
            {
                text: "EXECUTE EXPANSION.\nTARGET: 2X SCALE.",
                target: [[2, 0], [0, 2]] as Matrix2x2
            },
            {
                text: "STATUS: EXPANSION STABLE.\nPREPARING FOR PHASE 3...",
                isFinal: true
            }
        ]
    },
    3: {
        title: "PHASE 3: SHEAR STRESS",
        steps: [
            {
                text: "SYSTEM: DIMENSIONAL SLIP DETECTED.\n\nMISSION: APPLY LATERAL FORCE (SHEAR X).\n\nHINT: KEEP Y STABLE. PUSH X BASED ON Y.",
                isBriefing: true
            },
            {
                text: "EXECUTE SHEAR.\nTARGET: SHEAR X (FACTOR 1).",
                target: [[1, 1], [0, 1]] as Matrix2x2
            },
            {
                text: "STATUS: FABRIC WEAVER STABILIZED.\nALL SYSTEMS GREEN.",
                isFinal: true
            }
        ]
    }
};

export default function MatricesPage() {
  const [matrix, setMatrix] = useState<Matrix2x2>([[1, 0], [0, 1]]);
  
  // Protocol State
  const [isProtocolActive, setIsProtocolActive] = useState(false);
  const [level, setLevel] = useState(1);
  const [protocolStep, setProtocolStep] = useState(0);
  const [systemLog, setSystemLog] = useState("System Idle. Initialize Fabric Weaver Protocol to begin.");
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [targetMatrix, setTargetMatrix] = useState<Matrix2x2>([[1, 0], [0, 1]]); // Visual ghost
  const [showComplete, setShowComplete] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { completeLevel } = useProgress();

  // Sync Protocol State
  useEffect(() => {
    if (!isProtocolActive) return;
    
    const currentLevelData = PROTOCOLS[level as keyof typeof PROTOCOLS];
    if (!currentLevelData) return;
    
    const currentStep = currentLevelData.steps[protocolStep];
    if (!currentStep) return;

    setSystemLog(currentStep.text);
    
    if (currentStep.target) {
        setTargetMatrix(currentStep.target);
    }
  }, [level, protocolStep, isProtocolActive]);

  // Check Goal
  useEffect(() => {
    if (!isProtocolActive) return;
    const currentLevelData = PROTOCOLS[level as keyof typeof PROTOCOLS];
    const currentStep = currentLevelData?.steps[protocolStep];
    
    if (currentStep?.target) {
        // Compare matrix with target
        const m = matrix;
        const t = currentStep.target;
        const isMatch = m[0][0] === t[0][0] && m[0][1] === t[0][1] &&
                        m[1][0] === t[1][0] && m[1][1] === t[1][1];
        
        if (isMatch && !taskCompleted) {
            setTaskCompleted(true);
            setSystemLog((prev) => prev + "\n\n>> TARGET ACQUIRED. SYSTEM SYNCED.");
        }
    } else if (currentStep?.isBriefing || currentStep?.isFinal) {
         if (!taskCompleted) setTaskCompleted(true); // Auto-complete text steps
    }
  }, [matrix, level, protocolStep, isProtocolActive, taskCompleted]);


  const advanceProtocol = () => {
      const currentLevelData = PROTOCOLS[level as keyof typeof PROTOCOLS];
      const currentStepData = currentLevelData.steps[protocolStep];

      if (currentStepData.isFinal) {
          completeLevel('matrices', level);
          if (PROTOCOLS[(level + 1) as keyof typeof PROTOCOLS]) {
              setLevel(level + 1);
              setProtocolStep(0);
              // Reset matrix for next level usually, but we keep continuity
              if (level + 1 === 4) {
                  // Special handling for Phase 4 setup happens in useEffect
              } else {
                  setMatrix([[1, 0], [0, 1]]);
              }
          } else {
              setSystemLog("[SYSTEM]: FABRIC WEAVER OFFLINE. GOOD WORK, OPERATOR.");
              setShowComplete(true);
              setIsProtocolActive(false);
          }
      } else {
          setProtocolStep(protocolStep + 1);
      }
      setTaskCompleted(false);
  };

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
  };

  const handleInputChange = (r: number, c: number, val: string) => {
    const num = parseFloat(val) || 0;
    const newM = [...matrix] as Matrix2x2;
    newM[r][c] = num;
    setMatrix(newM);
  };

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

    // Grid (Cyberpunk Background)
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += unit) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let i = 0; i < height; i += unit) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    // Transform Helper
    const transform = (x: number, y: number, m: Matrix2x2) => {
      // Linear Transform: [x', y'] = [ax + by, cx + dy]
      // Standard math coordinates (y up)
      const nx = m[0][0] * x + m[0][1] * y;
      const ny = m[1][0] * x + m[1][1] * y;
      return { x: cx + nx * unit, y: cy - ny * unit }; // Flip Y for canvas
    };

    // --- Draw Target Grid (Ghost) ---
    if (isProtocolActive) {
        ctx.strokeStyle = 'rgba(255, 59, 48, 0.4)'; // Red Ghost
        ctx.lineWidth = 2;
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
    }

    // --- Draw Current Grid ---
    // Draw transformed grid lines
    ctx.strokeStyle = taskCompleted ? '#30d158' : '#0a84ff'; // Green if locked, Blue otherwise
    ctx.lineWidth = 1;

    // Draw grid lines from -5 to 5
    const range = 8;
    for (let i = -range; i <= range; i++) {
        // Vertical lines (transformed)
        const p1 = transform(i, -range, matrix);
        const p2 = transform(i, range, matrix);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();

        // Horizontal lines (transformed)
        const p3 = transform(-range, i, matrix);
        const p4 = transform(range, i, matrix);
        ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
    }

    // Axes
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    const origin = transform(0, 0, matrix);
    const xAxisEnd = transform(range, 0, matrix);
    const yAxisEnd = transform(0, range, matrix);
    
    ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(xAxisEnd.x, xAxisEnd.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(yAxisEnd.x, yAxisEnd.y); ctx.stroke();

    // Unit Vectors (Basis)
    const iHat = transform(1, 0, matrix);
    const jHat = transform(0, 1, matrix);

    // I-Hat (Red)
    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(iHat.x, iHat.y); ctx.stroke();
    
    // J-Hat (Green)
    ctx.strokeStyle = '#30d158';
    ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(jHat.x, jHat.y); ctx.stroke();

    // --- Labels ---
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('i', iHat.x + 5, iHat.y - 5);
    ctx.fillText('j', jHat.x + 5, jHat.y - 5);

  }, [matrix, targetMatrix, isProtocolActive, taskCompleted]);

  const currentStepIsBriefing = PROTOCOLS[level as keyof typeof PROTOCOLS]?.steps[protocolStep]?.isBriefing;

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-emerald-900">
      
      <AnimatePresence>
        {showComplete && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            >
                <div className="max-w-md w-full border border-emerald-500/50 bg-black p-8 relative overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.2)]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>
                    
                    <h2 className="text-2xl font-bold text-emerald-500 mb-2 tracking-widest uppercase">PROTOCOL COMPLETE</h2>
                    <p className="text-xs text-gray-500 mb-6 font-mono">FABRIC WEAVER STABILIZED. GRID LOCKED.</p>
                    
                    <div className="space-y-4 mb-8 border-l-2 border-emerald-500/20 pl-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">STATUS</span>
                            <span className="text-emerald-400">ONLINE</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">SYNC RATE</span>
                            <span className="text-emerald-400">100.0%</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-400">SYSTEM LOG</span>
                            <span className="text-white animate-pulse">FILE_010 DECRYPTED</span>
                        </div>
                    </div>

                    <Link href="/codex" className="block w-full text-center py-3 bg-emerald-600 text-black font-bold tracking-[0.2em] hover:bg-white transition-colors uppercase text-xs">
                        ACCESS CODEX
                    </Link>
                     <Link href="/" className="block w-full text-center py-3 mt-2 border border-white/10 text-gray-500 hover:text-white transition-colors uppercase text-[10px] tracking-widest">
                        RETURN TO TERMINAL
                    </Link>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

       <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-14 flex items-center px-6 bg-black/80 backdrop-blur-md">
         <div className="flex items-center justify-between w-full">
             <div className="flex items-center gap-4 text-xs tracking-widest">
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                ← OMEGA_ROOT
                </Link>
                <span className="text-white/20">|</span>
                <span className="text-emerald-500 font-bold">PROTOCOL: FABRIC_WEAVER</span>
             </div>
             <button 
                onClick={() => {
                    setIsProtocolActive(!isProtocolActive);
                    if (!isProtocolActive) {
                        setLevel(1);
                        setProtocolStep(0);
                        setMatrix([[1, 0], [0, 1]]);
                    }
                }}
                className={`px-4 py-1.5 rounded-sm text-xs font-bold tracking-widest border transition-all ${
                    isProtocolActive 
                    ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                    : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                }`}
             >
                {isProtocolActive ? 'PROTOCOL: ACTIVE' : 'PROTOCOL: STANDBY'}
             </button>
         </div>
      </header>

      <main className="pt-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-6rem)]">
        
        {/* Left: Controls */}
        <div className="space-y-6">
            
            {/* System Log / Mission */}
            {isProtocolActive && (
                <div className={`p-4 bg-black border-l-2 rounded-r-sm shadow-lg animate-fade-in font-mono text-xs leading-relaxed ${currentStepIsBriefing ? 'border-emerald-500 text-emerald-300' : 'border-blue-500 text-blue-300'}`}>
                    <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-2">
                        <span className="uppercase tracking-widest font-bold">
                           // {PROTOCOLS[level as keyof typeof PROTOCOLS]?.title}
                        </span>
                        {taskCompleted && <span className="text-white bg-emerald-600 px-2 rounded-[2px] animate-pulse">SYNC_LOCKED</span>}
                    </div>
                    <div className="whitespace-pre-wrap opacity-90 mb-4">
                        {systemLog}
                    </div>
                    {taskCompleted && (
                        <button 
                            onClick={advanceProtocol}
                            className="w-full py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 font-bold text-xs uppercase tracking-widest border border-emerald-500/30 transition-all"
                        >
                            {currentStepIsBriefing ? 'EXECUTE SEQUENCE >>' : 'NEXT SEQUENCE >>'}
                        </button>
                    )}
                </div>
            )}

            {/* Matrix Input */}
            <div className={`border p-6 rounded-sm transition-all duration-500 ${taskCompleted ? 'border-emerald-500/50 bg-emerald-900/5' : 'border-white/10 bg-white/5'}`}>
                <div className="text-xs text-white/40 uppercase tracking-widest mb-4 flex justify-between">
                    <span>Transformation Matrix (T)</span>
                    <span className="text-white/20">2x2</span>
                </div>
                
                <div className="flex items-center gap-4 justify-center font-mono text-2xl">
                    <span className="text-white/20 text-4xl">[</span>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Row 1 */}
                        <div className="flex flex-col items-center">
                            <input 
                                type="number" value={matrix[0][0]} 
                                onChange={(e) => handleInputChange(0, 0, e.target.value)}
                                className="w-16 bg-black border border-white/20 text-center py-2 focus:border-emerald-500 outline-none text-red-400 font-bold"
                            />
                            <span className="text-[10px] text-red-500/50 mt-1">i_x</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <input 
                                type="number" value={matrix[0][1]} 
                                onChange={(e) => handleInputChange(0, 1, e.target.value)}
                                className="w-16 bg-black border border-white/20 text-center py-2 focus:border-emerald-500 outline-none text-green-400 font-bold"
                            />
                            <span className="text-[10px] text-green-500/50 mt-1">j_x</span>
                        </div>
                        
                        {/* Row 2 */}
                        <div className="flex flex-col items-center">
                            <input 
                                type="number" value={matrix[1][0]} 
                                onChange={(e) => handleInputChange(1, 0, e.target.value)}
                                className="w-16 bg-black border border-white/20 text-center py-2 focus:border-emerald-500 outline-none text-red-400 font-bold"
                            />
                            <span className="text-[10px] text-red-500/50 mt-1">i_y</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <input 
                                type="number" value={matrix[1][1]} 
                                onChange={(e) => handleInputChange(1, 1, e.target.value)}
                                className="w-16 bg-black border border-white/20 text-center py-2 focus:border-emerald-500 outline-none text-green-400 font-bold"
                            />
                            <span className="text-[10px] text-green-500/50 mt-1">j_y</span>
                        </div>
                    </div>
                    <span className="text-white/20 text-4xl">]</span>
                </div>
            </div>

            {/* Presets (Sandbox Mode only) */}
            {!isProtocolActive && (
                <div className="grid grid-cols-2 gap-2 opacity-50 hover:opacity-100 transition-opacity">
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
            )}

             <div className="text-xs text-white/30 leading-relaxed border-l-2 border-white/10 pl-3">
                <strong className="text-white/50 block mb-1">OPERATOR MANUAL:</strong>
                The Matrix columns represent where the basis vectors <span className="text-red-400">i</span> and <span className="text-green-400">j</span> land.
                <br/>
                Column 1 = New coordinates of <span className="text-red-400">i (1,0)</span>.
                <br/>
                Column 2 = New coordinates of <span className="text-green-400">j (0,1)</span>.
            </div>

        </div>

        {/* Right: Viewport */}
        <div className="lg:col-span-2 border border-white/10 bg-black relative shadow-[0_0_50px_rgba(16,185,129,0.05)] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none"></div>
            
            <div className="absolute top-2 left-2 text-[10px] text-white/20">VIEWPORT_02 // SPATIAL_FABRIC</div>
            <div className="absolute top-2 right-2 text-[10px] text-white/20">
                {taskCompleted ? <span className="text-emerald-500 animate-pulse">● LOCKED</span> : '○ UNSTABLE'}
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