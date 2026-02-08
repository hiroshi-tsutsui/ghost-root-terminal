// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import BallsInBins from '../components/BallsInBins';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProbabilityPage() {
  const [mean, setMean] = useState(0);
  const [stdDev, setStdDev] = useState(1);
  const [senseiMode, setSenseiMode] = useState(false);
  const [lessonStep, setLessonStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const normal = (x: number, mean: number, stdDev: number) => {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  };

  // Sensei Logic
  useEffect(() => {
    if (!senseiMode) return;

    if (lessonStep === 1) {
        // Mean Lesson: Set Mean to 2.0
        if (Math.abs(mean - 2.0) < 0.1) {
             setShowConfetti(true);
             setTimeout(() => { setShowConfetti(false); setLessonStep(2); }, 2000);
        }
    } else if (lessonStep === 2) {
        // Std Dev Lesson: Set Std Dev to 0.5 (Narrow)
        if (Math.abs(stdDev - 0.5) < 0.1) {
             setShowConfetti(true);
             setTimeout(() => { setShowConfetti(false); setLessonStep(3); }, 2000);
        }
    }
  }, [mean, stdDev, lessonStep, senseiMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const scaleX = 50;
    const scaleY = 250;
    const centerX = width / 2;
    const centerY = height - 40;

    // Grid
    ctx.strokeStyle = '#f5f5f7';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += scaleX) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#d1d1d6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); // X
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); // Y
    ctx.stroke();

    // Fill area within 1 std dev - Apple Purple/Blue mix
    ctx.fillStyle = 'rgba(175, 82, 222, 0.15)'; // Apple Purple
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
    ctx.strokeStyle = '#af52de'; // Apple Purple
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
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
    ctx.fillStyle = '#86868b';
    ctx.font = '500 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('μ', centerX + mean * scaleX, centerY + 20);
    ctx.fillText('μ+σ', centerX + (mean + stdDev) * scaleX, centerY + 20);
    ctx.fillText('μ-σ', centerX + (mean - stdDev) * scaleX, centerY + 20);

  }, [mean, stdDev]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans">
       <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 h-16 flex items-center px-6 transition-all supports-[backdrop-filter]:bg-white/60">
         <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <Link href="/" className="group flex items-center text-sm font-medium text-[#86868b] hover:text-[#0071e3] transition-colors">
                <span className="inline-block transition-transform group-hover:-translate-x-1 mr-1">←</span> ホーム
                </Link>
                <div className="h-4 w-px bg-gray-300"></div>
                <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">確率・統計 <span className="text-[#86868b] font-normal ml-2 text-sm">数学B / データの分析</span></h1>
             </div>
             <button 
                onClick={() => { setSenseiMode(!senseiMode); setLessonStep(0); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${senseiMode ? 'bg-[#af52de] text-white' : 'bg-gray-200 text-gray-500'}`}
             >
                {senseiMode ? 'Sensei ON' : 'Sensei OFF'}
             </button>
         </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 pt-24 space-y-8 relative">
        {showConfetti && (
             <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center h-screen">
                 <div className="text-6xl animate-bounce">🎉</div>
             </div>
        )}

        {/* Normal Distribution Section */}
        <section className="apple-card p-0 overflow-hidden fade-in-up delay-100 relative">
             <div className="flex flex-col md:flex-row">
                {/* Controls Side */}
                <div className="w-full md:w-1/3 p-8 bg-white border-r border-gray-100/50 flex flex-col justify-center relative">
                    
                    {/* Sensei Overlay Panel */}
                    <AnimatePresence>
                        {senseiMode && (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 p-8 flex flex-col justify-center border-r border-[#af52de]/30"
                            >
                                <div className="absolute top-4 right-4 text-2xl">🎓</div>
                                <h3 className="text-xl font-bold text-[#af52de] mb-4">Sensei Mode</h3>
                                
                                {lessonStep === 0 && (
                                    <div>
                                        <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                                            正規分布の「形」を決める2つの要素、<br/>
                                            <span className="font-bold">平均 (μ)</span> と <span className="font-bold">標準偏差 (σ)</span> をマスターしましょう。
                                        </p>
                                        <button onClick={() => setLessonStep(1)} className="btn-apple-primary w-full bg-[#af52de] hover:bg-[#9f45d1]">レッスン開始</button>
                                    </div>
                                )}
                                {lessonStep === 1 && (
                                    <div>
                                        <p className="text-sm font-bold mb-2">Step 1: 平均 (Center)</p>
                                        <p className="text-xs text-gray-600 mb-6">
                                            平均値 (μ) は「山の中心」です。<br/>
                                            スライダーを動かして、平均を <span className="font-bold text-[#af52de]">2.0</span> に移動させてください。
                                        </p>
                                        <div className="text-xs bg-gray-100 p-2 rounded mb-4">現在の平均: {mean.toFixed(1)}</div>
                                    </div>
                                )}
                                {lessonStep === 2 && (
                                    <div>
                                        <p className="text-sm font-bold mb-2">Step 2: 標準偏差 (Spread)</p>
                                        <p className="text-xs text-gray-600 mb-6">
                                            Good! 山が移動しましたね。<br/>
                                            次は標準偏差 (σ) です。これは「バラつき」を表します。<br/>
                                            標準偏差を <span className="font-bold text-[#34c759]">0.5</span> にして、山を鋭くしてください。
                                        </p>
                                        <div className="text-xs bg-gray-100 p-2 rounded mb-4">現在の偏差: {stdDev.toFixed(1)}</div>
                                    </div>
                                )}
                                {lessonStep === 3 && (
                                    <div>
                                        <p className="text-sm font-bold mb-2">Mastered! 🎓</p>
                                        <p className="text-xs text-gray-600 mb-6">
                                            完璧です！<br/>
                                            標準偏差が小さいほど、データは平均付近に集中します。<br/>
                                            これが偏差値や品質管理の基礎になります。
                                        </p>
                                        <button onClick={() => setSenseiMode(false)} className="btn-apple-secondary w-full text-xs">自由モードに戻る</button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                             <span className="w-10 h-10 rounded-xl bg-[#af52de]/10 flex items-center justify-center text-xl">📊</span>
                             <h3 className="font-bold text-[#1d1d1f] text-xl">正規分布</h3>
                        </div>
                        <p className="text-sm text-[#86868b] leading-relaxed">
                            自然界の多くの現象（身長、誤差など）に現れる分布。平均値(μ)と標準偏差(σ)で形状が決まります。
                        </p>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wide">平均 (μ)</label>
                                <span className="font-mono text-lg font-bold text-[#af52de]">{mean.toFixed(1)}</span>
                            </div>
                            <input 
                            type="range" min="-3" max="3" step="0.1" 
                            value={mean} onChange={(e) => setMean(parseFloat(e.target.value))}
                            className="w-full accent-[#af52de]"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wide">標準偏差 (σ)</label>
                                <span className="font-mono text-lg font-bold text-[#34c759]">{stdDev.toFixed(1)}</span>
                            </div>
                            <input 
                            type="range" min="0.5" max="3" step="0.1" 
                            value={stdDev} onChange={(e) => setStdDev(parseFloat(e.target.value))}
                            className="w-full accent-[#34c759]"
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-[#1d1d1f] mb-2">68% ルール</h4>
                        <p className="text-xs text-[#86868b]">
                            <span className="w-2 h-2 rounded-full bg-[#af52de] inline-block mr-1"></span>
                            網掛け部分 (±1σ) には全データの約68%が含まれます。
                        </p>
                    </div>
                </div>

                {/* Canvas Side */}
                <div className="w-full md:w-2/3 bg-[#F5F5F7] relative flex items-center justify-center p-8 min-h-[400px]">
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none"></div>
                    <canvas ref={canvasRef} width={600} height={400} className="w-full h-auto max-w-[600px] z-10" />
                </div>
            </div>
        </section>

        {/* Balls in Bins Section */}
        <section className={`fade-in-up delay-200 ${senseiMode ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
            <BallsInBins />
        </section>

      </main>
    </div>
  );
}
