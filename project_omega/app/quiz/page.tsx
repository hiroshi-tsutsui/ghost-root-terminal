// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgress } from '../contexts/ProgressContext'; // Import context

const anomalies = [
  {
    id: "A-001",
    protocol: "FLUX_ENGINE (Calculus)",
    query: "Identify the derivative of f(x) = x². Stability depends on it.",
    options: ["x", "2x", "x²", "2"],
    answer: "2x",
    explanation: "Power Rule confirmed: d/dx(x^n) = n*x^(n-1). Stability restored."
  },
  {
    id: "A-002",
    protocol: "ENTROPY_WEAVER (Probability)",
    query: "Define the semantic meaning of Standard Deviation (σ).",
    options: ["Central Tendency", "Dataset Size", "Dispersion Magnitude", "Maximum Amplitude"],
    answer: "Dispersion Magnitude",
    explanation: "σ quantifies the dispersion from the mean. Entropy managed."
  },
  {
    id: "A-003",
    protocol: "GRAVITY_WELL (Quadratics)",
    query: "Locate the vertex singularity of y = (x - 2)² + 1.",
    options: ["(2, 1)", "(-2, 1)", "(2, -1)", "(-2, -1)"],
    answer: "(2, 1)",
    explanation: "Vertex form y = a(x - h)² + k identifies singularity at (h, k)."
  },
  {
    id: "A-004",
    protocol: "VECTOR_NAV (Vectors)",
    query: "Orthogonality check: Dot product of perpendicular vectors?",
    options: ["1", "-1", "0", "Undefined"],
    answer: "0",
    explanation: "Cos(90°) = 0. Orthogonality confirmed. Trajectory clear."
  },
  {
    id: "A-005",
    protocol: "VOID_PHASE (Complex)",
    query: "Resolve the value of i² within the Void Plane.",
    options: ["1", "-1", "i", "-i"],
    answer: "-1",
    explanation: "i² represents a 180° rotation into the real axis (negative)."
  }
];

export default function CalibrationProtocol() {
  const { completeCalibration } = useProgress();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [syncRate, setSyncRate] = useState(100); // Score (0-100)
  const [stability, setStability] = useState(100); // Time/Health (0-100)
  const [status, setStatus] = useState<"ACTIVE" | "COMPLETED" | "FAILED">("ACTIVE");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"STABILIZED" | "DESYNC" | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (message: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 6));
  };

  // Start Calibration & Decay Timer
  useEffect(() => {
    if (status === "ACTIVE") {
      addLog("INITIATING CALIBRATION SEQUENCE...");
      addLog("WARNING: SYSTEM INSTABILITY DETECTED.");
      
      timerRef.current = setInterval(() => {
        setStability(prev => {
          if (prev <= 0) {
            setStatus("FAILED");
            addLog("CRITICAL FAILURE: SYSTEM COLLAPSE.");
            return 0;
          }
          return Math.max(0, prev - 1); // Decay 1% per tick
        });
      }, 1000); // 1 second tick
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Handle Stability Warnings
  useEffect(() => {
    if (stability < 30 && stability > 0 && status === "ACTIVE") {
      addLog("WARNING: CRITICAL INSTABILITY.");
    }
  }, [stability, status]);

  const handleOptionClick = (option: string) => {
    if (selectedOption || status !== "ACTIVE") return; 
    setSelectedOption(option);

    const isCorrect = option === anomalies[currentIndex].answer;

    if (isCorrect) {
      setFeedback("STABILIZED");
      addLog(`ANOMALY ${anomalies[currentIndex].id} NEUTRALIZED.`);
      setStability(prev => Math.min(100, prev + 15)); // Restore Stability
    } else {
      setFeedback("DESYNC");
      addLog(`CRITICAL ERROR: ${anomalies[currentIndex].id} FAILED.`);
      setSyncRate(prev => Math.max(0, prev - 20)); // Penalty to Score
      setStability(prev => Math.max(0, prev - 25)); // Major Penalty to Stability
    }

    setTimeout(() => {
      if (currentIndex < anomalies.length - 1) {
        if (stability > 0) {
            setCurrentIndex(currentIndex + 1);
            setSelectedOption(null);
            setFeedback(null);
        }
      } else {
        if (stability > 0) {
            setStatus("COMPLETED");
            addLog("CALIBRATION COMPLETE. STABILITY RESTORED.");
            completeCalibration(syncRate);
        }
      }
    }, 1500);
  };

  const resetProtocol = () => {
    setCurrentIndex(0);
    setSyncRate(100);
    setStability(100);
    setStatus("ACTIVE");
    setSelectedOption(null);
    setFeedback(null);
    setLog([]);
    addLog("REBOOTING SYSTEM...");
  };

  const getRank = (rate: number) => {
    if (rate >= 90) return "OMEGA";
    if (rate >= 75) return "ARCHITECT";
    if (rate >= 50) return "OPERATOR";
    return "INITIATE";
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-mono flex flex-col relative overflow-hidden selection:bg-cyan-500/30">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

      {/* Stability Warning Overlay */}
      <AnimatePresence>
        {stability < 30 && status === "ACTIVE" && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.2, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute inset-0 bg-red-500 pointer-events-none z-0"
            />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-white/10 h-16 flex items-center px-6 sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md">
         <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
             <Link href="/" className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 transition-colors tracking-widest uppercase">
               &lt; Abort Sequence
             </Link>
             <h1 className="font-bold tracking-[0.2em] text-white/90 text-sm hidden md:block">PROTOCOL: CALIBRATION</h1>
             
             <div className="flex gap-6 text-[10px] font-mono">
                 <div className={`flex items-center gap-2 ${stability < 30 ? 'text-red-500 animate-pulse' : 'text-cyan-500'}`}>
                    <span>STABILITY:</span>
                    <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div 
                            className={`h-full ${stability < 30 ? 'bg-red-500' : 'bg-cyan-500'}`}
                            initial={{ width: "100%" }}
                            animate={{ width: `${stability}%` }}
                        />
                    </div>
                    <span>{Math.round(stability)}%</span>
                 </div>
                 
                 <div className="text-gray-400">
                    SYNC RATE: <span className="text-white">{syncRate}%</span>
                 </div>
             </div>
         </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            
            {/* Main Interface */}
            <div className="md:col-span-2 flex flex-col justify-center">
                <AnimatePresence mode='wait'>
                    {status === "ACTIVE" ? (
                        <motion.div 
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-[#0A0A0A] border border-white/10 p-8 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
                        >
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 p-2 opacity-20">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 2v20M2 12h20" />
                                </svg>
                            </div>

                            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/80 bg-cyan-900/10 px-2 py-1 rounded">
                                    {anomalies[currentIndex].protocol}
                                </span>
                                <span className="text-[10px] font-mono text-gray-600">ID: {anomalies[currentIndex].id}</span>
                            </div>

                            <h2 className="text-xl md:text-2xl font-light mb-8 text-white leading-relaxed tracking-wide">
                                {anomalies[currentIndex].query}
                            </h2>

                            <div className="grid grid-cols-1 gap-3">
                                {anomalies[currentIndex].options.map((option, idx) => (
                                    <button
                                        key={option}
                                        onClick={() => handleOptionClick(option)}
                                        disabled={selectedOption !== null}
                                        className={`w-full text-left p-4 pl-6 border transition-all duration-300 font-mono text-sm relative overflow-hidden group
                                            ${selectedOption === option 
                                                ? option === anomalies[currentIndex].answer 
                                                    ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                                                    : 'bg-red-500/10 border-red-500/50 text-red-400'
                                                : 'bg-black/40 border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 text-gray-400 hover:text-cyan-100'
                                            }
                                            ${selectedOption !== null && option !== selectedOption ? 'opacity-30 blur-[1px]' : ''}
                                        `}
                                    >
                                        <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-cyan-500 transition-colors"></span>
                                        <span className="relative z-10 flex justify-between items-center">
                                            <span className="flex gap-4">
                                                <span className="opacity-30 text-[10px] pt-1">0{idx + 1}</span>
                                                {option}
                                            </span>
                                            {selectedOption === option && (
                                                <motion.span 
                                                    initial={{ opacity: 0 }} 
                                                    animate={{ opacity: 1 }}
                                                    className="text-[9px] uppercase tracking-widest font-bold"
                                                >
                                                    {option === anomalies[currentIndex].answer ? "NEUTRALIZED" : "ERROR"}
                                                </motion.span>
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="h-12 mt-4">
                                {feedback && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`text-xs p-3 border-l-2 ${feedback === 'STABILIZED' ? 'border-green-500 text-green-400/80' : 'border-red-500 text-red-400/80'}`}
                                    >
                                        {anomalies[currentIndex].explanation}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ) : status === "COMPLETED" ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#0A0A0A] border border-white/10 p-12 text-center relative overflow-hidden shadow-[0_0_100px_rgba(0,255,255,0.1)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
                            
                            <div className="text-8xl mb-2 font-mono font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-800 tracking-tighter">
                                {syncRate}%
                            </div>
                            
                            <h2 className="text-xl font-bold mb-6 text-white tracking-[0.3em] uppercase">Calibration Complete</h2>
                            
                            <div className="mb-10 space-y-2">
                                <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Clearance Level Granted</p>
                                <p className={`text-2xl font-bold ${getRank(syncRate) === 'OMEGA' ? 'text-cyan-400 drop-shadow-[0_0_10px_cyan]' : 'text-white'}`}>
                                    {getRank(syncRate)}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 max-w-xs mx-auto">
                                <Link href="/" className="w-full py-3 bg-white text-black font-bold text-xs tracking-[0.2em] hover:bg-cyan-400 transition-all uppercase flex items-center justify-center gap-2">
                                    <span>Enter Simulation</span>
                                    <span>→</span>
                                </Link>
                                <button onClick={resetProtocol} className="w-full py-3 border border-white/10 hover:bg-white/5 text-xs tracking-[0.2em] text-gray-400 transition-all uppercase">
                                    Re-Calibrate
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#0A0A0A] border border-red-500/30 p-12 text-center relative overflow-hidden shadow-[0_0_100px_rgba(255,0,0,0.1)]"
                        >
                            <div className="text-6xl mb-6 font-mono font-bold text-red-500 tracking-tighter">
                                CRITICAL FAILURE
                            </div>
                            <p className="text-gray-400 mb-8 font-mono text-sm">
                                SYSTEM STABILITY COLLAPSED. <br/>
                                OPERATOR NOT SYNCHRONIZED.
                            </p>
                            <button onClick={resetProtocol} className="px-8 py-3 bg-red-900/20 border border-red-500/50 hover:bg-red-900/40 text-red-400 font-bold text-xs tracking-[0.2em] transition-all uppercase">
                                REBOOT SYSTEM
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Sidebar / Logs */}
            <div className="hidden md:flex flex-col gap-6">
                
                {/* Status Card */}
                <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-sm">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Protocol Status</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-gray-400">ANOMALIES</span>
                            <span className="text-white">{status === 'ACTIVE' ? `${currentIndex + 1}/${anomalies.length}` : status === 'COMPLETED' ? 'CLEARED' : 'FAILED'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-gray-400">STABILITY</span>
                            <span className={`${stability < 30 ? 'text-red-500' : 'text-cyan-500'}`}>{Math.round(stability)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-gray-400">SYNC RATE</span>
                            <span className="text-white">{syncRate}%</span>
                        </div>
                    </div>
                </div>

                {/* System Log */}
                <div className="bg-[#0A0A0A] border border-white/5 p-4 flex-1 rounded-sm font-mono text-[10px] text-gray-500 overflow-hidden flex flex-col relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-900/20 to-transparent"></div>
                    <div className="mb-4 text-gray-400 font-bold tracking-widest border-b border-white/5 pb-2 flex justify-between">
                        <span>SYSTEM LOG</span>
                        <span className="animate-pulse text-cyan-500">● REC</span>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                         <div className="absolute bottom-0 w-full flex flex-col gap-3">
                             {log.map((entry, i) => (
                                 <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1 - (i * 0.15), x: 0 }}
                                    className="text-cyan-500/80 truncate border-l border-white/10 pl-2 leading-relaxed"
                                 >
                                     {entry}
                                 </motion.div>
                             ))}
                         </div>
                    </div>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}
