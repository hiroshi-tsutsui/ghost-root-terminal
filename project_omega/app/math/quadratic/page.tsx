"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../contexts/LanguageContext';

export default function QuadraticPage() {
  const { t } = useLanguage();
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Constants for the graph view
  const width = 600;
  const height = 400;
  const scale = 40; // pixels per unit
  const originX = width / 2;
  const originY = height / 2;

  useEffect(() => {
    const newPoints = [];
    // Calculate points for the curve
    for (let pixelX = 0; pixelX <= width; pixelX++) {
      const x = (pixelX - originX) / scale;
      const y = a * x * x + b * x + c;
      const pixelY = originY - y * scale;
      newPoints.push({ x: pixelX, y: pixelY });
    }
    
    // Draw to canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let x = 0; x <= width; x += scale) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let y = 0; y <= height; y += scale) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        
        // Axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(width, originY);
        ctx.stroke(); // X axis
        
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, height);
        ctx.stroke(); // Y axis

        // Plot function
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (newPoints.length > 0) {
            ctx.moveTo(newPoints[0].x, newPoints[0].y);
            for (let i = 1; i < newPoints.length; i++) {
                ctx.lineTo(newPoints[i].x, newPoints[i].y);
            }
        }
        ctx.stroke();
      }
    }
  }, [a, b, c]);

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <header className="mb-8 flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400 mb-1">{t('modules.math_quadratic.title') || "QUADRATIC INNOVATION"}</h1>
          <p className="text-gray-400 text-sm">{t('modules.math_quadratic.subtitle') || "PROTOCOL: PARABOLIC ARCHITECT"}</p>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
            {t('common.back_root') || "← RETURN_ROOT"}
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Visualization Panel */}
        <div className="lg:col-span-2 bg-gray-900/50 rounded-lg border border-gray-800 p-4 relative overflow-hidden">
            <div className="absolute top-4 left-4 bg-black/80 px-3 py-1 rounded text-cyan-400 text-xs font-bold border border-cyan-900/50">
                y = {a}x² + {b}x + {c}
            </div>
            <canvas 
                ref={canvasRef} 
                width={width} 
                height={height} 
                className="w-full h-auto bg-black rounded shadow-[0_0_30px_rgba(0,255,204,0.05)]"
            />
            <div className="mt-4 flex justify-between text-xs text-gray-500">
                <span>-x</span>
                <span>ORIGIN (0,0)</span>
                <span>+x</span>
            </div>
        </div>

        {/* Control Panel */}
        <div className="space-y-8">
            <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800">
                <h2 className="text-sm font-bold text-gray-300 mb-6 uppercase tracking-widest border-b border-gray-800 pb-2">
                    {t('modules.math_quadratic.controls') || "PARAMETER CONTROLS"}
                </h2>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs text-cyan-400 font-bold">A (Curvature)</label>
                            <span className="text-xs text-white bg-gray-800 px-2 rounded">{a}</span>
                        </div>
                        <input 
                            type="range" min="-5" max="5" step="0.1" value={a} 
                            onChange={(e) => setA(parseFloat(e.target.value))}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Controls direction and width.</p>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs text-purple-400 font-bold">B (Slope at Origin)</label>
                            <span className="text-xs text-white bg-gray-800 px-2 rounded">{b}</span>
                        </div>
                        <input 
                            type="range" min="-10" max="10" step="0.5" value={b} 
                            onChange={(e) => setB(parseFloat(e.target.value))}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Shifts the parabola horizontally/vertically.</p>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs text-green-400 font-bold">C (Y-Intercept)</label>
                            <span className="text-xs text-white bg-gray-800 px-2 rounded">{c}</span>
                        </div>
                        <input 
                            type="range" min="-10" max="10" step="0.5" value={c} 
                            onChange={(e) => setC(parseFloat(e.target.value))}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                         <p className="text-[10px] text-gray-500 mt-1">Shifts the parabola up or down.</p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-900/10 p-6 rounded-lg border border-blue-500/20">
                <h3 className="text-blue-400 font-bold text-sm mb-2">Did you know?</h3>
                <p className="text-xs text-blue-200/70 leading-relaxed">
                    Quadratic functions describe projectile motion. If you throw a ball, its path through the air is a parabola (ignoring air resistance). The 'a' value is related to gravity!
                </p>
            </div>
        </div>

      </div>
    </div>
  );
}
