// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GeistSans } from 'geist/font/sans';
import { 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Trophy,
  Sparkles,
  Move
} from 'lucide-react';

export default function QuadraticCurriculumPage() {
  const [level, setLevel] = useState(0); 
  const [step, setStep] = useState(0); 
  
  const [a, setA] = useState(1);
  const [p, setP] = useState(0);
  const [q, setQ] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Visual Engine ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const scale = 50, ox = w / 2, oy = h / 2 + 50;

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 1;
      for(let x=0; x<=w; x+=scale) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for(let y=0; y<=h; y+=scale) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

      if (level === 1 && step === 1) {
        ctx.setLineDash([5, 5]); ctx.strokeStyle = '#CBD5E1';
        ctx.beginPath(); ctx.arc(ox + 2 * scale, oy - 1 * scale, 20, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = '#007AFF';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let px = 0; px <= w; px++) {
        const x = (px - ox) / scale;
        const curA = level === 0 ? a : 1;
        const curP = level === 1 ? p : 0;
        const curQ = level === 1 ? q : 0;
        const y = curA * Math.pow(x - curP, 2) + curQ;
        const py = oy - y * scale;
        if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = '#007AFF';
      const dP = level === 1 ? p : 0, dQ = level === 1 ? q : 0;
      ctx.beginPath(); ctx.arc(ox + dP * scale, oy - dQ * scale, 6, 0, Math.PI * 2); ctx.fill();
    };

    render();
  }, [a, p, q, level, step]);

  const handleStart = () => {
    console.log("Start clicked");
    setStep(1);
  };

  const handleNextStep1 = () => {
    console.log("Next Step 1 clicked");
    setStep(2);
    setA(-1);
  };

  const handleNextStep2 = () => {
    console.log("Next Step 2 clicked");
    setStep(3);
  };

  const handleGoToLesson2 = () => {
    console.log("Go to Lesson 2 clicked");
    setLevel(1);
    setStep(0);
    setA(1);
  };

  return (
    <div className={`min-h-[100dvh] bg-white text-black flex flex-col ${GeistSans.className}`}>
      <header className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-slate-50 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-black transition-colors"><ChevronLeft className="w-6 h-6" /></Link>
        <div className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">{level === 0 ? '01 Shape' : level === 1 ? '02 Position' : 'Finish'}</div>
        <div className="w-10" />
      </header>

      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full">
        <section className="flex-1 flex items-center justify-center p-8 relative">
          <div className="w-full aspect-[4/5] relative bg-slate-50/30 rounded-[40px] border border-slate-100/50 shadow-inner overflow-hidden">
            <canvas ref={canvasRef} width={400} height={500} className="w-full h-full" />
            <div className="absolute top-6 left-0 right-0 flex justify-center">
              <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-slate-100 font-mono text-[13px] font-bold text-blue-600">
                {level === 0 ? `y = ${a.toFixed(1)}x²` : `y = (x - ${p.toFixed(1)})² + ${q.toFixed(1)}`}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-8 pt-6 pb-12 rounded-t-[48px] shadow-[0_-30px_60px_rgba(0,0,0,0.03)] border-t border-slate-50">
            {level === 0 && (
              <div className="space-y-8">
                {step === 0 && (
                  <div className="text-center space-y-6 py-4">
                    <h1 className="text-3xl font-bold tracking-tight">マスタク：2次関数の極意</h1>
                    <p className="text-slate-500 text-sm leading-relaxed">数学は計算ではありません。形の変化を操る「戦術」です。</p>
                    <button id="start-btn" onClick={handleStart} className="bg-black text-white px-12 py-4 rounded-full font-bold text-[15px]">開始する</button>
                  </div>
                )}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl font-bold">プラスのとき：器</h2>
                      <p className="text-slate-500 text-sm mt-1">スライダーを右端（3.0付近）まで動かしてください。</p>
                    </div>
                    <div className="py-4">
                      <input type="range" min="0.1" max="3" step="0.1" value={a} onChange={e => setA(Number(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600" />
                    </div>
                    {a > 2.5 && (
                      <button id="next-s1" onClick={handleNextStep1} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">次へ進む <ChevronRight className="w-4 h-4" /></button>
                    )}
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl font-bold">マイナスのとき：山</h2>
                      <p className="text-slate-500 text-sm mt-1">スライダーを左端（-3.0付近）まで動かしてください。</p>
                    </div>
                    <div className="py-4">
                      <input type="range" min="-3" max="-0.1" step="0.1" value={a} onChange={e => setA(Number(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600" />
                    </div>
                    {a < -2.5 && (
                      <button id="next-s2" onClick={handleNextStep2} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">次へ進む <ChevronRight className="w-4 h-4" /></button>
                    )}
                  </div>
                )}
                {step === 3 && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-100"><Sparkles className="w-8 h-8 text-white" /></div>
                    <h2 className="text-2xl font-bold">習得：向きの支配</h2>
                    <p className="text-slate-500 text-sm">基礎を把握しました。次は移動を学びましょう。</p>
                    <button id="goto-l2" onClick={handleGoToLesson2} className="w-full bg-black text-white py-4 rounded-2xl font-bold">Lesson 02 へ進む</button>
                  </div>
                )}
              </div>
            )}

            {level === 1 && (
              <div className="space-y-8">
                {step === 0 && (
                  <div className="text-center space-y-6 py-4">
                    <h2 className="text-2xl font-bold tracking-tight">器を移動させる</h2>
                    <p className="text-slate-500 text-sm leading-relaxed">頂点の座標を動かしましょう。</p>
                    <button onClick={() => setStep(1)} className="bg-black text-white px-12 py-4 rounded-full font-bold text-[15px]">トレーニング開始</button>
                  </div>
                )}
                {step === 1 && (
                  <div className="space-y-8">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">横移動 (p)</span><span className="font-mono font-bold text-blue-600">{p.toFixed(1)}</span></div>
                        <input type="range" min="-4" max="4" step="0.1" value={p} onChange={e => setP(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">縦移動 (q)</span><span className="font-mono font-bold text-blue-600">{q.toFixed(1)}</span></div>
                        <input type="range" min="-4" max="4" step="0.1" value={q} onChange={e => setQ(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600" />
                      </div>
                    </div>
                    <div className="pt-2">
                      {Math.abs(p - 2) < 0.2 && Math.abs(q - 1) < 0.2 ? (
                        <button onClick={() => setStep(2)} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold">ターゲット補足：次へ</button>
                      ) : (
                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">点線の円（2, 1）に頂点を重ねてください</p>
                      )}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-100"><Move className="w-8 h-8 text-white" /></div>
                    <h2 className="text-2xl font-bold">習得：位置の支配</h2>
                    <button onClick={() => setLevel(2)} className="w-full bg-black text-white py-4 rounded-2xl font-bold">修了証を受け取る</button>
                  </div>
                )}
              </div>
            )}

            {level === 2 && (
              <div className="text-center space-y-8 py-4">
                 <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center mx-auto shadow-2xl shadow-blue-200"><Trophy className="w-10 h-10 text-white" /></div>
                 <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight">Mission Accomplished</h1>
                 </div>
                 <button onClick={() => window.location.href = "/"} className="w-full bg-black text-white py-4 rounded-2xl font-bold">メニューへ戻る</button>
              </div>
            )}
        </section>
      </main>

      <footer className="h-20 bg-white/80 backdrop-blur-md border-t border-slate-50 flex items-center justify-around px-6 shrink-0">
        <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-md bg-blue-600" /><span className="text-[10px] font-bold text-blue-600">Learn</span></div>
        <div className="flex flex-col items-center gap-1 opacity-20"><div className="w-5 h-5 rounded-md bg-slate-400" /><span className="text-[10px] font-bold text-slate-400">Tactics</span></div>
        <div className="flex flex-col items-center gap-1 opacity-20"><div className="w-5 h-5 rounded-md bg-slate-400" /><span className="text-[10px] font-bold text-slate-400">Profile</span></div>
      </footer>
    </div>
  );
}
