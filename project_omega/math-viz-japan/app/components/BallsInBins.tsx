// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';

export default function BallsInBins() {
  const [bins, setBins] = useState<number>(10);
  const [counts, setCounts] = useState<number[]>(new Array(10).fill(0));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<number>(5);
  
  const countsRef = useRef<number[]>(new Array(10).fill(0));

  useEffect(() => {
    countsRef.current = new Array(bins).fill(0);
    setCounts(new Array(bins).fill(0));
  }, [bins]);
  
  const reset = () => {
    countsRef.current = new Array(bins).fill(0);
    setCounts(new Array(bins).fill(0));
    setRunning(false);
  };

  useEffect(() => {
    let animationFrameId: number;
    
    if (running) {
      const step = () => {
        const updatesPerFrame = speed; 
        
        for (let i = 0; i < updatesPerFrame; i++) {
            const randomBin = Math.floor(Math.random() * bins);
            countsRef.current[randomBin]++;
        }
        
        setCounts([...countsRef.current]);
        animationFrameId = requestAnimationFrame(step);
      };
      animationFrameId = requestAnimationFrame(step);
    }
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [running, bins, speed]);

  const maxCount = Math.max(...counts, 1);
  const totalBalls = counts.reduce((a, b) => a + b, 0);
  const average = totalBalls / bins;

  return (
    <div className="apple-card p-8 bg-white overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-xl bg-[#0071e3]/10 flex items-center justify-center text-xl">🎲</span>
                <h3 className="text-xl font-bold text-[#1d1d1f]">球と箱のシミュレーション</h3>
            </div>
            <p className="text-sm text-[#86868b] mt-1 font-medium">{bins} 個の箱にランダムに球を投げ入れる実験 (大数の法則)</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#F5F5F7] p-2 rounded-2xl">
             <div className="px-4 py-1 border-r border-gray-200">
                <span className="text-[10px] uppercase font-bold text-[#86868b] tracking-wide block">総数</span>
                <span className="font-mono text-lg font-bold text-[#1d1d1f]">{totalBalls}</span>
             </div>
             <button 
                onClick={() => setRunning(!running)}
                className={`btn-apple transition-colors ${running ? 'bg-[#ff3b30] hover:bg-[#ff453a]' : 'bg-[#0071e3] hover:bg-[#0077ED]'}`}
            >
                {running ? '停止' : '開始'}
            </button>
            <button 
                onClick={reset}
                className="btn-secondary"
            >
                リセット
            </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#F5F5F7] p-6 rounded-2xl">
         <div className="space-y-3">
            <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-[#86868b] uppercase tracking-wide">箱の数</span>
                <span className="font-mono text-lg font-bold text-[#1d1d1f]">{bins}</span>
            </div>
            <input 
                type="range" min="2" max="50" value={bins} 
                onChange={(e) => setBins(parseInt(e.target.value))}
                className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#86868b] font-mono mt-1">
                <span>2</span>
                <span>50</span>
            </div>
         </div>
         <div className="space-y-3">
            <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-[#86868b] uppercase tracking-wide">速度</span>
                <span className="font-mono text-lg font-bold text-[#34c759]">{speed}</span>
            </div>
            <input 
                type="range" min="1" max="50" value={speed} 
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#86868b] font-mono mt-1">
                <span>1</span>
                <span>50</span>
            </div>
         </div>
      </div>

      <div className="h-72 flex items-end gap-1.5 border-b border-[#e5e5e5] pb-px relative bg-white rounded-xl p-4 select-none overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="border-t border-dashed border-gray-100 w-full h-full"></div>
            ))}
        </div>

        {/* Expected Line */}
        {totalBalls > 0 && (
             <div 
                className="absolute left-0 right-0 border-t-2 border-dotted border-[#ff3b30] z-20 pointer-events-none opacity-80 flex items-end justify-end px-2 transition-all duration-500 ease-out"
                style={{ bottom: `calc(${(average / maxCount) * 100}% + 2px)` }}
             >
                <span className="text-[10px] font-bold text-[#ff3b30] bg-white/90 px-1.5 py-0.5 rounded shadow-sm mb-1 transform translate-y-full">平均: {average.toFixed(1)}</span>
             </div>
        )}

        {counts.map((count, i) => (
            <div 
                key={i} 
                className="bg-gradient-to-t from-[#0071e3] to-[#5l99ff] rounded-t-sm flex-1 hover:brightness-110 transition-all duration-300 ease-out relative group min-w-[4px]"
                style={{ height: `${Math.max((count / maxCount) * 100, 2)}%`, opacity: 0.9 }}
            >
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1d1d1f] text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl z-30 whitespace-nowrap pointer-events-none transition-opacity duration-200">
                    箱 {i + 1}: {count}個
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
