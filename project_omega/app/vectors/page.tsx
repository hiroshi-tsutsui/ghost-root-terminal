// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { GeistMono } from 'geist/font/mono';
import { useProgress } from '../contexts/ProgressContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Line } from '@react-three/drei';

// --- Constants ---
const MODULE_ID = 'vectors';

// --- 3D Components ---
function VectorArrow({ start = [0, 0, 0], end, color = 'orange', label = '' }: { start?: [number, number, number], end: [number, number, number], color?: string, label?: string }) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endVec, startVec);
  const length = direction.length();
  
  if (length < 0.001) return null;

  const dirNormalized = direction.clone().normalize();
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirNormalized);
  const midPoint = startVec.clone().add(direction.clone().multiplyScalar(0.5));

  return (
    <group>
      <mesh position={midPoint} quaternion={quaternion}>
        <cylinderGeometry args={[0.05, 0.05, length, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={endVec} quaternion={quaternion}>
        <coneGeometry args={[0.15, 0.4, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.1} metalness={0.8} />
      </mesh>
      {label && (
        <Text
          position={endVec.clone().add(new THREE.Vector3(0, 0.4, 0))}
          fontSize={0.4}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="black"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

function Scene({ v1, v2, showComponents }: { v1: [number, number, number], v2: [number, number, number], showComponents: boolean }) {
  const vec1 = new THREE.Vector3(...v1);
  const vec2 = new THREE.Vector3(...v2);
  const crossProd = new THREE.Vector3().crossVectors(vec1, vec2);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0071e3" />
      
      <Grid infiniteGrid fadeDistance={40} fadeStrength={5} sectionColor="#333" cellColor="#111" />
      
      <Line points={[[-10, 0, 0], [10, 0, 0]]} color="#333" lineWidth={1} />
      <Line points={[[0, -10, 0], [0, 10, 0]]} color="#333" lineWidth={1} />
      <Line points={[[0, 0, -10], [0, 0, 10]]} color="#333" lineWidth={1} />

      <VectorArrow end={v1} color="#0071e3" label="A" />
      {showComponents && (
        <group>
          <Line points={[[v1[0], 0, 0], [v1[0], v1[1], 0], [v1[0], v1[1], v1[2]]]} color="#0071e3" lineWidth={1} dashed dashScale={0.5} opacity={0.3} transparent />
          <Line points={[[0, 0, v1[2]], [0, v1[1], v1[2]], [v1[0], v1[1], v1[2]]]} color="#0071e3" lineWidth={1} dashed dashScale={0.5} opacity={0.3} transparent />
        </group>
      )}

      <VectorArrow end={v2} color="#ff3b30" label="B" />
       {showComponents && (
        <group>
          <Line points={[[v2[0], 0, 0], [v2[0], v2[1], 0], [v2[0], v2[1], v2[2]]]} color="#ff3b30" lineWidth={1} dashed dashScale={0.5} opacity={0.3} transparent />
          <Line points={[[0, 0, v2[2]], [0, v2[1], v2[2]], [v2[0], v2[1], v2[2]]]} color="#ff3b30" lineWidth={1} dashed dashScale={0.5} opacity={0.3} transparent />
        </group>
      )}

      <VectorArrow end={[crossProd.x, crossProd.y, crossProd.z]} color="#af52de" label="A×B" />
      
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} />
    </>
  );
}

export default function VectorsPage() {
  const { moduleProgress, completeLevel } = useProgress();
  const { locale, setLocale, t } = useLanguage();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showUnlock, setShowUnlock] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  // Vector State
  const [v1, setV1] = useState<[number, number, number]>([2, 1, 0]);
  const [v2, setV2] = useState<[number, number, number]>([0, 2, 1]);
  const [showComponents, setShowComponents] = useState(false);
  
  const vec1 = new THREE.Vector3(...v1);
  const vec2 = new THREE.Vector3(...v2);
  const dotProduct = vec1.dot(vec2);
  const crossProd = new THREE.Vector3().crossVectors(vec1, vec2);
  const angleDeg = (vec1.angleTo(vec2) * 180 / Math.PI);

  useEffect(() => {
    const progress = moduleProgress[MODULE_ID]?.completedLevels || [];
    let nextLvl = 1;
    if (progress.includes(1)) nextLvl = 2;
    if (progress.includes(2)) nextLvl = 3;
    if (progress.includes(3)) nextLvl = 4;
    setCurrentLevel(nextLvl);
    
    // Initial Log
    setLog([
        `[SYSTEM] LEVEL 0${nextLvl}: ${t(`modules.vectors.levels.${nextLvl}.name`)}`,
        `[OP] ${t(`modules.vectors.levels.${nextLvl}.log_guide`)}`
    ]);
  }, [moduleProgress, t]);

  const addLog = (msg: string) => {
      setLog(prev => [msg, ...prev].slice(0, 8));
  };

  const handleLevelComplete = (lvl: number) => {
      if (showUnlock) return;
      completeLevel(MODULE_ID, lvl);
      setShowUnlock(true);
      addLog(`[SUCCESS] LEVEL 0${lvl} ${t('modules.vectors.completion.synced')}`);
  };

  const handleNextLevel = () => {
    setShowUnlock(false);
  };

  // --- Win Condition Checks ---
  useEffect(() => {
      if (showUnlock) return;

      if (currentLevel === 1) {
          // Task: Magnitude > 5.0
          if (vec1.length() > 5.0) {
              handleLevelComplete(1);
          }
      } else if (currentLevel === 2) {
          // Task: Orthogonality (Dot approx 0)
          // Ensure vectors are significant enough to matter
          if (vec1.length() > 1 && vec2.length() > 1 && Math.abs(dotProduct) < 0.1) {
              handleLevelComplete(2);
          }
      } else if (currentLevel === 3) {
          // Task: Parallel (Angle approx 0 or 180)
          if (vec1.length() > 1 && vec2.length() > 1 && (angleDeg < 5 || angleDeg > 175)) {
              handleLevelComplete(3);
          }
      }
  }, [vec1, vec2, dotProduct, angleDeg, currentLevel, showUnlock]);

  const updateVec = (setter: any, current: any, idx: number, val: number) => {
    const newVec = [...current] as [number, number, number];
    newVec[idx] = isNaN(val) ? 0 : val;
    setter(newVec);
    // Debounce log or just log key actions? Logging every keystroke is too much.
    // addLog(`[OP] VEC UPDATE: [${newVec.join(',')}]`);
  };

  return (
    <div className={`min-h-screen bg-black text-white font-mono selection:bg-cyan-900 ${GeistMono.className}`}>
       
       <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-14 flex items-center px-6 bg-black/80 backdrop-blur-md justify-between">
         <div className="flex items-center gap-4 text-xs tracking-widest">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
               {t('common.back_root')}
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-cyan-500 font-bold">{t('common.protocol')}: {t('modules.vectors.title')}</span>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')} className="text-xs text-white/40 hover:text-white transition-colors uppercase">
                 [{locale.toUpperCase()}]
             </button>
            <div className="text-xs text-white/40">
                {t('common.level')} 0{currentLevel} // {t(`modules.vectors.levels.${currentLevel}.name`)}
            </div>
         </div>
      </header>

      <main className="pt-20 px-6 max-w-7xl mx-auto space-y-16 pb-20">
        
        {/* --- LEVEL 1: BASICS --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.vectors.concepts.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-white/70 leading-relaxed">
                <div>
                    <h3 className="text-white font-bold mb-2">{t('modules.vectors.concepts.def_title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('modules.vectors.concepts.def_body') }} />
                </div>
                <div>
                    <h3 className="text-white font-bold mb-2">{t('modules.vectors.concepts.comp_title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('modules.vectors.concepts.comp_body') }} />
                </div>
            </div>
            {currentLevel === 1 && (
                <div className="mt-4 p-4 bg-cyan-900/10 border border-cyan-500/30 text-cyan-400 text-xs animate-pulse">
                     {`>>`} {t(`modules.vectors.levels.1.desc`)}
                     <br/>
                     <span className="text-white/60">{t('modules.vectors.levels.1.log_guide')}</span>
                </div>
            )}
        </section>

        {/* --- LEVEL 2: THEORY --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.vectors.theory.title')}
            </h2>
            <div className="bg-white/5 border border-white/10 p-6 rounded-sm font-mono text-xs grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                     <div className="mb-4 flex items-center gap-2">
                        <span className="text-white/40">OPERATION:</span> 
                        <span className="text-white font-bold">{t('modules.vectors.theory.dot_term')}</span>
                     </div>
                     <div className="text-xl tracking-widest text-cyan-400 mb-2 font-bold">A · B = |A||B|cos(θ)</div>
                     <p className="text-white/50 leading-relaxed">{t('modules.vectors.theory.dot_desc')}</p>
                </div>
                <div>
                     <div className="mb-4 flex items-center gap-2">
                        <span className="text-white/40">OPERATION:</span> 
                        <span className="text-white font-bold">{t('modules.vectors.theory.cross_term')}</span>
                     </div>
                     <div className="text-xl tracking-widest text-purple-400 mb-2 font-bold">A × B = |A||B|sin(θ)n</div>
                     <p className="text-white/50 leading-relaxed">{t('modules.vectors.theory.cross_desc')}</p>
                </div>
            </div>
             {currentLevel === 2 && (
                 <div className="mt-4 p-4 bg-cyan-900/10 border border-cyan-500/30 text-cyan-400 text-xs animate-pulse">
                    {`>>`} {t('modules.vectors.levels.2.desc')}
                    <br/>
                    <span className="text-white/60">{t('modules.vectors.levels.2.log_guide')}</span>
               </div>
            )}
        </section>

        {/* --- LEVEL 3: VOID SCOUT VIZ --- */}
        <section className="space-y-6">
             <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.vectors.viz.title')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                {/* Left Panel (Controls) */}
                <div className="space-y-6 flex flex-col h-full">
                    
                    {/* Inputs */}
                    <div className="bg-white/5 p-4 border border-white/10 relative group">
                        <div className="absolute top-0 right-0 p-1 text-[9px] text-white/10 group-hover:text-cyan-500 transition-colors">MAIN_THRUSTER</div>
                        <label className="text-[10px] text-white/40 block mb-2 tracking-widest">{t('modules.vectors.viz.controls.vec_a')}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['x', 'y', 'z'].map((axis, i) => (
                                <input key={`v1-${axis}`} type="number" value={v1[i]} onChange={(e) => updateVec(setV1, v1, i, parseFloat(e.target.value))} 
                                    className="w-full bg-black border border-white/20 text-white p-2 text-xs text-center focus:border-cyan-500 outline-none transition-colors" placeholder={axis} />
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-white/5 p-4 border border-white/10 relative group">
                        <div className="absolute top-0 right-0 p-1 text-[9px] text-white/10 group-hover:text-red-500 transition-colors">STABILIZER</div>
                        <label className="text-[10px] text-white/40 block mb-2 tracking-widest">{t('modules.vectors.viz.controls.vec_b')}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['x', 'y', 'z'].map((axis, i) => (
                                <input key={`v2-${axis}`} type="number" value={v2[i]} onChange={(e) => updateVec(setV2, v2, i, parseFloat(e.target.value))} 
                                    className="w-full bg-black border border-white/20 text-white p-2 text-xs text-center focus:border-red-500 outline-none transition-colors" placeholder={axis} />
                            ))}
                        </div>
                    </div>

                    {/* Stats & Log */}
                    <div className="flex-1 bg-black border border-white/10 p-4 font-mono text-xs flex flex-col relative">
                         <div className="absolute top-2 right-2 text-[9px] text-white/20">SENSOR_ARRAY_ACTIVE</div>
                         <div className="border-b border-white/10 pb-2 mb-2 text-white/30 tracking-widest">{t('modules.vectors.viz.controls.telemetry')}</div>
                         
                         <div className="space-y-2 mb-4">
                             <div className="flex justify-between border-b border-white/5 pb-1">
                                 <span className="text-white/60">{t('modules.vectors.viz.controls.dot')}</span>
                                 <span className={`font-bold ${currentLevel === 2 && Math.abs(dotProduct) < 0.1 ? 'text-green-400 animate-pulse' : 'text-cyan-400'}`}>
                                    {dotProduct.toFixed(2)}
                                </span>
                             </div>
                             <div className="flex justify-between border-b border-white/5 pb-1">
                                 <span className="text-white/60">{t('modules.vectors.viz.controls.cross')}</span>
                                 <span className="text-purple-400 font-bold">({crossProd.x.toFixed(1)}, {crossProd.y.toFixed(1)}, {crossProd.z.toFixed(1)})</span>
                             </div>
                             <div className="flex justify-between items-center pt-1">
                                 <span className="text-white/60">{t('modules.vectors.viz.controls.angle')}</span>
                                 <div className="text-right">
                                     <span className={`block font-bold ${currentLevel === 3 && (angleDeg < 5 || angleDeg > 175) ? 'text-green-400 animate-pulse' : 'text-white'}`}>
                                        {isNaN(angleDeg) ? '-' : angleDeg.toFixed(1)}°
                                     </span>
                                 </div>
                             </div>
                         </div>

                         {/* System Log */}
                         <div className="flex-1 border-t border-white/10 pt-2 overflow-hidden flex flex-col bg-white/5 p-2 rounded-sm">
                             <div className="text-[9px] text-white/30 mb-1 flex justify-between">
                                 <span>SYSTEM_LOG</span>
                                 <span className="text-green-500/50">{t('common.live')}</span>
                             </div>
                             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                {log.map((entry, i) => (
                                    <div key={i} className="text-[10px] text-white/60 truncate hover:text-white transition-colors">
                                        <span className="text-cyan-500 mr-1">{`>`}</span>
                                        {entry}
                                    </div>
                                ))}
                             </div>
                         </div>
                         
                          <div className="pt-4 border-t border-white/10">
                             <button 
                                onClick={() => setShowComponents(!showComponents)}
                                className={`w-full py-2 text-center border transition-all text-[10px] tracking-widest uppercase ${showComponents ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400' : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'}`}
                            >
                                {t('modules.vectors.viz.controls.show_comp')}
                            </button>
                         </div>
                    </div>
                </div>

                {/* Right Panel (Canvas) */}
                <div className="lg:col-span-2 border border-white/10 bg-black relative h-full overflow-hidden group">
                    <div className="absolute top-2 left-2 text-[10px] text-white/20 z-10 group-hover:text-white/40 transition-colors pointer-events-none">
                        {t('modules.vectors.viz.viewport')}
                    </div>
                    
                    <div className="w-full h-full cursor-move">
                        <Canvas camera={{ position: [6, 4, 8], fov: 45 }}>
                            <Scene v1={v1} v2={v2} showComponents={showComponents} />
                        </Canvas>
                    </div>
                </div>
            </div>
             {currentLevel === 3 && (
                 <div className="mt-4 p-4 bg-cyan-900/10 border border-cyan-500/30 text-cyan-400 text-xs animate-pulse">
                    {`>>`} {t('modules.vectors.levels.3.desc')}
                    <br/>
                    <span className="text-white/60">{t('modules.vectors.levels.3.log_guide')}</span>
               </div>
            )}
        </section>

        {/* --- LEVEL 4: APPLICATION --- */}
        <section className="space-y-6 border-t border-white/10 pt-16">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.vectors.apps.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/60">
                <div className="bg-white/5 p-4 border border-white/10 hover:border-cyan-500/30 transition-colors">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.vectors.apps.cg_title')}</h3>
                    <p>{t('modules.vectors.apps.cg_body')}</p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10 hover:border-cyan-500/30 transition-colors">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.vectors.apps.phys_title')}</h3>
                    <p>{t('modules.vectors.apps.phys_body')}</p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10 hover:border-cyan-500/30 transition-colors">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.vectors.apps.nav_title')}</h3>
                    <p>{t('modules.vectors.apps.nav_body')}</p>
                </div>
            </div>
             {currentLevel === 4 && (
                 <button 
                    onClick={() => handleLevelComplete(4)} 
                    className="mt-4 border border-cyan-500/30 text-cyan-400 px-6 py-3 text-xs hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest bg-cyan-900/10"
                 >
                    {t('modules.vectors.completion.synced') || "SYNC COMPLETE"}
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
                <div className="bg-black border border-cyan-500/30 p-8 max-w-md w-full relative overflow-hidden shadow-2xl shadow-cyan-900/20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tighter">{t('modules.vectors.completion.synced')}</h2>
                    <div className="text-cyan-500 text-sm mb-6 flex justify-between items-center">
                        <span>{t(`modules.vectors.levels.${currentLevel}.name`)} COMPLETE</span>
                        <span className="text-white/20 text-[10px]">{currentLevel < 4 ? 'UPLOADING...' : 'ALL_SYSTEMS_GO'}</span>
                    </div>
                    <p className="text-white/60 text-xs mb-8 leading-relaxed border-l-2 border-white/10 pl-4">
                        {t('modules.vectors.completion.msg')}<br/>
                        <span className="text-green-400 mt-2 block">{t('common.xp_awarded')}: +100</span>
                    </p>
                    <button 
                        onClick={handleNextLevel}
                        className="w-full bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 py-3 text-xs hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest font-bold"
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
