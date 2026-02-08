// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function QuadraticsPage() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  
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
      title: "基礎 (Basics): グラフの開き方",
      steps: [
        {
          message: "【ミッション: アーチェリーの軌道計算】\nあなたはアーチェリーの選手です。弓の強さを調整して、矢の軌道をコントロールします。係数 `a` は弓の強さ（グラフの開き具合）を表しています。\n\n「ミッション開始」で調整を始めます。",
          check: () => true,
          isBriefing: true
        },
        { 
          message: "まずは弓を強く引いてみましょう。`a` の値を `2` にしてみてください。矢の勢いが増し、軌道が鋭くなります。", 
          check: () => a === 2 
        },
        { 
          message: "素晴らしい！グラフが細くなりましたね。次は逆向きの力を加えてみましょう。`a` を `-1` に設定してください。", 
          check: () => a === -1 
        },
        { 
          message: "その通り！マイナスになるとグラフが下向きになります。「上に凸（とつ）」と言います。レベル1クリア！", 
          check: () => true,
          isFinal: true
        }
      ]
    },
    2: {
      title: "標準 (Standard): 上下の移動",
      steps: [
        {
          message: "【ミッション: 標高差の補正】\nターゲットが高台に設置されました。発射位置の高さ `c` (y切片) を調整して、ターゲットに狙いを定めます。\n\n「ミッション開始」で補正を開始します。",
          check: () => true,
          isBriefing: true
        },
        { 
          message: "ターゲットが高い位置にあります。`c` を `3` に設定して、発射位置を上げてください。", 
          check: () => c === 3 
        },
        { 
          message: "グラフ全体が上に `+3` ズレましたね！今度はターゲットが谷底に移動しました。`c` を `-2` に下げてください。", 
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
      title: "応用 (Application): 軸の移動",
      steps: [
        {
          message: "【ミッション: 横風への対応】\n横風が吹いています。係数 `b` を調整して、矢の左右のズレを修正する必要があります。これは少し複雑な操作です。\n\n「ミッション開始」で風読みを開始します。",
          check: () => true,
          isBriefing: true
        },
        { 
          message: "風が右から吹いています。`b` を `2` に、`a` を `1` に戻して、着弾点を左にずらしてください。", 
          check: () => b === 2 && a === 1
        },
        { 
            message: "軌道修正完了！頂点が左にズレました。頂点のx座標は `-b / 2a` で決まります。全ミッション完了です！おめでとうございます！",
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

    // Check condition
    if (currentStepData.check()) {
        if (!taskCompleted) {
             setTaskCompleted(true);
        }
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
              setA(1); setB(0); setC(0); // Reset for new level
          } else {
              // Game Over / Win
              setSenseiMessage("すべてのレッスンを完了しました！自由に実験してみてください。");
              setIsSenseiMode(false);
          }
      } else {
          setLessonStep(lessonStep + 1);
      }
      setTaskCompleted(false);
  };


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

  const currentStepIsBriefing = LEVELS[level]?.steps[lessonStep]?.isBriefing;

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
             
             {/* Sensei Mode Toggle */}
             <button 
                onClick={() => {
                    setIsSenseiMode(!isSenseiMode);
                    if (!isSenseiMode) {
                        setA(1); setB(0); setC(0);
                        setLevel(1);
                        setLessonStep(0);
                    }
                }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    isSenseiMode 
                    ? 'bg-blue-600 text-white shadow-lg scale-105' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
             >
                {isSenseiMode ? '🎓 Sensei Mode ON' : '🎓 Sensei Mode OFF'}
             </button>
         </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 pt-24">
        
        {/* Sensei Message Box */}
        {isSenseiMode && (
            <div className={`mb-8 p-6 bg-white border-l-4 rounded-r-xl shadow-md animate-fade-in flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${currentStepIsBriefing ? 'border-indigo-500 bg-indigo-50' : 'border-blue-500 bg-white'}`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full text-2xl ${currentStepIsBriefing ? 'bg-indigo-100' : 'bg-blue-100'}`}>
                        {currentStepIsBriefing ? '🚀' : '👨‍🏫'}
                    </div>
                    <div>
                        <h3 className={`font-bold text-sm uppercase tracking-wide mb-1 ${currentStepIsBriefing ? 'text-indigo-600' : 'text-blue-600'}`}>
                            Level {level}: {LEVELS[level]?.title}
                        </h3>
                        <p className="text-gray-800 font-medium text-lg leading-relaxed whitespace-pre-wrap">
                            {senseiMessage}
                        </p>
                    </div>
                </div>
                {taskCompleted && (
                    <button 
                        onClick={advanceLesson}
                        className={`px-6 py-3 text-white font-bold rounded-lg shadow-md transition-all animate-bounce ${
                            currentStepIsBriefing 
                            ? 'bg-indigo-500 hover:bg-indigo-600' 
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                    >
                        {currentStepIsBriefing ? 'ミッション開始 →' : '次へ進む →'}
                    </button>
                )}
            </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Controls Panel */}
        <div className="w-full lg:w-1/3 space-y-6">
            <div className={`apple-card p-6 fade-in-up delay-100 transition-opacity ${isSenseiMode && level === 1 && 'ring-2 ring-blue-500'}`}>
                <div className="mb-8 p-6 bg-[#F5F5F7] rounded-2xl text-center border border-black/[0.03]">
                    <p className="font-mono text-xl font-bold text-[#1d1d1f] tracking-wider">
                    y = <span className="text-[#0071e3]">{a === 0 ? '' : `${a}x²`}</span> {b >= 0 ? '+' : ''} <span className="text-[#34c759]">{b}x</span> {c >= 0 ? '+' : ''} <span className="text-[#ff3b30]">{c}</span>
                    </p>
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
                            type="range" min="-5" max="5" step="1" 
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
                            type="range" min="-10" max="10" step="1" 
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
                            type="range" min="-10" max="10" step="1" 
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
