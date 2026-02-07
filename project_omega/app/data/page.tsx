// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// --- Data Types ---
type Point = { x: number; y: number };

export default function DataAnalysisPage() {
  // --- State ---
  const [points, setPoints] = useState<Point[]>([
    { x: 2, y: 3 }, { x: 3, y: 5 }, { x: 5, y: 4 }, { x: 7, y: 8 }, { x: 8, y: 9 }
  ]);
  const [showResiduals, setShowResiduals] = useState(false);
  const [targetR, setTargetR] = useState<number | null>(null); // For challenge mode
  
  // Lesson Mode
  const [lessonMode, setLessonMode] = useState<'explore' | 'basics' | 'leastSquares' | 'challenge'>('explore');
  const [message, setMessage] = useState("自由に点をプロットして、相関係数の変化を見てみましょう。");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Statistics Logic ---
  const calculateStats = (pts: Point[]) => {
    const n = pts.length;
    if (n < 2) return { r: 0, slope: 0, intercept: 0, xBar: 0, yBar: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    pts.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
      sumY2 += p.y * p.y;
    });

    const xBar = sumX / n;
    const yBar = sumY / n;

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    const r = denominator === 0 ? 0 : numerator / denominator;
    
    // Regression Line y = ax + b
    // a = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX)
    // b = yBar - a*xBar
    const slopeNum = n * sumXY - sumX * sumY;
    const slopeDenom = n * sumX2 - sumX * sumX;
    const slope = slopeDenom === 0 ? 0 : slopeNum / slopeDenom;
    const intercept = yBar - slope * xBar;

    return { r, slope, intercept, xBar, yBar };
  };

  const { r, slope, intercept, xBar, yBar } = calculateStats(points);

  // --- Interaction ---
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Convert to math coordinates (0-10 scale)
    // Canvas: 800x600. Center roughly at bottom left? Or standard chart?
    // Let's use standard chart: x: 0-10, y: 0-10
    // Margins: 50px
    const width = canvas.width;
    const height = canvas.height;
    const margin = 60;
    const plotW = width - 2 * margin;
    const plotH = height - 2 * margin;

    const mathX = (clickX - margin) / plotW * 10;
    const mathY = (height - margin - clickY) / plotH * 10;

    // Click tolerance for removal
    const tolerance = 0.5; 
    const existingIndex = points.findIndex(p => 
      Math.abs(p.x - mathX) < tolerance && Math.abs(p.y - mathY) < tolerance
    );

    if (existingIndex >= 0) {
      const newPoints = [...points];
      newPoints.splice(existingIndex, 1);
      setPoints(newPoints);
    } else {
        if (mathX >= 0 && mathX <= 10 && mathY >= 0 && mathY <= 10) {
            setPoints([...points, { x: mathX, y: mathY }]);
        }
    }
  };

  // --- Lesson Logic ---
  useEffect(() => {
    if (lessonMode === 'explore') {
        setMessage("自由に点をプロットして、相関係数の変化を見てみましょう。");
        setShowResiduals(false);
        setTargetR(null);
    } else if (lessonMode === 'basics') {
        setMessage("【基礎】相関係数 (Correlation) とは？\n点が一直線に並ぶと r = 1.0 (または -1.0) に近づきます。\nバラバラだと r = 0 になります。\n\n点を動かして、r = 0.9 以上を作ってみましょう。");
        setShowResiduals(false);
        setTargetR(0.9);
    } else if (lessonMode === 'leastSquares') {
        setMessage("【標準】最小二乗法 (Least Squares)\n赤い線は「回帰直線」です。\nこの線は、各点からの「誤差（赤線）」を最も小さくするように引かれています。\n\nトグルスイッチで誤差を表示中。");
        setShowResiduals(true);
        setTargetR(null);
    } else if (lessonMode === 'challenge') {
        setMessage("【チャレンジ】ターゲット: r = 0.7 ± 0.05\n点を追加・削除して、相関係数をちょうど 0.7 にしてください。");
        setShowResiduals(true);
        setTargetR(0.7);
    }
  }, [lessonMode]);

  useEffect(() => {
      if (lessonMode === 'basics' && r >= 0.9) {
          setMessage("素晴らしい！強い正の相関です。");
      }
      if (lessonMode === 'challenge' && targetR && Math.abs(r - targetR) <= 0.05) {
          setMessage("クリア！おめでとうございます！🎉");
      }
  }, [r, lessonMode, targetR]);


  // --- Drawing ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const margin = 60;
    const plotW = width - 2 * margin;
    const plotH = height - 2 * margin;

    // Helper: Math to Canvas
    const toCx = (x: number) => margin + (x / 10) * plotW;
    const toCy = (y: number) => height - margin - (y / 10) * plotH;

    ctx.clearRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        // Vertical
        ctx.beginPath(); ctx.moveTo(toCx(i), toCy(0)); ctx.lineTo(toCx(i), toCy(10)); ctx.stroke();
        // Horizontal
        ctx.beginPath(); ctx.moveTo(toCx(0), toCy(i)); ctx.lineTo(toCx(10), toCy(i)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#d1d1d6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toCx(0), toCy(0)); ctx.lineTo(toCx(10), toCy(0)); // X axis
    ctx.moveTo(toCx(0), toCy(0)); ctx.lineTo(toCx(0), toCy(10)); // Y axis
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#86868b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i+=2) {
        ctx.fillText(i.toString(), toCx(i), toCy(0) + 20);
        ctx.fillText(i.toString(), toCx(0) - 20, toCy(i) + 5);
    }

    // Regression Line
    if (points.length >= 2) {
        ctx.strokeStyle = '#0071e3'; // Apple Blue
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Calculate start and end within view (x=0 to 10)
        const yAt0 = intercept;
        const yAt10 = slope * 10 + intercept;
        ctx.moveTo(toCx(0), toCy(yAt0));
        ctx.lineTo(toCx(10), toCy(yAt10));
        ctx.stroke();
    }

    // Residuals (Errors)
    if (showResiduals && points.length >= 2) {
        ctx.strokeStyle = '#ff3b30'; // Apple Red
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        points.forEach(p => {
            const predictedY = slope * p.x + intercept;
            ctx.beginPath();
            ctx.moveTo(toCx(p.x), toCy(p.y));
            ctx.lineTo(toCx(p.x), toCy(predictedY));
            ctx.stroke();
        });
        ctx.setLineDash([]);
    }

    // Points
    points.forEach(p => {
        const cx = toCx(p.x);
        const cy = toCy(p.y);
        
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#34c759'; // Apple Green
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

  }, [points, showResiduals, r, slope, intercept]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans">
       <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 h-16 flex items-center px-6">
         <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <Link href="/" className="group flex items-center text-sm font-medium text-[#86868b] hover:text-[#0071e3] transition-colors">
                <span className="inline-block transition-transform group-hover:-translate-x-1 mr-1">←</span> ホーム
                </Link>
                <div className="h-4 w-px bg-gray-300"></div>
                <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">データの分析 <span className="text-[#86868b] font-normal ml-2 text-sm">数学I / 相関と回帰</span></h1>
             </div>
             
             <div className="flex gap-2">
                 <button 
                    onClick={() => setLessonMode('explore')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lessonMode === 'explore' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'}`}
                 >
                    自由実験
                 </button>
                 <button 
                    onClick={() => setLessonMode('basics')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lessonMode === 'basics' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                 >
                    基礎: 相関とは
                 </button>
                 <button 
                    onClick={() => setLessonMode('leastSquares')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lessonMode === 'leastSquares' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                 >
                    標準: 最小二乗法
                 </button>
                 <button 
                    onClick={() => setLessonMode('challenge')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lessonMode === 'challenge' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                 >
                    Game: r=0.7
                 </button>
             </div>
         </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 pt-24">
        
        {/* Message Box */}
        <div className={`mb-6 p-6 bg-white border-l-4 rounded-r-xl shadow-sm flex items-start gap-4 ${
            lessonMode === 'explore' ? 'border-gray-400' :
            lessonMode === 'basics' ? 'border-blue-500' :
            lessonMode === 'leastSquares' ? 'border-red-500' :
            'border-purple-500'
        }`}>
             <div className="text-3xl">
                {lessonMode === 'explore' ? '🧪' :
                 lessonMode === 'basics' ? '📊' :
                 lessonMode === 'leastSquares' ? '📐' : '🎯'}
             </div>
             <div>
                <h3 className="text-sm font-bold uppercase text-gray-500 mb-1">
                    {lessonMode === 'explore' ? 'Free Explore' :
                     lessonMode === 'basics' ? 'Lesson 1: Correlation' :
                     lessonMode === 'leastSquares' ? 'Lesson 2: Residuals' : 'Challenge Mode'}
                </h3>
                <p className="whitespace-pre-wrap font-medium text-lg leading-relaxed">
                    {message}
                </p>
             </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Stats Panel */}
        <div className="w-full lg:w-1/3 space-y-6">
            <div className="apple-card p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="text-center mb-6">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">相関係数 Correlation</p>
                    <div className="text-6xl font-mono font-bold tracking-tight text-[#1d1d1f]">
                        {isNaN(r) ? '---' : r.toFixed(3)}
                    </div>
                    <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${(r + 1) / 2 * 100}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
                        <span>-1.0</span>
                        <span>0.0</span>
                        <span>1.0</span>
                    </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                         <span className="text-sm font-medium text-gray-600">回帰直線の方程式</span>
                         <span className="font-mono font-bold text-[#0071e3]">
                            y = {slope.toFixed(2)}x {intercept >= 0 ? '+' : ''} {intercept.toFixed(2)}
                         </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                         <span className="text-sm font-medium text-gray-600">データ点数</span>
                         <span className="font-mono font-bold text-gray-900">{points.length}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                        <span className="text-sm font-bold text-red-500">誤差(残差)を表示</span>
                        <button 
                            onClick={() => setShowResiduals(!showResiduals)}
                            className={`w-12 h-7 rounded-full transition-colors relative ${showResiduals ? 'bg-red-500' : 'bg-gray-200'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 transition-transform ${showResiduals ? 'left-6' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-500 leading-relaxed border border-gray-100">
                <p>
                    <strong>💡 ヒント:</strong> グラフ上をクリックして点を追加・削除できます。<br/>
                    相関係数 r は、2つのデータの「直線的な関係の強さ」を表します。
                </p>
            </div>
        </div>

        {/* Canvas Panel */}
        <div className="w-full lg:w-2/3 apple-card bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex items-center justify-center relative overflow-hidden">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={600} 
            onClick={handleCanvasClick}
            className="w-full h-auto max-w-full cursor-crosshair"
          />
        </div>
      </div>
      </main>
    </div>
  );
}
