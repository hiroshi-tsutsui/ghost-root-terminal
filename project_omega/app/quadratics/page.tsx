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
    const scale = 30; // Slightly larger scale

    // Grid
    ctx.strokeStyle = '#f5f5f7';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += scale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += scale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#d1d1d6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); 
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
    ctx.stroke();

    // Parabola - Apple Blue
    ctx.strokeStyle = '#0071e3';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    let first = true;
    for (let pixelX = 0; pixelX < width; pixelX++) {
      const x = (pixelX - centerX) / scale;
      const y = a * x * x + b * x + c;
      const pixelY = centerY - (y * scale);
      
      if (pixelY < -height || pixelY > height * 2) {
          first = true;
          continue;
      }

      if (first) {
        ctx.moveTo(pixelX, pixelY);
        first = false;
      } else {
        ctx.lineTo(pixelX, pixelY);
      }
    }
    ctx.stroke();

    // Vertex point
    if (a !== 0) {
        const vx = -b / (2 * a);
        const vy = a * vx * vx + b * vx + c;
        const pVx = centerX + vx * scale;
        const pVy = centerY - (vy * scale);
        
        // Outer halo
        ctx.fillStyle = 'rgba(255, 59, 48, 0.2)'; // Apple Red
        ctx.beginPath();
        ctx.arc(pVx, pVy, 12, 0, 2 * Math.PI);
        ctx.fill();

        // Inner dot
        ctx.fillStyle = '#ff3b30';
        ctx.beginPath();
        ctx.arc(pVx, pVy, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // White center
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(pVx, pVy, 2.5, 0, 2 * Math.PI);
        ctx.fill();
    }

  }, [a, b, c]);

  const vertexX = a !== 0 ? -b / (2 * a) : 0;
  const vertexY = a * vertexX * vertexX + b * vertexX + c;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans">
       <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 h-16 flex items-center px-6 transition-all supports-[backdrop-filter]:bg-white/60">
         <div className="max-w-6xl mx-auto w-full flex items-center gap-4">
             <Link href="/" className="group flex items-center text-sm font-medium text-[#86868b] hover:text-[#0071e3] transition-colors">
               <span className="inline-block transition-transform group-hover:-translate-x-1 mr-1">←</span> ホーム
             </Link>
             <div className="h-4 w-px bg-gray-300"></div>
             <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">二次関数 <span className="text-[#86868b] font-normal ml-2 text-sm">数学I / グラフと性質</span></h1>
         </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 pt-24">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Controls Panel */}
        <div className="w-full lg:w-1/3 space-y-6">
            <div className="apple-card p-6 fade-in-up delay-100">
                <div className="mb-8 p-6 bg-[#F5F5F7] rounded-2xl text-center border border-black/[0.03]">
                    <p className="font-mono text-xl font-bold text-[#1d1d1f] tracking-wider">
                    y = <span className="text-[#0071e3]">{a === 0 ? '' : `${a}x²`}</span> {b >= 0 ? '+' : ''} <span className="text-[#34c759]">{b}x</span> {c >= 0 ? '+' : ''} <span className="text-[#ff3b30]">{c}</span>
                    </p>
                </div>

                <div className="space-y-8">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-[#86868b] uppercase tracking-wide flex items-center">
                                <span className="w-2 h-2 rounded-full bg-[#0071e3] mr-2"></span>
                                a (グラフの開き)
                            </label>
                            <span className="font-mono text-lg font-bold text-[#0071e3]">{a.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="-5" max="5" step="0.1" 
                            value={a} onChange={(e) => setA(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-[#86868b] uppercase tracking-wide flex items-center">
                                <span className="w-2 h-2 rounded-full bg-[#34c759] mr-2"></span>
                                b (軸の位置)
                            </label>
                            <span className="font-mono text-lg font-bold text-[#34c759]">{b.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="-10" max="10" step="0.1" 
                            value={b} onChange={(e) => setB(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-[#86868b] uppercase tracking-wide flex items-center">
                                <span className="w-2 h-2 rounded-full bg-[#ff3b30] mr-2"></span>
                                c (y切片)
                            </label>
                            <span className="font-mono text-lg font-bold text-[#ff3b30]">{c.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="-10" max="10" step="0.1" 
                            value={c} onChange={(e) => setC(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
          
            <div className="apple-card p-6 space-y-4 fade-in-up delay-200">
                <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider border-b border-gray-100 pb-3">グラフの性質</h3>
                <div className="flex justify-between items-center group">
                    <span className="text-sm font-medium text-[#1d1d1f]">頂点座標</span>
                    <span className="font-mono text-base font-medium text-[#ff3b30] group-hover:scale-105 transition-transform">({vertexX.toFixed(2)}, {vertexY.toFixed(2)})</span>
                </div>
                <div className="flex justify-between items-center group">
                    <span className="text-sm font-medium text-[#1d1d1f]">軸の方程式</span>
                    <span className="font-mono text-base font-medium text-[#1d1d1f] group-hover:scale-105 transition-transform">x = {vertexX.toFixed(2)}</span>
                </div>
            </div>
        </div>

        {/* Canvas Panel */}
        <div className="w-full lg:w-2/3 apple-card p-2 flex items-center justify-center overflow-hidden bg-white fade-in-up delay-300 relative min-h-[500px]">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={600} 
            className="w-full h-auto max-w-full z-10"
          />
        </div>
      </div>
      </main>
    </div>
  );
}
