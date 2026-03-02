"use client";

import React, { useState, useEffect, useRef, useReducer } from 'react';
import { GeistSans } from 'geist/font/sans';
import { 
  ChevronLeft, ChevronRight, Zap, Target, 
  RefreshCw, CheckCircle2, HelpCircle, 
  TrendingUp, Circle, Compass, Activity,
  Trophy, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import Link from 'next/link';

// --- Types ---
type State = {
  angle: number; 
  step: number; // 0: Free Play, 1: Quiz Mode, 2: Level Clear
  quizTarget: { type: 'sin' | 'cos', angle: number, value: string };
};

type Action = 
  | { type: 'SET_ANGLE'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'SET_QUIZ'; payload: { type: 'sin' | 'cos', angle: number, value: string } }
  | { type: 'RESET' };

const FAMOUS_ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];

const EXACT_VALUES: Record<number, { sin: string, cos: string }> = {
  0:   { sin: "0", cos: "1" },
  30:  { sin: "\\frac{1}{2}", cos: "\\frac{\\sqrt{3}}{2}" },
  45:  { sin: "\\frac{\\sqrt{2}}{2}", cos: "\\frac{\\sqrt{2}}{2}" },
  60:  { sin: "\\frac{\\sqrt{3}}{2}", cos: "\\frac{1}{2}" },
  90:  { sin: "1", cos: "0" },
  120: { sin: "\\frac{\\sqrt{3}}{2}", cos: "-\\frac{1}{2}" },
  135: { sin: "\\frac{\\sqrt{2}}{2}", cos: "-\\frac{\\sqrt{2}}{2}" },
  150: { sin: "\\frac{1}{2}", cos: "-\\frac{\\sqrt{3}}{2}" },
  180: { sin: "0", cos: "-1" },
  210: { sin: "-\\frac{1}{2}", cos: "-\\frac{\\sqrt{3}}{2}" },
  225: { sin: "-\\frac{\\sqrt{2}}{2}", cos: "-\\frac{\\sqrt{2}}{2}" },
  240: { sin: "-\\frac{\\sqrt{3}}{2}", cos: "-\\frac{1}{2}" },
  270: { sin: "-1", cos: "0" },
  300: { sin: "-\\frac{\\sqrt{3}}{2}", cos: "\\frac{1}{2}" },
  315: { sin: "-\\frac{\\sqrt{2}}{2}", cos: "\\frac{\\sqrt{2}}{2}" },
  330: { sin: "-\\frac{1}{2}", cos: "\\frac{\\sqrt{3}}{2}" },
  360: { sin: "0", cos: "1" }
};

// --- Components ---
const MathComponent = ({ tex, className = "" }: { tex: string; className?: string }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      katex.render(tex, containerRef.current, { throwOnError: false, displayMode: false });
    }
  }, [tex]);
  return <span ref={containerRef} className={className} />;
};

// --- Reducer ---
function trigReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ANGLE': {
      let angle = action.payload;
      // Snap to famous angles if within 3 degrees
      const snapTarget = FAMOUS_ANGLES.find(fa => Math.abs(fa - angle) < 3);
      if (snapTarget !== undefined) angle = snapTarget;
      return { ...state, angle };
    }
    case 'NEXT_STEP': return { ...state, step: state.step + 1 };
    case 'SET_QUIZ': return { ...state, quizTarget: action.payload, step: 1 };
    case 'RESET': return { angle: 30, step: 0, quizTarget: { type: 'sin', angle: 60, value: "\\frac{\\sqrt{3}}{2}" } };
    default: return state;
  }
}

export default function TrigEvolutionCycle03() {
  const [state, dispatch] = useReducer(trigReducer, { 
    angle: 30, 
    step: 0,
    quizTarget: { type: 'sin', angle: 60, value: "\\frac{\\sqrt{3}}{2}" }
  });
  const { angle, step, quizTarget } = state;
  const [feedback, setFeedback] = useState<{status: 'idle'|'correct'|'wrong', msg: string}>({status: 'idle', msg: ''});

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Visual Engine ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const radius = 120, ox = w / 2, oy = h / 2;

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      
      // Grid
      ctx.strokeStyle = 'rgba(0,0,0,0.03)'; ctx.lineWidth = 1;
      for(let i=-200; i<=200; i+=50) {
        ctx.beginPath(); ctx.moveTo(ox + i, 0); ctx.lineTo(ox + i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, oy + i); ctx.lineTo(w, oy + i); ctx.stroke();
      }

      // Unit Circle
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ox, oy, radius, 0, Math.PI * 2); ctx.stroke();

      // Axes
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

      const rad = (angle * Math.PI) / 180;
      const targetX = ox + Math.cos(rad) * radius;
      const targetY = oy - Math.sin(rad) * radius;

      // Snapped State Feedback
      const isSnapped = FAMOUS_ANGLES.includes(angle);
      if (isSnapped) {
        ctx.fillStyle = 'rgba(0, 122, 255, 0.05)';
        ctx.beginPath(); ctx.arc(ox, oy, radius + 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0, 122, 255, 0.3)'; ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.arc(ox, oy, radius + 10, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Projections
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#007AFF'; ctx.beginPath(); ctx.moveTo(targetX, oy); ctx.lineTo(targetX, targetY); ctx.stroke();
      ctx.strokeStyle = '#FF3B30'; ctx.beginPath(); ctx.moveTo(ox, targetY); ctx.lineTo(targetX, targetY); ctx.stroke();
      ctx.setLineDash([]);

      // Main Vector
      ctx.strokeStyle = '#1D1D1F'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(targetX, targetY); ctx.stroke();

      // Sin/Cos Highlights
      ctx.strokeStyle = '#007AFF'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(targetX, oy); ctx.stroke();
      ctx.strokeStyle = '#FF3B30'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, targetY); ctx.stroke();

      // The Point
      ctx.fillStyle = isSnapped ? '#007AFF' : '#1D1D1F';
      ctx.beginPath(); ctx.arc(targetX, targetY, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
    };
    render();
  }, [angle]);

  const checkQuiz = () => {
    if (angle === quizTarget.angle) {
      setFeedback({status: 'correct', msg: 'ミッション成功！ 有名角の値を正確に捉えました。'});
    } else {
      setFeedback({status: 'wrong', msg: '角度が違います。単位円を慎重に回してください。'});
    }
  };

  return (
    <div className={`h-screen bg-white text-black flex flex-col ${GeistSans.className} selection:bg-blue-100 overflow-hidden`}>
      <header className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-slate-50 bg-white/90 backdrop-blur-md z-50">
        <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-black transition-colors"><ChevronLeft className="w-6 h-6" /></Link>
        <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Trig Evolution Cycle 03
        </div>
        <div className="w-10" />
      </header>

      <section className="shrink-0 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-md aspect-square bg-white rounded-[48px] border border-slate-200/60 shadow-inner overflow-hidden relative">
          <canvas ref={canvasRef} width={400} height={400} className="w-full h-full" />
          
          {/* Exact Value Overlay */}
          <AnimatePresence>
            {EXACT_VALUES[angle] && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                 <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-blue-100 shadow-2xl flex flex-col items-center gap-2">
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Exact Value Detected</div>
                    <div className="flex gap-4">
                       <div className="flex flex-col items-center"><span className="text-[9px] text-slate-400">cos</span><MathComponent tex={EXACT_VALUES[angle].cos} className="text-xl font-bold" /></div>
                       <div className="flex flex-col items-center"><span className="text-[9px] text-slate-400">sin</span><MathComponent tex={EXACT_VALUES[angle].sin} className="text-xl font-bold" /></div>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
             <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-slate-100 font-mono font-bold text-slate-900 text-sm">
                θ = {angle}°
             </div>
          </div>
        </div>
      </section>

      <main className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-lg mx-auto px-8 py-8 pb-32">
          <AnimatePresence mode="wait">
            
            {step === 0 && (
              <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                 <div className="space-y-4 text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight">有名角を支配する</h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                       試験に出る角度は決まっています。スライダーを回すと、<br/>
                       30°や45°の地点で<strong>「磁石のように」</strong>吸い付く感覚を体験してください。
                    </p>
                 </div>
                 
                 <div className="space-y-6">
                    <input 
                      type="range" min="0" max="360" step="1" value={angle} 
                      onChange={e => dispatch({type: 'SET_ANGLE', payload: Number(e.target.value)})} 
                      className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-black cursor-pointer" 
                    />
                    
                    <div className="grid grid-cols-1 gap-3">
                       <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 items-start">
                          <Zap className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                          <div>
                             <h4 className="font-bold text-sm">タクティカル・スナップ</h4>
                             <p className="text-[11px] text-slate-500 mt-1">
                                角度が有名角に近づくと自動で固定されます。その時の <MathComponent tex="\frac{1}{2}" /> や <MathComponent tex="\frac{\sqrt{3}}{2}" /> という値を脳に刻んでください。
                             </p>
                          </div>
                       </div>
                    </div>

                    <button onClick={() => dispatch({type: 'NEXT_STEP'})} className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                       実戦演習：有名角ミッションへ <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                 <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full text-red-600 text-[10px] font-black uppercase tracking-widest">Mission</div>
                    <h2 className="text-xl font-bold text-slate-800">
                       <MathComponent tex={`${quizTarget.type} ${quizTarget.angle}^\\circ`} /> の値を再現せよ
                    </h2>
                    <p className="text-xs text-red-700/70">単位円を回して、ターゲットの角度で止めてください。</p>
                 </div>

                 <div className="space-y-6">
                    <input 
                      type="range" min="0" max="360" step="1" value={angle} 
                      onChange={e => dispatch({type: 'SET_ANGLE', payload: Number(e.target.value)})} 
                      className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-red-500 cursor-pointer" 
                    />
                    
                    <button onClick={checkQuiz} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
                       戦術を確定する
                    </button>

                    <AnimatePresence>
                      {feedback.status === 'correct' && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center space-y-3">
                           <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100"><Star className="w-6 h-6 text-white fill-white" /></div>
                           <h4 className="text-emerald-700 font-bold">完全勝利</h4>
                           <p className="text-[11px] text-emerald-600 leading-relaxed">
                              素晴らしい！ <MathComponent tex={`${quizTarget.type} ${quizTarget.angle}^\\circ = ${quizTarget.value}`} /> です。図形的な位置（{quizTarget.type === 'sin' ? '高さ' : '横幅'}）で覚えるのが最短ルートです。
                           </p>
                           <button onClick={() => dispatch({type: 'RESET'})} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs mt-2">次のミッションへ</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      <footer className="h-20 bg-white/90 backdrop-blur-md border-t border-slate-50 flex items-center justify-around px-6 shrink-0 z-50">
        <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-md bg-blue-600" /><span className="text-[10px] font-bold text-blue-600">Learn</span></div>
        <div className="flex flex-col items-center gap-1 opacity-20"><div className="w-5 h-5 rounded-md bg-slate-300" /><span className="text-[10px] font-bold text-slate-400">Tactics</span></div>
        <div className="flex flex-col items-center gap-1 opacity-20"><div className="w-5 h-5 rounded-md bg-slate-300" /><span className="text-[10px] font-bold text-slate-400">Profile</span></div>
      </footer>
    </div>
  );
}
