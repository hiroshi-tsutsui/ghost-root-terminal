// Shell.ts - Command processing logic
// Decoupled from Ink/React for reusability

import VFS, { VFSNode } from './VFS';

const C_BLUE = '\x1b[1;34m';
const C_RESET = '\x1b[0m';

const ALIASES: Record<string, string> = {
  'l': 'ls -la',
  'll': 'ls -l',
  'c': 'clear'
};

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
  output: string;
  newCwd?: string;
  newPrompt?: string;
  action?: 'delay' | 'crack_sim' | 'scan_sim' | 'top_sim' | 'kernel_panic' | 'edit_file' | 'wifi_scan_sim' | 'clear_history' | 'matrix_sim' | 'trace_sim' | 'netmap_sim' | 'theme_change' | 'sat_sim' | 'radio_sim' | 'tcpdump_sim' | 'sqlmap_sim' | 'irc_sim' | 'tor_sim';
  data?: any;
}

const COMMANDS = ['ls', 'cd', 'cat', 'pwd', 'help', 'clear', 'exit', 'ssh', 'whois', 'grep', 'decrypt', 'mkdir', 'touch', 'rm', 'nmap', 'ping', 'netstat', 'nc', 'crack', 'analyze', 'man', 'scan', 'mail', 'history', 'dmesg', 'mount', 'umount', 'top', 'ps', 'kill', 'whoami', 'reboot', 'cp', 'mv', 'trace', 'traceroute', 'alias', 'su', 'sudo', 'shutdown', 'wall', 'chmod', 'env', 'printenv', 'locate', 'finger', 'curl', 'vi', 'vim', 'nano', 'ifconfig', 'crontab', 'wifi', 'iwconfig', 'telnet', 'apt', 'apt-get', 'hydra', 'camsnap', 'nslookup', 'dig', 'hexdump', 'xxd', 'uptime', 'w', 'zip', 'unzip', 'date', 'head', 'tail', 'strings', 'lsof', 'journal', 'journalctl', 'diff', 'wc', 'sort', 'uniq', 'steghide', 'find', 'neofetch', 'tree', 'weather', 'matrix', 'base64', 'rev', 'calc', 'systemctl', 'tar', 'ssh-keygen', 'awk', 'sed', 'radio', 'netmap', 'theme', 'sat', 'irc', 'tcpdump', 'sqlmap', 'tor', 'hashcat'];

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
          currentOutput = res.output;
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

  switch (command) {
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
        } else {
          output = fileNode.content;
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
    case 'ls': {
      const flags = args.filter(arg => arg.startsWith('-'));
      const paths = args.filter(arg => !arg.startsWith('-'));
      const targetPath = paths[0] ? resolvePath(cwd, paths[0]) : cwd;
      
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
      const potentialPath = resolvePath(cwd, target);
      const targetNode = getNode(potentialPath);
      if (!targetNode) {
        output = `bash: cd: ${target}: No such file or directory`;
      } else if (targetNode.type !== 'dir') {
        output = `bash: cd: ${target}: Not a directory`;
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
                 output = 'Authentication successful.\n[SUDO] Access granted.\nWARNING: Audit logging enabled.';
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
    case 'chmod': {
       if (args.length < 2) {
          output = 'usage: chmod <mode> <file>';
       } else {
          output = "chmod: changing permissions of '" + args[1] + "': Operation not permitted\n(Read-only filesystem mounted)";
       }
       break;
    }
    case 'env':
    case 'printenv':
       output = 'SHELL=/bin/bash\nUSER=ghost\nPWD=' + cwd + '\nHOME=/home/ghost\nTERM=xterm-256color\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n_=/usr/bin/env\nGHOST_PROTOCOL=ACTIVE';
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
      output = `GHOST_ROOT Recovery Shell v0.9 (Pipes Enabled)

Standard Commands:
  ls, cd, cat, pwd, clear, exit, man, mkdir, touch, rm, cp, mv

Pipe Utils:
  grep, head, tail, sort, uniq, wc, base64, rev, awk, sed, strings

Network Tools:
  ssh, ssh-keygen, ping, netstat, nmap, nc, scan, netmap, trace, traceroute, wifi, telnet, curl, nslookup, dig, irc, tcpdump, tor

Security Tools:
  crack, analyze, decrypt, steghide, hydra, camsnap, whois, sqlmap

System Tools:
  ps, kill, top, dmesg, mount, umount, reboot, shutdown, uptime, w, date, systemctl, journal, journalctl, lsof

Misc:
  zip, unzip, neofetch, weather, matrix, radio, alias, env, history, calc

Type "man <command>" for more information.`;
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
                      output = 'Connected to BLACK_SITE_LINK (172.16.66.6). WARNING: TRAFFIC MONITORED.';
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
            if (id === '01') output = `Connecting to CAM_LOBBY... [IMAGE CAPTURED]`;
            else if (id === '03' && (password === 'SPECTRE_EYE' || password === 'SPECTRE_EVE')) output = `Connecting to CAM_BLACK_SITE... [IMAGE CAPTURED]\nFLAG: GHOST_ROOT{I_SEE_YOU}`;
            else output = `camsnap: Camera ID ${id} not found or access denied.`;
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
             let hasKey = false;
             if (identityFile) {
                 const keyPath = resolvePath(cwd, identityFile);
                 const keyNode = getNode(keyPath);
                 if (keyNode && keyNode.type === 'file' && keyNode.content.includes('KEY_ID: BLACK_SITE_ACCESS_V1')) {
                     hasKey = true;
                 }
             }
             if (hasKey) {
                 output = `Connecting to ${target}...\n[BLACK SITE TERMINAL]\nWARNING: You are being watched.`;
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
             output = `Connecting to ${target}...\nWarning: Unauthorized access detected.`;
             newCwd = '/remote/admin-pc/home/admin';
             return { output, newCwd, newPrompt: 'admin@admin-pc', action: 'delay' };
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
      if (args.length < 1) {
        output = 'usage: decrypt <file> [password]';
      } else {
        const fileTarget = args[0];
        const filePath = resolvePath(cwd, fileTarget);
        const fileNode = getNode(filePath);
        if (!fileNode) {
          output = `decrypt: ${fileTarget}: No such file`;
        } else if (fileNode.type === 'dir') {
          output = `decrypt: ${fileTarget}: Is a directory`;
        } else {
          if (fileNode.content.includes('BINARY_PAYLOAD') || filePath.endsWith('payload.bin')) {
              if (args[1] === 'spectre') output = `-----BEGIN RSA PRIVATE KEY-----\nKEY_ID: BLACK_SITE_ACCESS_V1\n-----END RSA PRIVATE KEY-----`;
              else output = 'Error: Invalid password.';
          } else if (filePath.includes('operation_blackout')) {
              if (args[1] === 'red_ledger') output = `Decrypting...\n${atob(fileNode.content)}`;
              else output = 'Error: Invalid password.';
          } else if (filePath.includes('entry_02.enc')) {
              if (args[1] === 'black_widow') output = `Decrypting...\n${atob(fileNode.content)}`;
              else output = 'Error: Invalid password. (Hint: Check the evidence)';
          } else if (filePath.includes('KEYS.enc')) {
              if (args[1] === 'Spectre' || args[1] === 'spectre') output = `Decrypting...\n${atob(fileNode.content)}`;
              else output = 'Error: Invalid password. (Hint: Check satellite logs)';
          } else {
              try { output = atob(fileNode.content); } catch (e) { output = 'Error: File not encrypted or corrupted.'; }
          }
        }
      }
      break;
    }
    case 'exit':
        output = 'Logout.';
        break;
    case 'ping': {
       output = `PING ${args[0]}... timeout`;
       return { output, newCwd, action: 'delay' };
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
       const header = 'Active Internet connections (servers and established)';
       const table = CONNECTIONS.map(c => {
         return `${c.proto}  ${String(c.recv).padStart(6)} ${String(c.send).padStart(6)}  ${c.local.padEnd(20)} ${c.remote.padEnd(20)} ${c.state.padEnd(12)} ${c.pid}`;
       }).join('\n');
       output = `${header}\nProto Recv-Q Send-Q  Local Address        Foreign Address      State        PID/Program name\n${table}`;
       break;
    }
    case 'scan':
    case 'nmap': {
      if (args.length < 1) {
          output = 'usage: nmap <target_ip|cidr>';
      } else {
          const target = args[0];
          if (target === '192.168.1.0/24' || target === '10.0.0.0/24') {
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

Nmap done: 256 IP addresses (3 hosts up) scanned in 4.20 seconds`;
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
       if (args.length < 1) output = 'usage: nc [options] <host> <port>';
       else output = `nc: connect to ${args[0]} port ${args[1] || 23} (tcp) failed: Connection refused`;
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
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        const fileName = path.substring(path.lastIndexOf('/') + 1);
        const parentNode = getNode(parentPath);
        if (parentNode && parentNode.type === 'dir') {
          delete VFS[path];
          parentNode.children = parentNode.children.filter(c => c !== fileName);
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
      if (args.includes('aux') || args.includes('-aux')) {
          output = 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n' +
          PROCESSES.map(p => {
              const vsz = Math.floor(Math.random() * 100000);
              const rss = Math.floor(Math.random() * 50000);
              return `${p.user.padEnd(8)} ${String(p.pid).padStart(5)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${String(vsz).padStart(6)} ${String(rss).padStart(5)} ${p.tty.padEnd(8)} ${p.stat.padEnd(4)} 14:02   ${p.time.padStart(5)} ${p.command}`;
          }).join('\n');
      } else if (args.includes('-ef') || args.includes('ef')) {
          output = 'UID        PID  PPID  C STIME TTY          TIME CMD\n' +
          PROCESSES.map(p => {
              const ppid = p.pid === 1 ? 0 : 1;
              return `${p.user.padEnd(8)} ${String(p.pid).padStart(5)} ${String(ppid).padStart(5)}  0 14:02 ${p.tty.padEnd(8)} ${p.time.padStart(8)} ${p.command}`;
          }).join('\n');
      } else {
          // Default minimal output
          output = '  PID TTY          TIME CMD\n' +
          PROCESSES.filter(p => p.tty !== '?').map(p => {
              return `${String(p.pid).padStart(5)} ${p.tty.padEnd(8)} ${p.time.padStart(8)} ${p.command}`;
          }).join('\n');
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
                   output = `Tuning to ${freq} MHz...`;
                   return { output, newCwd, action: 'radio_sim', data: { mode: 'tune', freq } };
               }
           } else {
               output = `radio: unknown subcommand: ${subcmd}`;
           }
       }
       break;
    }
    case 'systemctl': {
       output = 'systemctl...';
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
          if (subcmd === 'list') {
              output = `Available Satellites (Low Earth Orbit):
[ID: KH-11]  USA-224 (Keyhole)   - ONLINE  (Encrypted)
[ID: COSM]   Cosmos-2542         - ONLINE  (Signal Weak)
[ID: OMEG]   Omega-Sat-V1        - OFFLINE (Maintenance)
[ID: BLK]    BLACK_KNIGHT        - UNKNOWN (Beacon Active)`;
          } else if (subcmd === 'connect') {
              if (args.length < 2) {
                  output = 'usage: sat connect <id>';
              } else {
                  const id = args[1];
                  if (['KH-11', 'COSM', 'BLK'].includes(id)) {
                      output = `Initializing uplink to ${id}...`;
                      return { output, newCwd, action: 'sat_sim', data: { target: id, mode: 'connect' } };
                  } else {
                      output = `sat: uplink failed: Target ${id} not found or out of range.`;
                  }
              }
          } else if (subcmd === 'status') {
              output = 'Uplink Status: DISCONNECTED\nSignal Strength: 0%\nEncryption: NONE';
          } else if (subcmd === 'files') {
               output = `[SAT_LINK] Remote File System (USA-224):
- rwxr-x---  IMAGERY_001  (24MB)  [CLASSIFIED]
- rwxr-x---  LOG_V2.txt   (4KB)
- r--------  KEYS.enc     (1KB)   [LOCKED]`;
          } else if (subcmd === 'download') {
               if (args.length < 2) {
                  output = 'usage: sat download <file_id>';
               } else {
                  output = 'Downloading...';
                  return { output, newCwd, action: 'sat_sim', data: { target: args[1], mode: 'download' } };
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
    case 'tor': {
       if (args.length < 1) {
           output = 'usage: tor <start|status|list|browse <onion_url>>';
       } else {
           const subcmd = args[0];
           if (subcmd === 'start') {
               output = 'Bootstrapping Tor circuit...';
               return { output, newCwd, action: 'tor_sim', data: { mode: 'start' } };
           } else if (subcmd === 'status') {
               // We need persistent state. For now, check VFS or assume running if files exist?
               // Let's use VFS flag.
               const runDir = getNode('/var/run');
               if (runDir && runDir.type === 'dir' && runDir.children.includes('tor.pid')) {
                   output = 'Tor is running (PID 6666).\nCircuit established: 3 hops.\nIdentity: Anonymous';
               } else {
                   output = 'Tor is not running.';
               }
           } else if (subcmd === 'list') {
               output = `[HIDDEN SERVICES DIRECTORY]
- silkroad7.onion        (Marketplace) [OFFLINE]
- dread55.onion          (Forum)       [ONLINE]
- ghostbox.onion         (Drop)        [ONLINE]
- cicada3301.onion       (Puzzle)      [UNKNOWN]`;
           } else if (subcmd === 'browse') {
               if (args.length < 2) {
                   output = 'usage: tor browse <onion_url>';
               } else {
                   const url = args[1];
                   output = `Connecting to ${url}...`;
                   return { output, newCwd, action: 'tor_sim', data: { mode: 'browse', url } };
               }
           } else {
               output = `tor: unknown command: ${subcmd}`;
           }
       }
       break;
    }
    default:
      output = `bash: ${command}: command not found`;
  }

  return finalize(output, newCwd, action, data, newPrompt);
};
