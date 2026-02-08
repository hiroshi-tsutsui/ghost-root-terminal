// VFS.ts - Virtual File System for the browser
// Ported from ghost_root/src/VFS.js

export interface FileNode {
  type: 'file';
  content: string;
}

export interface DirNode {
  type: 'dir';
  children: string[];
}

export type VFSNode = FileNode | DirNode;

const VFS: Record<string, VFSNode> = {
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
  '/home/recovery_mode/emergency_protocol.sh': {
    type: 'file',
    content: `#!/bin/bash
# EMERG_PROTO_V1
# INITIATING SYSTEM LOCKDOWN...
#
# ADMIN OVERRIDE CODE REQUIRED.
# CONTACT SYSADMIN FOR KEY.
#
# HINT: The key is hidden in the logs.
#
# ...
# ...
#
# (Hidden Content)
# VGhlIHBhc3N3b3JkIGlzOiByZWNvdmVyeV9tb2RlX2FjdGl2YXRlZA==`
  },
  '/home/recovery_mode/.cache': {
    type: 'dir',
    children: ['temp.log']
  },
  '/home/recovery_mode/notes.txt': {
    type: 'file',
    content: 'Meeting with SysAdmin at 14:00. Remember to check the logs.'
  },
  '/etc': {
    type: 'dir',
    children: ['passwd', 'hosts']
  },
  '/var': {
    type: 'dir',
    children: ['log']
  },
  '/var/log': {
      type: 'dir',
      children: ['syslog']
  },
    '/var/log/syslog': {
        type: 'file',
        content: `Oct 23 14:02:11 ghost-root systemd[1]: Started Session 1 of user root.
Oct 23 14:05:00 ghost-root CRON[1234]: (root) CMD (echo "System check complete")
Oct 23 14:10:22 ghost-root kernel: [    0.000000] Linux version 5.4.0-123-generic (buildd@lcy02-amd64-001) (gcc version 9.4.0 (Ubuntu 9.4.0-1ubuntu1~20.04.1)) #139-Ubuntu SMP Mon Jul 11 15:47:32 UTC 2022
`
    }
};

export default VFS;
