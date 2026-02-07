// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import Link from 'next/link';

export default function CalculusPage() {
  const [xVal, setXVal] = useState(1);
  const [funcStr, setFuncStr] = useState("0.5*x^3 - 2*x");
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const evaluateFunc = (expression: string, x: number) => {
    try {
      return math.evaluate(expression, { x });
    } catch (e) {
      return NaN;
    }
  };

  const evaluateDerivative = (expression: string, x: number) => {
    try {
        const d = math.derivative(expression, 'x');
        return d.evaluate({ x });
    } catch (e) {
        const h = 0.001;
        return (evaluateFunc(expression, x + h) - evaluateFunc(expression, x - h)) / (2 * h);
    }
  };

  const integrate = (expression: string, end: number) => {
      const start = 0;
      const n = 100;
      const h = (end - start) / n;
      let sum = 0.5 * (evaluateFunc(expression, start) + evaluateFunc(expression, end));
      for (let i = 1; i < n; i++) {
          sum += evaluateFunc(expression, start + i * h);
      }
      return sum * h;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // We need to handle resizing properly for retina displays, but for now fixed width logic
    // Just ensure we use the display size for style and actual pixels for drawing if we wanted sharp text
    // Simpler here: just use width/height from attributes.

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const scale = 40;
    const centerX = width / 2;
    const centerY = height / 2;

    try {
        math.evaluate(funcStr, { x: 0 });
        setError(null);
    } catch (e) {
        setError("関数の構文エラー");
        return;
    }

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
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); 
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
    ctx.stroke();

    // Area (Integral)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const step = 0.05;
    const start = Math.min(0, xVal);
    const end = Math.max(0, xVal);
    for (let x = start; x <= end; x += step) {
        const y = evaluateFunc(funcStr, x);
        const px = centerX + x * scale;
        const py = centerY - y * scale;
        ctx.lineTo(px, py);
    }
    ctx.lineTo(centerX + xVal * scale, centerY);
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    // Function
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let first = true;
    for (let pixelX = 0; pixelX < width; pixelX++) {
      const x = (pixelX - centerX) / scale;
      const y = evaluateFunc(funcStr, x);
      if (isNaN(y) || !isFinite(y)) {
          first = true;
          continue;
      }
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

    // Tangent Line
    const yVal = evaluateFunc(funcStr, xVal);
    const slope = evaluateDerivative(funcStr, xVal);
    const tangentLength = 4;
    const xStart = xVal - tangentLength;
    const xEnd = xVal + tangentLength;
    const yStart = slope * (xStart - xVal) + yVal;
    const yEnd = slope * (xEnd - xVal) + yVal;
    const pXStart = centerX + xStart * scale;
    const pYStart = centerY - yStart * scale;
    const pXEnd = centerX + xEnd * scale;
    const pYEnd = centerY - yEnd * scale;

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(pXStart, pYStart);
    ctx.lineTo(pXEnd, pYEnd);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tangent Point Pulse
    const pX = centerX + xVal * scale;
    const pY = centerY - yVal * scale;
    
    // Outer halo
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.beginPath();
    ctx.arc(pX, pY, 12, 0, 2 * Math.PI);
    ctx.fill();

    // Inner dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pX, pY, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Center white dot
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(pX, pY, 3, 0, 2 * Math.PI);
    ctx.fill();

  }, [xVal, funcStr]);

  const currentY = evaluateFunc(funcStr, xVal);
  const currentSlope = evaluateDerivative(funcStr, xVal);
  const currentIntegral = integrate(funcStr, xVal);

  const presets = [
    { label: "二次関数", val: "0.5*x^3 - 2*x" },
    { label: "サイン", val: "sin(x)" },
    { label: "コサイン", val: "cos(x)" },
    { label: "指数", val: "exp(x)" },
    { label: "対数", val: "log(x)" },
    { label: "タンジェント", val: "tan(x)" }
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
       <div className="w-full md:w-96 flex flex-col border-r bg-white shadow-sm z-10 h-1/2 md:h-full overflow-y-auto">
        <header className="p-6 border-b">
            <Link href="/" className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors mb-2 block">← ホームに戻る</Link>
            <h1 className="text-2xl font-bold tracking-tight">微分積分</h1>
            <p className="text-sm text-gray-500 mt-1">数学III / 極限と関数</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           
           <div className="space-y-4">
             <label className="text-sm font-semibold text-gray-900 block">関数 f(x)</label>
             <div className="relative">
                <input 
                    type="text" 
                    value={funcStr} 
                    onChange={(e) => setFuncStr(e.target.value)}
                    className="w-full rounded-lg border-gray-200 bg-gray-50 p-3 font-mono text-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g. sin(x) + x^2"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-400">f(x)=</span>
                </div>
             </div>
             {error && <p className="text-red-500 text-xs flex items-center">⚠️ {error}</p>}
             
             <div className="flex flex-wrap gap-2 mt-2">
                {presets.map((p) => (
                    <button 
                        key={p.label}
                        onClick={() => setFuncStr(p.val)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-200 transition-colors"
                    >
                        {p.label}
                    </button>
                ))}
             </div>
           </div>

           <div className="space-y-4">
             <div className="flex justify-between">
                <label className="text-sm font-semibold text-gray-900">x の値</label>
                <span className="font-mono text-sm font-bold text-blue-600">{xVal.toFixed(2)}</span>
             </div>
             <input 
               type="range" min="-4" max="4" step="0.01" 
               value={xVal} onChange={(e) => setXVal(parseFloat(e.target.value))}
               className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
             />
             <div className="flex justify-between text-xs text-gray-400 font-mono">
                <span>-4</span>
                <span>0</span>
                <span>4</span>
             </div>
           </div>

           <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">x = {xVal.toFixed(2)} における解析</h3>
             
             <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">値 f(x)</span>
                <span className="font-mono font-medium text-gray-900">{isNaN(currentY) ? '-' : currentY.toFixed(3)}</span>
             </div>
             
             <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    <span className="text-sm text-gray-600">傾き (微分)</span>
                </div>
                <span className="font-mono font-medium text-red-600">{isNaN(currentSlope) ? '-' : currentSlope.toFixed(3)}</span>
             </div>

             <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-100 border border-blue-300 mr-2"></span>
                    <span className="text-sm text-gray-600">面積 (積分 0→x)</span>
                </div>
                <span className="font-mono font-medium text-blue-600">{isNaN(currentIntegral) ? '-' : currentIntegral.toFixed(3)}</span>
             </div>
           </div>
           
           <div className="p-4 bg-blue-50 rounded-lg text-xs text-blue-800 space-y-1">
             <p>• <span className="font-bold">赤線</span> は接線を表し、その傾きが微分係数です。</p>
             <p>• <span className="font-bold">青色の領域</span> は、原点からxまでの定積分（符号付き面積）を表します。</p>
           </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-50/50 p-8 overflow-hidden">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2">
           <canvas ref={canvasRef} width={800} height={600} className="rounded-xl w-full h-auto max-h-[80vh] object-contain" />
        </div>
      </div>
    </div>
  );
}
