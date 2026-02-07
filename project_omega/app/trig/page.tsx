"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function TrigPage() {
  const [angle, setAngle] = useState(0); // Degrees 0-360
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation loop
  useEffect(() => {
    let animationFrameId: number;
    if (isPlaying) {
      const animate = () => {
        setAngle(prev => (prev + 1) % 360);
        animationFrameId = requestAnimationFrame(animate);
      };
      animationFrameId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cx = 150; // Unit circle center X
    const cy = height / 2; // Unit circle center Y
    const r = 100; // Radius
    
    // Grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    // ... grid drawing ...

    // Unit Circle
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Angle calculations
    const rad = (angle * Math.PI) / 180;
    const px = cx + r * Math.cos(rad);
    const py = cy - r * Math.sin(rad); // Canvas Y is inverted

    // Radius line
    ctx.strokeStyle = '#0071e3';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Point on circle
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();

    // Projection line to wave
    ctx.strokeStyle = '#ff3b30'; // Red dashed
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(350, py); // Start of wave area
    ctx.stroke();
    ctx.setLineDash([]);

    // Sine Wave
    const waveStartX = 350;
    ctx.strokeStyle = '#34c759'; // Green
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Draw wave history? Or just static wave with current point?
    // Let's draw the wave from 0 to 360 degrees mapped to x
    for (let x = 0; x < 400; x++) {
        const plotRad = (x / 200) * Math.PI; // Scale x to radians
        const plotY = cy - r * Math.sin(plotRad);
        if (x === 0) ctx.moveTo(waveStartX + x, plotY);
        else ctx.lineTo(waveStartX + x, plotY);
    }
    ctx.stroke();

    // Current point on wave
    const waveCurrentX = waveStartX + (rad / Math.PI) * 200; 
    // Wait, let's map 0-2PI to width of 400px (so 200px per PI)
    // 360 deg = 2PI approx 6.28. 
    // Let's map 360 deg to 360 px for simplicity?
    
    const waveX = waveStartX + angle;
    ctx.fillStyle = '#34c759';
    ctx.beginPath();
    ctx.arc(waveX, py, 5, 0, Math.PI * 2);
    ctx.fill();

  }, [angle]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7]">
        <header className="bg-white/70 backdrop-blur-md border-b h-16 flex items-center px-6 fixed w-full z-10">
             <Link href="/" className="text-sm font-medium text-gray-500 hover:text-blue-600">← Home</Link>
             <h1 className="ml-4 font-bold text-gray-900">三角比 (Trigonometry)</h1>
        </header>
        <main className="pt-24 p-6 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-bold mb-4">Unit Circle & Wave</h2>
                    <div className="flex items-center gap-4 mb-4">
                        <label className="text-sm font-bold text-gray-500">Angle (θ)</label>
                        <span className="font-mono text-xl">{angle}°</span>
                    </div>
                    <input 
                        type="range" min="0" max="360" value={angle} 
                        onChange={(e) => setAngle(parseInt(e.target.value))}
                        className="w-full"
                    />
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg font-bold"
                    >
                        {isPlaying ? 'Stop Animation' : 'Start Animation'}
                    </button>
                </div>
            </div>
            <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-sm p-4 flex justify-center items-center">
                <canvas ref={canvasRef} width={800} height={400} className="w-full max-w-full" />
            </div>
        </main>
    </div>
  );
}
