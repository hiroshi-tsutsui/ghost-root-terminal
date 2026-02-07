"use client";

import { useState, useEffect, useRef } from 'react';

export default function CalculusPage() {
  const [xVal, setXVal] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function: f(x) = 0.5x^3 - 2x
  const f = (x: number) => 0.5 * Math.pow(x, 3) - 2 * x;
  
  // Derivative: f'(x) = 1.5x^2 - 2
  const df = (x: number) => 1.5 * Math.pow(x, 2) - 2;

  // Integral: F(x) = 0.125x^4 - x^2 (Antiderivative)
  const F = (x: number) => 0.125 * Math.pow(x, 4) - Math.pow(x, 2);
  const integralVal = F(xVal) - F(0); // Definite integral from 0 to xVal

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
    const scale = 40; // pixels per unit
    const centerX = width / 2;
    const centerY = height / 2;

    // Draw Grid
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += scale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += scale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); // X
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); // Y
    ctx.stroke();

    // Plot Function f(x)
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let pixelX = 0; pixelX < width; pixelX++) {
      const x = (pixelX - centerX) / scale;
      const y = f(x);
      const pixelY = centerY - (y * scale);
      if (pixelX === 0) ctx.moveTo(pixelX, pixelY);
      else ctx.lineTo(pixelX, pixelY);
    }
    ctx.stroke();

    // Draw Tangent Line at xVal
    const yVal = f(xVal);
    const slope = df(xVal);
    
    // Tangent Line equation: y - y1 = m(x - x1) => y = m(x - x1) + y1
    // Draw a line segment around the point
    const tangentLength = 3; // units
    const xStart = xVal - tangentLength;
    const xEnd = xVal + tangentLength;
    const yStart = slope * (xStart - xVal) + yVal;
    const yEnd = slope * (xEnd - xVal) + yVal;

    // Convert to pixel coordinates
    const pXStart = centerX + xStart * scale;
    const pYStart = centerY - yStart * scale;
    const pXEnd = centerX + xEnd * scale;
    const pYEnd = centerY - yEnd * scale;

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(pXStart, pYStart);
    ctx.lineTo(pXEnd, pYEnd);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Point
    const pX = centerX + xVal * scale;
    const pY = centerY - yVal * scale;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(pX, pY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Area under curve (Integral) from 0 to xVal
    ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY); // Start at (0,0)
    
    const step = 0.05;
    // Iterate from 0 to xVal
    const start = Math.min(0, xVal);
    const end = Math.max(0, xVal);
    
    for (let x = start; x <= end; x += step) {
        const y = f(x);
        const px = centerX + x * scale;
        const py = centerY - y * scale;
        ctx.lineTo(px, py);
    }
    // Close shape
    ctx.lineTo(centerX + xVal * scale, centerY); // Drop to x-axis
    ctx.lineTo(centerX, centerY); // Back to origin
    ctx.fill();


  }, [xVal]);

  return (
    <div className="flex flex-col h-screen bg-white text-black">
       <header className="p-4 bg-gray-100 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold">Calculus (微積分) - Math III</h1>
        <a href="/" className="text-blue-500 hover:underline">Back to Home</a>
      </header>

      <div className="flex flex-col md:flex-row gap-8 p-8 items-start justify-center flex-1">
        <div className="w-full max-w-xs space-y-6">
           <div className="bg-blue-50 p-4 rounded-lg">
             <h3 className="font-bold text-lg mb-2">Function</h3>
             <p className="font-mono text-xl">f(x) = 0.5x³ - 2x</p>
           </div>

           <div className="space-y-2">
             <label className="font-bold block">x value: {xVal.toFixed(2)}</label>
             <input 
               type="range" min="-4" max="4" step="0.01" 
               value={xVal} onChange={(e) => setXVal(parseFloat(e.target.value))}
               className="w-full accent-blue-600"
             />
           </div>

           <div className="bg-gray-50 p-4 rounded border">
             <h3 className="font-bold border-b pb-1 mb-2">Analysis at x = {xVal.toFixed(2)}</h3>
             <p><strong>f(x):</strong> {f(xVal).toFixed(3)}</p>
             <p className="text-red-600"><strong>Slope (Derivative):</strong> {df(xVal).toFixed(3)}</p>
             <p className="text-blue-600"><strong>Area (Integral 0→x):</strong> {integralVal.toFixed(3)}</p>
           </div>
           
           <div className="text-sm text-gray-500">
             <p>The <span className="text-red-500">Red Line</span> represents the tangent (derivative).</p>
             <p>The <span className="text-blue-200 bg-blue-500 px-1 text-xs text-white">Blue Shade</span> represents the integral (area).</p>
           </div>
        </div>

        <div className="border shadow-lg rounded bg-white">
           <canvas ref={canvasRef} width={600} height={500} />
        </div>
      </div>
    </div>
  );
}
