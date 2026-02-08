"use client";

import { useState, useEffect } from 'react';
import * as math from 'mathjs';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgress } from '../contexts/ProgressContext';
import { useLanguage } from '../contexts/LanguageContext';

const LEVELS = [
  { id: 1, func: "x + 2", inputs: [0, 5, -2] },
  { id: 2, func: "2*x - 1", inputs: [0, 1, 4] },
  { id: 3, func: "x^2", inputs: [2, 3, -2] },
  { id: 4, func: "abs(x)", inputs: [-5, 5, -1] },
  { id: 5, func: "2^x", inputs: [0, 1, 3] },
];

export default function FunctionsPage() {
  const { completeLevel } = useProgress();
  const { t, locale, setLocale } = useLanguage();
  const [level, setLevel] = useState(0);
  const [userFunc, setUserFunc] = useState("");
  const [testInput, setTestInput] = useState(1);
  const [history, setHistory] = useState<{in: number, out: number}[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'COMPUTING' | 'SYNCED' | 'ERROR'>('IDLE');
  const [glitch, setGlitch] = useState(false);
  const [systemLog, setSystemLog] = useState<string[]>([]);

  const currentTarget = LEVELS[level];
  const levelName = t(`modules.functions.levels.${currentTarget.id}.name`);
  const levelHint = t(`modules.functions.levels.${currentTarget.id}.hint`);

  const addLog = (msg: string) => setSystemLog(prev => [msg, ...prev].slice(0, 5));

  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    addLog(`INITIATING ${levelName}...`);
    addLog(t('modules.functions.ui.system_advisory') + ": CAUSALITY LINK BROKEN.");
  }, [level, locale]);

  const injectSignal = () => {
    setStatus('COMPUTING');
    setGlitch(true);
    setTimeout(() => setGlitch(false), 200);

    setTimeout(() => {
      try {
        const out = math.evaluate(currentTarget.func, { x: testInput });
        setHistory(prev => [...prev, { in: testInput, out }]);
        setStatus('IDLE');
        addLog(`SIGNAL PROCESSED: IN(${testInput}) -> OUT(${out})`);
      } catch (e) {
        setStatus('ERROR');
        addLog("CRITICAL ERROR: SIGNAL REJECTED.");
      }
    }, 600);
  };

  const verifyFunction = () => {
    try {
      addLog("VERIFYING PATCH...");
      const testValues = [-5, -2, 0, 1, 2, 5, 10];
      let correct = true;
      for (const x of testValues) {
        const targetY = math.evaluate(currentTarget.func, { x });
        const userY = math.evaluate(userFunc, { x });
        if (Math.abs(targetY - userY) > 0.01) {
            correct = false;
            break;
        }
      }
      
      if (correct) {
        setStatus('SYNCED');
        addLog("PATCH SUCCESSFUL. CAUSALITY RESTORED.");
        completeLevel('functions', level + 1);
        
        setTimeout(() => {
          if (level < LEVELS.length - 1) {
            setLevel(level + 1);
            setHistory([]);
            setUserFunc("");
            setStatus('IDLE');
          } else {
            addLog("ALL SECTORS STABILIZED. SYSTEM ONLINE.");
            setShowComplete(true);
          }
        }, 2000);
      } else {
        setStatus('ERROR');
        addLog("PATCH FAILED. LOGIC MISMATCH.");
      }
    } catch (e) {
      setStatus('ERROR');
      addLog("SYNTAX ERROR.");
    }
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-[#e5e5e5] font-mono selection:bg-amber-500/30 transition-colors duration-100 ${glitch ? 'bg-[#1a0505]' : ''}`}>
      
      <AnimatePresence>
        {showComplete && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            >
                <div className="max-w-md w-full border border-amber-500/50 bg-black p-8 relative overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.2)]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 animate-pulse"></div>
                    
                    <h2 className="text-2xl font-bold text-amber-500 mb-2 tracking-widest uppercase">PROTOCOL COMPLETE</h2>
                    <p className="text-xs text-gray-500 mb-6 font-mono">ALL SECTORS STABILIZED. CAUSALITY RESTORED.</p>
                    
                    <div className="space-y-4 mb-8 border-l-2 border-amber-500/20 pl-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">STATUS</span>
                            <span className="text-green-400">ONLINE</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">DATA INTEGRITY</span>
                            <span className="text-amber-400">100.0%</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-400">SYSTEM LOG</span>
                            <span className="text-white animate-pulse">FILE_011 DECRYPTED</span>
                        </div>
                    </div>

                    <Link href="/codex" className="block w-full text-center py-3 bg-amber-500 text-black font-bold tracking-[0.2em] hover:bg-white transition-colors uppercase text-xs">
                        ACCESS CODEX
                    </Link>
                     <Link href="/" className="block w-full text-center py-3 mt-2 border border-white/10 text-gray-500 hover:text-white transition-colors uppercase text-[10px] tracking-widest">
                        {t('common.back_root')}
                    </Link>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 w-full border-b border-white/10 bg-black/80 backdrop-blur-md z-50 h-16 flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-gray-500 hover:text-white uppercase tracking-widest transition-colors">
                {t('common.back_root')}
            </Link>
            <div className="h-4 w-px bg-white/20"></div>
            <h1 className="text-sm font-bold tracking-widest text-amber-500 uppercase">
                {t('common.protocol')}: {t('modules.functions.title')}
            </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold">
             <button onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')} className="px-2 text-white/40 hover:text-white transition-colors uppercase">
                 [{locale.toUpperCase()}]
             </button>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded">{levelName}</div>
            <div className={`px-3 py-1 border rounded transition-colors ${status === 'SYNCED' ? 'bg-green-500/20 border-green-500 text-green-400' : status === 'ERROR' ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-amber-500/10 border-amber-500/50 text-amber-400'}`}>
                {t(`modules.functions.status.${status.toLowerCase()}`)}
            </div>
        </div>
      </header>

      <main className="pt-24 p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-6rem)]">
        
        {/* The Machine (Visualizer) */}
        <section className="relative border border-white/10 bg-[#0a0a0a] rounded-sm overflow-hidden p-8 flex flex-col items-center justify-center shadow-2xl">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,165,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,165,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row items-center w-full justify-between gap-8 z-10">
                {/* Input Stream */}
                <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">{t('modules.functions.ui.input_signal')}</span>
                    <div className="w-32 h-32 border border-white/10 bg-black rounded flex items-center justify-center text-4xl font-bold text-white relative group transition-colors hover:border-amber-500/50">
                        {testInput}
                        <input 
                            type="number" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            value={testInput}
                            onChange={(e) => setTestInput(Number(e.target.value))}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] bg-black px-1 text-amber-500 mb-12">EDIT VALUE</span>
                        </div>
                    </div>
                    <button onClick={injectSignal} className="px-6 py-2 text-xs bg-white/10 border border-white/20 text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all font-bold tracking-widest uppercase">
                        {t('modules.functions.ui.inject_signal')}
                    </button>
                </div>

                {/* The Black Box */}
                <motion.div 
                    animate={status === 'COMPUTING' ? { scale: [1, 1.05, 1], borderColor: ['#333', '#f59e0b', '#333'] } : {}}
                    className="w-48 h-48 bg-black border-2 border-dashed border-amber-500/30 rounded-xl flex flex-col items-center justify-center relative shadow-[0_0_50px_rgba(245,158,11,0.05)]"
                >
                    <span className="text-5xl font-bold text-amber-500 font-serif">f(x)</span>
                    <span className="text-[10px] text-amber-500/50 mt-2 font-mono uppercase tracking-widest">{t('modules.functions.ui.black_box')}</span>
                    
                    {/* Visual Flow Animation */}
                    {status === 'COMPUTING' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="w-full h-full border-2 border-amber-500 rounded-xl animate-ping opacity-50"></div>
                        </div>
                    )}
                </motion.div>

                {/* Output Stream */}
                <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">{t('modules.functions.ui.output_signal')}</span>
                    <div className="w-32 h-32 border border-white/10 bg-black rounded flex items-center justify-center text-4xl font-bold text-amber-400 relative">
                       {status === 'COMPUTING' ? <span className="animate-pulse">...</span> : history.length > 0 ? history[history.length-1].out : '-'}
                    </div>
                    <div className="h-8"></div> {/* Spacer to align with input button */}
                </div>
            </div>

            {/* Hint */}
            <div className="absolute bottom-8 left-0 right-0 text-center px-8">
                <div className="inline-block border-l-2 border-amber-500/50 pl-4 text-left">
                    <p className="text-[10px] text-amber-500 mb-1 font-bold tracking-widest uppercase">{t('modules.functions.ui.system_advisory')}</p>
                    <p className="text-xs text-gray-400 font-mono">"{levelHint}"</p>
                </div>
            </div>
        </section>

        {/* The Terminal (Interaction) */}
        <section className="flex flex-col gap-4">
            
            {/* System Log */}
            <div className="h-1/3 bg-[#080808] border border-white/10 rounded-sm p-4 font-mono text-xs overflow-hidden flex flex-col relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-900/20 to-transparent"></div>
                <div className="border-b border-white/5 pb-2 mb-2 text-gray-600 uppercase tracking-widest text-[10px] flex justify-between">
                    <span>{t('modules.functions.ui.kernel_log')}</span>
                    <span className="animate-pulse text-green-900">{t('common.live')}</span>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col-reverse gap-1">
                    {systemLog.map((log, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1 - (i * 0.15), x: 0 }}
                            className="text-amber-500/80 truncate"
                        >
                            <span className="text-gray-700 mr-2">[{new Date().toLocaleTimeString()}]</span>
                            {log}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* History Table */}
            <div className="flex-1 bg-[#080808] border border-white/10 rounded-sm p-0 font-mono text-sm overflow-hidden flex flex-col">
                <div className="bg-white/5 p-2 text-[10px] text-gray-400 uppercase tracking-widest grid grid-cols-2 text-center border-b border-white/5">
                    <span>{t('modules.functions.ui.input_signal')}</span>
                    <span>{t('modules.functions.ui.output_signal')}</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {history.length === 0 && (
                        <div className="h-full flex items-center justify-center text-gray-800 text-xs italic">
                            // AWAITING SIGNAL INJECTION
                        </div>
                    )}
                    {history.map((h, i) => (
                        <div key={i} className="grid grid-cols-2 text-center py-2 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <span className="text-gray-400">{h.in}</span>
                            <span className="text-amber-400 font-bold">{h.out}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Code Injection */}
            <div className="bg-[#111] border border-white/10 rounded-sm p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('modules.functions.ui.define_logic')}</label>
                </div>
                
                <div className="flex items-center gap-3 font-mono text-lg bg-black border border-white/20 p-3 rounded focus-within:border-amber-500 transition-colors">
                    <span className="text-gray-500 font-serif italic">f(x) =</span>
                    <input 
                        type="text" 
                        value={userFunc}
                        onChange={(e) => setUserFunc(e.target.value)}
                        placeholder="e.g. 2*x + 1"
                        className="flex-1 bg-transparent text-white focus:outline-none placeholder-gray-800"
                        onKeyDown={(e) => e.key === 'Enter' && verifyFunction()}
                        autoFocus
                    />
                </div>

                <button 
                    onClick={verifyFunction}
                    className={`w-full py-4 text-xs font-bold tracking-[0.2em] uppercase transition-all rounded-sm relative overflow-hidden group
                        ${status === 'SYNCED' ? 'bg-green-600 text-black' : 'bg-white text-black hover:bg-amber-500'}
                    `}
                >
                    <span className="relative z-10">{status === 'SYNCED' ? t('modules.functions.ui.system_stabilized') : t('modules.functions.ui.execute_patch')}</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
            </div>

        </section>
      </main>
    </div>
  );
}
