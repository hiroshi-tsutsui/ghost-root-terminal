"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function ComplexPage() {
  const [re1, setRe1] = useState(1);
  const [im1, setIm1] = useState(0);
  const [re2, setRe2] = useState(0);
  const [im2, setIm2] = useState(1); // i
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const scale = 50; // 50px = 1 unit

    ctx.clearRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += scale) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let i = 0; i < height; i += scale) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
    ctx.stroke();

    // Helper: Draw Vector
    const drawVector = (re: number, im: number, color: string, label: string) => {
        const x = cx + re * scale;
        const y = cy - im * scale; // Invert Y
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '16px sans-serif';
        ctx.fillText(label, x + 10, y - 10);
    };

    // Draw z1
    drawVector(re1, im1, '#0071e3', 'z1');
    
    // Draw z2
    drawVector(re2, im2, '#34c759', 'z2');

    // Calculate Product z1 * z2
    // (a+bi)(c+di) = (ac-bd) + (ad+bc)i
    const pRe = re1 * re2 - im1 * im2;
    const pIm = re1 * im2 + im1 * re2;

    drawVector(pRe, pIm, '#ff3b30', 'z1 * z2');

    // Dashed lines for components? Optional.

  }, [re1, im1, re2, im2]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7]">
        <header className="bg-white/70 backdrop-blur-md border-b h-16 flex items-center px-6 fixed w-full z-10">
             <Link href="/" className="text-sm font-medium text-gray-500 hover:text-blue-600">← Home</Link>
             <h1 className="ml-4 font-bold text-gray-900">複素数平面 (Complex Plane)</h1>
        </header>
        <main className="pt-24 p-6 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                    <h2 className="text-lg font-bold mb-4">Inputs</h2>
                    
                    {/* z1 Controls */}
                    <div className="space-y-2">
                        <div className="flex justify-between font-mono text-sm">
                            <span className="text-blue-600 font-bold">z1 = {re1} + {im1}i</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <label className="w-8 text-xs font-bold text-gray-500">Re</label>
                            <input type="range" min="-5" max="5" step="0.5" value={re1} onChange={(e) => setRe1(parseFloat(e.target.value))} className="flex-1" />
                        </div>
                        <div className="flex gap-2 items-center">
                            <label className="w-8 text-xs font-bold text-gray-500">Im</label>
                            <input type="range" min="-5" max="5" step="0.5" value={im1} onChange={(e) => setIm1(parseFloat(e.target.value))} className="flex-1" />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* z2 Controls */}
                    <div className="space-y-2">
                        <div className="flex justify-between font-mono text-sm">
                            <span className="text-green-600 font-bold">z2 = {re2} + {im2}i</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <label className="w-8 text-xs font-bold text-gray-500">Re</label>
                            <input type="range" min="-5" max="5" step="0.5" value={re2} onChange={(e) => setRe2(parseFloat(e.target.value))} className="flex-1" />
                        </div>
                        <div className="flex gap-2 items-center">
                            <label className="w-8 text-xs font-bold text-gray-500">Im</label>
                            <input type="range" min="-5" max="5" step="0.5" value={im2} onChange={(e) => setIm2(parseFloat(e.target.value))} className="flex-1" />
                        </div>
                    </div>
                </div>
                 <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800">
                    <p className="font-bold mb-1">Rotation via Multiplication</p>
                    <p>Multiplying by a complex number rotates and scales the original vector. Try setting z2 to `i` (0 + 1i) to rotate z1 by 90 degrees!</p>
                </div>
            </div>
            
            <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-sm p-4 flex justify-center items-center overflow-hidden">
                <canvas ref={canvasRef} width={600} height={600} className="w-full h-auto max-w-[600px] border border-gray-100 rounded-lg" />
            </div>
        </main>
    </div>
  );
}
