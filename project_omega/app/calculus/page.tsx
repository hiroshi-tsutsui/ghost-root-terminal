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

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const scale = 50; // Zoomed in a bit more
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

    // Area (Integral) - Apple Blue with opacity
    ctx.fillStyle = 'rgba(0, 113, 227, 0.15)';
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
    const finalY = evaluateFunc(funcStr, xVal);
    ctx.lineTo(centerX + xVal * scale, centerY - finalY * scale); // Connect to curve point
    ctx.lineTo(centerX + xVal * scale, centerY); // Drop to axis
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    // Function Curve - Apple Blue
    ctx.strokeStyle = '#0071e3';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
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

    // Tangent Line - Apple Red
    const yVal = evaluateFunc(funcStr, xVal);
    const slope = evaluateDerivative(funcStr, xVal);
    const tangentLength = 3;
    const xStart = xVal - tangentLength;
    const xEnd = xVal + tangentLength;
    const yStart = slope * (xStart - xVal) + yVal;
    const yEnd = slope * (xEnd - xVal) + yVal;
    const pXStart = centerX + xStart * scale;
    const pYStart = centerY - yStart * scale;
    const pXEnd = centerX + xEnd * scale;
    const pYEnd = centerY - yEnd * scale;

    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(pXStart, pYStart);
    ctx.lineTo(pXEnd, pYEnd);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tangent Point Pulse
    const pX = centerX + xVal * scale;
    const pY = centerY - yVal * scale;
    
    // Outer halo
    ctx.fillStyle = 'rgba(255, 59, 48, 0.2)';
    ctx.beginPath();
    ctx.arc(pX, pY, 14, 0, 2 * Math.PI);
    ctx.fill();

    // Inner dot
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath();
    ctx.arc(pX, pY, 7, 0, 2 * Math.PI);
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
    <div className="flex flex-col md:flex-row h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans overflow-hidden">
      
       {/* Sidebar */}
       <div className="w-full md:w-[400px] flex flex-col border-r border-white/20 bg-white/70 backdrop-blur-xl z-10 h-1/2 md:h-full overflow-y-auto shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <header className="p-6 pb-4 border-b border-gray-200/50 sticky top-0 bg-white/50 backdrop-blur-md z-20">
            <Link href="/" className="group flex items-center text-sm font-medium text-[#86868b] hover:text-[#0071e3] transition-colors mb-3">
              <span className="inline-block transition-transform group-hover:-translate-x-1 mr-1">←</span> ホームに戻る
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">微分積分</h1>
            <p className="text-[#86868b] text-sm mt-1 font-medium">数学III / 極限と関数</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
           
           {/* Function Input */}
           <div className="apple-card p-5 fade-in-up delay-100">
             <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-3 block">関数 f(x)</label>
             <div className="relative mb-4">
                <input 
                    type="text" 
                    value={funcStr} 
                    onChange={(e) => setFuncStr(e.target.value)}
                    className="input-apple text-lg font-mono tracking-wide"
                    placeholder="e.g. sin(x) + x^2"
                />
             </div>
             {error && <p className="text-[#ff3b30] text-xs flex items-center mb-3">⚠️ {error}</p>}
             
             <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                    <button 
                        key={p.label}
                        onClick={() => setFuncStr(p.val)}
                        className="px-3 py-1.5 text-[11px] font-medium bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] rounded-full transition-colors active:scale-95"
                    >
                        {p.label}
                    </button>
                ))}
             </div>
           </div>

           {/* Slider Control */}
           <div className="apple-card p-5 fade-in-up delay-200">
             <div className="flex justify-between items-end mb-4">
                <label className="text-sm font-semibold text-[#1d1d1f]">x の値</label>
                <span className="font-mono text-xl font-bold text-[#0071e3]">{xVal.toFixed(2)}</span>
             </div>
             <input 
               type="range" min="-4" max="4" step="0.01" 
               value={xVal} onChange={(e) => setXVal(parseFloat(e.target.value))}
               className="w-full"
             />
             <div className="flex justify-between text-[10px] text-[#86868b] font-mono mt-2">
                <span>-4.0</span>
                <span>0.0</span>
                <span>4.0</span>
             </div>
           </div>

           {/* Analysis Panel */}
           <div className="apple-card p-5 space-y-4 fade-in-up delay-300">
             <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider border-b border-gray-100 pb-3">x = {xVal.toFixed(2)} における解析</h3>
             
             <div className="flex justify-between items-center group">
                <span className="text-sm text-[#1d1d1f] font-medium">値 f(x)</span>
                <span className="font-mono text-base text-[#1d1d1f]">{isNaN(currentY) ? '-' : currentY.toFixed(3)}</span>
             </div>
             
             <div className="flex justify-between items-center group">
                <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-[#ff3b30] mr-2 shadow-sm group-hover:scale-125 transition-transform"></span>
                    <span className="text-sm text-[#1d1d1f] font-medium">傾き (微分)</span>
                </div>
                <span className="font-mono text-base text-[#ff3b30]">{isNaN(currentSlope) ? '-' : currentSlope.toFixed(3)}</span>
             </div>

             <div className="flex justify-between items-center group">
                <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-[#0071e3] mr-2 shadow-sm group-hover:scale-125 transition-transform"></span>
                    <span className="text-sm text-[#1d1d1f] font-medium">面積 (積分 0→x)</span>
                </div>
                <span className="font-mono text-base text-[#0071e3]">{isNaN(currentIntegral) ? '-' : currentIntegral.toFixed(3)}</span>
             </div>
           </div>
           
           <div className="p-4 bg-[#0071e3]/5 rounded-2xl border border-[#0071e3]/10 text-xs text-[#1d1d1f] space-y-2 fade-in-up delay-300">
             <p className="flex items-start"><span className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-1.5 mr-2 flex-shrink-0"></span><span><span className="font-semibold">赤色の破線</span> は接線を表し、その傾きが微分係数です。</span></p>
             <p className="flex items-start"><span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] mt-1.5 mr-2 flex-shrink-0"></span><span><span className="font-semibold">青色の領域</span> は、原点からxまでの定積分（符号付き面積）を表します。</span></p>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center bg-[#F5F5F7] p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
        <div className="apple-card p-2 shadow-2xl z-10 bg-white">
           <canvas ref={canvasRef} width={800} height={600} className="rounded-xl w-full h-auto max-h-[85vh] object-contain bg-white" />
        </div>
      </div>
    </div>
  );
}
