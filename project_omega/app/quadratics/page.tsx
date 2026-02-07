"use client";

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw Grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 20; // pixels per unit

    // Grid lines
    for (let x = 0; x <= width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY); // X axis
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height); // Y axis
    ctx.stroke();

    // Plot Parabola
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let pixelX = 0; pixelX < width; pixelX++) {
      // Convert pixel x to graph x
      const x = (pixelX - centerX) / scale;
      
      // Calculate y
      const y = a * x * x + b * x + c;
      
      // Convert graph y to pixel y (inverted y axis)
      const pixelY = centerY - (y * scale);
      
      if (pixelX === 0) {
        ctx.moveTo(pixelX, pixelY);
      } else {
        ctx.lineTo(pixelX, pixelY);
      }
    }
    ctx.stroke();

  }, [a, b, c]);

  const vertexX = a !== 0 ? -b / (2 * a) : 0;
  const vertexY = a * vertexX * vertexX + b * vertexX + c;

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-white text-black font-sans">
      <h1 className="text-4xl font-bold mb-2">Project Omega: Niji Kansu</h1>
      <h2 className="text-2xl text-gray-600 mb-8">二次関数 (Quadratic Functions)</h2>
      
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl items-start justify-center">
        
        <div className="flex flex-col gap-6 w-full max-w-xs bg-gray-50 p-6 rounded-xl shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="font-bold">a (Shape/Direction)</label>
              <span className="font-mono">{a.toFixed(1)}</span>
            </div>
            <input 
              type="range" min="-5" max="5" step="0.1" 
              value={a} onChange={(e) => setA(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="font-bold">b (Horizontal Slope)</label>
              <span className="font-mono">{b.toFixed(1)}</span>
            </div>
            <input 
              type="range" min="-10" max="10" step="0.1" 
              value={b} onChange={(e) => setB(parseFloat(e.target.value))}
              className="w-full accent-green-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="font-bold">c (Vertical Intercept)</label>
              <span className="font-mono">{c.toFixed(1)}</span>
            </div>
            <input 
              type="range" min="-10" max="10" step="0.1" 
              value={c} onChange={(e) => setC(parseFloat(e.target.value))}
              className="w-full accent-red-600"
            />
          </div>

          <div className="mt-4 p-4 bg-white rounded border border-gray-200">
            <p className="font-mono text-lg font-bold text-center">
              y = {a === 0 ? '' : `${a}x²`} {b >= 0 ? '+' : ''}{b}x {c >= 0 ? '+' : ''}{c}
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p><strong>Vertex (頂点):</strong> ({vertexX.toFixed(2)}, {vertexY.toFixed(2)})</p>
            <p><strong>Axis of Symmetry:</strong> x = {vertexX.toFixed(2)}</p>
          </div>
        </div>

        <div className="border border-gray-300 shadow-lg rounded-lg overflow-hidden bg-white">
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={600} 
            className="block"
          />
        </div>
      </div>
    </main>
  );
}
