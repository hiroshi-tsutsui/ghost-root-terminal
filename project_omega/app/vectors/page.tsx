// @ts-nocheck
"use client";

import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Line, Plane } from '@react-three/drei';
import * as THREE from 'three';

// --- Types ---
// Extend JSX.IntrinsicElements to include Three.js elements for R3F
import { ThreeElements } from '@react-three/fiber';

function VectorArrow({ start = [0, 0, 0], end, color = 'orange', label = '' }: { start?: [number, number, number], end: [number, number, number], color?: string, label?: string }) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endVec, startVec);
  const length = direction.length();
  
  if (length < 0.001) return null;

  // Normalize direction for rotation
  const dirNormalized = direction.clone().normalize();
  
  // Quaternion for rotation (align Y-up cylinder to direction: Vector3(0,1,0))
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirNormalized);
  
  // Midpoint for cylinder
  const midPoint = startVec.clone().add(direction.clone().multiplyScalar(0.5));

  return (
    <group>
      {/* Shaft */}
      <mesh position={midPoint} quaternion={quaternion}>
        <cylinderGeometry args={[0.05, 0.05, length, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Cone head */}
      <mesh position={endVec} quaternion={quaternion}>
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

function PlaneVisualizer({ normal, constant }: { normal: [number, number, number], constant: number }) {
    const n = new THREE.Vector3(...normal);
    if (n.lengthSq() === 0) return null;
    
    // Plane equation: n . p = constant
    // Three.js Plane(normal, constant) uses Hess normal form: ax + by + cz + d = 0
    // So if n . p = k, then n . p - k = 0. So d = -k.
    // Wait, Three.js Plane constant is distance from origin along normal?
    // "constant: The negative distance from the origin to the plane along the normal vector."
    // Let's use the PlaneHelper or just a mesh.
    
    // Create a mesh oriented to the normal.
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n.clone().normalize());
    
    // Position: We need a point on the plane.
    // If n = (a, b, c), point P = (a, b, c) * (constant / |n|^2) satisfies n.P = constant.
    const pos = n.clone().multiplyScalar(constant / n.lengthSq());

    return (
        <group position={pos} quaternion={quaternion}>
            <mesh>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="cyan" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
            <gridHelper args={[10, 10]} rotation={[Math.PI/2, 0, 0]} />
            
            {/* Draw Normal Vector from center of plane */}
            <VectorArrow start={[0,0,0]} end={[0, 0, 2]} color="cyan" label="n" />
        </group>
    );
}

function Scene({ v1, v2, planeNormal, planeConstant, showPlane }: { v1: [number, number, number], v2: [number, number, number], planeNormal: [number, number, number], planeConstant: number, showPlane: boolean }) {
  const vec1 = new THREE.Vector3(...v1);
  const vec2 = new THREE.Vector3(...v2);
  const crossProd = new THREE.Vector3().crossVectors(vec1, vec2);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <Grid infiniteGrid fadeDistance={30} fadeStrength={5} sectionColor="white" cellColor="gray"/>
      
      {/* Axes Helper (Custom Lines) */}
      <Line points={[[0, 0, 0], [10, 0, 0]]} color="red" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 10, 0]]} color="green" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 0, 10]]} color="blue" lineWidth={2} />

      <VectorArrow end={v1} color="blue" label={`v1`} />
      <VectorArrow end={v2} color="red" label={`v2`} />
      <VectorArrow end={[crossProd.x, crossProd.y, crossProd.z]} color="purple" label="Cross" />
      
      {showPlane && <PlaneVisualizer normal={planeNormal} constant={planeConstant} />}

      <OrbitControls makeDefault />
    </>
  );
}

export default function VectorsPage() {
  const [v1, setV1] = useState<[number, number, number]>([2, 1, 0]);
  const [v2, setV2] = useState<[number, number, number]>([0, 2, 1]);
  
  // Plane State
  const [showPlane, setShowPlane] = useState(false);
  const [planeNormal, setPlaneNormal] = useState<[number, number, number]>([0, 1, 0]); // Default horizontal plane
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
    <div className="flex flex-col h-screen bg-white text-black">
      <header className="p-4 bg-gray-100 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold">Vectors & Planes (ベクトル・平面) - Math B</h1>
        <a href="/" className="text-blue-500 hover:underline">Back to Home</a>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Controls Sidebar */}
        <div className="w-80 p-4 bg-gray-50 border-r overflow-y-auto space-y-6">
          
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-blue-600">Vector A (Blue)</h3>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-sm">X <input type="number" value={v1[0]} onChange={(e) => updateVec(setV1, v1, 0, parseFloat(e.target.value))} className="w-full border p-1 rounded" /></label>
              <label className="text-sm">Y <input type="number" value={v1[1]} onChange={(e) => updateVec(setV1, v1, 1, parseFloat(e.target.value))} className="w-full border p-1 rounded" /></label>
              <label className="text-sm">Z <input type="number" value={v1[2]} onChange={(e) => updateVec(setV1, v1, 2, parseFloat(e.target.value))} className="w-full border p-1 rounded" /></label>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-lg text-red-600">Vector B (Red)</h3>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-sm">X <input type="number" value={v2[0]} onChange={(e) => updateVec(setV2, v2, 0, parseFloat(e.target.value))} className="w-full border p-1 rounded" /></label>
              <label className="text-sm">Y <input type="number" value={v2[1]} onChange={(e) => updateVec(setV2, v2, 1, parseFloat(e.target.value))} className="w-full border p-1 rounded" /></label>
              <label className="text-sm">Z <input type="number" value={v2[2]} onChange={(e) => updateVec(setV2, v2, 2, parseFloat(e.target.value))} className="w-full border p-1 rounded" /></label>
            </div>
          </div>
          
          <div className="space-y-2 border-t pt-4">
             <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-cyan-600">Plane (Cyan)</h3>
                <label className="text-sm flex items-center gap-1">
                    <input type="checkbox" checked={showPlane} onChange={(e) => setShowPlane(e.target.checked)} /> Show
                </label>
             </div>
             {showPlane && (
                 <>
                    <p className="text-xs text-gray-500">Equation: nx*x + ny*y + nz*z = d</p>
                    <label className="text-sm font-bold">Normal Vector (n)</label>
                    <div className="grid grid-cols-3 gap-2">
                        <label className="text-sm">nX <input type="number" value={planeNormal[0]} onChange={(e) => updateVec(setPlaneNormal, planeNormal, 0, parseFloat(e.target.value))} className="w-full border p-1 rounded" /></label>
                        <label className="text-sm">nY <input type="number" value={planeNormal[1]} onChange={(e) => updateVec(setPlaneNormal, planeNormal, 1, parseFloat(e.target.value))} className="w-full border p-1 rounded" /></label>
                        <label className="text-sm">nZ <input type="number" value={planeNormal[2]} onChange={(e) => updateVec(setPlaneNormal, planeNormal, 2, parseFloat(e.target.value))} className="w-full border p-1 rounded" /></label>
                    </div>
                    <label className="text-sm font-bold block mt-2">Distance (d)</label>
                    <input type="number" value={planeConstant} onChange={(e) => setPlaneConstant(parseFloat(e.target.value))} className="w-full border p-1 rounded" />
                 </>
             )}
          </div>

          <div className="p-4 bg-white rounded shadow-sm border space-y-2 text-sm">
            <h3 className="font-bold border-b pb-1">Calculations</h3>
            <p><strong>Dot Product:</strong> {dotProduct.toFixed(2)}</p>
            <p><strong>Cross Product:</strong> ({crossProd.x.toFixed(2)}, {crossProd.y.toFixed(2)}, {crossProd.z.toFixed(2)})</p>
            <p><strong>Angle (θ):</strong> {angleDeg}°</p>
          </div>
          
          <div className="text-xs text-gray-500 mt-4">
             <p>Use mouse to rotate/pan/zoom.</p>
          </div>

        </div>

        {/* 3D Canvas */}
        <div className="flex-1 bg-gray-900 relative">
          <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
            <Scene v1={v1} v2={v2} planeNormal={planeNormal} planeConstant={planeConstant} showPlane={showPlane} />
          </Canvas>
          <div className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded text-xs">
             <span className="text-red-400 font-bold">X</span>
             <span className="text-green-400 font-bold ml-2">Y</span>
             <span className="text-blue-400 font-bold ml-2">Z</span>
          </div>
        </div>
      </div>
    </div>
  );
}
