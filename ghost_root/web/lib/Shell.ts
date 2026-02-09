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

// Mock Aliases
let ALIASES: Record<string, string> = {
  'l': 'ls -la',
  'll': 'ls -l',
  'c': 'clear'
};

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

const removeChild = (parentPath: string, childName: string) => {
  const node = getNode(parentPath);
  if (node && node.type === 'dir') {
    node.children = node.children.filter(c => c !== childName);
  }
};

let MOUNTED_DEVICES: Record<string, string> = {}; // device -> mountPoint

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
  action?: 'delay' | 'crack_sim' | 'scan_sim' | 'top_sim' | 'kernel_panic' | 'edit_file' | 'wifi_scan_sim' | 'clear_history' | 'matrix_sim';
  data?: any;
}

const COMMANDS = ['ls', 'cd', 'cat', 'pwd', 'help', 'clear', 'exit', 'ssh', 'whois', 'grep', 'decrypt', 'mkdir', 'touch', 'rm', 'nmap', 'ping', 'netstat', 'nc', 'crack', 'analyze', 'man', 'scan', 'mail', 'history', 'dmesg', 'mount', 'umount', 'top', 'ps', 'kill', 'whoami', 'reboot', 'cp', 'mv', 'trace', 'alias', 'su', 'sudo', 'shutdown', 'wall', 'chmod', 'env', 'printenv', 'locate', 'finger', 'curl', 'vi', 'vim', 'nano', 'ifconfig', 'crontab', 'wifi', 'iwconfig', 'telnet', 'apt', 'apt-get', 'hydra', 'camsnap', 'nslookup', 'dig', 'hexdump', 'xxd', 'uptime', 'w', 'zip', 'unzip', 'date', 'head', 'tail', 'strings', 'lsof', 'journal', 'journalctl', 'diff', 'wc', 'sort', 'uniq', 'steghide', 'find', 'neofetch', 'tree', 'weather', 'matrix'];

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

export const processCommand = (cwd: string, commandLine: string): CommandResult => {
  // Handle Redirection (Simple > support)
  const redirectIndex = commandLine.indexOf('>');
  let redirectFile: string | null = null;
  let cmdToProcess = commandLine;

  if (redirectIndex !== -1) {
    redirectFile = commandLine.substring(redirectIndex + 1).trim();
    cmdToProcess = commandLine.substring(0, redirectIndex).trim();
  }

  let parts = tokenize(cmdToProcess);
  let command = parts[0];
  
  // Alias Expansion
  if (ALIASES[command]) {
      const aliasBody = ALIASES[command];
      const aliasParts = tokenize(aliasBody);
      // Replace the command with the alias parts, keeping arguments
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

  // Helper to handle result return with redirection
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
    case 'sudo': {
      if (args.length < 1) {
        output = 'usage: sudo <command>';
      } else {
        // Simulate password prompt and failure
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
          const date = new Date(Date.now() + 60000); // 1 minute later
          output = `Shutdown scheduled for ${date.toUTCString()}, use 'shutdown -c' to cancel.`;
      }
      break;
    }
    case 'alias': {
        if (args.length === 0) {
            output = Object.entries(ALIASES).map(([k, v]) => `alias ${k}='${v}'`).join('\n');
        } else {
            // Handle multiple assignments: alias foo='bar' baz='qux'
            // Simplified: just handle one for now or join args
            // Better: parse arguments looking for '='
            const fullArgs = args.join(' ');
            if (fullArgs.includes('=')) {
                // Determine split point (first =)
                const eqIndex = fullArgs.indexOf('=');
                const name = fullArgs.substring(0, eqIndex).trim();
                let value = fullArgs.substring(eqIndex + 1).trim();
                
                // Remove quotes if present
                if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
                    value = value.slice(1, -1);
                }
                
                if (name) {
                    ALIASES[name] = value;
                    // No output on success, like bash
                } else {
                    output = `bash: alias: \`${fullArgs}\': invalid alias name`;
                }
            } else {
                // Print specific alias
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
             const size = isDir ? 4096 : (itemNode?.content?.length || 0);
             const date = 'Oct 23 14:02'; 
             const name = isDir ? `${C_BLUE}${item}${C_RESET}` : item;
             return `${perms} 1 ghost ghost ${String(size).padStart(5)} ${date} ${name}`;
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
    case 'hexdump':
    case 'xxd': {
      const fileTarget = args[0];
      if (!fileTarget) {
        output = `usage: ${command} <file>`;
      } else {
        const filePath = resolvePath(cwd, fileTarget);
        const fileNode = getNode(filePath);
        if (!fileNode) {
          output = `${command}: ${fileTarget}: No such file or directory`;
        } else if (fileNode.type === 'dir') {
          output = `${command}: ${fileTarget}: Is a directory`;
        } else {
          const content = fileNode.content;
          const lines = [];
          for (let i = 0; i < content.length; i += 16) {
            const chunk = content.slice(i, i + 16);
            const hexParts = [];
            for(let j=0; j<chunk.length; j++) {
                hexParts.push(chunk.charCodeAt(j).toString(16).padStart(2, '0'));
                if (j === 7) hexParts.push(''); // spacing
            }
            const hex = hexParts.join(' ');
            
            const ascii = chunk.split('').map(c => {
               const code = c.charCodeAt(0);
               return (code >= 32 && code <= 126) ? c : '.';
            }).join('');
            
            lines.push(`${i.toString(16).padStart(8, '0')}: ${hex.padEnd(49, ' ')}  ${ascii}`);
          }
          output = lines.join('\n');
        }
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
    case 'journal': {
        const journalPath = '/home/ghost/journal';
        const journalNode = getNode(journalPath);
        
        if (!journalNode || journalNode.type !== 'dir') {
            output = 'Journal not found.';
        } else {
            if (args.length === 0) {
                // List entries
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
             // Passwords from USB key and crack command
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
      output = 'GHOST_ROOT Recovery Shell v0.6\n\nStandard Commands:\n  ls, cd, cat, pwd, clear, exit, man\n\nNetwork Tools:\n  ssh, ping, netstat, nmap, nc, scan\n\nSystem Tools:\n  ps, kill, top, dmesg, mount, umount\n\nSecurity Tools:\n  [REDACTED] - Access Level 4 required.\n\nType "man <command>" for more information.';
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
          case 'alias':
            output = 'NAME\n\talias - define or display aliases\n\nSYNOPSIS\n\talias [name[=value] ...]\n\nDESCRIPTION\n\tAlias with no arguments or with the -p option prints the list of aliases in the form alias name=value on standard output.\n\tWhen arguments are supplied, an alias is defined for each name whose value is given.';
            break;
          case 'cp':
             output = 'NAME\n\tcp - copy files and directories\n\nSYNOPSIS\n\tcp [SOURCE] [DEST]\n\nDESCRIPTION\n\tCopy SOURCE to DEST.';
             break;
          case 'mv':
             output = 'NAME\n\tmv - move (rename) files\n\nSYNOPSIS\n\tmv [SOURCE] [DEST]\n\nDESCRIPTION\n\tRename SOURCE to DEST, or move SOURCE(s) to DIRECTORY.';
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
          case 'journal':
             output = 'NAME\n\tjournal - read personal logs\n\nSYNOPSIS\n\tjournal [entry]\n\nDESCRIPTION\n\tDisplays personal log entries from the user\'s journal directory.\n\tSome entries may be encrypted.';
             break;
          case 'journalctl':
             output = 'NAME\n\tjournalctl - Query the systemd journal\n\nSYNOPSIS\n\tjournalctl [OPTIONS...]\n\nDESCRIPTION\n\tQuery the systemd journal.\n\nOPTIONS\n\t-f\n\t\tFollow the journal.\n\n\t-n <lines>\n\t\tShow the most recent journal events.';
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
          case 'trace':
             output = 'NAME\n\ttrace - print the route packets trace to network host\n\nSYNOPSIS\n\ttrace [host]\n\nDESCRIPTION\n\tTraceroute tracks the route packets taken from an IP network on their way to a given host.';
             break;
          case 'locate':
             output = 'NAME\n\tlocate - find files by name\n\nSYNOPSIS\n\tlocate [PATTERN]...\n\nDESCRIPTION\n\tlocate reads one or more databases prepared by updatedb and writes file names matching at least one of the PATTERNs to standard output, one per line.';
             break;
          case 'find':
             output = 'NAME\n\tfind - search for files in a directory hierarchy\n\nSYNOPSIS\n\tfind [path] [-name pattern] [-type d|f]\n\nDESCRIPTION\n\tfind searches the directory tree rooted at each given file name by evaluating the given expression from left to right, according to the rules of precedence.';
             break;
          case 'finger':
             output = 'NAME\n\tfinger - user information lookup program\n\nSYNOPSIS\n\tfinger [user]\n\nDESCRIPTION\n\tThe finger displays information about the system users.';
             break;
          case 'curl':
             output = 'NAME\n\tcurl - transfer a URL\n\nSYNOPSIS\n\tcurl [options] <url>\n\nDESCRIPTION\n\tcurl is a tool to transfer data from or to a server, using one of the supported protocols (HTTP, HTTPS, FTP, etc.).';
             break;
          case 'crontab':
             output = 'NAME\n\tcrontab - maintain crontab files for individual users\n\nSYNOPSIS\n\tcrontab [-u user] file\n\tcrontab [-u user] [-l | -r | -e] [-i] [-s]\n\nDESCRIPTION\n\tcrontab is the program used to install, deinstall or list the tables used to drive the cron(8) daemon in Vixie Cron.';
             break;
          case 'wifi':
             output = 'NAME\n\twifi - wireless network management utility\n\nSYNOPSIS\n\twifi [scan] [connect <ssid> <password>]\n\nDESCRIPTION\n\tManage wireless interfaces. Scan for networks or connect to them.';
             break;
          case 'iwconfig':
             output = 'NAME\n\tiwconfig - configure a wireless network interface\n\nSYNOPSIS\n\tiwconfig [interface]\n\nDESCRIPTION\n\tiwconfig is similar to ifconfig, but is dedicated to the wireless interfaces.';
             break;
          case 'telnet':
             output = 'NAME\n\ttelnet - user interface to the TELNET protocol\n\nSYNOPSIS\n\ttelnet <host> [port]\n\nDESCRIPTION\n\ttelnet is used to communicate with another host using the TELNET protocol.';
             break;
          case 'camsnap':
             output = 'NAME\n\tcamsnap - Remote surveillance capture utility\n\nSYNOPSIS\n\tcamsnap [-l] [-c <id> [-p <token>]]\n\nDESCRIPTION\n\tConnects to registered security cameras and retrieves a snapshot.\n\tProtected feeds require an authentication token.';
             break;
          case 'nslookup':
             output = 'NAME\n\tnslookup - query Internet name servers interactively\n\nSYNOPSIS\n\tnslookup [host] [server]\n\nDESCRIPTION\n\tNslookup is a program to query Internet domain name servers.  Nslookup has two modes: interactive and non-interactive.  Interactive mode allows the user to query name servers for information about various hosts and domains or to print a list of hosts in a domain.  Non-interactive mode is used to print just the name and requested information for a host or domain.';
             break;
          case 'dig':
             output = 'NAME\n\tdig - DNS lookup utility\n\nSYNOPSIS\n\tdig [@server] [-b address] [-c class] [-f filename] [-k filename] [name] [type]\n\nDESCRIPTION\n\tdig (domain information groper) is a flexible tool for interrogating DNS name servers.  It performs DNS lookups and displays the answers that are returned from the name server(s) that were queried.  Most DNS administrators use dig to troubleshoot DNS problems because of its flexibility, ease of use and clarity of output.  Other lookup tools tend to have less functionality than dig.';
             break;
          case 'hexdump':
          case 'xxd':
             output = 'NAME\n\thexdump, xxd - display file contents in hexadecimal\n\nSYNOPSIS\n\thexdump <file>\n\nDESCRIPTION\n\thexdump displays the contents of the specified file in hexadecimal, decimal, octal, or ASCII.';
             break;
          case 'date':
             output = 'NAME\n\tdate - print or set the system date and time\n\nSYNOPSIS\n\tdate [OPTION]...\n\nDESCRIPTION\n\tDisplay the current time in the given FORMAT, or set the system date.';
             break;
          case 'head':
             output = 'NAME\n\thead - output the first part of files\n\nSYNOPSIS\n\thead [OPTION]... [FILE]...\n\nDESCRIPTION\n\tPrint the first 10 lines of each FILE to standard output. With more than one FILE, precede each with a header giving the file name.';
             break;
          case 'tail':
             output = 'NAME\n\ttail - output the last part of files\n\nSYNOPSIS\n\ttail [OPTION]... [FILE]...\n\nDESCRIPTION\n\tPrint the last 10 lines of each FILE to standard output. With more than one FILE, precede each with a header giving the file name.';
             break;
          case 'lsof':
             output = 'NAME\n\tlsof - list open files\n\nSYNOPSIS\n\tlsof [options]\n\nDESCRIPTION\n\tlsof lists information about files opened by processes.';
             break;
          case 'steghide':
             output = 'NAME\n\tsteghide - a steganography program\n\nSYNOPSIS\n\tsteghide extract -sf <file> [-p <passphrase>]\n\nDESCRIPTION\n\tSteghide is a steganography program that is able to hide data in various kinds of image- and audio-files.';
             break;
          case 'sudo':
             output = 'NAME\n\tsudo - execute a command as another user\n\nSYNOPSIS\n\tsudo [command]\n\nDESCRIPTION\n\tsudo allows a permitted user to execute a command as the superuser or another user, as specified by the security policy.';
             break;
          case 'wall':
             output = 'NAME\n\twall - write a message to all users\n\nSYNOPSIS\n\twall [message]\n\nDESCRIPTION\n\twall displays the contents of file or, by default, its standard input, on the terminals of all currently logged in users.';
             break;
          case 'shutdown':
             output = 'NAME\n\tshutdown - halt, power-off or reboot the machine\n\nSYNOPSIS\n\tshutdown [OPTIONS...] [TIME] [WALL...]\n\nDESCRIPTION\n\tshutdown may be used to halt, power-off or reboot the machine.';
             break;
          case 'weather':
             output = 'NAME\n\tweather - display current weather conditions\n\nSYNOPSIS\n\tweather [location]\n\nDESCRIPTION\n\tDisplays the current atmospheric conditions. Warning: Data may be simulated or reflect local anomalies.';
             break;
          default:
            output = `No manual entry for ${page}`;
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
                      // Simulate network change
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
       output = `wlan0     IEEE 802.11  ESSID:"GHOST_NET"  
          Mode:Managed  Frequency:2.412 GHz  Access Point: 00:14:22:01:23:45   
          Bit Rate=54 Mb/s   Tx-Power=20 dBm   
          Retry short limit:7   RTS thr:off   Fragment thr:off
          Encryption key:off
          Power Management:on
          Link Quality=70/70  Signal level=-42 dBm  
          Rx invalid nwid:0  Rx invalid crypt:0  Rx invalid frag:0
          Tx excessive retries:0  Invalid misc:7   Missed beacon:0

eth0      no wireless extensions.

lo        no wireless extensions.`;
       break;
    case 'telnet': {
       if (args.length < 1) {
          output = 'telnet: usage: telnet <host> [port]';
       } else {
          const host = args[0];
          const port = args[1] || '23';
          
          if (host === 'towne.local' || host === '192.168.1.10') {
              if (port === '23') {
                  output = `Trying ${host}...\nConnected to ${host}.\nEscape character is '^]'.\n\n      .          .\n    .          .          .\n  .          .          .\n        .          .\n     .      .      .      .\n   .        .        .        .\n .      .      .      .      .\n.    .    .    .    .    .    .\n\n   STAR WARS - A NEW HOPE (ASCII)\n   (Stream interrupted by admin)\n\nConnection closed by foreign host.`;
                  return { output, newCwd, action: 'delay' };
              } else if (port === '17') {
                  const quotes = [
                      "\"I'm sorry, Dave. I'm afraid I can't do that.\"",
                      "\"Shall we play a game?\"",
                      "\"The only winning move is not to play.\"",
                      "\"I'll be back.\"",
                      "\"It's not a bug, it's a feature.\""
                  ];
                  const quote = quotes[Math.floor(Math.random() * quotes.length)];
                  output = `Trying ${host}...\nConnected to ${host}.\nEscape character is '^]'.\n\n${quote}\n\nConnection closed by foreign host.`;
                  return { output, newCwd, action: 'delay' };
              } else {
                  output = `Trying ${host}...\ntelnet: Unable to connect to remote host: Connection refused`;
                  return { output, newCwd, action: 'delay' };
              }
          } else if (host === 'black-site' || host === '192.168.1.99') {
              output = `Trying ${host}...\nConnected to ${host}.\nEscape character is '^]'.\n\nAuthorized Use Only.\n\nlogin: \n(Telnet login disabled. Use SSH.)\nConnection closed by foreign host.`;
              return { output, newCwd, action: 'delay' };
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
            
            if (id === '01') {
                output = `Connecting to CAM_LOBBY...
[IMAGE CAPTURED: /var/lib/cams/cam_01.jpg]

  .-----------------.
  |      EXIT       |
  |     [----]      |
  |      ||||       |
  |      ||||  O    |
  |      |||| /|\\   |
  |      |||| / \\   |
  '-----------------'`;
            } else if (id === '02') {
                output = `Connecting to CAM_SERVER...
[IMAGE CAPTURED: /var/lib/cams/cam_02.jpg]

  .-----------------.
  | [||||]   [||||] |
  | [||||]   [||||] |
  | [....]   [....] |
  | [||||]   [||||] |
  |                 |
  '-----------------'`;
            } else if (id === '03') {
                if (password === 'SPECTRE_EYE' || password === 'SPECTRE_EVE') {
                    output = `Connecting to CAM_BLACK_SITE...
[IMAGE CAPTURED: /var/lib/cams/cam_03_classified.jpg]

  .-----------------.
  |   TOP SECRET    |
  |   DO NOT ENTER  |
  |                 |
  | FLAG:           |
  | GHOST_ROOT{     |
  |   I_SEE_YOU     |
  | }               |
  '-----------------'`;
                } else {
                    output = `Connecting to CAM_BLACK_SITE...
ACCESS DENIED. Authentication token required.
(Hint: Check system logs for previous access attempts.)`;
                }
            } else {
                output = `camsnap: Camera ID ${id} not found.`;
            }
        } else {
            output = 'camsnap: invalid arguments';
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
             // No output on success
          }
       }
       break;
    }
    case 'mount': {
       if (args.length === 0) {
           if (Object.keys(MOUNTED_DEVICES).length === 0) {
               output = '/dev/sda1 on / type ext4 (rw,relatime)\nproc on /proc type proc (rw,nosuid,nodev,noexec,relatime)\nsysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)\ntmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime,size=815276k,mode=755)';
           } else {
               output = '/dev/sda1 on / type ext4 (rw,relatime)\nproc on /proc type proc (rw,nosuid,nodev,noexec,relatime)\nsysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)\ntmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime,size=815276k,mode=755)\n' + 
               Object.entries(MOUNTED_DEVICES).map(([dev, mp]) => `${dev} on ${mp} type vfat (rw,nosuid,nodev,relatime,fmask=0022,dmask=0022,codepage=437,iocharset=ascii,shortname=mixed,utf8,errors=remount-ro)`).join('\n');
           }
       } else if (args.length < 2) {
           output = 'usage: mount <source> <target>';
       } else {
           const source = args[0];
           const target = resolvePath(cwd, args[1]);
           
           if (!getNode(source)) {
               output = `mount: ${source}: special device does not exist`;
           } else if (!getNode(target)) {
               output = `mount: mount point ${target} does not exist`;
           } else if (MOUNTED_DEVICES[source]) {
               output = `mount: ${source} is already mounted on ${MOUNTED_DEVICES[source]}`;
           } else if (Object.values(MOUNTED_DEVICES).includes(target)) {
               output = `mount: ${target} is busy`;
           } else {
               // Logic for specific devices
               if (source === '/dev/sdb1') {
                   MOUNTED_DEVICES[source] = target;
                   
                   // Populate target
                   VFS[`${target}/README.txt`] = { type: 'file', content: 'WARNING: This drive contains restricted materials.\nAuthorized personnel only.' };
                   VFS[`${target}/payload.exe`] = { type: 'file', content: 'MZ........PE..d.....(Binary content omitted)...' };
                   VFS[`${target}/key.txt`] = { type: 'file', content: 'KEY_PART_1: GHOST_ROOT{M0UNT_AND_L0AD}' };
                   
                   addChild(target, 'README.txt');
                   addChild(target, 'payload.exe');
                   addChild(target, 'key.txt');
               } else {
                   output = `mount: wrong fs type, bad option, bad superblock on ${source}, missing codepage or helper program, or other error`;
               }
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
               // Also support umount /dev/sdb1
               if (dev === args[0]) { // args[0] might not be resolved fully if relative path to device... usually full path
                   device = dev;
                   break;
               }
           }
           
           if (!device) {
               output = `umount: ${target}: not mounted`;
           } else {
               const mountPoint = MOUNTED_DEVICES[device];
               delete MOUNTED_DEVICES[device];
               
               // Clear the mount point children
               const node = getNode(mountPoint);
               if (node && node.type === 'dir') {
                   // Clean up VFS entries for children
                   for (const child of node.children) {
                       delete VFS[`${mountPoint}/${child}`];
                   }
                   node.children = [];
               }
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
      
      // Basic argument parsing for -i
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
                 output = `Connecting to ${target}...\nAuthentication successful.\n\n[BLACK SITE TERMINAL]\nWARNING: You are being watched.`;
                 newCwd = '/remote/black-site/root';
                 // Ensure /remote/black-site/root exists in VFS
                 if (!getNode('/remote/black-site/root')) {
                     VFS['/remote/black-site'] = { type: 'dir', children: ['root'] };
                     VFS['/remote/black-site/root'] = { type: 'dir', children: ['FLAG.txt'] };
                     VFS['/remote/black-site/root/FLAG.txt'] = { type: 'file', content: 'GHOST_ROOT{PR1V4T3_K3Y_ACQU1R3D}' };
                 }
                 return { output, newCwd, action: 'delay', newPrompt: 'root@black-site#' };
             } else {
                 output = `Connecting to ${target}...\nPermission denied (publickey).\n(Hint: You need a valid key file. Try 'decrypt' on the payload.)`;
                 return { output, newCwd, action: 'delay' };
             }
        } else if (target.includes('admin-pc') || target.includes('192.168.1.5')) {
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
          // Payload Logic
          if ((fileNode.content && fileNode.content.includes('BINARY_PAYLOAD')) || filePath.endsWith('payload.bin')) {
              const password = args[1];
              if (password === 'spectre') {
                  output = `-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEA3...\nKEY_ID: BLACK_SITE_ACCESS_V1\n-----END RSA PRIVATE KEY-----`;
              } else {
                  output = 'Error: Decryption failed. Invalid password.';
              }
          }
          // Operation Blackout Logic
          else if (filePath === '/home/ghost/secrets/operation_blackout.enc') {
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
          } else if (target === '192.168.1.99' || target === 'black-site') {
             output = `PING ${target} (${target}) 56(84) bytes of data.\n64 bytes from ${target}: icmp_seq=1 ttl=128 time=12.045 ms\n64 bytes from ${target}: icmp_seq=2 ttl=128 time=11.052 ms\n\n--- ${target} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss, time 2003ms`;
             return { output, newCwd, action: 'delay' };
          } else {
             output = `ping: ${target}: Destination Host Unreachable`;
             return { output, newCwd, action: 'delay' };
          }
       }
       break;
    }
    case 'trace': {
       if (args.length < 1) {
          output = 'usage: trace <host>';
       } else {
          const target = args[0];
          if (target === '8.8.8.8' || target === 'google.com') {
             output = `traceroute to ${target} (8.8.8.8), 30 hops max, 60 byte packets
 1  192.168.1.1 (192.168.1.1)  0.432 ms  0.312 ms  0.289 ms
 2  10.0.0.1 (10.0.0.1)  1.232 ms  1.102 ms  1.099 ms
 3  142.250.1.1 (142.250.1.1)  12.32 ms  12.10 ms  11.99 ms
 4  8.8.8.8 (8.8.8.8)  14.32 ms  14.10 ms  13.99 ms`;
          } else if (target === '192.168.1.5' || target === 'admin-pc') {
             output = `traceroute to ${target} (192.168.1.5), 30 hops max, 60 byte packets
 1  192.168.1.1 (192.168.1.1)  0.432 ms  0.312 ms  0.289 ms
 2  ${target} (192.168.1.5)  1.232 ms  1.102 ms  1.099 ms`;
          } else {
             output = `traceroute to ${target} (${target}), 30 hops max, 60 byte packets
 1  192.168.1.1 (192.168.1.1)  0.452 ms  0.322 ms  0.299 ms
 2  * * *
 3  * * *
 4  ${target} (${target})  124.32 ms  124.10 ms  123.99 ms`;
          }
          return { output, newCwd, action: 'delay' };
       }
       break;
    }
    case 'netstat': {
       let connections = [
          'tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN',
          'tcp        0      0 127.0.0.1:631           0.0.0.0:*               LISTEN',
          'tcp6       0      0 :::80                   :::*                    LISTEN'
       ];
       
       // Dynamic check for Black Site connection
       const netStatus = VFS['/var/run/net_status'];
       if (netStatus && netStatus.type === 'file' && netStatus.content.includes('CONNECTED_BLACK_SITE')) {
           connections.push('tcp        0      0 192.168.1.105:45678     172.16.66.6:666         ESTABLISHED');
           connections.push('tcp        0      0 192.168.1.105:54321     172.16.66.6:22          TIME_WAIT');
       }

       output = `Active Internet connections (servers and established)\nProto Recv-Q Send-Q Local Address           Foreign Address         State\n${connections.join('\n')}\n\nActive UNIX domain sockets (servers and established)\nProto RefCnt Flags       Type       State         I-Node   Path\nunix  2      [ ACC ]     STREAM     LISTENING     18291    /run/user/1000/systemd/private`;
       break;
    }
    case 'lsof': {
        const header = 'COMMAND     PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME';
        const rows = [
            'systemd       1   root  cwd    DIR  259,1     4096    2 /',
            'systemd       1   root  txt    REG  259,1  1632960 5623 /usr/lib/systemd/systemd',
            'bash       1337  ghost  cwd    DIR  259,1     4096 1204 /home/ghost',
            'bash       1337  ghost  txt    REG  259,1  1234560 4321 /bin/bash',
            'sshd        404   root    3u  IPv4  23940      0t0  TCP *:ssh (LISTEN)',
            'spectre_k   666   root  mem    REG  259,1    84592 9001 /lib/modules/spectre.ko',
            'spectre_k   666   root    4r   REG  259,1      512 9002 /etc/shadow (deleted)',
            'hydra-scan 9999 unknown   1w  FIFO    0,8      0t0 8888 pipe',
            'watcher_d  8888   root    1w   REG  259,1    12044 7777 /var/log/auth.log'
        ];
        
        // Dynamic check for Black Site connection
        const netStatus = VFS['/var/run/net_status'];
        if (netStatus && netStatus.type === 'file' && netStatus.content.includes('CONNECTED_BLACK_SITE')) {
             rows.push('ssh        2025  ghost    3u  IPv4  99999      0t0  TCP 192.168.1.105:45678->172.16.66.6:666 (ESTABLISHED)');
        }

        output = [header, ...rows].join('\n');
        break;
    }
    case 'ifconfig':
       output = `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.105  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>
        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)
        RX packets 1542  bytes 129304 (126.2 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1024  bytes 98201 (95.8 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 2  bytes 140 (140.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 2  bytes 140 (140.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0`;
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
[   15.421422] wlan0: detected hidden SSID: DE:AD:BE:EF:CA:FE (signal: -80dBm)
[   15.421423] wlan0: encryption WEP (insecure) detected
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
    case 'cp': {
      if (args.length < 2) {
        output = 'usage: cp <source> <destination>';
      } else {
        const srcTarget = args[0];
        const destTarget = args[1];
        
        const srcPath = resolvePath(cwd, srcTarget);
        const srcNode = getNode(srcPath);
        
        if (!srcNode) {
          output = `cp: cannot stat '${srcTarget}': No such file or directory`;
        } else if (srcNode.type === 'dir') {
          output = `cp: -r not specified; omitting directory '${srcTarget}'`;
        } else {
          // Resolve destination
          let destPath = resolvePath(cwd, destTarget);
          const destNode = getNode(destPath);
          
          if (destNode && destNode.type === 'dir') {
             // cp file dir -> dir/file
             const fileName = srcPath.substring(srcPath.lastIndexOf('/') + 1);
             destPath = destPath === '/' ? `/${fileName}` : `${destPath}/${fileName}`;
          }
          
          const parentPath = destPath.substring(0, destPath.lastIndexOf('/')) || '/';
          const parentNode = getNode(parentPath);
          
          if (!parentNode || parentNode.type !== 'dir') {
             output = `cp: cannot create regular file '${destTarget}': No such file or directory`;
          } else {
             // Perform copy
             const fileName = destPath.substring(destPath.lastIndexOf('/') + 1);
             VFS[destPath] = { type: 'file', content: srcNode.content };
             
             // Update parent children if new
             if (!parentNode.children.includes(fileName)) {
                parentNode.children.push(fileName);
             }
          }
        }
      }
      break;
    }
    case 'mv': {
      if (args.length < 2) {
        output = 'usage: mv <source> <destination>';
      } else {
        const srcTarget = args[0];
        const destTarget = args[1];
        
        const srcPath = resolvePath(cwd, srcTarget);
        const srcNode = getNode(srcPath);
        
        if (!srcNode) {
           output = `mv: cannot stat '${srcTarget}': No such file or directory`;
        } else {
           // Resolve destination
           let destPath = resolvePath(cwd, destTarget);
           const destNode = getNode(destPath);
           
           if (destNode && destNode.type === 'dir') {
              const fileName = srcPath.substring(srcPath.lastIndexOf('/') + 1);
              destPath = destPath === '/' ? `/${fileName}` : `${destPath}/${fileName}`;
           }
           
           const parentPath = destPath.substring(0, destPath.lastIndexOf('/')) || '/';
           const parentNode = getNode(parentPath);
           
           if (!parentNode || parentNode.type !== 'dir') {
              output = `mv: cannot move '${srcTarget}' to '${destTarget}': No such file or directory`;
           } else {
              // Move logic
              const destFileName = destPath.substring(destPath.lastIndexOf('/') + 1);
              VFS[destPath] = srcNode; 
              
              if (!parentNode.children.includes(destFileName)) {
                  parentNode.children.push(destFileName);
              }
              
              // Remove old
              const srcParentPath = srcPath.substring(0, srcPath.lastIndexOf('/')) || '/';
              const srcFileName = srcPath.substring(srcPath.lastIndexOf('/') + 1);
              const srcParentNode = getNode(srcParentPath);
              
              if (srcParentNode && srcParentNode.type === 'dir') {
                  srcParentNode.children = srcParentNode.children.filter(c => c !== srcFileName);
              }
              delete VFS[srcPath];
           }
        }
      }
      break;
    }
    case 'locate': {
      if (args.length < 1) {
        output = 'usage: locate <pattern>';
      } else {
        const pattern = args[0];
        const matches = Object.keys(VFS).filter(path => path.includes(pattern));
        if (matches.length > 0) {
          output = matches.join('\n');
        } else {
          output = '';
        }
      }
      break;
    }
    case 'find': {
      let pathArg = '.';
      let argsStart = 0;

      if (args.length > 0 && !args[0].startsWith('-')) {
          pathArg = args[0];
          argsStart = 1;
      }

      const cmdArgs = args.slice(argsStart);
      let namePattern: string | null = null;
      let typePattern: string | null = null;
      
      const nameIndex = cmdArgs.indexOf('-name');
      if (nameIndex !== -1 && cmdArgs[nameIndex + 1]) {
          namePattern = cmdArgs[nameIndex + 1];
          if ((namePattern.startsWith('"') && namePattern.endsWith('"')) || (namePattern.startsWith("'") && namePattern.endsWith("'"))) {
              namePattern = namePattern.slice(1, -1);
          }
      }
      
      const typeIndex = cmdArgs.indexOf('-type');
      if (typeIndex !== -1 && cmdArgs[typeIndex + 1]) {
          typePattern = cmdArgs[typeIndex + 1];
      }

      // Resolve start path
      let startPath = resolvePath(cwd, pathArg);
      // Normalize to remove trailing slash for comparison, but keep root as /
      if (startPath !== '/' && startPath.endsWith('/')) {
          startPath = startPath.slice(0, -1);
      }
      
      const startNode = getNode(startPath);
      if (!startNode) {
          output = `find: '${pathArg}': No such file or directory`;
      } else {
          // Recursive search logic
          // Since VFS is flat, we can filter keys
          const matches = Object.keys(VFS).filter(p => {
              if (p === startPath) return true; 
              if (startPath === '/') return true;
              return p.startsWith(startPath + '/');
          });

          const results = matches.filter(p => {
              const node = VFS[p];
              const fileName = p.substring(p.lastIndexOf('/') + 1);

              // Filter by type
              if (typePattern) {
                  if (typePattern === 'f' && node.type !== 'file') return false;
                  if (typePattern === 'd' && node.type !== 'dir') return false;
              }

              // Filter by name (glob)
              if (namePattern) {
                  // Escape regex chars first
                  let regexStr = namePattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
                  // Convert glob wildcards to regex
                  regexStr = regexStr.replace(/\*/g, '.*').replace(/\?/g, '.');
                  regexStr = '^' + regexStr + '$';
                  const regex = new RegExp(regexStr);
                  if (!regex.test(fileName)) return false;
              }
              
              return true;
          });
          
          if (results.length === 0) {
              output = '';
          } else {
              output = results.join('\n');
          }
      }
      break;
    }
    case 'finger': {
       if (args.length < 1) {
          output = 'Login     Name       Tty      Idle  Login Time   Office     Office Phone\nghost     Ghost User pts/0          Oct 23 14:02 (192.168.1.105)';
       } else {
          const user = args[0];
          if (user === 'ghost') {
             output = 'Login: ghost            Name: Ghost User\nDirectory: /home/ghost  Shell: /bin/zsh\nOn since Oct 23 14:02 (pts/0) from 192.168.1.105\nNo mail.\nNo Plan.';
          } else if (user === 'root') {
             output = 'Login: root             Name: System Administrator\nDirectory: /root        Shell: /bin/bash\nNever logged in.\nNo mail.\nPlan:\n  > Maintain absolute control.\n  > Monitor all sub-processes.';
          } else if (user === 'admin') {
             output = 'Login: admin            Name: Admin PC User\nDirectory: /home/admin  Shell: /bin/bash\nLast login Oct 20 09:00 from 192.168.1.5\nPlan:\n  > Finish Project Omega.\n  > Rotate keys weekly.';
          } else {
             output = `finger: ${user}: no such user.`;
          }
       }
       break;
    }
    case 'curl': {
      if (args.length < 1) {
        output = 'curl: try \'curl --help\' for more information';
      } else {
        const url = args[0];
        if (url.includes('192.168.1.5') || url.includes('admin-pc')) {
             if (url.endsWith('payload') || url.endsWith('payload.bin')) {
                 output = `  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n                                 Dload  Upload   Total   Spent    Left  Speed\n100  1024  100  1024    0     0   2048      0 --:--:-- --:--:-- --:--:--  2048\n\n[INFO] Payload downloaded to ./payload.bin`;
                 const fileName = 'payload.bin';
                 const filePath = resolvePath(cwd, fileName);
                 VFS[filePath] = { type: 'file', content: 'BINARY_PAYLOAD_V2_ENCRYPTED_BY_OMEGA_PROTOCOL' };
                 return { output, newCwd, action: 'delay' };
             } else {
                 output = `curl: (404) Not Found`;
                 return { output, newCwd, action: 'delay' };
             }
        } else if (url.includes('google.com')) {
             output = '<!doctype html><html itemscope="" itemtype="http://schema.org/WebPage" lang="en">...</html>';
             return { output, newCwd, action: 'delay' };
        } else {
             output = `curl: (6) Could not resolve host: ${url}`;
             return { output, newCwd, action: 'delay' };
        }
      }
      break;
    }
    case 'crontab': {
      if (args.length < 1) {
        output = 'crontab: usage error: file name must be specified for replace\nusage: crontab [-u user] file\n       crontab [ -u user ] [ -i ] { -e | -l | -r }';
      } else {
        const option = args[0];
        if (option === '-l') {
           output = '# Edit this file to introduce tasks to be run by cron.\n# \n# m h  dom mon dow   command\n* * * * * /usr/bin/watchdog.sh >> /dev/null 2>&1\n0 3 * * * /home/ghost/scripts/backup_evidence.sh\n*/5 * * * * /usr/local/bin/heartbeat_monitor --target=admin-pc\n@reboot /usr/bin/python3 /opt/omega_protocol/listener.py\n# 0 0 1 1 * /usr/bin/shred -u /var/log/auth.log';
        } else if (option === '-e') {
           output = 'crontab: installing new crontab\n"/tmp/crontab.XYZ":0: bad command\nerrors in crontab file, can\'t install.';
        } else if (option === '-r') {
           output = 'crontab: must be privileged to use -r';
        } else {
           output = `crontab: invalid option -- '${option}'\nusage: crontab [-u user] file\n       crontab [ -u user ] [ -i ] { -e | -l | -r }\n`;
        }
      }
      break;
    }
    case 'vi':
    case 'vim':
    case 'nano': {
      if (args.length < 1) {
        output = 'usage: ' + command + ' <file>';
      } else {
        const fileTarget = args[0];
        const filePath = resolvePath(cwd, fileTarget);
        const fileNode = getNode(filePath);
        
        if (fileNode && fileNode.type === 'dir') {
           output = command + ': ' + fileTarget + ': Is a directory';
        } else {
           // Pass to editor
           const content = fileNode ? fileNode.content : '';
           return { output: '', newCwd, action: 'edit_file', data: { filePath, content, isNew: !fileNode } };
        }
      }
      break;
    }
    case 'apt':
    case 'apt-get': {
      if (args.length < 1) {
        output = 'apt 1.9.3 (amd64)\nUsage: apt [options] command\n\nMost used commands:\n  update - list of available new versions\n  upgrade - upgrade the system by installing/upgrading packages\n  full-upgrade - upgrade the system by removing/installing/upgrading packages\n  install - install packages\n  remove - remove packages\n  purge - remove packages and config files\n  autoremove - Remove automatically all unused packages\n  search - search in package descriptions\n  show - show package details';
      } else {
        const subcmd = args[0];
        const hasDarkRepo = !!VFS['/var/run/net_status'];
        
        if (subcmd === 'update') {
           output = 'Hit:1 http://security.debian.org buster/updates InRelease\nHit:2 http://deb.debian.org/debian buster InRelease\nHit:3 http://deb.debian.org/debian buster-updates InRelease\nHit:4 http://ghost.net/repo/secure InRelease';
           if (hasDarkRepo) {
               output += '\nGet:5 http://dark.net/repo/exploits InRelease [1,024 B]\nFetched 1,024 B in 1s (1,024 B/s)';
               // Mark repo as updated
               VFS['/var/lib/apt/lists/dark_net_exploits'] = { type: 'file', content: 'hydra metasploit sqlmap aircrack-ng' };
           }
           output += '\nReading package lists... Done';
           return { output, newCwd, action: 'delay' };
        } else if (subcmd === 'upgrade') {
           output = 'Reading package lists... Done\nBuilding dependency tree\nReading state information... Done\nCalculating upgrade... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.';
           return { output, newCwd, action: 'delay' };
        } else if (subcmd === 'install') {
           if (args.length < 2) {
              output = 'apt: install: missing package name';
           } else {
              const pkg = args[1];
              // Standard packages
              if (pkg === 'sl' || pkg === 'cmatrix' || pkg === 'neofetch') {
                 output = `Reading package lists... Done\nBuilding dependency tree\nReading state information... Done\nThe following NEW packages will be installed:\n  ${pkg}\n0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.\nNeed to get 14.2 kB of archives.\nAfter this operation, 45.1 kB of additional disk space will be used.\nGet:1 http://deb.debian.org/debian buster/main amd64 ${pkg} amd64 1.0.2 [14.2 kB]\nFetched 14.2 kB in 0s (156 kB/s)\nSelecting previously unselected package ${pkg}.\n(Reading database ... 34521 files and directories currently installed.)\nPreparing to unpack .../archives/${pkg}_1.0.2_amd64.deb ...\nUnpacking ${pkg} (1.0.2) ...\nSetting up ${pkg} (1.0.2) ...\nProcessing triggers for man-db (2.8.5-2) ...`;
                 
                 const binPath = `/usr/bin/${pkg}`;
                 if (!VFS['/usr/bin']) VFS['/usr/bin'] = { type: 'dir', children: [] };
                 const usrBin = VFS['/usr/bin'];
                 
                 if (usrBin.type === 'dir' && !usrBin.children.includes(pkg)) {
                    usrBin.children.push(pkg);
                    VFS[binPath] = { type: 'file', content: `BINARY_${pkg.toUpperCase()}` };
                 }

                 return { output, newCwd, action: 'delay' };
              } else if (pkg === 'ghost-protocol') {
                 output = 'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?';
              } else if (pkg === 'hydra' || pkg === 'metasploit' || pkg === 'sqlmap' || pkg === 'aircrack-ng') {
                 if (hasDarkRepo && VFS['/var/lib/apt/lists/dark_net_exploits']) {
                     output = `Reading package lists... Done\nBuilding dependency tree\nReading state information... Done\nThe following NEW packages will be installed:\n  ${pkg}\n0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.\nNeed to get 2,402 kB of archives.\nAfter this operation, 8,192 kB of additional disk space will be used.\nGet:1 http://dark.net/repo/exploits buster/main amd64 ${pkg} amd64 9.1-1 [2,402 kB]\nFetched 2,402 kB in 1s (2,402 kB/s)\nSelecting previously unselected package ${pkg}.\n(Reading database ... 34522 files and directories currently installed.)\nPreparing to unpack .../archives/${pkg}_9.1-1_amd64.deb ...\nUnpacking ${pkg} (9.1-1) ...\nSetting up ${pkg} (9.1-1) ...\nProcessing triggers for man-db (2.8.5-2) ...`;
                     
                     const binPath = `/usr/bin/${pkg}`;
                     if (!VFS['/usr/bin']) VFS['/usr/bin'] = { type: 'dir', children: [] };
                     const usrBin = VFS['/usr/bin'];
                     
                     if (usrBin.type === 'dir' && !usrBin.children.includes(pkg)) {
                        usrBin.children.push(pkg);
                        VFS[binPath] = { type: 'file', content: `BINARY_${pkg.toUpperCase()}` };
                     }
                     return { output, newCwd, action: 'delay' };
                 } else {
                     output = `Package ${pkg} is not available, but is referred to by another package.\nThis may mean that the package is missing, has been obsoleted, or\nis only available from another source\n\nE: Package '${pkg}' has no installation candidate`;
                 }
              } else {
                 output = `E: Unable to locate package ${pkg}`;
              }
           }
        } else if (subcmd === 'remove') {
           output = 'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?';
        } else {
           output = `E: Invalid operation ${subcmd}`;
        }
      }
      break;
    }
    case 'hydra': {
       const binPath = '/usr/bin/hydra';
       if (!VFS[binPath]) {
          output = 'bash: hydra: command not found';
       } else {
          if (args.length < 1) {
             output = 'Hydra v9.1 (c) 2020 by van Hauser/THC - Please do not use in military or secret service organizations, or for illegal purposes.\n\nSyntax: hydra [[[-l LOGIN|-L FILE] [-p PASS|-P FILE]] | [-C FILE]] [-e nsr] [-o FILE] [-t TASKS] [-M FILE [-T TASKS]] [-w TIME] [-W TIME] [-f] [-s PORT] [-x MIN:MAX:CHARSET] [-u] [-vV] [-4|-6] [service://server[:PORT][/OPT]]';
          } else {
             // Mock attack
             const target = args.find(a => a.includes('.') || a.includes('://')) || 'unknown';
             output = `Hydra v9.1 (c) 2020 by van Hauser/THC - Please do not use in military or secret service organizations, or for illegal purposes.\n\nHydra (https://github.com/vanhauser-thc/thc-hydra) starting at ${new Date().toISOString()}\n[DATA] max 16 tasks per 1 server, overall 16 tasks, 1 login try (l:1/p:1), ~1 try per task\n[DATA] attacking ${target}\n[STATUS] attack finished for ${target} (waiting for children to exit)\n\n[ERROR] No valid password found or target is patched.`;
             return { output, newCwd, action: 'delay' };
          }
       }
       break;
    }
    case 'nslookup':
    case 'dig': {
       if (args.length < 1) {
          if (command === 'nslookup') {
              output = 'usage: nslookup <host>';
          } else {
              output = 'usage: dig <host>';
          }
       } else {
          const host = args[0];
          const server = '192.168.1.1'; // Fake DNS server

          // Simulated DNS records
          const records: Record<string, string> = {
              'localhost': '127.0.0.1',
              'admin-pc': '192.168.1.5',
              'ghost-root': '192.168.1.105',
              'printer': '192.168.1.200',
              'router': '192.168.1.1',
              'gateway': '10.0.0.1',
              'black-site': '192.168.1.99', // Private IP
              'black-site.internal': '10.66.6.6', // VPN IP
              'corp.global': '10.0.0.50',
              'google.com': '8.8.8.8',
              'facebook.com': '31.13.72.36',
              'omega.proj': '0.0.0.0' // Lore hint
          };

          if (records[host]) {
              const ip = records[host];
              if (command === 'nslookup') {
                  output = `Server:		${server}\nAddress:	${server}#53\n\nNon-authoritative answer:\nName:	${host}\nAddress: ${ip}`;
              } else {
                  output = `
; <<>> DiG 9.11.3-1ubuntu1.11-Ubuntu <<>> ${host}
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 1337
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; QUESTION SECTION:
;${host}.			IN	A

;; ANSWER SECTION:
${host}.		299	IN	A	${ip}

;; Query time: 42 msec
;; SERVER: ${server}#53(${server})
;; WHEN: ${new Date().toUTCString()}
;; MSG SIZE  rcvd: 52`;
              }
          } else {
              if (command === 'nslookup') {
                  output = `Server:		${server}\nAddress:	${server}#53\n\n** server can't find ${host}: NXDOMAIN`;
              } else {
                  output = `
; <<>> DiG 9.11.3-1ubuntu1.11-Ubuntu <<>> ${host}
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 404
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; QUESTION SECTION:
;${host}.			IN	A

;; AUTHORITY SECTION:
.			10800	IN	SOA	a.root-servers.net. nstld.verisign-grs.com. 2024020900 1800 900 604800 86400

;; Query time: 12 msec
;; SERVER: ${server}#53(${server})
;; WHEN: ${new Date().toUTCString()}
;; MSG SIZE  rcvd: 104`;
              }
          }
       }
       break;
    }
    case 'uptime': {
       const uptimeSeconds = Math.floor((Date.now() - 1700000000000) / 1000); 
       const days = Math.floor(uptimeSeconds / 86400);
       const hours = Math.floor((uptimeSeconds % 86400) / 3600);
       const minutes = Math.floor((uptimeSeconds % 3600) / 60);
       const loadAvg = [0.12, 0.08, 0.05].map(n => (n + Math.random() * 0.1).toFixed(2)).join(', ');
       const timeStr = new Date().toTimeString().split(' ')[0];
       output = ` ${timeStr} up ${days} days, ${hours}:${String(minutes).padStart(2, '0')},  1 user,  load average: ${loadAvg}`;
       break;
    }
    case 'w': {
       const wTimeStr = new Date().toTimeString().split(' ')[0];
       const wUptimeSeconds = Math.floor((Date.now() - 1700000000000) / 1000); 
       const wDays = Math.floor(wUptimeSeconds / 86400);
       const wHours = Math.floor((wUptimeSeconds % 86400) / 3600);
       const wMinutes = Math.floor((wUptimeSeconds % 3600) / 60);
       const wLoadAvg = [0.12, 0.08, 0.05].map(n => (n + Math.random() * 0.1).toFixed(2)).join(', ');
       output = ` ${wTimeStr} up ${wDays} days, ${wHours}:${String(wMinutes).padStart(2, '0')},  1 user,  load average: ${wLoadAvg}\nUSER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT\nghost    pts/0    192.168.1.105    14:02    0.00s  0.12s  0.00s w`;
       break;
    }
    case 'date': {
       const date = new Date();
       if (args.includes('-u')) {
          output = date.toUTCString();
       } else if (args.includes('-R')) {
          // RFC 2822
          output = date.toUTCString();
       } else {
          output = date.toString();
       }
       break;
    }
    case 'head': {
       let linesToRead = 10;
       let fileTarget = '';
       
       if (args.length > 0) {
           if (args[0] === '-n' && args.length >= 3) {
               linesToRead = parseInt(args[1], 10);
               fileTarget = args[2];
           } else if (args[0].startsWith('-n')) {
               // handle -n5
               linesToRead = parseInt(args[0].substring(2), 10);
               fileTarget = args[1];
           } else {
               fileTarget = args[0];
           }
       }
       
       if (!fileTarget) {
           output = 'usage: head [-n lines] <file>';
       } else {
           const filePath = resolvePath(cwd, fileTarget);
           const fileNode = getNode(filePath);
           
           if (!fileNode) {
               output = `head: cannot open '${fileTarget}' for reading: No such file or directory`;
           } else if (fileNode.type === 'dir') {
               output = `head: error reading '${fileTarget}': Is a directory`;
           } else {
               const lines = fileNode.content.split('\n');
               output = lines.slice(0, linesToRead).join('\n');
           }
       }
       break;
    }
    case 'tail': {
       let linesToRead = 10;
       let fileTarget = '';
       
       if (args.length > 0) {
           if (args[0] === '-n' && args.length >= 3) {
               linesToRead = parseInt(args[1], 10);
               fileTarget = args[2];
           } else if (args[0].startsWith('-n')) {
               // handle -n5
               linesToRead = parseInt(args[0].substring(2), 10);
               fileTarget = args[1];
           } else {
               fileTarget = args[0];
           }
       }
       
       if (!fileTarget) {
           output = 'usage: tail [-n lines] <file>';
       } else {
           const filePath = resolvePath(cwd, fileTarget);
           const fileNode = getNode(filePath);
           
           if (!fileNode) {
               output = `tail: cannot open '${fileTarget}' for reading: No such file or directory`;
           } else if (fileNode.type === 'dir') {
               output = `tail: error reading '${fileTarget}': Is a directory`;
           } else {
               const lines = fileNode.content.split('\n');
               // tail -n 5 means last 5 lines. slice(-5) works.
               // if file has fewer lines, it takes all.
               const start = Math.max(0, lines.length - linesToRead);
               output = lines.slice(start).join('\n');
           }
       }
       break;
    }
    case 'zip': {
       if (args.length < 2) {
          output = 'zip: usage: zip <archive.zip> <files...>';
       } else {
          output = `  adding: ${args[1]} (deflated 42%)`;
          const zipPath = resolvePath(cwd, args[0]);
          const parentPath = zipPath.substring(0, zipPath.lastIndexOf('/')) || '/';
          const fileName = zipPath.substring(zipPath.lastIndexOf('/') + 1);
          const parentNode = getNode(parentPath);
          
          if (parentNode && parentNode.type === 'dir') {
              if (!getNode(zipPath)) {
                  VFS[zipPath] = { type: 'file', content: 'PK\x03\x04' + args[1] };
                  parentNode.children.push(fileName);
              }
          }
       }
       break;
    }
    case 'unzip': {
       if (args.length < 1) {
          output = 'unzip: usage: unzip <archive.zip>';
       } else {
          const target = args[0];
          const path = resolvePath(cwd, target);
          const node = getNode(path);
          if (!node) {
              output = `unzip: cannot find or open ${target}, ${target}.zip or ${target}.ZIP.`;
          } else {
              output = `Archive:  ${target}\n  inflating: payload.extracted`;
          }
       }
       break;
    }
    case 'diff': {
       if (args.length < 2) {
          output = 'usage: diff <file1> <file2>';
       } else {
          const path1 = resolvePath(cwd, args[0]);
          const path2 = resolvePath(cwd, args[1]);
          const node1 = getNode(path1);
          const node2 = getNode(path2);
          
          if (!node1) {
             output = `diff: ${args[0]}: No such file or directory`;
          } else if (!node2) {
             output = `diff: ${args[1]}: No such file or directory`;
          } else if (node1.type === 'dir' || node2.type === 'dir') {
             output = 'diff: target is a directory';
          } else {
             const lines1 = node1.content.split('\n');
             const lines2 = node2.content.split('\n');
             const diffs: string[] = [];
             
             let i = 0, j = 0;
             while (i < lines1.length || j < lines2.length) {
                 const l1 = i < lines1.length ? lines1[i] : null;
                 const l2 = j < lines2.length ? lines2[j] : null;

                 if (l1 === l2) {
                     i++; j++;
                 } else {
                     if (l1 !== null) { diffs.push(`< ${l1}`); i++; }
                     if (l2 !== null) { diffs.push(`> ${l2}`); j++; }
                 }
             }
             
             if (diffs.length === 0) {
                 output = '';
             } else {
                 output = diffs.join('\n');
             }
          }
       }
       break;
    }
    case 'wc': {
       if (args.length < 1) {
          output = 'usage: wc <file>';
       } else {
          const target = args[0];
          const path = resolvePath(cwd, target);
          const node = getNode(path);
          
          if (!node) {
             output = `wc: ${target}: No such file or directory`;
          } else if (node.type === 'dir') {
             output = `wc: ${target}: Is a directory`;
          } else {
             const lines = node.content.split('\n');
             const words = node.content.split(/\s+/).filter(w => w.length > 0);
             const bytes = node.content.length;
             output = ` ${lines.length}  ${words.length} ${bytes} ${target}`;
          }
       }
       break;
    }
    case 'sort': {
       if (args.length < 1) {
          output = 'usage: sort <file>';
       } else {
          const target = args[0];
          const path = resolvePath(cwd, target);
          const node = getNode(path);
          
          if (!node) {
             output = `sort: ${target}: No such file or directory`;
          } else if (node.type === 'dir') {
             output = `sort: ${target}: Is a directory`;
          } else {
             const lines = node.content.split('\n');
             lines.sort();
             output = lines.join('\n');
          }
       }
       break;
    }
    case 'uniq': {
       if (args.length < 1) {
          output = 'usage: uniq <file>';
       } else {
          const target = args[0];
          const path = resolvePath(cwd, target);
          const node = getNode(path);
          
          if (!node) {
             output = `uniq: ${target}: No such file or directory`;
          } else if (node.type === 'dir') {
             output = `uniq: ${target}: Is a directory`;
          } else {
             const lines = node.content.split('\n');
             const uniqueLines = lines.filter((line, index) => {
                 return index === 0 || line !== lines[index - 1];
             });
             output = uniqueLines.join('\n');
          }
       }
       break;
    }
    case 'steghide': {
       if (args.length < 1) {
          output = 'steghide: usage: steghide extract -sf <file> [-p <passphrase>]';
       } else {
          const subcommand = args[0];
          if (subcommand !== 'extract') {
              output = `steghide: unknown command "${subcommand}".\nUsage: steghide extract -sf <file>`;
          } else {
              const sfIndex = args.indexOf('-sf');
              const pIndex = args.indexOf('-p');
              
              if (sfIndex === -1) {
                  output = 'steghide: argument "-sf" is missing';
              } else {
                  const fileTarget = args[sfIndex + 1];
                  const passphrase = pIndex !== -1 ? args[pIndex + 1] : null;
                  
                  if (!fileTarget) {
                      output = 'steghide: filename expected after -sf';
                  } else {
                      const path = resolvePath(cwd, fileTarget);
                      const node = getNode(path);
                      
                      if (!node) {
                          output = `steghide: could not open file "${fileTarget}".`;
                      } else if (node.type === 'dir') {
                          output = `steghide: "${fileTarget}" is a directory.`;
                      } else {
                          const content = node.content;
                          const marker = '[HIDDEN_STEG_DATA:';
                          const markerIndex = content.indexOf(marker);
                          
                          if (markerIndex !== -1) {
                              if (!passphrase) {
                                  output = 'Enter passphrase: \n(Interactive input not supported, use -p <passphrase>)';
                              } else {
                                  // Verify passphrase
                                  if (passphrase === 'I_SEE_YOU') {
                                       const endMarker = ']';
                                       const dataStart = markerIndex + marker.length;
                                       const dataEnd = content.indexOf(endMarker, dataStart);
                                       if (dataEnd !== -1) {
                                           const b64 = content.substring(dataStart, dataEnd);
                                           try {
                                               const decoded = atob(b64);
                                               output = `wrote extracted data to "steg_result.txt".`;
                                               // Write result to file
                                               const outPath = resolvePath(cwd, 'steg_result.txt');
                                               const parentPath = outPath.substring(0, outPath.lastIndexOf('/')) || '/';
                                               const fileName = outPath.substring(outPath.lastIndexOf('/') + 1);
                                               const parent = getNode(parentPath);
                                               
                                               if (parent && parent.type === 'dir') {
                                                   VFS[outPath] = { type: 'file', content: decoded };
                                                   if (!parent.children.includes(fileName)) {
                                                       parent.children.push(fileName);
                                                   }
                                               }
                                           } catch (e) {
                                               output = 'steghide: error decoding data.';
                                           }
                                       } else {
                                           output = 'steghide: file format error.';
                                       }
                                  } else {
                                      output = `steghide: could not extract data: wrong passphrase.`;
                                  }
                              }
                          } else {
                              output = `steghide: could not extract any data with that passphrase!`;
                          }
                      }
                  }
              }
          }
       }
       break;
    }
// Fixed duplicate block
    case 'tree': {
       const target = args[0] || '.';
       const path = resolvePath(cwd, target);
       const rootNode = getNode(path);

       if (!rootNode) {
           output = `tree: ${target} [error opening dir]`;
       } else if (rootNode.type !== 'dir') {
           output = `${target} [error opening dir]`;
       } else {
           const lines: string[] = [path === '/' ? '/' : (path.split('/').pop() || '/')];
           let dirs = 0;
           let files = 0;

           const buildTree = (currentPath: string, prefix: string) => {
               const node = getNode(currentPath);
               if (!node || node.type !== 'dir') return;

               const items = node.children.sort();
               const visibleItems = items.filter(i => args.includes('-a') || !i.startsWith('.'));
               
               visibleItems.forEach((item, index) => {
                   const isLast = index === visibleItems.length - 1;
                   const childPath = currentPath === '/' ? `/${item}` : `${currentPath}/${item}`;
                   const childNode = getNode(childPath);
                   
                   lines.push(`${prefix}${isLast ? '└── ' : '├── '}${item}`);
                   
                   if (childNode) {
                       if (childNode.type === 'dir') {
                           dirs++;
                           buildTree(childPath, prefix + (isLast ? '    ' : '│   '));
                       } else {
                           files++;
                       }
                   }
               });
           };

           buildTree(path, '');
           output = `${lines.join('\n')}\n\n${dirs} directories, ${files} files`;
       }
       break;
    }
    case 'neofetch': {
       if (!VFS['/usr/bin/neofetch']) {
           output = 'bash: neofetch: command not found';
       } else {
           const uptimeSeconds = Math.floor((Date.now() - 1700000000000) / 1000); 
           const days = Math.floor(uptimeSeconds / 86400);
           const hours = Math.floor((uptimeSeconds % 86400) / 3600);
           const minutes = Math.floor((uptimeSeconds % 3600) / 60);
           const uptime = `${days}d ${hours}h ${minutes}m`;
           
           output = `       .---.
      /     \\      \x1b[1;32mghost@ghost-root\x1b[0m
      | (). |      ----------------
      \\   - /      OS: Ghost OS 1.0 (Debian Based)
       |   |       Kernel: 5.4.0-ghost
       |   |       Uptime: ${uptime}
      _|_|_|_      Shell: bash (simulated)
     (_______)     Resolution: 1920x1080
                   CPU: Neural-Net Processor (Simulated)
                   Memory: 8192MiB / 16384MiB`;
       }
       break;
    }
    case 'weather': {
       const location = args.join(' ') || 'The Void';
       const conditions = [
           'Acid Rain - pH 3.5 - Shelter advised',
           'Heavy Smog - Visibility < 50m - Respirator required',
           'Solar Flare Activity - Radio blackout imminent',
           'Electrical Storm - Surge protection enabled',
           'Clear Skies - Drone surveillance optimal',
           'Nuclear Winter - Temperature -20°C',
           'Data Fog - Packet loss 45%',
           'Neon Rain - Aesthetic only'
       ];
       const condition = conditions[Math.floor(Math.random() * conditions.length)];
       const temp = Math.floor(Math.random() * 30) - 10;
       
       output = `Weather for ${location}:\nCondition: ${condition}\nTemp: ${temp}°C\nWind: ${Math.floor(Math.random() * 50)} km/h NW\nHumidity: ${Math.floor(Math.random() * 100)}%\n\n[ALERT] Atmospheric sensors indicate high toxicity levels.`;
       break;
    }
    case 'matrix': {
       output = 'Wake up, Neo...';
       return { output, newCwd, action: 'matrix_sim' };
    }
    default:
      output = `bash: ${command}: command not found`;
  }

  return finalize(output, newCwd, action, data, newPrompt);
};
