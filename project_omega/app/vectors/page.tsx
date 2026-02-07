"use client";

import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Line } from '@react-three/drei';
import * as THREE from 'three';

function VectorArrow({ start = [0, 0, 0], end, color = 'orange', label = '' }: { start?: [number, number, number], end: [number, number, number], color?: string, label?: string }) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endVec, startVec);
  const length = direction.length();
  
  // Normalize direction for rotation
  const dirNormalized = direction.clone().normalize();
  
  // Quaternion for rotation (align Y-up cylinder to direction)
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirNormalized);

  return (
    <group position={startVec}>
      {/* Shaft */}
      <mesh position={direction.clone().multiplyScalar(0.5)} quaternion={quaternion}>
        <cylinderGeometry args={[0.05, 0.05, length, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Cone head */}
      <mesh position={direction} quaternion={quaternion}>
        <coneGeometry args={[0.15, 0.4, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Label */}
      {label && (
        <Text
          position={endVec.clone().add(new THREE.Vector3(0, 0.2, 0))}
          fontSize={0.3}
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

function Scene({ v1, v2 }: { v1: [number, number, number], v2: [number, number, number] }) {
  // Cross Product
  const vec1 = new THREE.Vector3(...v1);
  const vec2 = new THREE.Vector3(...v2);
  const crossProd = new THREE.Vector3().crossVectors(vec1, vec2);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <Grid infiniteGrid fadeDistance={30} fadeStrength={5} />
      
      {/* Axes */}
      <Line points={[[0, 0, 0], [10, 0, 0]]} color="red" lineWidth={2} /> {/* X */}
      <Line points={[[0, 0, 0], [0, 10, 0]]} color="green" lineWidth={2} /> {/* Y */}
      <Line points={[[0, 0, 0], [0, 0, 10]]} color="blue" lineWidth={2} /> {/* Z */}

      <VectorArrow end={v1} color="blue" label={`v1 (${v1.join(',')})`} />
      <VectorArrow end={v2} color="red" label={`v2 (${v2.join(',')})`} />
      
      {/* Resultant / Sum */}
      {/* <VectorArrow start={v1} end={[v1[0]+v2[0], v1[1]+v2[1], v1[2]+v2[2]]} color="gray" /> */}
      
      {/* Cross Product */}
      <VectorArrow end={[crossProd.x, crossProd.y, crossProd.z]} color="purple" label="Cross Product" />

      <OrbitControls makeDefault />
    </>
  );
}

export default function VectorsPage() {
  const [v1, setV1] = useState<[number, number, number]>([2, 1, 0]);
  const [v2, setV2] = useState<[number, number, number]>([0, 2, 1]);

  const dotProduct = v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
  
  const vec1 = new THREE.Vector3(...v1);
  const vec2 = new THREE.Vector3(...v2);
  const crossProd = new THREE.Vector3().crossVectors(vec1, vec2);
  const angleRad = vec1.angleTo(vec2);
  const angleDeg = (angleRad * 180 / Math.PI).toFixed(1);

  const updateV1 = (idx: number, val: number) => {
    const newV1 = [...v1] as [number, number, number];
    newV1[idx] = val;
    setV1(newV1);
  };

  const updateV2 = (idx: number, val: number) => {
    const newV2 = [...v2] as [number, number, number];
    newV2[idx] = val;
    setV2(newV2);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="p-4 bg-gray-100 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold">Vectors (ベクトル) - Math B</h1>
        <a href="/" className="text-blue-500 hover:underline">Back to Home</a>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Controls Sidebar */}
        <div className="w-80 p-4 bg-gray-50 border-r overflow-y-auto space-y-6">
          
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-blue-600">Vector A (Blue)</h3>
            <div className="grid grid-cols-3 gap-2">
              <label>X <input type="number" value={v1[0]} onChange={(e) => updateV1(0, Number(e.target.value))} className="w-full border p-1 rounded" /></label>
              <label>Y <input type="number" value={v1[1]} onChange={(e) => updateV1(1, Number(e.target.value))} className="w-full border p-1 rounded" /></label>
              <label>Z <input type="number" value={v1[2]} onChange={(e) => updateV1(2, Number(e.target.value))} className="w-full border p-1 rounded" /></label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg text-red-600">Vector B (Red)</h3>
            <div className="grid grid-cols-3 gap-2">
              <label>X <input type="number" value={v2[0]} onChange={(e) => updateV2(0, Number(e.target.value))} className="w-full border p-1 rounded" /></label>
              <label>Y <input type="number" value={v2[1]} onChange={(e) => updateV2(1, Number(e.target.value))} className="w-full border p-1 rounded" /></label>
              <label>Z <input type="number" value={v2[2]} onChange={(e) => updateV2(2, Number(e.target.value))} className="w-full border p-1 rounded" /></label>
            </div>
          </div>

          <div className="p-4 bg-white rounded shadow-sm border space-y-2">
            <h3 className="font-bold border-b pb-1">Calculations</h3>
            <p><strong>Dot Product (内積):</strong> {dotProduct.toFixed(2)}</p>
            <p><strong>Cross Product (外積):</strong> ({crossProd.x.toFixed(2)}, {crossProd.y.toFixed(2)}, {crossProd.z.toFixed(2)})</p>
            <p><strong>Magnitude A:</strong> {vec1.length().toFixed(2)}</p>
            <p><strong>Magnitude B:</strong> {vec2.length().toFixed(2)}</p>
            <p><strong>Angle (θ):</strong> {angleDeg}°</p>
          </div>
          
          <div className="text-sm text-gray-500">
             <p>Use mouse to rotate/pan/zoom.</p>
          </div>

        </div>

        {/* 3D Canvas */}
        <div className="flex-1 bg-gray-900 relative">
          <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
            <Scene v1={v1} v2={v2} />
          </Canvas>
          <div className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded">
             <span className="text-red-400 font-bold">X</span>
             <span className="text-green-400 font-bold ml-2">Y</span>
             <span className="text-blue-400 font-bold ml-2">Z</span>
          </div>
        </div>
      </div>
    </div>
  );
}
