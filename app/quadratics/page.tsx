"use client";

import React, { useState, useEffect, useRef, useReducer } from 'react';
import { GeistSans } from 'geist/font/sans';
import { 
  ChevronLeft, ChevronRight, Zap, Trophy, Target, AlertTriangle, 
  Lightbulb, Binary, Eye, ArrowDown, TrendingUp, RefreshCw, 
  CheckCircle2, HelpCircle, FileText, CheckCircle, XCircle, 
  Maximize2, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import Link from 'next/link';

// --- Types ---
type Mode = 'LEARN' | 'TACTICS';
type Status = 'idle' | 'correct' | 'wrong';
type InequalityType = 'gt' | 'lt' | 'ge' | 'le'; // >0, <0, >=0, <=0

interface State {
  mode: Mode;
  level: number;
  step: number;
}

type Action = 
  | { type: 'SWITCH_MODE'; payload: Mode }
  | { type: 'NEXT_STEP' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'PREV_LEVEL' }
  | { type: 'RESET' };

// --- Components ---
const MathComponent = ({ tex, className = "", display = false }: { tex: string; className?: string; display?: boolean }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      katex.render(tex, containerRef.current, { throwOnError: false, displayMode: display });
    }
  }, [tex, display]);
  return <span ref={containerRef} className={className} />;
};

// --- Reducer ---
function curriculumReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SWITCH_MODE': return { mode: action.payload, level: 0, step: 0 };
    case 'NEXT_STEP': return { ...state, step: state.step + 1 };
    case 'NEXT_LEVEL': return { ...state, level: state.level + 1, step: 0 };
    case 'PREV_LEVEL': return { ...state, level: Math.max(0, state.level - 1), step: 0 };
    case 'RESET': return { mode: 'LEARN', level: 0, step: 0 };
    default: return state;
  }
}

export default function MathTactixEvolutionV1() {
  const [state, dispatch] = useReducer(curriculumReducer, { mode: 'LEARN', level: 0, step: 0 });
  const { mode, level, step } = state;
  
  // Learning States
  const [a_param, setAParam] = useState(0); // For Moving Domain Lesson
  const [a_coeff, setACoeff] = useState(1);
  const [p_vertex, setPVertex] = useState(2);
  const [q_vertex, setQVertex] = useState(-1); // Default to -1 for Level 5 start
  const [ineqType, setIneqType] = useState<InequalityType>('gt');

  // Reset params on level change
  useEffect(() => {
     if (level === 5) setQVertex(-1);
  }, [level]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Visual Engine ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const scale = 40, ox = w / 2, oy = h / 2 + 30;

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.03)'; ctx.lineWidth = 1;
      for(let x=-10; x<=10; x++) { ctx.beginPath(); ctx.moveTo(ox + x*scale, 0); ctx.lineTo(ox + x*scale, h); ctx.stroke(); }
      for(let y=-10; y<=10; y++) { ctx.beginPath(); ctx.moveTo(0, oy - y*scale); ctx.lineTo(w, oy - y*scale); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

      // Default Quadratic Params
      let curA = level === 0 ? a_coeff : 1;
      let curP = (level === 1 || level === 5) ? p_vertex : 2; // Allow P control in L1 & L5
      let curQ = (level === 1 || level === 5) ? q_vertex : 1; // Allow Q control in L1 & L5


      // Level 5 Override: Inequality Demo (Use fixed params with real roots)
      if (level === 5) {
        curA = 1; curP = 2; curQ = q_vertex; // Only vertical shift for now
      }
      
      // Moving Domain logic (Lesson 05 / Level 4)
      const dStart = a_param;
      const dEnd = a_param + 2;
      const dMid = (dStart + dEnd) / 2;

      // Draw Parabola
      ctx.strokeStyle = (level >= 4) ? '#FF3B30' : '#007AFF';
      ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let px = 0; px <= w; px++) {
        const x = (px - ox) / scale;
        const y = curA * Math.pow(x - curP, 2) + curQ;
        const py = oy - y * scale;
        if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Level 5: Inequality Shading
      if (level === 5) {
         // Roots for y = (x-2)^2 + q => (x-2)^2 = -q
         const q = curQ;
         const ch = h; 
         ctx.globalAlpha = 0.2;

         if (q < 0) {
            const delta = Math.sqrt(-q);
            const r1 = 2 - delta;
            const r2 = 2 + delta;

            if (ineqType === 'gt') { // x < r1, x > r2
               ctx.fillStyle = '#10b981'; // Green for Safe/Outside
               ctx.fillRect(0, 0, ox + r1*scale, ch);
               ctx.fillRect(ox + r2*scale, 0, w - (ox + r2*scale), ch);
            } else if (ineqType === 'lt') { // r1 < x < r2
               ctx.fillStyle = '#f59e0b'; // Amber for Inside/Danger
               ctx.fillRect(ox + r1*scale, 0, (r2-r1)*scale, ch);
            }
            
            // Draw Roots
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#1D1D1F';
            ctx.beginPath(); ctx.arc(ox + r1*scale, oy, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(ox + r2*scale, oy, 4, 0, Math.PI*2); ctx.fill();

         } else if (q === 0) {
            const r = 2;
            if (ineqType === 'gt') { // x != 2
               ctx.fillStyle = '#10b981';
               ctx.fillRect(0, 0, ox + r*scale, ch); // Left
               ctx.fillRect(ox + r*scale, 0, w - (ox + r*scale), ch); // Right
            } 
            // For lt (y < 0), no solution, draw nothing.
            
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#1D1D1F';
            ctx.beginPath(); ctx.arc(ox + r*scale, oy, 4, 0, Math.PI*2); ctx.fill();

         } else { // q > 0 (No real roots, always positive)
            if (ineqType === 'gt') { // All real numbers
               ctx.fillStyle = '#10b981';
               ctx.fillRect(0, 0, w, ch);
            }
            // For lt (y < 0), no solution.
         }
         ctx.globalAlpha = 1.0;
      }
    }; // End Render
    render();
  }, [a_coeff, p_vertex, q_vertex, a_param, level, mode, ineqType]);
        ctx.fillStyle = 'rgba(0, 122, 255, 0.08)';
        ctx.fillRect(ox + dStart * scale, 0, (dEnd - dStart) * scale, h);
        ctx.setLineDash([4, 4]); ctx.strokeStyle = '#007AFF';
        ctx.beginPath(); ctx.moveTo(ox + dStart * scale, 0); ctx.lineTo(ox + dStart * scale, h);
        ctx.beginPath(); ctx.moveTo(ox + dEnd * scale, 0); ctx.lineTo(ox + dEnd * scale, h);
        ctx.stroke(); ctx.setLineDash([]);

        // Logic for Max/Min points in domain
        const f = (x: number) => Math.pow(x - 2, 2) + 1;
        let minX = dStart, maxX = dStart;
        
        // Min logic
        if (targetP < dStart) minX = dStart;
        else if (targetP > dEnd) minX = dEnd;
        else minX = targetP;

        // Max logic
        maxX = (Math.abs(dStart - targetP) > Math.abs(dEnd - targetP)) ? dStart : dEnd;

        // Draw Min (Green)
        ctx.fillStyle = '#10b981';
        ctx.beginPath(); ctx.arc(ox + minX * scale, oy - f(minX) * scale, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
        
        // Draw Max (Red)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(ox + maxX * scale, oy - f(maxX) * scale, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
      }
    };
    render();
  }, [a_coeff, p_vertex, q_vertex, a_param, level, mode]);

  return (
    <div className={`h-screen bg-white text-black flex flex-col ${GeistSans.className} selection:bg-blue-100 overflow-hidden`}>
      {/* 1. Header (Static) */}
      <header className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-slate-50 bg-white/90 backdrop-blur-md z-50">
        <button onClick={() => dispatch({type: 'RESET'})} className="p-2 -ml-2 text-slate-400 hover:text-black transition-colors"><ChevronLeft className="w-6 h-6" /></button>
        <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Quadratic Tactics Step 0{level + 1}
        </div>
        <div className="w-10" />
      </header>

      {/* 2. Visual Viewport (Sticky) */}
      <section className="shrink-0 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-md aspect-video bg-white rounded-3xl border border-slate-200/60 shadow-inner overflow-hidden relative">
          <canvas ref={canvasRef} width={400} height={220} className="w-full h-full" />
          <div className="absolute top-3 left-0 right-0 flex justify-center">
            <motion.div key={mode + level} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 text-blue-600 font-bold text-xs">
               {level < 4 && <MathComponent tex="y = (x - 2)^2 + 1" />}
               {level === 4 && <MathComponent tex="a \le x \le a + 2" />}
               {level === 5 && <MathComponent tex={`y = (x - 2)^2 ${q_vertex >= 0 ? '+' : ''}${Math.abs(q_vertex) < 0.05 ? '0' : q_vertex.toFixed(1)}`} />}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Content (Scrollable) */}
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-lg mx-auto px-8 py-8 pb-32">
          <AnimatePresence mode="wait">
            
            {/* LEVEL 4: MOVING DOMAIN */}
            {level === 4 && (
              <motion.div key="lvl4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                 <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-extrabold tracking-tight">最終奥義：動く定義域</h2>
                    <p className="text-slate-500 text-sm">範囲そのものがスライドする時、最大・最小はどう動くか？</p>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                       <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">範囲の開始点 (a)</span><span className="font-mono font-bold text-blue-600">a = {a_param.toFixed(1)}</span></div>
                       <input type="range" min="-2" max="4" step="0.1" value={a_param} onChange={e => setAParam(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none accent-blue-600 cursor-pointer" />
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">答案の戦術（場合分け）</h3>
                       <div className="space-y-3">
                          <div className={`p-4 rounded-2xl border transition-all ${a_param + 2 < 2 ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 opacity-40'}`}>
                             <p className="text-[11px] font-bold">1. 軸が範囲の右外 <MathComponent tex="(a + 2 < 2)" /></p>
                             <p className="text-[10px] text-slate-500 mt-1">最小値は右端、最大値は左端。</p>
                          </div>
                          <div className={`p-4 rounded-2xl border transition-all ${a_param <= 2 && a_param + 2 >= 2 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 opacity-40'}`}>
                             <p className="text-[11px] font-bold">2. 軸が範囲の中 <MathComponent tex="(a \le 2 \le a + 2)" /></p>
                             <p className="text-[10px] text-slate-500 mt-1">最小値は頂点！最大値は軸から遠い方の端。</p>
                          </div>
                          <div className={`p-4 rounded-2xl border transition-all ${a_param > 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100 opacity-40'}`}>
                             <p className="text-[11px] font-bold">3. 軸が範囲の左外 <MathComponent tex="(a > 2)" /></p>
                             <p className="text-[10px] text-slate-500 mt-1">最小値は左端、最大値は右端。</p>
                          </div>
                       </div>
                    </div>

                    <button onClick={() => dispatch({type: 'NEXT_LEVEL'})} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">次のミッションへ</button>
                 </div>
              </motion.div>
            )}

            {/* LEVEL 5: INEQUALITIES */}
            {level === 5 && (
              <motion.div key="lvl5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                 <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-extrabold tracking-tight">不等式の可視化</h2>
                    <p className="text-slate-500 text-sm">グラフが「上」にあるか「下」にあるか。<br/>それが不等式のすべてです。</p>
                 </div>

                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => setIneqType('gt')} className={`p-4 rounded-2xl border font-bold transition-all ${ineqType === 'gt' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-100' : 'bg-white border-slate-100 text-slate-400'}`}>
                          <MathComponent tex="y > 0" />
                          <div className="text-[10px] mt-1 opacity-70">軸より上 (外側)</div>
                       </button>
                       <button onClick={() => setIneqType('lt')} className={`p-4 rounded-2xl border font-bold transition-all ${ineqType === 'lt' ? 'bg-amber-50 border-amber-200 text-amber-700 ring-2 ring-amber-100' : 'bg-white border-slate-100 text-slate-400'}`}>
                          <MathComponent tex="y < 0" />
                          <div className="text-[10px] mt-1 opacity-70">軸より下 (内側)</div>
                       </button>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                       <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">グラフの高さ (q)</span><span className="font-mono font-bold text-blue-600">q = {q_vertex.toFixed(1)}</span></div>
                       <input type="range" min="-4" max="2" step="0.1" value={q_vertex} onChange={e => setQVertex(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none accent-blue-600 cursor-pointer" />
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm space-y-3">
                       <div className="flex gap-3 items-start">
                          <div className="bg-blue-100 p-1.5 rounded-md"><Lightbulb className="w-4 h-4 text-blue-600" /></div>
                          <div>
                             <p className="font-bold text-slate-700">グラフを描けば一撃</p>
                             <p className="text-slate-500 text-xs mt-1">因数分解 <MathComponent tex="(x-1)(x-3)" /> で交点を求め、グラフの上下を見るだけです。</p>
                          </div>
                       </div>
                    </div>

                    <button onClick={() => dispatch({type: 'NEXT_LEVEL'})} className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">全カリキュラム修了</button>
                 </div>
              </motion.div>
            )}

            {/* DEFAULT REDIRECT TO LEVEL 4 FOR NOW */}
            {level < 4 && (
              <motion.div key="intro" className="text-center py-10 space-y-6">
                 <h2 className="text-xl font-bold">ミッションの準備</h2>
                 <button onClick={() => dispatch({type: 'NEXT_LEVEL'})} className="bg-black text-white px-8 py-3 rounded-full font-bold">次へ進む</button>
              </motion.div>
            )}

            {/* FINISH */}
            {level === 6 && (
               <motion.div key="finish" className="text-center space-y-8 py-10">
                  <Trophy className="w-20 h-20 text-blue-600 mx-auto" />
                  <h1 className="text-3xl font-black">2次関数：完全制覇</h1>
                  <p className="text-slate-500 text-sm">あなたは視覚的な理解と、試験を突破する戦術の両方を手に入れました。</p>
                  <Link href="/" className="inline-block bg-slate-900 text-white px-12 py-4 rounded-full font-bold">ホームへ戻る</Link>
               </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
