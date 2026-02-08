// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GeistMono } from 'geist/font/mono';
import { useProgress } from '../contexts/ProgressContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type NodeType = 'SIGNAL' | 'NOISE' | 'ANOMALY';
type Point = { id: number; x: number; y: number; type: NodeType };

// --- Constants (Localized) ---
const MODULE_ID = 'data';
const LEVELS = [
  { id: 1, name: 'SIGNAL INJECTION (信号注入)', targetR: 0.90, desc: 'キャリアウェーブを確立せよ。5つ以上のノードを注入し、相関(r) > 0.90 を達成せよ。' },
  { id: 2, name: 'NOISE PURGE (ノイズ除去)', targetR: 0.95, desc: '干渉を排除せよ。異常値(Anomaly)を削除し、信号の整合性を回復せよ。' },
  { id: 3, name: 'ARCHIVE LOCK (完全同期)', targetR: 0.99, desc: '完全な同期を達成せよ。10以上のノードで安定性 > 0.99 を維持せよ。' }
];

export default function ArchivePage() {
  const { moduleProgress, completeLevel } = useProgress();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [points, setPoints] = useState<Point[]>([]);
  const [showResiduals, setShowResiduals] = useState(true);
  const [protocolState, setProtocolState] = useState<'IDLE' | 'ACTIVE' | 'LOCKED' | 'FAILED'>('IDLE');
  const [log, setLog] = useState<string[]>([]);
  const [showUnlock, setShowUnlock] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextId = useRef(0);

  // Initialize Levels
  useEffect(() => {
    const progress = moduleProgress[MODULE_ID]?.completedLevels || [];
    let nextLvl = 1;
    if (progress.includes(1)) nextLvl = 2;
    if (progress.includes(2)) nextLvl = 3;
    setCurrentLevel(nextLvl);
    initLevel(nextLvl);
  }, [moduleProgress]);

  const initLevel = (lvl: number) => {
    setProtocolState('IDLE');
    setLog([`[SYSTEM] LEVEL 0${lvl}: ${LEVELS[lvl-1].name} を初期化中...`]);
    nextId.current = 0;

    if (lvl === 1) {
       setPoints([]);
       addLog("[OP] 信号ノードを注入し、キャリアウェーブを形成してください。");
    } else if (lvl === 2) {
       const noisy: Point[] = [];
       for(let i=0; i<8; i++) {
         noisy.push({ id: nextId.current++, x: i, y: i + 1 + (Math.random() * 0.5 - 0.25), type: 'SIGNAL' });
       }
       noisy.push({ id: nextId.current++, x: 2, y: 8, type: 'ANOMALY' });
       noisy.push({ id: nextId.current++, x: 6, y: 1, type: 'ANOMALY' });
       noisy.push({ id: nextId.current++, x: 8, y: 4, type: 'ANOMALY' });
       setPoints(noisy);
       addLog("[WARNING] 信号の破損を検知。異常値(Anomaly)を排除してください。");
    } else if (lvl === 3) {
       const weak: Point[] = [];
       for(let i=0; i<5; i++) {
         weak.push({ id: nextId.current++, x: i*2, y: i*2 + (Math.random() * 0.2), type: 'SIGNAL' });
       }
       setPoints(weak);
       addLog("[OP] 信号を安定させてください。ノード密度を上げ(10個以上)、相関を高めてください。");
    }
  };

  const addLog = (msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 8));
  };

  const calculateStats = (pts: Point[]) => {
    const n = pts.length;
    if (n < 2) return { r: 0, slope: 0, intercept: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    pts.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
      sumY2 += p.y * p.y;
    });

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const r = denominator === 0 ? 0 : numerator / denominator;
    
    const slopeNum = n * sumXY - sumX * sumY;
    const slopeDenom = n * sumX2 - sumX * sumX;
    const slope = slopeDenom === 0 ? 0 : slopeNum / slopeDenom;
    const intercept = (sumY - slope * sumX) / n;

    return { r, slope, intercept };
  };

  const { r, slope, intercept } = calculateStats(points);

  useEffect(() => {
    const target = LEVELS[currentLevel-1].targetR;
    const currentR = Math.abs(r);
    
    if (currentLevel === 1 && points.length >= 5 && currentR >= target) {
        handleWin();
    } else if (currentLevel === 2 && currentR >= target && !points.some(p => p.type === 'ANOMALY')) {
        if (points.length >= 5) handleWin();
    } else if (currentLevel === 3 && points.length >= 10 && currentR >= target) {
        handleWin();
    }
  }, [points, r, currentLevel]);

  const handleWin = () => {
    if (protocolState === 'LOCKED') return;
    setProtocolState('LOCKED');
    addLog(`[SUCCESS] LEVEL 0${currentLevel} 完了。プロトコル同期成功。`);
    
    setTimeout(() => {
        completeLevel(MODULE_ID, currentLevel);
        setShowUnlock(true);
    }, 1000);
  };

  const handleNextLevel = () => {
    setShowUnlock(false);
    if (currentLevel < 3) {
        // Handled by effect
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (protocolState === 'LOCKED') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const margin = 60;
    const w = canvas.width - 2 * margin;
    const h = canvas.height - 2 * margin;
    
    const mathX = (x - margin) / w * 10;
    const mathY = (canvas.height - margin - y) / h * 10;

    const hitIndex = points.findIndex(p => Math.abs(p.x - mathX) < 0.5 && Math.abs(p.y - mathY) < 0.5);

    if (hitIndex >= 0) {
        const pt = points[hitIndex];
        const newPts = [...points];
        newPts.splice(hitIndex, 1);
        setPoints(newPts);
        addLog(`[OP] ノード削除 [${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}]`);
    } else {
        if (mathX >= 0 && mathX <= 10 && mathY >= 0 && mathY <= 10) {
            const newPt: Point = { id: nextId.current++, x: mathX, y: mathY, type: 'SIGNAL' };
            setPoints([...points, newPt]);
            addLog(`[OP] ノード注入 [${mathX.toFixed(1)}, ${mathY.toFixed(1)}]`);
        }
    }
  };

  // Rendering (Same logic, simplified for brevity)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const margin = 60;
    const w = canvas.width - 2 * margin;
    const h = canvas.height - 2 * margin;
    const toCx = (mx: number) => margin + (mx / 10) * w;
    const toCy = (my: number) => canvas.height - margin - (my / 10) * h;

    ctx.fillStyle = '#050505';
    ctx.fillRect(0,0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for(let i=0; i<=10; i++) {
        ctx.beginPath(); ctx.moveTo(toCx(i), toCy(0)); ctx.lineTo(toCx(i), toCy(10)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(toCx(0), toCy(i)); ctx.lineTo(toCx(10), toCy(i)); ctx.stroke();
    }

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toCx(0), toCy(0)); ctx.lineTo(toCx(10), toCy(0));
    ctx.moveTo(toCx(0), toCy(0)); ctx.lineTo(toCx(0), toCy(10));
    ctx.stroke();

    if (points.length >= 2) {
        ctx.strokeStyle = protocolState === 'LOCKED' ? '#00ff9d' : '#0071e3';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(toCx(0), toCy(intercept));
        ctx.lineTo(toCx(10), toCy(slope * 10 + intercept));
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    points.forEach(p => {
        const cx = toCx(p.x);
        const cy = toCy(p.y);
        ctx.fillStyle = p.type === 'ANOMALY' ? '#ff3b30' : '#0071e3';
        if (protocolState === 'LOCKED' && p.type !== 'ANOMALY') ctx.fillStyle = '#00ff9d';
        ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle; ctx.stroke(); ctx.shadowBlur = 0;
        
        if (showResiduals && points.length >= 2) {
             const predY = slope * p.x + intercept;
             ctx.strokeStyle = 'rgba(255,255,255,0.1)';
             ctx.setLineDash([2,4]);
             ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, toCy(predY)); ctx.stroke(); ctx.setLineDash([]);
        }
    });
  }, [points, protocolState, r, slope, intercept, showResiduals]);

  return (
    <div className={`min-h-screen bg-black text-white font-mono selection:bg-cyan-900 ${GeistMono.className}`}>
       
       <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 h-14 flex items-center px-6 bg-black/80 backdrop-blur-md justify-between">
         <div className="flex items-center gap-4 text-xs tracking-widest">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
               ← OMEGA_ROOT
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-cyan-500 font-bold">PROTOCOL: DATA_ARCHIVE (データ解析)</span>
         </div>
         <div className="text-xs text-white/40">
            LEVEL 0{currentLevel} // {LEVELS[currentLevel-1].name}
         </div>
      </header>

      <main className="pt-20 px-6 max-w-7xl mx-auto space-y-16 pb-20">
        
        {/* --- LEVEL 1: BASICS --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                01. 基礎概念 (BASIC CONCEPTS)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-white/70 leading-relaxed">
                <div>
                    <h3 className="text-white font-bold mb-2">相関 (Correlation) とは？</h3>
                    <p>
                        2つのデータ（変数）の間に、どのような関係があるかを示す指標です。
                        例えば、「気温」が上がると「アイスの売上」も上がる場合、これらは<strong>正の相関</strong>があると言います。
                        逆に、「雨量」が増えると「客数」が減る場合、<strong>負の相関</strong>があると言います。
                    </p>
                </div>
                <div>
                    <h3 className="text-white font-bold mb-2">なぜ重要なのですか？</h3>
                    <p>
                        現実世界（シミュレーション外）において、未来を予測するために不可欠だからです。
                        株価の変動、病気の進行、宇宙の膨張率。全てはデータの相関関係からパターンを見つけ出し、
                        次の「フレーム」を予測することで制御可能になります。
                    </p>
                </div>
            </div>
        </section>

        {/* --- LEVEL 2: THEORY --- */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                02. 理論モデル (THEORY)
            </h2>
            <div className="bg-white/5 border border-white/10 p-6 rounded-sm font-mono text-xs">
                <div className="mb-4">
                    <span className="text-white/40">DEFINITION //</span> <span className="text-white">相関係数 (Correlation Coefficient, r)</span>
                </div>
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center py-8">
                    <div className="text-xl md:text-2xl tracking-widest text-cyan-400">
                        r = S_xy / (S_x * S_y)
                    </div>
                    <div className="text-white/50 text-sm space-y-1">
                        <div>S_xy : 共分散 (Covariance)</div>
                        <div>S_x, S_y : 標準偏差 (Standard Deviation)</div>
                    </div>
                </div>
                <p className="text-white/60 text-center max-w-2xl mx-auto mt-4">
                    相関係数 <em>r</em> は、-1 から +1 の範囲の値をとります。<br/>
                    +1 に近いほど強い正の相関、-1 に近いほど強い負の相関、0 は相関なしを表します。
                </p>
            </div>
        </section>

        {/* --- LEVEL 3: VISUALIZATION (THE APP) --- */}
        <section className="space-y-6">
             <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                03. データ可視化 (VISUALIZATION)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                {/* Left Panel (Stats) */}
                <div className="space-y-6">
                    <div className="border border-white/10 bg-white/5 p-6 rounded-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 text-[10px] text-white/20">
                            ID: {MODULE_ID.toUpperCase()}_L0{currentLevel}
                        </div>
                        <div className="text-xs text-white/40 uppercase tracking-widest mb-2">整合性 (INTEGRITY r)</div>
                        <div className={`text-5xl font-bold tracking-tighter mb-4 ${
                            Math.abs(r) >= LEVELS[currentLevel-1].targetR ? 'text-green-400' : 'text-cyan-500'
                        }`}>
                            {isNaN(r) ? '0.0000' : Math.abs(r).toFixed(4)}
                        </div>
                        <div className="text-[10px] text-white/30 mb-4">TARGET: {LEVELS[currentLevel-1].targetR.toFixed(2)}</div>
                        <div className="w-full h-1 bg-white/10 overflow-hidden mb-4">
                            <div className={`h-full transition-all duration-500 ${
                                Math.abs(r) >= LEVELS[currentLevel-1].targetR ? 'bg-green-400' : 'bg-cyan-500'
                            }`} style={{ width: `${(Math.abs(r)) * 100}%` }}></div>
                        </div>
                        <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                                <span className="text-white/40">回帰直線 (Regression)</span>
                                <span className="text-cyan-400">y = {slope.toFixed(2)}x + {intercept.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                                <span className="text-white/40">データ数 (N)</span>
                                <span>{points.length}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="text-white/40">残差表示 (Residuals)</span>
                                <button onClick={() => setShowResiduals(!showResiduals)} className="text-white hover:text-cyan-400 underline decoration-dotted">
                                    {showResiduals ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border border-white/10 bg-black p-4 h-48 overflow-hidden flex flex-col font-mono text-xs relative">
                        <div className="text-white/30 mb-2 pb-2 border-b border-white/10 flex justify-between">
                            <span>SYSTEM_LOG //</span>
                            <span className="animate-pulse text-cyan-500">● LIVE</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                            {log.map((entry, i) => (
                                <div key={i} className="text-white/70">
                                    <span className="text-cyan-900 mr-2">{`>`}</span>
                                    {entry}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="text-xs text-white/40 leading-relaxed border-l-2 border-cyan-900/50 pl-3">
                        <strong className="text-cyan-500 block mb-1">MISSION: {LEVELS[currentLevel-1].name}</strong>
                        {LEVELS[currentLevel-1].desc}
                    </div>
                </div>

                {/* Right Panel (Canvas) */}
                <div className="lg:col-span-2 border border-white/10 bg-black relative group h-full">
                    <div className="absolute top-2 left-2 text-[10px] text-white/20 group-hover:text-white/40 transition-colors">
                        VIEWPORT_01 // CLICK TO ADD/REMOVE NODES
                    </div>
                    <canvas 
                        ref={canvasRef}
                        width={800}
                        height={600}
                        onClick={handleCanvasClick}
                        className="w-full h-full cursor-crosshair object-contain"
                    />
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-20"></div>
                </div>
            </div>
        </section>

        {/* --- LEVEL 4: APPLICATION --- */}
        <section className="space-y-6 border-t border-white/10 pt-16">
            <h2 className="text-2xl font-bold text-cyan-500 tracking-tighter border-b border-white/10 pb-2">
                04. 応用 (APPLICATIONS)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/60">
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">金融工学 (Finance)</h3>
                    <p>
                        複数の資産（株など）の相関を分析し、リスクを分散する「ポートフォリオ理論」に使用されます。
                        逆相関の資産を組み合わせることで、暴落時のダメージを軽減します。
                    </p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">AI・機械学習</h3>
                    <p>
                        特徴量選択（Feature Selection）において、ターゲット変数と強い相関を持つデータを選び出すために使用されます。
                        無関係なノイズデータを削除することで、モデルの精度を向上させます。
                    </p>
                </div>
                <div className="bg-white/5 p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-2 text-sm">擬似相関の罠</h3>
                    <p>
                        「アイスの売上」と「水難事故」には強い相関がありますが、因果関係はありません（共通要因は「気温」）。
                        データ分析官（オペレーター）は、相関と因果を混同してはいけません。
                    </p>
                </div>
            </div>
        </section>

      </main>

      <AnimatePresence>
        {showUnlock && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            >
                <div className="bg-black border border-cyan-500/30 p-8 max-w-md w-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tighter">PROTOCOL SYNCED</h2>
                    <div className="text-cyan-500 text-sm mb-6">LEVEL 0{currentLevel} COMPLETE</div>
                    <p className="text-white/60 text-xs mb-8 leading-relaxed">
                        信号整合性が回復しました。アーカイブはあなたの貢献を承認します。
                        XP AWARDED: <span className="text-white">+100</span>
                    </p>
                    <div className="flex gap-4">
                        <button 
                            onClick={handleNextLevel}
                            className="flex-1 bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 py-3 text-xs hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest"
                        >
                            {currentLevel < 3 ? '次のフェーズを開始 (NEXT)' : 'ルートに戻る (ROOT)'}
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
