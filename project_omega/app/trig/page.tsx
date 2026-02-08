"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProgress } from '../contexts/ProgressContext'; // Adjust path if needed

export default function TrigPage() {
  const { completeLevel, moduleProgress } = useProgress();
  const progress = moduleProgress.trig;

  // --- GAME STATE ---
  const [level, setLevel] = useState(1); // 1, 2, 3
  const [levelComplete, setLevelComplete] = useState(false);
  const [missionComplete, setMissionComplete] = useState(false);

  // --- WAVE PARAMETERS ---
  const [angle, setAngle] = useState(0); 
  const [amplitude, setAmplitude] = useState(1.0);
  const [frequency, setFrequency] = useState(1.0);
  const [phase, setPhase] = useState(0);
  
  // --- TARGETS (Randomized per level) ---
  const [targetAmp, setTargetAmp] = useState(1.5);
  const [targetFreq, setTargetFreq] = useState(1.0); // Default locked for L1
  const [targetPhase, setTargetPhase] = useState(0);   // Default locked for L1/L2

  const [isPlaying, setIsPlaying] = useState(true);
  const [resonance, setResonance] = useState(0); // 0-100%
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logMessage, setLogMessage] = useState("INITIALIZING HARMONIC RESONANCE SCAN...");
  const [showHint, setShowHint] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Determine start level based on progress
    const completed = progress?.completedLevels || [];
    if (completed.includes(1) && completed.includes(2)) setLevel(3);
    else if (completed.includes(1)) setLevel(2);
    else setLevel(1);
    
    startLevel(completed.includes(1) ? (completed.includes(2) ? 3 : 2) : 1);
  }, []);

  const startLevel = (lvl: number) => {
    setLevel(lvl);
    setLevelComplete(false);
    setMissionComplete(false);
    setLogMessage(`PROTOCOL PHASE ${lvl}: INITIATED...`);
    
    // Reset Player Vals
    setAmplitude(1.0);
    setFrequency(1.0);
    setPhase(0);

    // Randomize Targets based on Level
    if (lvl === 1) {
       // Only Amplitude varies
       setTargetAmp(1.0 + Math.random() * 1.5); // 1.0 - 2.5
       setTargetFreq(1.0);
       setTargetPhase(0);
    } else if (lvl === 2) {
       // Amplitude + Frequency vary
       setTargetAmp(0.5 + Math.random() * 2.0);
       setTargetFreq(0.5 + Math.random() * 2.5); // 0.5 - 3.0
       setTargetPhase(0);
    } else {
       // All vary
       setTargetAmp(0.5 + Math.random() * 2.0);
       setTargetFreq(0.5 + Math.random() * 3.0);
       setTargetPhase(Math.floor(Math.random() * 24) * 15); // Steps of 15
    }
  };

  const handleNextLevel = () => {
      if (level < 3) {
          startLevel(level + 1);
      } else {
          setMissionComplete(true);
      }
  };

  // --- ANIMATION LOOP ---
  useEffect(() => {
    let animationFrameId: number;
    let t = 0;

    const animate = () => {
      if (isPlaying) {
        setAngle(prev => (prev + 2) % 360);
        t += 0.02;
      }
      
      // Calculate Resonance
      const ampDiff = Math.abs(amplitude - targetAmp);
      const freqDiff = Math.abs(frequency - targetFreq);
      const phaseDiff = Math.abs(phase - targetPhase);
      
      // Scoring Logic
      let score = 0;
      if (level === 1) {
          score = 100 - (ampDiff * 40); // Strict on Amp
      } else if (level === 2) {
          score = 100 - (ampDiff * 30 + freqDiff * 30);
      } else {
          score = 100 - (ampDiff * 20 + freqDiff * 20 + (phaseDiff / 3.6));
      }
      
      score = Math.max(0, Math.min(100, score));
      setResonance(score);

      // Level Completion Logic
      if (score > 96 && !levelComplete) {
        setLogMessage("RESONANCE LOCKED. HARMONY RESTORED. [SYNC: 100%]");
        setLevelComplete(true);
        completeLevel('trig', level);
      } else if (!levelComplete) {
          if (score > 70) setLogMessage("APPROACHING HARMONIC SYNC... [Keep Tuning]");
          else setLogMessage("SIGNAL DISSONANCE DETECTED. REALITY WAVE UNSTABLE.");
      }

      draw(t);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, amplitude, frequency, phase, targetAmp, targetFreq, targetPhase, level, levelComplete]);

  // --- DRAWING ---
  const draw = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    
    // Axis
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, height/2); ctx.lineTo(width, height/2); ctx.stroke();

    const cy = height / 2;
    const unitScale = 50; 

    // Target Wave (Ghost)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const rad = (x / unitScale) * 0.5;
      const y = cy - (targetAmp * unitScale) * Math.sin((targetFreq * rad) + (targetPhase * Math.PI / 180));
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Player Wave
    const waveColor = resonance > 90 ? '#00ff00' : (resonance > 50 ? '#ffff00' : '#ff0055');
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = waveColor;
    
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const rad = (x / unitScale) * 0.5; 
      const y = cy - (amplitude * unitScale) * Math.sin((frequency * rad) + (phase * Math.PI / 180));
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-green-500 font-mono relative">
        
        {/* LEVEL COMPLETE OVERLAY */}
        {levelComplete && !missionComplete && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-gray-900 border border-green-500 p-8 rounded-lg max-w-md text-center shadow-[0_0_50px_rgba(0,255,0,0.3)]">
                    <h2 className="text-2xl font-bold text-green-400 mb-4 tracking-widest">PHASE {level} SYNCED</h2>
                    <p className="text-gray-400 mb-6 text-sm">HARMONIC RESONANCE ESTABLISHED.</p>
                    <button 
                        onClick={handleNextLevel}
                        className="bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-8 rounded shadow-lg uppercase tracking-wider"
                    >
                        INITIALIZE PHASE {level + 1}
                    </button>
                </div>
            </div>
        )}

        {/* MISSION COMPLETE OVERLAY */}
        {missionComplete && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
                <div className="bg-gray-900 border border-green-500 p-10 rounded-lg max-w-lg text-center shadow-[0_0_80px_rgba(0,255,0,0.5)]">
                    <h2 className="text-4xl font-bold text-white mb-2 tracking-widest">PROTOCOL COMPLETE</h2>
                    <p className="text-green-400 mb-8 text-lg font-mono">REALITY WAVE STABILIZED.</p>
                    <div className="text-left bg-black/50 p-4 rounded mb-8 border border-gray-800 text-xs text-gray-400 font-mono">
                        <p>{'>'} GENERATING REPORT...</p>
                        <p>{'>'} AMPLITUDE: OPTIMAL</p>
                        <p>{'>'} FREQUENCY: STABLE</p>
                        <p>{'>'} PHASE: ALIGNED</p>
                        <p className="text-green-500 mt-2">{'>'} STATUS: OMEGA CLEARANCE GRANTED</p>
                    </div>
                    <Link href="/codex" className="inline-block bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-8 rounded shadow-lg uppercase tracking-wider mr-4">
                        ACCESS SYSTEM LOGS
                    </Link>
                    <Link href="/" className="inline-block border border-gray-600 hover:border-white text-gray-400 hover:text-white py-3 px-8 rounded uppercase tracking-wider">
                        RETURN TO HUB
                    </Link>
                </div>
            </div>
        )}

        {/* HEADER */}
        <header className="border-b border-green-900/30 h-16 flex items-center justify-between px-6 sticky top-0 bg-black/80 backdrop-blur-md z-10">
             <div className="flex items-center gap-4">
                 <Link href="/" className="text-sm font-bold text-gray-500 hover:text-green-400">← EXIT SIMULATION</Link>
                 <h1 className="text-xl font-bold tracking-widest text-white">PROTOCOL: HARMONIC_SYNC</h1>
             </div>
             <div className="flex items-center gap-4">
                 <div className="hidden md:flex gap-1">
                    {[1,2,3].map(l => (
                        <div key={l} className={`h-2 w-8 rounded-full ${level >= l ? (levelComplete && level === l ? 'bg-green-400' : 'bg-green-600') : 'bg-gray-800'}`}></div>
                    ))}
                 </div>
                 <div className="flex items-center gap-2">
                     <div className={`w-3 h-3 rounded-full ${resonance > 95 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                     <span className="text-xs text-gray-400">STATUS: {resonance > 95 ? 'LOCKED' : 'SEARCHING'}</span>
                 </div>
             </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row p-6 gap-6 overflow-hidden">
            
            {/* CONTROLS PANEL */}
            <div className="w-full md:w-1/3 space-y-6 order-2 md:order-1">
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-sm shadow-lg">
                    <div className="mb-6 border-b border-gray-800 pb-2 flex justify-between items-center">
                         <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Parameters [PHASE {level}]</h2>
                    </div>

                    {/* AMPLITUDE */}
                    <div className="mb-8 opacity-100">
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-blue-400">AMPLITUDE (Energy)</label>
                            <span className="text-xs text-white">{amplitude.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="0.1" max="3.0" step="0.1"
                            value={amplitude} 
                            onChange={(e) => setAmplitude(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* FREQUENCY (Locked in Level 1) */}
                    <div className={`mb-8 transition-opacity duration-500 ${level >= 2 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-purple-400">FREQUENCY (Time) {level < 2 && '[LOCKED]'}</label>
                            <span className="text-xs text-white">{frequency.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="0.1" max="5.0" step="0.1"
                            value={frequency} 
                            onChange={(e) => setFrequency(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            disabled={level < 2}
                        />
                    </div>

                    {/* PHASE (Locked in Level 1 & 2) */}
                    <div className={`mb-8 transition-opacity duration-500 ${level >= 3 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-yellow-400">PHASE (Reality Shift) {level < 3 && '[LOCKED]'}</label>
                            <span className="text-xs text-white">{phase}°</span>
                        </div>
                        <input 
                            type="range" min="0" max="360" step="15"
                            value={phase} 
                            onChange={(e) => setPhase(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            disabled={level < 3}
                        />
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                           <p className="text-xs text-gray-500 font-mono">SYSTEM LOG:</p>
                           <button 
                             onClick={() => setShowHint(!showHint)}
                             className="text-[10px] text-cyan-600 hover:text-cyan-400 border border-cyan-900 px-2 py-1 rounded transition-colors"
                           >
                              {showHint ? "HIDE SCHEMATICS" : "REQUEST SCHEMATICS"}
                           </button>
                        </div>
                        
                        {showHint && (
                           <div className="mb-4 bg-blue-900/10 border border-blue-900/30 p-2 rounded text-[10px] font-mono text-cyan-400 animate-pulse">
                              <p className="mb-1">TARGET_AMP: {targetAmp.toFixed(1)} UNITS</p>
                              {level >= 2 && <p className="mb-1">TARGET_FREQ: {targetFreq.toFixed(1)} HZ</p>}
                              {level >= 3 && <p>TARGET_PHASE: {targetPhase}°</p>}
                           </div>
                        )}

                        <div className="text-xs text-green-400 font-mono h-12 overflow-hidden whitespace-pre-wrap">
                            {'>'} {logMessage}
                        </div>
                    </div>
                </div>
            </div>

            {/* VISUALIZATION */}
            <div className="w-full md:w-2/3 bg-black border border-gray-800 rounded-sm relative order-1 md:order-2">
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <span className="text-[10px] text-gray-600 font-mono block">OSCILLOSCOPE VIEW // PHASE {level}</span>
                    <span className="text-[10px] text-gray-600 font-mono block">RES: {resonance.toFixed(1)}%</span>
                </div>
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={500} 
                    className="w-full h-full object-cover" 
                />
            </div>
        </main>
    </div>
  );
}
