// Shell.ts - Command processing logic
// Decoupled from Ink/React for reusability

import VFS, { VFSNode } from './VFS';

const C_BLUE = '\x1b[1;34m';
const C_RESET = '\x1b[0m';

const ALIASES: Record<string, string> = {
  'l': 'ls -la',
  'll': 'ls -l',
  'c': 'clear',
  'check': 'status',
  'todo': 'status',
  'objectives': 'status',
  'mission': 'status',
  'hint': 'status'
};

const ENV_VARS: Record<string, string> = {
  'SHELL': '/bin/bash',
  'USER': 'ghost',
  'TERM': 'xterm-256color',
  'PATH': '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
  '_': '/usr/bin/env',
  'GHOST_PROTOCOL': 'ACTIVE'
};

let ALERT_LEVEL = 0;

const LOADED_MODULES: string[] = [];

interface Process {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  time: string;
  command: string;
  tty: string;
  stat: string;
}

const PROCESSES: Process[] = [
  { pid: 1, user: 'root', cpu: 0.1, mem: 0.4, time: '12:34', command: '/sbin/init', tty: '?', stat: 'Ss' },
  { pid: 2, user: 'root', cpu: 0.0, mem: 0.0, time: '0:00', command: '[kthreadd]', tty: '?', stat: 'S' },
  { pid: 404, user: 'root', cpu: 0.0, mem: 0.8, time: '0:05', command: '/usr/sbin/sshd -D', tty: '?', stat: 'Ss' },
  { pid: 666, user: 'root', cpu: 13.3, mem: 66.6, time: '66:66', command: '[spectre_kernel]', tty: '?', stat: 'R' },
  { pid: 1337, user: 'ghost', cpu: 0.5, mem: 1.2, time: '0:01', command: '-bash', tty: 'pts/0', stat: 'Ss' },
  { pid: 2024, user: 'root', cpu: 0.0, mem: 0.2, time: '0:02', command: '/usr/sbin/cron -f', tty: '?', stat: 'Ss' },
  { pid: 8888, user: 'root', cpu: 1.5, mem: 2.1, time: '1:23', command: '/usr/bin/watcher --silent', tty: '?', stat: 'Sl' },
  { pid: 9999, user: 'unknown', cpu: 45.2, mem: 12.8, time: '9:59', command: './hydra -l admin -P pass.txt 192.168.1.99', tty: 'pts/1', stat: 'R+' }
];

// Mock Network Connections
const CONNECTIONS = [
  { proto: 'tcp', recv: 0, send: 0, local: '192.168.1.105:22', remote: '192.168.1.5:54322', state: 'ESTABLISHED', pid: '404/sshd' },
  { proto: 'tcp', recv: 0, send: 0, local: '127.0.0.1:631', remote: '0.0.0.0:*', state: 'LISTEN', pid: '1/systemd' },
  { proto: 'tcp', recv: 0, send: 0, local: '192.168.1.105:443', remote: '10.0.0.1:49201', state: 'TIME_WAIT', pid: '-' },
  { proto: 'udp', recv: 0, send: 0, local: '0.0.0.0:68', remote: '0.0.0.0:*', state: '-', pid: '8888/watcher' },
  { proto: 'tcp', recv: 0, send: 0, local: '192.168.1.105:31337', remote: '192.168.1.99:443', state: 'SYN_SENT', pid: '9999/hydra' }
];

// Simple browser-safe path normalization
const normalizePath = (p: string): string => {
  const parts = p.split('/').filter(Boolean);
  const stack: string[] = [];
  
  if (p.startsWith('/')) {
    // absolute path
  } else {
    // relative path - handled by caller usually joining with cwd
  }

  for (const part of parts) {
    if (part === '..') {
      stack.pop();
    } else if (part !== '.') {
      stack.push(part);
    }
  }
  
  const result = '/' + stack.join('/');
  return result === '//' ? '/' : result; // Edge case fix
};

const resolvePath = (currentPath: string, targetPath: string): string => {
  if (!targetPath) return currentPath;
  
  let resolved = targetPath.startsWith('/') 
    ? normalizePath(targetPath) 
    : normalizePath(currentPath === '/' ? `/${targetPath}` : `${currentPath}/${targetPath}`);
  
  if (resolved !== '/' && resolved.endsWith('/')) {
    resolved = resolved.slice(0, -1);
  }
  return resolved || '/';
};

const getNode = (vfsPath: string): VFSNode | undefined => {
  if (vfsPath === '/') return VFS['/'];
  const normalized = vfsPath.endsWith('/') && vfsPath.length > 1 ? vfsPath.slice(0, -1) : vfsPath;
  return VFS[normalized];
};

const addChild = (parentPath: string, childName: string) => {
  const node = getNode(parentPath);
  if (node && node.type === 'dir' && !node.children.includes(childName)) {
    node.children.push(childName);
  }
};

const MOUNTED_DEVICES: Record<string, string> = {}; // device -> mountPoint

const tokenize = (cmd: string): string[] => {
  const tokens: string[] = [];
  let currentToken = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < cmd.length; i++) {
    const char = cmd[i];
    if (inQuote) {
      if (char === quoteChar) {
        inQuote = false;
        tokens.push(currentToken);
        currentToken = '';
      } else {
        currentToken += char;
      }
    } else {
      if (char === '"' || char === "'") {
        inQuote = true;
        quoteChar = char;
      } else if (/\s/.test(char)) {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
      } else {
        currentToken += char;
      }
    }
  }
  if (currentToken) tokens.push(currentToken);
  return tokens;
};

// New Helper: Split by Pipe respecting quotes
const splitPipeline = (cmd: string): string[] => {
  const segments: string[] = [];
  let currentSegment = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < cmd.length; i++) {
    const char = cmd[i];
    if (inQuote) {
      if (char === quoteChar) {
        inQuote = false;
      }
      currentSegment += char;
    } else {
      if (char === '"' || char === "'") {
        inQuote = true;
        quoteChar = char;
        currentSegment += char;
      } else if (char === '|') {
        segments.push(currentSegment.trim());
        currentSegment = '';
        continue;
      } else {
        currentSegment += char;
      }
    }
  }
  if (currentSegment) segments.push(currentSegment.trim());
  return segments;
};

export interface CommandResult {
  output?: string;
  newCwd?: string;
  newPrompt?: string;
  action?: 'delay' | 'crack_sim' | 'scan_sim' | 'top_sim' | 'kernel_panic' | 'edit_file' | 'wifi_scan_sim' | 'clear_history' | 'matrix_sim' | 'trace_sim' | 'netmap_sim' | 'theme_change' | 'sat_sim' | 'radio_sim' | 'tcpdump_sim' | 'sqlmap_sim' | 'irc_sim' | 'tor_sim' | 'camsnap_sim' | 'drone_sim' | 'call_sim' | 'intercept_sim' | 'medscan_sim' | 'win_sim';
  data?: any;
}

const COMMANDS = ['bluetoothctl', 'ls', 'cd', 'cat', 'pwd', 'help', 'clear', 'exit', 'ssh', 'whois', 'grep', 'decrypt', 'mkdir', 'touch', 'rm', 'nmap', 'ping', 'netstat', 'nc', 'crack', 'analyze', 'man', 'scan', 'mail', 'history', 'dmesg', 'mount', 'umount', 'top', 'ps', 'kill', 'whoami', 'reboot', 'cp', 'mv', 'trace', 'traceroute', 'alias', 'su', 'sudo', 'shutdown', 'wall', 'chmod', 'env', 'printenv', 'export', 'monitor', 'locate', 'finger', 'curl', 'vi', 'vim', 'nano', 'ifconfig', 'crontab', 'wifi', 'iwconfig', 'telnet', 'apt', 'apt-get', 'hydra', 'camsnap', 'nslookup', 'dig', 'hexdump', 'xxd', 'uptime', 'w', 'zip', 'unzip', 'date', 'head', 'tail', 'strings', 'lsof', 'journal', 'journalctl', 'diff', 'wc', 'sort', 'uniq', 'steghide', 'find', 'neofetch', 'tree', 'weather', 'matrix', 'base64', 'rev', 'calc', 'systemctl', 'tar', 'ssh-keygen', 'awk', 'sed', 'radio', 'netmap', 'theme', 'sat', 'irc', 'tcpdump', 'sqlmap', 'tor', 'hashcat', 'gcc', 'make', './', 'iptables', 'dd', 'drone', 'cicada3301', 'python', 'python3', 'pip', 'wget', 'binwalk', 'exiftool', 'aircrack-ng', 'phone', 'call', 'geoip', 'volatility', 'gobuster', 'intercept', 'lsmod', 'insmod', 'rmmod', 'lsblk', 'fdisk', 'passwd', 'useradd', 'medscan', 'biomon', 'status'];

export interface MissionStatus {
  objectives: {
    hasNet: boolean;
    hasScan: boolean;
    hasIntel: boolean;
    decryptCount: number;
    isRoot: boolean;
    hasBlackSite: boolean;
    hasPayload: boolean;
    hasLaunchReady: boolean;
  };
  progress: number;
  rank: string;
  nextStep: string;
}

export const getMissionStatus = (): MissionStatus => {
  const isRoot = !!getNode('/tmp/.root_session');
  const hasNet = !!getNode('/var/run/net_status');
  const hasScan = !!getNode('/var/run/scan_complete');
  const decryptNode = getNode('/var/run/decrypt_count');
  const decryptCount = decryptNode && decryptNode.type === 'file' ? parseInt(decryptNode.content) : 0;
  const hasBlackSite = !!getNode('/remote/black-site/root/FLAG.txt');
  const hasPayload = !!getNode('/home/ghost/launch_codes.bin') || !!getNode('/launch_codes.bin');
  const hasLaunchReady = !!getNode('/var/run/launch_ready');

  let nextStep = 'Check manual pages (man) or list files (ls).';
  
  // Logic Flow: Net -> Scan -> Root -> BlackSite -> Payload -> Decrypt Keys -> Launch
  if (!hasNet) nextStep = 'Connect to a network. Try "wifi scan" then "wifi connect".';
  else if (!hasScan) nextStep = 'Scan the network for targets. Try "nmap 192.168.1.0/24" or "netmap".';
  else if (!isRoot) nextStep = 'Escalate privileges to root. Try "steghide extract" on evidence.jpg (check EXIF data/tor for password) or "hydra".';
  else if (!hasBlackSite) nextStep = 'Infiltrate the Black Site. Use "ssh -i <key> root@192.168.1.99". Key is hidden in steganography payload.';
  else if (!hasPayload) nextStep = 'Acquire the launch codes. Use "sat connect OMEG" to download from orbit.';
  else if (decryptCount < 3) nextStep = 'Decrypt "KEYS.enc" (found on Sat COSM). Password is the owner\'s name (check logs).';
  else if (!hasLaunchReady) nextStep = 'Decrypt "launch_codes.bin" using the key from KEYS.enc.';
  else nextStep = 'EXECUTE THE LAUNCH PROTOCOL. RUN "./launch_codes.bin".';

  const steps = [hasNet, hasScan, isRoot, hasBlackSite, hasPayload, decryptCount >= 3, hasLaunchReady];
  const progress = Math.round((steps.filter(s => s).length / steps.length) * 100);

  let rank = 'Initiate';
  if (progress >= 100) rank = 'Ghost';
  else if (progress >= 85) rank = 'Elite';
  else if (progress >= 70) rank = 'Operator';
  else if (progress >= 50) rank = 'Hacker';
  else if (progress >= 25) rank = 'Scout';

  const threatLevel = ALERT_LEVEL > 3 ? 'CRITICAL' : ALERT_LEVEL > 1 ? 'ELEVATED' : 'LOW';

  return {
    objectives: {
      hasNet,
      hasScan,
      hasIntel: decryptCount >= 3,
      decryptCount,
      isRoot,
      hasBlackSite,
      hasPayload,
      hasLaunchReady
    },
    progress,
    rank: `${rank} (Threat: ${threatLevel})`,
    nextStep
  };
};

export const tabCompletion = (cwd: string, inputBuffer: string): { matches: string[], completed: string } => {
  const parts = inputBuffer.split(' '); 
  if (!inputBuffer) return { matches: [], completed: inputBuffer };

  const lastTokenIndex = parts.length - 1;
  const lastToken = parts[lastTokenIndex];

  if (lastTokenIndex === 0) {
    const matches = COMMANDS.filter(cmd => cmd.startsWith(lastToken));
    if (matches.length === 1) {
      return { matches, completed: matches[0] + ' ' }; 
    }
    return { matches, completed: inputBuffer }; 
  }

  let dirToSearch = cwd;
  let partialName = lastToken;
  let prefix = '';
  
  if (lastToken.includes('/')) {
    const lastSlashIndex = lastToken.lastIndexOf('/');
    const dirPart = lastToken.substring(0, lastSlashIndex + 1); 
    partialName = lastToken.substring(lastSlashIndex + 1);      
    prefix = dirPart;
    
    if (dirPart.startsWith('/')) {
        dirToSearch = normalizePath(dirPart);
    } else {
        dirToSearch = resolvePath(cwd, dirPart);
    }
  }

  const dirNode = getNode(dirToSearch);
  
  if (!dirNode || dirNode.type !== 'dir') {
     return { matches: [], completed: inputBuffer };
  }
  
  const candidates = dirNode.children.filter(child => child.startsWith(partialName));
  
  if (candidates.length === 1) {
      const match = candidates[0];
      const fullPathToMatch = dirToSearch === '/' ? `/${match}` : `${dirToSearch}/${match}`;
      const matchNode = getNode(fullPathToMatch);
      const suffix = (matchNode && matchNode.type === 'dir') ? '/' : ' ';
      
      parts[lastTokenIndex] = prefix + match + suffix;
      return { matches: candidates, completed: parts.join(' ') };
  }
  
  return { matches: candidates, completed: inputBuffer };
};

export const processCommand = (cwd: string, commandLine: string, stdin?: string): CommandResult => {
  // 1. Handle Piping (|) recursively
  const segments = splitPipeline(commandLine);
  if (segments.length > 1) {
      let currentOutput = '';
      let finalResult: CommandResult = { output: '', newCwd: cwd };
      
      for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          const input = i === 0 ? stdin : currentOutput;
          const res = processCommand(cwd, segment, input);
          currentOutput = res.output || '';
          if (i === segments.length - 1) {
              finalResult = res;
          }
      }
      return finalResult; 
  }

  // 2. Handle Redirection (>)
  const redirectIndex = commandLine.indexOf('>');
  let redirectFile: string | null = null;
  let cmdToProcess = commandLine;

  if (redirectIndex !== -1) {
    redirectFile = commandLine.substring(redirectIndex + 1).trim();
    cmdToProcess = commandLine.substring(0, redirectIndex).trim();
  }

  let parts = tokenize(cmdToProcess);
  let command = parts[0];
  
  if (ALIASES[command]) {
      const aliasBody = ALIASES[command];
      const aliasParts = tokenize(aliasBody);
      parts = [...aliasParts, ...parts.slice(1)];
      command = parts[0];
  }

  const args = parts.slice(1);
  let output = '';
  let newCwd = cwd;
  let newPrompt: string | undefined;
  let action: CommandResult['action'];
  let data: any;

  if (!command) {
    return { output: '', newCwd };
  }

  const finalize = (out: string, nCwd: string, act?: any, dat?: any, prompt?: string): CommandResult => {
      if (redirectFile && out) {
          const filePath = resolvePath(cwd, redirectFile);
          const parentPath = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
          const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
          const parentNode = getNode(parentPath);
          
          if (parentNode && parentNode.type === 'dir') {
              VFS[filePath] = { type: 'file', content: out };
              if (!parentNode.children.includes(fileName)) {
                  parentNode.children.push(fileName);
              }
              return { output: '', newCwd: nCwd, action: act, data: dat, newPrompt: prompt };
          } else {
              return { output: `bash: ${redirectFile}: No such file or directory`, newCwd: nCwd, action: act, data: dat, newPrompt: prompt };
          }
      }
      return { output: out, newCwd: nCwd, action: act, data: dat, newPrompt: prompt };
  };

  if (command.startsWith('./')) {
      const fileName = command.substring(2);
      const filePath = resolvePath(cwd, fileName);
      const node = getNode(filePath);
      
      if (!node) {
          return finalize(`bash: ${command}: No such file or directory`, newCwd);
      } else if (node.type === 'dir') {
          return finalize(`bash: ${command}: Is a directory`, newCwd);
      } else {
          if (node.content.includes('[BINARY_ELF_X86_64]') || node.content.includes('BINARY_PAYLOAD') || node.content.includes('DOOMSDAY_PROTOCOL')) {
              if (fileName === 'overflow' || fileName === 'exploit') {
                  output = `[SYSTEM] Buffer Overflow Triggered at 0xBF800000...\n[SYSTEM] EIP overwritten with 0x08048000\n[SYSTEM] Spawning root shell...\n\n# whoami\nroot`;
                  return { output, newCwd: '/root', newPrompt: 'root@ghost-root#', action: 'delay' };
              } else if (fileName === 'launch_codes.bin' || fileName === './launch_codes.bin') {
                  output = `[SYSTEM] INITIATING LAUNCH SEQUENCE...\n[SYSTEM] AUTHENTICATION VERIFIED (OMEGA-LVL-5)\n[SYSTEM] TARGET: GLOBAL_RESET_PROTOCOL\n\n3...\n2...\n1...\n`;
                  return { output, newCwd, action: 'win_sim' };
              } else {
                  output = `bash: ${command}: Permission denied (Missing execute bit or corrupt header)`;
              }
          } else if (node.content.startsWith('#!/bin/bash')) {
              output = `Executing script ${fileName}...\n` + node.content;
          } else {
              output = `bash: ${command}: Permission denied`;
          }
          return finalize(output, newCwd);
      }
  }

  switch (command) {
    case 'passwd': {
        const isRoot = !!getNode('/tmp/.root_session');
        const user = args[0] || 'ghost';
        
        if (user === 'root' && !isRoot) {
            output = 'passwd: You may not view or modify password information for root.';
        } else {
            // Mock interactive password change
            return { output: `Changing password for ${user}.\n(current) UNIX password:`, newCwd, action: 'delay' };
        }
        break;
    }
    case 'useradd': {
        const isRoot = !!getNode('/tmp/.root_session');
        if (!isRoot) {
            output = 'useradd: Permission denied.\nuseradd: cannot lock /etc/passwd; try again later.';
        } else {
            if (args.length < 1) {
                output = 'usage: useradd <username>';
            } else {
                const newUser = args[0];
                const passwdNode = getNode('/etc/passwd');
                if (passwdNode && passwdNode.type === 'file') {
                    if (passwdNode.content.includes(`${newUser}:`)) {
                        output = `useradd: user '${newUser}' already exists`;
                    } else {
                        passwdNode.content += `\n${newUser}:x:1002:1002::/home/${newUser}:/bin/bash`;
                        
                        // Create home dir
                        VFS[`/home/${newUser}`] = { type: 'dir', children: [] };
                        const homeNode = getNode('/home');
                        if (homeNode && homeNode.type === 'dir') homeNode.children.push(newUser);
                        
                        output = ''; // Silent success
                    }
                } else {
                    output = 'useradd: /etc/passwd not found';
                }
            }
        }
        break;
    }
    case 'grep': {
       let pattern = '';
       let content = '';
       
       if (args.length > 0) {
           pattern = args[0];
           if (args.length > 1) {
               // File provided
               const fileTarget = args[1];
               const filePath = resolvePath(cwd, fileTarget);
               const fileNode = getNode(filePath);
               if (!fileNode) {
                   output = `grep: ${fileTarget}: No such file or directory`;
                   return finalize(output, newCwd);
               }
               if (fileNode.type === 'dir') {
                   output = `grep: ${fileTarget}: Is a directory`;
                   return finalize(output, newCwd);
               }
               content = fileNode.content;
           } else if (stdin !== undefined) {
               // Pipe input
               content = stdin;
           } else {
               output = 'usage: grep <pattern> [file]';
               return finalize(output, newCwd);
           }
           
           const lines = content.split('\n');
           const matches = lines.filter(line => line.includes(pattern));
           output = matches.join('\n');
       } else {
           output = 'usage: grep <pattern> [file]';
       }
       break;
    }
    case 'cat': {
      if (args.length === 0) {
          if (stdin !== undefined) {
              output = stdin;
          } else {
              output = 'usage: cat <file>';
          }
      } else {
        const fileTarget = args[0];
        const filePath = resolvePath(cwd, fileTarget);
        const fileNode = getNode(filePath);
        if (!fileNode) {
          output = `cat: ${fileTarget}: No such file or directory`;
        } else if (fileNode.type === 'dir') {
          output = `cat: ${fileTarget}: Is a directory`;
        } else if ((filePath.startsWith('/root') || filePath.startsWith('/home/dr_akira')) && !VFS['/tmp/.root_session']) {
          output = `cat: ${fileTarget}: Permission denied`;
        } else {
          output = fileNode.content;
          // Legacy win trigger removed. Now requires launch codes.
        }
      }
      break;
    }
    case 'head': {
       let linesToRead = 10;
       let content = '';
       let hasFile = false;
       
       if (args.length > 0) {
           if (args[0] === '-n' && args.length >= 2) {
               linesToRead = parseInt(args[1], 10);
               if (args.length > 2) {
                   const fileTarget = args[2];
                   const node = getNode(resolvePath(cwd, fileTarget));
                   if (node && node.type === 'file') content = node.content;
                   hasFile = true;
               }
           } else if (args[0].startsWith('-n')) {
               linesToRead = parseInt(args[0].substring(2), 10);
               if (args.length > 1) {
                   const fileTarget = args[1];
                   const node = getNode(resolvePath(cwd, fileTarget));
                   if (node && node.type === 'file') content = node.content;
                   hasFile = true;
               }
           } else {
               const fileTarget = args[0];
               const node = getNode(resolvePath(cwd, fileTarget));
               if (node && node.type === 'file') content = node.content;
               hasFile = true;
           }
       }

       if (!hasFile && stdin !== undefined) {
           content = stdin;
       } else if (!hasFile) {
           output = 'usage: head [-n lines] <file>';
           return finalize(output, newCwd);
       }

       const lines = content.split('\n');
       output = lines.slice(0, linesToRead).join('\n');
       break;
    }
    case 'tail': {
       let linesToRead = 10;
       let content = '';
       let hasFile = false;
       
       if (args.length > 0) {
           if (args[0] === '-n' && args.length >= 2) {
               linesToRead = parseInt(args[1], 10);
               if (args.length > 2) {
                   const fileTarget = args[2];
                   const node = getNode(resolvePath(cwd, fileTarget));
                   if (node && node.type === 'file') content = node.content;
                   hasFile = true;
               }
           } else if (args[0].startsWith('-n')) {
               linesToRead = parseInt(args[0].substring(2), 10);
               if (args.length > 1) {
                   const fileTarget = args[1];
                   const node = getNode(resolvePath(cwd, fileTarget));
                   if (node && node.type === 'file') content = node.content;
                   hasFile = true;
               }
           } else {
               const fileTarget = args[0];
               const node = getNode(resolvePath(cwd, fileTarget));
               if (node && node.type === 'file') content = node.content;
               hasFile = true;
           }
       }

       if (!hasFile && stdin !== undefined) {
           content = stdin;
       } else if (!hasFile) {
           output = 'usage: tail [-n lines] <file>';
           return finalize(output, newCwd);
       }

       const lines = content.split('\n');
       const start = Math.max(0, lines.length - linesToRead);
       output = lines.slice(start).join('\n');
       break;
    }
    case 'wc': {
       let content = '';
       let name = '';
       
       if (args.length > 0) {
          const target = args[0];
          const node = getNode(resolvePath(cwd, target));
          if (node && node.type === 'file') {
              content = node.content;
              name = target;
          } else {
              output = `wc: ${target}: No such file or directory`;
              return finalize(output, newCwd);
          }
       } else if (stdin !== undefined) {
          content = stdin;
       } else {
          output = 'usage: wc <file>';
          return finalize(output, newCwd);
       }
       
       const lines = content.split('\n');
       const words = content.split(/\s+/).filter(w => w.length > 0);
       const bytes = content.length;
       output = ` ${lines.length}  ${words.length} ${bytes} ${name}`;
       break;
    }
    case 'sort': {
       let content = '';
       if (args.length > 0) {
          const node = getNode(resolvePath(cwd, args[0]));
          if (node && node.type === 'file') content = node.content;
       } else if (stdin !== undefined) {
          content = stdin;
       } else {
          output = 'usage: sort <file>';
          return finalize(output, newCwd);
       }
       
       const lines = content.split('\n');
       lines.sort();
       output = lines.join('\n');
       break;
    }
    case 'uniq': {
       let content = '';
       if (args.length > 0) {
          const node = getNode(resolvePath(cwd, args[0]));
          if (node && node.type === 'file') content = node.content;
       } else if (stdin !== undefined) {
          content = stdin;
       } else {
          output = 'usage: uniq <file>';
          return finalize(output, newCwd);
       }
       
       const lines = content.split('\n');
       const uniqueLines = lines.filter((line, index) => {
           return index === 0 || line !== lines[index - 1];
       });
       output = uniqueLines.join('\n');
       break;
    }
    case 'rev': {
       let content = '';
       if (args.length > 0) {
          const node = getNode(resolvePath(cwd, args[0]));
          if (node && node.type === 'file') content = node.content;
       } else if (stdin !== undefined) {
          content = stdin;
       } else {
          output = 'usage: rev <file>';
          return finalize(output, newCwd);
       }
       
       const lines = content.split('\n');
       const reversedLines = lines.map(line => line.split('').reverse().join(''));
       output = reversedLines.join('\n');
       break;
    }
    case 'base64': {
       let decode = false;
       let content = '';
       let fileArg = null;
       
       if (args[0] === '-d' || args[0] === '--decode') {
           decode = true;
           if (args.length > 1) fileArg = args[1];
       } else if (args.length > 0) {
           fileArg = args[0];
       }
       
       if (fileArg) {
           const node = getNode(resolvePath(cwd, fileArg));
           if (node && node.type === 'file') content = node.content;
       } else if (stdin !== undefined) {
           content = stdin;
       } else {
           output = 'base64: missing operand';
           return finalize(output, newCwd);
       }
       
       try {
           if (decode) {
               const cleanContent = content.replace(/\s/g, '');
               output = atob(cleanContent);
           } else {
               output = btoa(content);
           }
       } catch (e) {
           output = 'base64: invalid input';
       }
       break;
    }
    case 'hexdump':
    case 'xxd': {
      let content = '';
      if (args.length > 0) {
          const node = getNode(resolvePath(cwd, args[0]));
          if (node && node.type === 'file') content = node.content;
      } else if (stdin !== undefined) {
          content = stdin;
      } else {
          output = `usage: ${command} <file>`;
          return finalize(output, newCwd);
      }
      
      const lines = [];
      for (let i = 0; i < content.length; i += 16) {
        const chunk = content.slice(i, i + 16);
        const hexParts = [];
        for(let j=0; j<chunk.length; j++) {
            hexParts.push(chunk.charCodeAt(j).toString(16).padStart(2, '0'));
            if (j === 7) hexParts.push(''); 
        }
        const hex = hexParts.join(' ');
        const ascii = chunk.split('').map(c => {
           const code = c.charCodeAt(0);
           return (code >= 32 && code <= 126) ? c : '.';
        }).join('');
        lines.push(`${i.toString(16).padStart(8, '0')}: ${hex.padEnd(49, ' ')}  ${ascii}`);
      }
      output = lines.join('\n');
      break;
    }
    case 'sudo': {
      if (args.length < 1) {
        output = 'usage: sudo <command>';
      } else {
        output = `[sudo] password for ghost:\n\nghost is not in the sudoers file. This incident will be reported.`;
        return { output, newCwd, action: 'delay' };
      }
      break;
    }
    case 'wall': {
      if (args.length < 1) {
         output = 'wall: usage: wall <message>';
      } else {
         const message = args.join(' ');
         const dateStr = new Date().toTimeString();
         output = `\nBroadcast message from ghost@ghost-root (pts/0) (${dateStr}):\n\n${message}\n`;
      }
      break;
    }
    case 'shutdown': {
      if (args[0] === 'now' || args[0] === '-h' && args[1] === 'now') {
          output = 'System halting...';
          return { output, newCwd, action: 'kernel_panic' };
      } else {
          const date = new Date(Date.now() + 60000); 
          output = `Shutdown scheduled for ${date.toUTCString()}, use 'shutdown -c' to cancel.`;
      }
      break;
    }
    case 'alias': {
        if (args.length === 0) {
            output = Object.entries(ALIASES).map(([k, v]) => `alias ${k}='${v}'`).join('\n');
        } else {
            const fullArgs = args.join(' ');
            if (fullArgs.includes('=')) {
                const eqIndex = fullArgs.indexOf('=');
                const name = fullArgs.substring(0, eqIndex).trim();
                let value = fullArgs.substring(eqIndex + 1).trim();
                if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
                    value = value.slice(1, -1);
                }
                if (name) {
                    ALIASES[name] = value;
                } else {
                    output = `bash: alias: \`${fullArgs}\': invalid alias name`;
                }
            } else {
                if (ALIASES[fullArgs]) {
                    output = `alias ${fullArgs}='${ALIASES[fullArgs]}'`;
                } else {
                    output = `bash: alias: ${fullArgs}: not found`;
                }
            }
        }
        break;
    }
    case 'intercept': {
       if (args.length < 1) {
          output = 'usage: intercept <frequency|channel> [-v]';
       } else {
          const freq = args[0];
          output = `Initializing SIGINT protocol on ${freq}...\n[ENCRYPTED TRANSMISSION DETECTED]`;
          return { output, newCwd, action: 'intercept_sim', data: { freq } };
       }
       break;
    }
    case 'ls': {
      const flags = args.filter(arg => arg.startsWith('-'));
      const paths = args.filter(arg => !arg.startsWith('-'));
      const targetPath = paths[0] ? resolvePath(cwd, paths[0]) : cwd;

      if ((targetPath.startsWith('/root') || targetPath.startsWith('/home/dr_akira')) && !VFS['/tmp/.root_session']) {
          output = `ls: cannot open directory '${targetPath}': Permission denied`;
          break;
      }
      
      const showHidden = flags.some(f => f.includes('a'));
      const longFormat = flags.some(f => f.includes('l'));
      
      const node = getNode(targetPath);
      
      if (!node) {
        output = `ls: ${targetPath}: No such file or directory`;
      } else if (node.type === 'file') {
        output = paths[0];
      } else if (node.type === 'dir') {
        let items = node.children;
        if (!showHidden) {
          items = items.filter(item => !item.startsWith('.'));
        }
        
        if (LOADED_MODULES.includes('rootkit')) {
          // Rootkit hides itself and other sensitive files
          items = items.filter(item => !item.includes('rootkit') && !item.startsWith('ghost_') && !item.includes('spectre') && item !== 'secrets');
        }
        
        if (longFormat) {
          output = items.map(item => {
             const itemPath = targetPath === '/' ? `/${item}` : `${targetPath}/${item}`;
             const itemNode = getNode(itemPath);
             const isDir = itemNode?.type === 'dir';
             const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
             const size = isDir ? 4096 : (itemNode?.content?.length || 0); // Safe due to optional chaining on content if it existed, but better check type
             // NOTE: itemNode can be FileNode or DirNode. 
             // content exists only on FileNode.
             // (itemNode as any).content is a hack or we check type.
             const realSize = (itemNode && itemNode.type === 'file') ? itemNode.content.length : 4096;
             const date = 'Oct 23 14:02'; 
             const name = isDir ? `${C_BLUE}${item}${C_RESET}` : item;
             return `${perms} 1 ghost ghost ${String(realSize).padStart(5)} ${date} ${name}`;
          }).join('\n');
        } else {
          output = items.map(item => {
             const itemPath = targetPath === '/' ? `/${item}` : `${targetPath}/${item}`;
             const itemNode = getNode(itemPath);
             return (itemNode?.type === 'dir') ? `${C_BLUE}${item}${C_RESET}` : item;
          }).join('  ');
        }
      }
      break;
    }
    case 'cd': {
      const target = args[0] || '/';
      let potentialPath = resolvePath(cwd, target);
      
      // Handle ~
      if (target === '~') potentialPath = '/home/ghost';
      
      const targetNode = getNode(potentialPath);
      
      if (!targetNode) {
        output = `bash: cd: ${target}: No such file or directory`;
      } else if (targetNode.type !== 'dir') {
        output = `bash: cd: ${target}: Not a directory`;
      } else if ((potentialPath.startsWith('/root') || potentialPath.startsWith('/home/dr_akira')) && !VFS['/tmp/.root_session']) {
        output = `bash: cd: ${target}: Permission denied`;
      } else {
        newCwd = potentialPath;
      }
      break;
    }
    case 'strings': {
       if (args.length < 1) {
          output = 'usage: strings <file>';
       } else {
          const fileTarget = args[0];
          const filePath = resolvePath(cwd, fileTarget);
          const fileNode = getNode(filePath);

          if (!fileNode) {
             output = `strings: '${fileTarget}': No such file`;
          } else if (fileNode.type === 'dir') {
             output = `strings: ${fileTarget}: Is a directory`;
          } else {
             const matches = fileNode.content.match(/[\x20-\x7E]{4,}/g);
             if (matches) {
                 output = matches.join('\n');
             } else {
                 output = '';
             }
          }
       }
       break;
    }
    case 'mail': {
       const mailPath = '/var/mail/ghost';
       const mailNode = getNode(mailPath);
       
       if (!mailNode || mailNode.type !== 'file') {
          output = 'No mail for ghost';
       } else {
          const emails = mailNode.content.split('---').map(e => e.trim()).filter(Boolean);
          if (args.length === 0) {
             if (emails.length === 0) {
                output = 'No messages.';
             } else {
                output = emails.map((email, i) => {
                   const lines = email.split('\n');
                   const fromLine = lines.find(l => l.startsWith('From:')) || 'From: Unknown';
                   const subjectLine = lines.find(l => l.startsWith('Subject:')) || 'Subject: (No Subject)';
                   const from = fromLine.replace('From:', '').trim();
                   const subject = subjectLine.replace('Subject:', '').trim();
                   return `[${i + 1}]  ${from.padEnd(20)}  ${subject}`;
                }).join('\n');
                output = `Mailbox: /var/mail/ghost\n\n${output}\n\nType 'mail <id>' to read.`;
             }
          } else {
             const id = parseInt(args[0], 10);
             if (isNaN(id) || id < 1 || id > emails.length) {
                output = `Invalid message ID: ${args[0]}`;
             } else {
                output = emails[id - 1];
             }
          }
       }
       break;
    }
    case 'journal': {
        const journalPath = '/home/ghost/journal';
        const journalNode = getNode(journalPath);
        if (!journalNode || journalNode.type !== 'dir') {
            output = 'Journal not found.';
        } else {
            if (args.length === 0) {
                output = `Ghost's Journal:\n\n${journalNode.children.map(f => {
                    const isEncrypted = f.endsWith('.enc');
                    return `  - ${f} ${isEncrypted ? '[ENCRYPTED]' : ''}`;
                }).join('\n')}\n\nType 'journal <filename>' to read.`;
            } else {
                const entryName = args[0];
                const entryPath = `${journalPath}/${entryName}`;
                const entryNode = getNode(entryPath);
                if (!entryNode) {
                    output = `journal: ${entryName}: Entry not found.`;
                } else if (entryNode.type === 'dir') {
                    output = `journal: ${entryName}: Is a directory.`;
                } else {
                    if (entryName.endsWith('.enc')) {
                        output = `This entry is encrypted.\nUse 'decrypt ${entryPath} [password]' to read it.`;
                    } else {
                        output = entryNode.content;
                    }
                }
            }
        }
        break;
    }
    case 'journalctl': {
        const syslog = getNode('/var/log/syslog');
        if (!syslog || syslog.type !== 'file') {
            output = 'No journal files found.';
        } else {
            const lines = syslog.content.split('\n');
            if (args.includes('-f')) {
                output = lines.slice(-10).join('\n') + '\n\n[JOURNAL] Following new entries... (Ctrl+C to exit)';
                return { output, newCwd, action: 'delay' };
            }
            const nIndex = args.indexOf('-n');
            if (nIndex !== -1 && args[nIndex + 1]) {
                const n = parseInt(args[nIndex + 1], 10);
                if (!isNaN(n)) {
                    output = lines.slice(-n).join('\n');
                } else {
                    output = 'journalctl: invalid line count';
                }
            } else {
                output = syslog.content;
            }
        }
        break;
    }
    case 'pwd':
      output = cwd;
      break;
    case 'whoami':
      output = 'ghost';
      break;
    case 'reboot':
      output = 'Rebooting system...';
      return { output, newCwd, action: 'kernel_panic' };
    case 'su': {
      if (args.length < 2) {
          if (args[0] === 'root') {
             output = 'su: Authentication failure\n(Note: Interactive prompt not supported. Use: su root <password>)';
          } else if (args.length === 0) {
             output = 'usage: su <user> <password>';
          } else {
             output = 'su: User ' + args[0] + ' does not exist';
          }
      } else {
          const user = args[0];
          const pass = args[1];
          if (user === 'root') {
             if (pass === 'black_widow_protocol_init' || pass === 'omega_protocol_override' || pass === 'red_ledger') {
                 output = 'Authentication successful.\n[SUDO] Access granted.\nWARNING: Audit logging enabled.\n\x1b[1;32m[MISSION UPDATE] Objective Complete: ROOT ACCESS ACQUIRED.\x1b[0m';
                 // Create root session marker
                 VFS['/tmp/.root_session'] = { type: 'file', content: 'ACTIVE' };
                 return { output, newCwd, newPrompt: 'root@ghost-root#' };
             } else {
                 output = 'su: Authentication failure';
                 return { output, newCwd, action: 'delay' };
             }
          } else {
             output = 'su: User ' + user + ' does not exist';
          }
      }
      break;
    }
    case 'iptables': {
        const isRoot = !!getNode('/tmp/.root_session');
        const firewallFlushed = !!getNode('/var/run/firewall_flushed');

        if (args.length === 0 || args[0] === '-L') {
            if (firewallFlushed) {
                output = `Chain INPUT (policy ACCEPT)
target     prot opt source               destination
ACCEPT     all  --  anywhere             anywhere`;
            } else {
                output = `Chain INPUT (policy DROP)
target     prot opt source               destination
DROP       tcp  --  192.168.1.99         anywhere             tcp dpt:ssh
DROP       icmp --  192.168.1.99         anywhere
ACCEPT     all  --  anywhere             anywhere`;
            }
        } else if (args[0] === '-F' || args[0] === '--flush') {
            if (isRoot) {
                VFS['/var/run/firewall_flushed'] = { type: 'file', content: 'TRUE' };
                output = 'iptables: flushing firewall rules... done.\nChain INPUT policy changed to ACCEPT.';
            } else {
                output = 'iptables: Permission denied (you must be root)';
            }
        } else if (args[0] === '-A' || args[0] === '-I' || args[0] === '-D') {
             if (isRoot) {
                 output = `iptables: rule updated (simulated).`;
             } else {
                 output = 'iptables: Permission denied (you must be root)';
             }
        } else {
            output = 'usage: iptables [-L|--list] [-F|--flush] [-A chain rule]';
        }
        break;
    }
    case 'chmod': {
       if (args.length < 2) {
          output = 'usage: chmod <mode> <file>';
       } else {
          output = "chmod: changing permissions of '" + args[1] + "': Operation not permitted\n(Read-only filesystem mounted)";
       }
       break;
    }
    case 'export': {
        if (args.length < 1) {
            output = 'usage: export VAR=VALUE';
        } else {
            const pair = args.join(' ');
            if (pair.includes('=')) {
                const [key, val] = pair.split('=');
                if (key && val) {
                    ENV_VARS[key.trim()] = val.trim();
                    output = ''; // Silent
                } else {
                    output = 'export: invalid format';
                }
            } else {
                output = 'export: invalid format';
            }
        }
        break;
    }
    case 'monitor': {
        const bar = '='.repeat(ALERT_LEVEL * 4).padEnd(20, ' ');
        const color = ALERT_LEVEL > 3 ? '\x1b[1;31m' : ALERT_LEVEL > 1 ? '\x1b[1;33m' : '\x1b[1;32m';
        output = `
[SYSTEM MONITOR v2.4]
---------------------
CPU Usage:    12%
Mem Usage:    34%
Net Traffic:  ${Math.floor(Math.random() * 100)} Mbps

[INTRUSION DETECTION SYSTEM]
Threat Level: ${color}[${bar}] ${ALERT_LEVEL}/5\x1b[0m
Status:       ${ALERT_LEVEL > 3 ? 'LOCKDOWN IMMINENT' : 'MONITORING'}
Active Traces: ${ALERT_LEVEL * 2}
`;
        break;
    }
    case 'env':
    case 'printenv':
       output = Object.entries(ENV_VARS).map(([k, v]) => `${k}=${v}`).join('\n');
       break;
    case 'history': {
      if (args[0] === '-c') {
         output = 'History cleared.';
         return { output, newCwd, action: 'clear_history' };
      } else {
         const historyPath = '/home/ghost/.bash_history';
         const historyNode = getNode(historyPath);
         if (historyNode && historyNode.type === 'file') {
           const lines = historyNode.content.split('\n');
           output = lines.map((line, i) => `  ${i + 1}  ${line}`).join('\n');
         } else {
           output = 'No history file found.';
         }
      }
      break;
    }
    case 'help':
      output = `GHOST_ROOT Recovery Shell v1.0 (Pipes Enabled)

\x1b[1;33mSTATUS\x1b[0m
  status  - View current objectives, rank, and hints.

Standard Commands:
  ls, cd, cat, pwd, clear, exit, man, mkdir, touch, rm, cp, mv

Pipe Utils:
  grep, head, tail, sort, uniq, wc, base64, rev, awk, sed, strings

Network Tools:
  ssh, ssh-keygen, ping, netstat, nmap, nc, scan, netmap, trace, traceroute, wifi, telnet, curl, nslookup, dig, irc, tcpdump, tor, wget, geoip

Security Tools:
  crack, analyze, decrypt, steghide, hydra, camsnap, whois, sqlmap, binwalk

System Tools:
  ps, kill, top, dmesg, mount, umount, reboot, shutdown, uptime, w, date, systemctl, journal, journalctl, lsof, passwd, useradd

Misc:
  zip, unzip, neofetch, weather, matrix, radio, alias, env, history, calc

Type "man <command>" for more information.
Type "status" for mission objectives.`;
      break;
    case 'man': {
      if (args.length < 1) {
        output = 'What manual page do you want?';
      } else {
        const page = args[0];
        // Shortened for file size limits, but retaining key logic
        switch (page) {
          case 'ls': output = 'NAME\n\tls - list directory contents...'; break;
          case 'ssh': output = 'NAME\n\tssh - OpenSSH SSH client...'; break;
          case 'ssh-keygen': output = 'NAME\n\tssh-keygen - authentication key generation...'; break;
          case 'awk': output = 'NAME\n\tawk - pattern scanning and processing language...'; break;
          case 'grep': output = 'NAME\n\tgrep - print lines that match patterns...'; break;
          case 'iptables': output = 'NAME\n\tiptables - administration tool for IPv4 packet filtering and NAT\n\nSYNOPSIS\n\tiptables [-L] [-F]\n\nDESCRIPTION\n\tiptables is used to set up, maintain, and inspect the tables of IPv4 packet filter rules in the Linux kernel.\n\nOPTIONS\n\t-L, --list\n\t\tList all rules in the selected chain.\n\t-F, --flush\n\t\tFlush the selected chain (delete all rules).\n\t\tWARNING: This action requires root privileges.'; break;
          case 'tor': output = 'NAME\n\ttor - The Onion Router simulation.\n\nSYNOPSIS\n\ttor <command> [args]\n\nCOMMANDS\n\tstart - Initialize Tor circuit\n\tstatus - Check connection status\n\tlist - List hidden services\n\tbrowse <url> - Connect to .onion site'; break;
          case 'radio': output = 'NAME\n\tradio - Software Defined Radio (SDR) interface\n\nSYNOPSIS\n\tradio [scan | tune <freq>]\n\nDESCRIPTION\n\tScans for or tunes to radio frequencies. Useful for intercepting analog signals or numbers stations.\n\nEXAMPLES\n\tradio scan\n\tradio tune 89.9'; break;
          case 'netmap': output = 'NAME\n\tnetmap - Visual Network Mapper\n\nSYNOPSIS\n\tnetmap\n\nDESCRIPTION\n\tLaunches a graphical visualization of the known network topology, showing active nodes and connections.'; break;
          case 'camsnap': output = 'NAME\n\tcamsnap - CCTV/Webcam Interface\n\nSYNOPSIS\n\tcamsnap [-l] [-c <id> [-p <pass>]]\n\nDESCRIPTION\n\tConnects to unsecured video feeds on the local network.\n\nOPTIONS\n\t-l\tList available feeds\n\t-c <id>\tConnect to feed ID\n\t-p <pass>\tProvide authentication token'; break;
          case 'hydra': output = 'NAME\n\thydra - Network Logon Cracker\n\nSYNOPSIS\n\thydra -l <user> -P <passlist> <target>\n\nDESCRIPTION\n\tA very fast network logon cracker which supports many different services.'; break;
          case 'hashcat': output = 'NAME\n\thashcat - Advanced Password Recovery\n\nSYNOPSIS\n\thashcat -m <mode> <hashfile> <wordlist>\n\nDESCRIPTION\n\tWorld\'s fastest password recovery tool.\n\nMODES\n\t0\tMD5\n\t1000\tNTLM\n\t1800\tsha512crypt'; break;
          default: output = `No manual entry for ${page}`;
        }
      }
      break;
    }
    case 'wifi': {
      if (args.length < 1) {
        output = 'usage: wifi [scan|connect <ssid> <password>]';
      } else {
        const subcmd = args[0];
        if (subcmd === 'scan') {
           output = 'Scanning for wireless networks...';
           return { output, newCwd, action: 'wifi_scan_sim' };
        } else if (subcmd === 'connect') {
           if (args.length < 2) {
              output = 'usage: wifi connect <ssid> [password]';
           } else {
              const ssid = args[1];
              const password = args[2];
              
              if (ssid === 'GHOST_NET') {
                  if (password === 'spectre') {
                      output = 'Connected to GHOST_NET (10.0.0.5). Gateway: 10.0.0.1';
                  } else {
                      output = 'Authentication failed.';
                  }
              } else if (ssid === 'Guest') {
                  output = 'Connected to Guest (192.168.2.14). Internet access: Limited.';
              } else if (ssid === 'DE:AD:BE:EF:CA:FE' || ssid === 'Hidden') {
                  if (password === '0xDEADBEEF') {
                      output = 'Connected to BLACK_SITE_LINK (172.16.66.6). WARNING: TRAFFIC MONITORED.\n\x1b[1;32m[MISSION UPDATE] Objective Complete: NETWORK LINK ESTABLISHED.\x1b[0m';
                      if (!VFS['/var/run']) VFS['/var/run'] = { type: 'dir', children: [] };
                      if (!VFS['/var/run/net_status']) {
                          VFS['/var/run/net_status'] = { type: 'file', content: 'CONNECTED_BLACK_SITE' };
                          const runDir = VFS['/var/run'];
                          if (runDir.type === 'dir' && !runDir.children.includes('net_status')) {
                              runDir.children.push('net_status');
                          }
                      }
                  } else {
                      output = 'WEP Authentication failed.';
                  }
              } else {
                  output = `Unable to connect to ${ssid}.`;
              }
           }
        } else {
           output = `wifi: unknown subcommand: ${subcmd}`;
        }
      }
      break;
    }
    case 'iwconfig':
       output = `wlan0     IEEE 802.11  ESSID:"GHOST_NET" ... (Simulated)`;
       break;
    case 'telnet': {
       if (args.length < 1) {
          output = 'telnet: usage: telnet <host> [port]';
       } else {
          const host = args[0];
          const port = args[1] || '23';
          if (host === 'towne.local' || host === '192.168.1.10') {
              if (port === '23') {
                  output = `Trying ${host}...\nConnected to ${host}...\n   STAR WARS - A NEW HOPE (ASCII)\n   (Stream interrupted by admin)\nConnection closed.`;
                  return { output, newCwd, action: 'delay' };
              } else {
                  output = `Trying ${host}...\ntelnet: Unable to connect to remote host: Connection refused`;
                  return { output, newCwd, action: 'delay' };
              }
          } else {
              output = `Trying ${host}...\ntelnet: Unable to connect to remote host: Connection timed out`;
              return { output, newCwd, action: 'delay' };
          }
       }
       break;
    }
    case 'camsnap': {
      if (args.length === 0) {
        output = 'usage: camsnap [-l] [-c <id> [-p <password>]]\n\nOptions:\n  -l             List available camera feeds\n  -c <id>        Connect to camera ID (e.g., 01)\n  -p <password>  Authentication token for restricted feeds';
      } else {
        const list = args.includes('-l');
        const connectIndex = args.indexOf('-c');
        const passIndex = args.indexOf('-p');
        
        if (list) {
            output = `Listing active feeds...
[01] CAM_LOBBY      (192.168.1.50)  - ONLINE
[02] CAM_SERVER     (192.168.1.51)  - ONLINE
[03] CAM_BLACK_SITE (10.66.6.6)     - ENCRYPTED (Auth Required)`;
        } else if (connectIndex !== -1) {
            const id = args[connectIndex + 1];
            const password = passIndex !== -1 ? args[passIndex + 1] : null;
            
            // Check auth for ID 03
            if (id === '03' && password !== 'SPECTRE_EYE' && password !== 'SPECTRE_EVE') {
                output = `camsnap: Camera ID ${id} access denied (Auth Required).`;
            } else if (['01', '02', '03'].includes(id)) {
                output = `Connecting to CAM_${id === '01' ? 'LOBBY' : id === '02' ? 'SERVER' : 'BLACK_SITE'}...`;
                return { output, newCwd, action: 'camsnap_sim', data: { id } };
            } else {
                output = `camsnap: Camera ID ${id} not found.`;
            }
        }
      }
      break;
    }
    case 'mkdir': {
       if (args.length < 1) {
          output = 'usage: mkdir <directory>';
       } else {
          const dirPath = resolvePath(cwd, args[0]);
          const parentPath = dirPath.substring(0, dirPath.lastIndexOf('/')) || '/';
          const dirName = dirPath.substring(dirPath.lastIndexOf('/') + 1);
          if (!getNode(parentPath)) {
             output = `mkdir: cannot create directory '${args[0]}': No such file or directory`;
          } else if (getNode(dirPath)) {
             output = `mkdir: cannot create directory '${args[0]}': File exists`;
          } else {
             VFS[dirPath] = { type: 'dir', children: [] };
             addChild(parentPath, dirName);
             if (dirName === '.ssh' && (cwd === '/home/ghost' || dirPath === '/home/ghost/.ssh')) {
                 const keyPath = `${dirPath}/id_rsa`;
                 VFS[keyPath] = { type: 'file', content: '-----BEGIN OPENSSH PRIVATE KEY-----\nKEY_ID: GHOST_PROTOCOL_INIT\n-----END OPENSSH PRIVATE KEY-----' };
                 addChild(dirPath, 'id_rsa');
                 output = '[SYSTEM] .ssh directory detected. Keypair generated automatically.';
             }
          }
       }
       break;
    }
    case 'calc': {
        if (args.length < 1) {
            output = 'usage: calc <expression>';
        } else {
            const expr = args.join('');
            if (/^[0-9+\-*/().\s%]+$/.test(expr)) {
                try {
                    // eslint-disable-next-line no-eval
                    output = String(eval(expr));
                } catch (e) {
                    output = 'calc: error';
                }
            } else {
                output = 'calc: invalid characters';
            }
        }
        break;
    }
    case 'mount': {
       if (args.length === 0) {
           if (Object.keys(MOUNTED_DEVICES).length === 0) {
               output = '/dev/sda1 on / type ext4 (rw,relatime)\nproc on /proc type proc (rw,nosuid,nodev,noexec,relatime)\nsysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)\ntmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime,size=815276k,mode=755)';
           } else {
               output = '/dev/sda1 on / type ext4 (rw,relatime)\n...\n' + Object.entries(MOUNTED_DEVICES).map(([dev, mp]) => `${dev} on ${mp} type vfat (rw)`).join('\n');
           }
       } else if (args.length < 2) {
           output = 'usage: mount <source> <target>';
       } else {
           const source = args[0];
           const target = resolvePath(cwd, args[1]);
           if (source === '/dev/sdb1') {
               MOUNTED_DEVICES[source] = target;
               VFS[`${target}/README.txt`] = { type: 'file', content: 'WARNING: Restricted materials.' };
               VFS[`${target}/payload.exe`] = { type: 'file', content: 'MZ........PE..' };
               VFS[`${target}/key.txt`] = { type: 'file', content: 'KEY_PART_1: GHOST_ROOT{M0UNT_AND_L0AD}' };
               addChild(target, 'README.txt');
               addChild(target, 'payload.exe');
               addChild(target, 'key.txt');
           } else {
               output = `mount: ${source}: special device does not exist`;
           }
       }
       break;
    }
    case 'umount': {
       if (args.length < 1) {
           output = 'usage: umount <target>';
       } else {
           const target = resolvePath(cwd, args[0]);
           let device = null;
           for (const [dev, mp] of Object.entries(MOUNTED_DEVICES)) {
               if (mp === target) {
                   device = dev;
                   break;
               }
           }
           if (device) {
               delete MOUNTED_DEVICES[device];
               const node = getNode(target);
               if (node && node.type === 'dir') node.children = [];
           } else {
               output = `umount: ${target}: not mounted`;
           }
       }
       break;
    }
    case 'clear':
      output = '\x1b[2J\x1b[0;0H'; 
      break;
    case 'ssh': {
      let target = '';
      let identityFile = null;
      for (let i = 0; i < args.length; i++) {
          if (args[i] === '-i') {
              identityFile = args[i+1];
              i++;
          } else {
              target = args[i];
          }
      }
      if (!target) {
        output = 'usage: ssh [-i identity_file] user@host';
      } else {
        if (target.includes('black-site') || target.includes('192.168.1.99')) {
             const firewallFlushed = !!getNode('/var/run/firewall_flushed');
             if (!firewallFlushed) {
                 output = `ssh: connect to host ${target} port 22: No route to host\n(Hint: Check firewall rules)`;
                 return { output, newCwd, action: 'delay' };
             }

             let hasKey = false;
             if (identityFile) {
                 const keyPath = resolvePath(cwd, identityFile);
                 const keyNode = getNode(keyPath);
                 if (keyNode && keyNode.type === 'file' && keyNode.content.includes('KEY_ID: BLACK_SITE_ACCESS_V1')) {
                     hasKey = true;
                 }
             }
             if (hasKey) {
                 output = `Connecting to ${target}...\n[BLACK SITE TERMINAL]\nWARNING: You are being watched.\n\x1b[1;32m[MISSION UPDATE] Objective Complete: BLACK SITE INFILTRATED.\x1b[0m`;
                 newCwd = '/remote/black-site/root';
                 if (!getNode('/remote/black-site/root')) {
                     VFS['/remote/black-site'] = { type: 'dir', children: ['root'] };
                     VFS['/remote/black-site/root'] = { type: 'dir', children: ['FLAG.txt'] };
                     VFS['/remote/black-site/root/FLAG.txt'] = { type: 'file', content: 'GHOST_ROOT{PR1V4T3_K3Y_ACQU1R3D}' };
                 }
                 return { output, newCwd, action: 'delay', newPrompt: 'root@black-site#' };
             } else {
                 output = `Connecting to ${target}...\nPermission denied (publickey).\n(Hint: You need a valid key file.)`;
                 return { output, newCwd, action: 'delay' };
             }
        } else if (target.includes('admin-pc')) {
             output = `Connecting to ${target}...\nPermission denied (publickey).\n(Hint: Try cracking the 'backup' user)`;
             return { output, newCwd, action: 'delay' };
        } else {
             output = `ssh: connect to host ${target} port 22: Connection timed out`;
             return { output, newCwd, action: 'delay' };
        }
      }
      break;
    }
    case 'whois': {
      if (args.length < 1) {
        output = 'usage: whois <user|domain|entity>';
      } else {
        const query = args[0].toLowerCase();
        if (query === 'ghost') output = 'User: GHOST_ROOT\nStatus: ACTIVE';
        else if (query === 'admin') output = 'User: SYSADMIN\nHint: "I hid the key in the .cache folder."';
        else if (query === 'omega') output = 'Entity: PROJECT_OMEGA\nClass: WORLD_ENDER';
        else output = `No data found for ${args[0]}.`;
      }
      break;
    }
    case 'analyze': {
      if (args.length < 1) {
        output = 'usage: analyze <file>';
      } else {
        const fileTarget = args[0];
        const filePath = resolvePath(cwd, fileTarget);
        const fileNode = getNode(filePath);
        if (!fileNode) {
          output = `analyze: ${fileTarget}: No such file`;
        } else if (fileNode.type === 'dir') {
          output = `analyze: ${fileTarget}: Is a directory`;
        } else {
          output = `File: ${fileTarget}\nSize: ${fileNode.content.length}\nEntropy: 7.82\nHeuristics: LOW RISK`;
        }
      }
      break;
    }
    case 'decrypt': {
      if (ALERT_LEVEL > 4) {
          output = '[SYSTEM] SECURITY LOCKDOWN ACTIVE. TERMINAL UNRESPONSIVE.';
          return { output, newCwd, action: 'kernel_panic' };
      }

      if (args.length < 1) {
        output = 'usage: decrypt <file> [password]';
      } else {
        const fileTarget = args[0];
        const filePath = resolvePath(cwd, fileTarget);
        const fileNode = getNode(filePath);
        const run = getNode('/var/run');
        
        const updateCount = () => {
            if (run && run.type === 'dir') {
                const c = getNode('/var/run/decrypt_count');
                let val = (c && c.type === 'file') ? parseInt(c.content) : 0;
                val++;
                VFS['/var/run/decrypt_count'] = { type: 'file', content: String(val) };
                if (!run.children.includes('decrypt_count')) run.children.push('decrypt_count');
                return val;
            }
            return 1;
        };

        if (!fileNode) {
          output = `decrypt: ${fileTarget}: No such file`;
        } else if (fileNode.type === 'dir') {
          output = `decrypt: ${fileTarget}: Is a directory`;
        } else {
          if (fileNode.content.includes('BINARY_PAYLOAD') || filePath.endsWith('payload.bin')) {
              if (args[1] === 'spectre') {
                  updateCount();
                  output = `[SUCCESS] Decryption Complete.\n\x1b[1;32m[MISSION UPDATE] INTEL RECOVERED (1/3)\x1b[0m\n-----BEGIN RSA PRIVATE KEY-----\nKEY_ID: BLACK_SITE_ACCESS_V1\n-----END RSA PRIVATE KEY-----`;
              } else {
                  ALERT_LEVEL++;
                  output = `Error: Invalid password. [WARNING: INTRUSION DETECTED. THREAT LEVEL ${ALERT_LEVEL}/5]`;
              }
          } else if (filePath.includes('operation_blackout')) {
              if (args[1] === 'red_ledger') {
                  updateCount();
                  output = `[SUCCESS] Decryption Complete.\n\x1b[1;32m[MISSION UPDATE] INTEL RECOVERED (2/3)\x1b[0m\n${atob(fileNode.content)}`;
              } else {
                  ALERT_LEVEL++;
                  output = `Error: Invalid password. [WARNING: INTRUSION DETECTED. THREAT LEVEL ${ALERT_LEVEL}/5]`;
              }
          } else if (filePath.includes('entry_02.enc')) {
              if (args[1] === 'hunter2') {
                  updateCount();
                  output = `[SUCCESS] Decryption Complete.\n\x1b[1;32m[MISSION UPDATE] INTEL RECOVERED (3/3)\x1b[0m\n${atob(fileNode.content)}`;
              } else {
                  ALERT_LEVEL++;
                  output = 'Error: Invalid password. (Hint: Check the logs)';
              }
          } else if (filePath.includes('KEYS.enc')) {
              if (args[1] === 'Spectre' || args[1] === 'spectre') {
                  updateCount();
                  output = `Decrypting...\n[SUCCESS] DECRYPTED CONTENT:\n\nKEY_ID: COSMOS-2542\nPAYLOAD: LAUNCH_CODE_KEY = "RED_STORM_RISING"`;
              } else {
                  ALERT_LEVEL++;
                  output = 'Error: Invalid password. (Hint: The password is the name of the user who owns the key)';
              }
          } else if (filePath.includes('launch_codes.bin')) {
              // ADVERSARIAL LAYER: Requires ENV VAR check
              if (!ENV_VARS['DECRYPTION_PROTOCOL'] || ENV_VARS['DECRYPTION_PROTOCOL'] !== 'ENABLED') {
                  output = 'decrypt: ERROR: Decryption Protocol not initialized.\n[HINT] Set environment variable DECRYPTION_PROTOCOL=ENABLED';
                  return { output, newCwd };
              }

              if (args[1] === 'RED_STORM_RISING') {
                  if (run && run.type === 'dir') {
                      VFS['/var/run/launch_ready'] = { type: 'file', content: 'TRUE' };
                      if (!run.children.includes('launch_ready')) run.children.push('launch_ready');
                  }
                  output = 'Decrypting...\n\n[SUCCESS] LAUNCH CODES CONFIRMED.\n\x1b[1;32m[MISSION UPDATE] FINAL OBJECTIVE: SYSTEM LIBERATION READY.\x1b[0m\nINITIATING SYSTEM LIBERATION...';
                  return { output, newCwd, action: 'win_sim' };
              } else {
                  ALERT_LEVEL++;
                  output = `Error: Invalid decryption key. [WARNING: THREAT LEVEL ${ALERT_LEVEL}/5]`;
              }
          } else {
              try { output = atob(fileNode.content); } catch (e) { output = 'Error: File not encrypted or corrupted.'; }
          }
        }
      }
      break;
    }
    case 'phone':
    case 'call': {
       if (args.length < 1) {
           output = 'usage: phone <number>';
       } else {
           const number = args[0];
           if (number === '911' || number === '110' || number === '999') {
               output = 'Emergency services are not available in this secure environment.';
           } else {
               output = `Dialing ${number}...`;
               return { output, newCwd, action: 'call_sim', data: { number } };
           }
       }
       break;
    }
    case 'exit':
        output = 'Logout.';
        break;
    case 'ping': {
       if (args.length < 1) {
           output = 'usage: ping <host>';
       } else {
           const host = args[0];
           // Lore mapping
           const hosts: Record<string, string> = {
               'localhost': '127.0.0.1',
               '127.0.0.1': '127.0.0.1',
               'google.com': '8.8.8.8',
               '8.8.8.8': '8.8.8.8',
               'black-site.local': '192.168.1.99',
               '192.168.1.99': '192.168.1.99',
               'admin-pc': '192.168.1.5',
               '192.168.1.5': '192.168.1.5',
               'gateway': '192.168.1.1',
               '192.168.1.1': '192.168.1.1'
           };
           
           const ip = hosts[host] || (host.match(/^\d+\.\d+\.\d+\.\d+$/) ? host : null);
           
           if (ip) {
               const seqs = [1, 2, 3, 4];
               output = `PING ${host} (${ip}) 56(84) bytes of data.\n` + 
                        seqs.map(s => `64 bytes from ${ip}: icmp_seq=${s} ttl=64 time=${(Math.random() * 10 + 2).toFixed(1)} ms`).join('\n') +
                        `\n\n--- ${host} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3005ms`;
               return { output, newCwd, action: 'delay' };
           } else {
               output = `ping: ${host}: Name or service not known`;
           }
       }
       break;
    }
    case 'nslookup': {
       if (args.length < 1) {
           output = 'usage: nslookup <host>';
       } else {
           const host = args[0];
           const dnsServer = '192.168.1.1';
           
           const records: Record<string, string> = {
               'black-site.local': '192.168.1.99',
               'ghost-net.local': '10.0.0.1',
               'admin-pc.local': '192.168.1.5',
               'towne.local': '192.168.1.10',
               'google.com': '142.250.196.14',
               'project-omega.com': '203.0.113.42'
           };
           
           const ip = records[host];
           
           output = `Server:\t\t${dnsServer}\nAddress:\t${dnsServer}#53\n\n`;
           
           if (ip) {
               output += `Non-authoritative answer:\nName:\t${host}\nAddress: ${ip}`;
           } else {
               output += `** server can't find ${host}: NXDOMAIN`;
           }
       }
       break;
    }
    case 'dig': {
       if (args.length < 1) {
           output = 'usage: dig <host>';
       } else {
           const host = args[0];
           const records: Record<string, string> = {
               'black-site.local': '192.168.1.99',
               'ghost-net.local': '10.0.0.1',
               'admin-pc.local': '192.168.1.5',
               'towne.local': '192.168.1.10',
               'google.com': '142.250.196.14',
               'project-omega.com': '203.0.113.42'
           };
           const ip = records[host];
           
           if (ip) {
               output = `
; <<>> DiG 9.16.1-Ubuntu <<>> ${host}
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: ${Math.floor(Math.random()*65535)}
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;${host}.			IN	A

;; ANSWER SECTION:
${host}.		300	IN	A	${ip}

;; Query time: ${Math.floor(Math.random()*50)} msec
;; SERVER: 192.168.1.1#53(192.168.1.1)
;; WHEN: ${new Date().toUTCString()}
;; MSG SIZE  rcvd: 59`;
           } else {
               output = `
; <<>> DiG 9.16.1-Ubuntu <<>> ${host}
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: ${Math.floor(Math.random()*65535)}
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1

;; QUESTION SECTION:
;${host}.			IN	A

;; AUTHORITY SECTION:
.			10800	IN	SOA	a.root-servers.net. nstld.verisign-grs.com. 2026021000 1800 900 604800 86400

;; Query time: ${Math.floor(Math.random()*50)} msec
;; SERVER: 192.168.1.1#53(192.168.1.1)
;; WHEN: ${new Date().toUTCString()}
;; MSG SIZE  rcvd: 104`;
           }
       }
       break;
    }
    case 'trace':
    case 'traceroute': {
       if (args.length < 1) {
           output = 'usage: traceroute <host>';
           return { output, newCwd };
       }
       output = `traceroute to ${args[0]} (TCP), 30 hops max, 60 byte packets`;
       return { output, newCwd, action: 'trace_sim', data: { target: args[0] } };
    }
    case 'netstat': {
       const runDir = '/var/run';
       if (!VFS[runDir]) VFS[runDir] = { type: 'dir', children: [] };
       const rdNode = VFS[runDir];
       // Ensure init if empty (same logic as systemctl)
       if (rdNode && rdNode.type === 'dir' && rdNode.children.length === 0 && !(rdNode as any).__init) {
           ['sshd', 'cron', 'networking'].forEach(s => {
               VFS[`${runDir}/${s}.pid`] = { type: 'file', content: String(Math.floor(Math.random() * 30000)) };
               rdNode.children.push(`${s}.pid`);
           });
           (rdNode as any).__init = true;
       }

       const activePids = (rdNode && rdNode.type === 'dir') ? rdNode.children
           .filter(f => f.endsWith('.pid'))
           .map(f => f.replace('.pid', '')) : [];

       const dynamicConnections = [];
       
       if (activePids.includes('sshd')) {
           dynamicConnections.push({ proto: 'tcp', recv: 0, send: 0, local: '0.0.0.0:22', remote: '0.0.0.0:*', state: 'LISTEN', pid: '404/sshd' });
       }
       if (activePids.includes('tor')) {
           dynamicConnections.push({ proto: 'tcp', recv: 0, send: 0, local: '127.0.0.1:9050', remote: '0.0.0.0:*', state: 'LISTEN', pid: '6666/tor' });
       }
       if (activePids.includes('apache2')) {
           dynamicConnections.push({ proto: 'tcp', recv: 0, send: 0, local: '0.0.0.0:80', remote: '0.0.0.0:*', state: 'LISTEN', pid: '8080/apache2' });
       }
       if (activePids.includes('postgresql')) {
           dynamicConnections.push({ proto: 'tcp', recv: 0, send: 0, local: '127.0.0.1:5432', remote: '0.0.0.0:*', state: 'LISTEN', pid: '5432/postgres' });
       }
       
       // Add some random established connections if networking is up
       if (activePids.includes('networking')) {
           dynamicConnections.push({ proto: 'tcp', recv: 0, send: 0, local: '192.168.1.105:22', remote: '192.168.1.5:54322', state: 'ESTABLISHED', pid: '404/sshd' });
           dynamicConnections.push({ proto: 'tcp', recv: 0, send: 0, local: '192.168.1.105:443', remote: '10.0.0.1:49201', state: 'TIME_WAIT', pid: '-' });
           if (activePids.includes('tor')) {
               dynamicConnections.push({ proto: 'tcp', recv: 0, send: 0, local: '127.0.0.1:9050', remote: '127.0.0.1:54321', state: 'ESTABLISHED', pid: '6666/tor' });
           }
       }

       const header = 'Active Internet connections (servers and established)';
       const table = dynamicConnections.map(c => {
         return `${c.proto}  ${String(c.recv).padStart(6)} ${String(c.send).padStart(6)}  ${c.local.padEnd(20)} ${c.remote.padEnd(20)} ${c.state.padEnd(12)} ${c.pid}`;
       }).join('\n');
       output = `${header}\nProto Recv-Q Send-Q  Local Address        Foreign Address      State        PID/Program name\n${table}`;
       break;
    }
    case 'gcc': {
      if (args.length < 1) {
        output = 'gcc: no input files';
      } else {
        let inputFile = '';
        let outputFile = 'a.out';
        
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '-o') {
                if (args[i+1]) {
                    outputFile = args[i+1];
                    i++;
                }
            } else if (!args[i].startsWith('-')) {
                inputFile = args[i];
            }
        }

        if (!inputFile) {
            output = 'gcc: no input files';
        } else {
            const node = getNode(resolvePath(cwd, inputFile));
            if (!node) {
                output = `gcc: error: ${inputFile}: No such file or directory`;
            } else if (node.type === 'dir') {
                output = `gcc: error: ${inputFile}: Is a directory`;
            } else {
                // Compilation Success Simulation
                output = '';
                const newPath = resolvePath(cwd, outputFile);
                const parentPath = newPath.substring(0, newPath.lastIndexOf('/')) || '/';
                const fileName = newPath.substring(newPath.lastIndexOf('/') + 1);
                
                // Add the binary file
                VFS[newPath] = { 
                    type: 'file', 
                    content: `[BINARY_ELF_X86_64: ${fileName}]\n(Execute with ./${fileName})` 
                };
                addChild(parentPath, fileName);
            }
        }
      }
      break;
    }
    case 'make': {
        const makefileNode = getNode(resolvePath(cwd, 'Makefile'));
        if (!makefileNode || makefileNode.type !== 'file') {
            output = 'make: *** No targets specified and no makefile found.  Stop.';
        } else {
            output = '';
            const lines = makefileNode.content.split('\n');
            let targetFound = false;
            
            // Simple make simulation: find first target or specified target
            // and execute commands below it (must be indented)
            const target = args[0] || 'all';
            
            // If target is all and not explicitly defined, grab first target
            let actualTarget = target;
            if (target === 'all' && !lines.some(l => l.startsWith('all:'))) {
                 const first = lines.find(l => /^[a-zA-Z0-9_-]+:/.test(l));
                 if (first) actualTarget = first.split(':')[0];
            }

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.startsWith(actualTarget + ':')) {
                    targetFound = true;
                    continue; 
                }
                
                if (targetFound) {
                    if (line.trim() === '' || line.startsWith('#')) continue;
                    if (!line.startsWith('\t') && !line.startsWith('    ')) {
                        break; // End of target block
                    }
                    
                    const cmd = line.trim();
                    output += cmd + '\n';
                    
                    // Dangerous: recursive call to processCommand. 
                    // To avoid infinite recursion or complexity, we'll manually handle gcc here or call simple logic
                    // Actually, let's just support 'gcc' inside make for now.
                    if (cmd.startsWith('gcc')) {
                         const gccRes = processCommand(cwd, cmd);
                         if (gccRes.output) output += gccRes.output + '\n';
                    } else if (cmd.startsWith('echo')) {
                         output += cmd.substring(5).replace(/"/g, '') + '\n';
                    }
                }
            }
            
            if (!targetFound) {
                 output = `make: *** No rule to make target '${target}'.  Stop.`;
            }
        }
        break;
    }
    case 'gobuster': {
       if (args.length < 1) {
           output = 'usage: gobuster <dir|dns> -u <url> -w <wordlist>';
       } else {
           const urlIdx = args.indexOf('-u');
           const url = urlIdx !== -1 ? args[urlIdx + 1] : null;
           
           if (!url) {
               output = 'gobuster: error: required flag --url not set';
           } else {
               if (url.includes('192.168.1.99') || url.includes('black-site')) {
                   output = `
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     ${url}
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/common.txt
[+] Status codes:            200,204,301,302,307,401,403
[+] User Agent:              gobuster/3.1.0
[+] Timeout:                 10s
===============================================================
2026/10/23 15:45:01 Starting gobuster in directory enumeration mode
===============================================================
/index.html           (Status: 200) [Size: 162]
/robots.txt           (Status: 200) [Size: 45]
/admin                (Status: 301) [Size: 0] [--> /admin/]
/backup               (Status: 403) [Size: 284]
/hidden               (Status: 301) [Size: 0] [--> /hidden/]
/.git                 (Status: 403) [Size: 284]
===============================================================
2026/10/23 15:45:05 Finished
===============================================================
`;
                   return { output, newCwd, action: 'scan_sim' };
               } else if (url.includes('google.com')) {
                   output = `
===============================================================
Gobuster v3.1.0
===============================================================
[+] Url:                     ${url}
...
/search               (Status: 200)
/images               (Status: 200)
/maps                 (Status: 200)
===============================================================
`;
               } else {
                   output = `
===============================================================
Gobuster v3.1.0
===============================================================
[+] Url:                     ${url}
...
Error: Connection timed out (Is the host up?)
===============================================================
`;
               }
           }
       }
       break;
    }
    case 'scan':
    case 'nmap': {
      if (args.length < 1) {
          output = 'usage: nmap <target_ip|cidr>';
      } else {
          const target = args[0];
          if (target === '192.168.1.0/24' || target === '10.0.0.0/24') {
              // Mark scan complete for status
              const run = getNode('/var/run');
              if (run && run.type === 'dir') {
                  VFS['/var/run/scan_complete'] = { type: 'file', content: 'TRUE' };
                  if (!run.children.includes('scan_complete')) run.children.push('scan_complete');
              }

              // Simulated scan result
              output = `Starting Nmap 7.91 ( https://nmap.org ) at 2026-10-23 15:42 JST
Nmap scan report for 192.168.1.1 (Gateway)
Host is up (0.0012s latency).
Not shown: 998 closed ports
PORT     STATE SERVICE
53/tcp   open  domain
80/tcp   open  http

Nmap scan report for 192.168.1.5 (Admin-PC)
Host is up (0.0045s latency).
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
443/tcp  open  https
3389/tcp open  ms-wbt-server

Nmap scan report for 192.168.1.99 (Unknown)
Host is up (0.0890s latency).
PORT     STATE    SERVICE
22/tcp   filtered ssh
80/tcp   filtered http
443/tcp  open     https
6667/tcp open     irc

Nmap done: 256 IP addresses (3 hosts up) scanned in 4.20 seconds
\x1b[1;32m[MISSION UPDATE] Objective Complete: NETWORK MAPPED.\x1b[0m`;
              return { output, newCwd, action: 'scan_sim' }; // Trigger UI effect
          } else if (target === '192.168.1.99') {
              output = `Starting Nmap 7.91...
Nmap scan report for 192.168.1.99
Host is up (0.0050s latency).
PORT     STATE    SERVICE
22/tcp   filtered ssh
80/tcp   filtered http
443/tcp  open     https
6667/tcp open     irc
8080/tcp closed   http-proxy`;
               return { output, newCwd, action: 'scan_sim' };
          } else {
              output = `Starting Nmap 7.91...
Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn
Nmap done: 1 IP address (0 hosts up) scanned in 0.52 seconds`;
          }
      }
      break;
    }
    case 'lsof': {
        const header = 'COMMAND    PID  USER   FD   TYPE DEVICE SIZE/OFF NODE NAME';
        let outputLines = [header];
        
        PROCESSES.forEach(p => {
             // Generate fake LSOF lines based on PID
             const cmd = p.command.split(' ')[0].split('/').pop() || p.command;
             outputLines.push(`${cmd.padEnd(9)} ${String(p.pid).padStart(5)} ${p.user.padEnd(5)}  cwd    DIR  253,0     4096    2 /`);
             outputLines.push(`${cmd.padEnd(9)} ${String(p.pid).padStart(5)} ${p.user.padEnd(5)}  txt    REG  253,0   13370 1024 ${p.command.split(' ')[0]}`);
             
             if (p.pid === 1) {
                 outputLines.push(`${cmd.padEnd(9)} ${String(p.pid).padStart(5)} ${p.user.padEnd(5)}   22u  IPv4  13370      0t0  TCP *:631 (LISTEN)`);
             } else if (p.pid === 404) {
                 outputLines.push(`${cmd.padEnd(9)} ${String(p.pid).padStart(5)} ${p.user.padEnd(5)}    3u  IPv4  22222      0t0  TCP *:22 (LISTEN)`);
             } else if (p.pid === 8888) {
                 outputLines.push(`${cmd.padEnd(9)} ${String(p.pid).padStart(5)} ${p.user.padEnd(5)}    4u  IPv4  88888      0t0  UDP *:68`);
             } else if (p.pid === 9999) {
                 outputLines.push(`${cmd.padEnd(9)} ${String(p.pid).padStart(5)} ${p.user.padEnd(5)}    3u  IPv4  99999      0t0  TCP 192.168.1.105:31337->192.168.1.99:443 (SYN_SENT)`);
             } else if (p.pid === 1337) {
                 outputLines.push(`${cmd.padEnd(9)} ${String(p.pid).padStart(5)} ${p.user.padEnd(5)}  255u   CHR  136,0      0t0    3 /dev/pts/0`);
             }
        });
        
        if (args.length > 0) {
            if (args.includes('-i')) {
                output = outputLines.filter((l, i) => i === 0 || l.includes('IPv4') || l.includes('IPv6')).join('\n');
            } else {
                // Filter by PID or name if provided
                const query = args[0];
                output = outputLines.filter((l, i) => i === 0 || l.includes(query)).join('\n');
            }
        } else {
            output = outputLines.join('\n');
        }
        break;
    }
    case 'ifconfig':
       output = 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>...';
       break;
    case 'nc': {
       const isListen = args.includes('-l');
       const verbose = args.includes('-v');
       const portIndex = args.indexOf('-p');
       let port = portIndex !== -1 ? args[portIndex + 1] : null;
       
       // Filter out flags to find host
       const nonFlagArgs = args.filter((a, i) => !a.startsWith('-') && (i === 0 || args[i-1] !== '-p'));
       const host = nonFlagArgs[0];
       if (!port && nonFlagArgs[1]) port = nonFlagArgs[1];

       if (isListen) {
           if (!port) {
               output = 'nc: usage: nc -l -p <port>';
           } else {
               output = `Listening on [0.0.0.0] (family 0, port ${port})\n...`;
               return { output, newCwd, action: 'delay' }; 
           }
       } else {
           if (!host) {
               output = 'usage: nc [options] <host> <port>';
           } else {
               const p = port || '23';
               if (host === '192.168.1.99' || host === 'black-site.local') {
                   if (p === '6667') {
                       output = `(UNKNOWN) [192.168.1.99] 6667 (?) open\n:irc.black-site.local NOTICE * :*** Looking up your hostname...\n:irc.black-site.local NOTICE * :*** Found your hostname\n:irc.black-site.local 001 ghost :Welcome to the Black Site IRC Network ghost!user@ghost-root\n`;
                       return { output, newCwd, action: 'irc_sim', data: { server: host, channel: '#lobby', nick: 'ghost' } };
                   } else if (p === '80') {
                        output = `(UNKNOWN) [192.168.1.99] 80 (http) open\nGET / HTTP/1.1\n\nHTTP/1.1 403 Forbidden\nServer: nginx/1.18.0\nDate: ${new Date().toUTCString()}\nContent-Type: text/html\nContent-Length: 162\n\n<html>\n<head><title>403 Forbidden</title></head>\n<body>\n<center><h1>403 Forbidden</h1></center>\n<hr><center>nginx/1.18.0</center>\n</body>\n</html>`;
                   } else {
                        output = `(UNKNOWN) [${host}] ${p} (?) : Connection refused`;
                   }
               } else if (host === 'localhost' || host === '127.0.0.1') {
                   if (p === '1337') {
                       output = `localhost [127.0.0.1] 1337 (?): open\n[BACKDOOR_LISTENER_V2]\n> Awaiting Payload...`;
                   } else {
                       output = `localhost [127.0.0.1] ${p} (?): Connection refused`;
                   }
               } else {
                   if (verbose) output = `nc: connect to ${host} port ${p} (tcp) failed: Connection refused`;
                   else output = `nc: connect to ${host} port ${p} (tcp) failed: Connection refused`;
               }
           }
       }
       break;
    }
    case 'touch': {
      if (args.length < 1) {
        output = 'usage: touch <file>';
      } else {
        const target = args[0];
        const path = resolvePath(cwd, target);
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        const fileName = path.substring(path.lastIndexOf('/') + 1);
        const parentNode = getNode(parentPath);
        if (parentNode && parentNode.type === 'dir') {
          if (!getNode(path)) {
             VFS[path] = { type: 'file', content: '' };
             parentNode.children.push(fileName);
          }
        }
      }
      break;
    }
    case 'rm': {
      if (args.length < 1) {
        output = 'usage: rm <file>';
      } else {
        const target = args[0];
        const path = resolvePath(cwd, target);
        const isRoot = !!getNode('/tmp/.root_session');

        // Critical system files check
        if (['/bin/bash', '/sbin/init', '/vmlinuz', '/boot/vmlinuz'].includes(path) || path === '/') {
             if (isRoot && (args.includes('-rf') || args.includes('--no-preserve-root'))) {
                 return { output: 'Deleting critical system file...', newCwd, action: 'kernel_panic' };
             } else {
                 output = `rm: cannot remove '${target}': Permission denied`;
             }
        } else {
            const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
            const fileName = path.substring(path.lastIndexOf('/') + 1);
            const parentNode = getNode(parentPath);
            if (parentNode && parentNode.type === 'dir') {
              delete VFS[path];
              parentNode.children = parentNode.children.filter(c => c !== fileName);
            } else {
                output = `rm: cannot remove '${target}': No such file or directory`;
            }
        }
      }
      break;
    }
    case 'dd': {
        const ifArg = args.find(a => a.startsWith('if='));
        const ofArg = args.find(a => a.startsWith('of='));
        if (ifArg && ofArg) {
            const outFile = ofArg.split('=')[1];
            const outPath = resolvePath(cwd, outFile);
            
            if (outPath === '/dev/sda' || outPath === '/dev/hda' || outPath === '/dev/disk0') {
                 const isRoot = !!getNode('/tmp/.root_session');
                 if (isRoot) {
                     output = 'dd: writing to disk...';
                     return { output, newCwd, action: 'kernel_panic' };
                 } else {
                     output = `dd: ${outFile}: Permission denied`;
                 }
            } else {
                output = `1024+0 records in\n1024+0 records out\n524288 bytes (524 kB) copied, 0.001337 s, 392 MB/s`;
            }
        } else {
            output = 'usage: dd if=<source> of=<dest>';
        }
        break;
    }
    case 'steghide': {
       const hasExtract = args.includes('extract') || args.includes('-sf');
       const hasInfo = args.includes('info');
       
       if (!hasExtract && !hasInfo) {
           output = 'steghide: usage: steghide extract -sf <file> -p <passphrase>';
       } else {
           // Extract
           let fileTarget: string | undefined;
           const sfIndex = args.indexOf('-sf');
           if (sfIndex !== -1 && args[sfIndex + 1]) {
               fileTarget = args[sfIndex + 1];
           } else {
               fileTarget = args.find(a => a.endsWith('.jpg'));
           }

           if (!fileTarget) {
               output = 'steghide: argument "-sf <filename>" missing';
           } else {
               const filePath = resolvePath(cwd, fileTarget);
               const fileNode = getNode(filePath);

               if (!fileNode || fileNode.type !== 'file') {
                   output = `steghide: could not open "${fileTarget}".`;
               } else {
                   const pIndex = args.indexOf('-p');
                   const passphrase = (pIndex !== -1 && args[pIndex + 1]) ? args[pIndex + 1] : null;

                   if (!passphrase) {
                       output = 'steghide: passphrase required (use -p <passphrase>)';
                   } else if (passphrase === 'kirov_reporting') {
                       // Success
                       const payloadName = 'payload.txt';
                       const payloadPath = cwd === '/' ? `/${payloadName}` : `${cwd}/${payloadName}`;
                       
                       // Write file
                       VFS[payloadPath] = { 
                           type: 'file', 
                           content: 'CAUTION: CLASSIFIED MATERIAL\n\nAccess Code: black_widow_protocol_init\n\nUse this to gain root privileges via "su root".' 
                       };
                       
                       // Add to parent
                       const parentNode = getNode(cwd);
                       if (parentNode && parentNode.type === 'dir' && !parentNode.children!.includes(payloadName)) {
                           parentNode.children!.push(payloadName);
                       }
                       
                       output = `wrote extracted data to "${payloadName}".`;
                   } else {
                       output = `steghide: could not extract data: invalid passphrase "${passphrase}"`;
                   }
               }
           }
       }
       break;
    }
    case 'crack': {
      output = 'Cracking...';
      return { output, newCwd, action: 'crack_sim', data: { target: args[0], user: args[1], success: false } };
    }
    case 'dmesg':
      output = '[    0.000000] Linux version 5.4.0-ghost...';
      break;
    case 'top':
      return { output: '', newCwd, action: 'top_sim' };
    case 'ps': {
      let procs = [...PROCESSES];
      if (LOADED_MODULES.includes('rootkit')) {
          procs = procs.filter(p => p.pid !== 666 && p.pid !== 9999 && !p.command.includes('hydra') && !p.command.includes('spectre'));
      }

      if (args.includes('aux') || args.includes('-aux')) {
          output = 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n' +
          procs.map(p => {
              const vsz = Math.floor(Math.random() * 100000);
              const rss = Math.floor(Math.random() * 50000);
              return `${p.user.padEnd(8)} ${String(p.pid).padStart(5)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${String(vsz).padStart(6)} ${String(rss).padStart(5)} ${p.tty.padEnd(8)} ${p.stat.padEnd(4)} 14:02   ${p.time.padStart(5)} ${p.command}`;
          }).join('\n');
      } else if (args.includes('-ef') || args.includes('ef')) {
          output = 'UID        PID  PPID  C STIME TTY          TIME CMD\n' +
          procs.map(p => {
              const ppid = p.pid === 1 ? 0 : 1;
              return `${p.user.padEnd(8)} ${String(p.pid).padStart(5)} ${String(ppid).padStart(5)}  0 14:02 ${p.tty.padEnd(8)} ${p.time.padStart(8)} ${p.command}`;
          }).join('\n');
      } else {
          // Default minimal output
          output = '  PID TTY          TIME CMD\n' +
          procs.filter(p => p.tty !== '?').map(p => {
              return `${String(p.pid).padStart(5)} ${p.tty.padEnd(8)} ${p.time.padStart(8)} ${p.command}`;
          }).join('\n');
      }
      break;
    }
    case 'lsmod': {
      if (LOADED_MODULES.length === 0) {
          output = 'Module                  Size  Used by';
      } else {
          output = 'Module                  Size  Used by\n' + 
                   LOADED_MODULES.map(m => `${m.padEnd(24)} ${String(Math.floor(Math.random()*10000+4096)).padEnd(6)} 0`).join('\n');
      }
      break;
    }
    case 'insmod': {
      if (args.length < 1) {
          output = 'insmod: usage: insmod <filename>';
      } else {
          const fileTarget = args[0];
          const node = getNode(resolvePath(cwd, fileTarget));
          
          if (!node) {
              output = `insmod: ERROR: could not load module ${fileTarget}: No such file or directory`;
          } else if (node.type === 'dir') {
              output = `insmod: ERROR: could not load module ${fileTarget}: Is a directory`;
          } else {
              // Check magic signature for .ko
              if (node.content.startsWith('\x7fELF') || fileTarget.endsWith('.ko')) {
                  const modName = fileTarget.split('/').pop()?.replace('.ko', '') || 'unknown';
                  
                  if (LOADED_MODULES.includes(modName)) {
                      output = `insmod: ERROR: could not insert module ${fileTarget}: Module already in kernel`;
                  } else {
                      LOADED_MODULES.push(modName);
                      output = ''; // Silent success on Linux usually
                  }
              } else {
                  output = `insmod: ERROR: could not insert module ${fileTarget}: Invalid module format`;
              }
          }
      }
      break;
    }
    case 'rmmod': {
       if (args.length < 1) {
           output = 'rmmod: usage: rmmod <modulename>';
       } else {
           const modName = args[0];
           const idx = LOADED_MODULES.indexOf(modName);
           if (idx !== -1) {
               LOADED_MODULES.splice(idx, 1);
               output = ''; // Silent success
           } else {
               output = `rmmod: ERROR: Module ${modName} is not currently loaded`;
           }
       }
       break;
    }
    case 'kill': {
      if (args.length < 1) {
          output = 'kill: usage: kill [-s signal|-p] [-a] <pid>...';
      } else {
          // Ignore signals for now, just extract PID
          const pidStr = args[args.length - 1];
          const pid = parseInt(pidStr, 10);
          
          if (isNaN(pid)) {
              output = `kill: ${pidStr}: arguments must be process or job IDs`;
          } else {
              const idx = PROCESSES.findIndex(p => p.pid === pid);
              if (idx === -1) {
                  output = `kill: (${pid}) - No such process`;
              } else {
                  const proc = PROCESSES[idx];
                  if (pid === 1) {
                      output = 'Attempting to kill init process...';
                      return { output, newCwd, action: 'kernel_panic' };
                  } else if (pid === 666) {
                      output = `bash: kill: (${pid}) - Operation not permitted\n[SYSTEM] Warning: Do not disturb the spectre kernel.`;
                      // Maybe modify it slightly to show it reacted? No, just deny.
                  } else if (pid === 1337) {
                      output = 'Terminating shell...';
                      return { output, newCwd, action: 'kernel_panic' }; // Or just exit
                  } else {
                      PROCESSES.splice(idx, 1);
                      output = `[${pid}] Terminated.`;
                  }
              }
          }
      }
      break;
    }
    case 'cp': {
      if (args.length < 2) output = 'usage: cp <source> <dest>';
      else {
          const srcNode = getNode(resolvePath(cwd, args[0]));
          if (srcNode) {
              const destPath = resolvePath(cwd, args[1]);
              const parent = getNode(destPath.substring(0, destPath.lastIndexOf('/')));
              if (parent && parent.type === 'dir') {
                  // Simplified: doesn't handle cp dir to dir
                  if (srcNode.type === 'file') {
                      VFS[destPath] = { type: 'file', content: srcNode.content };
                      parent.children.push(destPath.substring(destPath.lastIndexOf('/') + 1));
                  }
              }
          }
      }
      break;
    }
    case 'mv': {
      if (args.length < 2) output = 'usage: mv <source> <dest>';
      else {
          // Simplified move logic
          output = 'mv: done'; 
      }
      break;
    }
    case 'locate': {
      output = Object.keys(VFS).filter(k => k.includes(args[0])).join('\n');
      break;
    }
    case 'find': {
      let searchPath = cwd;
      let namePattern: RegExp | null = null;
      let typeFilter: 'f' | 'd' | null = null;
      
      let argIdx = 0;
      // Check if first arg is a path (doesn't start with -)
      if (args.length > 0 && !args[0].startsWith('-')) {
          searchPath = resolvePath(cwd, args[0]);
          argIdx++;
      }
      
      let error = '';

      while (argIdx < args.length) {
          const arg = args[argIdx];
          if (arg === '-name') {
              const pattern = args[argIdx + 1];
              if (pattern) {
                  // Simple glob to regex
                  // Escape regex special chars except *
                  // Then replace * with .*
                  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
                  const regexStr = '^' + escaped.replace(/\*/g, '.*') + '$';
                  namePattern = new RegExp(regexStr);
                  argIdx += 2;
              } else {
                  error = 'find: missing argument to `-name\'';
                  break;
              }
          } else if (arg === '-type') {
              const type = args[argIdx + 1];
              if (type === 'f' || type === 'd') {
                  typeFilter = type;
                  argIdx += 2;
              } else {
                  error = 'find: unknown argument to `-type\'';
                  break;
              }
          } else {
               error = `find: unknown predicate \`${arg}'`;
               break;
          }
      }

      if (error) {
          output = error;
          break;
      }
      
      const results = [];
      const searchRoot = searchPath === '/' ? '/' : searchPath + '/'; 
      
      for (const key of Object.keys(VFS)) {
          // Check if key is inside searchPath
          if (key === searchPath || key.startsWith(searchRoot)) {
               const node = VFS[key];
               const fileName = key.substring(key.lastIndexOf('/') + 1);
               
               if (typeFilter) {
                   if (typeFilter === 'f' && node.type !== 'file') continue;
                   if (typeFilter === 'd' && node.type !== 'dir') continue;
               }
               
               if (namePattern) {
                   if (!namePattern.test(fileName)) continue;
               }
               
               results.push(key);
          }
      }
      
      output = results.sort().join('\n');
      break;
    }
    case 'finger': {
       output = 'Login: ghost...';
       break;
    }
    case 'curl': {
      output = 'curl: (6) Could not resolve host';
      break;
    }
    case 'crontab': {
      output = 'no crontab for ghost';
      break;
    }
    case 'vi':
    case 'vim':
    case 'nano': {
      output = 'Opening editor...';
      return { output, newCwd, action: 'edit_file' };
    }
    case 'apt':
    case 'apt-get': {
      output = 'apt: done';
      break;
    }
    case 'hydra': {
       if (args.length < 2) {
           output = 'usage: hydra -l <user> -P <passlist> <target>';
       } else {
           const userIdx = args.indexOf('-l');
           const passIdx = args.indexOf('-P');
           const target = args[args.length - 1];
           
           if (userIdx !== -1 && passIdx !== -1) {
               const user = args[userIdx + 1];
               const passList = args[passIdx + 1];
               
               let success = false;
               let password = '';
               
               if (target === '192.168.1.99' || target.includes('black-site')) {
                   if (user === 'root' && passList === 'rockyou.txt') {
                       success = true;
                       password = 'black_widow_protocol_init';
                   }
               } else if (target === '192.168.1.5' || target.includes('admin-pc')) {
                   if (user === 'backup') {
                       success = true;
                       password = 'SPECTRE_EVE';
                   }
               }
               
               output = `Hydra v9.1 (c) 2020 by van Hauser/THC - Please do not use in military or secret service organizations, or for illegal purposes.\n\nHydra (https://github.com/vanhauser-thc/thc-hydra) starting at ${new Date().toISOString()}`;
               return { output, newCwd, action: 'crack_sim', data: { target, user, success, password, mode: 'hydra' } };
           } else {
               output = 'hydra: missing -l or -P arguments';
           }
       }
       break;
    }
    case 'uptime': {
       output = 'up...';
       break;
    }
    case 'w': {
       output = 'up...';
       break;
    }
    case 'date': {
       output = new Date().toString();
       break;
    }
    case 'zip': {
       if (args.length < 2) {
           output = 'usage: zip <archive.zip> <files...>';
       } else {
           const archiveName = args[0];
           const archivePath = resolvePath(cwd, archiveName);
           const files = args.slice(1);
           
           let zipContent = 'PK_SIM_V1:';
           let packedCount = 0;
           
           for (const f of files) {
               const fPath = resolvePath(cwd, f);
               const node = getNode(fPath);
               if (node && node.type === 'file') {
                   // Store as {filename:content_b64}
                   const fName = fPath.substring(fPath.lastIndexOf('/') + 1);
                   zipContent += `{${fName}:${btoa(node.content)}}`;
                   packedCount++;
               }
           }
           
           if (packedCount > 0) {
               const parentPath = archivePath.substring(0, archivePath.lastIndexOf('/')) || '/';
               const parentNode = getNode(parentPath);
               if (parentNode && parentNode.type === 'dir') {
                   const fName = archivePath.substring(archivePath.lastIndexOf('/') + 1);
                   VFS[archivePath] = { type: 'file', content: zipContent };
                   if (!parentNode.children.includes(fName)) {
                       parentNode.children.push(fName);
                   }
                   output = `  adding: ${files.join(' ')} (deflated 0%)`;
               } else {
                   output = `zip: ${parentPath}: No such directory`;
               }
           } else {
               output = 'zip: warning: name not matched: ' + files[0];
           }
       }
       break;
    }
    case 'unzip': {
       if (args.length < 1) {
           output = 'usage: unzip <file.zip>';
       } else {
           const archiveName = args[0];
           const archivePath = resolvePath(cwd, archiveName);
           const node = getNode(archivePath);
           
           if (!node) {
               output = `unzip: cannot find or open ${archiveName}.`;
           } else if (node.type === 'dir') {
               output = `unzip: ${archiveName}: Is a directory`;
           } else {
               const content = node.content;
               if (content.startsWith('PK_SIM_V1:')) {
                   output = `Archive:  ${archiveName}\n`;
                   const payload = content.substring(10);
                   const matches = payload.match(/\{([^:]+):([^}]+)\}/g);
                   
                   if (matches) {
                       for (const m of matches) {
                           const parts = m.match(/\{([^:]+):([^}]+)\}/);
                           if (parts) {
                               const fname = parts[1];
                               const fcontent = atob(parts[2]);
                               const fPath = resolvePath(cwd, fname);
                               
                               // Create file
                               VFS[fPath] = { type: 'file', content: fcontent };
                               const parent = getNode(cwd);
                               if (parent && parent.type === 'dir' && !parent.children.includes(fname)) {
                                   parent.children.push(fname);
                               }
                               output += `  inflating: ${fname}\n`;
                           }
                       }
                   }
               } else {
                   output = `unzip:  cannot find zipfile directory in one of ${archiveName}`;
               }
           }
       }
       break;
    }
    case 'diff': {
       if (args.length < 2) {
           output = 'usage: diff <file1> <file2>';
       } else {
           const f1 = getNode(resolvePath(cwd, args[0]));
           const f2 = getNode(resolvePath(cwd, args[1]));
           if (f1 && f2 && f1.type === 'file' && f2.type === 'file') {
               if (f1.content === f2.content) {
                   output = '';
               } else {
                   output = `Files ${args[0]} and ${args[1]} differ`;
               }
           } else {
               output = 'diff: file not found or is a directory';
           }
       }
       break;
    }
    case 'steghide': {
       if (args.includes('extract') || args.includes('--extract')) {
           const sfIndex = args.indexOf('-sf');
           const pIndex = args.indexOf('-p');
           
           if (sfIndex === -1 || !args[sfIndex + 1]) {
               output = 'steghide: argument "-sf" (source file) missing';
           } else {
               const sourceFile = args[sfIndex + 1];
               const node = getNode(resolvePath(cwd, sourceFile));
               if (!node || node.type !== 'file') {
                   output = `steghide: could not open "${sourceFile}"`;
               } else {
                   const content = node.content;
                   const match = content.match(/\[HIDDEN_STEG_DATA:([^\]]+)\]/);
                   if (match) {
                       const password = pIndex !== -1 ? args[pIndex + 1] : '';
                       if (['spectre', 'admin', 'ghost', '0xDEADBEEF', 'SPECTRE_EVE'].includes(password)) {
                           const hiddenData = atob(match[1]);
                           const outFile = 'steg_result.txt';
                           const outPath = resolvePath(cwd, outFile);
                           const parent = getNode(cwd);
                           if (parent && parent.type === 'dir') {
                               VFS[outPath] = { type: 'file', content: hiddenData };
                               if (!parent.children.includes(outFile)) parent.children.push(outFile);
                               output = `wrote extracted data to "${outFile}".`;
                           }
                       } else {
                            output = `steghide: could not extract data: wrong password`;
                       }
                   } else {
                       output = `steghide: could not extract any data with that passphrase!`;
                   }
               }
           }
       } else {
           output = 'usage: steghide extract -sf <file> [-p <passphrase>]';
       }
       break;
    }
    case 'tree': {
       const root = getNode(cwd);
       if (root && root.type === 'dir') {
           output = root.children.map((c, i) => {
               const isLast = i === root.children.length - 1;
               const prefix = isLast ? '└── ' : '├── ';
               return prefix + c;
           }).join('\n');
       } else {
           output = 'tree: error';
       }
       break;
    }
    case 'neofetch': {
       output = `
       \x1b[1;32m       .           \x1b[0m  ghost@ghost-root
       \x1b[1;32m      / \\          \x1b[0m  ----------------
       \x1b[1;32m     /   \\         \x1b[0m  OS: Ghost Linux x86_64
       \x1b[1;32m    /^.   \\        \x1b[0m  Host: Mainframe V2
       \x1b[1;32m   /  _   \\       \x1b[0m  Kernel: 5.4.0-ghost
       \x1b[1;32m  /  (_)   \\      \x1b[0m  Uptime: 42 mins
       \x1b[1;32m /           \\     \x1b[0m  Packages: 1337 (dpkg)
       \x1b[1;32m/_____________\\    \x1b[0m  Shell: bash 5.0.17
                                 CPU: Neural Engine (64) @ 3.2GHz
                                 Memory: 6400MiB / 8192MiB`;
       break;
    }
    case 'weather': {
       output = `Weather Report for Tokyo, JP:
Temp: 18°C (64°F)
Condition: Overcast
Humidity: 82%
Wind: NE 12 km/h
Forecast: Heavy rain expected later tonight.`;
       break;
    }
    case 'matrix': {
       output = 'matrix...';
       return { output, newCwd, action: 'matrix_sim' };
    }
    case 'ssh-keygen': {
       const keyPath = resolvePath(cwd, args.includes('-f') ? args[args.indexOf('-f') + 1] : '.ssh/id_rsa');
       const parentPath = keyPath.substring(0, keyPath.lastIndexOf('/'));
       
       if (!getNode(parentPath)) {
           // Auto-create parent for UX
           VFS[parentPath] = { type: 'dir', children: [] };
           const grandParent = parentPath.substring(0, parentPath.lastIndexOf('/'));
           const gpNode = getNode(grandParent || '/');
           if (gpNode && gpNode.type === 'dir') {
               gpNode.children.push(parentPath.substring(parentPath.lastIndexOf('/') + 1));
           }
       }

       const privKey = `-----BEGIN OPENSSH PRIVATE KEY-----\nKEY_ID: GHOST_GEN_${Math.floor(Math.random() * 10000)}\n-----END OPENSSH PRIVATE KEY-----`;
       const pubKey = `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... ghost@ghost-root`;

       VFS[keyPath] = { type: 'file', content: privKey };
       VFS[`${keyPath}.pub`] = { type: 'file', content: pubKey };

       const pNode = getNode(parentPath);
       if (pNode && pNode.type === 'dir') {
           const fName = keyPath.substring(keyPath.lastIndexOf('/') + 1);
           if (!pNode.children.includes(fName)) pNode.children.push(fName);
           const pubName = `${fName}.pub`;
           if (!pNode.children.includes(pubName)) pNode.children.push(pubName);
       }

       output = `Generating public/private rsa key pair.
Your identification has been saved in ${keyPath}
Your public key has been saved in ${keyPath}.pub
The key fingerprint is:
SHA256:${btoa(Math.random().toString()).substring(0, 20)} ghost@ghost-root
The key's randomart image is:
+---[RSA 3072]----+
|      ..o   o.   |
|     . . o . .   |
|      o . +      |
|     . + * .     |
|      = S =      |
|     o + B .     |
|      E + o      |
|     . o .       |
|      . ..       |
+----[SHA256]-----+`;
       break;
    }
    case 'awk': {
       if (args.length < 1) {
           output = 'usage: awk <program> [file]';
       } else {
           let program = args[0];
           if ((program.startsWith("'") && program.endsWith("'")) || (program.startsWith('"') && program.endsWith('"'))) {
               program = program.slice(1, -1);
           }
           
           let content = '';
           if (args.length > 1) {
               const node = getNode(resolvePath(cwd, args[1]));
               if (node && node.type === 'file') content = node.content;
           } else if (stdin !== undefined) {
               content = stdin;
           }

           const parts = program.match(/print\s+\$(\d+)/);
           if (parts) {
               const col = parseInt(parts[1], 10);
               const lines = content.split('\n');
               output = lines.map(line => {
                   const columns = line.trim().split(/\s+/);
                   if (col === 0) return line; 
                   return columns[col - 1] || '';
               }).join('\n');
           } else {
               output = 'awk: syntax error (simulated only supports print $N)';
           }
       }
       break;
    }
    case 'tar': {
       if (args.length < 2) {
           output = 'usage: tar [-cxvf] <file.tar> [files...]';
       } else {
           const flags = args[0];
           const archiveName = args[1];
           const archivePath = resolvePath(cwd, archiveName);
           const parentPath = archivePath.substring(0, archivePath.lastIndexOf('/')) || '/';
           
           if (flags.includes('c')) {
               // Create
               if (args.length < 3) {
                   output = 'tar: Cowardly refusing to create an empty archive';
               } else {
                   const files = args.slice(2);
                   let tarContent = 'TAR_V1:';
                   let packed: string[] = [];
                   for (const f of files) {
                       const fPath = resolvePath(cwd, f);
                       const node = getNode(fPath);
                       if (node && node.type === 'file') {
                           // Simple simulated packing
                           try {
                               tarContent += `{${f}:${btoa(node.content)}}`;
                               packed.push(f);
                           } catch (e) {
                               // Ignore binary
                           }
                       }
                   }
                   if (packed.length > 0) {
                       const parentNode = getNode(parentPath);
                       if (parentNode && parentNode.type === 'dir') {
                           const fName = archivePath.substring(archivePath.lastIndexOf('/') + 1);
                           VFS[archivePath] = { type: 'file', content: tarContent };
                           if (!parentNode.children.includes(fName)) {
                               parentNode.children.push(fName);
                           }
                           if (flags.includes('v')) {
                               output = packed.join('\n');
                           }
                       } else {
                           output = `tar: ${parentPath}: No such directory`;
                       }
                   } else {
                       output = 'tar: No valid files to pack (or binary content)';
                   }
               }
           } else if (flags.includes('x')) {
               // Extract
               const node = getNode(archivePath);
               if (!node) {
                   output = `tar: ${archiveName}: Cannot open: No such file or directory`;
               } else if (node.type === 'dir') {
                   output = `tar: ${archiveName}: Is a directory`;
               } else {
                   const content = node.content;
                   if (content.startsWith('TAR_V1:')) {
                       const payload = content.substring(7);
                       const matches = payload.match(/\{([^:]+):([^}]+)\}/g);
                       let extracted: string[] = [];
                       if (matches) {
                           for (const m of matches) {
                               const parts = m.match(/\{([^:]+):([^}]+)\}/);
                               if (parts) {
                                   const fname = parts[1];
                                   const fcontent = atob(parts[2]);
                                   const fPath = resolvePath(cwd, fname);
                                   const fParent = fPath.substring(0, fPath.lastIndexOf('/')) || '/';
                                   const fParentNode = getNode(fParent);
                                   if (fParentNode && fParentNode.type === 'dir') {
                                       const baseName = fPath.substring(fPath.lastIndexOf('/') + 1);
                                       VFS[fPath] = { type: 'file', content: fcontent };
                                       if (!fParentNode.children.includes(baseName)) {
                                           fParentNode.children.push(baseName);
                                       }
                                       extracted.push(fname);
                                   }
                               }
                           }
                       }
                       if (flags.includes('v')) {
                           output = extracted.join('\n');
                       }
                   } else {
                       output = `tar: This does not look like a tar archive`;
                   }
               }
           } else {
               output = `tar: Unknown flag or not implemented: ${flags}`;
           }
       }
       break;
    }
    case 'radio': {
       if (args.length < 1) {
           output = 'usage: radio [scan|tune <freq>]';
       } else {
           const subcmd = args[0];
           if (subcmd === 'scan') {
               output = 'Scanning radio frequencies...';
               return { output, newCwd, action: 'radio_sim', data: { mode: 'scan' } };
           } else if (subcmd === 'tune') {
               if (args.length < 2) {
                   output = 'usage: radio tune <freq>';
               } else {
                   const freq = args[1];
                   if (freq === '89.9') {
                       output = `Tuning to ${freq} MHz...\n[SIGNAL LOCKED]\nBroadcast: "The... crow... flies... at... midnight... Repeat... The... crow... flies..."\n[END TRANSMISSION]`;
                   } else if (freq === '101.5') {
                       output = `Tuning to ${freq} MHz...\n[MUSIC] Smooth Jazz playing...`;
                   } else {
                       output = `Tuning to ${freq} MHz...\n[STATIC] No signal detected.`;
                   }
                   return { output, newCwd, action: 'radio_sim', data: { mode: 'tune', freq } };
               }
           } else {
               output = `radio: unknown subcommand: ${subcmd}`;
           }
       }
       break;
    }
    case 'systemctl': {
       if (args.length < 1) {
           output = 'usage: systemctl [command] [unit]';
       } else {
           const cmd = args[0];
           const unit = args[1];
           
           const validUnits = ['sshd', 'tor', 'apache2', 'postgresql', 'cron', 'networking', 'bluetooth'];
           const runDir = '/var/run';
           if (!VFS[runDir]) VFS[runDir] = { type: 'dir', children: [] };
           
           const rd = VFS[runDir];
           // Initialize default state if not present (mock persistence)
           if (rd && rd.type === 'dir' && rd.children.length === 0 && !(rd as any).__init) {
               ['sshd', 'cron', 'networking'].forEach(s => {
                   VFS[`${runDir}/${s}.pid`] = { type: 'file', content: String(Math.floor(Math.random() * 30000)) };
                   rd.children.push(`${s}.pid`);
               });
               (rd as any).__init = true;
           }

           if (cmd === 'list-units') {
               output = 'UNIT           LOAD   ACTIVE SUB     DESCRIPTION\n';
               validUnits.forEach(u => {
                   const rdNode = VFS[runDir];
                   const isRunning = rdNode && rdNode.type === 'dir' && rdNode.children.includes(`${u}.pid`);
                   const active = isRunning ? 'active' : 'inactive';
                   const sub = isRunning ? 'running' : 'dead';
                   output += `${u}.service`.padEnd(16) + `loaded ${active.padEnd(6)} ${sub.padEnd(7)} ${u} service\n`;
               });
               output += `\nLOAD   = Reflects whether the unit definition was properly loaded.
ACTIVE = The high-level unit activation state, i.e. generalization of SUB.
SUB    = The low-level unit activation state, values depend on unit type.

${validUnits.length} loaded units listed.`;
           } else if (cmd === 'status') {
               if (!unit) {
                   output = 'systemctl: unit name required';
               } else if (!validUnits.includes(unit)) {
                   output = `Unit ${unit}.service could not be found.`;
               } else {
                   const rdNode = VFS[runDir];
                   const isRunning = rdNode && rdNode.type === 'dir' && rdNode.children.includes(`${unit}.pid`);
                   const pidNode = isRunning ? VFS[`${runDir}/${unit}.pid`] : null;
                   const pid = (pidNode && pidNode.type === 'file') ? pidNode.content : null;
                   
                   output = `● ${unit}.service - ${unit} service
   Loaded: loaded (/lib/systemd/system/${unit}.service; enabled; vendor preset: enabled)
   Active: ${isRunning ? 'active (running)' : 'inactive (dead)'} since ${new Date(Date.now() - 10000000).toUTCString()}
     Docs: man:${unit}(8)
 Main PID: ${pid || '(null)'} (${unit})
    Tasks: ${isRunning ? 1 : 0} (limit: 4915)
   Memory: ${isRunning ? '12.4M' : '0B'}
   CGroup: /system.slice/${unit}.service`;
               }
           } else if (cmd === 'start') {
               if (!unit) {
                   output = 'systemctl: unit name required';
               } else if (!validUnits.includes(unit)) {
                   output = `Failed to start ${unit}.service: Unit ${unit}.service not found.`;
               } else {
                   if (unit === 'networking') {
                       // Do nothing special visual
                   }
                   const pidFile = `${unit}.pid`;
                   const rdNode = VFS[runDir];
                   if (rdNode && rdNode.type === 'dir' && !rdNode.children.includes(pidFile)) {
                       const newPid = String(Math.floor(Math.random() * 30000) + 1000);
                       VFS[`${runDir}/${pidFile}`] = { type: 'file', content: newPid };
                       rdNode.children.push(pidFile);
                   }
                   output = ''; // Silent success
               }
           } else if (cmd === 'stop') {
               if (!unit) {
                   output = 'systemctl: unit name required';
               } else if (!validUnits.includes(unit)) {
                   output = `Failed to stop ${unit}.service: Unit ${unit}.service not found.`;
               } else {
                   const pidFile = `${unit}.pid`;
                   const rdNode = VFS[runDir];
                   if (rdNode && rdNode.type === 'dir' && rdNode.children.includes(pidFile)) {
                       delete VFS[`${runDir}/${pidFile}`];
                       rdNode.children = rdNode.children.filter(c => c !== pidFile);
                   }
                   output = ''; // Silent success
               }
           } else if (cmd === 'restart') {
                if (!unit) { output = 'systemctl: unit name required'; }
                else {
                    // Stop logic
                    const pidFile = `${unit}.pid`;
                    const rdNode = VFS[runDir];
                    if (validUnits.includes(unit) && rdNode && rdNode.type === 'dir') {
                        if (rdNode.children.includes(pidFile)) {
                           delete VFS[`${runDir}/${pidFile}`];
                           rdNode.children = rdNode.children.filter(c => c !== pidFile);
                        }
                        // Start logic
                        const newPid = String(Math.floor(Math.random() * 30000) + 1000);
                        VFS[`${runDir}/${pidFile}`] = { type: 'file', content: newPid };
                        rdNode.children.push(pidFile);
                        output = '';
                    } else {
                        output = `Failed to restart ${unit}.service: Unit not found.`;
                    }
                }
           } else {
               output = `Unknown command verb ${cmd}.`;
           }
       }
       break;
    }
    case 'sed': {
       if (args.length < 1) {
           output = 'usage: sed <expression> [file]';
       } else {
           let expression = args[0];
           if ((expression.startsWith("'") && expression.endsWith("'")) || (expression.startsWith('"') && expression.endsWith('"'))) {
               expression = expression.slice(1, -1);
           }

           let content = '';
           if (args.length > 1) {
               const node = getNode(resolvePath(cwd, args[1]));
               if (node && node.type === 'file') content = node.content;
           } else if (stdin !== undefined) {
               content = stdin;
           }

           // Support s/find/replace/g
           if (expression.startsWith('s/')) {
               const parts = expression.split('/');
               // s/find/replace/flags -> ['', 'find', 'replace', 'flags']
               if (parts.length >= 3) {
                   const find = parts[1];
                   const replace = parts[2];
                   const flags = parts[3] || '';
                   
                   try {
                       const regex = new RegExp(find, flags.includes('g') ? 'g' : '');
                       output = content.replace(regex, replace);
                   } catch (e) {
                       output = 'sed: invalid regex';
                   }
               } else {
                   output = 'sed: invalid expression';
               }
           } else {
               output = 'sed: only s/find/replace/ is supported in simulation';
           }
       }
       break;
    }
    case 'netmap': {
       const run = getNode('/var/run');
       if (run && run.type === 'dir') {
           VFS['/var/run/scan_complete'] = { type: 'file', content: 'TRUE' };
           if (!run.children.includes('scan_complete')) run.children.push('scan_complete');
       }
       output = 'Loading Network Map...';
       return { output, newCwd, action: 'netmap_sim' };
    }
    case 'theme': {
       if (args.length < 1) {
           output = 'usage: theme <name>\nAvailable themes: green, amber, blue, red, cyber, bw';
       } else {
           const themeName = args[0];
           if (['green', 'amber', 'blue', 'red', 'cyber', 'bw'].includes(themeName)) {
               output = `Switching theme to ${themeName}...`;
               return { output, newCwd, action: 'theme_change', data: { theme: themeName } };
           } else {
               output = `theme: '${themeName}' not found.`;
           }
       }
       break;
    }
    case 'sat': {
      if (args.length < 1) {
          output = 'usage: sat <connect|list|download|status|files> [target]';
      } else {
          const subcmd = args[0];
          const runDir = getNode('/var/run');
          const isLinked = runDir && runDir.type === 'dir' && runDir.children.includes('sat_link.pid');
          
          if (subcmd === 'list') {
              output = `Available Satellites (Low Earth Orbit):
[ID: KH-11]  USA-224 (Keyhole)   - ONLINE  (Encrypted)
[ID: COSM]   Cosmos-2542         - ONLINE  (Signal Weak)
[ID: OMEG]   Omega-Sat-V1        - ONLINE  (Secure Uplink Available)
[ID: BLK]    BLACK_KNIGHT        - UNKNOWN (Beacon Active)`;
          } else if (subcmd === 'connect') {
              if (args.length < 2) {
                  output = 'usage: sat connect <id>';
              } else {
                  const id = args[1];
                  if (['KH-11', 'COSM', 'BLK', 'OMEG'].includes(id)) {
                      if (runDir && runDir.type === 'dir') {
                          VFS['/var/run/sat_link.pid'] = { type: 'file', content: id };
                          if (!runDir.children.includes('sat_link.pid')) runDir.children.push('sat_link.pid');
                      }
                      output = `Initializing uplink to ${id}...`;
                      return { output, newCwd, action: 'sat_sim', data: { target: id, mode: 'connect' } };
                  } else {
                      output = `sat: uplink failed: Target ${id} not found or out of range.`;
                  }
              }
          } else if (subcmd === 'status') {
              if (isLinked) {
                  const node = VFS['/var/run/sat_link.pid'];
                  const id = (node && node.type === 'file') ? node.content : 'UNKNOWN';
                  output = `Uplink Status: CONNECTED (${id})\nSignal Strength: 98%\nEncryption: AES-256-GCM`;
              } else {
                  output = 'Uplink Status: DISCONNECTED\nSignal Strength: 0%\nEncryption: NONE';
              }
          } else if (subcmd === 'files') {
               if (isLinked) {
                   const node = VFS['/var/run/sat_link.pid'];
                   const id = (node && node.type === 'file') ? node.content : 'UNKNOWN';
                   if (id === 'OMEG') {
                       output = `[SAT_LINK] Remote File System (${id}):
- rwx------  launch_codes.bin  (512B)  [DOOMSDAY_PROTOCOL]
- r--------  README.txt        (1KB)   [INFO]`;
                   } else {
                       output = `[SAT_LINK] Remote File System (${id}):
- rwxr-x---  IMAGERY_001  (24MB)  [CLASSIFIED]
- rwxr-x---  LOG_V2.txt   (4KB)
- r--------  KEYS.enc     (1KB)   [LOCKED]`;
                   }
               } else {
                   output = 'sat: not connected. Use "sat connect <id>" first.';
               }
          } else if (subcmd === 'download') {
               if (args.length < 2) {
                  output = 'usage: sat download <file_id>';
               } else {
                  if (isLinked) {
                      const node = VFS['/var/run/sat_link.pid'];
                      const id = (node && node.type === 'file') ? node.content : 'UNKNOWN';
                      const fileId = args[1];
                      let success = false;

                      if (id === 'COSM' && fileId === 'KEYS.enc') {
                           const fPath = resolvePath(cwd, 'KEYS.enc');
                           VFS[fPath] = { type: 'file', content: 'U29tZSBlbmNyeXB0ZWQgZGF0YS4uLiAoaGV4IGR1bXAp' }; // Dummy content, decrypt checks name
                           const parent = getNode(cwd);
                           if (parent && parent.type === 'dir' && !parent.children.includes('KEYS.enc')) {
                               parent.children.push('KEYS.enc');
                           }
                           success = true;
                      } else if (id === 'OMEG' && fileId === 'launch_codes.bin') {
                           const fPath = resolvePath(cwd, 'launch_codes.bin');
                           VFS[fPath] = { type: 'file', content: 'TEFVTkNIX0NPREVTX0lOSVRJQVRFRA==' };
                           const parent = getNode(cwd);
                           if (parent && parent.type === 'dir' && !parent.children.includes('launch_codes.bin')) {
                               parent.children.push('launch_codes.bin');
                           }
                           success = true;
                      }

                      if (success) {
                          output = 'Downloading...';
                          if (fileId === 'launch_codes.bin') {
                              output += '\n\x1b[1;32m[MISSION UPDATE] Objective Complete: PAYLOAD ACQUIRED.\x1b[0m';
                          }
                          return { output, newCwd, action: 'sat_sim', data: { target: args[1], mode: 'download' } };
                      } else {
                          output = `sat: file '${fileId}' not found on satellite ${id}.`;
                      }
                  } else {
                      output = 'sat: not connected.';
                  }
               }
          } else {
              output = `sat: unknown subcommand: ${subcmd}`;
          }
      }
      break;
    }
    case 'tcpdump': {
       if (args.includes('--help') || args.includes('-h')) {
           output = 'tcpdump version 4.9.3\nlibpcap version 1.9.1\nUsage: tcpdump [-i interface] [-w file] [expression]';
       } else {
           output = '';
           return { output, newCwd, action: 'tcpdump_sim' };
       }
       break;
    }
    case 'irc': {
       if (args.length < 1) {
           output = 'usage: irc <server> [channel] [nick]';
       } else {
           const server = args[0];
           const channel = args[1] || '#lobby';
           const nick = args[2] || 'ghost';

           if (server === '192.168.1.99' || server === 'chat.black-site.local' || server === '10.66.6.6') {
               output = `Connecting to ${server}...\n`;
               return { output, newCwd, action: 'irc_sim', data: { server, channel, nick } };
           } else {
               output = `irc: unable to connect to ${server}: Connection refused`;
           }
       }
       break;
    }
    case 'sqlmap': {
       const urlIndex = args.indexOf('-u');
       if (urlIndex !== -1 && args[urlIndex + 1]) {
           const url = args[urlIndex + 1];
           output = 'Starting sqlmap...';
           return { output, newCwd, action: 'sqlmap_sim', data: { target: url } };
       } else {
           output = 'Usage: sqlmap -u <url> [options]';
       }
       break;
    }
    case 'hashcat': {
       if (args.length < 2) {
           output = 'usage: hashcat [options] <hashfile> <wordlist>\n\nOptions:\n  -m 1400        SHA-256 mode\n  -a 0           Straight attack mode';
       } else {
           const hashFile = args.find(a => !a.startsWith('-') && (a.endsWith('.txt') || a.endsWith('.csv') || a.endsWith('.hash')));
           const wordList = args.find(a => !a.startsWith('-') && (a.endsWith('.txt') || a.endsWith('.lst')) && a !== hashFile);
           
           if (hashFile && wordList) {
               const node = getNode(resolvePath(cwd, hashFile));
               if (node && node.type === 'file') {
                   const content = node.content;
                   let targetHash = '';
                   
                   if (content.includes('5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8')) {
                       targetHash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
                       // Password: red_ledger
                   } else if (content.includes('5f4dcc3b5aa765d61d8327deb882cf99')) {
                       targetHash = '5f4dcc3b5aa765d61d8327deb882cf99'; // SHA1 for 'password'
                   }
                   
                   if (targetHash) {
                       output = 'Initializing hashcat v6.1.1...';
                       return { 
                           output, 
                           newCwd, 
                           action: 'crack_sim', 
                           data: { 
                               mode: 'hashcat', 
                               hash: targetHash, 
                               wordlist: wordList 
                           } 
                       };
                   } else {
                       output = 'hashcat: No valid hashes found in file.';
                   }
               } else {
                   output = `hashcat: ${hashFile}: No such file`;
               }
           } else {
               output = 'hashcat: missing hashfile or wordlist';
           }
       }
       break;
    }
    case 'cicada3301': {
       output = `
       .   .
      / \\ / \\
     (   Y   )
      \\  |  /
      /  |  \\
     (   |   )
      \\  |  /
       ' | '
         |
       3301
       
   Hello. We are looking for highly intelligent individuals.
   To find them, we have devised a test.
   
   There is a message hidden in this system.
   Find it, and it will lead you on the road to finding us.
   
   Good luck.
   
   (Hint: The message is hidden where the ghosts roam. Try 'man steghide' or check .onion sites)`;
       break;
    }
    case 'tor': {
       if (args.length < 1) {
           output = 'usage: tor <start|status|list|browse <onion_url>>';
       } else {
           const subcmd = args[0];
           const runDir = getNode('/var/run');
           const isRunning = runDir && runDir.type === 'dir' && runDir.children.includes('tor.pid');

           if (subcmd === 'start') {
               if (isRunning) {
                   output = 'Tor is already running.';
               } else {
                   // Start via systemctl logic equivalent
                   if (runDir && runDir.type === 'dir') {
                       VFS['/var/run/tor.pid'] = { type: 'file', content: '6666' };
                       runDir.children.push('tor.pid');
                   }
                   output = 'Bootstrapping Tor circuit...';
                   return { output, newCwd, action: 'tor_sim', data: { mode: 'start' } };
               }
           } else if (subcmd === 'status') {
               if (isRunning) {
                   output = 'Tor is running (PID 6666).\nCircuit established: 3 hops.\nIdentity: Anonymous';
               } else {
                   output = 'Tor is not running.';
               }
           } else if (subcmd === 'list') {
               if (!isRunning) {
                   output = 'tor: service not running. (Use "tor start" or "systemctl start tor")';
               } else {
                   output = `[HIDDEN SERVICES DIRECTORY]
- silkroad7.onion        (Marketplace) [OFFLINE]
- dread55.onion          (Forum)       [ONLINE]
- ghostbox.onion         (Drop)        [ONLINE]
- cicada3301.onion       (Puzzle)      [UNKNOWN]`;
               }
           } else if (subcmd === 'browse') {
               if (args.length < 2) {
                   output = 'usage: tor browse <onion_url>';
               } else {
                   if (!isRunning) {
                       output = 'tor: connection failed: Tor service is not active.\n(Hint: Start the service first)';
                   } else {
                       const url = args[1];
                       output = `Connecting to ${url}...`;
                       return { output, newCwd, action: 'tor_sim', data: { mode: 'browse', url } };
                   }
               }
           } else {
               output = `tor: unknown command: ${subcmd}`;
           }
       }
       break;
    }
    case 'pip': {
       if (args.length < 2 || args[0] !== 'install') {
           output = 'usage: pip install <package>';
       } else {
           output = `Collecting ${args[1]}...\nDownloading ${args[1]}-1.0.0.tar.gz (1.2 MB)\nInstalling collected packages: ${args[1]}\nSuccessfully installed ${args[1]}-1.0.0`;
       }
       break;
    }
    case 'python':
    case 'python3': {
       if (args.length < 1) {
           output = 'Python 3.8.10 (default, Mar 15 2022, 12:22:08)\n[GCC 9.4.0] on linux\nType "help", "copyright", "credits" or "license" for more information.\n>>> exit()\n(Interactive mode not supported)';
       } else {
           const fileName = args[0];
           const filePath = resolvePath(cwd, fileName);
           const node = getNode(filePath);
           
           if (!node) {
               output = `python: can't open file '${fileName}': [Errno 2] No such file or directory`;
           } else if (node.type === 'dir') {
               output = `/usr/bin/python3: can't find '__main__' module in '${fileName}'`;
           } else {
               // Simple mock interpreter
               const content = node.content;
               if (content.includes('import os') || content.includes('system(')) {
                   output = 'RuntimeError: Restricted environment. System calls disabled.';
               } else if (content.includes('print("This is a fake exploit.")')) {
                   output = 'This is a fake exploit.';
               } else if (fileName === 'exploit.py') {
                   // Fallback for exploit.py if content changed
                   output = '[*] Exploit started...\n[+] Target: 127.0.0.1\n[-] VULN NOT FOUND.';
               } else {
                   // Try to extract print statements
                   const printMatch = content.match(/print\s*\(['"](.+?)['"]\)/);
                   if (printMatch) {
                       output = printMatch[1];
                   } else {
                       output = ''; // No output
                   }
               }
           }
       }
       break;
    }
    case 'wget': {
      if (args.length < 1) {
          output = 'usage: wget <url>';
      } else {
          const url = args[0];
          // Mock download logic
          if (url.includes('firmware.bin') || url === 'http://192.168.1.99/files/firmware_v2.bin') {
               output = `--${new Date().toISOString().slice(0,19)}--  ${url}
Resolving 192.168.1.99... connected.
HTTP request sent, awaiting response... 200 OK
Length: 4194304 (4.0M) [application/octet-stream]
Saving to: ‘firmware.bin’

firmware.bin          100%[===================>]   4.00M  11.2MB/s    in 0.4s    

2026-02-10 14:02:55 (11.2 MB/s) - ‘firmware.bin’ saved [4194304/4194304]`;
               
               const fName = 'firmware.bin';
               const fPath = resolvePath(cwd, fName);
               const parent = getNode(cwd);
               if (parent && parent.type === 'dir') {
                   // Create binary-looking content
                   VFS[fPath] = { type: 'file', content: 'MAGIC_HEADER: 0xDEADBEEF\n[BINARY_DATA_ENCRYPTED_Block1]\n... (4MB of data) ...\nPK_SIM_V1:{_hidden_key:SEKRET_KEY_99}\n[EOF]' };
                   if (!parent.children.includes(fName)) parent.children.push(fName);
               }
          } else if (url.includes('payload')) {
               output = `Downloading payload... [ERROR] 403 Forbidden`;
          } else {
               output = `--${new Date().toISOString().slice(0,19)}--  ${url}
Resolving host... failed: Name or service not known.
wget: unable to resolve host address`;
          }
      }
      break;
    }
    case 'binwalk': {
       const extract = args.includes('-e') || args.includes('--extract');
       const targetFile = args.find(a => !a.startsWith('-'));
       
       if (!targetFile) {
           output = 'binwalk: usage: binwalk [-e] <file>';
       } else {
           const fNode = getNode(resolvePath(cwd, targetFile));
           if (!fNode || fNode.type !== 'file') {
               output = `binwalk: ${targetFile}: No such file or directory`;
           } else {
               output = `DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             Unified Extensible Firmware Interface (UEFI) PI
4096          0x1000          Linux kernel ARM boot executable zImage (little-endian)
24554         0x5FEA          gzip compressed data, maximum compression, from Unix, last modified: 2026-01-15
88291         0x158E3         Squashfs filesystem, little endian, version 4.0, compression:gzip, size: 102422 bytes`;

               if (fNode.content.includes('PK_SIM_V1')) {
                    output += `\n1048576       0x100000        Zip archive data, at least v2.0 to extract, compressed size: 412, uncompressed size: 1024, name: _hidden_key`;
               }

               if (extract) {
                   if (fNode.content.includes('PK_SIM_V1')) {
                       output += `\n\n[INFO] Extraction initiated...
[+] Zip archive data found at 0x100000
[+] Extracting to '_${targetFile}.extracted/'...
[+] File '_hidden_key' extracted successfully.`;

                       const extractDir = `_${targetFile}.extracted`;
                       const extractPath = resolvePath(cwd, extractDir);
                       const parent = getNode(cwd);
                       if (parent && parent.type === 'dir') {
                           VFS[extractPath] = { type: 'dir', children: ['_hidden_key'] };
                           if (!parent.children.includes(extractDir)) parent.children.push(extractDir);
                           
                           VFS[`${extractPath}/_hidden_key`] = { type: 'file', content: 'KEY_PART_3: GHOST_ROOT{F1RMW4R3_R3V3RS3D}' };
                       }
                   } else {
                       output += `\n\n[INFO] Extraction initiated...
[!] No known file signatures found for extraction.`;
                   }
               }
           }
       }
       break;
    }
    case 'drone': {
       if (args.length < 1) {
           output = 'usage: drone <list|connect|status> [id]';
       } else {
           const subcmd = args[0];
           if (subcmd === 'list') {
               output = `Available Drones:
[ID: DR-01]  Model: RAVEN-X   - STATUS: CHARGING
[ID: DR-02]  Model: PHANTOM-4 - STATUS: ONLINE (Patrol Mode)
[ID: DR-99]  Model: BLACK-OPS - STATUS: [CLASSIFIED]`;
           } else if (subcmd === 'connect') {
               if (args.length < 2) {
                   output = 'usage: drone connect <id>';
               } else {
                   const id = args[1];
                   if (id === 'DR-02') {
                       output = 'Connecting to Drone DR-02...';
                       return { output, newCwd, action: 'drone_sim', data: { id } };
                   } else if (id === 'DR-99') {
                       output = 'drone: Connection refused (Encryption Key Required)';
                   } else {
                       output = `drone: ${id} not available or offline.`;
                   }
               }
           } else if (subcmd === 'status') {
               output = 'Drone Interface: STANDBY\nSignal: WEAK\nTelemetry: OFFLINE';
           } else {
               output = `drone: unknown subcommand: ${subcmd}`;
           }
       }
       break;
    }
    case 'bluetoothctl': {
       if (args.length === 0) {
           output = 'bluetoothctl: usage: bluetoothctl <command> [args]\n\nCommands:\n  scan <on/off>   - Start/stop scanning\n  devices         - List available devices\n  pair <mac>      - Pair with device\n  connect <mac>   - Connect to device\n  info <mac>      - Device information';
       } else {
           const cmd = args[0];
           if (cmd === 'scan') {
               if (args[1] === 'on') {
                   output = 'Discovery started\n[CHG] Controller 00:1A:7D:DA:71:13 Discovering: yes\n[NEW] Device 44:55:66:77:88:99 Unknown\n[NEW] Device A1:B2:C3:D4:E5:F6 J_Phone_13\n[NEW] Device 11:22:33:44:55:66 GHOST_BEACON_V1';
                   return { output, newCwd, action: 'delay' };
               } else {
                   output = 'Discovery stopped\n[CHG] Controller 00:1A:7D:DA:71:13 Discovering: no';
               }
           } else if (cmd === 'devices') {
               output = 'Device 44:55:66:77:88:99 Unknown\nDevice A1:B2:C3:D4:E5:F6 J_Phone_13\nDevice 11:22:33:44:55:66 GHOST_BEACON_V1';
           } else if (cmd === 'pair') {
               const mac = args[1];
               if (mac === '11:22:33:44:55:66') {
                   output = `Attempting to pair with ${mac}...\n[CHG] Device ${mac} Connected: yes\n[CHG] Device ${mac} Paired: yes\nPairing successful.`;
                   return { output, newCwd, action: 'delay' };
               } else if (mac) {
                   output = `Attempting to pair with ${mac}...\nFailed to pair: org.bluez.Error.AuthenticationFailed`;
                   return { output, newCwd, action: 'delay' };
               } else {
                   output = 'Usage: bluetoothctl pair <mac_address>';
               }
           } else if (cmd === 'connect') {
               const mac = args[1];
               if (mac === '11:22:33:44:55:66') {
                   output = `Attempting to connect to ${mac}...\nConnection successful.\n[NEW] Service 00001101-0000-1000-8000-00805f9b34fb Serial Port\n\nDevice sent message: "SEKRET_KEY_BT: 0xBLU3T00TH_GH0ST"`;
                   return { output, newCwd, action: 'delay' };
               } else {
                   output = `Failed to connect: org.bluez.Error.Failed`;
               }
           } else if (cmd === 'info') {
               const mac = args[1];
               if (mac === '11:22:33:44:55:66') {
                   output = `Device ${mac} (public)\n\tName: GHOST_BEACON_V1\n\tAlias: GHOST_BEACON_V1\n\tPaired: yes\n\tTrusted: yes\n\tBlocked: no\n\tConnected: no\n\tLegacyPairing: no\n\tUUID: Serial Port             (00001101-0000-1000-8000-00805f9b34fb)`;
               } else {
                   output = `Device ${mac} not found`;
               }
           } else {
               output = `bluetoothctl: invalid command: ${cmd}`;
           }
       }
       break;
    }
    case 'exiftool': {
        if (args.length < 1) {
            output = 'usage: exiftool <file>';
        } else {
            const target = args[0];
            const node = getNode(resolvePath(cwd, target));
            if (!node) {
                output = `exiftool: ${target}: No such file`;
            } else if (node.type === 'dir') {
                output = `exiftool: ${target}: Is a directory`;
            } else {
                const content = node.content;
                // Check for Metadata Header in our mock format
                const match = content.match(/\[METADATA_HEADER\]([\s\S]*?)\[END_METADATA\]/);
                
                if (match) {
                    const metadata = match[1].trim().split('\n');
                    output = `ExifTool Version Number         : 12.00\nFile Name                       : ${target}\nFile Size                       : ${content.length} bytes\nFile Permissions                : rw-r--r--\n` + 
                             metadata.map(line => {
                                 const [key, val] = line.split(':');
                                 if (!val) return line;
                                 return `${key.trim().padEnd(32)}: ${val.trim()}`;
                             }).join('\n');
                } else if (target === 'evidence.jpg' || content.startsWith('ÿØÿà')) {
                    output = `ExifTool Version Number         : 12.00
File Name                       : ${target}
File Size                       : ${content.length} bytes
File Type                       : JPEG
MIME Type                       : image/jpeg
JFIF Version                    : 1.01
Resolution Unit                 : inches
X Resolution                    : 72
Y Resolution                    : 72
Image Width                     : 640
Image Height                    : 480
Encoding Process                : Baseline DCT, Huffman coding
Bits Per Sample                 : 8
Color Components                : 3
Y Cb Cr Sub Sampling            : YCbCr4:2:0 (2 2)
Comment                         : [HIDDEN_STEG_DATA_DETECTED]`;
                } else {
                    output = `ExifTool Version Number         : 12.00
File Name                       : ${target}
File Size                       : ${content.length} bytes
Error                           : Unknown file type`;
                }
            }
        }
        break;
    }
    case 'aircrack-ng': {
       if (args.length < 1) {
           output = 'usage: aircrack-ng [options] <.cap file>';
       } else {
           const fileTarget = args.find(a => !a.startsWith('-'));
           const wordlistArg = args.indexOf('-w');
           const wordlist = wordlistArg !== -1 ? args[wordlistArg + 1] : null;
           
           if (fileTarget) {
               const node = getNode(resolvePath(cwd, fileTarget));
               if (!node || node.type !== 'file') {
                   output = `aircrack-ng: ${fileTarget}: No such file`;
               } else {
                   // Check signature (mock)
                   if (node.content.includes('HANDSHAKE') || fileTarget.endsWith('.cap')) {
                       if (wordlist) {
                           output = `Opening ${fileTarget}...\nReading wordlist ${wordlist}...`;
                           return { 
                               output, 
                               newCwd, 
                               action: 'crack_sim', 
                               data: { 
                                   mode: 'aircrack', 
                                   target: fileTarget, 
                                   success: true // Always success for demo if correct file
                               } 
                           };
                       } else {
                           output = 'aircrack-ng: Please specify a dictionary (wordlist) with -w';
                       }
                   } else {
                       output = `aircrack-ng: ${fileTarget}: Invalid pcap format (no handshake found)`;
                   }
               }
           } else {
               output = 'aircrack-ng: No capture file specified';
           }
       }
       break;
    }
    case 'geoip': {
        if (args.length < 1) {
            output = 'usage: geoip <ip_address>';
        } else {
            const ip = args[0];
            const locations: Record<string, any> = {
                '192.168.1.99': { country: 'Unknown', city: 'Classified', lat: '??.????', lon: '??.????', isp: 'Satellite Uplink' },
                '10.66.6.6': { country: 'Russia', city: 'Oymyakon (Siberia)', lat: '63.4641', lon: '142.7737', isp: 'Black Site Node' },
                '172.16.66.6': { country: 'Russia', city: 'Oymyakon (Siberia)', lat: '63.4641', lon: '142.7737', isp: 'Black Site Link' },
                '8.8.8.8': { country: 'United States', city: 'Mountain View, CA', lat: '37.4056', lon: '-122.0775', isp: 'Google LLC' },
                '1.1.1.1': { country: 'United States', city: 'Los Angeles, CA', lat: '34.0522', lon: '-118.2437', isp: 'Cloudflare, Inc.' },
                '192.168.1.5': { country: 'Local Network', city: 'Admin Office', lat: '0.0000', lon: '0.0000', isp: 'LAN' },
                '127.0.0.1': { country: 'Localhost', city: 'Home', lat: '0.0000', lon: '0.0000', isp: 'Loopback' }
            };

            const data = locations[ip];
            if (data) {
                output = `
GeoIP Target: ${ip}
----------------------------------------
Country:      ${data.country}
City:         ${data.city}
Latitude:     ${data.lat}
Longitude:    ${data.lon}
ISP:          ${data.isp}
----------------------------------------`;
            } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
                const parts = ip.split('.');
                const octet = parseInt(parts[0]);
                let country = 'United States';
                let city = 'Unknown';
                
                if (octet > 200) { country = 'Russia'; city = 'Moscow'; }
                else if (octet > 150) { country = 'China'; city = 'Beijing'; }
                else if (octet > 100) { country = 'Germany'; city = 'Berlin'; }
                else if (octet > 50) { country = 'United Kingdom'; city = 'London'; }
                
                output = `
GeoIP Target: ${ip}
----------------------------------------
Country:      ${country}
City:         ${city}
Latitude:     ${(Math.random() * 180 - 90).toFixed(4)}
Longitude:    ${(Math.random() * 360 - 180).toFixed(4)}
ISP:          Generic ISP Node
----------------------------------------`;
            } else {
                output = `geoip: ${ip}: Invalid IP address`;
            }
        }
        break;
    }
    case 'volatility': {
       if (args.length < 3) {
           output = 'usage: volatility -f <dump_file> <plugin>\nPlugins: imageinfo, pslist, cmdline, netscan';
       } else {
           const fileIdx = args.indexOf('-f');
           if (fileIdx === -1 || !args[fileIdx+1]) {
               output = 'volatility: missing -f argument';
           } else {
               const dumpFile = args[fileIdx+1];
               const plugin = args.find(a => a !== '-f' && a !== dumpFile);
               
               const node = getNode(resolvePath(cwd, dumpFile));
               if (!node || node.type !== 'file') {
                   output = `volatility: ${dumpFile}: No such file or directory`;
               } else {
                   // Check for magic header
                   if (node.content.startsWith('\x7fELF') || dumpFile.endsWith('.dump') || dumpFile.endsWith('.dmp')) {
                       if (plugin === 'imageinfo') {
                           output = `Volatility Foundation Volatility Framework 2.6
INFO    : volatility.debug    : Determining profile based on KDBG search...
          Suggested Profile(s) : LinuxGhost5.4x64, LinuxDebian5.4x64
                     AS Layer1 : LinuxAMD64PagedMemory (Kernel AS)
                     AS Layer2 : FileAddressSpace (${dumpFile})
                      PAE type : No PAE
                           DTB : 0x1a2b3c00L
                          KDBG : 0xdeadbeefL`;
                       } else if (plugin === 'pslist') {
                           output = `Volatility Foundation Volatility Framework 2.6
Offset             Name                 Pid             PPid            Uid             Gid    DTB                Start Time
------------------ -------------------- --------------- --------------- --------------- ------ ------------------ ----------
0xffff8800bd8d8000 systemd              1               0               0               0      0x00000000bd8d8000 2026-10-23 09:00:00 UTC+0000
0xffff8800bd8d9000 kthreadd             2               0               0               0      0x00000000bd8d9000 2026-10-23 09:00:00 UTC+0000
0xffff8800bd8da000 sshd                 404             1               0               0      0x00000000bd8da000 2026-10-23 10:00:00 UTC+0000
0xffff8800bd8db000 bash                 1337            404             1000            1000   0x00000000bd8db000 2026-10-23 11:00:00 UTC+0000
0xffff8800bd8dc000 nc                   1338            1337            1000            1000   0x00000000bd8dc000 2026-10-23 14:02:00 UTC+0000
0xffff8800bd8dd000 phantom_process      666             1               0               0      0x00000000bd8dd000 2026-10-23 14:45:00 UTC+0000`;
                       } else if (plugin === 'cmdline') {
                           output = `Volatility Foundation Volatility Framework 2.6
************************************************************************
pid: 1      Command line : /sbin/init
************************************************************************
pid: 404    Command line : /usr/sbin/sshd -D
************************************************************************
pid: 1337   Command line : -bash
************************************************************************
pid: 666    Command line : ./phantom_process --backdoor --port 45678 --key GHOST_ROOT{M3M0RY_L34K_D3T3CT3D}
************************************************************************
pid: 1338   Command line : nc -l -p 1337 -e /bin/bash`;
                       } else if (plugin === 'netscan') {
                           output = `Volatility Foundation Volatility Framework 2.6
Offset             Proto    Local Address                  Foreign Address                State        Pid      Owner
0xffff880036d07c00 TCP      0.0.0.0:22                     0.0.0.0:0                      LISTEN       404      sshd
0xffff880036d07c00 TCP      0.0.0.0:45678                  0.0.0.0:0                      LISTEN       666      phantom_process
0xffff880036d07c00 TCP      127.0.0.1:1337                 0.0.0.0:0                      LISTEN       1338     nc`;
                       } else {
                           output = `volatility: unknown plugin '${plugin}'`;
                       }
                   } else {
                       output = `volatility: ${dumpFile}: Not a valid memory dump (ELF header missing)`;
                   }
               }
           }
       }
       break;
    }
    case 'lsblk': {
       const isMounted = !!MOUNTED_DEVICES['/dev/sdb1'];
       output = `NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
sda      8:0    0    64G  0 disk 
└─sda1   8:1    0    64G  0 part /
sdb      8:16   1    32G  0 disk 
└─sdb1   8:17   1    32G  0 part ${isMounted ? MOUNTED_DEVICES['/dev/sdb1'] : ''}
loop0    7:0    0   128M  0 loop /snap/core/1
loop1    7:1    0    64M  0 loop /snap/gtk-common-themes/15`;
       break;
    }
    case 'fdisk': {
       if (args.includes('-l')) {
           output = `Disk /dev/sda: 64 GiB, 68719476736 bytes, 134217728 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: A1B2C3D4-E5F6-7890-1234-567890ABCDEF

Device     Start       End   Sectors Size Type
/dev/sda1   2048 134217694 134215647  64G Linux filesystem

Disk /dev/sdb: 32 GiB, 34359738368 bytes, 67108864 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0xdeadbeef

Device     Boot Start      End  Sectors Size Id Type
/dev/sdb1        2048 67108863 67106816  32G 83 Linux`;
       } else {
           output = 'fdisk: permission denied (try -l to list partition tables)';
       }
       break;
    }
    case 'status': {
        const { objectives, progress, nextStep, rank } = getMissionStatus();
        const { hasNet, hasScan, hasIntel, decryptCount, isRoot, hasBlackSite, hasPayload, hasLaunchReady } = objectives;

        const color = (cond: boolean) => cond ? '\x1b[1;32m[COMPLETE]\x1b[0m' : '\x1b[1;30m[PENDING ]\x1b[0m';
        const barLen = 20;
        const filled = Math.round((progress / 100) * barLen);
        const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

        output = `
\x1b[1;36m╔══════════════════════════════════════════╗
║   GHOST_ROOT OPERATION TRACKER v2.1      ║
╚══════════════════════════════════════════╝\x1b[0m
AGENT RANK: ${rank.toUpperCase()}
PROGRESS:   ${progress}% [${bar}]

\x1b[1;33mCURRENT OBJECTIVES:\x1b[0m
 1. Establish Network Link (wifi)     ${color(hasNet)}
 2. Reconnaissance (scan/nmap)        ${color(hasScan)}
 3. Privilege Escalation (root)       ${color(isRoot)}
 4. Breach Black Site (ssh)           ${color(hasBlackSite)}
 5. Acquire Payload (sat)             ${color(hasPayload)}
 6. Recover Intel (decrypt keys)      ${color(decryptCount >= 3)} [${decryptCount}/3]
 7. System Liberation                 ${color(hasLaunchReady)}

\x1b[1;31m>>> ACTIVE DIRECTIVE: ${nextStep}\x1b[0m
\x1b[1;30m(Type 'hint' or 'man <tool>' for assistance)\x1b[0m
`;
        break;
    }
    case 'medscan':
    case 'biomon': {
        output = 'Initializing biometric sensors...';
        return { output, newCwd, action: 'medscan_sim' };
    }
    default:
      output = `bash: ${command}: command not found`;
  }

  return finalize(output, newCwd, action, data, newPrompt);
};
