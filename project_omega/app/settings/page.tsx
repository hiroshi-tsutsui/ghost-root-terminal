"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProgress } from '../contexts/ProgressContext';
import { GeistMono } from 'geist/font/mono';

export default function Settings() {
    const { resetProgress } = useProgress();
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [highFidelity, setHighFidelity] = useState(true);
    const [purgeConfirm, setPurgeConfirm] = useState(false);

    useEffect(() => {
        const settings = localStorage.getItem('omega_settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            setAudioEnabled(parsed.audio);
            setHighFidelity(parsed.fidelity === 'high');
        }
    }, []);

    const saveSettings = (audio: boolean, high: boolean) => {
        const settings = { audio, fidelity: high ? 'high' : 'low' };
        localStorage.setItem('omega_settings', JSON.stringify(settings));
        setAudioEnabled(audio);
        setHighFidelity(high);
    };

    const handlePurge = () => {
        if (!purgeConfirm) {
            setPurgeConfirm(true);
            return;
        }
        resetProgress();
        localStorage.removeItem('omega_settings');
        window.location.href = '/'; // Hard reload to clear everything
    };

    return (
        <div className={`min-h-screen bg-black text-white p-6 font-mono ${GeistMono.className} flex flex-col items-center justify-center relative overflow-hidden`}>
             {/* Background Grid */}
             <div className="absolute inset-0 pointer-events-none opacity-10" 
                 style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
             </div>

             <div className="max-w-2xl w-full border border-white/20 bg-white/5 backdrop-blur-md p-12 relative z-10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                
                <header className="mb-12 text-center">
                    <div className="text-xs text-red-500 uppercase tracking-[0.3em] mb-2 animate-pulse">Restricted Access // Level 5</div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">SYSTEM OVERRIDE</h1>
                    <p className="text-gray-500 text-sm">Adjust simulation parameters. Caution advised.</p>
                </header>

                <div className="space-y-8">
                    {/* Audio Protocol */}
                    <div className="flex justify-between items-center border-b border-white/10 pb-6">
                        <div>
                            <div className="text-sm font-bold tracking-widest mb-1">AUDIO FEEDBACK</div>
                            <div className="text-xs text-gray-500">Enable/Disable sonic resonance.</div>
                        </div>
                        <button 
                            onClick={() => saveSettings(!audioEnabled, highFidelity)}
                            className={`px-4 py-2 border text-xs tracking-widest transition-all ${audioEnabled ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-700 hover:border-white hover:text-white'}`}
                        >
                            {audioEnabled ? 'ACTIVE' : 'MUTED'}
                        </button>
                    </div>

                    {/* Visual Protocol */}
                    <div className="flex justify-between items-center border-b border-white/10 pb-6">
                        <div>
                            <div className="text-sm font-bold tracking-widest mb-1">RENDER FIDELITY</div>
                            <div className="text-xs text-gray-500">High-frequency visual processing.</div>
                        </div>
                        <button 
                            onClick={() => saveSettings(audioEnabled, !highFidelity)}
                            className={`px-4 py-2 border text-xs tracking-widest transition-all ${highFidelity ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-700 hover:border-white hover:text-white'}`}
                        >
                            {highFidelity ? 'MAXIMUM' : 'OPTIMIZED'}
                        </button>
                    </div>

                    {/* Kernel Info */}
                    <div className="flex justify-between items-center border-b border-white/10 pb-6">
                         <div>
                            <div className="text-sm font-bold tracking-widest mb-1">KERNEL VERSION</div>
                            <div className="text-xs text-gray-500">Omega Simulation Core</div>
                        </div>
                        <div className="font-mono text-xs text-green-500">v2.6.0-stable</div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-6">
                        <div className="border border-red-500/30 bg-red-900/10 p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 text-[10px] text-red-500/50 uppercase tracking-widest">Zone: Critical</div>
                            
                            <h3 className="text-red-500 font-bold tracking-widest mb-2">MEMORY CORE PURGE</h3>
                            <p className="text-xs text-red-400/70 mb-6 leading-relaxed">
                                WARNING: This action will destabilize the current timeline. All progress, XP, and clearance levels will be erased. The Operator will be returned to Candidate status.
                            </p>

                            <button 
                                onClick={handlePurge}
                                className={`w-full py-4 border transition-all uppercase tracking-[0.2em] text-xs font-bold ${purgeConfirm ? 'bg-red-600 border-red-600 text-white animate-pulse' : 'bg-transparent border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black'}`}
                            >
                                {purgeConfirm ? 'CONFIRM DELETION?' : 'INITIATE PURGE'}
                            </button>
                            {purgeConfirm && (
                                <button 
                                    onClick={() => setPurgeConfirm(false)}
                                    className="w-full mt-2 text-[10px] text-gray-500 hover:text-white uppercase tracking-widest"
                                >
                                    [ ABORT SEQUENCE ]
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-widest">
                        <span>← Return to Terminal</span>
                    </Link>
                </div>
             </div>
        </div>
    );
}
