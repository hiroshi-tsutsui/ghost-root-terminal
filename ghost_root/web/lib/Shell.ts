// Shell.ts - Command processing logic
// Decoupled from Ink/React for reusability

import VFS, { VFSNode } from './VFS';

// Browser-compatible path normalization (since we don't have Node's 'path' module in the browser by default,
// but Next.js might polyfill it or we can use a simple implementation).
// Actually, 'path' is a Node.js module. We should use a simple browser-safe implementation or a polyfill.
// For now, I'll implement a simple one.

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
  
  return '/' + stack.join('/');
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
  // Normalize path for lookup
  // Our VFS keys are exact strings.
  // We might need to handle trailing slashes or normalize.
  // The VFS keys in VFS.ts do not have trailing slashes (except root '/').
  
  if (vfsPath === '/') return VFS['/'];
  
  const normalized = vfsPath.endsWith('/') && vfsPath.length > 1 ? vfsPath.slice(0, -1) : vfsPath;
  return VFS[normalized];
};

export interface CommandResult {
  output: string;
  newCwd?: string;
  newPrompt?: string;
  action?: 'delay'; // For simulated delays
}

const COMMANDS = ['ls', 'cd', 'cat', 'pwd', 'help', 'clear', 'exit', 'ssh'];

export const tabCompletion = (cwd: string, inputBuffer: string): { matches: string[], completed: string } => {
  const parts = inputBuffer.split(' '); // Keep spaces to know if we are on a new arg
  // Handle case where split might result in empty string if input ends with space
  // Actually, we want to complete the *last* token.
  
  // If input is empty, return nothing
  if (!inputBuffer) return { matches: [], completed: inputBuffer };

  const lastTokenIndex = parts.length - 1;
  const lastToken = parts[lastTokenIndex];

  // Case 1: First token (Command completion)
  if (lastTokenIndex === 0) {
    const matches = COMMANDS.filter(cmd => cmd.startsWith(lastToken));
    if (matches.length === 1) {
      return { matches, completed: matches[0] + ' ' }; // Add space after command
    }
    return { matches, completed: inputBuffer }; // Return original if ambiguous or none
  }

  // Case 2: Argument (Path completion)
  // We need to resolve the path relative to cwd
  // The token might be "do" -> looks for files starting with "do" in cwd
  // The token might be "dir/" -> looks for files in "dir/" in cwd
  // The token might be "/var/" -> looks for files in "/var/"
  
  // 1. Separate directory part and filename part of the token
  let dirToSearch = cwd;
  let partialName = lastToken;
  
  if (lastToken.includes('/')) {
    const lastSlashIndex = lastToken.lastIndexOf('/');
    const dirPart = lastToken.substring(0, lastSlashIndex + 1); // "dir/"
    partialName = lastToken.substring(lastSlashIndex + 1);      // "file"
    
    // Resolve the directory part
    if (dirPart.startsWith('/')) {
        dirToSearch = normalizePath(dirPart);
    } else {
        dirToSearch = resolvePath(cwd, dirPart);
    }
  }

  // Ensure dirToSearch does not end with slash unless it is root, for VFS lookup
  // But our VFS keys do not have trailing slash (except root '/').
  // ResolvePath handles this (slices off trailing slash).
  
  const dirNode = getNode(dirToSearch);
  
  if (!dirNode || dirNode.type !== 'dir') {
     return { matches: [], completed: inputBuffer };
  }
  
  const candidates = dirNode.children.filter(child => child.startsWith(partialName));
  
  if (candidates.length === 1) {
      const match = candidates[0];
      // Reconstruct the new token
      let newToken = '';
      if (lastToken.includes('/')) {
          const lastSlashIndex = lastToken.lastIndexOf('/');
          newToken = lastToken.substring(0, lastSlashIndex + 1) + match;
      } else {
          newToken = match;
      }
      
      // Check if the match is a directory, if so append '/'
      // We need to check if the FULL path to the match is a directory in VFS
      const fullPathToMatch = dirToSearch === '/' ? `/${match}` : `${dirToSearch}/${match}`;
      const matchNode = getNode(fullPathToMatch);
      if (matchNode && matchNode.type === 'dir') {
          newToken += '/';
      } else {
          newToken += ' '; // Add space if it's a file
      }

      // Replace the last token in the input buffer
      parts[lastTokenIndex] = newToken;
      return { matches: candidates, completed: parts.join(' ') };
  }
  
  return { matches: candidates, completed: inputBuffer };
};

export const processCommand = (cwd: string, commandLine: string): CommandResult => {
  const parts = commandLine.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);
  let output = '';
  let newCwd = cwd;

  if (!command) {
    return { output: '', newCwd };
  }

  switch (command) {
    case 'ls': {
      const target = args[0] ? resolvePath(cwd, args[0]) : cwd;
      const node = getNode(target);
      if (node && node.type === 'dir') {
        output = node.children.join('  ');
      } else if (node && node.type === 'file') {
        output = args[0];
      } else {
        output = `ls: ${target}: No such file or directory`;
      }
      break;
    }
    case 'cd': {
      const target = args[0] || '/';
      const potentialPath = resolvePath(cwd, target);
      const targetNode = getNode(potentialPath);
      if (targetNode && targetNode.type === 'dir') {
        newCwd = potentialPath;
      } else {
        output = `bash: cd: ${target}: No such file or directory`;
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
        if (fileNode && fileNode.type === 'file') {
          output = fileNode.content;
        } else if (fileNode && fileNode.type === 'dir') {
          output = `cat: ${fileTarget}: Is a directory`;
        } else {
          output = `cat: ${fileTarget}: No such file or directory`;
        }
      }
      break;
    }
    case 'pwd':
      output = cwd;
      break;
    case 'help':
      output = 'GHOST_ROOT Recovery Shell v0.1\nAvailable commands: ls, cd, cat, pwd, help, clear, exit, ssh';
      break;
    case 'clear':
      output = '\x1b[2J\x1b[0;0H'; // ANSI clear screen
      break;
    case 'ssh':
      if (args.length < 1) {
        output = 'usage: ssh user@host';
      } else {
        const target = args[0];
        // Mock connection
        output = `Connecting to ${target}...\nConnected to ${target}.\nLast login: ${new Date().toUTCString()} from 192.168.1.5`;
        // Signal to change prompt
        // We need to return this information. The interface was updated.
        return { output, newCwd, newPrompt: 'ghost@remote_server$', action: 'delay' };
      }
      break;
    case 'exit':
        output = 'Logout.';
        break;
    default:
      output = `bash: ${command}: command not found`;
  }

  return { output, newCwd };
};
