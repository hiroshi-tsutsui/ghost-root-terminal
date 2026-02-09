const path = require('path');

const VFS = {
  '/': {
    type: 'dir',
    children: ['home', 'etc', 'var']
  },
  '/home': {
    type: 'dir',
    children: ['recovery_mode']
  },
  '/home/recovery_mode': {
    type: 'dir',
    children: ['emergency_protocol.sh', '.cache', 'notes.txt']
  },
  // ... (others)
};

const getNode = (vfsPath) => {
  return VFS[vfsPath];
};

const resolvePath = (currentPath, targetPath) => {
  if (!targetPath) return currentPath;
  let resolved = targetPath.startsWith('/') 
    ? path.normalize(targetPath) 
    : path.normalize(path.join(currentPath, targetPath));
  
  if (resolved !== '/' && resolved.endsWith('/')) {
    resolved = resolved.slice(0, -1);
  }
  return resolved;
};

// Simulation
let cwd = '/home/recovery_mode';

console.log('Initial CWD:', cwd);

// Try 'cd recovery' from '/home'
cwd = '/home';
console.log('CWD is now:', cwd);
const target = 'recovery';
const newPath = resolvePath(cwd, target);
console.log('Resolving:', cwd, target, '->', newPath);

const targetNode = getNode(newPath);
if (targetNode && targetNode.type === 'dir') {
    console.log('CD success to:', newPath);
    cwd = newPath;
} else {
    console.log('CD failed:', newPath);
}

// Check LS on '/home/recovery' if it succeeded (hypothetically)
if (targetNode) {
    const lsNode = getNode(cwd);
    if (lsNode) {
        console.log('LS children:', lsNode.children);
    } else {
        console.log('LS failed: No such file or directory');
    }
}
