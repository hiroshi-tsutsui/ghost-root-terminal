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

// --- Localization Content ---
const LOCAL_CONTENT = {
    en: {
        title: "VOID SCOUT",
        levels: {
            1: { name: "BASICS", desc: "Direction & Magnitude." },
            2: { name: "THEORY", desc: "Dot & Cross Products." },
            3: { name: "VISUALIZATION", desc: "Drone Calibration." },
            4: { name: "APPLY", desc: "Navigation & Forces." }
        },
        concepts: {
            title: "Concept: The Arrow of Reality",
            def_title: "Vectors",
            def_body: "A vector is not just a number; it's an instruction. <strong>Go this far, in this direction.</strong> It describes movement, force, and flow.",
            comp_title: "Components",
            comp_body: "We break vectors down into X, Y, and Z steps. A diagonal flight path is just a combination of forward, right, and up movements."
        },
        theory: {
            title: "Theory: Spatial Logic",
            dot_term: "Dot Product (Inner)",
            dot_desc: "A · B = |A||B|cos(θ). Measures alignment. If 0, they are perpendicular (Orthogonal). Used for lighting calculations and checking 'facing' direction.",
            cross_term: "Cross Product (Outer)",
            cross_desc: "A × B. Creates a new vector perpendicular to both. Essential for finding rotation axes, torque, and surface normals."
        },
        viz: {
            title: "Protocol: Void Scout",
            log_start: "VOID SCOUT CALIBRATION...",
            log_guide: "ALIGN THRUSTERS. ORTHOGONALITY CHECK REQUIRED.",
            controls: {
                vec_a: "VECTOR A (Main Thrust)",
                vec_b: "VECTOR B (Stabilizer)",
                telemetry: "TELEMETRY",
                dot: "DOT PROD (Align)",
                cross: "CROSS PROD (Torque)",
                angle: "ANGLE (Deg)",
                show_plane: "VISUALIZE PLANE",
                show_comp: "SHOW COMPONENTS"
            },
            viewport: "SIMULATION_VIEWPORT"
        },
        apps: {
            title: "Applications: 3D Space",
            cg_title: "Computer Graphics",
            cg_body: "Every 3D game uses vectors for everything. Lighting (dot product with normals), camera direction, and movement.",
            phys_title: "Physics & Forces",
            phys_body: "Gravity, wind, and thrust are all vectors. We sum them up (Net Force) to determine where an object will go.",
            nav_title: "Navigation",
            nav_body: "GPS and flight paths. 'Heading' and 'Speed' combine to form the velocity vector."
        },
        completion: {
            synced: "SENSORS CALIBRATED",
            msg: "The Void Scout is ready for deep space. You command the dimensions."
        }
    },
    ja: {
        title: "ヴォイド・スカウト (ベクトル)",
        levels: {
            1: { name: "基礎 (Basics)", desc: "「向き」と「大きさ」。" },
            2: { name: "理論 (Logic)", desc: "内積と外積の幾何学。" },
            3: { name: "可視化 (Viz)", desc: "ドローン姿勢制御プロトコル。" },
            4: { name: "応用 (Applications)", desc: "3D空間の支配。" }
        },
        concepts: {
            title: "概念：現実を射抜く矢",
            def_title: "ベクトルとは",
            def_body: "単なる数字ではなく、<strong>「あちらへ、これだけ進め」</strong>という命令です。力、速度、流れなど、世界を動かす要素はすべてベクトルで記述されます。",
            comp_title: "成分分解",
            comp_body: "斜めへの複雑な動きも、X（横）、Y（縦）、Z（高さ）という単純な動きの組み合わせに分解できます。これを「成分」と呼びます。"
        },
        theory: {
            title: "理論：空間のロジック",
            dot_term: "内積 (Dot Product)",
            dot_desc: "A・B。二つの矢印が「どれだけ同じ方向を向いているか」を表します。値が0なら直角（直交）。CGのライティング（光の当たり方）計算の基礎です。",
            cross_term: "外積 (Cross Product)",
            cross_desc: "A×B。二つの矢印の両方に直角な、新しい矢印を生み出します。回転軸（トルク）や、面の向き（法線）を見つけるために不可欠です。"
        },
        viz: {
            title: "プロトコル：ヴォイド・スカウト",
            log_start: "姿勢制御システム起動...",
            log_guide: "スラスターベクトルを調整し、空間把握を開始せよ。",
            controls: {
                vec_a: "ベクトル A (主推進)",
                vec_b: "ベクトル B (姿勢制御)",
                telemetry: "テレメトリ",
                dot: "内積 (直交性)",
                cross: "外積 (回転軸)",
                angle: "角度 (Deg)",
                show_plane: "平面を可視化",
                show_comp: "成分を表示"
            },
            viewport: "SIMULATION_VIEWPORT"
        },
        apps: {
            title: "応用：3D空間",
            cg_title: "コンピュータグラフィックス",
            cg_body: "3Dゲームの映像はベクトルの塊です。ポリゴンの向き（法線）と光の向きの内積で、その面が明るいか暗いかが決まります。",
            phys_title: "物理演算",
            phys_body: "重力、風、エンジンの推力。これら全てのベクトルを足し合わせた「合力」が、物体の次の瞬間の動きを決定します。",
            nav_title: "ナビゲーション",
            nav_body: "GPSや航空機の運航。「進路（Heading）」と「速さ（Speed）」を合わせたものが速度ベクトルです。"
        },
        completion: {
            synced: "センサー補正完了",
            msg: "ヴォイド・スカウト、発進準備完了。あなたは次元を掌握しました。"
        }
    }
};

// --- 3D Components (Preserved & Adapted) ---
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

function PlaneVisualizer({ normal, constant }: { normal: [number, number, number], constant: number }) {
    const n = new THREE.Vector3(...normal);
    if (n.lengthSq() === 0) return null;
    
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n.clone().normalize());
    const pos = n.clone().multiplyScalar(constant / (n.lengthSq() || 1));

    return (
        <group position={pos} quaternion={quaternion}>
            <mesh>
                <planeGeometry args={[12, 12]} />
                <meshStandardMaterial color="#0071e3" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} wireframe />
            </mesh>
            <gridHelper args={[12, 12, 0x0071e3, 0x003366]} rotation={[Math.PI/2, 0, 0]} />
            <VectorArrow start={[0,0,0]} end={[0, 0, 2]} color="#0071e3" label="n" />
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
  const { locale, setLocale, t: globalT } = useLanguage();
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

  // Helper for local content
  const t = (key: string) => {
      const keys = key.split('.');
      if (keys[0] === 'modules' && keys[1] === 'vectors') {
          let obj = LOCAL_CONTENT[locale as 'en' | 'ja'];
          for (let i = 2; i < keys.length; i++) {
              if (obj) obj = obj[keys[i]];
          }
          if (obj) return obj;
      }
      return globalT(key);
  };

  useEffect(() => {
    const progress = moduleProgress[MODULE_ID]?.completedLevels || [];
    let nextLvl = 1;
    if (progress.includes(1)) nextLvl = 2;
    if (progress.includes(2)) nextLvl = 3;
    if (progress.includes(3)) nextLvl = 4;
    setCurrentLevel(nextLvl);
    
    if (nextLvl === 3) {
        setLog([`[SYSTEM] ${t('modules.vectors.viz.log_start')}`, `[OP] ${t('modules.vectors.viz.log_guide')}`]);
    }
  }, [moduleProgress, locale]);

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

  const updateVec = (setter: any, current: any, idx: number, val: number) => {
    const newVec = [...current] as [number, number, number];
    newVec[idx] = isNaN(val) ? 0 : val;
    setter(newVec);
    addLog(`[OP] VECTOR UPDATE: [${newVec[0]}, ${newVec[1]}, ${newVec[2]}]`);
  };

  return (
    <div className={`min-h-screen bg-black text-white font-mono selection:bg-cyan-900 ${GeistMono.className}`}>
       
       <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-14 flex items-center px-6 bg-black/80 backdrop-blur-md justify-between">
         <div className="flex items-center gap-4 text-xs tracking-widest">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
               {globalT('common.back_root')}
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-cyan-500 font-bold">{globalT('common.protocol')}: {t('modules.vectors.title')}</span>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')} className="text-xs text-white/40 hover:text-white transition-colors uppercase">
                 [{locale.toUpperCase()}]
             </button>
            <div className="text-xs text-white/40">
                {t('modules.vectors.viz.viewport')} 0{currentLevel} // {t(`modules.vectors.levels.${currentLevel}.name`)}
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
                 <button onClick={() => handleLevelComplete(1)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {globalT('common.level')} 01
                 </button>
            )}
        </section>

        {/* --- LEVEL 2: THEORY --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.vectors.theory.title')}
            </h2>
            <div className="bg-white/5 border border-white/10 p-6 rounded-sm font-mono text-xs grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                     <div className="mb-4"><span className="text-white/40">OPERATION:</span> <span className="text-white">{t('modules.vectors.theory.dot_term')}</span></div>
                     <div className="text-xl tracking-widest text-cyan-400 mb-2">A · B = |A||B|cos(θ)</div>
                     <p className="text-white/50">{t('modules.vectors.theory.dot_desc')}</p>
                </div>
                <div>
                     <div className="mb-4"><span className="text-white/40">OPERATION:</span> <span className="text-white">{t('modules.vectors.theory.cross_term')}</span></div>
                     <div className="text-xl tracking-widest text-purple-400 mb-2">A × B = |A||B|sin(θ)n</div>
                     <p className="text-white/50">{t('modules.vectors.theory.cross_desc')}</p>
                </div>
            </div>
             {currentLevel === 2 && (
                 <button onClick={() => handleLevelComplete(2)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {globalT('common.level')} 02
                 </button>
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
                    <div className="bg-white/5 p-4 border border-white/10">
                        <label className="text-[10px] text-white/40 block mb-2">{t('modules.vectors.viz.controls.vec_a')}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['x', 'y', 'z'].map((axis, i) => (
                                <input key={`v1-${axis}`} type="number" value={v1[i]} onChange={(e) => updateVec(setV1, v1, i, parseFloat(e.target.value))} 
                                    className="w-full bg-black border border-white/20 text-white p-1 text-xs text-center focus:border-cyan-500 outline-none" placeholder={axis} />
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-white/5 p-4 border border-white/10">
                        <label className="text-[10px] text-white/40 block mb-2">{t('modules.vectors.viz.controls.vec_b')}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['x', 'y', 'z'].map((axis, i) => (
                                <input key={`v2-${axis}`} type="number" value={v2[i]} onChange={(e) => updateVec(setV2, v2, i, parseFloat(e.target.value))} 
                                    className="w-full bg-black border border-white/20 text-white p-1 text-xs text-center focus:border-red-500 outline-none" placeholder={axis} />
                            ))}
                        </div>
                    </div>

                    {/* Stats & Log */}
                    <div className="flex-1 bg-black border border-white/10 p-4 font-mono text-xs flex flex-col">
                         <div className="border-b border-white/10 pb-2 mb-2 text-white/30">{t('modules.vectors.viz.controls.telemetry')}</div>
                         
                         <div className="space-y-2 mb-4">
                             <div className="flex justify-between">
                                 <span className="text-white/60">{t('modules.vectors.viz.controls.dot')}</span>
                                 <span className="text-cyan-400">{dotProduct.toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-white/60">{t('modules.vectors.viz.controls.cross')}</span>
                                 <span className="text-purple-400">({crossProd.x.toFixed(1)}, {crossProd.y.toFixed(1)}, {crossProd.z.toFixed(1)})</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-white/60">{t('modules.vectors.viz.controls.angle')}</span>
                                 <span>{isNaN(angleDeg) ? '-' : angleDeg.toFixed(1)}°</span>
                             </div>
                         </div>

                         {/* System Log */}
                         <div className="flex-1 border-t border-white/10 pt-2 overflow-hidden flex flex-col">
                             <div className="text-[9px] text-white/30 mb-1">SYSTEM_LOG</div>
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
                                onClick={() => setShowComponents(!showComponents)}
                                className={`w-full py-2 text-center border transition-all text-xs ${showComponents ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400' : 'border-white/20 text-white/60 hover:text-white'}`}
                            >
                                {t('modules.vectors.viz.controls.show_comp')}
                            </button>
                         </div>
                    </div>
                </div>

                {/* Right Panel (Canvas) */}
                <div className="lg:col-span-2 border border-white/10 bg-black relative h-full overflow-hidden group">
                    <div className="absolute top-2 left-2 text-[10px] text-white/20 z-10 group-hover:text-white/40 transition-colors">
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
                 <button onClick={() => handleLevelComplete(3)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {globalT('common.level')} 03
                 </button>
            )}
        </section>

        {/* --- LEVEL 4: APPLICATION --- */}
        <section className="space-y-6 border-t border-white/10 pt-16">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                {t('modules.vectors.apps.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/60">
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.vectors.apps.cg_title')}</h3>
                    <p>{t('modules.vectors.apps.cg_body')}</p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.vectors.apps.phys_title')}</h3>
                    <p>{t('modules.vectors.apps.phys_body')}</p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">{t('modules.vectors.apps.nav_title')}</h3>
                    <p>{t('modules.vectors.apps.nav_body')}</p>
                </div>
            </div>
             {currentLevel === 4 && (
                 <button onClick={() => handleLevelComplete(4)} className="mt-4 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-xs hover:bg-cyan-900/20 transition-all uppercase tracking-widest">
                    COMPLETE {globalT('common.level')} 04
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
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tighter">{t('modules.vectors.completion.synced')}</h2>
                    <div className="text-cyan-500 text-sm mb-6">{globalT('common.level')} 0{currentLevel} COMPLETE</div>
                    <p className="text-white/60 text-xs mb-8 leading-relaxed">
                        {t('modules.vectors.completion.msg')}<br/>
                        {globalT('common.xp_awarded')}: <span className="text-white">+100</span>
                    </p>
                    <button 
                        onClick={handleNextLevel}
                        className="w-full bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 py-3 text-xs hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest"
                    >
                        {currentLevel < 4 ? globalT('common.next') : globalT('common.root')}
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
