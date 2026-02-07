// @ts-nocheck
"use client";

import { useState } from 'react';
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
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={endVec} quaternion={quaternion}>
        <coneGeometry args={[0.2, 0.5, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {label && (
        <Text
          position={endVec.clone().add(new THREE.Vector3(0, 0.3, 0))}
          fontSize={0.4}
          color="#374151"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
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
    const pos = n.clone().multiplyScalar(constant / n.lengthSq());

    return (
        <group position={pos} quaternion={quaternion}>
            <mesh>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#06b6d4" transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
            <gridHelper args={[10, 10]} rotation={[Math.PI/2, 0, 0]} />
            <VectorArrow start={[0,0,0]} end={[0, 0, 2]} color="#06b6d4" label="n" />
        </group>
    );
}

function Scene({ v1, v2, planeNormal, planeConstant, showPlane, showComponents }: { v1: [number, number, number], v2: [number, number, number], planeNormal: [number, number, number], planeConstant: number, showPlane: boolean, showComponents: boolean }) {
  const vec1 = new THREE.Vector3(...v1);
  const vec2 = new THREE.Vector3(...v2);
  const crossProd = new THREE.Vector3().crossVectors(vec1, vec2);

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      <Grid infiniteGrid fadeDistance={40} fadeStrength={4} sectionColor="#9ca3af" cellColor="#e5e7eb" />
      
      <Line points={[[0, 0, 0], [10, 0, 0]]} color="#ef4444" lineWidth={3} />
      <Line points={[[0, 0, 0], [0, 10, 0]]} color="#22c55e" lineWidth={3} />
      <Line points={[[0, 0, 0], [0, 0, 10]]} color="#3b82f6" lineWidth={3} />

      <VectorArrow end={v1} color="#3b82f6" label="a" />
      {showComponents && (
        <group>
          <Line points={[[v1[0], 0, 0], [v1[0], v1[1], 0], [v1[0], v1[1], v1[2]]]} color="#3b82f6" lineWidth={1} dashed dashScale={0.5} />
          <Line points={[[0, 0, v1[2]], [0, v1[1], v1[2]], [v1[0], v1[1], v1[2]]]} color="#3b82f6" lineWidth={1} dashed dashScale={0.5} />
          <Line points={[[0, v1[1], 0], [v1[0], v1[1], 0]]} color="#3b82f6" lineWidth={1} dashed dashScale={0.5} />
        </group>
      )}

      <VectorArrow end={v2} color="#ef4444" label="b" />
       {showComponents && (
        <group>
          <Line points={[[v2[0], 0, 0], [v2[0], v2[1], 0], [v2[0], v2[1], v2[2]]]} color="#ef4444" lineWidth={1} dashed dashScale={0.5} />
          <Line points={[[0, 0, v2[2]], [0, v2[1], v2[2]], [v2[0], v2[1], v2[2]]]} color="#ef4444" lineWidth={1} dashed dashScale={0.5} />
          <Line points={[[0, v2[1], 0], [v2[0], v2[1], 0]]} color="#ef4444" lineWidth={1} dashed dashScale={0.5} />
        </group>
      )}

      <VectorArrow end={[crossProd.x, crossProd.y, crossProd.z]} color="#a855f7" label="a×b" />
      
      {showPlane && <PlaneVisualizer normal={planeNormal} constant={planeConstant} />}

      <OrbitControls makeDefault />
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

  const vec1 = new THREE.Vector3(...v1);
  const vec2 = new THREE.Vector3(...v2);
  const dotProduct = vec1.dot(vec2);
  const crossProd = new THREE.Vector3().crossVectors(vec1, vec2);
  const angleDeg = (vec1.angleTo(vec2) * 180 / Math.PI).toFixed(1);

  const updateVec = (setter: any, current: any, idx: number, val: number) => {
    const newVec = [...current] as [number, number, number];
    newVec[idx] = isNaN(val) ? 0 : val;
    setter(newVec);
  };

  const toPolar = (vec: [number, number, number]) => {
      const v = new THREE.Vector3(...vec);
      const r = v.length();
      const theta = Math.atan2(v.x, v.z) * 180 / Math.PI; // Azimuth (from Z axis? ThreeJS Y is up)
      // Actually let's use standard spherical: 
      // r = length
      // phi = angle from Y (0 is up, 180 is down)
      // theta = angle in XZ plane (from X or Z?)
      
      // Let's stick to a simpler interpretation for this UI:
      // Magnitude
      // Angle X (deg)
      // Angle Y (deg) -- too ambiguous.
      
      // Let's just do Magnitude, Theta (XZ plane), Phi (from Y axis)
      const phi = Math.acos(v.y / (r || 1)) * 180 / Math.PI;
      const thetaRad = Math.atan2(v.z, v.x); // from X axis
      let thetaDeg = thetaRad * 180 / Math.PI;
      
      return { r, theta: thetaDeg, phi };
  };

  const updateFromPolar = (setter: any, r: number, theta: number, phi: number) => {
      // theta is XZ angle, phi is angle from Y
      const thetaRad = theta * Math.PI / 180;
      const phiRad = phi * Math.PI / 180;
      
      const y = r * Math.cos(phiRad);
      const h = r * Math.sin(phiRad); // horizontal projection length
      const x = h * Math.cos(thetaRad);
      const z = h * Math.sin(thetaRad);
      
      setter([x, y, z]);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      <div className="w-full md:w-96 flex flex-col border-r bg-white shadow-sm z-10 h-1/2 md:h-full overflow-y-auto">
        <header className="p-6 border-b">
            <Link href="/" className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors mb-2 block">← ホームに戻る</Link>
            <h1 className="text-2xl font-bold tracking-tight">空間ベクトル</h1>
            <p className="text-sm text-gray-500 mt-1">数学B / ベクトル方程式</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
             <button onClick={() => setInputMode('xyz')} className={`flex-1 text-xs py-1.5 rounded-md transition-all ${inputMode === 'xyz' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}>成分 (x,y,z)</button>
             <button onClick={() => setInputMode('polar')} className={`flex-1 text-xs py-1.5 rounded-md transition-all ${inputMode === 'polar' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}>極座標 (r,θ,φ)</button>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                ベクトル a
            </h3>
            {inputMode === 'xyz' ? (
                <div className="grid grid-cols-3 gap-3">
                {['x', 'y', 'z'].map((axis, i) => (
                    <div key={axis}>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">{axis}</label>
                        <input type="number" value={v1[i].toFixed(2)} onChange={(e) => updateVec(setV1, v1, i, parseFloat(e.target.value))} className="w-full rounded-md border-gray-200 bg-gray-50 text-sm focus:border-blue-500 focus:ring-blue-500 p-2" />
                    </div>
                ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {(() => {
                        const { r, theta, phi } = toPolar(v1);
                        return (
                            <>
                                <div className="flex items-center gap-2">
                                    <label className="w-12 text-xs font-medium text-gray-500">長さ r</label>
                                    <input type="number" value={r.toFixed(2)} onChange={(e) => updateFromPolar(setV1, parseFloat(e.target.value), theta, phi)} className="flex-1 rounded-md border-gray-200 bg-gray-50 text-sm p-2" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-12 text-xs font-medium text-gray-500">方位 θ</label>
                                    <input type="range" min="-180" max="180" value={theta} onChange={(e) => updateFromPolar(setV1, r, parseFloat(e.target.value), phi)} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                    <span className="w-8 text-xs font-mono text-right">{theta.toFixed(0)}°</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-12 text-xs font-medium text-gray-500">天頂 φ</label>
                                    <input type="range" min="0" max="180" value={phi} onChange={(e) => updateFromPolar(setV1, r, theta, parseFloat(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                    <span className="w-8 text-xs font-mono text-right">{phi.toFixed(0)}°</span>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                ベクトル b
            </h3>
            {inputMode === 'xyz' ? (
                <div className="grid grid-cols-3 gap-3">
                {['x', 'y', 'z'].map((axis, i) => (
                    <div key={axis}>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">{axis}</label>
                        <input type="number" value={v2[i].toFixed(2)} onChange={(e) => updateVec(setV2, v2, i, parseFloat(e.target.value))} className="w-full rounded-md border-gray-200 bg-gray-50 text-sm focus:border-red-500 focus:ring-red-500 p-2" />
                    </div>
                ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {(() => {
                        const { r, theta, phi } = toPolar(v2);
                        return (
                            <>
                                <div className="flex items-center gap-2">
                                    <label className="w-12 text-xs font-medium text-gray-500">長さ r</label>
                                    <input type="number" value={r.toFixed(2)} onChange={(e) => updateFromPolar(setV2, parseFloat(e.target.value), theta, phi)} className="flex-1 rounded-md border-gray-200 bg-gray-50 text-sm p-2" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-12 text-xs font-medium text-gray-500">方位 θ</label>
                                    <input type="range" min="-180" max="180" value={theta} onChange={(e) => updateFromPolar(setV2, r, parseFloat(e.target.value), phi)} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                    <span className="w-8 text-xs font-mono text-right">{theta.toFixed(0)}°</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-12 text-xs font-medium text-gray-500">天頂 φ</label>
                                    <input type="range" min="0" max="180" value={phi} onChange={(e) => updateFromPolar(setV2, r, theta, parseFloat(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                    <span className="w-8 text-xs font-mono text-right">{phi.toFixed(0)}°</span>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
          </div>
          
          <div className="pt-6 border-t border-gray-100 space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <span className="w-3 h-3 rounded-full bg-cyan-500 mr-2"></span>
                    平面
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={showPlane} onChange={(e) => setShowPlane(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
             </div>

             <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></span>
                    成分表示
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={showComponents} onChange={(e) => setShowComponents(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
             </div>
             
             {showPlane && (
                 <div className="p-4 bg-gray-50 rounded-lg space-y-4 transition-all animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-mono text-gray-500 text-center bg-white p-2 rounded border">nx + ny + nz = d</p>
                    <div>
                        <label className="text-xs font-medium text-gray-700 mb-2 block">法線ベクトル (n)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['x', 'y', 'z'].map((axis, i) => (
                                <input key={axis} type="number" placeholder={axis} value={planeNormal[i]} onChange={(e) => updateVec(setPlaneNormal, planeNormal, i, parseFloat(e.target.value))} className="w-full rounded border-gray-200 text-xs p-1.5" />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 mb-2 block">原点からの距離 (d)</label>
                        <input type="number" value={planeConstant} onChange={(e) => setPlaneConstant(parseFloat(e.target.value))} className="w-full rounded border-gray-200 text-xs p-1.5" />
                    </div>
                 </div>
             )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">計算結果</h3>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-600">内積 (a・b)</span>
                <span className="font-mono font-medium">{dotProduct.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-600">外積 (a×b)</span>
                <span className="font-mono font-medium">({crossProd.x.toFixed(1)}, {crossProd.y.toFixed(1)}, {crossProd.z.toFixed(1)})</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">なす角 (θ)</span>
                <span className="font-mono font-medium">{angleDeg}°</span>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center pt-4">
             ドラッグで回転 • スクロールで拡大
          </div>

        </div>
      </div>

      <div className="flex-1 relative bg-white">
        <Canvas camera={{ position: [6, 4, 8], fov: 45 }}>
          <Scene v1={v1} v2={v2} planeNormal={planeNormal} planeConstant={planeConstant} showPlane={showPlane} showComponents={showComponents} />
        </Canvas>
        <div className="absolute bottom-6 left-6 flex gap-4 text-xs font-medium bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-gray-200">
           <span className="flex items-center text-red-500"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>X軸</span>
           <span className="flex items-center text-green-500"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Y軸</span>
           <span className="flex items-center text-blue-500"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Z軸</span>
        </div>
      </div>
    </div>
  );
}
