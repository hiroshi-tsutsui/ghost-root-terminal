"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GeistMono } from 'geist/font/mono';
import { useProgress } from '../contexts/ProgressContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SoundEngine } from '../utils/SoundEngine';

// --- Constants ---
const MODULE_ID = 'trig';

export default function TrigPage() {
  const { moduleProgress, completeLevel } = useProgress();
  const { t, locale, setLocale } = useLanguage();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showUnlock, setShowUnlock] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  
  // --- Audio / Viz State ---
  const soundRef = useRef<SoundEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  
  // Wave Params
  const [amplitude, setAmplitude] = useState(1.0);
  const [frequency, setFrequency] = useState(1.0);
  const [phase, setPhase] = useState(0);
  
  // Targets
  const [targetAmp, setTargetAmp] = useState(1.5);
  const [targetFreq, setTargetFreq] = useState(1.0);
  const [targetPhase, setTargetPhase] = useState(0);

  const [resonance, setResonance] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Init
  useEffect(() => {
    // Sound Init (Dynamic import or check if class exists to avoid SSR issues if any)
    if (typeof window !== 'undefined') {
        try {
             // Assuming SoundEngine is safe to instantiate
             soundRef.current = new SoundEngine();
        } catch (e) { console.error("Audio init failed", e); }
    }

    const progress = moduleProgress[MODULE_ID]?.completedLevels || [];
    let nextLvl = 1;
    if (progress.includes(1)) nextLvl = 2;
    if (progress.includes(2)) nextLvl = 3;
    if (progress.includes(3)) nextLvl = 4;
    setCurrentLevel(nextLvl);
    
    // Initial Log
    setTimeout(() => {
        if (nextLvl === 3) {
            setLog([`[SYSTEM] ${t('modules.trig.viz.log_start')}`, `[OP] ${t('modules.trig.viz.log_guide')}`]);
            initGameParams();
        } else {
            setLog([`[SYSTEM] LEVEL 0${nextLvl}: ${t(`modules.trig.levels.${nextLvl}.name`)}`]);
        }
    }, 100);

    return () => {
        if (soundRef.current) soundRef.current.stop();
    };
  }, [moduleProgress]); // Removed locale dependency to prevent reset on switch

  const initGameParams = () => {
       setTargetAmp(0.5 + Math.random() * 2.0);
       setTargetFreq(0.5 + Math.random() * 2.5);
       setTargetPhase(Math.floor(Math.random() * 12) * 30);
       setResonance(0);
       setIsLocked(false);
  };

  const toggleMute = () => {
      if (soundRef.current) {
          const muted = soundRef.current.toggleMute();
          setIsMuted(muted);
          if (!muted) soundRef.current.start();
          addLog(`[OP] AUDIO SYSTEM: ${muted ? 'OFF' : 'ON'}`);
      }
  };

  const addLog = (msg: string) => {
      setLog(prev => [msg, ...prev].slice(0, 8));
  };

  const handleLevelComplete = (lvl: number) => {
      completeLevel(MODULE_ID, lvl);
      setShowUnlock(true);
  };

  const handleNextLevel = () => {
    setShowUnlock(false);
  };

  // Loop
  useEffect(() => {
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      time += 0.05;

      // Calculate Resonance
      const ampDiff = Math.abs(amplitude - targetAmp);
      const freqDiff = Math.abs(frequency - targetFreq);
      const phaseDiff = Math.abs(phase - targetPhase);
      
      // Basic scoring
      let score = 100 - (ampDiff * 30 + freqDiff * 30 + (phaseDiff / 3.6));
      score = Math.max(0, Math.min(100, score));
      setResonance(score);

      if (currentLevel === 3 && score > 96 && !isLocked) {
          setIsLocked(true);
          addLog(`[SUCCESS] ${t('modules.trig.viz.status_locked')} [SYNC: 100%]`);
          handleLevelComplete(3);
      }

      // Update Audio
      if (soundRef.current && !isMuted) {
          soundRef.current.update({
              targetFreq, playerFreq: frequency,
              targetAmp, playerAmp: amplitude,
              resonance: score
          });
      }

      // Draw
      const canvas = canvasRef.current;
      if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
              const width = canvas.width;
              const height = canvas.height;
              const cy = height / 2;
              const unit = 50;

              ctx.fillStyle = '#000';
              ctx.fillRect(0, 0, width, height);

              // Grid
              ctx.strokeStyle = '#111';
              ctx.lineWidth = 1;
              for(let x=0; x<width; x+=50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke(); }
              for(let y=0; y<height; y+=50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }
              ctx.strokeStyle = '#333';
              ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();

              // Target (Ghost)
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              for (let x = 0; x < width; x++) {
                  const rad = (x / unit) * 0.5 + time * 0.1; 
                  // Static in space, but phase shift applies
                  const tRad = (x / unit) * 0.5;
                  const y = cy - (targetAmp * unit) * Math.sin((targetFreq * tRad) + (targetPhase * Math.PI / 180));
                  if (x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
              }
              ctx.stroke();
              ctx.setLineDash([]);

              // Player
              const waveColor = score > 90 ? '#00ff9d' : (score > 50 ? '#ffff00' : '#ff0055');
              ctx.strokeStyle = waveColor;
              ctx.lineWidth = 3;
              ctx.shadowBlur = 10; ctx.shadowColor = waveColor;
              ctx.beginPath();
               for (let x = 0; x < width; x++) {
                  const pRad = (x / unit) * 0.5;
                  const y = cy - (amplitude * unit) * Math.sin((frequency * pRad) + (phase * Math.PI / 180));
                   if (x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
              }
              ctx.stroke();
              ctx.shadowBlur = 0;
          }
      }

      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [amplitude, frequency, phase, targetAmp, targetFreq, targetPhase, currentLevel, isLocked, isMuted, t]);


  return (
    <div className={`min-h-screen bg-black text-white font-mono selection:bg-cyan-900 ${GeistMono.className}`}>
       
       <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-14 flex items-center px-6 bg-black/80 backdrop-blur-md justify-between">
         <div className="flex items-center gap-4 text-xs tracking-widest">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
               {t('common.back_root')}
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-cyan-500 font-bold">{t('common.protocol')}: {t('modules.trig.title')}</span>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')} className="text-xs text-white/40 hover:text-white transition-colors uppercase">
                 [{locale.toUpperCase()}]
             </button>
            <div className="text-xs text-white/40">
                {t('modules.trig.viz.viewport')} 0{currentLevel} // {t(`modules.trig.levels.${currentLevel}.name`)}
            </div>
         </div>
      </header>

      <main className="pt-20 px-6 max-w-7xl mx-auto space-y-16 pb-20">
        
        {/* --- LEVEL 1: BASICS --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.trig.concepts.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-white/70 leading-relaxed">
                <div>
                    <h3 className="text-white font-bold mb-2">{t('modules.trig.concepts.circle_title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('modules.trig.concepts.circle_body') }} />
                </div>
                <div>
                    <h3 className="text-white font-bold mb-2">{t('modules.trig.concepts.periodic_title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('modules.trig.concepts.periodic_body') }} />
                </div>
            </div>
            {currentLevel === 1 && (
                 <button onClick={() => handleLevelComplete(1)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {t('common.level')} 01
                 </button>
            )}
        </section>

        {/* --- LEVEL 2: THEORY --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.trig.theory.title')}
            </h2>
            <div className="bg-white/5 border border-white/10 p-6 rounded-sm font-mono text-xs">
                <div className="mb-4">
                    <span className="text-white/40">{t('modules.trig.theory.eq_title')}</span>
                </div>
                <div className="text-center py-8">
                    <div className="text-2xl md:text-3xl tracking-widest text-cyan-400 mb-4">{t('modules.trig.theory.eq_term')}</div>
                    <p className="text-white/50">{t('modules.trig.theory.eq_desc')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/10 pt-4">
                     {['1', '2', '3'].map((key) => (
                         <div key={key} dangerouslySetInnerHTML={{ __html: t(`modules.trig.theory.params_list_${key}`) }} className="text-white/60" />
                     ))}
                </div>
            </div>
             {currentLevel === 2 && (
                 <button onClick={() => handleLevelComplete(2)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {t('common.level')} 02
                 </button>
            )}
        </section>

        {/* --- LEVEL 3: HARMONIC TUNER VIZ --- */}
        <section className="space-y-6">
             <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.trig.viz.title')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                {/* Left Panel (Controls) */}
                <div className="space-y-6 flex flex-col h-full">
                    
                    {/* Controls */}
                    <div className="bg-white/5 p-4 border border-white/10 space-y-4">
                        <div>
                            <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                <span>{t('modules.trig.viz.controls.amp')}</span>
                                <span className="text-blue-400">{amplitude.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0.1" max="3.0" step="0.1" value={amplitude} onChange={e => setAmplitude(parseFloat(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                <span>{t('modules.trig.viz.controls.freq')}</span>
                                <span className="text-purple-400">{frequency.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0.1" max="3.0" step="0.1" value={frequency} onChange={e => setFrequency(parseFloat(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>
                         <div>
                            <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                <span>{t('modules.trig.viz.controls.phase')}</span>
                                <span className="text-yellow-400">{phase}°</span>
                            </div>
                            <input type="range" min="0" max="360" step="15" value={phase} onChange={e => setPhase(parseFloat(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
                        </div>
                    </div>

                    {/* Stats & Log */}
                    <div className="flex-1 bg-black border border-white/10 p-4 font-mono text-xs flex flex-col">
                         <div className="border-b border-white/10 pb-2 mb-2 text-white/30">{t('modules.trig.viz.controls.telemetry')}</div>
                         
                         <div className="space-y-2 mb-4">
                             <div className="flex justify-between items-center">
                                 <span className="text-white/60">{t('modules.trig.viz.controls.resonance')}</span>
                                 <div className="text-right">
                                     <span className={`block text-xl font-bold ${resonance > 90 ? 'text-green-400 animate-pulse' : 'text-red-500'}`}>{resonance.toFixed(0)}%</span>
                                     <span className="text-[9px] text-white/30">
                                         {resonance > 90 ? t('modules.trig.viz.controls.status_locked') : t('modules.trig.viz.controls.status_searching')}
                                     </span>
                                 </div>
                             </div>
                         </div>

                         {/* System Log */}
                         <div className="flex-1 border-t border-white/10 pt-2 overflow-hidden flex flex-col">
                             <div className="text-[9px] text-white/30 mb-1">{t('common.system_log')}</div>
                             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                {log.map((entry, i) => (
                                    <div key={i} className="text-[10px] text-white/60 truncate">
                                        <span className="text-cyan-900 mr-1">{`>`}</span>
                                        {entry}
                                    </div>
                                ))}
                             </div>
                         </div>
                         
                          <div className="pt-4 border-t border-white/10">
                             <button 
                                onClick={toggleMute}
                                className={`w-full py-2 text-center border transition-all text-xs ${!isMuted ? 'bg-green-900/20 border-green-500 text-green-400' : 'border-white/20 text-white/60 hover:text-white'}`}
                            >
                                {t('modules.trig.viz.controls.toggle_audio')}: {isMuted ? 'OFF' : 'ON'}
                            </button>
                         </div>
                    </div>
                </div>

                {/* Right Panel (Canvas) */}
                <div className="lg:col-span-2 border border-white/10 bg-black relative h-full overflow-hidden group">
                    <div className="absolute top-2 left-2 text-[10px] text-white/20 z-10 group-hover:text-white/40 transition-colors">
                        {t('modules.trig.viz.viewport')}
                    </div>
                    
                    <canvas 
                        ref={canvasRef}
                        width={800}
                        height={600}
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
             {currentLevel === 3 && isLocked && (
                 <button onClick={() => handleLevelComplete(3)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {t('common.level')} 03
                 </button>
            )}
        </section>

        {/* --- LEVEL 4: APPLICATION --- */}
        <section className="space-y-6 border-t border-white/10 pt-16">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.trig.apps.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/60">
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.trig.apps.audio_title')}</h3>
                    <p>{t('modules.trig.apps.audio_body')}</p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.trig.apps.ac_title')}</h3>
                    <p>{t('modules.trig.apps.ac_body')}</p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.trig.apps.fourier_title')}</h3>
                    <p>{t('modules.trig.apps.fourier_body')}</p>
                </div>
            </div>
             {currentLevel === 4 && (
                 <button onClick={() => handleLevelComplete(4)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {t('common.level')} 04
                 </button>
            )}
        </section>

      </main>

      {/* Completion Modal */}
      <AnimatePresence>
        {showUnlock && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            >
                <div className="bg-black border border-cyan-500/30 p-8 max-w-md w-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tighter">{t('modules.trig.completion.synced')}</h2>
                    <div className="text-cyan-500 text-sm mb-6">{t('common.level')} 0{currentLevel} COMPLETE</div>
                    <p className="text-white/60 text-xs mb-8 leading-relaxed">
                        {t('modules.trig.completion.msg')}<br/>
                        {t('common.xp_awarded')}: <span className="text-white">+100</span>
                    </p>
                    <button 
                        onClick={handleNextLevel}
                        className="w-full bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 py-3 text-xs hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest"
                    >
                        {currentLevel < 4 ? t('common.next') : t('common.root')}
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
