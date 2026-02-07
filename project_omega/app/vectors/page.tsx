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

function Scene({ v1, v2, planeNormal, planeConstant, showPlane }: { v1: [number, number, number], v2: [number, number, number], planeNormal: [number, number, number], planeConstant: number, showPlane: boolean }) {
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
      <VectorArrow end={v2} color="#ef4444" label="b" />
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
  const [planeNormal, setPlaneNormal] = useState<[number, number, number]>([0, 1, 0]); 
  const [planeConstant, setPlaneConstant] = useState(0);

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

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="w-96 flex flex-col border-r bg-white shadow-sm z-10">
        <header className="p-6 border-b">
            <Link href="/" className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors mb-2 block">← ホームに戻る</Link>
            <h1 className="text-2xl font-bold tracking-tight">空間ベクトル</h1>
            <p className="text-sm text-gray-500 mt-1">数学B / ベクトル方程式</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                ベクトル a
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {['x', 'y', 'z'].map((axis, i) => (
                <div key={axis}>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">{axis}</label>
                    <input type="number" value={v1[i]} onChange={(e) => updateVec(setV1, v1, i, parseFloat(e.target.value))} className="w-full rounded-md border-gray-200 bg-gray-50 text-sm focus:border-blue-500 focus:ring-blue-500 p-2" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                ベクトル b
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {['x', 'y', 'z'].map((axis, i) => (
                <div key={axis}>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">{axis}</label>
                    <input type="number" value={v2[i]} onChange={(e) => updateVec(setV2, v2, i, parseFloat(e.target.value))} className="w-full rounded-md border-gray-200 bg-gray-50 text-sm focus:border-red-500 focus:ring-red-500 p-2" />
                </div>
              ))}
            </div>
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
          <Scene v1={v1} v2={v2} planeNormal={planeNormal} planeConstant={planeConstant} showPlane={showPlane} />
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
