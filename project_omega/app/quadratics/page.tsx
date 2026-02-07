// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function QuadraticsPage() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  
  // Real World State
  const [isThrowMode, setIsThrowMode] = useState(false);
  const [throwTime, setThrowTime] = useState(0);
  
  // Sensei Mode State
  const [isSenseiMode, setIsSenseiMode] = useState(false);
  const [level, setLevel] = useState(1);
  const [lessonStep, setLessonStep] = useState(0);
  const [senseiMessage, setSenseiMessage] = useState("");
  const [taskCompleted, setTaskCompleted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Sensei Logic ---
  const LEVELS = {
    1: {
      title: "基本: グラフの開き方",
      steps: [
        { 
          message: "こんにちは！二次関数の基本を一緒に学びましょう。まずは `a` の値を `2` にしてみてください。", 
          check: () => a === 2 
        },
        { 
          message: "素晴らしい！グラフが細くなりましたね。`a` が大きくなると、開き具合が狭くなります。次は `a` を `-1` にしてみましょう。", 
          check: () => a === -1 
        },
        { 
          message: "その通り！マイナスになるとグラフが下向きになります。「上に凸（とつ）」と言います。レベル1クリア！次はレベル2へ進みましょう。", 
          check: () => true,
          isFinal: true
        }
      ]
    },
    2: {
      title: "応用: 上下の移動",
      steps: [
        { 
          message: "レベル2です！今度は `c` (y切片) を動かしてみましょう。`c` を `3` にしてみてください。", 
          check: () => c === 3 
        },
        { 
          message: "グラフ全体が上に `+3` ズレましたね！これが `c` の役割です。では、`c` を `-2` に下げてみましょう。", 
          check: () => c === -2 
        },
        { 
          message: "完璧です！`c` はグラフを上下に平行移動させます。レベル2クリア！", 
          check: () => true,
          isFinal: true
        }
      ]
    },
    3: {
      title: "発展: 軸の移動",
      steps: [
        { 
          message: "レベル3、最終段階です。`b` を動かすとどうなるでしょう？`b` を `2` に、`a` を `1` に戻してみてください。", 
          check: () => b === 2 && a === 1
        },
        { 
            message: "少し複雑ですね。頂点が左にズレました。頂点のx座標は `-b / 2a` で決まります。これを体感できましたね！全レベルクリアおめでとうございます！",
            check: () => true,
            isFinal: true
        }
      ]
    }
  };

  useEffect(() => {
    if (!isSenseiMode) return;
    const currentLevelData = LEVELS[level];
    if (!currentLevelData) return;
    const currentStepData = currentLevelData.steps[lessonStep];
    if (!currentStepData) return;
    setSenseiMessage(currentStepData.message);
    if (currentStepData.check()) {
        if (!taskCompleted) setTaskCompleted(true);
    } else {
        setTaskCompleted(false);
    }
  }, [a, b, c, isSenseiMode, level, lessonStep]);

  const advanceLesson = () => {
      const currentLevelData = LEVELS[level];
      const currentStepData = currentLevelData.steps[lessonStep];
      if (currentStepData.isFinal) {
          if (LEVELS[level + 1]) {
              setLevel(level + 1);
              setLessonStep(0);
              setA(1); setB(0); setC(0); 
          } else {
              setSenseiMessage("すべてのレッスンを完了しました！自由に実験してみてください。");
              setIsSenseiMode(false);
          }
      } else {
          setLessonStep(lessonStep + 1);
      }
      setTaskCompleted(false);
  };

  // --- Throw Animation Loop ---
  useEffect(() => {
      if (!isThrowMode) return;
      let animId: number;
      
      const animate = () => {
          setThrowTime(prev => {
              if (prev > 10) return 0; // Reset after 10s (arbitrary scale)
              return prev + 0.1;
          });
          animId = requestAnimationFrame(animate);
      };
      animId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animId);
  }, [isThrowMode]);

  // --- Drawing Logic ---
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
    const scale = 30; 

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

    if (isThrowMode) {
        // Draw Ground
        ctx.fillStyle = '#e5e5e7';
        ctx.fillRect(0, centerY, width, height/2);
        
        // Physics: y = v0*t - 0.5*g*t^2 + h0
        // Let's map x to time for trail, or just animate a ball?
        // Let's visualize y = ax^2 + bx + c as a trajectory
        // x = time. y = height.
        // Assuming user sets parameters to model a throw.
        // Usually a < 0 for gravity.
        
        // Let's draw the character throwing
        const startX = centerX; // t=0
        const startY = centerY - c * scale; // h0
        
        ctx.font = '24px serif';
        ctx.fillText('🏃', startX - 20, startY);

        // Draw Ball at current time t (mapped to x)
        // Let's say x-axis is distance/time.
        // x = t. 
        const t = throwTime; 
        // For visualization, we use the graph parameters directly.
        // y = ax^2 + bx + c.
        // If x is time, we scan from x=0 to ...
        
        // Draw ball at current x
        // We map `throwTime` (which goes 0->10) to x-axis
        // CenterX is x=0. 
        
        // To make it look like a throw, let's say the throw starts at x=0 (center)
        // and goes to positive x.
        const currentX = throwTime; // 0 to 10
        const currentY = a * currentX * currentX + b * currentX + c;
        
        const plotX = centerX + currentX * scale;
        const plotY = centerY - currentY * scale;

        // Draw ball
        if (plotY < height + 20) { // Don't draw if way below ground
            ctx.fillStyle = '#ff3b30';
            ctx.beginPath();
            ctx.arc(plotX, plotY, 8, 0, Math.PI * 2);
            ctx.fill();
        }

    } else {
        // Standard Graph Mode
         // Completing Square Visualizer (Square area)
        if (a > 0) { 
            const p = -b / (2 * a);
            const q = -(b * b - 4 * a * c) / (4 * a);
            ctx.strokeStyle = '#34c759'; 
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(centerX + p * scale, 0);
            ctx.lineTo(centerX + p * scale, height);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.strokeStyle = '#ff3b30'; 
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, centerY - q * scale);
            ctx.lineTo(width, centerY - q * scale);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

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
      
      // Optimization: Don't draw if wildly out of bounds
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

    // Vertex point (only in standard mode)
    if (!isThrowMode && a !== 0) {
        const vx = -b / (2 * a);
        const vy = a * vx * vx + b * vx + c;
        const pVx = centerX + vx * scale;
        const pVy = centerY - (vy * scale);
        
        ctx.fillStyle = 'rgba(255, 59, 48, 0.2)';
        ctx.beginPath();
        ctx.arc(pVx, pVy, 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ff3b30';
        ctx.beginPath();
        ctx.arc(pVx, pVy, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(pVx, pVy, 2.5, 0, 2 * Math.PI);
        ctx.fill();
    }

  }, [a, b, c, isThrowMode, throwTime]);

  const vertexX = a !== 0 ? -b / (2 * a) : 0;
  const vertexY = a * vertexX * vertexX + b * vertexX + c;
  const p = -b / (2 * a);
  const q = c - (b * b) / (4 * a);
  const pStr = p >= 0 ? `- ${p.toFixed(2)}` : `+ ${Math.abs(p).toFixed(2)}`;
  const qStr = q >= 0 ? `+ ${q.toFixed(2)}` : `- ${Math.abs(q).toFixed(2)}`;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans">
       <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 h-16 flex items-center px-6 transition-all supports-[backdrop-filter]:bg-white/60">
         <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <Link href="/" className="group flex items-center text-sm font-medium text-[#86868b] hover:text-[#0071e3] transition-colors">
                <span className="inline-block transition-transform group-hover:-translate-x-1 mr-1">←</span> ホーム
                </Link>
                <div className="h-4 w-px bg-gray-300"></div>
                <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">二次関数 <span className="text-[#86868b] font-normal ml-2 text-sm">数学I / グラフと性質</span></h1>
             </div>
             
             <div className="flex items-center gap-3">
                 <button 
                    onClick={() => {
                        setIsThrowMode(!isThrowMode);
                        if (!isThrowMode) {
                            // Set suitable gravity/throw params
                            setA(-0.5); setB(2); setC(1);
                            setThrowTime(0);
                        } else {
                            setA(1); setB(0); setC(0);
                        }
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        isThrowMode
                        ? 'bg-orange-500 text-white shadow-lg' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                 >
                    {isThrowMode ? '🏀 Throw Mode ON' : '🏀 Throw Mode'}
                 </button>

                 <button 
                    onClick={() => {
                        setIsSenseiMode(!isSenseiMode);
                        if (!isSenseiMode) {
                            setA(1); setB(0); setC(0);
                            setLevel(1);
                            setLessonStep(0);
                            setIsThrowMode(false);
                        }
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        isSenseiMode 
                        ? 'bg-blue-600 text-white shadow-lg scale-105' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                 >
                    {isSenseiMode ? '🎓 Sensei Mode ON' : '🎓 Sensei Mode OFF'}
                 </button>
             </div>
         </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 pt-24">
        
        {/* Sensei Message Box */}
        {isSenseiMode && (
            <div className="mb-8 p-6 bg-white border-l-4 border-blue-500 rounded-r-xl shadow-md animate-fade-in flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-2xl">👨‍🏫</div>
                    <div>
                        <h3 className="font-bold text-blue-600 text-sm uppercase tracking-wide mb-1">
                            Level {level}: {LEVELS[level]?.title}
                        </h3>
                        <p className="text-gray-800 font-medium text-lg leading-relaxed">
                            {senseiMessage}
                        </p>
                    </div>
                </div>
                {taskCompleted && (
                    <button 
                        onClick={advanceLesson}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-md transition-all animate-bounce"
                    >
                        次へ進む →
                    </button>
                )}
            </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Controls Panel */}
        <div className="w-full lg:w-1/3 space-y-6">
            <div className={`apple-card p-6 fade-in-up delay-100 transition-opacity ${isSenseiMode && level === 1 && 'ring-2 ring-blue-500'}`}>
                <div className="mb-8 p-6 bg-[#F5F5F7] rounded-2xl text-center border border-black/[0.03] space-y-4">
                    <p className="font-mono text-xl font-bold text-[#1d1d1f] tracking-wider">
                    y = <span className="text-[#0071e3]">{a === 0 ? '' : `${a}x²`}</span> {b >= 0 ? '+' : ''} <span className="text-[#34c759]">{b}x</span> {c >= 0 ? '+' : ''} <span className="text-[#ff3b30]">{c}</span>
                    </p>
                    {a !== 0 && !isThrowMode && (
                        <div className="pt-4 border-t border-gray-200">
                             <p className="text-xs text-[#86868b] uppercase tracking-wide mb-1">平方完成 (Vertex Form)</p>
                             <p className="font-mono text-lg font-bold text-[#86868b]">
                                y = {a}(x {pStr})² {qStr}
                             </p>
                        </div>
                    )}
                     {isThrowMode && (
                        <div className="pt-4 border-t border-orange-200">
                             <p className="text-xs text-orange-600 uppercase tracking-wide mb-1">物理モデル</p>
                             <p className="text-xs text-gray-500">
                                a: 重力加速度 (Gravity)<br/>
                                b: 初速度 (Initial Velocity)<br/>
                                c: 初期高さ (Initial Height)
                             </p>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    <div className={`space-y-3 transition-opacity ${isSenseiMode && level !== 1 && level !== 3 && 'opacity-50 pointer-events-none'}`}>
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

                    <div className={`space-y-3 transition-opacity ${isSenseiMode && level !== 3 && 'opacity-50 pointer-events-none'}`}>
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

                    <div className={`space-y-3 transition-opacity ${isSenseiMode && level !== 2 && 'opacity-50 pointer-events-none'}`}>
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
