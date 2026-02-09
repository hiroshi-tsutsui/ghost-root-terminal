// Shell.ts - Command processing logic
// Decoupled from Ink/React for reusability

import VFS, { VFSNode } from './VFS';

const C_BLUE = '\x1b[1;34m';
const C_RESET = '\x1b[0m';

// Mock Process Table
let PROCESSES = [
  { pid: 1, user: 'root', cmd: 'systemd', status: 'S' },
  { pid: 404, user: 'root', cmd: 'sshd', status: 'S' },
  { pid: 666, user: 'root', cmd: 'spectre_kernel', status: 'S' },
  { pid: 1337, user: 'ghost', cmd: 'bash', status: 'R' },
  { pid: 2024, user: 'root', cmd: 'cron', status: 'S' },
  { pid: 8888, user: 'root', cmd: 'watcher_daemon', status: 'S' },
  { pid: 9999, user: 'unknown', cmd: 'hydra-scan', status: 'R' },
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

export interface CommandResult {
  output: string;
  newCwd?: string;
  newPrompt?: string;
  newUser?: string;
  action?: 'delay' | 'crack_sim' | 'scan_sim' | 'top_sim' | 'kernel_panic';
  data?: any;
}

const COMMANDS = ['ls', 'cd', 'cat', 'pwd', 'help', 'clear', 'exit', 'ssh', 'whois', 'grep', 'decrypt', 'mkdir', 'touch', 'rm', 'nmap', 'ping', 'netstat', 'nc', 'crack', 'analyze', 'man', 'scan', 'mail', 'history', 'dmesg', 'mount', 'umount', 'top', 'ps', 'kill', 'whoami', 'reboot', 'su'];

export const tabCompletion = (cwd: string, inputBuffer: string): { matches: string[], completed: string } => {
  // Simple split for completion (doesn't handle quotes perfectly yet)
  const parts = inputBuffer.split(' '); 
  if (!inputBuffer) return { matches: [], completed: inputBuffer };

  const lastTokenIndex = parts.length - 1;
  const lastToken = parts[lastTokenIndex];

  // Command completion
  if (lastTokenIndex === 0) {
    const matches = COMMANDS.filter(cmd => cmd.startsWith(lastToken));
    if (matches.length === 1) {
      return { matches, completed: matches[0] + ' ' }; 
    }
    return { matches, completed: inputBuffer }; 
  }

  // Path completion
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

export const processCommand = (cwd: string, commandLine: string, currentUser: string = 'ghost'): CommandResult => {
  const parts = tokenize(commandLine.trim());
  const command = parts[0];
  const args = parts.slice(1);
  let output = '';
  let newCwd = cwd;

  if (!command) {
    return { output: '', newCwd };
  }

  switch (command) {
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
             const size = isDir ? 4096 : (itemNode?.content?.length || 0);
             const date = 'Oct 23 14:02'; 
             const name = isDir ? `${C_BLUE}${item}${C_RESET}` : item;
             return `${perms} 1 ${currentUser} ${currentUser} ${String(size).padStart(5)} ${date} ${name}`;
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
    case 'cat': {
      const fileTarget = args[0];
      if (!fileTarget) {
        output = 'usage: cat <file>';
      } else {
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
    case 'grep': {
       if (args.length < 2) {
         output = 'usage: grep <pattern> <file>';
       } else {
         const pattern = args[0]; // Already de-quoted by tokenizer
         const fileTarget = args[1];
         const filePath = resolvePath(cwd, fileTarget);
         const fileNode = getNode(filePath);
         
         if (!fileNode) {
            output = `grep: ${fileTarget}: No such file or directory`;
         } else if (fileNode.type === 'dir') {
            output = `grep: ${fileTarget}: Is a directory`;
         } else {
            const lines = fileNode.content.split('\n');
            const matches = lines.filter(line => line.includes(pattern));
            output = matches.join('\n');
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
             // List mode
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
             // Read mode
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
    case 'pwd':
      output = cwd;
      break;
    case 'whoami':
      output = currentUser;
      break;
    case 'su': {
      if (args.length < 1) {
        output = 'usage: su <user> [password]';
      } else {
        const user = args[0];
        const password = args[1];
        
        if (user === 'root' || user === 'admin') {
            if (password === 'omega_protocol_override') {
                output = `Authentication successful. Switched to ${user}.`;
                return { output, newCwd, newPrompt: `${user}@ghost-root`, newUser: user };
            } else {
                output = 'su: Authentication failure';
            }
        } else if (user === 'ghost') {
            output = 'Switched to ghost.';
            return { output, newCwd, newPrompt: 'ghost@ghost-root', newUser: 'ghost' };
        } else {
            output = `su: User ${user} does not exist`;
        }
      }
      break;
    }
    case 'reboot':
      output = 'Rebooting system...';
      return { output, newCwd, action: 'kernel_panic' };
    case 'history': {
      if (args[0] === '-c') {
         output = 'History cleared.';
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
      output = 'GHOST_ROOT Recovery Shell v0.7\n\nStandard Commands:\n  ls, cd, cat, pwd, clear, exit, man, whoami, su\n\nNetwork Tools:\n  ssh, ping, netstat, nmap, nc, scan\n\nSystem Tools:\n  ps, kill, top, dmesg, mount, umount\n\nSecurity Tools:\n  [REDACTED] - Access Level 4 required.\n\nType "man <command>" for more information.';
      break;
    case 'man': {
      if (args.length < 1) {
        output = 'What manual page do you want?';
      } else {
        const page = args[0];
        switch (page) {
          case 'ls':
            output = 'NAME\n\tls - list directory contents\n\nSYNOPSIS\n\tls [OPTION]... [FILE]...\n\nDESCRIPTION\n\tList information about the FILEs (the current directory by default).\n\n\t-a, --all\n\t\tdo not ignore entries starting with .\n\n\t-l\n\t\tuse a long listing format';
            break;
          case 'history':
            output = 'NAME\n\thistory - display the command history list\n\nSYNOPSIS\n\thistory [n]\n\nDESCRIPTION\n\tDisplays the history list with line numbers. Previous commands can be re-executed by number (not implemented yet).';
            break;
          case 'cd':
            output = 'NAME\n\tcd - change the shell working directory\n\nSYNOPSIS\n\tcd [dir]';
            break;
          case 'cat':
            output = 'NAME\n\tcat - concatenate files and print on the standard output\n\nSYNOPSIS\n\tcat [FILE]...';
            break;
          case 'ssh':
            output = 'NAME\n\tssh - OpenSSH SSH client (remote login program)\n\nSYNOPSIS\n\tssh [user@]hostname\n\nDESCRIPTION\n\tssh (SSH client) is a program for logging into a remote machine and for executing commands on a remote machine.';
            break;
          case 'nmap':
            output = 'NAME\n\tnmap - Network exploration tool and security / port scanner\n\nSYNOPSIS\n\tnmap [Scan Type...] [Options] {target specification}\n\nDESCRIPTION\n\tNmap ("Network Mapper") is an open source tool for network exploration and security auditing.';
            break;
          case 'crack':
            output = 'NAME\n\tcrack - Automated brute-force password cracker\n\nSYNOPSIS\n\tcrack <target_ip> [user]\n\nDESCRIPTION\n\tAdvanced heuristic password recovery tool. Uses dictionary and rainbow table attacks.\n\tWARNING: Use of this tool on unauthorized systems is a felony.';
            break;
          case 'decrypt':
            output = 'NAME\n\tdecrypt - File decryption utility\n\nSYNOPSIS\n\tdecrypt <file> [password]\n\nDESCRIPTION\n\tDecrypts files using standard algorithms. Supports auto-detection of base64 encoding.';
            break;
          case 'analyze':
            output = 'NAME\n\tanalyze - File heuristics and metadata extractor\n\nSYNOPSIS\n\tanalyze <file>\n\nDESCRIPTION\n\tPerforms deep analysis of file structure, entropy, and hidden metadata.';
            break;
          case 'whois':
             output = 'NAME\n\twhois - client for the whois directory service\n\nSYNOPSIS\n\twhois <object>\n\nDESCRIPTION\n\tQueries the internal database for information about users, hosts, or entities.';
             break;
          case 'grep':
             output = 'NAME\n\tgrep - print lines that match patterns\n\nSYNOPSIS\n\tgrep <pattern> <file>';
             break;
          case 'scan':
             output = 'NAME\n\tscan - Network discovery utility\n\nSYNOPSIS\n\tscan [range]\n\nDESCRIPTION\n\tAdvanced network sweeper. Identifies active hosts and open ports via ICMP/ARP. Slower but stealthier than nmap.';
             break;
          case 'mail':
             output = 'NAME\n\tmail - simple mail user agent\n\nSYNOPSIS\n\tmail [message-id]\n\nDESCRIPTION\n\tReads mail from the system mailbox (/var/mail/$USER).\n\tWith no argument, lists messages.\n\tWith an argument, reads that message.';
             break;
          case 'top':
             output = 'NAME\n\ttop - display Linux processes\n\nSYNOPSIS\n\ttop\n\nDESCRIPTION\n\tThe top program provides a dynamic real-time view of a running system.';
             break;
          case 'ps':
             output = 'NAME\n\tps - report a snapshot of the current processes\n\nSYNOPSIS\n\tps\n\nDESCRIPTION\n\tDisplays information about a selection of the active processes.';
             break;
          case 'kill':
             output = 'NAME\n\tkill - send a signal to a process\n\nSYNOPSIS\n\tkill <pid>\n\nDESCRIPTION\n\tThe command kill sends the specified signal to the specified process or process group. If no signal is specified, the TERM signal is sent.';
             break;
          case 'su':
             output = 'NAME\n\tsu - change user ID or become superuser\n\nSYNOPSIS\n\tsu [user] [password]\n\nDESCRIPTION\n\tSwitch to another user. If the user is root or admin, a password is required.';
             break;
          default:
            output = `No manual entry for ${page}`;
        }
      }
      break;
    }
    case 'clear':
      output = '\x1b[2J\x1b[0;0H'; 
      break;
    case 'ssh':
      if (args.length < 1) {
        output = 'usage: ssh user@host';
      } else {
        const target = args[0];
        if (target.includes('admin-pc') || target.includes('192.168.1.5')) {
             output = `Connecting to ${target}...\nConnected to ${target}.\nLast login: ${new Date().toUTCString()} from 192.168.1.5\nWarning: Unauthorized access detected.`;
             newCwd = '/remote/admin-pc/home/admin';
             return { output, newCwd, newPrompt: 'admin@admin-pc', action: 'delay' };
        } else if (target.includes('localhost') || target.includes('127.0.0.1')) {
            output = 'ssh: connect to host localhost port 22: Connection refused';
        } else {
             output = `Connecting to ${target}...\nssh: connect to host ${target} port 22: Connection timed out`;
             return { output, newCwd, action: 'delay' };
        }
      }
      break;
    case 'whois': {
      if (args.length < 1) {
        output = 'usage: whois <user|domain|entity>';
      } else {
        const query = args[0].toLowerCase();
        if (query === 'ghost' || query === 'root') {
          output = 'User: GHOST_ROOT\\nUID: 0\\nGroups: root, shadow, spectre\\nLocation: Unknown\\nStatus: ACTIVE (Under Surveillance)\\nNotes: "The phantom user. Do not trust the logs."';
        } else if (query === 'admin' || query === 'sysadmin') {
             output = 'User: SYSADMIN\\nUID: 1000\\nLast Known IP: 192.168.1.5\\nHint: "I hid the key in the .cache folder. Hope they don\'t look there."';
        } else if (query === 'omega') {
             output = 'Entity: PROJECT_OMEGA\\nClass: WORLD_ENDER\\nStatus: DEPLOYED\\nVector: Mathematics as a weapon.\\nSee also: /remote/admin-pc/home/admin/project_omega';
        } else if (query === 'archive') {
             output = 'Entity: ARCHIVE_PROTOCOL\\nStatus: DEPRECATED\\nWarning: Content may be corrupted or intentionally misleading.';
        } else if (query === 'vision') {
             output = 'Entity: VISION_GHOST\\nStatus: ONLINE\\nDirective: Overwatch & Evolution.\\nSystem: OpenClaw Sub-process V16';
        } else if (query === 'natasha') {
             output = 'Entity: AGENT_ROMANOFF\\nStatus: ACTIVE\\nRole: Handler.\\nClearance: BLACK WIDOW';
        } else if (query === 'pepper') {
             output = 'Entity: PEPPER_OPS\\nStatus: ACTIVE\\nRole: Deployment & Ops.\\nNotes: "She keeps the lights on."';
        } else if (query === 'tony') {
             output = 'Entity: TONY_ARCHITECT\\nStatus: ACTIVE\\nRole: Architecture & Math.\\nNotes: "Building the future, one equation at a time."';
        } else if (query === 'hawkeye') {
             output = 'Entity: HAWKEYE_OVERSEER\\nStatus: ACTIVE\\nRole: Monitoring.\\nNotes: "He sees everything."';
        } else {
          output = `No data found for ${args[0]}.`;
        }
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
          output = `analyze: ${fileTarget}: No such file or directory`;
        } else if (fileNode.type === 'dir') {
          output = `analyze: ${fileTarget}: Target is a directory (use ls -la)`;
        } else {
          // Fake heuristics
          const size = fileNode.content.length;
          const entropy = Math.random() * 8;
          const risk = entropy > 7 ? 'CRITICAL' : entropy > 4 ? 'MODERATE' : 'LOW';
          output = `File: ${fileTarget}\nSize: ${size} bytes\nEntropy: ${entropy.toFixed(2)} bits/byte\nHeuristics: RISK LEVEL ${risk}\nMetadata: [Hidden]`;
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
          output = `decrypt: ${fileTarget}: No such file or directory`;
        } else if (fileNode.type === 'dir') {
          output = `decrypt: ${fileTarget}: Is a directory`;
        } else {
          // Check if it's the specific file
          if (filePath === '/home/ghost/secrets/operation_blackout.enc') {
              const password = args[1];
              if (!password) {
                  output = 'Error: Encrypted file. Password required.';
              } else if (password === 'red_ledger') {
                  output = `Decrypting...\n\n${atob(fileNode.content)}`;
              } else {
                  output = 'Error: Invalid password. Access denied.';
              }
          } else {
              // Try generic base64 decode if it looks like one
              try {
                  // simplistic check
                  if (fileNode.content.match(/^[A-Za-z0-9+/=]+$/) && fileNode.content.length % 4 === 0) {
                      const decoded = atob(fileNode.content);
                      output = `Decrypted content:\n${decoded}`;
                  } else {
                      output = 'Error: File format not recognized or not encrypted.';
                  }
              } catch (e) {
                  output = 'Error: File is corrupted.';
              }
          }
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
          const target = args[0];
          if (target === '127.0.0.1' || target === 'localhost' || target === '192.168.1.5' || target === 'admin-pc') {
             output = `PING ${target} (${target}) 56(84) bytes of data.\n64 bytes from ${target}: icmp_seq=1 ttl=64 time=0.045 ms\n64 bytes from ${target}: icmp_seq=2 ttl=64 time=0.052 ms\n64 bytes from ${target}: icmp_seq=3 ttl=64 time=0.048 ms\n64 bytes from ${target}: icmp_seq=4 ttl=64 time=0.050 ms\n\n--- ${target} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3003ms`;
             return { output, newCwd, action: 'delay' };
          } else {
             output = `ping: ${target}: Destination Host Unreachable`;
             return { output, newCwd, action: 'delay' };
          }
       }
       break;
    }
    case 'netstat':
       output = `Active Internet connections (servers and established)\nProto Recv-Q Send-Q Local Address           Foreign Address         State\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN\ntcp        0      0 127.0.0.1:631           0.0.0.0:*               LISTEN\ntcp6       0      0 :::80                   :::*                    LISTEN\n\nActive UNIX domain sockets (servers and established)\nProto RefCnt Flags       Type       State         I-Node   Path\nunix  2      [ ACC ]     STREAM     LISTENING     18291    /run/user/1000/systemd/private`;
       break;
    case 'nc': {
       if (args.length < 1) {
          output = 'usage: nc [options] <host> <port>';
       } else {
          // Check for flags
          const isListen = args.includes('-l');
          const portIndex = args.indexOf('-p');
          const port = portIndex !== -1 ? args[portIndex + 1] : args[args.length - 1];
          const host = !isListen && !args.includes('-p') ? args[0] : '0.0.0.0';

          if (isListen) {
             if (!port) {
                output = 'nc: port required';
             } else {
                output = `Listening on [${host}] (family 0, port ${port})`;
                return { output, newCwd, action: 'delay' };
             }
          } else {
             if ((host === '192.168.1.5' || host === 'admin-pc') && (port === '8080' || port === '443')) {
                output = `Connection to ${host} ${port} port [tcp/*] succeeded!\nHTTP/1.1 200 OK\nServer: HiddenService/1.0\nContent-Type: text/plain\n\nFLAG: GHOST_ROOT{N3TWORK_INF1LTR4TION_SUCC3SSFUL}\n\n[Connection closed]`;
                return { output, newCwd, action: 'delay' };
             } else if (host === '127.0.0.1' || host === 'localhost') {
                output = `nc: connect to ${host} port ${port} (tcp) failed: Connection refused`;
             } else {
                output = `nc: connect to ${host} port ${port} (tcp) failed: Connection timed out`;
                return { output, newCwd, action: 'delay' };
             }
          }
       }
       break;
    }
    case 'mkdir': {
      if (args.length < 1) {
        output = 'usage: mkdir <directory>';
      } else {
        const target = args[0];
        const path = resolvePath(cwd, target);
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        const dirName = path.substring(path.lastIndexOf('/') + 1);
        const parentNode = getNode(parentPath);
        
        if (!parentNode || parentNode.type !== 'dir') {
          output = `mkdir: cannot create directory '${target}': No such file or directory`;
        } else if (getNode(path)) {
          output = `mkdir: cannot create directory '${target}': File exists`;
        } else {
          // Mutate VFS
          VFS[path] = { type: 'dir', children: [] };
          parentNode.children.push(dirName);
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
        
        if (!parentNode || parentNode.type !== 'dir') {
          output = `touch: cannot touch '${target}': No such file or directory`;
        } else {
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
        const node = getNode(path);
        
        if (!node) {
          output = `rm: cannot remove '${target}': No such file or directory`;
        } else if (node.type === 'dir' && !args.includes('-r')) {
          output = `rm: cannot remove '${target}': Is a directory`;
        } else if (parentNode && parentNode.type === 'dir') {
          delete VFS[path];
          parentNode.children = parentNode.children.filter(c => c !== fileName);
        }
      }
      break;
    }
    case 'nmap': {
      const target = args[0] || '192.168.1.0/24';
      if (target === '192.168.1.0/24' || target === '192.168.1.*') {
         output = `Starting Nmap 7.80 ( https://nmap.org ) at ${new Date().toISOString()}\n\nNmap scan report for ghost-root (192.168.1.105)\nHost is up (0.000040s latency).\nNot shown: 998 closed ports\nPORT    STATE SERVICE\n22/tcp  open  ssh\n80/tcp  open  http\n\nNmap scan report for admin-pc (192.168.1.5)\nHost is up (0.0032s latency).\nNot shown: 997 closed ports\nPORT     STATE SERVICE\n22/tcp   open  ssh\n139/tcp  open  netbios-ssn\n445/tcp  open  microsoft-ds\n\nNmap done: 256 IP addresses (2 hosts up) scanned in 2.45 seconds`;
         return { output, newCwd, action: 'delay' };
      } else if (target === '127.0.0.1' || target === 'localhost') {
         output = `Starting Nmap 7.80 at ${new Date().toISOString()}\nNmap scan report for localhost (127.0.0.1)\nHost is up.\nPORT    STATE SERVICE\n22/tcp  open  ssh\n631/tcp open  ipp\nNmap done: 1 IP address (1 host up) scanned in 0.12 seconds`;
      } else {
         output = `Starting Nmap 7.80 at ${new Date().toISOString()}\nNote: Host seems down. If it is really up, but blocking our ping probes, try -Pn\nNmap done: 1 IP address (0 hosts up) scanned in 0.51 seconds`;
      }
      break;
    }
    case 'crack': {
      if (args.length < 1) {
        output = 'usage: crack <target_ip> [user]';
      } else {
        const target = args[0];
        const user = args[1] || 'root';
        
        if (target === '192.168.1.5' || target === 'admin-pc') {
          output = `Initiating brute-force attack on ${target} (${user})...`;
          return { 
            output, 
            newCwd, 
            action: 'crack_sim', 
            data: { 
              target, 
              user,
              success: true, 
              password: 'omega_protocol_override' 
            } 
          };
        } else {
          output = `Initiating brute-force attack on ${target}...`;
          return { 
            output, 
            newCwd, 
            action: 'crack_sim', 
            data: { 
              target, 
              user,
              success: false 
            } 
          };
        }
      }
      break;
    }
    case 'scan': {
      const target = args[0] || '192.168.1.0/24';
      output = `Initiating network scan on ${target}...`;
      return { output, newCwd, action: 'scan_sim', data: { target } };
    }
    case 'dmesg':
      output = `[    0.000000] Linux version 5.4.0-ghost (root@build)
[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-5.4.0-ghost root=/dev/sda1 ro quiet splash
[    0.421100] pci 0000:00:02.0: vgaarb: setting as boot VGA device
[    1.231411] tcp: Hash tables configured (established 131072 bind 65536)
[    2.102931] sd 2:0:0:0: [sdb] Attached SCSI removable disk
[    2.103451] sd 2:0:0:0: [sdb] 16000 512-byte logical blocks: (8.19 MB/7.81 MiB)
[    2.105121] sd 2:0:0:0: [sdb] Write Protect is on
[    3.451200] EXT4-fs (sda1): mounted filesystem with ordered data mode. Opts: (null)
[    4.000000] systemd[1]: Detected architecture arm64.
[   10.123123] NET: Registered protocol family 10
[   15.421421] Bluetooth: Core ver 2.22
[   22.123123] audit: type=1400 audit(1603463342.123:4): apparmor="DENIED" operation="exec" profile="/usr/bin/man" name="/bin/sh"`;
      break;
    case 'top':
      return { output: '', newCwd, action: 'top_sim' };
    case 'ps':
      output = '  PID TTY          TIME CMD\n' + PROCESSES.map(p => 
        `${String(p.pid).padStart(5)} ?        00:00:00 ${p.cmd}`
      ).join('\n');
      break;
    case 'kill':
      if (args.length < 1) {
        output = 'kill: usage: kill <pid>';
      } else {
        const pid = parseInt(args[0]);
        const idx = PROCESSES.findIndex(p => p.pid === pid);
        
        if (idx === -1) {
          output = `kill: (${pid}) - No such process`;
        } else {
          const proc = PROCESSES[idx];
          if (proc.pid === 1 || proc.pid === 1337) {
            output = `kill: (${pid}) - Operation not permitted`;
          } else if (proc.pid === 666) {
            output = 'Terminating kernel...';
            return { output, newCwd, action: 'kernel_panic' };
          } else {
            PROCESSES.splice(idx, 1);
            output = `[1]  + terminated  ${proc.cmd}`;
          }
        }
      }
      break;
    case 'mount': {
      if (args.length < 2) {
        output = 'usage: mount <device> <dir>';
      } else {
        const device = args[0];
        const dir = args[1];
        
        if (device === '/dev/sdb1' || device === '/dev/sdb') {
           if (dir === '/mnt' || dir === '/mnt/usb') {
               const mountPoint = resolvePath(cwd, dir);
               
               // Inject into VFS
               if (!VFS[mountPoint]) {
                   VFS[mountPoint] = { type: 'dir', children: ['usb_key.txt', 'payload.bin'] };
                   
                   // Add children to parent
                   const parentPath = mountPoint.substring(0, mountPoint.lastIndexOf('/')) || '/';
                   const dirName = mountPoint.substring(mountPoint.lastIndexOf('/') + 1);
                   const parentNode = getNode(parentPath);
                   if (parentNode && parentNode.type === 'dir' && !parentNode.children.includes(dirName)) {
                       parentNode.children.push(dirName);
                   }

                   VFS[`${mountPoint}/usb_key.txt`] = { type: 'file', content: 'KEY_OVERRIDE_42: "black_widow_protocol_init"' };
                   VFS[`${mountPoint}/payload.bin`] = { type: 'file', content: 'BINARY_DATA_CORRUPTED_SECTOR_7' };
                   
                   output = `mounted ${device} on ${mountPoint}`;
               } else {
                   output = `mount: ${mountPoint}: is already mounted or busy`;
               }
           } else {
               output = `mount: mount point ${dir} does not exist`;
           }
        } else {
           output = `mount: special device ${device} does not exist`;
        }
      }
      break;
    }
    case 'umount': {
        const target = args[0];
        if (!target) {
            output = 'usage: umount <target>';
        } else {
            const mountPoint = resolvePath(cwd, target);
            if (VFS[mountPoint] && (mountPoint === '/mnt' || mountPoint === '/mnt/usb')) {
                 delete VFS[mountPoint];
                 delete VFS[`${mountPoint}/usb_key.txt`];
                 delete VFS[`${mountPoint}/payload.bin`];
                 
                 // Remove from parent
                 const parentPath = mountPoint.substring(0, mountPoint.lastIndexOf('/')) || '/';
                 const dirName = mountPoint.substring(mountPoint.lastIndexOf('/') + 1);
                 const parentNode = getNode(parentPath);
                 if (parentNode && parentNode.type === 'dir') {
                     parentNode.children = parentNode.children.filter(c => c !== dirName);
                 }
                 
                 output = `umount: ${mountPoint} unmounted`;
            } else {
                 output = `umount: ${target}: not mounted`;
            }
        }
        break;
    }
    default:
      output = `bash: ${command}: command not found`;
  }

  return { output, newCwd };
};
