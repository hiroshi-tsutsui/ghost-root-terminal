// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import BallsInBins from '../components/BallsInBins';
import { motion, AnimatePresence } from 'framer-motion';

// --- Monty Hall Component (Paradox Resolution Protocol) ---
function ParadoxResolutionProtocol() {
    const [doors, setDoors] = useState([0, 1, 2]);
    const [carPos, setCarPos] = useState<number | null>(null);
    const [selectedDoor, setSelectedDoor] = useState<number | null>(null);
    const [openedDoor, setOpenedDoor] = useState<number | null>(null);
    const [gameState, setGameState] = useState<'pick' | 'reveal' | 'result'>('pick');
    const [finalPick, setFinalPick] = useState<number | null>(null);
    const [result, setResult] = useState<'win' | 'lose' | null>(null);
    const [stats, setStats] = useState({ switchWins: 0, switchTotal: 0, stayWins: 0, stayTotal: 0 });

    const resetGame = () => {
        setCarPos(Math.floor(Math.random() * 3));
        setSelectedDoor(null);
        setOpenedDoor(null);
        setFinalPick(null);
        setResult(null);
        setGameState('pick');
    };

    useEffect(() => {
        resetGame();
    }, []);

    const handleDoorClick = (doorIdx: number) => {
        if (gameState === 'pick') {
            setSelectedDoor(doorIdx);
            // System eliminates a variable
            const available = doors.filter(d => d !== doorIdx && d !== carPos);
            const toOpen = available[Math.floor(Math.random() * available.length)];
            setOpenedDoor(toOpen);
            setGameState('reveal');
        }
    };

    const handleDecision = (switchDoor: boolean) => {
        let final = selectedDoor;
        if (switchDoor) {
            final = doors.find(d => d !== selectedDoor && d !== openedDoor)!;
        }
        setFinalPick(final);
        const win = final === carPos;
        setResult(win ? 'win' : 'lose');
        setGameState('result');
        
        // Update stats
        if (switchDoor) {
            setStats(s => ({ ...s, switchTotal: s.switchTotal + 1, switchWins: s.switchWins + (win ? 1 : 0) }));
        } else {
            setStats(s => ({ ...s, stayTotal: s.stayTotal + 1, stayWins: s.stayWins + (win ? 1 : 0) }));
        }
    };

    return (
        <div className="bg-black/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-indigo-500/30 relative overflow-hidden group">
             <div className="absolute inset-0 bg-grid-indigo-500/[0.05] pointer-events-none" />
             <div className="absolute top-0 right-0 p-2 opacity-50 font-mono text-[10px] text-indigo-400">SYS.PRDX.01</div>
             
             <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h3 className="font-bold text-lg text-indigo-400 font-mono tracking-widest uppercase">Paradox Resolution</h3>
                    <p className="text-[10px] text-gray-500 font-mono">Resolve the Monty Hall Anomaly</p>
                </div>
                <button onClick={resetGame} className="text-[10px] bg-indigo-900/30 text-indigo-300 px-3 py-1 rounded hover:bg-indigo-800/50 border border-indigo-500/30 font-mono uppercase transition-all hover:shadow-[0_0_10px_rgba(79,70,229,0.3)]">Reset Sequence</button>
             </div>

             <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
                 {[0, 1, 2].map(door => (
                     <div 
                        key={door}
                        onClick={() => handleDoorClick(door)}
                        className={`
                            h-32 rounded-xl flex items-center justify-center text-3xl cursor-pointer transition-all border relative overflow-hidden group/door
                            ${openedDoor === door ? 'bg-black border-gray-800 opacity-50 grayscale' : 'bg-gradient-to-br from-gray-900 to-black border-indigo-500/30 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]'}
                            ${selectedDoor === door ? 'ring-1 ring-cyan-400 ring-offset-1 ring-offset-black shadow-[0_0_15px_rgba(6,182,212,0.3)]' : ''}
                            ${gameState === 'result' && door === carPos ? 'bg-emerald-900/20 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : ''}
                        `}
                     >
                         <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] opacity-0 group-hover/door:opacity-100 transition-opacity duration-700 animate-[shine_2s_infinite]"></div>
                         
                         <span className="relative z-10 font-mono text-sm tracking-widest">
                             {openedDoor === door ? (door === carPos ? '💎 CORE' : 'NULL') : (
                                 gameState === 'result' && door === carPos ? '💎 CORE' : `GATE ${door+1}`
                             )}
                         </span>
                     </div>
                 ))}
             </div>

             {gameState === 'pick' && <p className="text-center font-mono text-indigo-300 text-xs animate-pulse">Select initial probability vector...</p>}
             
             {gameState === 'reveal' && (
                 <div className="text-center space-y-4 animate-fade-in relative z-10">
                     <div className="inline-block px-4 py-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-200 font-mono text-xs">
                        ⚠️ ANOMALY DETECTED: Gate {openedDoor! + 1} is NULL.
                     </div>
                     <p className="font-mono text-indigo-200 text-sm">Update probability priors?</p>
                     <div className="flex justify-center gap-4">
                         <button onClick={() => handleDecision(false)} className="px-6 py-2 bg-gray-900/50 text-gray-400 rounded border border-gray-700 font-mono text-[10px] hover:bg-gray-800 uppercase tracking-wider">Maintain</button>
                         <button onClick={() => handleDecision(true)} className="px-6 py-2 bg-indigo-600 text-white rounded border border-indigo-400 font-mono text-[10px] shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:bg-indigo-500 hover:scale-105 transition-all uppercase tracking-wider">Shift Vector</button>
                     </div>
                 </div>
             )}

             {gameState === 'result' && (
                 <div className="text-center animate-bounce relative z-10">
                     <p className={`text-lg font-mono font-bold mb-2 ${result === 'win' ? 'text-emerald-400' : 'text-red-400'}`}>
                         {result === 'win' ? 'CORE STABILIZED' : 'VECTOR COLLAPSE'}
                     </p>
                     <button onClick={resetGame} className="text-cyan-400 underline text-[10px] font-mono hover:text-cyan-300 uppercase">Re-Initialize</button>
                 </div>
             )}

             <div className="mt-8 grid grid-cols-2 gap-4 text-xs bg-black/40 p-4 rounded-xl border border-indigo-500/10 font-mono relative z-10">
                 <div className="text-center">
                     <div className="font-bold text-gray-500 uppercase mb-1 text-[9px]">Maintain Accuracy</div>
                     <div className="text-xl text-gray-300 font-bold">{stats.stayTotal ? ((stats.stayWins/stats.stayTotal)*100).toFixed(1) : 0}%</div>
                     <div className="text-gray-600 text-[9px]">{stats.stayWins}/{stats.stayTotal}</div>
                 </div>
                 <div className="text-center border-l border-indigo-500/20">
                     <div className="font-bold text-indigo-500 uppercase mb-1 text-[9px]">Shift Accuracy</div>
                     <div className="text-xl text-indigo-400 font-bold">{stats.switchTotal ? ((stats.switchWins/stats.switchTotal)*100).toFixed(1) : 0}%</div>
                     <div className="text-gray-600 text-[9px]">{stats.switchWins}/{stats.switchTotal}</div>
                 </div>
             </div>
             <div className="mt-2 text-center">
                <span className="text-[9px] text-gray-600 font-mono bg-black/50 px-2 py-0.5 rounded border border-gray-800">
                    EXPECTED DELTA: +33.3%
                </span>
             </div>
        </div>
    );
}

export default function EntropyWeaverPage() {
  const [mean, setMean] = useState(0);
  const [stdDev, setStdDev] = useState(1);
  const [oracleMode, setOracleMode] = useState(false);
  const [lessonStep, setLessonStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Conditional Prob State
  const [probA, setProbA] = useState(0.5); 
  const [probB, setProbB] = useState(0.5);
  const [probIntersection, setProbIntersection] = useState(0.2);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const normal = (x: number, mean: number, stdDev: number) => {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  };

  // Oracle Logic
  useEffect(() => {
    if (!oracleMode) return;
    if (lessonStep === 1) {
        if (Math.abs(mean - 2.0) < 0.1) {
             setShowConfetti(true);
             setTimeout(() => { setShowConfetti(false); setLessonStep(2); }, 2000);
        }
    } else if (lessonStep === 2) {
        if (Math.abs(stdDev - 0.5) < 0.1) {
             setShowConfetti(true);
             setTimeout(() => { setShowConfetti(false); setLessonStep(3); }, 2000);
        }
    }
  }, [mean, stdDev, lessonStep, oracleMode]);

  // Normal Dist Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const scaleX = 50;
    const scaleY = 250;
    const centerX = width / 2;
    const centerY = height - 40;

    // Background Grid (Dark)
    ctx.strokeStyle = '#111116'; 
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += scaleX) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }

    // Axes (Cyan)
    ctx.strokeStyle = '#06b6d4'; // cyan-500
    ctx.lineWidth = 1;
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); // X
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); // Y
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fill area within 1 std dev - Purple Glow
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    const range = 6;
    const startX = -range * 2;
    const endX = range * 2;
    const step = 0.05;

    const x1 = mean - stdDev;
    const x2 = mean + stdDev;
    
    ctx.moveTo(centerX + x1 * scaleX, centerY);
    for (let x = x1; x <= x2; x += step) {
        const y = normal(x, mean, stdDev);
        const px = centerX + x * scaleX;
        const py = centerY - y * scaleY;
        ctx.lineTo(px, py);
    }
    ctx.lineTo(centerX + x2 * scaleX, centerY);
    ctx.closePath();
    ctx.fill();

    // Plot Normal Distribution - Neon Violet
    ctx.strokeStyle = '#8b5cf6'; // violet-500
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#8b5cf6';
    ctx.beginPath();
    
    for (let x = startX; x <= endX; x += step) {
      const y = normal(x, mean, stdDev);
      const px = centerX + x * scaleX;
      const py = centerY - y * scaleY;
      
      if (x === startX) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Labels
    ctx.fillStyle = '#6b7280'; // gray-500
    ctx.font = '500 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('μ', centerX + mean * scaleX, centerY + 20);
    ctx.fillText('μ+σ', centerX + (mean + stdDev) * scaleX, centerY + 20);
    ctx.fillText('μ-σ', centerX + (mean - stdDev) * scaleX, centerY + 20);

  }, [mean, stdDev]);

  const conditionalProb = probB > 0 ? (probIntersection / probB) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#050507] text-indigo-50 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
       <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050507] to-[#050507] pointer-events-none z-0"></div>
       <header className="fixed top-0 left-0 right-0 z-[60] bg-[#050507]/80 backdrop-blur-md border-b border-indigo-500/10 h-16 flex items-center px-6 transition-all">
         <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <Link href="/" className="group flex items-center text-xs font-medium text-indigo-400 hover:text-cyan-400 transition-colors font-mono uppercase tracking-widest">
                <span className="inline-block transition-transform group-hover:-translate-x-1 mr-2">←</span> Omega_Core
                </Link>
                <div className="h-4 w-px bg-indigo-900/50"></div>
                <h1 className="text-sm font-bold tracking-[0.2em] text-white uppercase font-mono">Protocol: <span className="text-indigo-400">Entropy_Weaver</span></h1>
             </div>
             <button 
                onClick={() => { setOracleMode(!oracleMode); setLessonStep(0); }}
                className={`px-4 py-1.5 rounded text-[10px] font-mono font-bold transition-all border uppercase tracking-widest ${oracleMode ? 'bg-indigo-600/20 border-indigo-400 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-transparent border-gray-800 text-gray-500 hover:border-indigo-500/50 hover:text-indigo-400'}`}
             >
                {oracleMode ? 'System: ORACLE_ACTIVE' : 'System: STANDBY'}
             </button>
         </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 pt-28 space-y-12 relative z-10">
        {showConfetti && (
             <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                 <div className="text-3xl font-mono text-cyan-400 border border-cyan-500/50 bg-black/80 px-8 py-4 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.5)] animate-pulse tracking-widest uppercase">
                    State Stabilized
                 </div>
             </div>
        )}

        {/* Normal Distribution Section */}
        <section className="bg-black/40 border border-indigo-900/30 rounded-2xl overflow-hidden relative shadow-2xl shadow-black/50 backdrop-blur-sm">
             <div className="flex flex-col md:flex-row h-full">
                {/* Controls Side */}
                <div className="w-full md:w-[35%] p-8 bg-[#08080a] border-r border-indigo-900/30 flex flex-col justify-center relative">
                    
                    {/* Oracle Overlay Panel */}
                    <AnimatePresence>
                        {oracleMode && (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="absolute inset-0 bg-black/95 backdrop-blur-xl z-20 p-8 flex flex-col justify-center border-r border-indigo-500/50 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                            >
                                <div className="absolute top-4 right-4 text-xl animate-pulse text-indigo-500">❖</div>
                                <h3 className="text-sm font-bold text-indigo-400 mb-6 font-mono tracking-[0.2em] uppercase border-b border-indigo-900/50 pb-2">Oracle_Protocol_v2</h3>
                                
                                {lessonStep === 0 && (
                                    <div>
                                        <p className="text-xs text-indigo-200/60 mb-8 leading-relaxed font-mono">
                                            Initializing stochastic synchronization...<br/><br/>
                                            <span className="text-white">Objective:</span> Harmonize the <span className="text-cyan-400">Mean State (μ)</span> and <span className="text-purple-400">Uncertainty Amplitude (σ)</span> to stabilize the probability field.
                                        </p>
                                        <button onClick={() => setLessonStep(1)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] uppercase tracking-[0.2em] border border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02]">Initialize Sequence</button>
                                    </div>
                                )}
                                {lessonStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-bold text-cyan-400 font-mono uppercase tracking-widest mb-1">Step 01: Center Mass</div>
                                        <p className="text-xs text-gray-400 font-mono leading-relaxed">
                                            Align the probability wave anchor.<br/>
                                            Target μ: <span className="text-cyan-400 font-bold">2.0</span>
                                        </p>
                                        <div className="text-xs bg-cyan-900/10 border border-cyan-500/30 p-2 rounded font-mono text-cyan-400 flex justify-between">
                                            <span>CURRENT_μ</span>
                                            <span>{mean.toFixed(1)}</span>
                                        </div>
                                    </div>
                                )}
                                {lessonStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-bold text-purple-400 font-mono uppercase tracking-widest mb-1">Step 02: Reduce Entropy</div>
                                        <p className="text-xs text-gray-400 font-mono leading-relaxed">
                                            Constrain the event horizon.<br/>
                                            Target σ: <span className="text-purple-400 font-bold">0.5</span>
                                        </p>
                                        <div className="text-xs bg-purple-900/10 border border-purple-500/30 p-2 rounded font-mono text-purple-400 flex justify-between">
                                            <span>CURRENT_σ</span>
                                            <span>{stdDev.toFixed(1)}</span>
                                        </div>
                                    </div>
                                )}
                                {lessonStep === 3 && (
                                    <div className="text-center">
                                        <div className="w-12 h-12 rounded-full border border-emerald-500/50 bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
                                            <span className="text-emerald-400 text-xl">✓</span>
                                        </div>
                                        <p className="text-xs font-bold mb-2 text-emerald-400 font-mono tracking-widest uppercase">Synchronization Complete</p>
                                        <p className="text-[10px] text-gray-500 mb-8 font-mono">
                                            Field variance minimized.
                                        </p>
                                        <button onClick={() => setOracleMode(false)} className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-gray-400 font-mono text-[10px] uppercase tracking-widest border border-gray-700 transition-all">Dismiss Protocol</button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-3">
                             <div className="w-8 h-8 rounded-lg border border-indigo-500/20 bg-indigo-900/10 flex items-center justify-center text-[10px] font-mono text-indigo-400">μσ</div>
                             <h3 className="font-bold text-indigo-100 text-sm font-mono tracking-wider uppercase">Gaussian Flux</h3>
                        </div>
                        <p className="text-[11px] text-indigo-300/40 leading-relaxed font-mono">
                            Modulate the fundamental shape of randomness. Determine the center of mass and the spread of chaos.
                        </p>
                    </div>

                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-[9px] font-bold text-cyan-500/70 uppercase tracking-[0.2em] font-mono">Mean State (μ)</label>
                                <span className="font-mono text-xl font-bold text-cyan-400 shadow-cyan-500/50 drop-shadow-md">{mean.toFixed(1)}</span>
                            </div>
                            <div className="relative h-2 w-full">
                                <input 
                                type="range" min="-3" max="3" step="0.1" 
                                value={mean} onChange={(e) => setMean(parseFloat(e.target.value))}
                                className="absolute w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer z-10 opacity-0"
                                />
                                <div className="absolute inset-0 h-1 bg-gray-800 rounded-lg overflow-hidden">
                                    <div className="h-full bg-cyan-500/50" style={{ width: `${((mean + 3) / 6) * 100}%` }}></div>
                                </div>
                                <div className="absolute top-[-3px] h-3 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] pointer-events-none transition-all" style={{ left: `${((mean + 3) / 6) * 100}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-[9px] font-bold text-purple-500/70 uppercase tracking-[0.2em] font-mono">Uncertainty (σ)</label>
                                <span className="font-mono text-xl font-bold text-purple-400 shadow-purple-500/50 drop-shadow-md">{stdDev.toFixed(1)}</span>
                            </div>
                            <div className="relative h-2 w-full">
                                <input 
                                type="range" min="0.5" max="3" step="0.1" 
                                value={stdDev} onChange={(e) => setStdDev(parseFloat(e.target.value))}
                                className="absolute w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer z-10 opacity-0"
                                />
                                <div className="absolute inset-0 h-1 bg-gray-800 rounded-lg overflow-hidden">
                                    <div className="h-full bg-purple-500/50" style={{ width: `${((stdDev - 0.5) / 2.5) * 100}%` }}></div>
                                </div>
                                <div className="absolute top-[-3px] h-3 w-1 bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)] pointer-events-none transition-all" style={{ left: `${((stdDev - 0.5) / 2.5) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas Side */}
                <div className="w-full md:w-[65%] bg-black relative flex items-center justify-center p-8 min-h-[400px]">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,30,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(30,30,50,0.1),rgba(0,0,0,0)_1px)] z-0 pointer-events-none bg-[length:100%_4px,20px_100%]"></div>
                    <canvas ref={canvasRef} width={600} height={400} className="w-full h-auto max-w-[650px] z-10" />
                </div>
            </div>
        </section>

        {/* Balls in Bins Section */}
        <section className={`transition-all duration-700 ${oracleMode ? 'opacity-20 pointer-events-none blur-sm grayscale' : ''}`}>
             <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-indigo-400 font-mono tracking-widest uppercase">Entropy Cascades</h3>
                <span className="text-[9px] text-gray-600 font-mono uppercase border border-gray-800 px-2 py-0.5 rounded">Sim: Galton_Board</span>
             </div>
            <div className="border border-indigo-900/20 rounded-xl bg-black/40 p-1 shadow-2xl overflow-hidden">
                <BallsInBins />
            </div>
        </section>

        {/* Conditional Probability (Venn & Monty Hall) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
            {/* Venn Logic */}
            <div className="bg-black/40 border border-indigo-900/30 p-8 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-3 opacity-30 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-mono text-indigo-500 border border-indigo-500/30 px-2 py-1 rounded">BAYES_FILTER</span>
                 </div>
                 
                 <h3 className="text-sm font-bold text-indigo-400 mb-6 font-mono tracking-widest uppercase border-b border-indigo-900/30 pb-3">Bayesian Interference</h3>
                 
                 <div className="flex items-center justify-center py-8 relative mb-6">
                    {/* Glowing effect */}
                    <div className="absolute inset-0 bg-indigo-500/5 blur-[50px] rounded-full"></div>
                    <svg viewBox="0 0 300 180" className="w-full h-auto max-w-[320px] relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <circle cx="100" cy="90" r="70" fill="rgba(6, 182, 212, 0.05)" stroke="#06b6d4" strokeWidth="1.5" />
                        <text x="60" y="95" fill="#06b6d4" fontWeight="bold" fontFamily="monospace" fontSize="12">EVENT A</text>
                        
                        <circle cx="200" cy="90" r="70" fill="rgba(139, 92, 246, 0.05)" stroke="#8b5cf6" strokeWidth="1.5" />
                        <text x="240" y="95" fill="#8b5cf6" fontWeight="bold" fontFamily="monospace" fontSize="12">EVENT B</text>
                        
                        {/* Intersection */}
                         <path d="M 175,35 A 70,70 0 0,0 175,145 A 70,70 0 0,0 175,35" fill="rgba(255, 255, 255, 0.15)" stroke="white" strokeDasharray="3 3" />
                         <text x="150" y="95" fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace" letterSpacing="0.1em">INTERSECT</text>
                    </svg>
                 </div>

                 <div className="space-y-8">
                    <div className="text-center">
                        <span className="font-mono bg-[#0f0f15] px-4 py-2 rounded text-indigo-300 border border-indigo-500/20 text-xs shadow-inner">
                            P(A|B) = P(A∩B) / P(B)
                        </span>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-mono text-purple-400 tracking-wider">
                            <span>PROBABILITY_B (Denominator)</span>
                            <span>{probB.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0.01" max="1" step="0.01" value={probB} onChange={(e) => setProbB(parseFloat(e.target.value))} className="w-full accent-purple-500 bg-gray-800 h-1 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-mono text-white tracking-wider">
                             <span>INTERSECTION (Numerator)</span>
                             <span>{probIntersection.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0" max={probB} step="0.01" value={probIntersection} onChange={(e) => setProbIntersection(parseFloat(e.target.value))} className="w-full accent-white bg-gray-800 h-1 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    
                     <div className="text-center p-6 bg-gradient-to-b from-indigo-900/10 to-transparent rounded-xl border border-indigo-500/10 mt-6">
                        <span className="text-[9px] font-bold text-gray-500 block mb-2 font-mono uppercase tracking-[0.2em]">Conditional Output</span>
                        <span className="text-4xl font-mono font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                            {conditionalProb > 1 ? 'ERR' : (conditionalProb * 100).toFixed(1) + '%'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Monty Hall Game */}
            <div className="flex flex-col">
                 <ParadoxResolutionProtocol />
            </div>
        </section>

      </main>
    </div>
  );
}
