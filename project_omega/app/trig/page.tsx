"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function TrigPage() {
  // --- STATE ---
  const [angle, setAngle] = useState(0); 
  const [amplitude, setAmplitude] = useState(1.0);
  const [frequency, setFrequency] = useState(1.0);
  const [phase, setPhase] = useState(0);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [resonance, setResonance] = useState(0); // 0-100%
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Target values (The "Solution" to find)
  // Hardcoded for now, could be randomized level-by-level
  const targetAmp = 1.5;
  const targetFreq = 2.0;
  const targetPhase = 90; 

  // --- NARRATIVE ---
  const [logMessage, setLogMessage] = useState("INITIALIZING HARMONIC RESONANCE SCAN...");

  // --- ANIMATION LOOP ---
  useEffect(() => {
    let animationFrameId: number;
    let t = 0;

    const animate = () => {
      if (isPlaying) {
        setAngle(prev => (prev + 2) % 360);
        t += 0.02;
      }
      
      // Calculate Resonance (How close are we?)
      // Simple distance metric
      const ampDiff = Math.abs(amplitude - targetAmp);
      const freqDiff = Math.abs(frequency - targetFreq);
      const phaseDiff = Math.abs(phase - targetPhase);
      
      // Normalize to 0-100 score
      // Allow some tolerance
      let score = 100 - (ampDiff * 20 + freqDiff * 20 + (phaseDiff / 3.6));
      score = Math.max(0, Math.min(100, score));
      setResonance(score);

      if (score > 95) {
        setLogMessage("RESONANCE STABLE. WAVEFORM LOCKED.");
      } else if (score > 70) {
        setLogMessage("APPROACHING HARMONIC SYNC...");
      } else {
        setLogMessage("SIGNAL DISSONANCE DETECTED. ADJUST PARAMETERS.");
      }

      draw(t);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, amplitude, frequency, phase]);

  // --- DRAWING ---
  const draw = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background Grid (Oscilloscope Style)
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
    const unitScale = 50; // 50px = 1 unit

    // --- DRAW TARGET WAVE (GHOST) ---
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      // Map x to radians
      const rad = (x / unitScale) * 0.5; // Scale factor
      const y = cy - (targetAmp * unitScale) * Math.sin((targetFreq * rad) + (targetPhase * Math.PI / 180));
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);


    // --- DRAW PLAYER WAVE ---
    // Color shifts based on resonance
    const waveColor = resonance > 90 ? '#00ff00' : (resonance > 50 ? '#ffff00' : '#ff0055');
    
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = waveColor;
    
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const rad = (x / unitScale) * 0.5; 
      // y = A * sin(B * (x + C)) + D
      const y = cy - (amplitude * unitScale) * Math.sin((frequency * rad) + (phase * Math.PI / 180));
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // --- DRAW UNIT CIRCLE VISUALIZATION (Optional Overlay) ---
    // Keeping it simple for now to focus on the wave matching.
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-green-500 font-mono">
        {/* HEADER */}
        <header className="border-b border-green-900/30 h-16 flex items-center justify-between px-6 sticky top-0 bg-black/80 backdrop-blur-md z-10">
             <div className="flex items-center gap-4">
                 <Link href="/" className="text-sm font-bold text-gray-500 hover:text-green-400">← EXIT SIMULATION</Link>
                 <h1 className="text-xl font-bold tracking-widest text-white">PROTOCOL: HARMONIC_SYNC</h1>
             </div>
             <div className="flex items-center gap-2">
                 <div className={`w-3 h-3 rounded-full ${resonance > 95 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                 <span className="text-xs text-gray-400">STATUS: {resonance > 95 ? 'LOCKED' : 'SEARCHING'}</span>
             </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row p-6 gap-6 overflow-hidden">
            
            {/* CONTROLS PANEL */}
            <div className="w-full md:w-1/3 space-y-6 order-2 md:order-1">
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-sm shadow-lg">
                    <div className="mb-6 border-b border-gray-800 pb-2">
                         <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Parameters</h2>
                    </div>

                    {/* AMPLITUDE */}
                    <div className="mb-8">
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

                    {/* FREQUENCY */}
                    <div className="mb-8">
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-purple-400">FREQUENCY (Hertz)</label>
                            <span className="text-xs text-white">{frequency.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="0.1" max="5.0" step="0.1"
                            value={frequency} 
                            onChange={(e) => setFrequency(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    {/* PHASE */}
                    <div className="mb-8">
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-yellow-400">PHASE (Shift)</label>
                            <span className="text-xs text-white">{phase}°</span>
                        </div>
                        <input 
                            type="range" min="0" max="360" step="15"
                            value={phase} 
                            onChange={(e) => setPhase(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-800">
                        <p className="text-xs text-gray-500 font-mono mb-2">SYSTEM LOG:</p>
                        <div className="text-xs text-green-400 font-mono h-12 overflow-hidden whitespace-pre-wrap">
                            {'>'} {logMessage}
                        </div>
                    </div>
                </div>
            </div>

            {/* VISUALIZATION */}
            <div className="w-full md:w-2/3 bg-black border border-gray-800 rounded-sm relative order-1 md:order-2">
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <span className="text-[10px] text-gray-600 font-mono block">OSCILLOSCOPE VIEW</span>
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
