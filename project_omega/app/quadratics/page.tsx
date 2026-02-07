// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function QuadraticsPage() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 20;

    // Grid
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += scale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += scale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); 
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
    ctx.stroke();

    // Parabola
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    for (let pixelX = 0; pixelX < width; pixelX++) {
      const x = (pixelX - centerX) / scale;
      const y = a * x * x + b * x + c;
      const pixelY = centerY - (y * scale);
      
      // Limit drawing to sensible canvas bounds to avoid rendering issues with extreme values
      if (pixelY < -1000 || pixelY > height + 1000) continue;

      if (pixelX === 0) {
        ctx.moveTo(pixelX, pixelY);
      } else {
        ctx.lineTo(pixelX, pixelY);
      }
    }
    ctx.stroke();

    // Vertex point
    const vx = a !== 0 ? -b / (2 * a) : 0;
    const vy = a * vx * vx + b * vx + c;
    const pVx = centerX + vx * scale;
    const pVy = centerY - (vy * scale);
    
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(pVx, pVy, 5, 0, 2 * Math.PI);
    ctx.fill();

  }, [a, b, c]);

  const vertexX = a !== 0 ? -b / (2 * a) : 0;
  const vertexY = a * vertexX * vertexX + b * vertexX + c;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
       <header className="p-4 bg-white border-b shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <div>
             <Link href="/" className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors mb-1 block">← ホームに戻る</Link>
             <h1 className="text-lg font-bold tracking-tight">二次関数 <span className="text-gray-400 font-normal ml-2">数学I / グラフと性質</span></h1>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
        
        <div className="w-full md:w-1/3 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="mb-6 p-4 bg-blue-50 rounded-xl text-center border border-blue-100">
                    <p className="font-mono text-lg font-bold text-blue-900">
                    y = {a === 0 ? '' : `${a}x²`} {b >= 0 ? '+' : ''}{b}x {c >= 0 ? '+' : ''}{c}
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-semibold text-gray-700">a (グラフの開き)</label>
                            <span className="font-mono text-sm font-bold text-blue-600">{a.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="-5" max="5" step="0.1" 
                            value={a} onChange={(e) => setA(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-semibold text-gray-700">b (軸の位置)</label>
                            <span className="font-mono text-sm font-bold text-green-600">{b.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="-10" max="10" step="0.1" 
                            value={b} onChange={(e) => setB(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-semibold text-gray-700">c (y切片)</label>
                            <span className="font-mono text-sm font-bold text-red-600">{c.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="-10" max="10" step="0.1" 
                            value={c} onChange={(e) => setC(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                    </div>
                </div>
            </div>
          
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">グラフの性質</h3>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">頂点座標</span>
                    <span className="font-mono font-medium text-gray-900">({vertexX.toFixed(2)}, {vertexY.toFixed(2)})</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">軸の方程式</span>
                    <span className="font-mono font-medium text-gray-900">x = {vertexX.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-center overflow-hidden">
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={600} 
            className="w-full h-auto max-w-full"
          />
        </div>
      </div>
      </main>
    </div>
  );
}
