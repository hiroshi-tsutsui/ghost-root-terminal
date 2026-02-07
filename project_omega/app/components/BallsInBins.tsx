// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';

export default function BallsInBins() {
  const [bins, setBins] = useState<number>(10);
  const [counts, setCounts] = useState<number[]>(new Array(10).fill(0));
  const [running, setRunning] = useState(false);
  
  const reset = () => {
    setCounts(new Array(bins).fill(0));
    setRunning(false);
  };

  useEffect(() => {
    let animationFrameId: number;
    
    if (running) {
      const step = () => {
        setCounts(prevCounts => {
          const newCounts = [...prevCounts];
          const randomBin = Math.floor(Math.random() * bins);
          newCounts[randomBin]++;
          return newCounts;
        });
        
        animationFrameId = requestAnimationFrame(step);
      };
      step();
    }
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [running, bins]);

  const maxCount = Math.max(...counts, 1);
  const totalBalls = counts.reduce((a, b) => a + b, 0);

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

      <div className="mb-6">
         <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>箱の数: {bins}</span>
            <span>2</span>
            <span>50</span>
         </div>
         <input 
            type="range" min="2" max="50" value={bins} 
            onChange={(e) => {
              setBins(parseInt(e.target.value));
              setCounts(new Array(parseInt(e.target.value)).fill(0));
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
      </div>

      <div className="h-64 flex items-end gap-1 border-b border-gray-200 pb-px relative bg-gray-50/50 rounded-lg p-4">
        {counts.map((count, i) => (
            <div 
                key={i} 
                className="bg-blue-500 rounded-t flex-1 hover:bg-blue-600 transition-colors relative group min-w-[4px]"
                style={{ height: `${Math.max((count / maxCount) * 100, 2)}%`, opacity: 0.8 }}
            >
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
                    箱 {i + 1}: {count}個
                </div>
            </div>
        ))}
        {/* Guide lines if needed, or simple axis */}
      </div>
    </div>
  );
}
