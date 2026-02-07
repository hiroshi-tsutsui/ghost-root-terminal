"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function LogsPage() {
  const [xMax, setXMax] = useState(10);
  const [isLogScale, setIsLogScale] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padding = 50;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Functions to plot
    const f1 = (x: number) => x;         // Linear
    const f2 = (x: number) => x * x;     // Quadratic
    const f3 = (x: number) => Math.pow(2, x); // Exponential

    // Determine max Y
    const maxYVal = Math.max(f1(xMax), f2(xMax), f3(xMax));
    const effectiveMaxY = isLogScale ? Math.log10(maxYVal) : maxYVal;
    
    // Helper: Map coordinates
    const mapX = (x: number) => padding + (x / xMax) * graphWidth;
    const mapY = (y: number) => {
        let val = y;
        if (isLogScale) {
            val = y <= 0 ? 0 : Math.log10(y);
        }
        // Avoid division by zero if max is 0 (though unlikely here)
        const max = effectiveMaxY || 1; 
        return (height - padding) - (val / max) * graphHeight;
    };

    // Draw Axes
    ctx.strokeStyle = '#d1d1d6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Y Axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    // X Axis
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw labels (simple)
    ctx.fillStyle = '#86868b';
    ctx.font = '12px sans-serif';
    ctx.fillText('0', padding - 15, height - padding + 15);
    ctx.fillText(xMax.toString(), width - padding, height - padding + 15);
    ctx.fillText(isLogScale ? `10^${Math.round(effectiveMaxY)}` : Math.round(maxYVal).toString(), padding - 40, padding);

    // Plot Function
    const plot = (fn: (x: number) => number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        
        let first = true;
        // Iterate by pixel for smooth curve
        for (let pixelX = 0; pixelX <= graphWidth; pixelX++) {
            const x = (pixelX / graphWidth) * xMax;
            const y = fn(x);
            
            const plotX = padding + pixelX;
            const plotY = mapY(y);
            
            // Clip
            if (plotY < padding) {
                if (!first) ctx.lineTo(plotX, padding);
                break; 
            }
            if (plotY > height - padding) {
                // If it goes below x-axis (not here, but generic check)
                // Just clamp to axis
                 if (first) {
                    ctx.moveTo(plotX, height - padding);
                    first = false;
                 }
                 continue;
            }

            if (first) {
                ctx.moveTo(plotX, plotY);
                first = false;
            } else {
                ctx.lineTo(plotX, plotY);
            }
        }
        ctx.stroke();
    };

    plot(f1, '#0071e3'); // Blue: y=x
    plot(f2, '#34c759'); // Green: y=x^2
    plot(f3, '#ff3b30'); // Red: y=2^x

  }, [xMax, isLogScale]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7]">
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 h-16 flex items-center px-6 transition-all supports-[backdrop-filter]:bg-white/60">
             <div className="max-w-6xl mx-auto w-full flex items-center gap-4">
                <Link href="/" className="group flex items-center text-sm font-medium text-[#86868b] hover:text-[#0071e3] transition-colors">
                    <span className="inline-block transition-transform group-hover:-translate-x-1 mr-1">←</span> ホーム
                </Link>
                <div className="h-4 w-px bg-gray-300"></div>
                <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">指数・対数 (Exponential & Logarithmic)</h1>
             </div>
        </header>

        <main className="pt-24 p-6 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100/50 space-y-6">
                    <div>
                        <h2 className="text-sm font-bold text-[#86868b] uppercase tracking-wide mb-4">Scale Comparison</h2>
                        <div className="flex items-center gap-4 mb-2">
                             <label className="text-xs font-bold text-[#1d1d1f]">X Range (0 to {xMax})</label>
                             <input 
                                type="range" min="5" max="50" step="1" 
                                value={xMax} 
                                onChange={(e) => setXMax(parseInt(e.target.value))}
                                className="flex-1 accent-blue-600"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
                         <span className="font-bold text-sm text-[#1d1d1f]">Scale Mode</span>
                         <button 
                            onClick={() => setIsLogScale(!isLogScale)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                                isLogScale ? 'bg-purple-600 text-white shadow-purple-200' : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                         >
                            {isLogScale ? 'Logarithmic (log₁₀)' : 'Linear'}
                         </button>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 bg-[#0071e3] rounded-full"></span> 
                            <span className="text-sm font-medium text-gray-600">y = x (Linear)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 bg-[#34c759] rounded-full"></span> 
                            <span className="text-sm font-medium text-gray-600">y = x² (Polynomial)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 bg-[#ff3b30] rounded-full"></span> 
                            <span className="text-sm font-medium text-gray-600">y = 2ˣ (Exponential)</span>
                        </div>
                    </div>
                     <p className="text-xs text-[#86868b] leading-relaxed">
                        指数関数の爆発的な増加を確認しましょう。対数スケールにすると、指数関数は直線になります。
                    </p>
                </div>
            </div>
            
            <div className="w-full md:w-2/3 bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100/50 p-1 flex justify-center items-center overflow-hidden relative min-h-[400px]">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>
                <canvas ref={canvasRef} width={800} height={500} className="w-full h-auto max-w-full z-10" />
            </div>
        </main>
    </div>
  );
}
