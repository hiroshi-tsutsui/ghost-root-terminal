"use client";

import { useState, useEffect, useRef } from 'react';

export default function ProbabilityPage() {
  const [mean, setMean] = useState(0);
  const [stdDev, setStdDev] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Normal Distribution Function
  const normal = (x: number, mean: number, stdDev: number) => {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Settings
    const scaleX = 40; // pixels per unit
    const scaleY = 200; // pixels per unit (vertical scale for probability density)
    const centerX = width / 2;
    const centerY = height - 50; // Bottom margin

    // Draw Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); // X
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); // Y
    ctx.stroke();

    // Plot Normal Distribution
    ctx.strokeStyle = 'purple';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    // Iterate from -5 to 5 standard deviations
    const range = 5;
    const startX = -range * 2; // extended range
    const endX = range * 2;
    const step = 0.05;

    for (let x = startX; x <= endX; x += step) {
      const y = normal(x, mean, stdDev);
      const px = centerX + x * scaleX;
      const py = centerY - y * scaleY;
      
      if (x === startX) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Fill area within 1 std dev
    ctx.fillStyle = 'rgba(128, 0, 128, 0.2)';
    ctx.beginPath();
    
    const x1 = mean - stdDev;
    const x2 = mean + stdDev;
    
    // Start at x1 on axis
    ctx.moveTo(centerX + x1 * scaleX, centerY);
    
    for (let x = x1; x <= x2; x += step) {
        const y = normal(x, mean, stdDev);
        const px = centerX + x * scaleX;
        const py = centerY - y * scaleY;
        ctx.lineTo(px, py);
    }
    
    // End at x2 on axis
    ctx.lineTo(centerX + x2 * scaleX, centerY);
    ctx.closePath();
    ctx.fill();


  }, [mean, stdDev]);

  return (
    <div className="flex flex-col h-screen bg-white text-black">
      <header className="p-4 bg-gray-100 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold">Probability (確率・統計) - Math A/B</h1>
        <a href="/" className="text-blue-500 hover:underline">Back to Home</a>
      </header>

      <div className="flex flex-col md:flex-row gap-8 p-8 items-start justify-center flex-1">
        
        <div className="w-full max-w-xs space-y-6">
           <div className="bg-purple-50 p-4 rounded-lg">
             <h3 className="font-bold text-lg mb-2">Normal Distribution</h3>
             <p className="font-mono text-sm">f(x) = (1/σ√(2π)) * e^(-(x-μ)²/2σ²)</p>
           </div>

           <div className="space-y-2">
             <label className="font-bold block">Mean (μ): {mean.toFixed(1)}</label>
             <input 
               type="range" min="-3" max="3" step="0.1" 
               value={mean} onChange={(e) => setMean(parseFloat(e.target.value))}
               className="w-full accent-purple-600"
             />
           </div>

           <div className="space-y-2">
             <label className="font-bold block">Std Dev (σ): {stdDev.toFixed(1)}</label>
             <input 
               type="range" min="0.5" max="3" step="0.1" 
               value={stdDev} onChange={(e) => setStdDev(parseFloat(e.target.value))}
               className="w-full accent-green-600"
             />
           </div>

           <div className="bg-gray-50 p-4 rounded border">
             <h3 className="font-bold border-b pb-1 mb-2">Properties</h3>
             <p><strong>68% Rule:</strong> The shaded area represents roughly 68% of the data (within ±1σ).</p>
             <p><strong>Center:</strong> {mean}</p>
             <p><strong>Spread:</strong> {stdDev}</p>
           </div>
        </div>

        <div className="border shadow-lg rounded bg-white">
           <canvas ref={canvasRef} width={600} height={400} />
        </div>

      </div>
    </div>
  );
}
