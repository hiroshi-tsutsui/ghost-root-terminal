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
  newCwd: string;
}

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
      output = 'GHOST_ROOT Recovery Shell v0.1\nAvailable commands: ls, cd, cat, pwd, help, clear, exit';
      break;
    case 'clear':
      output = '\x1b[2J\x1b[0;0H'; // ANSI clear screen
      break;
    case 'exit':
        output = 'Logout.';
        break;
    default:
      output = `bash: ${command}: command not found`;
  }

  return { output, newCwd };
};
