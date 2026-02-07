// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import BallsInBins from '../components/BallsInBins';

export default function ProbabilityPage() {
  const [mean, setMean] = useState(0);
  const [stdDev, setStdDev] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const normal = (x: number, mean: number, stdDev: number) => {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const scaleX = 40;
    const scaleY = 200;
    const centerX = width / 2;
    const centerY = height - 50;

    // Grid
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += scaleX) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); // X
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); // Y
    ctx.stroke();

    // Fill area within 1 std dev
    ctx.fillStyle = 'rgba(147, 51, 234, 0.15)';
    ctx.beginPath();
    
    const range = 5;
    const startX = -range * 2;
    const endX = range * 2;
    const step = 0.05;

    const x1 = mean - stdDev;
    const x2 = mean + stdDev;
    
    ctx.moveTo(centerX + x1 * scaleX, centerY);
    for (let x = x1; x <= x2; x += step) {
        const y = normal(x, mean, stdDev);
        const px = centerX + x * scaleX;
        const py = centerY - y * scaleY;
        ctx.lineTo(px, py);
    }
    ctx.lineTo(centerX + x2 * scaleX, centerY);
    ctx.closePath();
    ctx.fill();

    // Plot Normal Distribution
    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    for (let x = startX; x <= endX; x += step) {
      const y = normal(x, mean, stdDev);
      const px = centerX + x * scaleX;
      const py = centerY - y * scaleY;
      
      if (x === startX) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter';
    ctx.fillText('μ', centerX + mean * scaleX - 3, centerY + 15);
    ctx.fillText('μ+σ', centerX + (mean + stdDev) * scaleX - 10, centerY + 15);
    ctx.fillText('μ-σ', centerX + (mean - stdDev) * scaleX - 10, centerY + 15);

  }, [mean, stdDev]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
       <header className="p-4 bg-white border-b shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <div>
             <Link href="/" className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors mb-1 block">← ホームに戻る</Link>
             <h1 className="text-lg font-bold tracking-tight">確率・統計 <span className="text-gray-400 font-normal ml-2">数学B / データの分析</span></h1>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-8">
        
        {/* Normal Distribution Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
             <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 space-y-6">
                    <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                        <h3 className="font-bold text-purple-900 text-lg mb-2">正規分布</h3>
                        <p className="font-mono text-xs text-purple-700 leading-relaxed">f(x) = <span className="text-lg">frac(1, σ√(2π))</span> e^(-(x-μ)²/2σ²)</p>
                        <p className="text-xs text-purple-600 mt-2">自然界の多くの現象（身長、誤差など）に現れる分布。</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-semibold text-gray-700">平均 (μ)</label>
                                <span className="font-mono text-sm font-bold text-purple-600">{mean.toFixed(1)}</span>
                            </div>
                            <input 
                            type="range" min="-3" max="3" step="0.1" 
                            value={mean} onChange={(e) => setMean(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-semibold text-gray-700">標準偏差 (σ)</label>
                                <span className="font-mono text-sm font-bold text-green-600">{stdDev.toFixed(1)}</span>
                            </div>
                            <input 
                            type="range" min="0.5" max="3" step="0.1" 
                            value={stdDev} onChange={(e) => setStdDev(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm space-y-2">
                        <h3 className="font-bold text-gray-900 mb-2">性質</h3>
                        <p className="text-gray-600"><strong className="text-gray-900">68% ルール:</strong> 網掛け部分 (±1σ) には全データの約68%が含まれます。</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200">
                            <div><span className="text-xs text-gray-500 block">中心</span><span className="font-medium">{mean}</span></div>
                            <div><span className="text-xs text-gray-500 block">広がり</span><span className="font-medium">{stdDev}</span></div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-2/3 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <canvas ref={canvasRef} width={600} height={400} className="w-full h-auto" />
                </div>
            </div>
        </section>

        {/* Balls in Bins Section */}
        <section>
            <BallsInBins />
        </section>

      </main>
    </div>
  );
}
