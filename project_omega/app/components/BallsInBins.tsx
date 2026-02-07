"use client";

import { useState, useEffect, useRef } from 'react';

export default function BallsInBins() {
  const [balls, setBalls] = useState<number>(100);
  const [bins, setBins] = useState<number>(10); // Number of bins
  const [counts, setCounts] = useState<number[]>(new Array(10).fill(0));
  const [running, setRunning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Theoretical Expected Value for Uniform Distribution (Balls into Bins)
  // Or Binomial if it's left/right?
  // Let's implement "Balls into Bins" as Uniform Random Assignment (Classic Problem)
  // Problem: Distribute M balls into N bins.
  // Visual: Histogram of bin loads.
  
  // Actually, for Math A/B (Probability), "Balls and Bins" often means:
  // 1. Permutations/Combinations (putting distinct/indistinct balls into boxes).
  // 2. Or just random sampling.
  
  // Let's go with a dynamic simulation of "Throwing Balls Randomly" to show the Law of Large Numbers / Uniform Distribution emerging, or clustering.

  const reset = () => {
    setCounts(new Array(bins).fill(0));
    setRunning(false);
  };

  const simulate = () => {
    if (!running) {
      setRunning(true);
    }
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

  // Max count for scaling
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="p-4 border rounded shadow bg-white mt-8">
      <h3 className="text-xl font-bold mb-4">Balls in Bins Simulation (Uniform Random)</h3>
      <p className="mb-4 text-gray-600">Simulating throwing balls randomly into {bins} bins.</p>
      
      <div className="flex gap-4 mb-4">
        <div>
          <label className="block font-bold">Bins (N): {bins}</label>
          <input 
            type="range" min="2" max="50" value={bins} 
            onChange={(e) => {
              setBins(parseInt(e.target.value));
              setCounts(new Array(parseInt(e.target.value)).fill(0));
            }}
            className="w-full"
          />
        </div>
        <div className="flex items-end gap-2">
            <button 
                onClick={() => setRunning(!running)}
                className={`px-4 py-2 rounded text-white ${running ? 'bg-red-500' : 'bg-green-500'}`}
            >
                {running ? 'Stop' : 'Start'}
            </button>
            <button 
                onClick={reset}
                className="px-4 py-2 rounded bg-gray-500 text-white"
            >
                Reset
            </button>
        </div>
      </div>

      <div className="h-64 flex items-end gap-1 border-b border-l border-gray-400 p-2">
        {counts.map((count, i) => (
            <div 
                key={i} 
                className="bg-blue-500 flex-1 hover:bg-blue-600 transition-all relative group"
                style={{ height: `${(count / maxCount) * 100}%` }}
            >
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs p-1 rounded">
                    {count}
                </div>
            </div>
        ))}
      </div>
      <div className="mt-2 text-center text-sm text-gray-500">
        Total Balls Thrown: {counts.reduce((a, b) => a + b, 0)}
      </div>
    </div>
  );
}
