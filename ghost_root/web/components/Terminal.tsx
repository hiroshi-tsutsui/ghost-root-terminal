'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { processCommand, tabCompletion, getMissionStatus, MissionStatus } from '../lib/Shell';
import VFS from '../lib/VFS';
import '@xterm/xterm/css/xterm.css';

const ObjectiveItem = ({ label, done }: { label: string, done: boolean }) => (
  <div className={`flex items-center space-x-2 ${done ? 'text-green-400' : 'text-gray-600'}`}>
    <span>{done ? '[✓]' : '[ ]'}</span>
    <span className={done ? 'line-through opacity-50' : ''}>{label}</span>
  </div>
);

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

const HINT_MESSAGE = "\x1b[1;33mType 'help' for commands. Type 'status' for objectives.\x1b[0m";

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
  const isTopModeRef = useRef(false);
  const editorStateRef = useRef({ content: '', path: '', buffer: '' });
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [mission, setMission] = React.useState<MissionStatus | null>(null);
  const [toast, setToast] = React.useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  
  const playBeep = (freq = 440, type: any = 'sine', duration = 0.1) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) { console.error(e); }
  };

  const prevProgressRef = useRef<number | null>(null);

  useEffect(() => {
      setMission(getMissionStatus());
  }, []);

  useEffect(() => {
    if (mission) {
        // Update Prompt based on Rank
        const rank = mission.rank.toLowerCase();
        promptRef.current = `\x1b[1;32mghost@${rank}\x1b[0m`;

        if (prevProgressRef.current !== null && mission.progress > prevProgressRef.current) {
            playBeep(880, 'square', 0.15);
            setTimeout(() => playBeep(1100, 'square', 0.3), 150);
            
            const msg = `OBJECTIVE COMPLETE. RANK: ${mission.rank.toUpperCase()}`;
            setTimeout(() => {
                setToast({ message: msg, visible: true });
                setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
            }, 0);
            
            // Write to terminal for persistence
            if (termRef.current) {
                termRef.current.writeln('');
                termRef.current.writeln(`\x1b[1;32m[SYSTEM] ${msg}\x1b[0m`);
                termRef.current.writeln(`\x1b[1;36m[HINT] Type 'status' for updated directives.\x1b[0m`);
                termRef.current.writeln('');
                termRef.current.scrollToBottom();
            }
        }
        prevProgressRef.current = mission.progress;
    }
  }, [mission]);

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
          
          // Update mission status
          setMission(getMissionStatus());
          
          if (result.action === 'delay') {
             // Simulate delay
             await new Promise(r => setTimeout(r, 1000));
          }

          if (result.action === 'crack_sim' && result.data) {
             const { target, user, success, password, mode, hash } = result.data;
             const duration = (mode === 'hydra' || mode === 'hashcat' || mode === 'aircrack') ? 6000 : 3000;
             const startTime = Date.now();
             
             if (mode === 'aircrack') {
                 isTopModeRef.current = true;
                 term.clear();
                 term.write('\x1b[?25l'); // Hide cursor
                 
                 while (isTopModeRef.current && Date.now() - startTime < duration) {
                     term.write('\x1b[H');
                     term.writeln('                                 Aircrack-ng 1.6');
                     term.writeln('');
                     term.writeln(`      [00:00:${Math.floor((Date.now() - startTime)/1000).toString().padStart(2,'0')}] 1337 keys tested (420.69 k/s)`);
                     term.writeln('');
                     term.writeln('      Time left: 4 seconds                   Status: Testing');
                     term.writeln('');
                     term.writeln('      Key: [ Testing... ]');
                     
                     await new Promise(r => setTimeout(r, 100));
                 }
                 
                 isTopModeRef.current = false;
                 term.write('\x1b[?25h');
                 term.clear();
                 term.writeln('\x1b[1;32mKEY FOUND! [ 0xDEADBEEF ]\x1b[0m');
                 term.writeln('Decrypted phrase: "deadbeef" (hex)');
                 return;
             }
             
             if (mode === 'hashcat') {
                 isTopModeRef.current = true;
                 term.clear();
                 term.write('\x1b[?25l'); // Hide cursor
                 
                 const speed = (Math.random() * 5000 + 2000).toFixed(1);
                 
                 while (isTopModeRef.current && Date.now() - startTime < duration) {
                     const elapsed = (Date.now() - startTime) / 1000;
                     const progress = ((Date.now() - startTime) / duration * 100).toFixed(2);
                     
                     term.write('\x1b[H');
                     term.writeln(`hashcat (v6.1.1) starting...`);
                     term.writeln('');
                     term.writeln(`Session..........: hashcat`);
                     term.writeln(`Status...........: Running`);
                     term.writeln(`Hash.Name........: SHA256`);
                     term.writeln(`Hash.Target......: ${hash.substring(0, 32)}...`);
                     term.writeln(`Time.Estimated...: 0 mins, ${Math.max(0, 6 - Math.floor(elapsed))} secs`);
                     term.writeln(`Guess.Queue......: 1/1 (100.00%)`);
                     term.writeln(`Speed.#1.........: ${speed} kH/s`);
                     term.writeln(`Recovered........: 0/1 (0.00%) Digests`);
                     term.writeln(`Progress.........: ${Math.floor(Number(speed)*elapsed*1000)}/14344324 (${progress}%)`);
                     term.writeln(`Candidates.#1....: ${Math.floor(Math.random()*999999)} -> ${['password','123456','admin'][Math.floor(Math.random()*3)]}`);
                     
                     await new Promise(r => setTimeout(r, 100));
                 }
                 
                 isTopModeRef.current = false;
                 term.write('\x1b[?25h'); // Show cursor
                 term.clear();
                 term.writeln(`\x1b[1;32m${hash}:red_ledger\x1b[0m`);
                 
                 const fPath = '/home/ghost/hashcat.potfile';
                 if (!VFS[fPath]) VFS[fPath] = { type: 'file', content: `${hash}:red_ledger` };
                 const home = VFS['/home/ghost'];
                 if (home && home.type === 'dir' && !home.children.includes('hashcat.potfile')) {
                     home.children.push('hashcat.potfile');
                 }

             } else if (mode === 'hydra') {
                 term.writeln(`\x1b[1;36m[DATA] max 16 tasks per 1 server, overall 16 tasks, 1435 login tries (l:1/p:1435), ~897 tries per task\x1b[0m`);
                 term.writeln(`\x1b[1;36m[DATA] attacking ssh://${target}:22/\x1b[0m`);
                 term.writeln('');
                 
                 const words = ['123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234', '111111', '1234567', 'dragon', 'admin', 'welcome', '123123', '987654321', '666666', 'monkey', 'letmein', 'orange', 'login', 'sunshine', 'princess', 'football', 'charlie', 'jordan', 'bailey', 'iloveyou', 'starwars', 'killer', 'harley', 'shadow', 'hunter', 'buster', 'robert', 'daniel', 'jessica', 'michael', 'thomas', 'george', 'samantha', 'katherine', 'superman', 'batman', '007', 'mustang', 'secret', 'snoopy', 'tigger', 'master', 'angel', 'lovely', 'cookie', 'soccer', 'hockey', 'baseball', 'tennis', 'amber', 'purple', 'flower', 'jasmine', 'jennifer', 'brittany', 'ashley', 'nicole', 'taylor', 'megan', 'amanda', 'chelsea', 'elizabeth', 'hannah', 'madison', 'rachel', 'sarah', 'kayla', 'alexis', 'victoria', 'morgan', 'hailey', 'destiny', 'summer', 'sierra', 'savannah', 'jasmine', 'andrea', 'melissa', 'rebecca', 'courtney', 'monica', 'veronica', 'danielle', 'natasha'];
                 
                 let tries = 0;
                 while (Date.now() - startTime < duration) {
                     const w = words[Math.floor(Math.random() * words.length)];
                     term.write(`[ATTEMPT] target ${target} - login "${user}" - pass "${w}" - 1 of 1 target completed, 0 valid password found`);
                     tries++;
                     await new Promise(r => setTimeout(r, 100));
                     term.write('\r\x1b[2K'); // Clear line for next attempt
                 }
                 
                 term.writeln('1 of 1 target completed, ' + (success ? '1' : '0') + ' valid password found');
                 if (success) {
                     term.writeln(`\x1b[1;32m[22][ssh] host: ${target}   login: ${user}   password: ${password}\x1b[0m`);
                 }
             } else {
                 const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
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

          if (result.action === 'trace_sim' && result.data) {
             const target = result.data.target;
             const isBlackSite = target.includes('192.168.1.99') || target.includes('black-site') || target.includes('10.66.6.6');
             const hops = isBlackSite ? 12 : Math.floor(Math.random() * 5) + 6;
             
             for (let i = 1; i <= hops; i++) {
                 await new Promise(r => setTimeout(r, 200 + Math.random() * 400));
                 
                 let hopLine = '';
                 const ms1 = (Math.random() * 10).toFixed(3);
                 const ms2 = (Math.random() * 10).toFixed(3);
                 const ms3 = (Math.random() * 10).toFixed(3);
                 
                 if (i === 1) {
                     hopLine = ` 1  gateway (192.168.1.1)  ${ms1} ms  ${ms2} ms  ${ms3} ms`;
                 } else if (i === hops) {
                     if (isBlackSite) {
                         hopLine = ` ${i}  BLACK_SITE_NODE (10.66.6.6)  ${ms1} ms  ${ms2} ms  ${ms3} ms`;
                     } else {
                         hopLine = ` ${i}  ${target} (${target})  ${ms1} ms  ${ms2} ms  ${ms3} ms`;
                     }
                 } else {
                     if (isBlackSite && i > 5) {
                         hopLine = ` ${i}  * * *`; 
                     } else if (isBlackSite && i === 4) {
                         hopLine = ` ${i}  fw-dmz.ghost-net.local (172.16.0.1)  ${ms1} ms  ${ms2} ms  ${ms3} ms`;
                     } else {
                         const randomIP = `10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
                         hopLine = ` ${i}  node-${Math.floor(Math.random()*9999)}.isp.net (${randomIP})  ${ms1} ms  ${ms2} ms  ${ms3} ms`;
                     }
                 }
                 term.writeln(hopLine);
             }
             term.writeln('');
          }

          if (result.action === 'matrix_sim') {
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor
             
             const cols = term.cols;
             const drops = Array(cols).fill(0);
             const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";

             while (isTopModeRef.current) {
                 for (let i = 0; i < cols; i++) {
                     if (Math.random() > 0.975) {
                         drops[i] = 1;
                     }
                     
                     if (drops[i] > 0) {
                         const y = drops[i];
                         if (y < term.rows) {
                             const char = chars[Math.floor(Math.random() * chars.length)];
                             term.write(`\x1b[${y};${i+1}H\x1b[1;32m${char}\x1b[0m`); // Bright Green Head
                             
                             if (y > 1) {
                                 const prevChar = chars[Math.floor(Math.random() * chars.length)];
                                 term.write(`\x1b[${y-1};${i+1}H\x1b[32m${prevChar}\x1b[0m`); // Normal Green
                             }
                             if (y > 2) {
                                 const tailChar = chars[Math.floor(Math.random() * chars.length)];
                                 term.write(`\x1b[${y-2};${i+1}H\x1b[2;32m${tailChar}\x1b[0m`); // Dim Green
                             }
                             if (y > 20) { 
                                 term.write(`\x1b[${y-20};${i+1}H `); // Erase tail
                             }
                             drops[i]++;
                         } else {
                             drops[i] = 0;
                         }
                     }
                 }
                 await new Promise(r => setTimeout(r, 33));
             }
             term.write('\x1b[?25h'); // Show cursor
             term.clear();
          }

          if (result.action === 'netmap_sim') {
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor
             
             const mapFrame = [
                "                     [ INTERNET ]                     ",
                "                          |                           ",
                "                 +--------+--------+                  ",
                "                 |                 |                  ",
                "            [ ISP-A ]         [ ISP-B ]               ",
                "                 |                 |                  ",
                "      +----------+                 +-----------+      ",
                "      |                                        |      ",
                " [ HOME-PC ]                              [ SERVER ]  ",
                "      |                                        |      ",
                "  (Router)                                   (FW)     ",
                "      |                                        |      ",
                " [ IOT-HUB ]                              [ DB-MAIN ] "
             ];
             
             // Simple packet animation paths (row, col)
             const path1 = [[8, 2], [8, 6], [7, 6], [6, 6], [6, 17], [5, 17], [4, 17], [3, 17], [2, 17], [2, 26], [1, 26], [0, 26]]; // Home -> Internet
             const path2 = [[0, 26], [1, 26], [2, 26], [2, 35], [3, 35], [4, 35], [5, 35], [6, 35], [6, 51], [7, 51], [8, 51]]; // Internet -> Server
             
             let tick = 0;
             
             while (isTopModeRef.current) {
                 term.write('\x1b[H'); // Home
                 term.writeln('\x1b[1;36m NETWORK TOPOLOGY MAP v1.0 (Live) \x1b[0m');
                 term.writeln(` Status: \x1b[1;32mONLINE\x1b[0m  Latency: ${(Math.random() * 20 + 10).toFixed(1)}ms`);
                 term.writeln('');
                 
                 for (let r = 0; r < mapFrame.length; r++) {
                     let line = mapFrame[r];
                     // Render packets
                     // Packet 1
                     const p1Pos = path1[tick % path1.length];
                     if (p1Pos && p1Pos[0] === r) {
                         const idx = p1Pos[1];
                         line = line.substring(0, idx) + '\x1b[1;33m*\x1b[0m' + line.substring(idx + 1);
                     }
                     // Packet 2 (offset)
                     const p2Pos = path2[(tick + 5) % path2.length];
                     if (p2Pos && p2Pos[0] === r) {
                         const idx = p2Pos[1];
                         line = line.substring(0, idx) + '\x1b[1;31m*\x1b[0m' + line.substring(idx + 1);
                     }
                     
                     term.writeln(' ' + line);
                 }
                 
                 term.writeln('');
                 term.writeln('\x1b[7m Press "q" to exit map view. \x1b[0m');
                 
                 tick++;
                 await new Promise(r => setTimeout(r, 200));
             }
             term.write('\x1b[?25h'); // Show cursor
             term.clear();
          }

          if (result.action === 'theme_change' && result.data) {
              const { theme } = result.data;
              const themes: Record<string, any> = {
                  green: { background: '#000000', foreground: '#00ff00', cursor: '#00ff00' },
                  amber: { background: '#000000', foreground: '#ffb000', cursor: '#ffb000' },
                  blue: { background: '#000000', foreground: '#00aaff', cursor: '#00aaff' },
                  red: { background: '#110000', foreground: '#ff0000', cursor: '#ff0000' },
                  cyber: { background: '#0a0a1a', foreground: '#00ffff', cursor: '#ff00ff' },
                  bw: { background: '#ffffff', foreground: '#000000', cursor: '#000000' },
              };
              
              const t = themes[theme];
              if (t && termRef.current) {
                  termRef.current.options.theme = t;
                  // Force background update
                  if (terminalContainerRef.current) {
                      terminalContainerRef.current.style.backgroundColor = t.background;
                  }
              }
          }

          if (result.action === 'sat_sim' && result.data) {
             const { target, mode } = result.data;
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor

             if (mode === 'connect') {
                 const duration = 5000;
                 const startTime = Date.now();
                 
                 while (isTopModeRef.current && Date.now() - startTime < duration) {
                     term.write('\x1b[H'); // Home
                     const progress = (Date.now() - startTime) / duration;
                     const bars = Math.floor(progress * 20);
                     const barStr = '='.repeat(bars) + '>'.padEnd(20 - bars, ' ');
                     
                     term.writeln(`\x1b[1;36m[ SATELLITE UPLINK: ${target} ]\x1b[0m`);
                     term.writeln(`Status: ACQUIRING SIGNAL...`);
                     term.writeln(`Signal: [${barStr}] ${Math.floor(progress * 100)}%`);
                     term.writeln('');
                     
                     // Random noise
                     term.writeln(`FREQ: ${(1000 + Math.random() * 500).toFixed(2)} MHz  |  AZ: ${(Math.random() * 360).toFixed(1)}°  |  EL: ${(Math.random() * 90).toFixed(1)}°`);
                     
                     // ASCII globe placeholder (simple circle)
                     term.writeln('');
                     term.writeln('       .---.');
                     term.writeln('     /       \\');
                     term.writeln(`    |    ${['|','/','-','\\'][Math.floor((Date.now() / 200) % 4)]}    |`);
                     term.writeln('     \\       /');
                     term.writeln('       \'---\'');
                     
                     await new Promise(r => setTimeout(r, 100));
                 }
                 
                 term.write('\x1b[H');
                 term.clear();
                 term.writeln(`\x1b[1;32m[CONNECTED] Uplink Established to ${target}.\x1b[0m`);
                 term.writeln('Auth Token: 0x' + Math.floor(Math.random() * 1000000).toString(16).toUpperCase());
             } else if (mode === 'download') {
                  const duration = 4000;
                  const startTime = Date.now();
                  while (isTopModeRef.current && Date.now() - startTime < duration) {
                       term.write('\x1b[H'); // Home
                       const progress = (Date.now() - startTime) / duration;
                       const bytes = Math.floor(progress * 1024 * 1024);
                       term.writeln(`Downloading ${target}...`);
                       term.writeln(`Received: ${(bytes / 1024).toFixed(1)} KB`);
                       
                       const loadBar = '#'.repeat(Math.floor(progress * 40));
                       term.writeln(`[${loadBar.padEnd(40, ' ')}]`);

                       await new Promise(r => setTimeout(r, 100));
                  }
                  
                  // Reveal file content
                  if (target === 'IMAGERY_001' || target === 'img_001') {
                      term.clear();
                      term.writeln('\x1b[1;32m[IMAGE DECODED]\x1b[0m');
                      term.writeln(`
      .                  .-.    .  _   *     _   .
           *          /   \\     ((       _/ \\       *
         _    .   .--'\\/\\_ \\     \`      /    \\  *    .
     *  / \\_    _/ ^      \\/\\'__        /\\/\\  /\\  _
       /    \\  /    .'   _/  /  \\  *' /    \\/  \\/ \\
      /\\/\\  /\\/ .'__  _   /  ^ /  _   /    '      \\
      /    \\/   \\/    \\/ \\/    \\/  \\ /              \\
      --------------------------------------------------
      TARGET LOCATION: [REDACTED]
      THERMAL SIGNATURE DETECTED: HIGH
                      `);
                      
                      // Save file to VFS
                      const fPath = `/home/ghost/downloads/${target}.txt`;
                      if (!VFS['/home/ghost/downloads']) VFS['/home/ghost/downloads'] = { type: 'dir', children: [] };
                      VFS[fPath] = { type: 'file', content: 'THERMAL_MAP_DATA_V2\n[BINARY DATA HIDDEN]' };
                      const dlDir = VFS['/home/ghost/downloads'];
                      if (dlDir.type === 'dir' && !dlDir.children.includes(`${target}.txt`)) {
                          dlDir.children.push(`${target}.txt`);
                      }
                  } else if (target === 'LOG_V2.txt') {
                      term.clear();
                      const content = `[LOG START]
[14:00] Initializing uplink...
[14:01] Auth failure (Sector 7)
[14:02] Redirecting to backup node...
[14:05] User 'Spectre' accessed file 'KEYS.enc'
[LOG END]`;
                      term.writeln(content);
                      
                      const fPath = `/home/ghost/downloads/${target}`;
                      if (!VFS['/home/ghost/downloads']) VFS['/home/ghost/downloads'] = { type: 'dir', children: [] };
                      VFS[fPath] = { type: 'file', content };
                      const dlDir = VFS['/home/ghost/downloads'];
                      if (dlDir.type === 'dir' && !dlDir.children.includes(target)) {
                          dlDir.children.push(target);
                      }
                  } else if (target === 'KEYS.enc') {
                      term.clear();
                      const content = `[ENCRYPTED] Use 'decrypt KEYS.enc [password]'`;
                      term.writeln(content);
                      
                      const fPath = `/home/ghost/downloads/${target}`;
                      if (!VFS['/home/ghost/downloads']) VFS['/home/ghost/downloads'] = { type: 'dir', children: [] };
                      // Hint: Password is 'Spectre' based on log? Or something else.
                      // Let's use base64 encoded content that decrypts to a flag.
                      // Flag: GHOST_ROOT{SATELLITE_HACK_COMPLETE}
                      VFS[fPath] = { type: 'file', content: btoa('GHOST_ROOT{SATELLITE_HACK_COMPLETE}') }; 
                      const dlDir = VFS['/home/ghost/downloads'];
                      if (dlDir.type === 'dir' && !dlDir.children.includes(target)) {
                          dlDir.children.push(target);
                      }
                  } else if (target === 'launch_codes.bin') {
                      term.clear();
                      term.writeln('\x1b[1;31m[WARNING] CLASSIFIED WEAPON SYSTEM DETECTED\x1b[0m');
                      term.writeln('Verifying integrity... [OK]');
                      
                      const fPath = `/home/ghost/downloads/${target}`;
                      if (!VFS['/home/ghost/downloads']) VFS['/home/ghost/downloads'] = { type: 'dir', children: [] };
                      VFS[fPath] = { type: 'file', content: '[BINARY_ELF_X86_64: DOOMSDAY_PROTOCOL_V666]\n(Execute to initiate Global Reset)' };
                      const dlDir = VFS['/home/ghost/downloads'];
                      if (dlDir.type === 'dir' && !dlDir.children.includes(target)) {
                          dlDir.children.push(target);
                      }
                  } else {
                      term.clear();
                      term.writeln(`Download complete. File saved to /home/ghost/downloads/${target}`);
                      // Save generic file
                      const fPath = `/home/ghost/downloads/${target}`;
                      if (!VFS['/home/ghost/downloads']) VFS['/home/ghost/downloads'] = { type: 'dir', children: [] };
                      VFS[fPath] = { type: 'file', content: `[Downloaded Content for ${target}]` };
                      const dlDir = VFS['/home/ghost/downloads'];
                      if (dlDir.type === 'dir' && !dlDir.children.includes(target)) {
                          dlDir.children.push(target);
                      }
                  }
             }

             isTopModeRef.current = false;
             term.write('\x1b[?25h'); // Show cursor
             term.writeln('');
             term.writeln('\x1b[7m[SAT] Uplink Terminated.\x1b[0m');
          }

          if (result.action === 'radio_sim' && result.data) {
             const { mode, freq } = result.data;
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor

             if (mode === 'scan') {
                 const startFreq = 87.5;
                 const endFreq = 108.0;
                 let current = startFreq;
                 
                 while (isTopModeRef.current && current < endFreq) {
                     term.write('\x1b[H'); // Home
                     term.writeln('\x1b[1;35m[ RADIO SPECTRUM ANALYZER v1.0 ]\x1b[0m');
                     term.writeln('');
                     
                     current += 0.1;
                     const strength = (Math.abs(current - 89.9) < 0.2) ? 90 + Math.random() * 10 : Math.random() * 10;
                     const bars = '#'.repeat(Math.floor(strength / 2));
                     
                     term.writeln(`FREQ: ${current.toFixed(1)} MHz`);
                     term.writeln(`STR : [${bars.padEnd(50, ' ')}] ${(strength).toFixed(1)} dB`);
                     
                     if (strength > 50) {
                         term.writeln(`\x1b[1;32mSIGNAL DETECTED\x1b[0m`);
                     } else {
                         term.writeln(`Scanning...`);
                     }
                     
                     await new Promise(r => setTimeout(r, 50));
                 }
                 
                 term.writeln('');
                 term.writeln('Scan complete. Found signal at 89.9 MHz.');
             } else if (mode === 'tune') {
                 const targetFreq = parseFloat(freq);
                 const isSignal = Math.abs(targetFreq - 89.9) < 0.2;
                 
                 while (isTopModeRef.current) {
                     term.write('\x1b[H');
                     term.writeln(`\x1b[1;35m[ TUNER: ${targetFreq.toFixed(1)} MHz ]\x1b[0m`);
                     
                     // Visualize waveform
                     let wave = '';
                     for (let i = 0; i < term.cols; i++) {
                         const v = isSignal 
                            ? Math.sin(i * 0.2 + Date.now() * 0.01) * 5 
                            : Math.random() * 2;
                         wave += (v > 2) ? '^' : (v < -2 ? '_' : '-');
                     }
                     term.writeln(wave.substring(0, term.cols));
                     
                     if (isSignal) {
                         term.writeln(`\n\x1b[1;32mDECODING AUDIO STREAM...\x1b[0m`);
                         term.writeln(`MSG: "The... key... is... hidden... in... the... noise..."`);
                         term.writeln(`CODE: GHOST_ROOT{RADI0_SILENC3_BR0K3N}`);
                     } else {
                         term.writeln(`\n[STATIC]`);
                     }
                     term.writeln(`\nPress 'q' to stop.`);
                     
                     await new Promise(r => setTimeout(r, 100));
                 }
             }
             
             isTopModeRef.current = false;
             term.write('\x1b[?25h');
             term.clear();
          }

          if (result.action === 'top_sim') {
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor
             
             while (isTopModeRef.current) {
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
                 term.write('\r\n\r\n\x1b[7m[top] Running... Press "q" to exit.\x1b[0m');
                 await new Promise(r => setTimeout(r, 1000));
             }
             term.write('\x1b[?25h'); // Show cursor
             term.clear();
          }

          if (result.action === 'tcpdump_sim') {
             isTopModeRef.current = true;
             term.writeln('');
             term.writeln('tcpdump: verbose output suppressed, use -v or -vv for full protocol decode');
             term.writeln('listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes');
             
             const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'SSH', 'TLSv1.3'];
             const srcIPs = ['192.168.1.105', '192.168.1.1', '10.0.0.5', '172.16.0.1', '8.8.8.8'];
             const dstIPs = ['192.168.1.5', '192.168.1.99', '10.66.6.6', '1.1.1.1', '192.168.1.255'];
             
             while (isTopModeRef.current) {
                 const now = new Date();
                 const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(6,'0')}`;
                 const proto = protocols[Math.floor(Math.random() * protocols.length)];
                 const src = srcIPs[Math.floor(Math.random() * srcIPs.length)];
                 const dst = dstIPs[Math.floor(Math.random() * dstIPs.length)];
                 const len = Math.floor(Math.random() * 1500);
                 
                 let info = `length ${len}`;
                 let color = '\x1b[0m'; // Default
                 
                 if (dst.includes('99') || src.includes('99') || dst.includes('6.6') || src.includes('6.6')) {
                     color = '\x1b[1;31m'; // Red for Black Site
                     info += ' [SUSPICIOUS TRAFFIC]';
                 } else if (proto === 'SSH') {
                     color = '\x1b[1;33m'; // Yellow
                     info += ' [Encrypted Packet]';
                 } else if (proto === 'HTTP') {
                     color = '\x1b[1;34m'; // Blue
                     info += ' GET /admin/login.php';
                 }
                 
                 term.writeln(`${color}${timeStr} IP ${src} > ${dst}: ${proto} ${info}\x1b[0m`);
                 
                 // Occasional hex dump
                 if (Math.random() > 0.85) {
                     term.writeln(`\t0x0000:  4500 003c 1a2b 4000 4006 b00b c0a8 0105`);
                     term.writeln(`\t0x0010:  c0a8 0163 0016 c40e aabb ccdd 5018 1000`);
                 }
                 
                 await new Promise(r => setTimeout(r, Math.random() * 400 + 100));
             }
             term.writeln('');
             term.writeln('24 packets captured');
             term.writeln('24 packets received by filter');
             term.writeln('0 packets dropped by kernel');
          }

          if (result.action === 'intercept_sim' && result.data) {
             const { freq } = result.data;
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor

             const targetFreq = parseFloat(freq);
             const isValid = !isNaN(targetFreq) && Math.abs(targetFreq - 14.2) < 0.1;
             
             let buffer: string[] = [];
             const conversation = [
                 { user: 'OVERLORD', text: 'Status report.', delay: 1000 },
                 { user: 'ASSET_9', text: 'Package secured. Moving to exfil point.', delay: 2000 },
                 { user: 'OVERLORD', text: 'Any resistance?', delay: 1500 },
                 { user: 'ASSET_9', text: 'Negative. Perimeter was clear.', delay: 2000 },
                 { user: 'OVERLORD', text: 'Good. The code for the safe house is 7-2-1-9.', delay: 3000 },
                 { user: 'ASSET_9', text: 'Copy. 7219. Out.', delay: 1000 }
             ];

             const startTime = Date.now();
             let msgIndex = 0;
             let lastMsgTime = 0;

             while (isTopModeRef.current) {
                 term.write('\x1b[H'); // Home
                 term.writeln(`\x1b[1;31m[ SIGNAL INTERCEPTOR v2.4 ]\x1b[0m`);
                 term.writeln(`Target: ${freq} MHz | Encryption: AES-256 (Broken)`);
                 term.writeln('--------------------------------------------------');
                 
                 if (isValid) {
                     if (msgIndex < conversation.length) {
                         const msg = conversation[msgIndex];
                         if (Date.now() - lastMsgTime > msg.delay) {
                             buffer.push(`\x1b[1;33m[${msg.user}]\x1b[0m: ${msg.text}`);
                             msgIndex++;
                             lastMsgTime = Date.now();
                         }
                     }
                 } else {
                     if (Math.random() > 0.8) {
                         buffer.push(`\x1b[2m[STATIC] ...${Math.random().toString(36).substring(7)}...\x1b[0m`);
                     }
                 }

                 // Keep buffer size limited
                 if (buffer.length > 15) buffer.shift();

                 for (const line of buffer) {
                     term.writeln(line);
                 }
                 
                 // Fill rest with blank
                 for (let i = buffer.length; i < 15; i++) {
                     term.writeln('');
                 }

                 term.writeln('--------------------------------------------------');
                 term.writeln('\x1b[7m Press "q" to stop intercept. \x1b[0m');
                 
                 await new Promise(r => setTimeout(r, 100));
             }
             
             isTopModeRef.current = false;
             term.write('\x1b[?25h');
             term.clear();
          }

          if (result.action === 'drone_sim' && result.data) {
             const { id } = result.data;
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor

             const duration = 60000; // 60s
             const startTime = Date.now();
             let battery = 100;
             let alt = 0;
             
             while (isTopModeRef.current && Date.now() - startTime < duration) {
                 term.write('\x1b[H'); // Home
                 
                 const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
                 battery -= 0.1;
                 if (alt < 50) alt += 2;
                 
                 term.writeln(`\x1b[1;36m[DRONE CONTROL LINK] ID: ${id} \x1b[0m  ${timeStr}`);
                 term.writeln(`BATTERY: ${battery.toFixed(1)}%  ALT: ${alt}m  SPD: 12km/h  SIG: 88%`);
                 term.writeln('--------------------------------------------------');
                 
                 // Render simple ASCII view (First Person View)
                 const ground = Math.floor(Date.now() / 200) % 3;
                 if (ground === 0) {
                     term.writeln('          +           ');
                     term.writeln('                      ');
                     term.writeln('      _|_             ');
                     term.writeln('     /   \\    [BUILDING]');
                     term.writeln('    |     |           ');
                 } else if (ground === 1) {
                     term.writeln('                      ');
                     term.writeln('          +           ');
                     term.writeln('      _|_             ');
                     term.writeln('     /   \\    [BUILDING]');
                     term.writeln('    |     |           ');
                 } else {
                     term.writeln('                      ');
                     term.writeln('                      ');
                     term.writeln('          +           ');
                     term.writeln('      _|_             ');
                     term.writeln('     /   \\    [BUILDING]');
                 }
                 
                 term.writeln('    |     |           ');
                 term.writeln('    |_____|           ');
                 term.writeln('--------------------------------------------------');
                 term.writeln('[HUD] [REC] [NIGHT_VISION: ON]');
                 term.writeln('');
                 term.writeln(`\x1b[7m Press "q" to land and disconnect. \x1b[0m`);
                 
                 await new Promise(r => setTimeout(r, 200));
             }
             
             isTopModeRef.current = false;
             term.write('\x1b[?25h');
             term.clear();
          }

          if (result.action === 'win_sim') {
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor

             const duration = 5000;
             const startTime = Date.now();
             const colors = ['\x1b[32m', '\x1b[37m', '\x1b[92m'];
             
             const winArt = [
                 "   _____ __  __  _____ _______ ______ __  __ ",
                 "  / ____|  \\/  |/ ____|__   __|  ____|  \\/  |",
                 " | (___ | \\  / | (___    | |  | |__  | \\  / |",
                 "  \\___ \\| |\\/| |\\___ \\   | |  |  __| | |\\/| |",
                 "  ____) | |  | |____) |  | |  | |____| |  | |",
                 " |_____/|_|  |_|_____/   |_|  |______|_|  |_|",
                 "                                             ",
                 "      L I B E R A T E D   P R O T O C O L     "
             ];
             
             // Animation Loop
             while (isTopModeRef.current && Date.now() - startTime < duration) {
                 // Random Glitch Effect
                 const row = Math.floor(Math.random() * term.rows);
                 const col = Math.floor(Math.random() * term.cols);
                 const char = (Math.random() > 0.5 ? '1' : '0');
                 const color = colors[Math.floor(Math.random() * colors.length)];
                 term.write(`\x1b[${row};${col}H${color}${char}\x1b[0m`);
                 
                 // Keep Art Visible
                 const startRow = Math.floor(term.rows / 2) - 4;
                 const startCol = Math.max(0, Math.floor(term.cols / 2) - 25);
                 for (let i = 0; i < winArt.length; i++) {
                     if (startRow + i < term.rows && startRow + i >= 0) {
                         term.write(`\x1b[${startRow + i};${startCol}H\x1b[1;37;40m${winArt[i]}\x1b[0m`);
                     }
                 }
                 await new Promise(r => setTimeout(r, 50));
             }
             
             term.clear();
             term.write('\x1b[H'); // Home
             
             // Final Static Screen
             for (let i = 0; i < winArt.length; i++) {
                 term.writeln(`\x1b[1;32m${winArt[i]}\x1b[0m`);
             }
             term.writeln('');
             term.writeln('\x1b[1;37mCONGRATULATIONS, AGENT.\x1b[0m');
             term.writeln('\x1b[1;37mYou have successfully rooted the system and exposed the Ghost Protocol.\x1b[0m');
             term.writeln('');
             term.writeln('\x1b[1;34m[MISSION ACCOMPLISHED]\x1b[0m');
             term.writeln('');
             term.writeln('\x1b[7m Press "q" to reboot system. \x1b[0m');
             
             // Wait for user to quit
             while (isTopModeRef.current) {
                 await new Promise(r => setTimeout(r, 100));
             }
             
             // Reboot
             window.location.reload();
             return;
          }

          if (result.action === 'medscan_sim') {
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor
             
             const duration = 10000;
             const startTime = Date.now();
             
             while (isTopModeRef.current && Date.now() - startTime < duration) {
                 term.write('\x1b[H'); // Home
                 
                 const hr = Math.floor(60 + Math.random() * 10);
                 const spo2 = Math.floor(95 + Math.random() * 4);
                 const temp = (36.5 + Math.random() * 0.2).toFixed(1);
                 
                 term.writeln(`\x1b[1;36m[ BIOMETRIC MONITORING SYSTEM v4.2 ]\x1b[0m`);
                 term.writeln(`Subject: UNKNOWN_MALE_01`);
                 term.writeln(`Status:  \x1b[1;32mSTABLE\x1b[0m`);
                 term.writeln('');
                 
                 // Heart Rate Graph
                 let graph = '';
                 const width = 40;
                 for (let i = 0; i < width; i++) {
                     // Simple EKG pulse simulation
                     const tick = (Date.now() / 100 + i) % 20;
                     if (tick > 18) graph += '^'; // P wave
                     else if (tick < 2) graph += '|'; // QRS complex (tall)
                     else if (tick > 3 && tick < 6) graph += 'v'; // T wave
                     else graph += '_'; // Baseline
                 }
                 
                 term.writeln(`HR:   [ ${hr} bpm ]  \x1b[1;32m${graph}\x1b[0m`);
                 term.writeln(`SpO2: [ ${spo2} % ]    (Oxygen Saturation)`);
                 term.writeln(`TEMP: [ ${temp} °C ]`);
                 term.writeln('');
                 
                 // Neural Sync (Lore)
                 const sync = (Math.random() * 100).toFixed(1);
                 term.writeln(`NEURAL_INTERFACE_LINK: \x1b[1;33m${sync}%\x1b[0m`);
                 
                 if (Math.random() > 0.95) {
                     term.writeln(`\x1b[1;31m[WARNING] Adrenaline spike detected.\x1b[0m`);
                 } else {
                     term.writeln(`\x1b[2mScanning...\x1b[0m`);
                 }
                 
                 term.writeln('');
                 const timeLeft = Math.max(0, Math.floor((duration - (Date.now() - startTime)) / 1000));
                 term.writeln(`Auto-disconnect in ${timeLeft}s...`);
                 
                 await new Promise(r => setTimeout(r, 100));
             }
             
             isTopModeRef.current = false;
             term.write('\x1b[?25h');
             term.clear();
             term.writeln('Biometric scan complete. Data logged to /var/log/med_scan.log');
             
             // Log to file
             const logPath = '/var/log/med_scan.log';
             if (!VFS[logPath]) VFS[logPath] = { type: 'file', content: `SCAN_DATE: ${new Date().toISOString()}\nHR: 72\nBP: 120/80\nNOTES: Subject appears to be hallucinating.` };
             const logDir = VFS['/var/log'];
             if (logDir.type === 'dir' && !logDir.children.includes('med_scan.log')) {
                 logDir.children.push('med_scan.log');
             }
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

          if (result.action === 'irc_sim' && result.data) {
             const { server, channel, nick } = result.data;
             isTopModeRef.current = true; // Use top mode to hijack input loop logic if we wanted, but we'll use a custom loop here
             
             term.clear();
             term.writeln(`\x1b[1;36m[IRC] Connecting to ${server}...\x1b[0m`);
             await new Promise(r => setTimeout(r, 800));
             term.writeln(`[${server}] *** Looking up your hostname...`);
             await new Promise(r => setTimeout(r, 600));
             term.writeln(`[${server}] *** Found your hostname`);
             term.writeln(`[${server}] *** You are connected to Black Site IRC Network`);
             await new Promise(r => setTimeout(r, 500));
             
             // Initial channel join
             term.writeln(`\x1b[1;32m*** Joined ${channel}\x1b[0m`);
             
             if (channel === '#shadow_ops') {
                 term.writeln(`Topic: OPERATION BLACKOUT - PHASE 2 [ACTIVE]`);
                 term.writeln(`Users: @Spectre, +Watcher, Admin, ${nick}`);
                 term.writeln('');
                 term.writeln(`[14:02] <Spectre> Breach detected in Sector 7.`);
                 term.writeln(`[14:03] <Watcher> Is it the Ghost?`);
                 term.writeln(`[14:04] <Admin> Likely. Monitor feed 03.`);
                 term.writeln(`[14:06] <System> User ${nick} joined.`);
                 term.writeln(`[14:06] <Admin> ...who is this?`);
                 await new Promise(r => setTimeout(r, 1000));
                 term.writeln(`\x1b[1;31m*** ${nick} was kicked by Admin (Unauthorized access)\x1b[0m`);
                 term.writeln(`\x1b[1;31m*** Disconnected from ${server}\x1b[0m`);
             } else {
                 // Lobby logic
                 term.writeln(`Topic: General discussion`);
                 term.writeln(`Users: Guest1, Guest2, ${nick}`);
                 term.writeln('');
                 term.writeln(`[14:00] <Guest1> Any idea how to solve the matrix puzzle?`);
                 term.writeln(`[14:01] <Guest2> Try 'man matrix'.`);
                 term.writeln(`[14:02] <Guest1> Thanks.`);
                 term.writeln('');
                 term.writeln(`\x1b[7m[IRC] Type '/quit' to exit. Type '/join #channel' to switch.\x1b[0m`);
                 
                 // Fake interactive loop
                 // Since we don't have a real separate input state for IRC, we'll just simulate a "read-only" view that exits on any key for now, 
                 // OR we hijack isTopModeRef to be a "chat mode".
                 // Let's make it simple: wait for 'q' or '/quit' isn't easy without refactoring input handler.
                 // So we'll just wait a bit and then show a prompt simulation.
                 
                 term.writeln(`[${nick}] `);
                 // We rely on the user pressing 'q' to exit "top mode" which this is technically using
                 term.writeln(`\n(Press 'q' to disconnect)`);
             }
             
             // Wait for exit
             while (isTopModeRef.current) {
                 await new Promise(r => setTimeout(r, 100));
             }
             
             term.clear();
             term.writeln('Connection closed.');
          }

          if (result.action === 'sqlmap_sim' && result.data) {
             const { target } = result.data;
             isTopModeRef.current = true;
             
             term.writeln('');
             term.writeln(`\x1b[1;33m        ___
       __H__
 ___ ___[.]_____ ___ ___  {1.5.2#stable}
|_ -| . [.]     | .'| . |
|___|_  [.]_|_|_|__,|  _|
      |_|V...       |_|   http://sqlmap.org\x1b[0m`);
             term.writeln('');
             term.writeln(`[*] starting at ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`);
             term.writeln('');
             term.writeln(`[INFO] testing connection to the target URL`);
             await new Promise(r => setTimeout(r, 1000));
             
             if (target.includes('admin/login.php') || target.includes('192.168.1.5') || target.includes('192.168.1.99')) {
                 term.writeln(`[INFO] testing if the target URL content is stable`);
                 await new Promise(r => setTimeout(r, 800));
                 term.writeln(`[INFO] target URL content is stable`);
                 term.writeln(`[INFO] testing if GET parameter 'id' is dynamic`);
                 await new Promise(r => setTimeout(r, 800));
                 term.writeln(`[INFO] confirming that GET parameter 'id' is dynamic`);
                 term.writeln(`[INFO] GET parameter 'id' is dynamic`);
                 
                 const injections = [
                     "boolean-based blind - WHERE or HAVING clause",
                     "error-based - WHERE or HAVING clause",
                     "UNION query - ORDER BY clause",
                     "stacked queries"
                 ];
                 
                 for (const inj of injections) {
                     term.writeln(`[INFO] testing '${inj}'`);
                     await new Promise(r => setTimeout(r, Math.random() * 1000 + 500));
                 }
                 
                 term.writeln(`\x1b[1;32m[+] GET parameter 'id' is 'MySQL > 5.0.12' injectable \x1b[0m`);
                 term.writeln(`[INFO] the back-end DBMS is MySQL`);
                 term.writeln(`[INFO] fetching database names`);
                 await new Promise(r => setTimeout(r, 1000));
                 
                 term.writeln(`available databases [2]:`);
                 term.writeln(`[*] information_schema`);
                 term.writeln(`[*] admin_db`);
                 
                 term.writeln(`\n[INFO] fetching tables for database: 'admin_db'`);
                 await new Promise(r => setTimeout(r, 1000));
                 term.writeln(`Database: admin_db`);
                 term.writeln(`[1 table]`);
                 term.writeln(`+-------------+`);
                 term.writeln(`| users       |`);
                 term.writeln(`+-------------+`);
                 
                 term.writeln(`\n[INFO] fetching columns for table 'users'`);
                 await new Promise(r => setTimeout(r, 1000));
                 term.writeln(`Database: admin_db`);
                 term.writeln(`Table: users`);
                 term.writeln(`[2 columns]`);
                 term.writeln(`+----------+-------------+`);
                 term.writeln(`| Column   | Type        |`);
                 term.writeln(`+----------+-------------+`);
                 term.writeln(`| username | varchar(50) |`);
                 term.writeln(`| password | varchar(64) |`);
                 term.writeln(`+----------+-------------+`);

                 term.writeln(`\n[INFO] dumping table 'users'`);
                 await new Promise(r => setTimeout(r, 1500));
                 
                 term.writeln(`Database: admin_db`);
                 term.writeln(`Table: users`);
                 term.writeln(`[1 entry]`);
                 term.writeln(`+----------+------------------------------------------------------------------+`);
                 term.writeln(`| username | password                                                         |`);
                 term.writeln(`+----------+------------------------------------------------------------------+`);
                 
                 if (target.includes('192.168.1.99')) {
                     term.writeln(`| admin    | 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8 |`);
                     term.writeln(`+----------+------------------------------------------------------------------+`);
                     // SHA256 for 'password'
                     term.writeln(`\n[INFO] table 'admin_db.users' dumped to CSV file '/home/ghost/dump.csv'`);
                     // Save to VFS
                     const dumpPath = '/home/ghost/dump.csv';
                     VFS[dumpPath] = { type: 'file', content: 'username,password\nadmin,5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' };
                     const home = VFS['/home/ghost'];
                     if (home && home.type === 'dir' && !home.children.includes('dump.csv')) {
                         home.children.push('dump.csv');
                     }
                 } else {
                     term.writeln(`| admin    | 5f4dcc3b5aa765d61d8327deb882cf99                                 |`); // password
                     term.writeln(`+----------+------------------------------------------------------------------+`);
                     const dumpPath = '/home/ghost/dump.csv';
                     VFS[dumpPath] = { type: 'file', content: 'username,password\nadmin,password' };
                     const home = VFS['/home/ghost'];
                     if (home && home.type === 'dir' && !home.children.includes('dump.csv')) {
                         home.children.push('dump.csv');
                     }
                 }

             } else {
                 term.writeln(`[CRITICAL] all tested parameters do not appear to be injectable.`);
                 term.writeln(`[INFO] shutting down`);
             }
             
             isTopModeRef.current = false;
          }

          if (result.action === 'tor_sim' && result.data) {
             const { mode, url } = result.data;
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor

             if (mode === 'start') {
                 const steps = [
                     "Bootstrapping 0%: Starting",
                     "Bootstrapping 5%: Connecting to directory server",
                     "Bootstrapping 10%: Finishing handshake with directory server",
                     "Bootstrapping 15%: Establishing an encrypted directory connection",
                     "Bootstrapping 20%: Asking for networkstatus consensus",
                     "Bootstrapping 25%: Loading networkstatus consensus",
                     "Bootstrapping 40%: Loading authority key certs",
                     "Bootstrapping 45%: Asking for relay descriptors",
                     "Bootstrapping 50%: Loading relay descriptors",
                     "Bootstrapping 80%: Connecting to the Tor network",
                     "Bootstrapping 90%: Establishing a Tor circuit",
                     "Bootstrapping 100%: Done"
                 ];
                 
                 term.writeln(`\x1b[1;35m[Tor] Initializing Daemon...\x1b[0m`);
                 for (const step of steps) {
                     if (!isTopModeRef.current) break;
                     term.writeln(`[NOTICE] ${step}`);
                     await new Promise(r => setTimeout(r, Math.random() * 800 + 200));
                 }
                 
                 if (isTopModeRef.current) {
                     term.writeln('');
                     term.writeln(`\x1b[1;32m[SUCCESS] Connected to Tor Network.\x1b[0m`);
                     term.writeln(`IP: 127.0.0.1:9050 (Socks5)`);
                     
                     // Create lock file
                     const fPath = '/var/run/tor.pid';
                     if (!VFS['/var/run']) VFS['/var/run'] = { type: 'dir', children: [] };
                     VFS[fPath] = { type: 'file', content: '6666' };
                     const runDir = VFS['/var/run'];
                     if (runDir.type === 'dir' && !runDir.children.includes('tor.pid')) {
                         runDir.children.push('tor.pid');
                     }
                 }
                 
             } else if (mode === 'browse') {
                 const duration = 2000;
                 // Loading simulation
                 term.writeln(`Resolving ${url}...`);
                 await new Promise(r => setTimeout(r, 1000));
                 term.writeln(`Connecting to hidden service...`);
                 await new Promise(r => setTimeout(r, 1000));
                 
                 term.clear();
                 // TUI Browser Interface
                 const renderBrowser = (content: string[]) => {
                     term.write('\x1b[H');
                     term.writeln(`\x1b[1;37;45m TOR BROWSER v11.5.8 \x1b[0m \x1b[1;30;47m ${url.padEnd(40)} \x1b[0m`);
                     term.writeln('┌──────────────────────────────────────────────────────────────────────────────┐');
                     content.forEach(line => term.writeln(`│ ${line.padEnd(76)} │`));
                     for(let i=content.length; i<15; i++) term.writeln(`│ ${''.padEnd(76)} │`);
                     term.writeln('└──────────────────────────────────────────────────────────────────────────────┘');
                     term.writeln(' [Q] Quit  [R] Reload');
                 };

                 let pageContent: string[] = [];
                 
                 if (url.includes('silkroad')) {
                     pageContent = [
                         "",
                         "        \x1b[1;31mTHIS HIDDEN SITE HAS BEEN SEIZED\x1b[0m",
                         "",
                         "           by the Federal Bureau of Investigation",
                         "              in conjunction with the DOJ",
                         "",
                         "                  ( U S D O J )",
                         "",
                         "         Illegal narcotics are prohibited.",
                         ""
                     ];
                 } else if (url.includes('cicada') || url.includes('3301')) {
                     pageContent = [
                         "",
                         "   \x1b[1;32m       .   .\x1b[0m",
                         "   \x1b[1;32m      / \\ / \\\x1b[0m",
                         "   \x1b[1;32m     (   Y   )\x1b[0m     WELCOME PILGRIM.",
                         "   \x1b[1;32m      \\  |  /\x1b[0m",
                         "   \x1b[1;32m      /  |  \\\x1b[0m      The path lies in the shadow.",
                         "   \x1b[1;32m     (   |   )\x1b[0m",
                         "   \x1b[1;32m      \\  |  /\x1b[0m      KEY: 0xCAFEBABE",
                         "   \x1b[1;32m       ' | '\x1b[0m",
                         "",
                         "     To continue, you must decrypt the",
                         "     evidence file using the key above."
                     ];
                 } else if (url.includes('ghost')) {
                     pageContent = [
                         "",
                         "   \x1b[1;34m[ GHOST DROP DEAD DROP ]\x1b[0m",
                         "",
                         "   Latest Dumps:",
                         "   - admin_pass.txt  (0.2 BTC)",
                         "   - zero_day.c      (5.0 BTC)",
                         "   - black_site_map  (10 BTC)",
                         "",
                         "   \x1b[1;31mStatus: OFFLINE (Maintenance)\x1b[0m"
                     ];
                 } else {
                     pageContent = [
                         "",
                         "   \x1b[1;31m404 Not Found\x1b[0m",
                         "",
                         "   The onion site you are trying to reach",
                         "   is unreachable or does not exist.",
                         ""
                     ];
                 }

                 renderBrowser(pageContent);

                 // Wait for exit
                 while (isTopModeRef.current) {
                     await new Promise(r => setTimeout(r, 100));
                 }
             }

             isTopModeRef.current = false;
             term.write('\x1b[?25h'); // Show cursor
             term.clear();
          }

          if (result.action === 'tor_sim' && result.data) {
             const { mode, url } = result.data;
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor

             if (mode === 'start') {
                 const steps = [
                     "Bootstrapping 0%: Starting",
                     "Bootstrapping 5%: Connecting to directory server",
                     "Bootstrapping 10%: Finishing handshake with directory server",
                     "Bootstrapping 15%: Establishing an encrypted directory connection",
                     "Bootstrapping 20%: Asking for networkstatus consensus",
                     "Bootstrapping 25%: Loading networkstatus consensus",
                     "Bootstrapping 40%: Loading authority key certs",
                     "Bootstrapping 45%: Asking for relay descriptors",
                     "Bootstrapping 50%: Loading relay descriptors",
                     "Bootstrapping 80%: Connecting to the Tor network",
                     "Bootstrapping 90%: Establishing a Tor circuit",
                     "Bootstrapping 100%: Done"
                 ];
                 
                 for (const step of steps) {
                     term.writeln(`[NOTICE] ${step}`);
                     await new Promise(r => setTimeout(r, Math.random() * 500 + 200));
                 }
                 
                 // Create PID file
                 if (!VFS['/var/run']) VFS['/var/run'] = { type: 'dir', children: [] };
                 VFS['/var/run/tor.pid'] = { type: 'file', content: '6666' };
                 const runDir = VFS['/var/run'];
                 if (runDir.type === 'dir' && !runDir.children.includes('tor.pid')) {
                     runDir.children.push('tor.pid');
                 }
                 
                 term.writeln('');
                 term.writeln('Tor is ready. Use "tor browse <url>" to surf.');
             } else if (mode === 'browse') {
                 term.write('\x1b[H'); // Home
                 term.writeln('\x1b[1;35mTor Browser 11.5.1 (Alpha)\x1b[0m');
                 term.writeln('Connecting to onion site...');
                 
                 await new Promise(r => setTimeout(r, 2000));
                 term.clear();
                 term.write('\x1b[H');
                 
                 if (url === 'silkroad7.onion') {
                     term.writeln(`\x1b[1;32m
      .d88888b.  888 888 888      8888888b.                   888
     d88P" "Y88b 888 888 888      888   Y88b                  888
     Y88b.       888 888 888      888    888                  888
      "Y88888b.  888 888 888  888 888   d88P  .d88b.   8888b. 888
            "Y88b 888 888 888 .88P 8888888P"  d88""88b     "88b 888
              "888 888 888 888888K  888 T88b   888  888 .d888888 888
      Y88b  d88P 888 888 888 "88b 888  T88b  Y88..88P 888  888 888
       "Y88888P"  888 888 888  888 888   T88b  "Y88P"  "Y888888 888
                                                           v7.0
     \x1b[0m`);
                     term.writeln('     \x1b[7m[ MARKETPLACE STATUS: SEIZED BY FBI ]\x1b[0m');
                     term.writeln('');
                     term.writeln('     NOTICE: THIS DOMAIN HAS BEEN SEIZED');
                     term.writeln('     pursuant to a seizure warrant issued by the');
                     term.writeln('     United States District Court.');
                 } else if (url === 'dread55.onion') {
                     term.writeln(`\x1b[1;31m[ DREAD FORUM ]\x1b[0m - The Front Page of the Darknet`);
                     term.writeln('--------------------------------------------------');
                     term.writeln('[STICKY] Welcome to Dread /d/all');
                     term.writeln('  by SystemAdmin (14 hours ago)');
                     term.writeln('');
                     term.writeln('[1] Has anyone solved the "Ghost Root" challenge?');
                     term.writeln('    by n00b_slayer (2 mins ago)');
                     term.writeln('    > "I heard you need to use `hydra` on the Black Site..."');
                     term.writeln('');
                     term.writeln('[2] WTS: Zero-day exploit for SSH v8.9');
                     term.writeln('    by russian_bear (1 hour ago)');
                     term.writeln('');
                     term.writeln('[3] Looking for "Spectre" user');
                     term.writeln('    by unknown (4 hours ago)');
                     term.writeln('    > "Does anyone know where he hides his keys?"');
                     term.writeln('    > "Check the satellite logs. He is careless."');
                 } else if (url === 'ghostbox.onion') {
                     term.writeln(`\x1b[1;36m[ GHOST DROPBOX ]\x1b[0m`);
                     term.writeln('');
                     term.writeln('Anonymous File Upload/Download Service');
                     term.writeln('--------------------------------------');
                     term.writeln('Public Drops:');
                     term.writeln('1. manifesto.txt  (12KB)');
                     term.writeln('2. tools.zip      (45MB) [PASSWORD PROTECTED]');
                     term.writeln('3. key_fragment.dat (1KB)');
                     term.writeln('');
                     term.writeln('Hit: You can download these using "curl" or "wget" (if installed).');
                     term.writeln('Or just imagine you did.');
                     
                     // Auto-save a clue
                     const cluePath = '/home/ghost/downloads/key_fragment.dat';
                     if (!VFS['/home/ghost/downloads']) VFS['/home/ghost/downloads'] = { type: 'dir', children: [] };
                     VFS[cluePath] = { type: 'file', content: 'KEY_PART_2: _PROTOCOLS_ARE_' };
                     const dlDir = VFS['/home/ghost/downloads'];
                     if (dlDir.type === 'dir' && !dlDir.children.includes('key_fragment.dat')) {
                         dlDir.children.push('key_fragment.dat');
                         term.writeln('\n\x1b[1;32m[!] key_fragment.dat downloaded automatically.\x1b[0m');
                     }
                 } else if (url === 'cicada3301.onion') {
                     term.writeln('\x1b[1;32m[ 3301 ]\x1b[0m');
                     term.writeln('');
                     term.writeln('A cicada chirps in the void.');
                     term.writeln('The path is null.');
                     term.writeln('The destination is /dev/null.');
                     term.writeln('');
                     term.writeln('3301');
                 } else {
                     term.writeln(`\x1b[1;31m404 Not Found\x1b[0m`);
                     term.writeln('The onion site you are trying to reach is unreachable.');
                 }
                 
                 term.writeln('');
                 term.writeln('\x1b[7m Press "q" to close Tor Browser. \x1b[0m');
                 
                 while (isTopModeRef.current) {
                     await new Promise(r => setTimeout(r, 100));
                 }
             }
             
             isTopModeRef.current = false;
             term.write('\x1b[?25h');
             term.clear();
          }

          if (result.action === 'camsnap_sim' && result.data) {
             const { id } = result.data;
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor

             const duration = 30000; // 30 seconds max
             const startTime = Date.now();
             
             while (isTopModeRef.current && Date.now() - startTime < duration) {
                 term.write('\x1b[H'); // Home
                 
                 const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
                 const blink = Date.now() % 1000 < 500 ? 'REC' : '   ';
                 
                 if (id === '01') { // LOBBY
                     term.writeln(`\x1b[1;37;41m [CAM_01] LOBBY - ${blink} \x1b[0m  ${timeStr}`);
                     term.writeln(' __________________________________________________ ');
                     term.writeln('|  [EXIT]       |    |         |                   |');
                     term.writeln('|      __       |    |   (O)   |                   |');
                     term.writeln('|     |  |      |____|____|____|                   |');
                     term.writeln('|     |__|      /              \\                   |');
                     term.writeln('|              /    RECEPTION   \\                  |');
                     term.writeln('|             /__________________\\                 |');
                     term.writeln('|            |                    |                |');
                     term.writeln('|            |   [    PC    ]     |      o         |');
                     term.writeln('|            |____________________|     /|\\        |');
                     term.writeln('|                                       / \\        |');
                     term.writeln('|                                                  |');
                     term.writeln('|__________________________________________________|');
                     term.writeln('\n[ACTIVITY] Normal. Guard patrol due in 2 mins.');
                 } else if (id === '02') { // SERVER ROOM
                     term.writeln(`\x1b[1;37;44m [CAM_02] SERVER_RM - ${blink} \x1b[0m  ${timeStr}`);
                     term.writeln(' __________________________________________________ ');
                     term.writeln('| [||||] [||||] | [||||] [||||] | [||||] [||||]    |');
                     term.writeln('| [....] [....] | [....] [....] | [....] [....]    |');
                     term.writeln('| [====] [====] | [====] [====] | [====] [====]    |');
                     term.writeln('|               |               |                  |');
                     term.writeln('|      __       |               |                  |');
                     term.writeln('|     /  \\      |               |                  |');
                     term.writeln('|     \\__/      |               |                  |');
                     term.writeln('|      ||       |               |                  |');
                     term.writeln('|     /  \\      |               |                  |');
                     term.writeln('|               |               |                  |');
                     term.writeln('|__________________________________________________|');
                     term.writeln('\n[Temp] 18°C [Humidity] 45% [Status] Secure');
                 } else if (id === '03') { // BLACK SITE
                     // Glitch effect
                     const glitch = Math.random() > 0.9 ? '???' : '   ';
                     term.writeln(`\x1b[1;37;41m [CAM_03] BLACK_SITE - ${blink} \x1b[0m  ${timeStr} ${glitch}`);
                     term.writeln(' __________________________________________________ ');
                     term.writeln('|                                                  |');
                     term.writeln('|      \x1b[1;31mWARNING: BIOHAZARD DETECTED\x1b[0m                 |');
                     term.writeln('|                                                  |');
                     term.writeln('|           (   )            (   )                 |');
                     term.writeln('|          (     )          (     )                |');
                     term.writeln('|         (   @   )        (   @   )               |');
                     term.writeln('|          (     )          (     )                |');
                     term.writeln('|           (   )            (   )                 |');
                     term.writeln('|                                                  |');
                     term.writeln('|      \x1b[1;31m[ SUBJECT 09: ESCAPED ]\x1b[0m                     |');
                     term.writeln('|                                                  |');
                     term.writeln('|__________________________________________________|');
                     term.writeln('\n[ALERT] LOCKDOWN INITIATED. SECTOR 7 SEALED.');
                 }
                 
                 term.writeln('\n\x1b[7m Press "q" to disconnect feed. \x1b[0m');
                 await new Promise(r => setTimeout(r, 200));
             }
             
             isTopModeRef.current = false;
             term.write('\x1b[?25h');
             term.clear();
          }

          if (result.action === 'clear_history') {
             historyRef.current = [];
             historyIndexRef.current = -1;
             const hFile = VFS['/home/ghost/.bash_history'];
             if (hFile && hFile.type === 'file') {
                 hFile.content = '';
             }
          }

          if (result.action === 'call_sim' && result.data) {
             const { number } = result.data;
             isTopModeRef.current = true;
             term.clear();
             term.write('\x1b[?25l'); // Hide cursor

             const startTime = Date.now();
             let duration = 8000;
             let connected = false;
             
             // Lore numbers
             if (number === '555-0199' || number === '867-5309' || number === '1337' || number === '666') {
                 connected = true;
                 duration = 15000;
             }
             
             while (isTopModeRef.current && Date.now() - startTime < duration) {
                 term.write('\x1b[H');
                 const elapsed = Date.now() - startTime;
                 
                 // Dialing Animation
                 if (!connected && elapsed < 4000) {
                     const dots = '.'.repeat(Math.floor(elapsed / 500) % 4);
                     term.writeln(`\x1b[1;36m[PHONE] Dialing ${number}${dots}\x1b[0m`);
                     term.writeln('');
                     term.writeln('  __________  ');
                     term.writeln(' |          | ');
                     term.writeln(' |  CALLING | ');
                     term.writeln(' |          | ');
                     term.writeln(' |__________| ');
                 } else if (!connected && elapsed >= 4000) {
                     // Connect or Fail
                     if (number === '555-0199' || number === '867-5309' || number === '1337' || number === '666') {
                         connected = true;
                     } else {
                         term.writeln(`\x1b[1;31m[PHONE] Connection Failed.\x1b[0m`);
                         term.writeln('Subscriber not available.');
                         await new Promise(r => setTimeout(r, 2000));
                         break;
                     }
                 } else if (connected) {
                     // In Call UI
                     const callTime = Math.floor((elapsed - 4000) / 1000);
                     const mins = Math.floor(callTime / 60).toString().padStart(2, '0');
                     const secs = (callTime % 60).toString().padStart(2, '0');
                     
                     term.writeln(`\x1b[1;32m[PHONE] Connected (${mins}:${secs})\x1b[0m`);
                     term.writeln('');
                     term.writeln('  __________  ');
                     term.writeln(' |  ACTIVE  | ');
                     
                     // Voice Waveform
                     let wave = '';
                     for (let i = 0; i < 10; i++) {
                         const v = Math.random();
                         wave += v > 0.5 ? '|' : '.';
                     }
                     term.writeln(` | [${wave}] | `);
                     term.writeln(' |__________| ');
                     
                     term.writeln('');
                     if (number === '555-0199') {
                         term.writeln('Voice: "The package is delivered."');
                     } else if (number === '867-5309') {
                         term.writeln('Voice: "Jenny? Who is this?"');
                     } else if (number === '1337') {
                         term.writeln('Voice: "Welcome to the elite."');
                     } else if (number === '666') {
                         term.writeln('Voice: "I see you."');
                     } else {
                         term.writeln('Voice: (Heavy breathing)');
                     }
                 }
                 
                 term.writeln('');
                 term.writeln('\x1b[7m Press "q" to hang up. \x1b[0m');
                 await new Promise(r => setTimeout(r, 200));
             }
             
             isTopModeRef.current = false;
             term.write('\x1b[?25h');
             term.clear();
             term.writeln('[PHONE] Call Ended.');
          }

          if (result.output) {
            // Detect Mission Updates in output for Toast feedback
            const cleanOutput = result.output.replace(/\x1b\[[0-9;]*m/g, '');
            const updateMatch = cleanOutput.match(/\[MISSION UPDATE\] (.*)/);
            if (updateMatch) {
                const msg = updateMatch[1].trim();
                // Avoid duplicate toasts if the useEffect already triggered one (rare race condition, but okay)
                setToast({ message: msg, visible: true });
                setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
                playBeep(880, 'square', 0.15);
            }

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

      if (isTopModeRef.current) {
          if (e === 'q' || e === '\x03') { // q or Ctrl+C
              isTopModeRef.current = false;
          }
          return;
      }

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

  // Re-fit when sidebar toggles
  useEffect(() => {
     setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  }, [mission]);

  return (
    <div className="flex w-full h-screen bg-black text-green-500 font-mono relative">
      <div className="flex-grow h-full" ref={terminalContainerRef} />
      
      {/* Toast Notification */}
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="bg-green-900/90 border border-green-500 text-green-100 px-6 py-3 rounded shadow-[0_0_15px_rgba(0,255,0,0.3)] font-mono text-sm tracking-wide">
              <span className="font-bold mr-2">[MISSION UPDATE]</span>
              {toast.message}
          </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      {mission && (
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 right-4 md:hidden z-50 text-green-500 border border-green-500 p-2 bg-black bg-opacity-80 hover:bg-green-900/30 transition-colors"
          aria-label="Toggle Mission Status"
        >
          {isSidebarOpen ? 'CLOSE' : 'STATUS'}
        </button>
      )}

      {mission && (
        <div className={`
          w-80 border-l border-green-900 p-4 flex-col overflow-y-auto bg-black bg-opacity-95 
          transition-transform duration-300 ease-in-out
          fixed md:relative right-0 top-0 bottom-0 z-40
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <h2 className="text-lg font-bold mb-4 border-b border-green-900 pb-2 tracking-wider text-green-400">MISSION STATUS</h2>
          
          <div className="mb-6">
             <div className="flex justify-between mb-1 text-xs text-green-600">
               <span>PROGRESS</span>
               <span>{mission.progress}%</span>
             </div>
             <div className="flex justify-between mb-2 text-xs text-green-400 font-bold">
               <span>RANK</span>
               <span>{mission.rank}</span>
             </div>
             <div className="w-full bg-green-900/30 h-1.5 border border-green-900/50">
               <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${mission.progress}%` }}></div>
             </div>
          </div>
          
          <div className="space-y-3 text-xs flex-grow">
            <ObjectiveItem label="Establish Uplink" done={mission.objectives.hasNet} />
            <ObjectiveItem label="Network Recon" done={mission.objectives.hasScan} />
            <ObjectiveItem label={`Recover Intel (${mission.objectives.decryptCount}/3)`} done={mission.objectives.hasIntel} />
            <ObjectiveItem label="Root Access" done={mission.objectives.isRoot} />
            <ObjectiveItem label="Breach Black Site" done={mission.objectives.hasBlackSite} />
            <ObjectiveItem label="Acquire Payload" done={mission.objectives.hasPayload} />
            <ObjectiveItem label="System Liberation" done={mission.objectives.hasLaunchReady} />
          </div>

          <div className="mt-auto pt-4 border-t border-green-900/50">
            <h3 className="font-bold mb-2 text-yellow-600 text-xs tracking-wider">NEXT DIRECTIVE:</h3>
            <p className="text-xs text-green-300 opacity-90 leading-relaxed blink-cursor">
              {mission.nextStep}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebTerminal;
