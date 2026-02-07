"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type Point = { x: number, y: number };

export default function DataPage() {
  const [points, setPoints] = useState<Point[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Statistics State
  const [stats, setStats] = useState({ a: 0, b: 0, r: 0, n: 0 });

  useEffect(() => {
    if (points.length < 2) {
        setStats({ a: 0, b: 0, r: 0, n: points.length });
        return;
    }

    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    points.forEach(p => {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumX2 += p.x * p.x;
        sumY2 += p.y * p.y;
    });

    const Sxx = sumX2 - (sumX * sumX) / n;
    const Syy = sumY2 - (sumY * sumY) / n;
    const Sxy = sumXY - (sumX * sumY) / n;

    if (Sxx === 0 || Syy === 0) {
        setStats({ a: 0, b: 0, r: 0, n });
        return;
    }

    const a = Sxy / Sxx;
    const b = (sumY / n) - a * (sumX / n);
    const r = Sxy / Math.sqrt(Sxx * Syy);

    setStats({ a, b, r, n });

  }, [points]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top; // Canvas Y

      // Normalize to 0-10 scale
      const normX = (x / rect.width) * 10;
      const normY = 10 - (y / rect.height) * 10; // Invert Y for cartesian

      setPoints([...points, { x: normX, y: normY }]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    // ... (grid logic omitted for brevity, assume 10x10 grid)
    
    // Draw Points
    ctx.fillStyle = '#0071e3';
    points.forEach(p => {
        const px = (p.x / 10) * width;
        const py = height - (p.y / 10) * height;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Regression Line
    if (stats.n >= 2) {
        ctx.strokeStyle = '#ff3b30';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        // x=0
        const y0 = stats.a * 0 + stats.b;
        const py0 = height - (y0 / 10) * height;
        
        // x=10
        const y10 = stats.a * 10 + stats.b;
        const py10 = height - (y10 / 10) * height;

        ctx.moveTo(0, py0);
        ctx.lineTo(width, py10);
        ctx.stroke();
    }

  }, [points, stats]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7]">
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 h-16 flex items-center px-6 transition-all supports-[backdrop-filter]:bg-white/60">
             <div className="max-w-6xl mx-auto w-full flex items-center gap-4">
                <Link href="/" className="group flex items-center text-sm font-medium text-[#86868b] hover:text-[#0071e3] transition-colors">
                    <span className="inline-block transition-transform group-hover:-translate-x-1 mr-1">←</span> ホーム
                </Link>
                <div className="h-4 w-px bg-gray-300"></div>
                <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">データの分析 (Data Analysis)</h1>
             </div>
        </header>

        <main className="pt-24 p-6 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100/50 space-y-6">
                    <div>
                        <h2 className="text-sm font-bold text-[#86868b] uppercase tracking-wide mb-4">Correlation & Regression</h2>
                        <div className="flex flex-col gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-600">Correlation (r)</span>
                                <span className={`text-xl font-mono font-bold ${stats.r > 0.7 ? 'text-green-600' : stats.r < -0.7 ? 'text-blue-600' : 'text-gray-800'}`}>
                                    {stats.r.toFixed(3)}
                                </span>
                            </div>
                            
                             <div className="bg-gray-50 p-4 rounded-xl">
                                <span className="text-sm font-bold text-gray-600 block mb-2">Regression Line</span>
                                <span className="text-lg font-mono text-gray-800 block text-center">
                                    y = {stats.a.toFixed(2)}x + {stats.b.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button 
                            onClick={() => { setPoints([]); setStats({ a: 0, b: 0, r: 0, n: 0 }); }}
                            className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors"
                        >
                            Reset Points
                        </button>
                    </div>
                     <p className="text-xs text-[#86868b] leading-relaxed">
                        グラフをクリックして点を追加してください。自動的に相関係数と回帰直線を計算します。
                    </p>
                </div>
            </div>
            
            <div className="w-full md:w-2/3 bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100/50 p-4 flex justify-center items-center overflow-hidden relative min-h-[400px]">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={600} 
                    onClick={handleCanvasClick}
                    className="w-full h-auto max-w-full z-10 cursor-crosshair border border-dashed border-gray-200 rounded-lg hover:border-blue-300 transition-colors" 
                />
            </div>
        </main>
    </div>
  );
}
