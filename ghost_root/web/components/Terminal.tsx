'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { processCommand, tabCompletion } from '../lib/Shell';
import '@xterm/xterm/css/xterm.css';

const BOOT_LOGS = [
  "KERNEL: Initializing...",
  "VFS: Mounting root filesystem...",
  "MEM: Checking memory segments [OK]",
  "NET: Establishing secure link...",
  "ERROR: USER_PROFILE_CORRUPTED",
  "WARN: SYSTEM INTEGRITY COMPROMISED",
  "RECOVERY: Loading emergency shell...",
  "Loading modules: [fs] [net] [crypto] ... done.",
];

const WARNING_MESSAGE = [
  "",
  "\x1b[1;31m***********************************************\x1b[0m",
  "\x1b[1;31m WARNING: SYSTEM PURGE IMMINENT. LOG IN TO ABORT.\x1b[0m",
  "\x1b[1;31m***********************************************\x1b[0m",
  "",
];

const HINT_MESSAGE = "\x1b[1;33mType 'help' for recovery options.\x1b[0m";

const WebTerminal = () => {
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const cwdRef = useRef('/home/recovery');
  const promptRef = useRef('\x1b[1;32mghost@root\x1b[0m');
  const inputBufferRef = useRef('');
  const isBootingRef = useRef(true);

  useEffect(() => {
    if (!terminalContainerRef.current) return;

    // Initialize xterm
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: '#000000',
        foreground: '#00ff00',
        cursor: '#00ff00',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalContainerRef.current);
    fitAddon.fit();
    termRef.current = term;

    const prompt = () => {
        const cwd = cwdRef.current;
        const p = promptRef.current;
        term.write(`\r\n${p}:\x1b[1;34m${cwd}\x1b[0m$ `);
    };

    const handleCommand = async () => {
        const commandLine = inputBufferRef.current.trim();
        inputBufferRef.current = '';
        term.write('\r\n');

        if (commandLine) {
          const result = processCommand(cwdRef.current, commandLine);
          
          if (result.action === 'delay') {
             // Simulate delay
             await new Promise(r => setTimeout(r, 1000));
          }

          if (result.output) {
            term.writeln(result.output.replace(/\n/g, '\r\n'));
          }
          if (result.newCwd) {
            cwdRef.current = result.newCwd;
          }
          if (result.newPrompt) {
             promptRef.current = `\x1b[1;32m${result.newPrompt}\x1b[0m`;
          }
        }
        
        prompt();
    };

    // Ghost typing function (defined inside useEffect to access scoped vars)
    const ghostType = async (text: string) => {
      for (const char of text) {
        term.write(char);
        inputBufferRef.current += char;
        await new Promise(r => setTimeout(r, 100 + Math.random() * 50));
      }
      await new Promise(r => setTimeout(r, 600));
      handleCommand();
    };

    // Boot Sequence Logic
    const runBootSequence = async () => {
      term.writeln('');
      
      // 1. Fast scrolling logs
      for (const line of BOOT_LOGS) {
        term.writeln(line);
        await new Promise(r => setTimeout(r, 50));
      }
      
      await new Promise(r => setTimeout(r, 800));

      // 2. The Hook
      for (const line of WARNING_MESSAGE) {
        term.writeln(line);
      }
      
      await new Promise(r => setTimeout(r, 1000));

      // 3. Guidance
      term.writeln(HINT_MESSAGE);
      term.writeln('');
      
      // 4. Prompt
      prompt();
      isBootingRef.current = false; // Enable input

      // 5. Auto-type 'help'
      await new Promise(r => setTimeout(r, 2000));
      if (inputBufferRef.current === '') { 
          await ghostType("help");
      }
    };

    // Handle input
    term.onData(e => {
      // Block input during boot
      if (isBootingRef.current) return;

      switch (e) {
        case '\r': // Enter
          handleCommand();
          break;
        case '\u007F': // Backspace (DEL)
        case '\b':     // Backspace (BS)
          if (inputBufferRef.current.length > 0) {
            term.write('\b \b');
            inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          }
          break;
        default:
          if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E)) {
            inputBufferRef.current += e;
            term.write(e);
          }
      }
    });

    // Start boot sequence
    runBootSequence();

    // Handle resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  return (
    <div 
      ref={terminalContainerRef} 
      className="w-full h-screen bg-black"
    />
  );
};

export default WebTerminal;
