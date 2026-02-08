"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  id: string;
  sender: 'ARCHITECT' | 'WIDOW' | 'SYSTEM';
  text: string;
  timestamp: number;
  read: boolean;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-003',
    sender: 'ARCHITECT',
    text: "Phase 2 is in full effect. The simulation is stabilizing, but the Void is growing. We need you to focus on the 'Complex' sector. The imaginary numbers are bleeding into the real.",
    timestamp: Date.now(),
    read: false
  },
  {
    id: 'msg-001',
    sender: 'ARCHITECT',
    text: "Welcome to the fold, Operator. The simulation is vast, but it's built on simple rules. Master them, and you master reality.",
    timestamp: Date.now() - 1000000,
    read: true
  },
  {
    id: 'msg-002',
    sender: 'SYSTEM',
    text: "Protocol v2.6.0 Online. Anomalies detected in Sector: CALCULUS.",
    timestamp: Date.now() - 500000,
    read: true
  }
];

export default function SystemMessages() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load from localStorage or seed
    const stored = localStorage.getItem('omega_system_messages');
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      setMessages(INITIAL_MESSAGES);
      localStorage.setItem('omega_system_messages', JSON.stringify(INITIAL_MESSAGES));
    }
  }, []);

  useEffect(() => {
    setHasUnread(messages.some(m => !m.read));
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const markAllRead = () => {
    const updated = messages.map(m => ({ ...m, read: true }));
    setMessages(updated);
    localStorage.setItem('omega_system_messages', JSON.stringify(updated));
    setHasUnread(false);
  };

  const toggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      markAllRead();
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-mono">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 md:w-96 bg-[#050505] border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-white/5 p-3 border-b border-white/10 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Secure Uplink</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">×</button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="h-64 overflow-y-auto p-4 space-y-4 bg-black/50"
            >
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-1">
                  <div className="flex justify-between items-end">
                    <span className={`text-[10px] font-bold tracking-wider ${
                      msg.sender === 'ARCHITECT' ? 'text-cyan-400' : 
                      msg.sender === 'WIDOW' ? 'text-purple-400' : 'text-red-500'
                    }`}>
                      {msg.sender}
                    </span>
                    <span className="text-[9px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="text-xs text-gray-300 leading-relaxed border-l-2 border-white/10 pl-2">
                    {msg.text}
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center text-[10px] text-gray-600 mt-10">NO SIGNAL</div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-white/10 text-[9px] text-center text-gray-600 uppercase tracking-widest bg-white/5">
              Encrypted // End-to-End
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleOpen}
        className={`group relative flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-300 ${
          isOpen ? 'bg-white text-black border-white' : 'bg-black text-white border-white/20 hover:border-white/50'
        }`}
      >
        {/* Unread Indicator */}
        {hasUnread && !isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
        )}
        {hasUnread && !isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
        )}

        {/* Icon */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          {isOpen ? (
             <line x1="18" y1="6" x2="6" y2="18"></line>
          ) : (
             <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          )}
          {isOpen && <line x1="6" y1="6" x2="18" y2="18"></line>} 
        </svg>
      </button>
    </div>
  );
}
