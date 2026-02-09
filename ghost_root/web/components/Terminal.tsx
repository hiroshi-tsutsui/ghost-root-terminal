'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { processCommand, tabCompletion } from '../lib/Shell';
import VFS from '../lib/VFS';
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
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isBootingRef = useRef(true);
  const isEditingRef = useRef(false);
  const editorStateRef = useRef({ content: '', path: '', buffer: '' });

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

    // Load History from VFS
    const historyFile = VFS['/home/ghost/.bash_history'];
    if (historyFile && historyFile.type === 'file') {
      historyRef.current = historyFile.content.split('\n').filter(Boolean);
      historyIndexRef.current = historyRef.current.length;
    }

    const prompt = () => {
        const cwd = cwdRef.current;
        const p = promptRef.current;
        term.write(`\r\n${p}:\x1b[1;34m${cwd}\x1b[0m$ `);
    };

    const clearLine = () => {
        term.write('\x1b[2K\r');
        const cwd = cwdRef.current;
        const p = promptRef.current;
        term.write(`${p}:\x1b[1;34m${cwd}\x1b[0m$ `);
    };

    const renderEditor = (content: string, path: string, buffer: string) => {
        term.clear();
        term.write('\x1b[H'); // Home
        
        const lines = content.split('\n');
        const rows = term.rows - 2; 
        
        for (let i = 0; i < rows; i++) {
            if (i < lines.length) {
                term.writeln(lines[i]);
            } else {
                term.writeln('\x1b[1;34m~\x1b[0m');
            }
        }
        
        // Status bar
        term.write(`\x1b[${term.rows - 1};1H`); // Move to second to last row
        term.write(`\x1b[7m"${path}" ${lines.length}L, ${content.length}C                        \x1b[0m`);
        
        // Command Line
        term.write(`\x1b[${term.rows};1H\x1b[2K`); // Clear last line
        if (buffer) {
             term.write(buffer);
        }
    };

    const handleEditorInput = (key: string) => {
        const state = editorStateRef.current;
        
        if (key === '\r') { // Enter
            if (state.buffer === ':q' || state.buffer === ':q!' || state.buffer === ':wq' || state.buffer === ':x') {
                // Exit
                isEditingRef.current = false;
                state.buffer = '';
                term.clear();
                // Restore prompt
                const cwd = cwdRef.current;
                const p = promptRef.current;
                term.write(`${p}:\x1b[1;34m${cwd}\x1b[0m$ `);
                return;
            }
            state.buffer = ''; // Clear buffer if unknown command
            renderEditor(state.content, state.path, state.buffer);
        } else if (key === '\u007F') { // Backspace
            if (state.buffer.length > 0) {
                state.buffer = state.buffer.slice(0, -1);
                renderEditor(state.content, state.path, state.buffer);
            }
        } else if (key === '\x1b') { // Esc
            state.buffer = '';
            renderEditor(state.content, state.path, state.buffer);
        } else {
             // Only allow typing if buffer starts with : (command mode)
             if (state.buffer.length > 0 || key === ':') {
                 state.buffer += key;
                 renderEditor(state.content, state.path, state.buffer);
             }
        }
    };

    const handleCommand = async () => {
        let commandLine = inputBufferRef.current.trim();
        let expanded = false;
        
        // History Expansion (!n)
        if (commandLine.startsWith('!')) {
            const hFile = VFS['/home/ghost/.bash_history'];
            if (hFile && hFile.type === 'file') {
               const lines = hFile.content.split('\n').filter(Boolean);
               const idx = parseInt(commandLine.substring(1));
               if (!isNaN(idx) && idx > 0 && idx <= lines.length) {
                   commandLine = lines[idx - 1];
                   expanded = true;
               } else {
                   term.write('\r\n');
                   term.writeln(`bash: ${commandLine}: event not found`);
                   inputBufferRef.current = '';
                   prompt();
                   return;
               }
            }
        }

        if (commandLine) {
            historyRef.current.push(commandLine);
            historyIndexRef.current = historyRef.current.length;

            // Persist to VFS
            const hFile = VFS['/home/ghost/.bash_history'];
            if (hFile && hFile.type === 'file') {
                 hFile.content += (hFile.content ? '\n' : '') + commandLine;
            }
        }

        inputBufferRef.current = '';
        term.write('\r\n');
        
        if (expanded) {
            term.writeln(commandLine);
        }

        if (commandLine) {
          const result = processCommand(cwdRef.current, commandLine);
          
          if (result.action === 'delay') {
             // Simulate delay
             await new Promise(r => setTimeout(r, 1000));
          }

          if (result.action === 'crack_sim' && result.data) {
             const { target, user, success, password } = result.data;
             const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
             const duration = 3000;
             const startTime = Date.now();
             
             while (Date.now() - startTime < duration) {
                 const randomStr = Array(15).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
                 term.write(`\rTrying: ${randomStr}`);
                 await new Promise(r => setTimeout(r, 50));
             }
             
             term.write('\r\x1b[2K'); // Clear line
             
             if (success) {
                 term.writeln(`\x1b[1;32m[SUCCESS]\x1b[0m Password found for ${user}@${target}: \x1b[1;37m${password}\x1b[0m`);
             } else {
                 term.writeln(`\x1b[1;31m[FAILED]\x1b[0m Access denied. Intrusion detection triggered.`);
             }
          }

          if (result.action === 'scan_sim') {
             const duration = 4000;
             const startTime = Date.now();
             const totalIPs = 254;
             const found = new Set();
             
             while (Date.now() - startTime < duration) {
                 const elapsed = Date.now() - startTime;
                 const progress = Math.min(1, elapsed / duration);
                 const currentIP = Math.floor(progress * totalIPs) + 1;
                 
                 term.write(`\rScanning subnet: 192.168.1.${currentIP}... [${Math.floor(progress * 100)}%]`);
                 
                 if (currentIP >= 5 && currentIP <= 8 && !found.has(5)) {
                     term.write('\r\x1b[2K');
                     term.writeln(`\x1b[1;32m[+] Host Found: 192.168.1.5 (Admin PC)\x1b[0m`);
                     found.add(5);
                 }
                 if (currentIP >= 105 && currentIP <= 108 && !found.has(105)) {
                     term.write('\r\x1b[2K');
                     term.writeln(`\x1b[1;34m[+] Host Found: 192.168.1.105 (GHOST_ROOT)\x1b[0m`);
                     found.add(105);
                 }
                 if (currentIP >= 200 && currentIP <= 203 && !found.has(200)) {
                     term.write('\r\x1b[2K');
                     term.writeln(`\x1b[1;33m[+] Host Found: 192.168.1.200 (Printer)\x1b[0m`);
                     found.add(200);
                 }

                 await new Promise(r => setTimeout(r, 10));
             }
             term.write('\r\x1b[2K'); // Clear line
             term.writeln('\nScan Complete. 3 active hosts identified.');
          }

          if (result.action === 'wifi_scan_sim') {
             const duration = 6000;
             const startTime = Date.now();
             term.clear();
             
             while (Date.now() - startTime < duration) {
                 term.write('\x1b[H'); // Home
                 
                 const header = ` CH  SSID             BSSID              PWR  Beacons    #Data, #/s  CH  MB   ENC  CIPHER AUTH ESSID`;
                 const networks = [
                    ` 01  00:14:22:01:23:45  -42       ${Math.floor(Math.random() * 500)}       ${Math.floor(Math.random() * 100)}    0   01  54e  WPA2 CCMP   PSK  GHOST_NET`,
                    ` 06  00:09:5B:1C:9A:BC  -80       ${Math.floor(Math.random() * 200)}        ${Math.floor(Math.random() * 20)}    0   06  54e. WPA2 CCMP   PSK  Admin_5G`,
                    ` 11  00:C0:CA:AD:88:99  -20       ${Math.floor(Math.random() * 800)}       ${Math.floor(Math.random() * 300)}    5   11  54e  OPN              Guest`,
                    ` 09  DE:AD:BE:EF:CA:FE  -65       ${Math.floor(Math.random() * 50)}         ${Math.floor(Math.random() * 5)}    0   09  54e  WEP  WEP         <length: 0>` 
                 ];
                 
                 term.writeln(`\r\n BSSID              PWR  Beacons    #Data, #/s  CH  MB   ENC  CIPHER AUTH ESSID`);
                 term.writeln(`\r\n ${header}`);
                 
                 for (const net of networks) {
                     term.writeln(net);
                 }
                 
                 term.writeln(`\r\n [Scanning channels: ${Math.floor(Math.random() * 14) + 1}]`);
                 
                 await new Promise(r => setTimeout(r, 200));
             }
             term.clear();
             term.writeln('Scan stopped.');
             term.writeln('Target found: DE:AD:BE:EF:CA:FE (Hidden SSID) [WEP]');
          }

          if (result.action === 'top_sim') {
             const duration = 5000;
             const startTime = Date.now();
             term.clear();
             
             while (Date.now() - startTime < duration) {
                 term.write('\x1b[H'); // Move cursor to home
                 const now = new Date();
                 const timeStr = now.toTimeString().split(' ')[0];
                 const loadAvg = (Math.random() * 2).toFixed(2);
                 const loadAvg2 = ((Math.random() * 0.5) + 0.1).toFixed(2);
                 
                 const header = `top - ${timeStr} up 14 days,  2:30,  1 user,  load average: ${loadAvg}, ${loadAvg2}, 0.18\r\nTasks:  12 total,   1 running,  11 sleeping,   0 stopped,   0 zombie\r\n%Cpu(s):  ${(Math.random() * 10).toFixed(1)} us,  ${(Math.random() * 5).toFixed(1)} sy,  0.0 ni, ${(80 + Math.random() * 10).toFixed(1)} id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st\r\nMiB Mem :   7961.2 total,   1423.1 free,   2218.5 used,   4319.6 buff/cache\r\nMiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   5321.4 avail Mem\r\n\r\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND`;
                 
                 const processes = [
                    `    1 root      20   0  168.1m  12.2m   9.8m S   0.0   0.1   0:04.21 systemd`,
                    ` 1337 ghost     20   0   42.0m   2.1m   1.4m S   0.0   0.0  14:02.11 bash`,
                    `  404 root      20   0  102.4m   5.2m   3.1m S   0.0   0.1   1:22.33 sshd`,
                    ` 8888 root      20   0   12.0m   1.1m   0.8m S   0.0   0.0   0:00.05 watcher_daemon`,
                    ` 9999 unknown   20   0   88.8m  44.4m  11.1m R  ${(Math.random() * 20 + 10).toFixed(1)}   0.5   0:10.42 hydra-scan`,
                    `  666 root      20   0   66.6m   6.6m   6.6m S   0.0   0.1   6:06.06 spectre_kernel`,
                    ` 2024 root      20   0    8.4m   1.2m   0.9m S   0.0   0.0   0:01.12 cron`
                 ];
                 
                 term.write(header + '\r\n' + processes.join('\r\n'));
                 await new Promise(r => setTimeout(r, 1000));
             }
             term.clear();
          }

          if (result.action === 'kernel_panic') {
             term.write('\r\n\x1b[1;31mKERNEL PANIC: CRITICAL PROCESS TERMINATED\x1b[0m');
             term.write('\r\n\x1b[1;31mSystem halted.\x1b[0m');
             
             await new Promise(r => setTimeout(r, 2000));
             
             // Reboot simulation
             term.reset();
             isBootingRef.current = true;
             runBootSequence();
             return;
          }

          if (result.action === 'edit_file' && result.data) {
              const { filePath, content } = result.data;
              isEditingRef.current = true;
              editorStateRef.current = { content: content || '', path: filePath, buffer: '' };
              
              term.clear();
              // Render initial editor state
              const lines = (content || '').split('\n');
              const rows = term.rows - 2;
              
              term.write('\x1b[H'); // Home
              for (let i = 0; i < rows; i++) {
                 if (i < lines.length) {
                    term.writeln(lines[i]);
                 } else {
                    term.writeln('\x1b[1;34m~\x1b[0m');
                 }
              }
              
              // Status bar
              term.write(`\x1b[${term.rows};0H`); // Move to last row
              term.write(`\x1b[7m"${filePath}" [Read Only] ${lines.length}L, ${(content || '').length}C\x1b[0m`);
              return; 
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

      if (isEditingRef.current) {
          // Pass raw key to editor handler
          // Since e might be a sequence, we handle first char or full sequence if needed
          // For simplicity, handle char by char or special keys
          handleEditorInput(e);
          return;
      }

      switch (e) {
        case '\r': // Enter
          handleCommand();
          break;
        case '\x1b[A': // Up Arrow
          if (historyRef.current.length > 0) {
             if (historyIndexRef.current > 0) {
                 historyIndexRef.current--;
             } else if (historyIndexRef.current === -1) {
                 historyIndexRef.current = historyRef.current.length - 1;
             }
             
             const cmd = historyRef.current[historyIndexRef.current];
             if (cmd !== undefined) {
                 inputBufferRef.current = cmd;
                 // Clear line and rewrite
                 term.write('\x1b[2K\r'); 
                 const p = promptRef.current;
                 const cwd = cwdRef.current;
                 term.write(`${p}:\x1b[1;34m${cwd}\x1b[0m$ ${cmd}`);
             }
          }
          break;
        case '\x1b[B': // Down Arrow
          if (historyIndexRef.current < historyRef.current.length) {
             historyIndexRef.current++;
             const cmd = historyRef.current[historyIndexRef.current] || '';
             inputBufferRef.current = cmd;
             // Clear line and rewrite
             term.write('\x1b[2K\r'); 
             const p = promptRef.current;
             const cwd = cwdRef.current;
             term.write(`${p}:\x1b[1;34m${cwd}\x1b[0m$ ${cmd}`);
          }
          break;
        case '\t': // Tab
          const { completed } = tabCompletion(cwdRef.current, inputBufferRef.current);
          if (completed !== inputBufferRef.current) {
             // Clear line and rewrite
             term.write('\x1b[2K\r'); // Clear entire line, move to start
             const p = promptRef.current;
             const cwd = cwdRef.current;
             term.write(`${p}:\x1b[1;34m${cwd}\x1b[0m$ ${completed}`);
             inputBufferRef.current = completed;
          }
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
