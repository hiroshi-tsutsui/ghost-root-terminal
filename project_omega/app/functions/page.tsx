// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_LEVELS = [
  { id: 1, name: "Linear Drift", func: "2*x + 1", hint: "Look at the slope.", inputs: [0, 1, 2, 5] },
  { id: 2, name: "Quadratic Surge", func: "x^2 - 1", hint: "Power is accumulating.", inputs: [0, 1, 2, 3] },
  { id: 3, name: "Exponential Hazard", func: "2^x", hint: "Runaway reaction.", inputs: [0, 1, 2, 3] },
];

export default function FunctionsPage() {
  const [level, setLevel] = useState(0);
  const [userFunc, setUserFunc] = useState("");
  const [testInput, setTestInput] = useState(1);
  const [history, setHistory] = useState<{in: number, out: number}[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'COMPUTING' | 'SYNCED' | 'ERROR'>('IDLE');
  
  const currentTarget = MOCK_LEVELS[level];

  const injectSignal = () => {
    setStatus('COMPUTING');
    setTimeout(() => {
      try {
        const out = math.evaluate(currentTarget.func, { x: testInput });
        setHistory(prev => [...prev, { in: testInput, out }]);
        setStatus('IDLE');
      } catch (e) {
        setStatus('ERROR');
      }
    }, 600);
  };

  const verifyFunction = () => {
    try {
      // Check across a range of test values
      const testValues = [-5, 0, 1, 5, 10];
      let correct = true;
      for (const x of testValues) {
        const targetY = math.evaluate(currentTarget.func, { x });
        const userY = math.evaluate(userFunc, { x });
        if (Math.abs(targetY - userY) > 0.01) correct = false;
      }
      
      if (correct) {
        setStatus('SYNCED');
        setTimeout(() => {
          if (level < MOCK_LEVELS.length - 1) {
            setLevel(level + 1);
            setHistory([]);
            setUserFunc("");
            setStatus('IDLE');
          }
        }, 2000);
      } else {
        setStatus('ERROR');
        setTimeout(() => setStatus('IDLE'), 1000);
      }
    } catch (e) {
      setStatus('ERROR');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-mono selection:bg-amber-500/30">
      
      {/* Header */}
      <header className="fixed top-0 w-full border-b border-white/10 bg-black/80 backdrop-blur-md z-50 p-6 flex justify-between items-center">
        <div>
            <Link href="/" className="text-xs text-amber-500/80 hover:text-amber-400 mb-1 block tracking-widest uppercase">← System Root</Link>
            <h1 className="text-2xl font-bold tracking-tighter text-white">CAUSALITY ENGINE // {currentTarget.name}</h1>
        </div>
        <div className="flex gap-4 text-xs font-bold">
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded">LEVEL {level + 1}</div>
            <div className={`px-3 py-1 border rounded transition-colors ${status === 'SYNCED' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-amber-500/10 border-amber-500/50 text-amber-400'}`}>
                STATUS: {status}
            </div>
        </div>
      </header>

      <main className="pt-32 p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* The Machine (Visualizer) */}
        <section className="relative aspect-square border border-white/10 bg-black rounded-lg overflow-hidden p-8 flex flex-col items-center justify-center">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
            
            <div className="flex items-center w-full justify-between gap-4 z-10">
                {/* Input Stream */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Input (x)</span>
                    <div className="w-24 h-24 border border-white/20 bg-white/5 rounded flex items-center justify-center text-3xl font-bold text-white relative group">
                        {testInput}
                        <div className="absolute -right-4 top-1/2 w-4 h-[1px] bg-white/20"></div>
                        <input 
                            type="number" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            value={testInput}
                            onChange={(e) => setTestInput(Number(e.target.value))}
                        />
                    </div>
                    <button onClick={injectSignal} className="mt-2 px-4 py-1 text-xs bg-white text-black font-bold hover:bg-amber-400 transition-colors">INJECT SIGNAL</button>
                </div>

                {/* The Black Box */}
                <motion.div 
                    animate={status === 'COMPUTING' ? { scale: [1, 1.05, 1], borderColor: ['#333', '#f59e0b', '#333'] } : {}}
                    className="w-48 h-48 bg-black border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center relative shadow-[0_0_40px_rgba(245,158,11,0.1)]"
                >
                    <span className="text-4xl font-bold text-amber-500">f(x)</span>
                    <span className="text-[10px] text-amber-500/50 mt-2 font-mono uppercase tracking-widest">Processing Logic</span>
                    
                    {/* Visual Flow Animation */}
                    {status === 'COMPUTING' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="w-full h-[1px] bg-amber-500 animate-ping"></div>
                        </div>
                    )}
                </motion.div>

                {/* Output Stream */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Output (y)</span>
                    <div className="w-24 h-24 border border-white/20 bg-white/5 rounded flex items-center justify-center text-3xl font-bold text-amber-400 relative">
                       {status === 'COMPUTING' ? <span className="animate-pulse">...</span> : history.length > 0 ? history[history.length-1].out : '-'}
                       <div className="absolute -left-4 top-1/2 w-4 h-[1px] bg-white/20"></div>
                    </div>
                </div>
            </div>

            {/* Hint */}
            <div className="absolute bottom-8 text-center">
                <p className="text-xs text-gray-600 mb-1">SYSTEM LOG:</p>
                <p className="text-sm text-gray-400">"{currentTarget.hint}"</p>
            </div>
        </section>

        {/* The Terminal (Interaction) */}
        <section className="flex flex-col gap-6">
            
            {/* History Log */}
            <div className="flex-1 bg-black border border-white/10 rounded-lg p-4 font-mono text-sm overflow-hidden flex flex-col">
                <div className="border-b border-white/10 pb-2 mb-2 text-xs text-gray-500 uppercase flex justify-between">
                    <span>Signal Trace Log</span>
                    <span>Running...</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                    {history.length === 0 && <span className="text-gray-700 italic">// No signals injected yet.</span>}
                    {history.map((h, i) => (
                        <div key={i} className="flex justify-between hover:bg-white/5 p-1 rounded cursor-default">
                            <span className="text-gray-400">INPUT: {h.in}</span>
                            <span className="text-amber-500">OUTPUT: {h.out}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Code Injection */}
            <div className="bg-[#111] border border-white/10 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-white uppercase tracking-widest">Defining Function f(x)</label>
                    {status === 'ERROR' && <span className="text-red-500 text-xs animate-pulse">SYNTAX ERROR / MISMATCH</span>}
                    {status === 'SYNCED' && <span className="text-green-500 text-xs font-bold">CAUSALITY RESTORED</span>}
                </div>
                
                <div className="flex items-center gap-3 font-mono text-lg">
                    <span className="text-gray-500">f(x) =</span>
                    <input 
                        type="text" 
                        value={userFunc}
                        onChange={(e) => setUserFunc(e.target.value)}
                        placeholder="e.g. 2*x + 1"
                        className="flex-1 bg-black border border-white/20 rounded px-3 py-2 text-white focus:border-amber-500 focus:outline-none placeholder-gray-700"
                        onKeyDown={(e) => e.key === 'Enter' && verifyFunction()}
                    />
                </div>

                <button 
                    onClick={verifyFunction}
                    className={`w-full py-3 text-sm font-bold tracking-widest uppercase transition-all
                        ${status === 'SYNCED' ? 'bg-green-500 text-black' : 'bg-white text-black hover:bg-amber-400'}
                    `}
                >
                    {status === 'SYNCED' ? 'System Stabilized' : 'Execute Patch'}
                </button>
            </div>

        </section>
      </main>
    </div>
  );
}
