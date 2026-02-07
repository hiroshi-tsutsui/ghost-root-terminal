"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function SequencesPage() {
  const [n, setN] = useState(10); // Number of terms
  const [a, setA] = useState(1);  // Initial term
  const [d, setD] = useState(1);  // Common difference
  const [r, setR] = useState(1.5); // Common ratio
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Padding
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Calculate data
    const arithmeticData = [];
    const geometricData = [];
    for (let i = 0; i < n; i++) {
        arithmeticData.push(a + i * d);
        geometricData.push(a * Math.pow(r, i));
    }

    // Determine max Y for scaling
    const maxY = Math.max(...arithmeticData, ...geometricData, 10);
    
    // Draw Axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding); // Y axis
    ctx.lineTo(width - padding, height - padding); // X axis
    ctx.stroke();

    // Helper: Plot Line
    const plotLine = (data: number[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((val, i) => {
            const x = padding + (i / (n - 1)) * graphWidth;
            const y = (height - padding) - (val / maxY) * graphHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Draw dots
        ctx.fillStyle = color;
        data.forEach((val, i) => {
            const x = padding + (i / (n - 1)) * graphWidth;
            const y = (height - padding) - (val / maxY) * graphHeight;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    };

    plotLine(arithmeticData, '#0071e3'); // Blue
    plotLine(geometricData, '#34c759'); // Green

  }, [n, a, d, r]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7]">
        <header className="bg-white/70 backdrop-blur-md border-b h-16 flex items-center px-6 fixed w-full z-10">
             <Link href="/" className="text-sm font-medium text-gray-500 hover:text-blue-600">← Home</Link>
             <h1 className="ml-4 font-bold text-gray-900">数列 (Sequences)</h1>
        </header>
        <main className="pt-24 p-6 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                    <h2 className="text-lg font-bold mb-4">Parameters</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Start (a)</label>
                            <input type="number" value={a} onChange={(e) => setA(parseFloat(e.target.value))} className="w-full border rounded p-1" />
                        </div>
                        
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Arithmetic (+d)</label>
                            <div className="flex items-center gap-2">
                                <span>d:</span>
                                <input type="number" step="0.5" value={d} onChange={(e) => setD(parseFloat(e.target.value))} className="w-full border rounded p-1" />
                            </div>
                        </div>

                        <div className="p-3 bg-green-50 rounded-lg">
                            <label className="block text-xs font-bold text-green-600 uppercase mb-1">Geometric (×r)</label>
                             <div className="flex items-center gap-2">
                                <span>r:</span>
                                <input type="number" step="0.1" value={r} onChange={(e) => setR(parseFloat(e.target.value))} className="w-full border rounded p-1" />
                            </div>
                        </div>

                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Steps (n)</label>
                            <input type="range" min="5" max="50" value={n} onChange={(e) => setN(parseInt(e.target.value))} className="w-full" />
                            <div className="text-right text-sm text-gray-500">{n} terms</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-sm p-4 flex justify-center items-center">
                <canvas ref={canvasRef} width={800} height={500} className="w-full h-auto max-w-full" />
            </div>
        </main>
    </div>
  );
}
