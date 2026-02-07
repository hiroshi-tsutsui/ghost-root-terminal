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

function LineVisualizer({ point, dir }: { point: [number, number, number], dir: [number, number, number] }) {
    const p = new THREE.Vector3(...point);
    const d = new THREE.Vector3(...dir).normalize();
    
    if (d.lengthSq() === 0) return null;

    // Draw a long line passing through p in direction d
    const start = p.clone().add(d.clone().multiplyScalar(-20));
    const end = p.clone().add(d.clone().multiplyScalar(20));

    return (
        <group>
            <Line points={[start, end]} color="#af52de" lineWidth={4} />
            <VectorArrow start={[0,0,0]} end={point} color="#ff3b30" label="a (点)" />
            <VectorArrow start={point} end={[p.x + dir[0], p.y + dir[1], p.z + dir[2]]} color="#34c759" label="d (方向)" />
        </group>
    );
}

function Scene({ v1, v2, planeNormal, planeConstant, showPlane, showComponents, mode }: any) {
  const vec1 = new THREE.Vector3(...v1);
  const vec2 = new THREE.Vector3(...v2);
  const crossProd = new THREE.Vector3().crossVectors(vec1, vec2);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      <Grid infiniteGrid fadeDistance={40} fadeStrength={5} sectionColor="#d1d1d6" cellColor="#e5e5e7" />
      
      <Line points={[[0, 0, 0], [10, 0, 0]]} color="#ff3b30" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 10, 0]]} color="#34c759" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 0, 10]]} color="#0071e3" lineWidth={2} />

      {mode === 'basic' && (
        <>
            <VectorArrow end={v1} color="#0071e3" label="a" />
            <VectorArrow end={v2} color="#ff3b30" label="b" />
            <VectorArrow end={[crossProd.x, crossProd.y, crossProd.z]} color="#af52de" label="a×b" />
        </>
      )}

      {mode === 'line' && (
          <LineVisualizer point={v1} dir={v2} />
      )}
      
      {showPlane && <PlaneVisualizer normal={planeNormal} constant={planeConstant} />}

      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} />
    </>
  );
}

export default function VectorsPage() {
  const [v1, setV1] = useState<[number, number, number]>([2, 1, 0]);
  const [v2, setV2] = useState<[number, number, number]>([0, 2, 1]);
  const [mode, setMode] = useState<'basic' | 'line'>('basic');
  
  const [showPlane, setShowPlane] = useState(false);
  const [showComponents, setShowComponents] = useState(false);
  const [planeNormal, setPlaneNormal] = useState<[number, number, number]>([0, 1, 0]); 
  const [planeConstant, setPlaneConstant] = useState(0);
  const [inputMode, setInputMode] = useState<'xyz' | 'polar'>('xyz');

  // Sensei Mode (Simplified for rewrite)
  const [isSenseiMode, setIsSenseiMode] = useState(false);

  const updateVec = (setter: any, current: any, idx: number, val: number) => {
    const newVec = [...current] as [number, number, number];
    newVec[idx] = isNaN(val) ? 0 : val;
    setter(newVec);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans overflow-hidden">
      <div className="w-full md:w-[400px] flex flex-col border-r border-white/20 bg-white/70 backdrop-blur-xl z-10 h-1/2 md:h-full overflow-y-auto shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <header className="p-6 pb-4 border-b border-gray-200/50 sticky top-0 bg-white/50 backdrop-blur-md z-20">
            <Link href="/" className="group flex items-center text-sm font-medium text-[#86868b] hover:text-[#0071e3] transition-colors mb-3">
                <span className="inline-block transition-transform group-hover:-translate-x-1 mr-1">←</span> ホーム
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">空間ベクトル</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
          
          <div className="flex bg-[#e8e8ed] p-1 rounded-lg mb-4">
             <button onClick={() => setMode('basic')} className={`flex-1 py-1.5 rounded-[7px] text-xs font-bold ${mode === 'basic' ? 'bg-white shadow-sm' : ''}`}>Basic (内積・外積)</button>
             <button onClick={() => setMode('line')} className={`flex-1 py-1.5 rounded-[7px] text-xs font-bold ${mode === 'line' ? 'bg-white shadow-sm' : ''}`}>Line (直線の方程式)</button>
          </div>

          {/* Vector A / Point A */}
          <div className="apple-card p-5">
            <h3 className="text-sm font-semibold text-[#1d1d1f] flex items-center mb-4">
                <span className="w-3 h-3 rounded-full bg-[#0071e3] mr-2 shadow-sm"></span>
                {mode === 'basic' ? 'ベクトル a' : '点 A (位置ベクトル)'}
            </h3>
            <div className="grid grid-cols-3 gap-3">
            {['x', 'y', 'z'].map((axis, i) => (
                <div key={axis}>
                    <label className="block text-[11px] font-semibold text-[#86868b] mb-1.5 uppercase">{axis}</label>
                    <input type="number" value={v1[i]} onChange={(e) => updateVec(setV1, v1, i, parseFloat(e.target.value))} className="input-apple text-center" />
                </div>
            ))}
            </div>
          </div>

          {/* Vector B / Direction d */}
          <div className="apple-card p-5">
            <h3 className="text-sm font-semibold text-[#1d1d1f] flex items-center mb-4">
                <span className="w-3 h-3 rounded-full bg-[#ff3b30] mr-2 shadow-sm"></span>
                {mode === 'basic' ? 'ベクトル b' : '方向ベクトル d'}
            </h3>
             <div className="grid grid-cols-3 gap-3">
            {['x', 'y', 'z'].map((axis, i) => (
                <div key={axis}>
                    <label className="block text-[11px] font-semibold text-[#86868b] mb-1.5 uppercase">{axis}</label>
                    <input type="number" value={v2[i]} onChange={(e) => updateVec(setV2, v2, i, parseFloat(e.target.value))} className="input-apple text-center" />
                </div>
            ))}
            </div>
          </div>

        </div>
      </div>

      <div className="flex-1 relative bg-[#F5F5F7]">
        <Canvas camera={{ position: [6, 4, 8], fov: 45 }}>
          <Scene v1={v1} v2={v2} planeNormal={planeNormal} planeConstant={planeConstant} showPlane={showPlane} showComponents={showComponents} mode={mode} />
        </Canvas>
      </div>
    </div>
  );
}
