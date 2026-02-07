"use client";

import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';

export default function CalculusPage() {
  const [xVal, setXVal] = useState(1);
  const [funcStr, setFuncStr] = useState("0.5*x^3 - 2*x");
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic Evaluation
  const evaluateFunc = (expression: string, x: number) => {
    try {
      return math.evaluate(expression, { x });
    } catch (e) {
      return NaN;
    }
  };

  const evaluateDerivative = (expression: string, x: number) => {
    try {
        // Attempt symbolic derivative
        const d = math.derivative(expression, 'x');
        return d.evaluate({ x });
    } catch (e) {
        // Fallback to numerical derivative if symbolic fails
        const h = 0.001;
        return (evaluateFunc(expression, x + h) - evaluateFunc(expression, x - h)) / (2 * h);
    }
  };

  // Numerical Integration (Trapezoidal Rule) from 0 to x
  const integrate = (expression: string, end: number) => {
      const start = 0;
      const n = 100; // steps
      const h = (end - start) / n;
      let sum = 0.5 * (evaluateFunc(expression, start) + evaluateFunc(expression, end));
      for (let i = 1; i < n; i++) {
          sum += evaluateFunc(expression, start + i * h);
      }
      return sum * h;
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
    const scale = 40; // pixels per unit
    const centerX = width / 2;
    const centerY = height / 2;

    // Validate function
    try {
        math.evaluate(funcStr, { x: 0 });
        setError(null);
    } catch (e) {
        setError("Invalid function syntax");
        return;
    }

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
    let first = true;
    for (let pixelX = 0; pixelX < width; pixelX++) {
      const x = (pixelX - centerX) / scale;
      const y = evaluateFunc(funcStr, x);
      if (isNaN(y) || !isFinite(y)) {
          first = true;
          continue;
      }
      
      const pixelY = centerY - (y * scale);
      
      // Prevent drawing across large jumps (asymptotes)
      if (pixelY < -height || pixelY > height * 2) {
          first = true;
          continue;
      }

      if (first) {
          ctx.moveTo(pixelX, pixelY);
          first = false;
      } else {
          ctx.lineTo(pixelX, pixelY);
      }
    }
    ctx.stroke();

    // Draw Tangent Line at xVal
    const yVal = evaluateFunc(funcStr, xVal);
    const slope = evaluateDerivative(funcStr, xVal);
    
    // Tangent Line equation: y - y1 = m(x - x1)
    const tangentLength = 3; // units
    const xStart = xVal - tangentLength;
    const xEnd = xVal + tangentLength;
    const yStart = slope * (xStart - xVal) + yVal;
    const yEnd = slope * (xEnd - xVal) + yVal;

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
    const start = Math.min(0, xVal);
    const end = Math.max(0, xVal);
    
    for (let x = start; x <= end; x += step) {
        const y = evaluateFunc(funcStr, x);
        const px = centerX + x * scale;
        const py = centerY - y * scale;
        ctx.lineTo(px, py);
    }
    // Close shape
    ctx.lineTo(centerX + xVal * scale, centerY); // Drop to x-axis
    ctx.lineTo(centerX, centerY); // Back to origin
    ctx.fill();


  }, [xVal, funcStr]);

  const currentY = evaluateFunc(funcStr, xVal);
  const currentSlope = evaluateDerivative(funcStr, xVal);
  const currentIntegral = integrate(funcStr, xVal);

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
             <input 
                type="text" 
                value={funcStr} 
                onChange={(e) => setFuncStr(e.target.value)}
                className="w-full p-2 border rounded font-mono text-lg mb-2"
                placeholder="e.g. sin(x) + x^2"
             />
             {error && <p className="text-red-500 text-sm">{error}</p>}
             <p className="text-xs text-gray-500">Supports: x^2, sin(x), log(x), etc.</p>
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
             <p><strong>f(x):</strong> {isNaN(currentY) ? 'Err' : currentY.toFixed(3)}</p>
             <p className="text-red-600"><strong>Slope (Derivative):</strong> {isNaN(currentSlope) ? 'Err' : currentSlope.toFixed(3)}</p>
             <p className="text-blue-600"><strong>Area (Integral 0→x):</strong> {isNaN(currentIntegral) ? 'Err' : currentIntegral.toFixed(3)}</p>
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
