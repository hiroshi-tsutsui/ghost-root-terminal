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
        <cylinderGeometry args={[0.08, 0.08, length, 12]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={endVec} quaternion={quaternion}>
        <coneGeometry args={[0.2, 0.5, 32]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
      {label && (
        <Text
          position={endVec.clone().add(new THREE.Vector3(0, 0.4, 0))}
          fontSize={0.5}
          color="#1d1d1f"
          anchorX="center"
          anchorY="middle"
          // font="/fonts/Inter-Bold.woff" 
          outlineWidth={0.04}
          outlineColor="white"
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
                <meshStandardMaterial color="#0071e3" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <gridHelper args={[12, 12]} rotation={[Math.PI/2, 0, 0]} />
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
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -5, -5]} intensity={0.5} />
      
      <Grid infiniteGrid fadeDistance={40} fadeStrength={5} sectionColor="#d1d1d6" cellColor="#e5e5e7" />
      
      <Line points={[[0, 0, 0], [10, 0, 0]]} color="#ff3b30" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 10, 0]]} color="#34c759" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 0, 10]]} color="#0071e3" lineWidth={2} />

      <VectorArrow end={v1} color="#0071e3" label="a" />
      {showComponents && (
        <group>
          <Line points={[[v1[0], 0, 0], [v1[0], v1[1], 0], [v1[0], v1[1], v1[2]]]} color="#0071e3" lineWidth={1} dashed dashScale={0.5} opacity={0.5} transparent />
          <Line points={[[0, 0, v1[2]], [0, v1[1], v1[2]], [v1[0], v1[1], v1[2]]]} color="#0071e3" lineWidth={1} dashed dashScale={0.5} opacity={0.5} transparent />
          <Line points={[[0, v1[1], 0], [v1[0], v1[1], 0]]} color="#0071e3" lineWidth={1} dashed dashScale={0.5} opacity={0.5} transparent />
        </group>
      )}

      <VectorArrow end={v2} color="#ff3b30" label="b" />
       {showComponents && (
        <group>
          <Line points={[[v2[0], 0, 0], [v2[0], v2[1], 0], [v2[0], v2[1], v2[2]]]} color="#ff3b30" lineWidth={1} dashed dashScale={0.5} opacity={0.5} transparent />
          <Line points={[[0, 0, v2[2]], [0, v2[1], v2[2]], [v2[0], v2[1], v2[2]]]} color="#ff3b30" lineWidth={1} dashed dashScale={0.5} opacity={0.5} transparent />
          <Line points={[[0, v2[1], 0], [v2[0], v2[1], 0]]} color="#ff3b30" lineWidth={1} dashed dashScale={0.5} opacity={0.5} transparent />
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
    <div className="flex flex-col md:flex-row h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans overflow-hidden">
      {/* Sidebar Control Panel */}
      <div className="w-full md:w-[400px] flex flex-col border-r border-white/20 bg-white/70 backdrop-blur-xl z-10 h-1/2 md:h-full overflow-y-auto shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <header className="p-6 pb-4 border-b border-gray-200/50 sticky top-0 bg-white/50 backdrop-blur-md z-20">
            <div className="flex justify-between items-start mb-3">
                <Link href="/" className="group flex items-center text-sm font-medium text-[#86868b] hover:text-[#0071e3] transition-colors">
                <span className="inline-block transition-transform group-hover:-translate-x-1 mr-1">←</span> ホームに戻る
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
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        isSenseiMode 
                        ? 'bg-blue-600 text-white shadow-lg scale-105' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                >
                    {isSenseiMode ? 'SYNC: ACTIVE' : 'SYNC: OFFLINE'}
                </button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">VECTOR NAVIGATION</h1>
            <p className="text-[#86868b] text-sm mt-1 font-medium">SPATIAL PROPULSION PROTOCOL</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
          
          {/* Sensei Message Box */}
          {isSenseiMode && (
                <div className={`p-4 border rounded-xl shadow-sm animate-fade-in ${currentStepIsBriefing ? 'bg-indigo-50 border-indigo-200' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">{currentStepIsBriefing ? '🛸' : '🤖'}</div>
                        <div className="flex-1">
                            <h3 className={`font-bold text-xs uppercase mb-1 ${currentStepIsBriefing ? 'text-indigo-600' : 'text-blue-600'}`}>
                                {LEVELS[level]?.title}
                            </h3>
                            <p className="text-gray-800 text-sm font-medium leading-snug whitespace-pre-wrap">
                                {senseiMessage}
                            </p>
                            {taskCompleted && (
                                <button 
                                    onClick={advanceLesson}
                                    className={`mt-3 w-full py-2 text-white text-sm font-bold rounded-lg shadow-md transition-all animate-pulse ${
                                        currentStepIsBriefing 
                                        ? 'bg-indigo-600 hover:bg-indigo-700' 
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {currentStepIsBriefing ? 'EXECUTE' : 'PROCEED'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

          {/* Segmented Control */}
          <div className="flex bg-[#e8e8ed] p-1 rounded-lg">
             <button 
                onClick={() => setInputMode('xyz')} 
                className={`flex-1 text-[13px] py-1.5 rounded-[7px] font-medium transition-all duration-200 ${inputMode === 'xyz' ? 'bg-white shadow-sm text-black' : 'text-[#86868b] hover:text-black'}`}
             >
                COORDINATES (XYZ)
             </button>
             <button 
                onClick={() => setInputMode('polar')} 
                className={`flex-1 text-[13px] py-1.5 rounded-[7px] font-medium transition-all duration-200 ${inputMode === 'polar' ? 'bg-white shadow-sm text-black' : 'text-[#86868b] hover:text-black'}`}
             >
                POLAR (r,θ,φ)
             </button>
          </div>

          {/* Vector A Control */}
          <div className={`apple-card p-5 fade-in-up delay-100 transition-all ${isSenseiMode && level <= 2 && 'ring-2 ring-blue-500 bg-blue-50/30'}`}>
            <h3 className="text-sm font-semibold text-[#1d1d1f] flex items-center mb-4">
                <span className="w-3 h-3 rounded-full bg-[#0071e3] mr-2 shadow-sm"></span>
                THRUSTER A
            </h3>
            {inputMode === 'xyz' ? (
                <div className="grid grid-cols-3 gap-3">
                {['x', 'y', 'z'].map((axis, i) => (
                    <div key={axis}>
                        <label className="block text-[11px] font-semibold text-[#86868b] mb-1.5 uppercase tracking-wide">{axis}</label>
                        <input 
                            type="number" 
                            value={v1[i].toFixed(2)} 
                            onChange={(e) => updateVec(setV1, v1, i, parseFloat(e.target.value))} 
                            className="input-apple text-center font-mono text-sm" 
                        />
                    </div>
                ))}
                </div>
            ) : (
                <div className="space-y-5">
                    {(() => {
                        const { r, theta, phi } = toPolar(v1);
                        return (
                            <>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-[#86868b]">
                                        <span>LENGTH (r)</span>
                                        <span className="text-[#1d1d1f] font-mono">{r.toFixed(2)}</span>
                                    </div>
                                    <input type="range" min="0" max="10" step="0.1" value={r} onChange={(e) => updateFromPolar(setV1, parseFloat(e.target.value), theta, phi)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-[#86868b]">
                                        <span>AZIMUTH (θ)</span>
                                        <span className="text-[#1d1d1f] font-mono">{theta.toFixed(0)}°</span>
                                    </div>
                                    <input type="range" min="-180" max="180" value={theta} onChange={(e) => updateFromPolar(setV1, r, parseFloat(e.target.value), phi)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-[#86868b]">
                                        <span>ZENITH (φ)</span>
                                        <span className="text-[#1d1d1f] font-mono">{phi.toFixed(0)}°</span>
                                    </div>
                                    <input type="range" min="0" max="180" value={phi} onChange={(e) => updateFromPolar(setV1, r, theta, parseFloat(e.target.value))} />
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
          </div>

          {/* Vector B Control */}
          <div className={`apple-card p-5 fade-in-up delay-200 transition-all ${isSenseiMode && level <= 2 && 'ring-2 ring-red-500 bg-red-50/30'}`}>
            <h3 className="text-sm font-semibold text-[#1d1d1f] flex items-center mb-4">
                <span className="w-3 h-3 rounded-full bg-[#ff3b30] mr-2 shadow-sm"></span>
                THRUSTER B
            </h3>
            {inputMode === 'xyz' ? (
                <div className="grid grid-cols-3 gap-3">
                {['x', 'y', 'z'].map((axis, i) => (
                    <div key={axis}>
                        <label className="block text-[11px] font-semibold text-[#86868b] mb-1.5 uppercase tracking-wide">{axis}</label>
                        <input 
                            type="number" 
                            value={v2[i].toFixed(2)} 
                            onChange={(e) => updateVec(setV2, v2, i, parseFloat(e.target.value))} 
                            className="input-apple text-center font-mono text-sm focus:ring-[#ff3b30]/50" 
                        />
                    </div>
                ))}
                </div>
            ) : (
                <div className="space-y-5">
                    {(() => {
                        const { r, theta, phi } = toPolar(v2);
                        return (
                            <>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-[#86868b]">
                                        <span>LENGTH (r)</span>
                                        <span className="text-[#1d1d1f] font-mono">{r.toFixed(2)}</span>
                                    </div>
                                    <input type="range" min="0" max="10" step="0.1" value={r} onChange={(e) => updateFromPolar(setV2, parseFloat(e.target.value), theta, phi)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-[#86868b]">
                                        <span>AZIMUTH (θ)</span>
                                        <span className="text-[#1d1d1f] font-mono">{theta.toFixed(0)}°</span>
                                    </div>
                                    <input type="range" min="-180" max="180" value={theta} onChange={(e) => updateFromPolar(setV2, r, parseFloat(e.target.value), phi)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-[#86868b]">
                                        <span>ZENITH (φ)</span>
                                        <span className="text-[#1d1d1f] font-mono">{phi.toFixed(0)}°</span>
                                    </div>
                                    <input type="range" min="0" max="180" value={phi} onChange={(e) => updateFromPolar(setV2, r, theta, parseFloat(e.target.value))} />
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
          </div>
          
          <div className="pt-2 space-y-4 fade-in-up delay-300">
             <div className={`flex justify-between items-center px-1 rounded-lg p-2 transition-all ${isSenseiMode && level === 3 && 'bg-green-100 ring-2 ring-green-500'}`}>
                <h3 className="text-sm font-semibold text-[#1d1d1f] flex items-center">
                    <span className="w-3 h-3 rounded-full bg-[#af52de] mr-2"></span>
                    VISUALIZE LANDING PAD
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={showPlane} onChange={(e) => setShowPlane(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#e9e9ea] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:bg-[#34c759]"></div>
                </label>
             </div>

             <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-semibold text-[#1d1d1f] flex items-center">
                    <span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
                    COMPONENT PROJECTION
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={showComponents} onChange={(e) => setShowComponents(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#e9e9ea] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:bg-[#0071e3]"></div>
                </label>
             </div>
             
             {showPlane && (
                 <div className="p-5 apple-card space-y-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-mono text-[#86868b] text-center bg-[#F5F5F7] p-2 rounded-lg">nx + ny + nz = d</p>
                    <div>
                        <label className="text-[11px] font-semibold text-[#86868b] mb-2 block uppercase tracking-wide">NORMAL VECTOR (n)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['x', 'y', 'z'].map((axis, i) => (
                                <input key={axis} type="number" placeholder={axis} value={planeNormal[i]} onChange={(e) => updateVec(setPlaneNormal, planeNormal, i, parseFloat(e.target.value))} className="input-apple text-center p-2 text-sm" />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-[#86868b] mb-2 block uppercase tracking-wide">ALTITUDE OFFSET (d)</label>
                        <input type="number" value={planeConstant} onChange={(e) => setPlaneConstant(parseFloat(e.target.value))} className="input-apple text-center p-2 text-sm" />
                    </div>
                 </div>
             )}
          </div>

          <div className="apple-card p-5 space-y-4 fade-in-up delay-300">
            <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider">TELEMETRY DATA</h3>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-[#1d1d1f]">DOT PRODUCT (a・b)</span>
                <span className="font-mono font-medium text-[#1d1d1f]">{dotProduct.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-[#1d1d1f]">CROSS PRODUCT (a×b)</span>
                <span className="font-mono font-medium text-[#1d1d1f]">({crossProd.x.toFixed(1)}, {crossProd.y.toFixed(1)}, {crossProd.z.toFixed(1)})</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-[#1d1d1f]">INCIDENCE ANGLE (θ)</span>
                <span className="font-mono font-medium text-[#1d1d1f]">{angleDeg}°</span>
            </div>
          </div>

        </div>
      </div>

      <div className="flex-1 relative bg-[#F5F5F7]">
        <Canvas camera={{ position: [6, 4, 8], fov: 45 }}>
          <Scene v1={v1} v2={v2} planeNormal={planeNormal} planeConstant={planeConstant} showPlane={showPlane} showComponents={showComponents} />
        </Canvas>
        
        {/* Floating Label */}
        <div className="absolute bottom-8 left-8 flex gap-6 text-xs font-semibold bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-white/40">
           <span className="flex items-center text-[#ff3b30]"><span className="w-2.5 h-2.5 rounded-full bg-[#ff3b30] mr-2"></span>X軸</span>
           <span className="flex items-center text-[#34c759]"><span className="w-2.5 h-2.5 rounded-full bg-[#34c759] mr-2"></span>Y軸</span>
           <span className="flex items-center text-[#0071e3]"><span className="w-2.5 h-2.5 rounded-full bg-[#0071e3] mr-2"></span>Z軸</span>
        </div>
      </div>
    </div>
  );
}
