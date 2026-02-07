// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
  }
];

export default function CalibrationProtocol() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [syncRate, setSyncRate] = useState(100); // Starts at 100%, drops on error
  const [status, setStatus] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"STABILIZED" | "DESYNC" | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [message, ...prev].slice(0, 5));
  };

  useEffect(() => {
    addLog("INITIATING CALIBRATION SEQUENCE...");
    addLog("LOADING ANOMALY DATABASE...");
  }, []);

  const handleOptionClick = (option: string) => {
    if (selectedOption) return; 
    setSelectedOption(option);

    const isCorrect = option === anomalies[currentIndex].answer;

    if (isCorrect) {
      setFeedback("STABILIZED");
      addLog(`ANOMALY ${anomalies[currentIndex].id} NEUTRALIZED.`);
    } else {
      setFeedback("DESYNC");
      setSyncRate(prev => Math.max(0, prev - 25));
      addLog(`CRITICAL ERROR: ${anomalies[currentIndex].id} FAILED.`);
    }

    setTimeout(() => {
      if (currentIndex < anomalies.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
        setFeedback(null);
      } else {
        setStatus("COMPLETED");
        addLog("CALIBRATION COMPLETE. GENERATING REPORT...");
      }
    }, 2000);
  };

  const resetProtocol = () => {
    setCurrentIndex(0);
    setSyncRate(100);
    setStatus("ACTIVE");
    setSelectedOption(null);
    setFeedback(null);
    setLog([]);
    addLog("REBOOTING SYSTEM...");
  };

  const getRank = (rate: number) => {
    if (rate === 100) return "OMEGA";
    if (rate >= 75) return "ARCHITECT";
    if (rate >= 50) return "OPERATOR";
    return "INITIATE";
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-mono flex flex-col relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-white/10 h-16 flex items-center px-6 sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md">
         <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
             <Link href="/" className="text-xs font-bold text-cyan-500 hover:text-cyan-400 transition-colors tracking-widest">
               &lt; ABORT SEQUENCE
             </Link>
             <h1 className="font-bold tracking-widest text-white/90">PROTOCOL: CALIBRATION</h1>
             <div className="text-xs font-mono text-cyan-500">SYNC: {syncRate}%</div>
         </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Main Interface */}
            <div className="md:col-span-2">
                <AnimatePresence mode='wait'>
                    {status === "ACTIVE" ? (
                        <motion.div 
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="bg-[#111] border border-white/10 p-8 rounded-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden"
                        >
                            {/* Decorative scanline */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50"></div>

                            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{anomalies[currentIndex].protocol}</span>
                                <span className="text-[10px] font-mono text-cyan-500">ID: {anomalies[currentIndex].id}</span>
                            </div>

                            <h2 className="text-xl font-bold mb-8 text-white leading-relaxed">{anomalies[currentIndex].query}</h2>

                            <div className="space-y-3">
                                {anomalies[currentIndex].options.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleOptionClick(option)}
                                        disabled={selectedOption !== null}
                                        className={`w-full text-left p-4 rounded-sm border transition-all duration-200 font-mono text-sm relative overflow-hidden group
                                            ${selectedOption === option 
                                                ? option === anomalies[currentIndex].answer 
                                                    ? 'bg-green-500/10 border-green-500 text-green-400' 
                                                    : 'bg-red-500/10 border-red-500 text-red-400'
                                                : 'bg-black/40 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-900/10 text-gray-300'
                                            }
                                            ${selectedOption !== null && option === anomalies[currentIndex].answer && selectedOption !== option ? 'border-green-500 text-green-400 opacity-50' : ''}
                                        `}
                                    >
                                        <span className="relative z-10 flex justify-between items-center">
                                            {option}
                                            {selectedOption === option && (
                                                <span className="text-[10px] uppercase tracking-widest">
                                                    {option === anomalies[currentIndex].answer ? "VERIFIED" : "REJECTED"}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {feedback && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className={`mt-6 p-4 border-l-2 ${feedback === 'STABILIZED' ? 'border-green-500 bg-green-900/10' : 'border-red-500 bg-red-900/10'}`}
                                >
                                    <p className={`text-xs font-bold mb-1 ${feedback === 'STABILIZED' ? 'text-green-400' : 'text-red-400'}`}>
                                        STATUS: {feedback}
                                    </p>
                                    <p className="text-sm text-gray-400">{anomalies[currentIndex].explanation}</p>
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#111] border border-white/10 p-12 text-center rounded-sm relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
                            
                            <div className="text-6xl mb-6 font-mono font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
                                {syncRate}%
                            </div>
                            
                            <h2 className="text-2xl font-bold mb-2 text-white tracking-widest">CALIBRATION COMPLETE</h2>
                            <p className="text-gray-500 mb-8 text-sm font-mono uppercase">
                                Clearance Level: <span className="text-cyan-400 font-bold">{getRank(syncRate)}</span>
                            </p>

                            <div className="flex justify-center gap-4">
                                <button onClick={resetProtocol} className="px-6 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-xs tracking-widest text-white transition-all uppercase">
                                    Re-Calibrate
                                </button>
                                <Link href="/" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs tracking-widest transition-all uppercase">
                                    Return to Hub
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Sidebar / Logs */}
            <div className="hidden md:block">
                <div className="bg-black/50 border border-white/5 p-4 h-full rounded-sm font-mono text-[10px] text-gray-500 overflow-hidden flex flex-col">
                    <div className="mb-4 text-gray-400 font-bold tracking-widest border-b border-white/5 pb-2">SYSTEM LOG</div>
                    <div className="flex-1 overflow-hidden relative">
                         <div className="absolute bottom-0 w-full flex flex-col gap-2">
                             {log.map((entry, i) => (
                                 <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1 - (i * 0.15), x: 0 }}
                                    className="text-cyan-500/80 truncate"
                                 >
                                     <span className="text-gray-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
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
