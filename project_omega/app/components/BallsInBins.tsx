// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';

export default function BallsInBins() {
  const [bins, setBins] = useState<number>(10);
  const [counts, setCounts] = useState<number[]>(new Array(10).fill(0));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<number>(5);
  
  // Use a ref to hold the current counts so the animation loop can access the latest without dependency issues
  const countsRef = useRef<number[]>(new Array(10).fill(0));

  useEffect(() => {
    // Sync ref when bins changes (reset)
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
        
        // Force update react state
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
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h3 className="text-lg font-bold text-gray-900">球と箱のシミュレーション</h3>
            <p className="text-sm text-gray-500 mt-1">{bins} 個の箱にランダムに球を投げ入れる実験 (大数の法則)</p>
        </div>
        
        <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 mr-4">
                <span className="text-xs font-medium text-gray-500">総数:</span>
                <span className="font-mono text-sm font-bold text-gray-900">{totalBalls}</span>
             </div>
             <button 
                onClick={() => setRunning(!running)}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-all ${running ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {running ? '停止' : '開始'}
            </button>
            <button 
                onClick={reset}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
                リセット
            </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
         <div>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>箱の数: {bins}</span>
                <span>2</span>
                <span>50</span>
            </div>
            <input 
                type="range" min="2" max="50" value={bins} 
                onChange={(e) => setBins(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
         </div>
         <div>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>速度: {speed}</span>
                <span>1</span>
                <span>50</span>
            </div>
            <input 
                type="range" min="1" max="50" value={speed} 
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
         </div>
      </div>

      <div className="h-64 flex items-end gap-1 border-b border-gray-200 pb-px relative bg-gray-50/50 rounded-lg p-4 select-none overflow-hidden">
        {/* Expected Line */}
        {totalBalls > 0 && (
             <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-red-400 z-10 pointer-events-none opacity-50 flex items-end justify-end px-2"
                style={{ bottom: `calc(${(average / maxCount) * 100}% + 1px)` }}
             >
                <span className="text-[10px] text-red-500 bg-white/80 px-1 rounded -mb-5">平均: {average.toFixed(1)}</span>
             </div>
        )}

        {counts.map((count, i) => (
            <div 
                key={i} 
                className="bg-blue-500 rounded-t flex-1 hover:bg-blue-600 transition-all duration-75 relative group min-w-[4px]"
                style={{ height: `${Math.max((count / maxCount) * 100, 2)}%`, opacity: 0.8 }}
            >
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg z-20 whitespace-nowrap pointer-events-none">
                    箱 {i + 1}: {count}個
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
