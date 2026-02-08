// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';

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

function Scene({ v1, v2, planeNormal, planeConstant, showPlane, showComponents }: { v1: [number, number, number], v2: [number, number, number], planeNormal: [number, number, number], planeConstant: number, showPlane: boolean, showComponents: boolean }) {
  const vec1 = new THREE.Vector3(...v1);
  const vec2 = new THREE.Vector3(...v2);
  const crossProd = new THREE.Vector3().crossVectors(vec1, vec2);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0071e3" />
      
      <Grid infiniteGrid fadeDistance={40} fadeStrength={5} sectionColor="#333" cellColor="#111" />
      
      {/* Axis Lines */}
      <Line points={[[-10, 0, 0], [10, 0, 0]]} color="#333" lineWidth={1} />
      <Line points={[[0, -10, 0], [0, 10, 0]]} color="#333" lineWidth={1} />
      <Line points={[[0, 0, -10], [0, 0, 10]]} color="#333" lineWidth={1} />

      <VectorArrow end={v1} color="#0071e3" label="a" />
      {showComponents && (
        <group>
          <Line points={[[v1[0], 0, 0], [v1[0], v1[1], 0], [v1[0], v1[1], v1[2]]]} color="#0071e3" lineWidth={1} dashed dashScale={0.5} opacity={0.3} transparent />
          <Line points={[[0, 0, v1[2]], [0, v1[1], v1[2]], [v1[0], v1[1], v1[2]]]} color="#0071e3" lineWidth={1} dashed dashScale={0.5} opacity={0.3} transparent />
        </group>
      )}

      <VectorArrow end={v2} color="#ff3b30" label="b" />
       {showComponents && (
        <group>
          <Line points={[[v2[0], 0, 0], [v2[0], v2[1], 0], [v2[0], v2[1], v2[2]]]} color="#ff3b30" lineWidth={1} dashed dashScale={0.5} opacity={0.3} transparent />
          <Line points={[[0, 0, v2[2]], [0, v2[1], v2[2]], [v2[0], v2[1], v2[2]]]} color="#ff3b30" lineWidth={1} dashed dashScale={0.5} opacity={0.3} transparent />
        </group>
      )}

      <VectorArrow end={[crossProd.x, crossProd.y, crossProd.z]} color="#af52de" label="a×b" />
      
      {showPlane && <PlaneVisualizer normal={planeNormal} constant={planeConstant} />}

      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} />
    </>
  );
}

export default function VectorsPage() {
  const [v1, setV1] = useState<[number, number, number]>([2, 1, 0]);
  const [v2, setV2] = useState<[number, number, number]>([0, 2, 1]);
  
  const [showPlane, setShowPlane] = useState(false);
  const [showComponents, setShowComponents] = useState(false);
  const [planeNormal, setPlaneNormal] = useState<[number, number, number]>([0, 1, 0]); 
  const [planeConstant, setPlaneConstant] = useState(0);
  const [inputMode, setInputMode] = useState<'xyz' | 'polar'>('xyz');

  // Sensei Mode State
  const [isSenseiMode, setIsSenseiMode] = useState(false);
  const [level, setLevel] = useState(1);
  const [lessonStep, setLessonStep] = useState(0);
  const [senseiMessage, setSenseiMessage] = useState("");
  const [taskCompleted, setTaskCompleted] = useState(false);


  const vec1 = new THREE.Vector3(...v1);
  const vec2 = new THREE.Vector3(...v2);
  const dotProduct = vec1.dot(vec2);
  const crossProd = new THREE.Vector3().crossVectors(vec1, vec2);
  const angleDeg = (vec1.angleTo(vec2) * 180 / Math.PI).toFixed(1);

  // --- Sensei Logic (NARRATIVE LAYER: VECTOR_SYNC) ---
  const LEVELS = {
      1: {
          title: "PHASE 1: Gyroscopic Stabilization (Dot Product)",
          steps: [
              {
                  message: "【PROTOCOL: INITIATE_CALIBRATION】\nWelcome, Operator. The Void Scout drones require stabilization. You must align the thrusters to be independent of cross-winds.\n\nPress 'EXECUTE' to begin calibration.",
                  check: () => true,
                  isBriefing: true
              },
              {
                  message: "Calibrating orthogonal thrusters (Dot Product). When the product is 0, the vectors are orthogonal (90°). Set Vector A to `(2, 0, 0)` and Vector B to `(0, 2, 0)`.",
                  check: () => v1[0] === 2 && v1[1] === 0 && v1[2] === 0 && v2[0] === 0 && v2[1] === 2 && v2[2] === 0
              },
              {
                  message: "Orthogonality achieved. Thrusters are isolated. Now, induce a drift by setting Vector B's Z-component to `2`.",
                  check: () => v2[2] >= 2
              },
              {
                  message: "Drift detected. Dot product non-zero. Stabilization complete. Proceed to Phase 2.",
                  check: () => true,
                  isFinal: true
              }
          ]
      },
      2: {
          title: "PHASE 2: Torque Generation (Cross Product)",
          steps: [
              {
                  message: "【PROTOCOL: ROTATIONAL_DYNAMICS】\nThe drone needs to rotate. Calculate the torque vector using the Cross Product. The resulting vector defines the axis of rotation.\n\nPress 'EXECUTE' to simulate torque.",
                  check: () => true,
                  isBriefing: true
              },
              {
                  message: "Generate torque (Vector A × Vector B). The purple vector represents the axis of rotation. Set A=`(1, 0, 0)` and B=`(0, 1, 0)`.",
                  check: () => v1[0] === 1 && v1[1] === 0 && v2[0] === 0 && v2[1] === 1
              },
              {
                  message: "Torque vector established (Positive Z). The drone rotates counter-clockwise. Now reverse the inputs: A=`(0, 1, 0)`, B=`(1, 0, 0)`.",
                  check: () => v1[0] === 0 && v1[1] === 1 && v2[0] === 1 && v2[1] === 0
              },
              {
                  message: "Torque vector inverted (Negative Z). The drone rotates clockwise. The order of operations dictates the direction. Phase 2 Complete.",
                  check: () => true,
                  isFinal: true
              }
          ]
      },
      3: {
          title: "PHASE 3: Landing Protocol (Normal Vectors)",
          steps: [
             {
                 message: "【PROTOCOL: SURFACE_ALIGNMENT】\nFinal Sequence. Align the landing gear with the docking platform surface using the Normal Vector.\n\nPress 'EXECUTE' to engage landing gear.",
                 check: () => true,
                 isBriefing: true
             },
             {
                 message: "Activate the surface grid. Toggle 'Show Plane'.",
                 check: () => showPlane === true
             },
             {
                 message: "The platform is currently undefined. Set the Normal Vector `n` to `(0, 0, 1)` to align it with the ground.",
                 check: () => planeNormal[0] === 0 && planeNormal[1] === 0 && planeNormal[2] === 1
             },
             {
                 message: "Platform alignment confirmed. Landing gear engaged. Navigation Systems: OPTIMAL. Excellent work, Operator.",
                 check: () => true,
                 isFinal: true
             }
          ]
      }
  };

  useEffect(() => {
    if (!isSenseiMode) return;
    const currentLevelData = LEVELS[level];
    if (!currentLevelData) return;
    const currentStepData = currentLevelData.steps[lessonStep];
    if (!currentStepData) return;

    setSenseiMessage(currentStepData.message);

    if (currentStepData.check()) {
        if (!taskCompleted) setTaskCompleted(true);
    } else {
        setTaskCompleted(false);
    }
  }, [v1, v2, showPlane, planeNormal, isSenseiMode, level, lessonStep]);

  const advanceLesson = () => {
      const currentLevelData = LEVELS[level];
      const currentStepData = currentLevelData.steps[lessonStep];

      if (currentStepData.isFinal) {
          if (LEVELS[level + 1]) {
              setLevel(level + 1);
              setLessonStep(0);
              // Reset specific values for new level if needed
          } else {
              setSenseiMessage("CALIBRATION COMPLETE. SYSTEM ONLINE.");
              setIsSenseiMode(false);
          }
      } else {
          setLessonStep(lessonStep + 1);
      }
      setTaskCompleted(false);
  };

  const updateVec = (setter: any, current: any, idx: number, val: number) => {
    const newVec = [...current] as [number, number, number];
    newVec[idx] = isNaN(val) ? 0 : val;
    setter(newVec);
  };

  const toPolar = (vec: [number, number, number]) => {
      const v = new THREE.Vector3(...vec);
      const r = v.length();
      const phi = Math.acos(v.y / (r || 1)) * 180 / Math.PI;
      const thetaRad = Math.atan2(v.z, v.x); 
      let thetaDeg = thetaRad * 180 / Math.PI;
      return { r, theta: thetaDeg, phi };
  };

  const updateFromPolar = (setter: any, r: number, theta: number, phi: number) => {
      const thetaRad = theta * Math.PI / 180;
      const phiRad = phi * Math.PI / 180;
      const y = r * Math.cos(phiRad);
      const h = r * Math.sin(phiRad);
      const x = h * Math.cos(thetaRad);
      const z = h * Math.sin(thetaRad);
      setter([x, y, z]);
  };

  const currentStepIsBriefing = LEVELS[level]?.steps[lessonStep]?.isBriefing;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#050505] text-[#e5e5e5] font-mono overflow-hidden selection:bg-blue-500/30">
      {/* Sidebar Control Panel */}
      <div className="w-full md:w-[400px] flex flex-col border-r border-white/10 bg-[#0a0a0a] z-10 h-1/2 md:h-full overflow-y-auto">
        <header className="p-6 pb-4 border-b border-white/10 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-20">
            <div className="flex justify-between items-start mb-3">
                <Link href="/" className="group flex items-center text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-widest">
                <span className="inline-block transition-transform group-hover:-translate-x-1 mr-2">←</span> SYSTEM ROOT
                </Link>
                 <button 
                    onClick={() => {
                        setIsSenseiMode(!isSenseiMode);
                        if (!isSenseiMode) {
                            setV1([2, 1, 0]); setV2([0, 2, 1]); // Reset
                            setLevel(1);
                            setLessonStep(0);
                            setShowPlane(false);
                        }
                    }}
                    className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase border transition-all ${
                        isSenseiMode 
                        ? 'bg-blue-900/20 border-blue-500 text-blue-400 animate-pulse' 
                        : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/30'
                    }`}
                >
                    {isSenseiMode ? 'SYNC: ACTIVE' : 'SYNC: OFFLINE'}
                </button>
            </div>
            <h1 className="text-xl font-bold tracking-[0.2em] text-blue-500 mb-1">PROTOCOL: VECTORS</h1>
            <p className="text-gray-600 text-[10px] font-mono uppercase tracking-widest">VOID NAVIGATION SYSTEM</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 custom-scrollbar">
          
          {/* Sensei Message Box */}
          {isSenseiMode && (
                <div className={`p-4 border border-l-4 rounded-sm animate-fade-in ${currentStepIsBriefing ? 'bg-blue-900/10 border-blue-500/50 border-l-blue-500' : 'bg-gray-900/50 border-gray-700 border-l-white'}`}>
                    <div className="flex items-start gap-3">
                        <div className="text-xl">{currentStepIsBriefing ? '📡' : 'SYSTEM:'}</div>
                        <div className="flex-1">
                            <h3 className={`font-bold text-[10px] uppercase mb-2 tracking-widest ${currentStepIsBriefing ? 'text-blue-400' : 'text-gray-400'}`}>
                                {LEVELS[level]?.title}
                            </h3>
                            <p className="text-gray-300 text-xs font-mono leading-relaxed whitespace-pre-wrap mb-4">
                                {senseiMessage}
                            </p>
                            {taskCompleted && (
                                <button 
                                    onClick={advanceLesson}
                                    className={`w-full py-2 text-xs font-bold tracking-widest uppercase border transition-all ${
                                        currentStepIsBriefing 
                                        ? 'bg-blue-500 text-black border-blue-500 hover:bg-white' 
                                        : 'bg-green-500 text-black border-green-500 hover:bg-white'
                                    }`}
                                >
                                    {currentStepIsBriefing ? 'ACKNOWLEDGE' : 'PROCEED'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

          {/* Segmented Control */}
          <div className="flex border-b border-white/10">
             <button 
                onClick={() => setInputMode('xyz')} 
                className={`flex-1 text-[10px] py-2 font-bold uppercase tracking-widest transition-colors ${inputMode === 'xyz' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-600 hover:text-gray-400'}`}
             >
                CARTESIAN (XYZ)
             </button>
             <button 
                onClick={() => setInputMode('polar')} 
                className={`flex-1 text-[10px] py-2 font-bold uppercase tracking-widest transition-colors ${inputMode === 'polar' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-600 hover:text-gray-400'}`}
             >
                SPHERICAL (r,θ,φ)
             </button>
          </div>

          {/* Vector A Control */}
          <div className={`p-4 border border-white/5 bg-white/5 transition-all hover:border-blue-500/30 ${isSenseiMode && level <= 2 && 'border-blue-500/50 bg-blue-900/5'}`}>
            <h3 className="text-xs font-bold text-gray-400 flex items-center mb-4 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[#0071e3] mr-2 shadow-[0_0_10px_#0071e3]"></span>
                THRUSTER A
            </h3>
            {inputMode === 'xyz' ? (
                <div className="grid grid-cols-3 gap-3">
                {['x', 'y', 'z'].map((axis, i) => (
                    <div key={axis}>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase text-center">{axis}</label>
                        <input 
                            type="number" 
                            value={v1[i].toFixed(2)} 
                            onChange={(e) => updateVec(setV1, v1, i, parseFloat(e.target.value))} 
                            className="w-full bg-black border border-white/10 text-white text-center text-xs py-1 focus:border-blue-500 focus:outline-none" 
                        />
                    </div>
                ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {(() => {
                        const { r, theta, phi } = toPolar(v1);
                        return (
                            <>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                                        <span>MAGNITUDE (r)</span>
                                        <span className="text-blue-400">{r.toFixed(2)}</span>
                                    </div>
                                    <input type="range" min="0" max="10" step="0.1" value={r} onChange={(e) => updateFromPolar(setV1, parseFloat(e.target.value), theta, phi)} 
                                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                                        <span>AZIMUTH (θ)</span>
                                        <span className="text-blue-400">{theta.toFixed(0)}°</span>
                                    </div>
                                    <input type="range" min="-180" max="180" value={theta} onChange={(e) => updateFromPolar(setV1, r, parseFloat(e.target.value), phi)} 
                                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                                        <span>ZENITH (φ)</span>
                                        <span className="text-blue-400">{phi.toFixed(0)}°</span>
                                    </div>
                                    <input type="range" min="0" max="180" value={phi} onChange={(e) => updateFromPolar(setV1, r, theta, parseFloat(e.target.value))} 
                                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
          </div>

          {/* Vector B Control */}
          <div className={`p-4 border border-white/5 bg-white/5 transition-all hover:border-red-500/30 ${isSenseiMode && level <= 2 && 'border-red-500/50 bg-red-900/5'}`}>
            <h3 className="text-xs font-bold text-gray-400 flex items-center mb-4 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[#ff3b30] mr-2 shadow-[0_0_10px_#ff3b30]"></span>
                THRUSTER B
            </h3>
            {inputMode === 'xyz' ? (
                <div className="grid grid-cols-3 gap-3">
                {['x', 'y', 'z'].map((axis, i) => (
                    <div key={axis}>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase text-center">{axis}</label>
                        <input 
                            type="number" 
                            value={v2[i].toFixed(2)} 
                            onChange={(e) => updateVec(setV2, v2, i, parseFloat(e.target.value))} 
                            className="w-full bg-black border border-white/10 text-white text-center text-xs py-1 focus:border-red-500 focus:outline-none" 
                        />
                    </div>
                ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {(() => {
                        const { r, theta, phi } = toPolar(v2);
                        return (
                            <>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                                        <span>MAGNITUDE (r)</span>
                                        <span className="text-red-400">{r.toFixed(2)}</span>
                                    </div>
                                    <input type="range" min="0" max="10" step="0.1" value={r} onChange={(e) => updateFromPolar(setV2, parseFloat(e.target.value), theta, phi)} 
                                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                                        <span>AZIMUTH (θ)</span>
                                        <span className="text-red-400">{theta.toFixed(0)}°</span>
                                    </div>
                                    <input type="range" min="-180" max="180" value={theta} onChange={(e) => updateFromPolar(setV2, r, parseFloat(e.target.value), phi)} 
                                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                                        <span>ZENITH (φ)</span>
                                        <span className="text-red-400">{phi.toFixed(0)}°</span>
                                    </div>
                                    <input type="range" min="0" max="180" value={phi} onChange={(e) => updateFromPolar(setV2, r, theta, parseFloat(e.target.value))} 
                                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
          </div>
          
          <div className="pt-2 space-y-4">
             <div className={`flex justify-between items-center px-2 py-2 border border-white/5 rounded-sm transition-all ${isSenseiMode && level === 3 && 'bg-green-900/20 border-green-500/50'}`}>
                <h3 className="text-xs font-bold text-gray-400 flex items-center uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-[#af52de] mr-2"></span>
                    TARGET LANDING PAD
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={showPlane} onChange={(e) => setShowPlane(e.target.checked)} className="sr-only peer" />
                    <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-600"></div>
                </label>
             </div>

             <div className="flex justify-between items-center px-2 py-2 border border-white/5 rounded-sm">
                <h3 className="text-xs font-bold text-gray-400 flex items-center uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-gray-600 mr-2"></span>
                    PROJECT COMPONENTS
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={showComponents} onChange={(e) => setShowComponents(e.target.checked)} className="sr-only peer" />
                    <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
             </div>
             
             {showPlane && (
                 <div className="p-4 border border-white/10 bg-black/50 space-y-4">
                    <p className="text-[10px] font-mono text-blue-400 text-center border border-blue-900/30 bg-blue-900/10 p-2">EQ: nx + ny + nz = d</p>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-2 block uppercase tracking-wide">NORMAL VECTOR (n)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['x', 'y', 'z'].map((axis, i) => (
                                <input key={axis} type="number" placeholder={axis} value={planeNormal[i]} onChange={(e) => updateVec(setPlaneNormal, planeNormal, i, parseFloat(e.target.value))} className="w-full bg-black border border-white/10 text-white text-center text-xs py-1 focus:border-blue-500 focus:outline-none" />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-2 block uppercase tracking-wide">ALTITUDE OFFSET (d)</label>
                        <input type="number" value={planeConstant} onChange={(e) => setPlaneConstant(parseFloat(e.target.value))} className="w-full bg-black border border-white/10 text-white text-center text-xs py-1 focus:border-blue-500 focus:outline-none" />
                    </div>
                 </div>
             )}
          </div>

          <div className="p-4 border border-white/10 bg-white/5 space-y-3">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2">TELEMETRY DATA</h3>
            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase">DOT PRODUCT</span>
                <span className="font-mono text-xs text-white">{dotProduct.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase">CROSS PRODUCT</span>
                <span className="font-mono text-xs text-purple-400">({crossProd.x.toFixed(1)}, {crossProd.y.toFixed(1)}, {crossProd.z.toFixed(1)})</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase">INCIDENCE ANGLE</span>
                <span className="font-mono text-xs text-white">{angleDeg}°</span>
            </div>
          </div>

        </div>
      </div>

      <div className="flex-1 relative bg-[#050505]">
        <Canvas camera={{ position: [6, 4, 8], fov: 45 }}>
          <Scene v1={v1} v2={v2} planeNormal={planeNormal} planeConstant={planeConstant} showPlane={showPlane} showComponents={showComponents} />
        </Canvas>
        
        {/* Floating Label */}
        <div className="absolute bottom-8 left-8 flex gap-4 text-[10px] font-bold bg-black/80 backdrop-blur-md px-4 py-2 border border-white/10 uppercase tracking-widest text-gray-400">
           <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mr-2 shadow-[0_0_5px_#ff3b30]"></span>X-AXIS</span>
           <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#34c759] mr-2 shadow-[0_0_5px_#34c759]"></span>Y-AXIS</span>
           <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] mr-2 shadow-[0_0_5px_#0071e3]"></span>Z-AXIS</span>
        </div>
      </div>
    </div>
  );
}
