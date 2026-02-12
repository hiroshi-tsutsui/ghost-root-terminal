// Shell.ts - Command processing logic
// Decoupled from Ink/React for reusability

import VFS, { VFSNode, initialVFS } from './VFS';

const C_BLUE = '\x1b[1;34m';
const C_CYAN = '\x1b[1;36m';
const C_RESET = '\x1b[0m';

// Persistence Keys
const STORAGE_KEY_VFS = 'ghost_root_vfs_v1';
const STORAGE_KEY_SHELL = 'ghost_root_shell_v1';
const STORAGE_KEY_ATTRS = 'ghost_root_attrs_v1';

const ALIASES: Record<string, string> = {
  'l': 'ls -la',
  'll': 'ls -l',
  'c': 'clear',
  'check': 'status',
  'todo': 'status',
  'objectives': 'status',
  'mission': 'status',
  'hint': 'status',
  'ping_sweep': 'nmap -sn 192.168.1.0/24'
};

const ENV_VARS: Record<string, string> = {
  'SHELL': '/bin/bash',
  'USER': 'ghost',
  'TERM': 'xterm-256color',
  'PATH': '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
  '_': '/usr/bin/env',
  'GHOST_PROTOCOL': 'ACTIVE'
};

const FILE_ATTRIBUTES: Record<string, string[]> = {
    '/var/log/surveillance.log': ['i']
};

let KNOCK_SEQUENCE: number[] = [];

let ALERT_LEVEL = 0;
let SYSTEM_TIME_OFFSET = -824900000000; // Set system time to ~1999 (Y2K glitch)

const LOADED_MODULES: string[] = [];

// ... [Existing Job/Process interfaces and initial arrays] ...

// Helper to save state
export const saveSystemState = () => {
    if (typeof window === 'undefined') return;
    
    // Save VFS
    try {
        localStorage.setItem(STORAGE_KEY_VFS, JSON.stringify(VFS));
    } catch (e) {
        console.error('Failed to save VFS', e);
    }

    // Save Shell State
    const shellState = {
        ALIASES,
        ENV_VARS,
        ALERT_LEVEL,
        SYSTEM_TIME_OFFSET,
        LOADED_MODULES,
        FILE_ATTRIBUTES, // Added for Cycle 40
        MOUNTED_DEVICES, // Added for Cycle 83 Persistence
        // Processes and Jobs are volatile (memory only), so we don't save them.
        // History is saved separately in VFS (.bash_history)
    };
    try {
        localStorage.setItem(STORAGE_KEY_SHELL, JSON.stringify(shellState));
    } catch (e) {
        console.error('Failed to save Shell State', e);
    }
};

// Helper to load state
export const loadSystemState = () => {
    if (typeof window === 'undefined') return;

    // Load VFS
    const savedVFS = localStorage.getItem(STORAGE_KEY_VFS);
    if (savedVFS) {
        try {
            const parsed = JSON.parse(savedVFS);
            // Clear current VFS keys
            for (const key in VFS) delete VFS[key];
            // Apply saved keys
            Object.assign(VFS, parsed);
        } catch (e) {
            console.error('Failed to load VFS', e);
        }
    }

    // Load Shell State
    const savedShell = localStorage.getItem(STORAGE_KEY_SHELL);
    if (savedShell) {
        try {
            const parsed = JSON.parse(savedShell);
            if (parsed.ALIASES) Object.assign(ALIASES, parsed.ALIASES);
            if (parsed.ENV_VARS) Object.assign(ENV_VARS, parsed.ENV_VARS);
            if (parsed.ALERT_LEVEL !== undefined) ALERT_LEVEL = parsed.ALERT_LEVEL;
            if (parsed.SYSTEM_TIME_OFFSET !== undefined) SYSTEM_TIME_OFFSET = parsed.SYSTEM_TIME_OFFSET;
            if (parsed.LOADED_MODULES) {
                LOADED_MODULES.length = 0;
                LOADED_MODULES.push(...parsed.LOADED_MODULES);
            }
            if (parsed.FILE_ATTRIBUTES) {
                // Merge or replace
                Object.assign(FILE_ATTRIBUTES, parsed.FILE_ATTRIBUTES);
            }
            if (parsed.MOUNTED_DEVICES) {
                // Clear default mounts and restore state
                for (const key in MOUNTED_DEVICES) delete MOUNTED_DEVICES[key];
                Object.assign(MOUNTED_DEVICES, parsed.MOUNTED_DEVICES);
            }
        } catch (e) {
            console.error('Failed to load Shell State', e);
        }
    }
    
    // Cycle 83: The Over-Mounted Directory Init
    // If not in VFS, create it (handles first run)
    if (!VFS['/mnt/secret']) {
        if (!VFS['/mnt']) {
             VFS['/mnt'] = { type: 'dir', children: [] };
             addChild('/', 'mnt');
        }
        VFS['/mnt/secret'] = { type: 'dir', children: ['dummy_data.tmp', 'cache_v2.db'] };
        addChild('/mnt', 'secret');
        VFS['/mnt/secret/dummy_data.tmp'] = { type: 'file', content: 'NON-CRITICAL DATA' };
        VFS['/mnt/secret/cache_v2.db'] = { type: 'file', content: 'BINARY_CACHE_BLOB' };
    }
    
    // Cycle 40 Init (Ensure surveillance log exists)
    if (!VFS['/var/log/surveillance.log']) {
        VFS['/var/log/surveillance.log'] = { type: 'file', content: '[VIDEO FEED 09:12] Subject 452 accessed secure terminal.\n[AUDIO LOG] "They will never find the key in the .cache folder."\n[METADATA] ENCRYPTED_V2' };
        const logDir = getNode('/var/log');
        if (logDir && logDir.type === 'dir' && !logDir.children.includes('surveillance.log')) {
            logDir.children.push('surveillance.log');
        }
    }

    // Cycle 72 Init (Sudoers Puzzle)
    if (!VFS['/opt/admin/restore_service.py']) {
        // Ensure /opt and /opt/admin exist
        if (!VFS['/opt']) {
             VFS['/opt'] = { type: 'dir', children: [] };
             addChild('/', 'opt');
        }
        if (!VFS['/opt/admin']) {
             VFS['/opt/admin'] = { type: 'dir', children: [] };
             addChild('/opt', 'admin');
        }
        
        VFS['/opt/admin/restore_service.py'] = { type: 'file', content: '#!/usr/bin/env python3\nimport sys\n# ADMIN AUTH CODE: "OMEGA-7-RED"\n\nif len(sys.argv) < 2:\n    print("Usage: restore_service.py <auth_code>")\n    sys.exit(1)\n\nif sys.argv[1] == "OMEGA-7-RED":\n    print("System Restoration Sequence Initiated...")\n    print("[SUCCESS] Services Restored.")\n    print("FLAG: GHOST_ROOT{SUD0_PR1V_3SC_SUCC3SS}")\nelse:\n    print("Access Denied.")' };
        addChild('/opt/admin', 'restore_service.py');
        
        // Ensure /etc/sudoers.d exists
        if (!VFS['/etc/sudoers.d']) {
             VFS['/etc/sudoers.d'] = { type: 'dir', children: [] };
             addChild('/etc', 'sudoers.d');
        }
        VFS['/etc/sudoers.d/readme'] = { type: 'file', content: 'User ghost has limited sudo privileges.\nRun "sudo -l" to see allowed commands.' };
        addChild('/etc/sudoers.d', 'readme');
    }

    // Cycle 82 Init (Runaway Process)
    if (!VFS['/usr/local/bin/bloat_guard']) {
        if (!VFS['/usr/local/bin']) {
             // Ensure path exists (simplified)
             // We assume /usr/local/bin exists or VFS handles it, but safer to check
        }
        VFS['/usr/local/bin/bloat_guard'] = { 
            type: 'file', 
            content: '#!/bin/bash\n# SYSTEM WATCHDOG - DO NOT STOP\nwhile true; do\n  ./sys_bloat --intense\n  echo "Restarting critical service..."\n  sleep 1\ndone' 
        };
        const binDir = getNode('/usr/local/bin');
        if (binDir && binDir.type === 'dir' && !binDir.children.includes('bloat_guard')) {
            binDir.children.push('bloat_guard');
        }
    }

    // Cycle 85 Init (Git History)
    if (!VFS['/home/ghost/repo']) {
        VFS['/home/ghost/repo'] = { type: 'dir', children: ['.git', 'config.js', 'README.md'] };
        const home = getNode('/home/ghost');
        if (home && home.type === 'dir' && !home.children.includes('repo')) {
            home.children.push('repo');
        }
        
        VFS['/home/ghost/repo/.git'] = { type: 'dir', children: ['config', 'HEAD'] };
        VFS['/home/ghost/repo/.git/config'] = { type: 'file', content: '[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n\tlogallrefupdates = true\n[remote "origin"]\n\turl = git@github.com:ghost/shadow-ops.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*' };
        VFS['/home/ghost/repo/.git/HEAD'] = { type: 'file', content: 'ref: refs/heads/main' };
        VFS['/home/ghost/repo/config.js'] = { type: 'file', content: 'const API_KEY = process.env.API_KEY;\nexport default { API_KEY };' };
        VFS['/home/ghost/repo/README.md'] = { type: 'file', content: '# Shadow Ops\n\nInternal tools for [REDACTED].' };
    }

    // Cycle 87 Init (SSL Handshake)
    if (!VFS['/etc/ssl/certs/omega.crt']) {
        if (!VFS['/etc/ssl']) {
             VFS['/etc/ssl'] = { type: 'dir', children: ['certs'] };
             addChild('/etc', 'ssl');
        } else if (!VFS['/etc/ssl/certs']) {
             VFS['/etc/ssl/certs'] = { type: 'dir', children: [] };
             addChild('/etc/ssl', 'certs');
        }
        
        VFS['/etc/ssl/certs/omega.crt'] = { type: 'file', content: '-----BEGIN CERTIFICATE-----\nMIIDqzCCApOgAwIBAgIJALItGlqfACNBMA0GCSqGSIb3DQEBCwUAMIGUMQswCQYD\nVQQGEwJKUDEOMAwGA1UECAwFVG9reW8xEDAOBgNVBAcMB1NoaWJ1eWExFjAUBgNV\nBAoMDVByb2plY3QgT21lZ2ExDzANBgNVBAsMBlNhdE9wczEeMBwGA1UEAwwVT21l\ng2FfU2VjdXJlX1Bhc3NfMjAyNjEfMB0GCSqGSIb3DQEJARYQYWRtaW5Ab21lZ2Eu\nbmV0MB4XDTI0MDEwMTAwMDAwMFoXDTI2MDIxMTIzNTk1OVowgZkxCzAJBgNVBAYT\nAkZSMQ4wDAYDVQQIDAVQYXJpczEOMAwGA1UEBwwFUGFyaXMxFjAUBgNVBAoMDVBy\nb2plY3QgT21lZ2ExDzANBgNVBAsMBlNhdE9wczEcMBoGA1UEAwwTKi5zYXRlbGxp\ndGUub21lZ2EubmV0MR8wHQYJKoZIhvcNAQkBFhBhZG1pbkBvbWVnYS5uZXQwggEi\nMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDDKxpcnyNBe...[ENCRYPTED]...=\n-----END CERTIFICATE-----' };
        addChild('/etc/ssl/certs', 'omega.crt');

        // Create the locked archive
        const zipPayload = 'PK_ENC_V1:{blueprint.txt:QkxVRVBSSU5UOiBPTUVHQV9TQVRfVjIKU1RBVFVTOiBDTEFTU0lGSUVECgpbU1BFQ1NdCi0gRnJlcXVlbmN5OiA0NS4yIEdIegotIEVuY3J5cHRpb246IEFFUy0yNTYtR0NNCi0gSGFuZHNoYWtlOiAiR2hvc3RfaW5fdGhlX1NoZWxsIgoKRkxBRzogR0hPU1RfUk9PVHtTU0xfQ2g0MW5fVjNyMWYxM2R9Cg==}';
        VFS['/home/ghost/secure_data.zip'] = { type: 'file', content: zipPayload };
        const home = getNode('/home/ghost');
        if (home && home.type === 'dir' && !home.children.includes('secure_data.zip')) {
            home.children.push('secure_data.zip');
        }
    }

    // Cycle 88 Init (The Kernel Parameters)
    if (!VFS['/proc/sys/net/ipv4/ip_forward']) {
        const ensureDir = (p: string) => { if (!VFS[p]) VFS[p] = { type: 'dir', children: [] }; };
        const link = (p: string, c: string) => { const n = getNode(p); if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c); };

        ensureDir('/proc'); ensureDir('/proc/sys'); ensureDir('/proc/sys/net'); ensureDir('/proc/sys/net/ipv4');
        link('/proc', 'sys'); link('/proc/sys', 'net'); link('/proc/sys/net', 'ipv4');

        VFS['/proc/sys/net/ipv4/ip_forward'] = {
            type: 'file',
            content: '0',
            permissions: '0644'
        };
        link('/proc/sys/net/ipv4', 'ip_forward');

        // Create Hint
        if (!VFS['/home/ghost/gateway_config.log']) {
            VFS['/home/ghost/gateway_config.log'] = {
                type: 'file',
                content: '[CONFIG] Interface eth0: 192.168.1.105\n[CONFIG] Gateway: 10.0.0.1 (Unreachable)\n[ERROR] Packet forwarding disabled by policy.\n[ACTION] Enable IP forwarding to reach internal subnet.'
            };
            const home = getNode('/home/ghost');
            if (home && home.type === 'dir' && !home.children.includes('gateway_config.log')) {
                home.children.push('gateway_config.log');
            }
        }
    }

    // Cycle 89 Init (The Orphaned Inode)
    if (!VFS['/lost+found']) {
        VFS['/lost+found'] = { type: 'dir', children: ['#8492'] };
        addChild('/', 'lost+found');
        
        VFS['/lost+found/#8492'] = {
            type: 'file',
            content: 'Recovered Journal Entry: [INODE 8492]\nStatus: DELETED\nUser: ghost_admin\nAction: KEY_BACKUP\nData: R0hPU1RfUk9PVHtMMFNUX0FORF9GMFVORF9SM0MwVjNSWX0=\n[END_OF_RECORD]' 
        };
    }

    // Cycle 90 Init (The Corrupted Binary)
    if (!VFS['/usr/bin/recover_tool']) {
        const ensureDir = (p: string) => { if (!VFS[p]) VFS[p] = { type: 'dir', children: [] }; };
        const link = (p: string, c: string) => { const n = getNode(p); if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c); };

        ensureDir('/usr'); ensureDir('/usr/bin');
        link('/usr', 'bin');

        VFS['/usr/bin/recover_tool'] = {
            type: 'file',
            content: '[BINARY_ELF_X86_64] [RECOVERY]\n\x00\x00\x00\x01\x02\n[ERROR] Corrupted Header\n\nstrings_table:\n--repair\n--force\n--key\n\n[SECRET_DATA_SECTION]\nFLAG_PART_1: GHOST_ROOT{\nFLAG_PART_2: STR1NGS_R_\nFLAG_PART_3: UR_FR13ND}\n[END_DATA]',
            permissions: '0755'
        };
        link('/usr/bin', 'recover_tool');
        
        // Create Hint
        if (!VFS['/home/ghost/recovery_log.txt']) {
            VFS['/home/ghost/recovery_log.txt'] = {
                type: 'file',
                content: '[SYSTEM_LOG] Critical failure detected in /usr/bin/recover_tool.\n[ACTION] Binary is corrupted. Execute to verify crash. Use analysis tools to recover embedded keys.\n'
            };
            const home = getNode('/home/ghost');
            if (home && home.type === 'dir' && !home.children.includes('recovery_log.txt')) {
                home.children.push('recovery_log.txt');
            }
        }
    }

    // Cycle 91 Init (The Missing Library)
    if (!VFS['/usr/bin/quantum_calc']) {
        const ensureDir = (p: string) => { if (!VFS[p]) VFS[p] = { type: 'dir', children: [] }; };
        const link = (p: string, c: string) => { const n = getNode(p); if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c); };

        ensureDir('/usr'); ensureDir('/usr/bin');
        link('/usr', 'bin');

        VFS['/usr/bin/quantum_calc'] = {
            type: 'file',
            content: '[BINARY_ELF_X86_64] [DYNAMIC_LINKED]\nNEEDED: libquantum.so.1',
            permissions: '0755'
        };
        link('/usr/bin', 'quantum_calc');

        // Create the missing library in a hidden location
        ensureDir('/opt'); ensureDir('/opt/libs');
        link('/', 'opt'); link('/opt', 'libs');

        VFS['/opt/libs/libquantum.so.1'] = {
            type: 'file',
            content: '[ELF_SHARED_OBJ] [QUANTUM_MATH_LIB]',
            permissions: '0644'
        };
        link('/opt/libs', 'libquantum.so.1');

        // Hint file
        if (!VFS['/home/ghost/error.log']) {
            VFS['/home/ghost/error.log'] = {
                type: 'file',
                content: '[ERROR] quantum_calc: error while loading shared libraries: libquantum.so.1: cannot open shared object file: No such file or directory\n[HINT] Use ldd to check dependencies. Locate the library and add its path to LD_LIBRARY_PATH.'
            };
            const home = getNode('/home/ghost');
            if (home && home.type === 'dir' && !home.children.includes('error.log')) {
                home.children.push('error.log');
            }
        }
    }

    // Cycle 93 Init (The Cron Job)
    if (!VFS['/etc/cron.d/malware']) {
        const ensureDir = (p: string) => { if (!VFS[p]) VFS[p] = { type: 'dir', children: [] }; };
        const link = (p: string, c: string) => { const n = getNode(p); if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c); };

        ensureDir('/etc'); ensureDir('/etc/cron.d');
        link('/', 'etc'); link('/etc', 'cron.d');

        VFS['/etc/cron.d/malware'] = {
            type: 'file',
            content: '* * * * * root /usr/bin/miner >> /dev/null\n# MALICIOUS JOB - DO NOT REMOVE',
            permissions: '0644'
        };
        link('/etc/cron.d', 'malware');

        // Hint file
        if (!VFS['/home/ghost/cpu_alert.log']) {
            VFS['/home/ghost/cpu_alert.log'] = {
                type: 'file',
                content: '[ALERT] High CPU usage detected (99%). Suspicious process spawned by CRON.\n[ACTION] Investigate /etc/cron.d for unauthorized jobs.'
            };
            const home = getNode('/home/ghost');
            if (home && home.type === 'dir' && !home.children.includes('cpu_alert.log')) {
                home.children.push('cpu_alert.log');
            }
        }
    }
};

// Helper to reset state
export const resetSystemState = () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(STORAGE_KEY_VFS);
    localStorage.removeItem(STORAGE_KEY_SHELL);
    
    // Reset VFS to initial
    for (const key in VFS) delete VFS[key];
    Object.assign(VFS, JSON.parse(JSON.stringify(initialVFS)));
    
    // Reset Shell variables (simplified, ideally we'd have initial consts for these too)
    ALERT_LEVEL = 0;
    SYSTEM_TIME_OFFSET = -824900000000;
    LOADED_MODULES.length = 0;
    // ENV_VARS and ALIASES could be reset if we stored their initial copies, 
    // but for now reloading the page after clearing localStorage is easiest.
    window.location.reload();
};

interface Job {
  id: number;
  command: string;
  status: 'Running' | 'Stopped' | 'Terminated';
  pid: number;
}

let JOBS: Job[] = [
  { id: 1, command: './decrypt_chimera --layer 4', status: 'Stopped', pid: 4192 }
];

interface Process {
  pid: number;
  ppid: number;
  user: string;
  cpu: number;
  mem: number;
  time: string;
  command: string;
  tty: string;
  stat: string;
}

let PROCESSES: Process[] = [
  { pid: 1, ppid: 0, user: 'root', cpu: 0.1, mem: 0.4, time: '12:34', command: '/sbin/init', tty: '?', stat: 'Ss' },
  { pid: 2, ppid: 0, user: 'root', cpu: 0.0, mem: 0.0, time: '0:00', command: '[kthreadd]', tty: '?', stat: 'S' },
  { pid: 404, ppid: 1, user: 'root', cpu: 0.0, mem: 0.8, time: '0:05', command: '/usr/sbin/sshd -D', tty: '?', stat: 'Ss' },
  { pid: 666, ppid: 1, user: 'root', cpu: 13.3, mem: 66.6, time: '66:66', command: '[spectre_kernel]', tty: '?', stat: 'R' },
  { pid: 1337, ppid: 1, user: 'ghost', cpu: 0.5, mem: 1.2, time: '0:01', command: '-bash', tty: 'pts/0', stat: 'Ss' },
  { pid: 2024, ppid: 1, user: 'root', cpu: 0.0, mem: 0.2, time: '0:02', command: '/usr/sbin/cron -f', tty: '?', stat: 'Ss' },
  { pid: 4444, ppid: 1, user: 'root', cpu: 85.0, mem: 40.0, time: '102:00', command: './xmrig --donate-level 1', tty: '?', stat: 'R' },
  { pid: 8888, ppid: 1, user: 'root', cpu: 1.5, mem: 2.1, time: '1:23', command: '/usr/bin/watcher --silent', tty: '?', stat: 'Sl' },
  { pid: 9999, ppid: 1337, user: 'unknown', cpu: 45.2, mem: 12.8, time: '9:59', command: './hydra -l admin -P pass.txt 192.168.1.99', tty: 'pts/1', stat: 'R+' },
  { pid: 31337, ppid: 1, user: 'root', cpu: 99.9, mem: 50.0, time: '23:59', command: '/usr/bin/watcher_d --lock', tty: '?', stat: 'Z' },
  { pid: 555, ppid: 1, user: 'ghost', cpu: 12.5, mem: 4.2, time: '2:15', command: './data_miner --silent', tty: '?', stat: 'R' },
  { pid: 4000, ppid: 1, user: 'root', cpu: 0.1, mem: 0.2, time: '1:00', command: '/usr/bin/vault_guardian', tty: '?', stat: 'Ss' },
  { pid: 4001, ppid: 4000, user: 'root', cpu: 0.0, mem: 0.0, time: '0:00', command: '[vault_worker] <defunct>', tty: '?', stat: 'Z' },
  { pid: 6000, ppid: 1, user: 'root', cpu: 0.5, mem: 1.0, time: '0:10', command: '/usr/bin/overseer', tty: '?', stat: 'Ss' },
  { pid: 8192, ppid: 1, user: 'root', cpu: 0.0, mem: 0.1, time: '0:00', command: '/usr/bin/keepalive_d', tty: '?', stat: 'Ss' },
  { pid: 1001, ppid: 1, user: 'root', cpu: 0.1, mem: 4.5, time: '12:00', command: '/usr/sbin/log_daemon', tty: '?', stat: 'Ss' },
  { pid: 4999, ppid: 1, user: 'root', cpu: 0.5, mem: 0.2, time: '0:05', command: '/bin/bash /usr/local/bin/bloat_guard', tty: '?', stat: 'Ss' },
  { pid: 5000, ppid: 4999, user: 'root', cpu: 99.8, mem: 12.0, time: '48:00', command: './sys_bloat --intense', tty: '?', stat: 'R' }
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

const MOUNTED_DEVICES: Record<string, string> = { '/dev/sdc1': '/mnt/data', '/dev/loop2': '/mnt/secret' };
const MOUNT_OPTIONS: Record<string, string> = { '/mnt/data': 'ro,nosuid,nodev' };


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

const COMMANDS = ['bluetoothctl', 'ls', 'cd', 'cat', 'pwd', 'help', 'clear', 'exit', 'ssh', 'whois', 'grep', 'decrypt', 'mkdir', 'touch', 'rm', 'nmap', 'ping', 'netstat', 'ss', 'nc', 'crack', 'analyze', 'man', 'scan', 'mail', 'history', 'dmesg', 'mount', 'umount', 'top', 'ps', 'kill', 'whoami', 'reboot', 'cp', 'mv', 'trace', 'traceroute', 'alias', 'su', 'sudo', 'shutdown', 'wall', 'chmod', 'env', 'printenv', 'export', 'monitor', 'locate', 'finger', 'curl', 'vi', 'vim', 'nano', 'ifconfig', 'crontab', 'wifi', 'iwconfig', 'telnet', 'apt', 'apt-get', 'hydra', 'camsnap', 'nslookup', 'dig', 'hexdump', 'xxd', 'uptime', 'w', 'zip', 'unzip', 'date', 'ntpdate', 'rdate', 'head', 'tail',     'strings', 'recover_tool', 'lsof', 'journal', 'journalctl', 'diff', 'wc', 'sort', 'uniq', 'steghide', 'find', 'neofetch', 'tree', 'weather', 'matrix', 'base64', 'rev', 'calc', 'systemctl', 'tar', 'ssh-keygen', 'awk', 'sed', 'radio', 'netmap', 'theme', 'sat', 'irc', 'tcpdump', 'sqlmap', 'tor', 'hashcat', 'gcc', 'make', './', 'iptables', 'dd', 'drone', 'cicada3301', 'python', 'python3', 'pip', 'wget', 'binwalk', 'exiftool', 'aircrack-ng', 'phone', 'call', 'geoip', 'volatility', 'gobuster', 'intercept', 'lsmod', 'insmod', 'rmmod', 'arp', 'lsblk', 'fdisk', 'passwd', 'useradd', 'medscan', 'biomon', 'status', 'route', 'md5sum', 'void_crypt', 'zcat', 'zgrep', 'gunzip', 'df', 'du', 'type', 'unalias', 'uplink_connect', 'secure_vault', 'jobs', 'fg', 'bg', 'recover_data', 'ghost_update', 'git', 'file', 'openssl', 'beacon', 'fsck', 'docker', 'lsattr', 'chattr', 'backup_service', 'getfattr', 'setfattr', 'mkfifo', 'uplink_service', 'sqlite3', 'gdb', 'jwt_tool', 'php', 'access_card', 'sys_monitor', 'ln', 'readlink', 'nginx', 'tac', 'getcap', 'sysctl', 'ldd', 'quantum_calc'];

export interface MissionStatus {
  objectives: {
    hasNet: boolean;
    hasScan: boolean;
    hasIntel: boolean;
    decryptCount: number;
    isRoot: boolean;
    hasBlackSite: boolean;
    hasHiddenVol: boolean;
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
  const hasHiddenVol = !!getNode('/var/run/hidden_vol_mounted');
  const hasLaunchReady = !!getNode('/var/run/launch_ready');

  let nextStep = 'Check manual pages (man) or list files (ls).';
  
  // Logic Flow: Net -> Scan -> Root -> BlackSite -> HiddenVol -> Payload -> Decrypt Keys -> Launch
  if (!hasNet) nextStep = 'Connect to a network. Try "wifi scan" then "wifi connect".';
  else if (!hasScan) nextStep = 'Scan the network for targets. Try "nmap 192.168.1.0/24" or "netmap".';
  else if (!isRoot) nextStep = 'Escalate privileges to root. Try "steghide extract" on evidence.jpg (check EXIF data/tor for password) or "hydra".';
  else if (!hasBlackSite) nextStep = 'Infiltrate the Black Site. Use "ssh -i <key> root@192.168.1.99". Key is hidden in steganography payload.';
  else if (!hasHiddenVol) nextStep = 'Investigate storage devices. Use "fdisk -l" to find partitions, then "mount" the hidden volume.';
  else if (!hasPayload) nextStep = 'Acquire the launch codes. Use "sat connect OMEG" to download from orbit.';
  else if (decryptCount < 3) nextStep = 'Decrypt "KEYS.enc" (found on Sat COSM). Password is the owner\'s name (check logs).';
  else if (!hasLaunchReady) nextStep = 'Decrypt "launch_codes.bin" using the key from KEYS.enc.';
  else nextStep = 'EXECUTE THE LAUNCH PROTOCOL. RUN "./launch_codes.bin".';

  const steps = [hasNet, hasScan, isRoot, hasBlackSite, hasHiddenVol, hasPayload, decryptCount >= 3, hasLaunchReady];
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
      hasHiddenVol,
      hasPayload,
      hasLaunchReady
    },
    progress,
    rank: `${rank} (Threat: ${threatLevel})`,
    nextStep
  };
};

export const tabCompletion = (cwd: string, inputBuffer: string): { matches: string[], completed: string } => {
  // If buffer is empty, don't show anything (or maybe show contents of CWD?)
  // Bash behavior: empty tab -> list CWD
  if (!inputBuffer) {
      const dirNode = getNode(cwd);
      if (dirNode && dirNode.type === 'dir') {
          return { matches: dirNode.children, completed: inputBuffer };
      }
      return { matches: [], completed: inputBuffer };
  }

  const parts = inputBuffer.split(' '); 
  const lastTokenIndex = parts.length - 1;
  const lastToken = parts[lastTokenIndex];

  // Command Completion (if first token)
  if (lastTokenIndex === 0 && !lastToken.includes('/')) {
    const matches = COMMANDS.filter(cmd => cmd.startsWith(lastToken));
    if (matches.length === 1) {
      return { matches, completed: matches[0] + ' ' }; 
    }
    // Ambiguous command match
    if (matches.length > 1) {
        // Find common prefix
        let commonPrefix = matches[0];
        for (let i = 1; i < matches.length; i++) {
            while (!matches[i].startsWith(commonPrefix)) {
                commonPrefix = commonPrefix.slice(0, -1);
            }
        }
        if (commonPrefix.length > lastToken.length) {
             return { matches, completed: commonPrefix };
        }
        return { matches, completed: inputBuffer }; 
    }
    // No matches, try file completion (e.g. ./script)
  }

  // File/Directory Completion
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
  
  if (candidates.length > 1) {
      // Find common prefix among candidates
      let commonPrefix = candidates[0];
      for (let i = 1; i < candidates.length; i++) {
          while (!candidates[i].startsWith(commonPrefix)) {
              commonPrefix = commonPrefix.slice(0, -1);
          }
      }
      
      // If common prefix is longer than what we typed, extend it
      if (commonPrefix.length > partialName.length) {
          parts[lastTokenIndex] = prefix + commonPrefix;
          return { matches: candidates, completed: parts.join(' ') };
      }
      
      // Otherwise just return candidates list
      return { matches: candidates, completed: inputBuffer };
  }
  
  return { matches: candidates, completed: inputBuffer };
};

export const processCommand = (cwd: string, commandLine: string, stdin?: string): CommandResult => {
  // Cycle 84: Restricted Shell Enforcer
  if (ENV_VARS['RESTRICTED_SHELL'] === '1') {
      const allowedCmds = ['ls', 'pwd', 'help', 'vi', 'vim', 'nano', 'exit', 'echo', 'clear', 'cat', 'history', 'whoami'];
      const cmd = commandLine.trim().split(/\s+/)[0];
      
      // Allow specific escape sequence inside vi (handled by UI, but here we trap command execution)
      // Actually, vi execution is handled below. We just need to allow 'vi' itself.
      
      if (commandLine.includes('/') || commandLine.includes('>') || commandLine.includes('|') || commandLine.includes('&')) {
          // Special exemption: vi commands might look like paths in args, but we block paths.
          // rbash blocks / in command NAME. Arguments with / are usually allowed in real rbash? 
          // No, rbash blocks / in command name. It allows / in args.
          // BUT, we want to prevent /bin/bash execution.
          // Let's strictly block / in the command string for now to be safe/annoying.
          return { output: `rbash: ${commandLine}: restricted: cannot specify '/' in command names`, newCwd: cwd };
      }
      if (!allowedCmds.includes(cmd)) {
          return { output: `rbash: ${cmd}: command not found`, newCwd: cwd };
      }
  }
  // Cycle 74 Init (The Deleted File Handle)
  if (!VFS['/usr/sbin/log_daemon']) {
      // Create binary
      VFS['/usr/sbin/log_daemon'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [DAEMON] [LOG_WRITER]',
          permissions: '0755'
      };
      // Ensure /usr/sbin exists
      const ensureDir = (p: string) => { if (!VFS[p]) VFS[p] = { type: 'dir', children: [] }; };
      const link = (p: string, c: string) => { const n = getNode(p); if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c); };
      ensureDir('/usr');
      ensureDir('/usr/sbin');
      link('/usr', 'sbin');
      link('/usr/sbin', 'log_daemon');
      
      // Create Hint
      if (!VFS['/home/ghost/alert_disk_space.txt']) {
          VFS['/home/ghost/alert_disk_space.txt'] = {
              type: 'file',
              content: '[ALERT] Disk usage critical on /var.\n[SYSTEM] Writes failed: No space left on device.\n[ACTION] Investigate space usage (df -h) and open files (lsof).\n'
          };
          const home = getNode('/home/ghost');
          if (home && home.type === 'dir' && !home.children.includes('alert_disk_space.txt')) {
              home.children.push('alert_disk_space.txt');
          }
      }
      
      // Marker for constraint
      VFS['/var/log/overflow.dmp'] = { type: 'file', content: 'MARKER_FOR_DISK_FULL' }; 
  }

  // Cycle 75 Init (The Immutable Attribute)
  if (!VFS['/etc/security/lockdown.conf']) {
      // Create config file
      const ensureDir = (p: string) => { if (!VFS[p]) VFS[p] = { type: 'dir', children: [] }; };
      const link = (p: string, c: string) => { const n = getNode(p); if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c); };
      ensureDir('/etc');
      ensureDir('/etc/security');
      link('/etc', 'security');

      VFS['/etc/security/lockdown.conf'] = {
          type: 'file',
          content: 'LOCKDOWN_MODE=STRICT\nROOT_ACCESS=DENIED\n# To lift lockdown, delete this file.\n',
          permissions: '0644'
      };
      link('/etc/security', 'lockdown.conf');
      
      // Set Immutable Attribute
      FILE_ATTRIBUTES['/etc/security/lockdown.conf'] = ['i'];

      // Create Hint
      if (!VFS['/home/ghost/security_memo.txt']) {
          VFS['/home/ghost/security_memo.txt'] = {
              type: 'file',
              content: 'From: SysAdmin\nTo: Staff\nSubject: Lockdown Mode\n\nDue to recent intrusions, I have enabled strict lockdown mode.\nI made the config file immutable so no script kiddies can delete it.\n\n- Admin'
          };
          const home = getNode('/home/ghost');
          if (home && home.type === 'dir' && !home.children.includes('security_memo.txt')) {
              home.children.push('security_memo.txt');
          }
      }
  }
  
  // Clean up marker if puzzle solved
  if (VFS['/var/run/disk_solved'] && VFS['/var/log/overflow.dmp']) {
      delete VFS['/var/log/overflow.dmp'];
  }

  // Fix: Ensure .ssh is visible in home directory if it exists (Fixes localStorage persistence issue)
  const ghostHome = getNode('/home/ghost');
  if (ghostHome && ghostHome.type === 'dir' && !ghostHome.children.includes('.ssh')) {
      if (VFS['/home/ghost/.ssh']) {
          ghostHome.children.push('.ssh');
          // Force save to persist the fix
          saveSystemState();
      }
  }

  // Cycle 77 Init (The Kubernetes Config)
  if (!VFS['/home/ghost/.kube/config']) {
      // Create .kube dir
      const ensureDir = (p: string) => { if (!VFS[p]) VFS[p] = { type: 'dir', children: [] }; };
      const link = (p: string, c: string) => { const n = getNode(p); if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c); };
      
      ensureDir('/home/ghost/.kube');
      link('/home/ghost', '.kube');
      
      VFS['/home/ghost/.kube/config'] = {
          type: 'file',
          content: 'apiVersion: v1\nclusters:\n- cluster:\n    server: https://10.96.0.1\n    certificate-authority-data: REDACTED\n  name: ghost-cluster\ncontexts:\n- context:\n    cluster: ghost-cluster\n    user: ghost-admin\n  name: ghost-admin@ghost-cluster\ncurrent-context: ghost-admin@ghost-cluster\nusers:\n- name: ghost-admin\n  user:\n    token: GH0ST-KUBE-T0K3N-V1',
          permissions: '0600'
      };
      link('/home/ghost/.kube', 'config');
  }

  // Cycle 81 Init (Kernel Module)
  if (!VFS['/lib/modules/5.4.0-ghost/kernel/drivers/misc/blackbox.ko']) {
      const ensureDir = (p: string) => { if (!VFS[p]) VFS[p] = { type: 'dir', children: [] }; };
      const link = (p: string, c: string) => { const n = getNode(p); if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c); };
      
      ensureDir('/lib'); ensureDir('/lib/modules'); ensureDir('/lib/modules/5.4.0-ghost');
      ensureDir('/lib/modules/5.4.0-ghost/kernel'); ensureDir('/lib/modules/5.4.0-ghost/kernel/drivers');
      ensureDir('/lib/modules/5.4.0-ghost/kernel/drivers/misc');
      
      link('/', 'lib'); link('/lib', 'modules'); link('/lib/modules', '5.4.0-ghost');
      link('/lib/modules/5.4.0-ghost', 'kernel'); link('/lib/modules/5.4.0-ghost/kernel', 'drivers');
      link('/lib/modules/5.4.0-ghost/kernel/drivers', 'misc');
      
      VFS['/lib/modules/5.4.0-ghost/kernel/drivers/misc/blackbox.ko'] = {
          type: 'file',
          content: '[KERNEL_MODULE_V1]\nfilename:       /lib/modules/5.4.0-ghost/kernel/drivers/misc/blackbox.ko\nlicense:        GPL\ndescription:    Black Box Interface Driver\nauthor:         Unknown\nsrcversion:     B49382098402\ndepends:        \nretpoline:      Y\nname:           blackbox\nvermagic:       5.4.0-ghost SMP mod_unload ',
          permissions: '0644'
      };
      link('/lib/modules/5.4.0-ghost/kernel/drivers/misc', 'blackbox.ko');
  }

  // Cycle 82 Init (The ARP Spoof)
  if (!VFS['/proc/net/arp']) {
      // Ensure /proc/net exists
      const ensureDir = (p: string) => { if (!VFS[p]) VFS[p] = { type: 'dir', children: [] }; };
      const link = (p: string, c: string) => { const n = getNode(p); if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c); };
      
      ensureDir('/proc');
      ensureDir('/proc/net');
      link('/proc', 'net');

      VFS['/proc/net/arp'] = {
          type: 'file',
          content: 'IP address       HW type     Flags       HW address            Mask     Device\\n192.168.1.1      0x1         0x2         00:50:56:c0:00:01     *        eth0\\n192.168.1.5      0x1         0x2         00:50:56:c0:00:05     *        eth0\\n192.168.1.110    0x1         0x2         de:ad:be:ef:13:37     *        eth0',
          permissions: '0444'
      };
      link('/proc/net', 'arp');
      
      // Create Hint
      if (!VFS['/home/ghost/network_anomaly.log']) {
          VFS['/home/ghost/network_anomaly.log'] = {
              type: 'file',
              content: '[ALERT] Rogue device detected on local subnet.\\n[ACTION] Check ARP table for unauthorized MAC addresses.\\n[TARGET] Identify and neutralize.'
          };
          const home = getNode('/home/ghost');
          if (home && home.type === 'dir' && !home.children.includes('network_anomaly.log')) {
              home.children.push('network_anomaly.log');
          }
      }
  }

  // Cycle 40 Init (Self-Healing)
  if (!VFS['/var/log/surveillance.log']) {
      VFS['/var/log/surveillance.log'] = { type: 'file', content: '[VIDEO FEED 09:12] Subject 452 accessed secure terminal.\n[AUDIO LOG] "They will never find the key in the .cache folder."\n[METADATA] ENCRYPTED_V2' };
      const logDir = getNode('/var/log');
      if (logDir && logDir.type === 'dir' && !logDir.children.includes('surveillance.log')) {
          logDir.children.push('surveillance.log');
      }
      // Ensure attribute is set
      if (!FILE_ATTRIBUTES['/var/log/surveillance.log']) {
          FILE_ATTRIBUTES['/var/log/surveillance.log'] = ['i'];
      }
  }

  // Cycle 41 Init (Compilation Puzzle)
  if (!VFS['/home/ghost/tools/exploit.c']) {
      // Create tools dir if missing
      if (!VFS['/home/ghost/tools']) {
          VFS['/home/ghost/tools'] = { type: 'dir', children: [] };
          const homeGhost = getNode('/home/ghost');
          if (homeGhost && homeGhost.type === 'dir' && !homeGhost.children.includes('tools')) {
              homeGhost.children.push('tools');
          }
      }
      
      // Create exploit.c
      VFS['/home/ghost/tools/exploit.c'] = { 
          type: 'file', 
          content: '#include <stdio.h>\n#include "libbreaker.h"\n\nint main() {\n    printf("Targeting System...\\n");\n    breaker_exploit();\n    return 0;\n}' 
      };
      const toolsDir = getNode('/home/ghost/tools');
      if (toolsDir && toolsDir.type === 'dir' && !toolsDir.children.includes('exploit.c')) {
          toolsDir.children.push('exploit.c');
      }

      // Create hidden header file
      if (!VFS['/usr/src']) VFS['/usr/src'] = { type: 'dir', children: ['legacy'] };
      if (!VFS['/usr/src/legacy']) VFS['/usr/src/legacy'] = { type: 'dir', children: ['libbreaker.h'] };
      VFS['/usr/src/legacy/libbreaker.h'] = {
          type: 'file',
          content: '#ifndef LIBBREAKER_H\n#define LIBBREAKER_H\n\nvoid breaker_exploit() {\n    // PROPRIETARY ALGORITHM\n}\n\n#endif'
      };
      // Ensure /usr exists and has src
      const usrNode = getNode('/usr');
      if (usrNode && usrNode.type === 'dir') {
          if (!usrNode.children.includes('src')) usrNode.children.push('src');
      }
  }

  // Cycle 42 Init (Respawning Service)
  if (!VFS['/etc/systemd/system/overseer.service']) {
      // Create service file
      if (!VFS['/etc/systemd/system']) {
          // Ensure path exists
          VFS['/etc/systemd/system'] = { type: 'dir', children: [] };
          const etc = getNode('/etc');
          if (etc && etc.type === 'dir' && !etc.children.includes('systemd')) etc.children.push('systemd');
          const sysd = getNode('/etc/systemd');
          if (sysd && sysd.type === 'dir' && !sysd.children.includes('system')) sysd.children.push('system');
      }
      VFS['/etc/systemd/system/overseer.service'] = {
          type: 'file',
          content: '[Unit]\nDescription=Overseer Monitoring Service\nConditionPathExists=/var/lock/overseer.lock\n\n[Service]\nExecStart=/usr/bin/overseer\nRestart=always\nRestartSec=1s'
      };
      const sysDir = getNode('/etc/systemd/system');
      if (sysDir && sysDir.type === 'dir' && !sysDir.children.includes('overseer.service')) sysDir.children.push('overseer.service');
      
      // Create binary
      VFS['/usr/bin/overseer'] = { type: 'file', content: '[BINARY_ELF_X86_64]' };
      const binDir = getNode('/usr/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('overseer')) binDir.children.push('overseer');
      
      // Create Lock File
      VFS['/var/lock/overseer.lock'] = { type: 'file', content: '6000' };
      const lockDir = getNode('/var/lock');
      if (lockDir && lockDir.type === 'dir' && !lockDir.children.includes('overseer.lock')) {
          lockDir.children.push('overseer.lock');
      }
  }

  // Cycle 43 Init (Packet Sniffer)
  if (!VFS['/home/ghost/evidence']) {
      VFS['/home/ghost/evidence'] = { type: 'dir', children: [] };
      const home = getNode('/home/ghost');
      if (home && home.type === 'dir' && !home.children.includes('evidence')) {
          home.children.push('evidence');
      }
  }
  if (!VFS['/home/ghost/evidence/capture.pcap']) {
      VFS['/home/ghost/evidence/capture.pcap'] = { 
          type: 'file', 
          content: 'PCAP_V1:[HEADER]...[PACKET_001]...[PACKET_999]...[PAYLOAD: GHOST_ROOT{P4CK3T_M4ST3R} (Port 4444)]...' 
      };
      const evDir = getNode('/home/ghost/evidence');
      if (evDir && evDir.type === 'dir' && !evDir.children.includes('capture.pcap')) {
          evDir.children.push('capture.pcap');
      }
  }

  // Cycle 44 Init (Git Stash)
  if (!VFS['/home/ghost/dev']) {
      VFS['/home/ghost/dev'] = { type: 'dir', children: [] };
      const home = getNode('/home/ghost');
      if (home && home.type === 'dir' && !home.children.includes('dev')) {
          home.children.push('dev');
      }
  }
  // Simulate .git directory
  if (!VFS['/home/ghost/dev/.git']) {
      VFS['/home/ghost/dev/.git'] = { type: 'dir', children: ['refs', 'HEAD', 'config'] };
      const dev = getNode('/home/ghost/dev');
      if (dev && dev.type === 'dir' && !dev.children.includes('.git')) {
          dev.children.push('.git');
      }
      VFS['/home/ghost/dev/README.md'] = { type: 'file', content: '# Project Chimera\nAuthentication Module v2.0\n[STATUS] In Development.' };
      if (dev && dev.type === 'dir' && !dev.children.includes('README.md')) dev.children.push('README.md');
      
      // Simulate stash logic via hidden file state
      VFS['/home/ghost/dev/.git/stash'] = { 
          type: 'file', 
          content: 'stash@{0}: WIP on main: 4b3d123 Added auth bypass' 
      };
  }

  // Cycle 45 Init (Setuid Binary)
  if (!VFS['/home/ghost/tools/escalate']) {
      // Create tools dir if missing
      if (!VFS['/home/ghost/tools']) {
          VFS['/home/ghost/tools'] = { type: 'dir', children: [] };
          const homeGhost = getNode('/home/ghost');
          if (homeGhost && homeGhost.type === 'dir' && !homeGhost.children.includes('tools')) {
              homeGhost.children.push('tools');
          }
      }
      
      VFS['/home/ghost/tools/escalate'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [ROOT_ONLY] [SUID_CHECK_REQUIRED]'
      };
      // Explicitly set permissions to 0755 (no SUID) initially
      (VFS['/home/ghost/tools/escalate'] as any).permissions = '0755';

      const toolsDir = getNode('/home/ghost/tools');
      if (toolsDir && toolsDir.type === 'dir' && !toolsDir.children.includes('escalate')) {
          toolsDir.children.push('escalate');
      }
  }

  // Cycle 46 Init (SSL Certificate Expiry)
  if (!VFS['/etc/ssl/private/satellite.key']) {
      // Create dirs
      if (!VFS['/etc/ssl']) {
          VFS['/etc/ssl'] = { type: 'dir', children: ['private', 'certs'] };
          const etc = getNode('/etc');
          if (etc && etc.type === 'dir' && !etc.children.includes('ssl')) etc.children.push('ssl');
      }
      if (!VFS['/etc/ssl/private']) VFS['/etc/ssl/private'] = { type: 'dir', children: [] };
      if (!VFS['/etc/ssl/certs']) VFS['/etc/ssl/certs'] = { type: 'dir', children: [] };

      // Create Key
      VFS['/etc/ssl/private/satellite.key'] = { 
          type: 'file', 
          content: '-----BEGIN RSA PRIVATE KEY-----\nKEY_ID: OMEGA_SAT_LINK\n-----END RSA PRIVATE KEY-----' 
      };
      (VFS['/etc/ssl/private/satellite.key'] as any).permissions = '0600';
      const privDir = getNode('/etc/ssl/private');
      if (privDir && privDir.type === 'dir' && !privDir.children.includes('satellite.key')) privDir.children.push('satellite.key');

      // Create Expired Cert
      VFS['/etc/ssl/certs/satellite.crt'] = { 
          type: 'file', 
          content: '[CERT] ISSUER: OMEGA | EXPIRY: 1999-12-31 | [EXPIRED]' 
      };
      const certsDir = getNode('/etc/ssl/certs');
      if (certsDir && certsDir.type === 'dir' && !certsDir.children.includes('satellite.crt')) certsDir.children.push('satellite.crt');
  }

  // Cycle 47 Init (Docker Escape)
  if (!VFS['/root/shadow_config.yml']) {
      // Ensure /root exists
      if (!VFS['/root']) {
          VFS['/root'] = { type: 'dir', children: [] };
          // Set restricted permissions
          if (typeof window !== 'undefined') (VFS['/root'] as any).permissions = '0700'; 
          else (VFS['/root'] as any).permissions = '0700';
      }
      // Create the target file
      VFS['/root/shadow_config.yml'] = {
          type: 'file',
          content: 'SYSTEM_CONFIG_V2:\n  AUTH_BYPASS: DISABLED\n  ROOT_KEY: GHOST_ROOT{D0CK3R_PR1V_ESC}\n  DOOMSDAY_TIMER: ACTIVE'
      };
      const rootDir = getNode('/root');
      if (rootDir && rootDir.type === 'dir' && !rootDir.children.includes('shadow_config.yml')) {
          rootDir.children.push('shadow_config.yml');
      }
      // Ensure permissions on the file
      (VFS['/root/shadow_config.yml'] as any).permissions = '0600';
  }

  // Cycle 48 Init (Shared Library Hijack)
  if (!VFS['/opt/secret_libs/libcrypto.so.3']) {
      // Create /opt/secret_libs
      if (!VFS['/opt']) {
          VFS['/opt'] = { type: 'dir', children: ['secret_libs'] };
          const root = getNode('/');
          if (root && root.type === 'dir' && !root.children.includes('opt')) root.children.push('opt');
      } else {
          const opt = getNode('/opt');
          if (opt && opt.type === 'dir' && !opt.children.includes('secret_libs')) opt.children.push('secret_libs');
      }
      if (!VFS['/opt/secret_libs']) VFS['/opt/secret_libs'] = { type: 'dir', children: [] };

      // Create Library
      VFS['/opt/secret_libs/libcrypto.so.3'] = { type: 'file', content: '[ELF_SHARED_OBJ_V3]' };
      const libDir = getNode('/opt/secret_libs');
      if (libDir && libDir.type === 'dir' && !libDir.children.includes('libcrypto.so.3')) {
          libDir.children.push('libcrypto.so.3');
      }

      // Create Binary
      VFS['/usr/local/bin/decipher_v2'] = { 
          type: 'file', 
          content: '[BINARY_ELF_X86_64]\nDEPENDENCIES: libcrypto.so.3\nRPATH: $ORIGIN/../lib' 
      };
      const binDir = getNode('/usr/local/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('decipher_v2')) {
          binDir.children.push('decipher_v2');
      }
  }

  // Cycle 49 Init (Tar Wildcard Injection)
  if (!VFS['/usr/local/bin/backup_service']) {
      // Create backup directory
      if (!VFS['/var/backups']) {
          VFS['/var/backups'] = { type: 'dir', children: ['incoming'] };
          const varNode = getNode('/var');
          if (varNode && varNode.type === 'dir' && !varNode.children.includes('backups')) {
              varNode.children.push('backups');
          }
      }
      if (!VFS['/var/backups/incoming']) {
          VFS['/var/backups/incoming'] = { type: 'dir', children: ['README.md'] };
      }
      
      VFS['/var/backups/incoming/README.md'] = {
          type: 'file',
          content: 'BACKUP PROTOCOL V3\n------------------\nWARNING: All files in this directory are archived every minute.\nCOMMAND: cd /var/backups/incoming && tar -cf /dev/null *'
      };

      // Create Binary
      VFS['/usr/local/bin/backup_service'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [ROOT_SUID]'
      };
      // Type casting for permissions
      (VFS['/usr/local/bin/backup_service'] as any).permissions = '4755'; 

      const binDir = getNode('/usr/local/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('backup_service')) {
          binDir.children.push('backup_service');
      }

      // Create Flag
      VFS['/root/wildcard_flag.txt'] = {
          type: 'file',
          content: 'GHOST_ROOT{W1LDC4RD_1NJ3CT10N_M4ST3R}'
      };
      (VFS['/root/wildcard_flag.txt'] as any).permissions = '0600';
      const rootDir = getNode('/root');
      if (rootDir && rootDir.type === 'dir' && !rootDir.children.includes('wildcard_flag.txt')) {
          rootDir.children.push('wildcard_flag.txt');
      }
  }

  // Cycle 50 Init (Buffer Overflow)
  if (!VFS['/usr/bin/auth_daemon']) {
      // Create binary
      VFS['/usr/bin/auth_daemon'] = {
          type: 'file',
          content: '[BINARY_ELF_I386] [LEGACY_MODE] [VULNERABLE]'
      };
      (VFS['/usr/bin/auth_daemon'] as any).permissions = '0755';
      const binDir = getNode('/usr/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('auth_daemon')) {
          binDir.children.push('auth_daemon');
      }

      // Create Source Code
      if (!VFS['/usr/src/legacy']) {
          // ensure /usr/src exists
           const usr = getNode('/usr');
           if (usr && usr.type === 'dir' && !usr.children.includes('src')) {
               usr.children.push('src');
               if (!VFS['/usr/src']) VFS['/usr/src'] = { type: 'dir', children: [] };
           }
           
           if (!VFS['/usr/src/legacy']) VFS['/usr/src/legacy'] = { type: 'dir', children: [] };
           const src = getNode('/usr/src');
           if (src && src.type === 'dir' && !src.children.includes('legacy')) src.children.push('legacy');
      }
      
      VFS['/usr/src/legacy/auth_daemon.c'] = {
          type: 'file',
          content: `#include <stdio.h>
#include <string.h>

// LEGACY AUTHENTICATION MODULE (v1.0 - 1999)
// DO NOT MODIFY WITHOUT AUTHORIZATION

int main(int argc, char* argv[]) {
    int admin_flag = 0;
    char buffer[16];

    printf("Enter password: ");
    gets(buffer); // TODO: Replace with fgets

    if (admin_flag != 0) {
        printf("Access Granted! Flag: [REDACTED]\\n");
        system("/bin/sh");
    } else {
        printf("Access Denied.\\n");
    }
    return 0;
}`
      };
      const legDir = getNode('/usr/src/legacy');
      if (legDir && legDir.type === 'dir' && !legDir.children.includes('auth_daemon.c')) {
          legDir.children.push('auth_daemon.c');
      }
  }

  // Cycle 51 Init (Kernel Module)
  if (!VFS['/lib/modules/3.14.15/kernel/drivers/misc/backdoor.ko']) {
      // Ensure /lib/modules path structure
      const ensureDir = (p: string) => {
          if (!VFS[p]) VFS[p] = { type: 'dir', children: [] };
      };
      ensureDir('/lib');
      ensureDir('/lib/modules');
      ensureDir('/lib/modules/3.14.15');
      ensureDir('/lib/modules/3.14.15/kernel');
      ensureDir('/lib/modules/3.14.15/kernel/drivers');
      ensureDir('/lib/modules/3.14.15/kernel/drivers/misc');

      // Link directories
      const link = (p: string, c: string) => {
          const n = getNode(p);
          if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c);
      };
      link('/', 'lib');
      link('/lib', 'modules');
      link('/lib/modules', '3.14.15');
      link('/lib/modules/3.14.15', 'kernel');
      link('/lib/modules/3.14.15/kernel', 'drivers');
      link('/lib/modules/3.14.15/kernel/drivers', 'misc');

      // Create Module
      VFS['/lib/modules/3.14.15/kernel/drivers/misc/backdoor.ko'] = {
          type: 'file',
          content: '[ELF_LKM_X86_64] [HIDDEN_MODULE] AUTHOR: GHOST_ROOT'
      };
      link('/lib/modules/3.14.15/kernel/drivers/misc', 'backdoor.ko');
      
      // Ensure /proc exists
      ensureDir('/proc');
      link('/', 'proc');
  }

  // Cycle 52 Init (Alternate Data Stream / xattr)
  if (!VFS['/home/ghost/evidence/ntfs_stream.dat']) {
      // Create evidence dir if missing
      if (!VFS['/home/ghost/evidence']) {
          VFS['/home/ghost/evidence'] = { type: 'dir', children: [] };
          const home = getNode('/home/ghost');
          if (home && home.type === 'dir' && !home.children.includes('evidence')) {
              home.children.push('evidence');
          }
      }

      VFS['/home/ghost/evidence/ntfs_stream.dat'] = {
          type: 'file',
          content: '[DATA_FILE]\nStandard content visible to user.\nNothing to see here.\n',
          permissions: '0644',
          xattrs: {
              'user.secret_stream': 'GHOST_ROOT{ALT_D4T4_STR34M_FOUND}',
              'user.author': 'SysAdmin',
              'security.selinux': 'unconfined_u:object_r:user_home_t:s0'
          }
      };
      
      const evDir = getNode('/home/ghost/evidence');
      if (evDir && evDir.type === 'dir' && !evDir.children.includes('ntfs_stream.dat')) {
          evDir.children.push('ntfs_stream.dat');
      }
  }

  // Cycle 53 Init (Signal Handler)
  if (!VFS['/usr/bin/keepalive_d']) {
      // Create binary
      VFS['/usr/bin/keepalive_d'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [DAEMON] [SIGNAL_HANDLER]\nstrings: SIGUSR1_RECEIVED... Dumping state to /var/log/keepalive.dump\n'
      };
      (VFS['/usr/bin/keepalive_d'] as any).permissions = '0755';
      const binDir = getNode('/usr/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('keepalive_d')) {
          binDir.children.push('keepalive_d');
      }
  }

  // Cycle 54 Init (The Named Pipe)
  if (!VFS['/usr/bin/uplink_service']) {
      // Create binary
      VFS['/usr/bin/uplink_service'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [SERVICE] [FIFO_READER]\nstrings: /tmp/uplink.pipe\n[STATUS] Waiting for data stream...'
      };
      (VFS['/usr/bin/uplink_service'] as any).permissions = '0755';
      const binDir = getNode('/usr/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('uplink_service')) {
          binDir.children.push('uplink_service');
      }
  }

  // Cycle 55 Init (The Unreachable Network)
  if (!VFS['/var/log/network.log']) {
      VFS['/var/log/network.log'] = {
          type: 'file',
          content: '[NETWORK] Interface eth0 up.\n[NETWORK] DHCP Lease Acquired: 192.168.1.105\n[ERROR] Failed to add route to 10.10.99.0/24 (Black Site Uplink). Gateway 192.168.1.1 unreachable.\n[HINT] Manually add route via "route add".'
      };
      const logDir = getNode('/var/log');
      if (logDir && logDir.type === 'dir' && !logDir.children.includes('network.log')) {
          logDir.children.push('network.log');
      }
  }

  // Cycle 56 Init (The DNS Spoof)
  if (!VFS['/etc/hosts']) {
      // Ensure /etc exists
      if (!VFS['/etc']) {
          VFS['/etc'] = { type: 'dir', children: [] };
          const root = getNode('/');
          if (root && root.type === 'dir' && !root.children.includes('etc')) root.children.push('etc');
      }
      
      VFS['/etc/hosts'] = {
          type: 'file',
          content: '127.0.0.1\tlocalhost\n::1\t\tlocalhost ip6-localhost ip6-loopback\n'
      };
      (VFS['/etc/hosts'] as any).permissions = '0644';
      
      const etcDir = getNode('/etc');
      if (etcDir && etcDir.type === 'dir' && !etcDir.children.includes('hosts')) {
          etcDir.children.push('hosts');
      }
      
      // Add a hint file
      if (!VFS['/home/ghost/network_config.txt']) {
          VFS['/home/ghost/network_config.txt'] = {
              type: 'file',
              content: 'TARGET: omega-control.net\nIP_ADDRESS: 192.168.1.99\nACTION: Override DNS for local access.\nMETHOD: /etc/hosts modification required.'
          };
          const home = getNode('/home/ghost');
          if (home && home.type === 'dir' && !home.children.includes('network_config.txt')) {
              home.children.push('network_config.txt');
          }
      }
  }

  // Cycle 57 Init (The Hidden Archive / Wav Steganography)
  if (!VFS['/home/ghost/evidence/transmission.wav']) {
      // Ensure /home/ghost/evidence exists
      if (!VFS['/home/ghost/evidence']) {
          VFS['/home/ghost/evidence'] = { type: 'dir', children: [] };
          const home = getNode('/home/ghost');
          if (home && home.type === 'dir' && !home.children.includes('evidence')) {
              home.children.push('evidence');
          }
      }
      
      VFS['/home/ghost/evidence/transmission.wav'] = {
          type: 'file',
          content: '[RIFF_WAVE_HEADER] [AUDIO_DATA_ENCRYPTED] [STEGO_CONTAINER_DETECTED]',
          permissions: '0644'
      };
      
      const evDir = getNode('/home/ghost/evidence');
      if (evDir && evDir.type === 'dir' && !evDir.children.includes('transmission.wav')) {
          evDir.children.push('transmission.wav');
      }
  }

  // Cycle 58 Init (The Kernel Panic)
  if (!VFS['/var/crash']) {
      VFS['/var/crash'] = { type: 'dir', children: ['vmcore.1'] };
      const varDir = getNode('/var');
      if (varDir && varDir.type === 'dir' && !varDir.children.includes('crash')) {
          varDir.children.push('crash');
      }
      VFS['/var/crash/vmcore.1'] = {
          type: 'file',
          content: '[KERNEL_PANIC] PID: 1 (init) | RIP: 0010:panic+0x123/0x456\n[CAUSE] Null pointer dereference in module "phantom_driver.ko"\n[DEBUG] Remove offending module via "rmmod phantom_driver" to restore system stability.'
      };
  }

  // Cycle 59 Init (The Corrupt Database)
  if (!VFS['/var/lib/sqlite3']) {
      VFS['/var/lib/sqlite3'] = { type: 'dir', children: ['users.db'] };
      const libDir = getNode('/var/lib');
      if (libDir && libDir.type === 'dir' && !libDir.children.includes('sqlite3')) {
          libDir.children.push('sqlite3');
      }
      VFS['/var/lib/sqlite3/users.db'] = {
          type: 'file',
          content: 'SQLite format 3\x00\x04\x00\x01\x01\x00@  \x00\x00\x00\x05\x00\x00\x00\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\ntableusersusers\x02CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT)',
          permissions: '0644'
      };
      
      // Create binary
      VFS['/usr/bin/sqlite3'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [SQL_CLIENT]',
          permissions: '0755'
      };
      const binDir = getNode('/usr/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('sqlite3')) {
          binDir.children.push('sqlite3');
      }
  }

  // Cycle 60 Init (The Memory Dump)
  if (!VFS['/home/ghost/core.1337']) {
      VFS['/home/ghost/core.1337'] = {
          type: 'file',
          content: '[ELF_CORE_DUMP] [PROGRAM: auth_service] [PID: 1337]\n...MEMORY_BLOCK_START...\n0x08048000: 55 89 e5 57 56 53 83 ec 1c 8b 45 08 8b 5d 0c 8b\n0x08048010: 75 10 89 44 24 04 89 1c 24 e8 00 00 00 00 83 c4\n...HEAP_SEGMENT...\n0x08049000: 70 61 73 73 77 6f 72 64 3d 73 75 70 65 72 73 65\n0x08049010: 63 72 65 74 6b 65 79 31 32 33 00 00 00 00 00 00\n...STACK_TRACE...\n#0  0x0804801a in authenticate () at auth.c:42\n',
          permissions: '0600'
      };
      const home = getNode('/home/ghost');
      if (home && home.type === 'dir' && !home.children.includes('core.1337')) {
          home.children.push('core.1337');
      }
      
      // Create gdb binary
      VFS['/usr/bin/gdb'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [DEBUGGER]',
          permissions: '0755'
      };
      const binDir = getNode('/usr/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('gdb')) {
          binDir.children.push('gdb');
      }
  }

  // Cycle 61 Init (Python Bytecode)
  if (!VFS['/home/ghost/tools/auth.pyc']) {
      // Ensure tools dir exists
      if (!VFS['/home/ghost/tools']) {
          VFS['/home/ghost/tools'] = { type: 'dir', children: [] };
          const homeGhost = getNode('/home/ghost');
          if (homeGhost && homeGhost.type === 'dir' && !homeGhost.children.includes('tools')) {
              homeGhost.children.push('tools');
          }
      }

      VFS['/home/ghost/tools/auth.pyc'] = {
          type: 'file',
          content: '\x03\xf3\x0d\x0a\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00@\x00\x00\x00s\x1a\x00\x00\x00d\x00d\x01l\x00Z\x00e\x00\x01\x00d\x02S\x00)\x03N\xda\x04hash\xda\x0fGHOST_ROOT{PYTH0N_BYT3C0D3_S3CR3T}\xda\x08password_check\xa9\x00r\x02\x00\x00\x00r\x02\x00\x00\x00\xfa\x07auth.py\xda\x08<module>\x01\x00\x00\x00s\x00\x00\x00\x00',
          permissions: '0644'
      };
      const toolsDir = getNode('/home/ghost/tools');
      if (toolsDir && toolsDir.type === 'dir' && !toolsDir.children.includes('auth.pyc')) {
          toolsDir.children.push('auth.pyc');
      }
  }

  // Cycle 61 Init (The Python Bytecode)
  if (!VFS['/home/ghost/tools/auth.pyc']) {
      // Create tools dir if missing
      if (!VFS['/home/ghost/tools']) {
          VFS['/home/ghost/tools'] = { type: 'dir', children: [] };
          const homeGhost = getNode('/home/ghost');
          if (homeGhost && homeGhost.type === 'dir' && !homeGhost.children.includes('tools')) {
              homeGhost.children.push('tools');
          }
      }

      VFS['/home/ghost/tools/auth.pyc'] = {
          type: 'file',
          content: '03 f3 0d 0a ... [PYTHON_BYTECODE_V3.8] ...\nStrings: "GHOST_ROOT{PYC_R3V3RS3_3NG1N33R}"\nOp: LOAD_CONST 1\nOp: STORE_NAME 0',
          permissions: '0644'
      };
      const toolsDir = getNode('/home/ghost/tools');
      if (toolsDir && toolsDir.type === 'dir' && !toolsDir.children.includes('auth.pyc')) {
          toolsDir.children.push('auth.pyc');
      }
  }

  // Cycle 62 Init (The JWT Token)
  if (!VFS['/home/ghost/cookies.json']) {
      VFS['/home/ghost/cookies.json'] = {
          type: 'file',
          content: '{\n  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZ2hvc3QiLCJyb2xlIjoidXNlciIsImlhdCI6MTYxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"\n}',
          permissions: '0600'
      };
      const home = getNode('/home/ghost');
      if (home && home.type === 'dir' && !home.children.includes('cookies.json')) {
          home.children.push('cookies.json');
      }
      
      // Create jwt_tool
      VFS['/usr/bin/jwt_tool'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [JWT_ANALYZER]',
          permissions: '0755'
      };
      const binDir = getNode('/usr/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('jwt_tool')) {
          binDir.children.push('jwt_tool');
      }
  }

  // Cycle 63 Init (The Web Shell)
  if (!VFS['/var/www/html/uploads/shell.php']) {
      // Ensure paths
      const ensureDir = (p: string) => {
           if (!VFS[p]) VFS[p] = { type: 'dir', children: [] };
      };
      const link = (p: string, c: string) => {
          const n = getNode(p);
          if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c);
      };

      ensureDir('/var');
      ensureDir('/var/www');
      link('/var', 'www');
      ensureDir('/var/www/html');
      link('/var/www', 'html');
      ensureDir('/var/www/html/uploads');
      link('/var/www/html', 'uploads');

      // Create Dummy Files
      if (!VFS['/var/www/html/index.html']) {
          VFS['/var/www/html/index.html'] = { type: 'file', content: '<html><body><h1>Welcome to Omega Corp</h1></body></html>' };
          link('/var/www/html', 'index.html');
      }
      
      if (!VFS['/var/www/html/uploads/logo.png']) {
          VFS['/var/www/html/uploads/logo.png'] = { type: 'file', content: '[PNG_IMAGE_DATA]' };
          link('/var/www/html/uploads', 'logo.png');
      }

      // Create Web Shell
      VFS['/var/www/html/uploads/shell.php'] = {
          type: 'file',
          content: '<?php\n// AVATAR UPLOAD V2\n$data = "ZWNobyAiRmxhZzogR0hPU1RfUk9PVHtXM0JfU0gzTExfRDNUM0NUM0R9Ijs=";\neval(base64_decode($data));\n?>',
          permissions: '0644'
      };
      link('/var/www/html/uploads', 'shell.php');
      
      // Hint file
      if (!VFS['/home/ghost/security_alert.txt']) {
          VFS['/home/ghost/security_alert.txt'] = {
              type: 'file',
              content: '[SECURITY ALERT]\nSuspicious activity detected in /var/www/html/uploads.\nPlease investigate for potential web shells.\n'
          };
          const home = getNode('/home/ghost');
          if (home && home.type === 'dir' && !home.children.includes('security_alert.txt')) {
              home.children.push('security_alert.txt');
          }
      }
  }

  // Cycle 64 Init (The Internal Proxy)
  if (!VFS['/etc/nginx/sites-enabled/internal.conf']) {
      const ensureDir = (p: string) => { if (!VFS[p]) VFS[p] = { type: 'dir', children: [] }; };
      const link = (p: string, c: string) => { const n = getNode(p); if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c); };
      
      ensureDir('/etc');
      ensureDir('/etc/nginx');
      link('/etc', 'nginx');
      ensureDir('/etc/nginx/sites-enabled');
      link('/etc/nginx', 'sites-enabled');
      
      VFS['/etc/nginx/sites-enabled/internal.conf'] = {
          type: 'file',
          content: 'server {\n    listen 8080;\n    server_name localhost;\n\n    location /admin {\n        # INTERNAL ONLY\n        allow 127.0.0.1;\n        deny all;\n        # TODO: Remove this debug endpoint\n        return 200 "GHOST_ROOT{NG1NX_M1SCONF1G_R3V3AL3D}";\n    }\n}'
      };
      link('/etc/nginx/sites-enabled', 'internal.conf');
  }

  // Cycle 65 Init (The Sticky Bit)
  if (!VFS['/usr/local/bin/secure_cleanup']) {
      // Create the script
      VFS['/usr/local/bin/secure_cleanup'] = {
          type: 'file',
          content: '#!/bin/bash\n# SECURE CLEANUP DAEMON\n# Enforces sticky bit policy on /tmp.\n\n# Check for sticky bit (chmod +t)\nif [ ! -k "/tmp" ]; then\n  echo "[ERROR] /tmp is world-writable but missing sticky bit."\n  echo "[FATAL] Security risk detected. Aborting."\n  exit 1\nfi\n\necho "[SUCCESS] /tmp is secure."\necho "FLAG: GHOST_ROOT{ST1CKY_B1T_S3CUR3D}"',
          permissions: '0755'
      };
      const binDir = getNode('/usr/local/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('secure_cleanup')) {
          binDir.children.push('secure_cleanup');
      }
      
      // Reset /tmp permissions to 0777 (No sticky bit)
      const tmpNode = getNode('/tmp');
      if (tmpNode) (tmpNode as any).permissions = '0777';
  }

  // Cycle 66 Init (The Time Skew)
  if (!VFS['/usr/bin/otp_gen']) {
      VFS['/usr/bin/otp_gen'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [TOTP_GENERATOR] [TIME_SENSITIVE]',
          permissions: '0755'
      };
      const binDir = getNode('/usr/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('otp_gen')) {
          binDir.children.push('otp_gen');
      }
  }

  // Cycle 67 Init (The Environment Injection)
  if (!VFS['/usr/local/bin/access_card']) {
      VFS['/usr/local/bin/access_card'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [SECURITY_CHECK]\nChecking Environment...\nstrings: CLEARANCE_LEVEL\nstrings: OMEGA\n[ACCESS_DENIED]',
          permissions: '0755'
      };
      const binDir = getNode('/usr/local/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('access_card')) {
          binDir.children.push('access_card');
      }
  }

  // Cycle 68 Init (The DNS Tunnel)
  if (!VFS['/var/log/named.log']) {
      const logData = [
          'Oct 23 10:00:01 ns1 named[999]: starting BIND 9.16.1-Ubuntu',
          'Oct 23 10:00:01 ns1 named[999]: running on IPv4 interface lo, 127.0.0.1#53',
          'Oct 23 10:05:22 ns1 named[999]: client @0xdeadbeef 192.168.1.5#43210: query: google.com IN A + (127.0.0.1)',
          'Oct 23 10:06:11 ns1 named[999]: client @0xdeadbeef 192.168.1.5#43211: query: github.com IN A + (127.0.0.1)',
          'Oct 23 10:15:00 ns1 named[999]: client @0xdeadbeef 192.168.1.99#55555: query: 464c41473a20.c2.exfil.net IN TXT + (127.0.0.1)',
          'Oct 23 10:15:01 ns1 named[999]: client @0xdeadbeef 192.168.1.99#55555: query: 444e535f5455.c2.exfil.net IN TXT + (127.0.0.1)',
          'Oct 23 10:15:02 ns1 named[999]: client @0xdeadbeef 192.168.1.99#55555: query: 4e4e454c5f44.c2.exfil.net IN TXT + (127.0.0.1)',
          'Oct 23 10:15:03 ns1 named[999]: client @0xdeadbeef 192.168.1.99#55555: query: 455445435445.c2.exfil.net IN TXT + (127.0.0.1)',
          'Oct 23 10:15:04 ns1 named[999]: client @0xdeadbeef 192.168.1.99#55555: query: 445f3737.c2.exfil.net IN TXT + (127.0.0.1)',
          'Oct 23 10:20:00 ns1 named[999]: client @0xdeadbeef 192.168.1.5#43212: query: stackoverflow.com IN A + (127.0.0.1)'
      ].join('\\n');

      VFS['/var/log/named.log'] = {
          type: 'file',
          content: logData,
          permissions: '0644'
      };
      const logDir = getNode('/var/log');
      if (logDir && logDir.type === 'dir' && !logDir.children.includes('named.log')) {
          logDir.children.push('named.log');
      }
  }

  // Cycle 69 Init (The Corrupted Binary)
  if (!VFS['/usr/bin/sys_monitor']) {
      // Create corrupted binary
      VFS['/usr/bin/sys_monitor'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [CORRUPTED_HEADER] [SEGFAULT_ON_EXEC]\nError: 0xDEADBEEF memory violation.',
          permissions: '0755'
      };
      const binDir = getNode('/usr/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('sys_monitor')) {
          binDir.children.push('sys_monitor');
      }

      // Create backup
      if (!VFS['/var/backups/bin']) {
          // Ensure /var/backups exists
          if (!VFS['/var/backups']) {
              VFS['/var/backups'] = { type: 'dir', children: [] };
              const varNode = getNode('/var');
              if (varNode && varNode.type === 'dir' && !varNode.children.includes('backups')) {
                  varNode.children.push('backups');
              }
          }
          VFS['/var/backups/bin'] = { type: 'dir', children: [] };
          const backups = getNode('/var/backups');
          if (backups && backups.type === 'dir' && !backups.children.includes('bin')) {
              backups.children.push('bin');
          }
      }

      VFS['/var/backups/bin/sys_monitor'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [VALID_HEADER] [SYSTEM_MONITOR_V2]\n[OK] System Integrity Verified.\nFLAG: GHOST_ROOT{MD5_H4SH_R3ST0R3D}',
          permissions: '0755'
      };
      const backBin = getNode('/var/backups/bin');
      if (backBin && backBin.type === 'dir' && !backBin.children.includes('sys_monitor')) {
          backBin.children.push('sys_monitor');
      }
      
      // Hint file
      if (!VFS['/home/ghost/alert_sys_monitor.txt']) {
          VFS['/home/ghost/alert_sys_monitor.txt'] = {
              type: 'file',
              content: '[ALERT] Critical system monitor binary (/usr/bin/sys_monitor) is behaving erratically.\n[ACTION] Please verify integrity against backup in /var/backups/bin.\n[TOOL] Use md5sum to compare hashes.'
          };
          const home = getNode('/home/ghost');
          if (home && home.type === 'dir' && !home.children.includes('alert_sys_monitor.txt')) {
              home.children.push('alert_sys_monitor.txt');
          }
      }
  }

  // Cycle 70 Init (The Port Knocking)
  if (!VFS['/etc/knockd.conf']) {
      // Create config
      if (!VFS['/etc']) VFS['/etc'] = { type: 'dir', children: [] };
      VFS['/etc/knockd.conf'] = {
          type: 'file',
          content: '[options]\n    UseSyslog\n\n[openSSH]\n    sequence    = 7000,8000,9000\n    seq_timeout = 5\n    command     = /sbin/iptables -A INPUT -s %IP% -p tcp --dport 22 -j ACCEPT\n    tcpflags    = syn',
          permissions: '0600'
      };
      const etc = getNode('/etc');
      if (etc && etc.type === 'dir' && !etc.children.includes('knockd.conf')) {
          etc.children.push('knockd.conf');
      }
      
      // Create hint
      if (!VFS['/home/ghost/network_security.memo']) {
          VFS['/home/ghost/network_security.memo'] = {
              type: 'file',
              content: 'To: Admin\nFrom: NetSec\n\nWe have implemented Port Knocking on the Gateway (192.168.1.1).\nSSH is closed by default. Check /etc/knockd.conf for the sequence.\n'
          };
          const home = getNode('/home/ghost');
          if (home && home.type === 'dir' && !home.children.includes('network_security.memo')) {
              home.children.push('network_security.memo');
          }
      }
  }

  // Cycle 79 Init (The Broken Symlink)
  if (!VFS['/etc/nginx/sites-available/default']) {
      const ensureDir = (p: string) => { if (!VFS[p]) VFS[p] = { type: 'dir', children: [] }; };
      const link = (p: string, c: string) => { const n = getNode(p); if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c); };
      
      ensureDir('/etc');
      ensureDir('/etc/nginx');
      link('/etc', 'nginx');
      ensureDir('/etc/nginx/sites-available');
      link('/etc/nginx', 'sites-available');
      ensureDir('/etc/nginx/sites-enabled');
      link('/etc/nginx', 'sites-enabled');

      VFS['/etc/nginx/sites-available/default'] = {
          type: 'file',
          content: 'server {\n    listen 80;\n    server_name localhost;\n    root /var/www/html;\n    index index.html;\n}',
          permissions: '0644'
      };
      link('/etc/nginx/sites-available', 'default');

      VFS['/etc/nginx/sites-enabled/default'] = {
          type: 'symlink',
          target: '/etc/nginx/sites-available/default.bak',
          permissions: '0777'
      } as any;
      link('/etc/nginx/sites-enabled', 'default');
      
      if (!VFS['/home/ghost/web_config_error.log']) {
          VFS['/home/ghost/web_config_error.log'] = {
              type: 'file',
              content: '[ERROR] nginx: configuration file /etc/nginx/sites-enabled/default test failed\n[ERROR] nginx: open() "/etc/nginx/sites-enabled/default" failed (2: No such file or directory)\n[ACTION] Fix the symlink in sites-enabled.'
          };
          const home = getNode('/home/ghost');
          if (home && home.type === 'dir' && !home.children.includes('web_config_error.log')) {
              home.children.push('web_config_error.log');
          }
      }
  }

  // Cycle 79 Init (The Shared Object Injection)
  if (!VFS['/usr/bin/secure_vault']) {
      // Create Binary
      VFS['/usr/bin/secure_vault'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [SECURE_STORAGE] [HW_KEY_REQUIRED]\nstrings: hardware_key_check\nstrings: access_granted\n',
          permissions: '0755'
      };
      const binDir = getNode('/usr/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('secure_vault')) {
          binDir.children.push('secure_vault');
      }

      // Create Bypass Library
      if (!VFS['/home/ghost/tools']) {
           VFS['/home/ghost/tools'] = { type: 'dir', children: [] };
           const hg = getNode('/home/ghost');
           if (hg && hg.type === 'dir' && !hg.children.includes('tools')) hg.children.push('tools');
      }

      VFS['/home/ghost/tools/bypass.so'] = {
          type: 'file',
          content: '[ELF_SHARED_OBJECT] [INTERCEPTOR]\n// Hooks hardware_key_check() to always return 1.\n',
          permissions: '0755'
      };
      const toolsDir = getNode('/home/ghost/tools');
      if (toolsDir && toolsDir.type === 'dir' && !toolsDir.children.includes('bypass.so')) {
          toolsDir.children.push('bypass.so');
      }

      // Hint
      if (!VFS['/home/ghost/exploit_notes.txt']) {
          VFS['/home/ghost/exploit_notes.txt'] = {
              type: 'file',
              content: 'TARGET: secure_vault\nMETHOD: Library Injection\nTOOL: tools/bypass.so\n\nNotes: The binary uses a dynamic library call to check for the hardware key.\nIf we can preload our own library before libc, we can hijack the function.\nTry using LD_PRELOAD.'
          };
          const home = getNode('/home/ghost');
          if (home && home.type === 'dir' && !home.children.includes('exploit_notes.txt')) {
              home.children.push('exploit_notes.txt');
          }
      }
  }

  // Cycle 78 Init (The Capability Escalation)
  if (!VFS['/usr/bin/tac']) {
      // Create binary with capability
      VFS['/usr/bin/tac'] = {
          type: 'file',
          content: '[BINARY_ELF_X86_64] [CAPABILITY_SET]\nstrings: cap_dac_read_search+ep',
          permissions: '0755',
          xattrs: { 'security.capability': 'cap_dac_read_search+ep' }
      };
      const binDir = getNode('/usr/bin');
      if (binDir && binDir.type === 'dir' && !binDir.children.includes('tac')) {
          binDir.children.push('tac');
      }

      // Create Secret File
      VFS['/root/secret_plan.txt'] = {
          type: 'file',
          content: 'OPERATION BLACKOUT V2\n---------------------\nTARGET: 10.10.99.5\nPAYLOAD: rm -rf /var/lib/backups\nFLAG: GHOST_ROOT{C4P_D4C_R34D_BYP4SS}',
          permissions: '0600' // Root only
      };
      const rootDir = getNode('/root');
      if (rootDir && rootDir.type === 'dir' && !rootDir.children.includes('secret_plan.txt')) {
          rootDir.children.push('secret_plan.txt');
      }

      // Cycle 82: The Unix Socket
      const runNode = getNode('/var/run');
      if (runNode && runNode.type === 'dir' && !runNode.children.includes('ghost.sock')) {
          runNode.children.push('ghost.sock');
          VFS['/var/run/ghost.sock'] = { type: 'file', content: '[SOCKET_UNIX_STREAM]', permissions: '0777' };
      }
      const logNode = getNode('/var/log');
      if (logNode && logNode.type === 'dir' && !logNode.children.includes('daemon.log')) {
          logNode.children.push('daemon.log');
          VFS['/var/log/daemon.log'] = { type: 'file', content: '[INFO] Starting secure daemon...\n[WARN] Network interfaces disabled for security.\n[INFO] Listening on UNIX domain socket: /var/run/ghost.sock\n[INFO] Use local tools to interact.' };
      }

      // Create Hint
      if (!VFS['/home/ghost/security_audit.log']) {
          VFS['/home/ghost/security_audit.log'] = {
              type: 'file',
              content: '[AUDIT] Checking file capabilities...\n[WARN] /usr/bin/tac has elevated capabilities (cap_dac_read_search).\n[ACTION] Remove capability or restrict access.\n'
          };
          const home = getNode('/home/ghost');
          if (home && home.type === 'dir' && !home.children.includes('security_audit.log')) {
              home.children.push('security_audit.log');
          }
      }
  }

  // Cycle 84 Init (The Compressed Evidence)
  if (!VFS['/var/log/auth.log.2.gz']) {
      // Ensure /var/log exists
      if (!VFS['/var/log']) {
          VFS['/var/log'] = { type: 'dir', children: [] };
          const varNode = getNode('/var');
          if (varNode && varNode.type === 'dir' && !varNode.children.includes('log')) {
              varNode.children.push('log');
          }
      }
      
      VFS['/var/log/auth.log.2.gz'] = {
          type: 'file',
          content: 'GZIP_V1:Oct 20 04:00:00 server sshd[123]: Accepted password for root from 192.168.1.55\nOct 20 04:01:00 server sshd[124]: Failed password for invalid user admin from 10.0.0.1\nOct 20 04:02:00 server sudo: ghost : TTY=pts/0 ; PWD=/home/ghost ; USER=root ; COMMAND=/bin/bash\n[HINT] Use zcat or zgrep to read compressed logs.',
          permissions: '0640'
      };
      const logDir = getNode('/var/log');
      if (logDir && logDir.type === 'dir' && !logDir.children.includes('auth.log.2.gz')) {
          logDir.children.push('auth.log.2.gz');
      }

      // Create binaries
      const binDir = getNode('/usr/bin');
      if (binDir && binDir.type === 'dir') {
          if (!binDir.children.includes('zcat')) {
              binDir.children.push('zcat');
              VFS['/usr/bin/zcat'] = { type: 'file', content: '[BINARY_ELF_X86_64]', permissions: '0755' };
          }
          if (!binDir.children.includes('zgrep')) {
              binDir.children.push('zgrep');
              VFS['/usr/bin/zgrep'] = { type: 'file', content: '[BINARY_ELF_X86_64]', permissions: '0755' };
          }
          if (!binDir.children.includes('gunzip')) {
              binDir.children.push('gunzip');
              VFS['/usr/bin/gunzip'] = { type: 'file', content: '[BINARY_ELF_X86_64]', permissions: '0755' };
          }
      }
  }

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
  let redirectIndex = commandLine.indexOf('>>');
  let redirectFile: string | null = null;
  let cmdToProcess = commandLine;
  let redirectMode: 'write' | 'append' = 'write';

  if (redirectIndex !== -1) {
    redirectMode = 'append';
    redirectFile = commandLine.substring(redirectIndex + 2).trim();
    cmdToProcess = commandLine.substring(0, redirectIndex).trim();
  } else {
    redirectIndex = commandLine.indexOf('>');
    if (redirectIndex !== -1) {
      redirectFile = commandLine.substring(redirectIndex + 1).trim();
      cmdToProcess = commandLine.substring(0, redirectIndex).trim();
    }
  }

  let parts = tokenize(cmdToProcess);

  // Environment Variable Parsing (Cycle 79 Support)
  const tempEnv: Record<string, string> = { ...ENV_VARS };
  while (parts.length > 0 && parts[0].includes('=')) {
      const eqIdx = parts[0].indexOf('=');
      // Must be key=value, not starting with / (unlikely path) or quote
      if (eqIdx > 0 && !parts[0].startsWith('/') && !parts[0].startsWith('"') && !parts[0].startsWith("'")) {
          const key = parts[0].substring(0, eqIdx);
          const val = parts[0].substring(eqIdx + 1);
          tempEnv[key] = val;
          parts.shift();
      } else {
          break;
      }
  }

  let command = parts[0];
  
  if (ALIASES[command]) {
      const aliasBody = ALIASES[command];
      const aliasParts = tokenize(aliasBody);
      parts = [...aliasParts, ...parts.slice(1)];
      command = parts[0];
  }

  // Handle Background Jobs (&)
  let isBackground = false;
  if (parts[parts.length - 1] === '&') {
      isBackground = true;
      parts.pop(); // Remove '&' from parts
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
      // Auto-save on every command completion
      saveSystemState();

      if (redirectFile && out) {
          const filePath = resolvePath(cwd, redirectFile);
          
          // READ-ONLY MOUNT SIMULATION
          for (const [mp, opts] of Object.entries(MOUNT_OPTIONS)) {
              if (filePath.startsWith(mp) && opts.includes('ro')) {
                  return { output: `bash: ${redirectFile}: Read-only file system`, newCwd: nCwd, action: act, data: dat, newPrompt: prompt };
              }
          }

          // DISK FULL SIMULATION
          if (filePath.startsWith('/var') && !!getNode('/var/log/overflow.dmp')) {
             return { output: `bash: write error: No space left on device`, newCwd: nCwd, action: act, data: dat, newPrompt: prompt };
          }

          // FIFO Check (Cycle 54)
          const existingNode = getNode(filePath);
          if (existingNode && existingNode.type === 'file' && (existingNode as any).xattrs && (existingNode as any).xattrs.type === 'fifo') {
              if (filePath.endsWith('/uplink.pipe')) {
                  let resultOutput = `[UPLINK] Pipe Data Received: ${out.substring(0, 50)}...\n[UPLINK] Authenticating...\n[SUCCESS] Uplink Established.\nFLAG: GHOST_ROOT{N4M3D_P1P3_WR1T3R}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: NAMED PIPE.\x1b[0m`;
                  if (!VFS['/var/run/fifo_solved']) {
                      VFS['/var/run/fifo_solved'] = { type: 'file', content: 'TRUE' };
                      const runDir = getNode('/var/run');
                      if (runDir && runDir.type === 'dir' && !runDir.children.includes('fifo_solved')) {
                          runDir.children.push('fifo_solved');
                      }
                  }
                  return { output: resultOutput, newCwd: nCwd, action: act, data: dat, newPrompt: prompt };
              } else {
                  // Generic FIFO (no listener)
                  return { output: '', newCwd: nCwd, action: 'delay', data: dat, newPrompt: prompt };
              }
          }

          const parentPath = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
          const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
          const parentNode = getNode(parentPath);
          
          if (parentNode && parentNode.type === 'dir') {
              let newContent = out;
              if (redirectMode === 'append') {
                 const existingNode = getNode(filePath);
                 if (existingNode && existingNode.type === 'file') {
                     newContent = existingNode.content + '\n' + out;
                 }
              }
              VFS[filePath] = { type: 'file', content: newContent };
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
      } else if (node.type === 'symlink') {
          // Follow symlink for execution
          const target = (node as any).target;
          const targetNode = getNode(target);
          if (!targetNode || targetNode.type !== 'file') {
              return finalize(`bash: ${command}: Broken symbolic link or target not a file`, newCwd);
          }
          // Recursively execute? Or just use target content.
          // For simplicity, let's just use target content and check permissions of target
          const fileNode = targetNode as any;
          
          if (fileNode.content.includes('[BINARY_ELF_X86_64]') || fileNode.content.includes('BINARY_PAYLOAD') || fileNode.content.includes('DOOMSDAY_PROTOCOL')) {
             // Continue execution logic below (will need refactoring)
             // Instead of refactoring the whole block, let's just swap 'node' for 'targetNode' locally?
             // No, 'node' is const.
             
             // Quick fix: check type and access content safely
             const content = fileNode.content;
             // ... duplicate logic ...
             return finalize(`bash: ${command}: Symbolic link execution successful (Simulated)`, newCwd);
          }
          return finalize(`bash: ${command}: Permission denied (Symlink)`, newCwd);
      } else {
          // FileNode
          const fileNode = node as any; // Cast to avoid TS errors
          
          // Permission Check
          if (fileNode.permissions) {
              const mode = fileNode.permissions;
              const ownerChar = mode.length === 4 ? mode[1] : mode[0];
              const owner = parseInt(ownerChar, 10);
              // Check execute bit (1) - Odd numbers have exec bit set (1, 3, 5, 7)
              if (!(owner & 1)) { 
                  return finalize(`bash: ${command}: Permission denied`, newCwd);
              }
          }

          if (fileName === 'secure_cleanup') {
              // Sticky Bit Logic (Cycle 65)
              const tmpNode = getNode('/tmp');
              const perms = (tmpNode as any).permissions || '0777';
              
              if (perms === '1777' || perms.startsWith('1') || perms.includes('t')) {
                   if (!VFS['/var/run/sticky_solved']) {
                       VFS['/var/run/sticky_solved'] = { type: 'file', content: 'TRUE' };
                       const runDir = getNode('/var/run');
                       if (runDir && runDir.type === 'dir' && !runDir.children.includes('sticky_solved')) {
                           runDir.children.push('sticky_solved');
                       }
                       return finalize(`[SUCCESS] /tmp is secure (Sticky Bit Detected).\nFLAG: GHOST_ROOT{ST1CKY_B1T_S3CUR3D}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: PERMISSION HARDENING.\x1b[0m`, newCwd);
                   }
                   return finalize(`[SUCCESS] /tmp is secure.`, newCwd);
              } else {
                   return finalize(`[ERROR] /tmp is world-writable but missing sticky bit.\n[FATAL] Security risk detected. Aborting.`, newCwd);
              }
          }

          if (fileNode.content.includes('[BINARY_ELF_X86_64]') || fileNode.content.includes('BINARY_PAYLOAD') || fileNode.content.includes('DOOMSDAY_PROTOCOL')) {
              if (fileName === 'overflow') {
                  output = `[SYSTEM] Buffer Overflow Triggered at 0xBF800000...\n[SYSTEM] EIP overwritten with 0x08048000\n[SYSTEM] Spawning root shell...\n\n# whoami\nroot`;
                  return { output, newCwd: '/root', newPrompt: 'root@ghost-root#', action: 'delay' };
              } else if (fileName === 'exploit') {
                  output = `[EXPLOIT] Linking libbreaker.so... OK\n[EXPLOIT] Injecting Payload into Kernel... OK\n[EXPLOIT] Root Access Granted.\n\nFLAG: GHOST_ROOT{C0MP1L3R_M4ST3R}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: PAYLOAD DELIVERED.\x1b[0m`;
                  if (!VFS['/var/run/payload_delivered']) {
                      VFS['/var/run/payload_delivered'] = { type: 'file', content: 'TRUE' };
                  }
                  return { output, newCwd, action: 'delay' };
              } else if (fileName === 'escalate') {
                  // Check SUID bit
                  let mode = (fileNode as any).permissions || '0755';
                  if (mode.length === 3) mode = '0' + mode;
                  const special = parseInt(mode[0], 10);
                  const isSetuid = !!(special & 4);
                  
                  if (isSetuid) {
                      output = `[SYSTEM] Escalating privileges...
[AUTH] SUID verified (Owner: root).
[SUCCESS] Access Granted.
FLAG: GHOST_ROOT{SU1D_B1T_M4ST3R}

\x1b[1;32m[MISSION UPDATE] Objective Complete: PRIVILEGE ESCALATION (SUID).\x1b[0m`;
                      // Set flag
                      if (!VFS['/var/run/suid_solved']) {
                          VFS['/var/run/suid_solved'] = { type: 'file', content: 'TRUE' };
                          const runDir = getNode('/var/run');
                          if (runDir && runDir.type === 'dir' && !runDir.children.includes('suid_solved')) {
                              runDir.children.push('suid_solved');
                          }
                      }
                  } else {
                      output = `[ERROR] This binary must be run as root (setuid bit missing).\n[HINT] Try 'chmod u+s' or 'chmod 4755'.`;
                  }
                  return { output, newCwd, action: 'delay' };
              } else if (fileName === 'secure_vault') {
                  if (VFS['/var/lock/subsystem/vault.lock']) {
                      output = `[ERROR] Secure Vault Locked.\n[REASON] Exclusive lock held by process (PID: 4001).\n[HINT] Check process table (ps -ef).`;
                  } else {
                      if (!VFS['/var/run/vault_unlocked']) {
                          VFS['/var/run/vault_unlocked'] = { type: 'file', content: 'TRUE' };
                          const runDir = getNode('/var/run');
                          if (runDir && runDir.type === 'dir' && !runDir.children.includes('vault_unlocked')) {
                              runDir.children.push('vault_unlocked');
                          }
                          output = `[SUCCESS] Vault Unlocked.\n[ACCESS] Level 5 Clearance Granted.\nFLAG: GHOST_ROOT{Z0MB13_R3AP3R}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: ZOMBIE PROCESS CLEARED.\x1b[0m`;
                      } else {
                          output = `[SUCCESS] Vault Unlocked.\nFLAG: GHOST_ROOT{Z0MB13_R3AP3R}`;
                      }
                  }
                  return { output, newCwd, action: 'delay' };
              } else if (fileName === 'auth_daemon') {
                  if (stdin && stdin.length > 16) {
                     output = `Enter password: ${stdin}\n[MEMORY CORRUPTION DETECTED]\n[DEBUG] admin_flag overwritten: 0x${Math.floor(Math.random()*0xFFFFFFFF).toString(16)}\n\nAccess Granted! Flag: GHOST_ROOT{B0F_OV3RFL0W_K1NG}\n\n[SHELL] Spawning root shell...\n#`;
                     if (!VFS['/var/run/bof_solved']) {
                         VFS['/var/run/bof_solved'] = { type: 'file', content: 'TRUE' };
                         const runDir = getNode('/var/run');
                         if (runDir && runDir.type === 'dir' && !runDir.children.includes('bof_solved')) {
                             runDir.children.push('bof_solved');
                         }
                         output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: BUFFER OVERFLOW EXPLOITED.\x1b[0m`;
                     }
                     return { output, newCwd: '/root', newPrompt: 'root@ghost-root#', action: 'delay' };
                  } else {
                     output = `Enter password: ${stdin || ''}\nAccess Denied.`;
                     if (!stdin) output += `\n(Hint: Program expects input via pipe or redirection)`;
                     return { output, newCwd, action: 'delay' };
                  }
              } else if (fileName === 'otp_gen' || fileName === 'auth_token') {
                  const now = Date.now() + SYSTEM_TIME_OFFSET;
                  const year = new Date(now).getFullYear();
                  
                  if (year < 2025) {
                      output = `[ERROR] TOTP Generation Failed.\n[REASON] System Clock Skew Detected (> 25 years).\n[CURRENT_TIME] ${new Date(now).toString()}\n[REQUIRED] Sync with time server (ntpdate).`;
                  } else {
                      if (!VFS['/var/run/otp_generated']) {
                          VFS['/var/run/otp_generated'] = { type: 'file', content: 'TRUE' };
                          const runDir = getNode('/var/run');
                          if (runDir && runDir.type === 'dir' && !runDir.children.includes('otp_generated')) {
                              runDir.children.push('otp_generated');
                          }
                          output = `[SUCCESS] Time Synchronization Verified.\n[TOTP] Generating One-Time Password...\n\nACCESS CODE: 8675309\n\x1b[1;32m[MISSION UPDATE] Objective Complete: TIME SYNCED & TOKEN GENERATED.\x1b[0m`;
                      } else {
                          output = `[SUCCESS] TOTP: 8675309`;
                      }
                  }
                  return { output, newCwd, action: 'delay' };
              } else if (fileName === 'launch_codes.bin' || fileName === './launch_codes.bin') {
                  output = `[SYSTEM] INITIATING LAUNCH SEQUENCE...\n[SYSTEM] AUTHENTICATION VERIFIED (OMEGA-LVL-5)\n[SYSTEM] TARGET: GLOBAL_RESET_PROTOCOL\n\n3...\n2...\n1...\n`;
                  return { output, newCwd, action: 'win_sim' };
              } else if (fileName === 'recover_tool') {
                  output = `[RECOVERY] Initializing...\n[ERROR] SEGMENTATION FAULT (core dumped)\n[SYSTEM] Memory dump saved to /var/crash/recover_tool.core`;
                  return { output, newCwd, action: 'delay' };
              } else if (fileName === 'uplink_service') {
                  // Cycle 54 Logic
                  const pipePath = '/tmp/uplink.pipe';
                  const pipeNode = getNode(pipePath);
                  
                  if (!pipeNode) {
                      output = `[ERROR] Failed to open communication channel.\n[REASON] Named pipe ${pipePath} not found.\n[HINT] Create the FIFO first.`;
                  } else if (!(pipeNode as any).xattrs || (pipeNode as any).xattrs.type !== 'fifo') {
                      output = `[ERROR] Invalid file type.\n[REASON] ${pipePath} is not a FIFO (named pipe).\n[HINT] Use 'mkfifo'.`;
                  } else {
                      // Check if pipe has content (simulating data written to it)
                      if ((pipeNode as any).content && (pipeNode as any).content.trim().length > 0) {
                          if (!VFS['/var/run/uplink_established']) {
                              VFS['/var/run/uplink_established'] = { type: 'file', content: 'TRUE' };
                              const runDir = getNode('/var/run');
                              if (runDir && runDir.type === 'dir' && !runDir.children.includes('uplink_established')) {
                                  runDir.children.push('uplink_established');
                              }
                              output = `[SUCCESS] Uplink Established.\n[DATA] Received: ${(pipeNode as any).content}\nFLAG: GHOST_ROOT{F1F0_P1P3_DR34M}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: NAMED PIPE COMM.\x1b[0m`;
                          } else {
                              output = `[SUCCESS] Uplink Active.\n[DATA] ${(pipeNode as any).content}`;
                          }
                      } else {
                          output = `[SERVICE] Listening on ${pipePath}...\n[STATUS] Idle (No Data).\n[HINT] Write data to the pipe (echo "..." > ${pipePath}).`;
                      }
                  }
                  return { output, newCwd, action: 'delay' };
              } else {
                  output = `bash: ${command}: Permission denied (Missing execute bit or corrupt header)`;
              }
          } else if (fileNode.content.startsWith('#!/bin/bash')) {
              if (fileName === 'system_backup.sh') {
                  output = `[BACKUP] Executing backup routine...\n[BACKUP] Archive created.\nFLAG: GHOST_ROOT{CR0N_D_D1SCOV3RY}\n`;
                  if (!VFS['/var/run/cron_d_solved']) {
                      VFS['/var/run/cron_d_solved'] = { type: 'file', content: 'TRUE' };
                      const runDir = getNode('/var/run');
                      if (runDir && runDir.type === 'dir' && !runDir.children.includes('cron_d_solved')) {
                          runDir.children.push('cron_d_solved');
                      }
                      output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: HIDDEN CRON FOUND.\x1b[0m`;
                  }
                  return { output, newCwd, action: 'delay' };
              }
              if (fileName === 'secure_cleanup') {
                  const tmpNode = getNode('/tmp');
                  const perms = (tmpNode as any).permissions || '0777';
                  // Check sticky bit (bit 1 of first digit)
                  const special = parseInt(perms.length === 4 ? perms[0] : '0', 10);
                  
                  if (special & 1) {
                      output = `[SECURE_CLEANUP] Verifying /tmp permissions... OK (Sticky Bit Set)\n[SUCCESS] Security Policy Enforced.\n\nFLAG: GHOST_ROOT{ST1CKY_B1T_S3CUR3D}`;
                      if (!VFS['/var/run/sticky_solved']) {
                          VFS['/var/run/sticky_solved'] = { type: 'file', content: 'TRUE' };
                          const runDir = getNode('/var/run');
                          if (runDir && runDir.type === 'dir' && !runDir.children.includes('sticky_solved')) {
                              runDir.children.push('sticky_solved');
                          }
                          output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: STICKY BIT SECURED.\x1b[0m`;
                      }
                  } else {
                      output = `[SECURE_CLEANUP] Verifying /tmp permissions... FAILED\n[ERROR] /tmp is world-writable (777) but missing Sticky Bit (+t).\n[FATAL] Security Check Failed.`;
                  }
                  return { output, newCwd, action: 'delay' };
              }
              if (fileName === 'net-bridge') {
                 output = `[SYSTEM] Executing net-bridge...\n[ERROR] SEGMENTATION FAULT (core dumped)\n[HINT] View source code to debug.`;
                 return { output: output, newCwd: newCwd, action: 'delay' };
              }
              if (fileName.endsWith('signal_decoder.sh')) {
                  const inputPath = '/var/data/raw_signal.dat';
                  const inputNode = getNode(inputPath);
                  if (!inputNode) {
                      output = `Error: Input file ${inputPath} not found.\nPlease restore from backup if missing.`;
                      return { output, newCwd, action: 'delay' };
                  }
                  
                  if (inputNode.type !== 'file') {
                    output = `Error: ${inputPath} is not a file.`;
                    return { output, newCwd, action: 'delay' };
                  }

                  // Decode and Grep Logic
                  const raw = inputNode.content;
                  // Base64 decode
                  let decoded = '';
                  try {
                      // Attempt decode. If fails (e.g. user wrote plain text), keep raw.
                      decoded = atob(raw);
                  } catch (e) {
                      decoded = raw; 
                  }
                  
                  // If raw content was already decoded (user manually decoded it?), handle that.
                  // But the puzzle is cat | base64 -d. So the file should be encoded.
                  // If decoding fails or produces garbage, grep might fail.
                  
                  // Grep for KEY
                  const lines = decoded.split('\n');
                  const matches = lines.filter(l => l.includes('KEY'));
                  if (matches.length > 0) {
                      output = matches.join('\n');
                      output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: SIGNAL DECODED.\x1b[0m`;
                      
                      // Mission Update: Create flag
                      if (!VFS['/var/run/signal_decoded']) {
                          VFS['/var/run/signal_decoded'] = { type: 'file', content: 'TRUE' };
                          const runDir = getNode('/var/run');
                          if (runDir && runDir.type === 'dir' && !runDir.children.includes('signal_decoded')) {
                              runDir.children.push('signal_decoded');
                          }
                      }
                  } else {
                      output = `[ERROR] No valid key found in signal stream. (Did you restore the correct file?)`;
                  }
                  return { output, newCwd, action: 'delay' };
              }
              if (fileName.endsWith('maintenance')) {
                  const checkPath = '/var/run/maintenance.mode';
                  const checkNode = getNode(checkPath);
                  
                  if (!checkNode) {
                      output = `[MAINTENANCE] System normal. Skipping backup.\n(Hint: Enable maintenance mode)`;
                      return { output, newCwd, action: 'delay' };
                  } else {
                      output = `[MAINTENANCE] Maintenance mode detected.\n[BACKUP] Compressing secure data...\n[SUCCESS] Backup created at /tmp/secure_backup.tar.gz`;
                      
                      // Create the backup file
                      VFS['/tmp/secure_backup.tar.gz'] = { 
                          type: 'file', 
                          content: 'TAR_GZ:{payload.bin:P4sB7X...}' // Simplified
                      };
                      const tmpDir = getNode('/tmp');
                      if (tmpDir && tmpDir.type === 'dir' && !tmpDir.children.includes('secure_backup.tar.gz')) {
                          tmpDir.children.push('secure_backup.tar.gz');
                      }
                      
                      // Mission Update: Create flag if not present
                      if (!VFS['/var/run/cron_solved']) {
                          VFS['/var/run/cron_solved'] = { type: 'file', content: 'TRUE' };
                          const runDir = getNode('/var/run');
                          if (runDir && runDir.type === 'dir' && !runDir.children.includes('cron_solved')) {
                              runDir.children.push('cron_solved');
                          }
                          output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: CRON JOB EXPLOITED.\x1b[0m`;
                      }
                      
                      return { output, newCwd, action: 'delay' };
                  }
              }
              output = `Executing script ${fileName}...\n` + fileNode.content;
          } else {
              output = `bash: ${command}: Permission denied`;
          }
          return finalize(output, newCwd);
      }
  }

  switch (command) {
    case 'auth_daemon': {
        if (stdin && stdin.length > 16) {
           output = `Enter password: ${stdin}\n[MEMORY CORRUPTION DETECTED]\n[DEBUG] admin_flag overwritten: 0x${Math.floor(Math.random()*0xFFFFFFFF).toString(16)}\n\nAccess Granted! Flag: GHOST_ROOT{B0F_OV3RFL0W_K1NG}\n\n[SHELL] Spawning root shell...\n#`;
           if (!VFS['/var/run/bof_solved']) {
               VFS['/var/run/bof_solved'] = { type: 'file', content: 'TRUE' };
               const runDir = getNode('/var/run');
               if (runDir && runDir.type === 'dir' && !runDir.children.includes('bof_solved')) {
                   runDir.children.push('bof_solved');
               }
               output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: BUFFER OVERFLOW EXPLOITED.\x1b[0m`;
           }
           return { output, newCwd: '/root', newPrompt: 'root@ghost-root#', action: 'delay' };
        } else {
           output = `Enter password: ${stdin || ''}\nAccess Denied.`;
           if (!stdin) output += `\n(Hint: Program expects input via pipe or redirection)`;
           return { output, newCwd, action: 'delay' };
        }
        break;
    }
    case 'gcc': {
        if (args.length < 1) {
            output = 'gcc: fatal error: no input files\ncompilation terminated.';
        } else {
            output = `gcc: ${args.join(' ')}: Linker error (missing libraries). Simulation mode: Binary already exists.`;
        }
        break;
    }
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
    case 'git': {
        const subCmd = args[0];
        if (!subCmd) {
            output = 'usage: git <command> [<args>]';
        } else if (subCmd === 'status') {
            output = 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean';
        } else if (subCmd === 'log') {
            output = '\x1b[33mcommit a1b2c3d4e5f6\x1b[0m (HEAD -> main)\nAuthor: ghost <ghost@localhost>\nDate:   Thu Feb 12 20:00:00 2026 +0900\n\n    Refactored auth system\n\n\x1b[33mcommit 9f8e7d6c5b4a\x1b[0m\nAuthor: ghost <ghost@localhost>\nDate:   Thu Feb 12 19:30:00 2026 +0900\n\n    [WIP] Added new keys\n\n\x1b[33mcommit 5a4b3c2d1e0f\x1b[0m\nAuthor: ghost <ghost@localhost>\nDate:   Thu Feb 12 19:00:00 2026 +0900\n\n    Initial commit';
        } else if (subCmd === 'show') {
            const hash = args[1];
            if (!hash) {
                output = 'usage: git show <commit>';
            } else if (hash.startsWith('9f8e7d6')) {
                output = '\x1b[33mcommit 9f8e7d6c5b4a\x1b[0m\nAuthor: ghost <ghost@localhost>\nDate:   Thu Feb 12 19:30:00 2026 +0900\n\n    [WIP] Added new keys\n\ndiff --git a/config.js b/config.js\nindex 83a9c2..b1d4e5 100644\n--- a/config.js\n+++ b/config.js\n@@ -1,2 +1,2 @@\n- const API_KEY = "GHOST_ROOT{G1T_H1ST0RY_R3V3ALS_ALL}";\n+ const API_KEY = process.env.API_KEY;';
                 
                 // Mission Update
                 if (!VFS['/var/run/git_solved']) {
                     VFS['/var/run/git_solved'] = { type: 'file', content: 'TRUE' };
                     const runDir = getNode('/var/run');
                     if (runDir && runDir.type === 'dir' && !runDir.children.includes('git_solved')) {
                         runDir.children.push('git_solved');
                     }
                     output += '\n\x1b[1;32m[MISSION UPDATE] Objective Complete: GIT HISTORY RECOVERED.\x1b[0m';
                 }
            } else if (hash.startsWith('a1b2c3d')) {
                output = '\x1b[33mcommit a1b2c3d4e5f6\x1b[0m (HEAD -> main)\nAuthor: ghost <ghost@localhost>\nDate:   Thu Feb 12 20:00:00 2026 +0900\n\n    Refactored auth system\n\ndiff --git a/auth.js b/auth.js\nindex ...';
            } else {
                output = `fatal: ambiguous argument '${hash}': unknown revision or path not in the working tree.`;
            }
        } else {
            output = `git: '${subCmd}' is not a git command. See 'git --help'.`;
        }
        break;
    }
    case 'nginx': {
        if (args.includes('-t') || (args.includes('-s') && args.includes('reload'))) {
            const linkPath = '/etc/nginx/sites-enabled/default';
            const linkNode = getNode(linkPath);
            
            if (linkNode && linkNode.type === 'symlink') {
                const target = (linkNode as any).target;
                if (target === '/etc/nginx/sites-available/default') {
                     output = 'nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful';
                     if (!VFS['/var/run/nginx_fixed']) {
                         VFS['/var/run/nginx_fixed'] = { type: 'file', content: 'TRUE' };
                         const runDir = getNode('/var/run');
                         if (runDir && runDir.type === 'dir' && !runDir.children.includes('nginx_fixed')) {
                             runDir.children.push('nginx_fixed');
                         }
                         output += '\n\x1b[1;32m[MISSION UPDATE] Objective Complete: WEB SERVER RESTORED.\x1b[0m';
                     }
                } else {
                     output = `nginx: [emerg] open() "${target}" failed (2: No such file or directory)\nnginx: configuration file /etc/nginx/nginx.conf test failed`;
                }
            } else if (linkNode && linkNode.type === 'file') {
                 output = 'nginx: [warn] /etc/nginx/sites-enabled/default should be a symbolic link\nnginx: configuration test successful (but non-standard)';
            } else {
                 output = 'nginx: [emerg] open() "/etc/nginx/sites-enabled/default" failed (2: No such file or directory)';
            }
        } else {
            output = 'usage: nginx -t';
        }
        break;
    }
    case 'readlink': {
        if (args.length < 1) {
            output = 'usage: readlink <file>';
        } else {
            const target = args[0];
            const node = getNode(resolvePath(cwd, target));
            if (node && node.type === 'symlink') {
                output = (node as any).target;
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
               if (fileNode.type === 'symlink') {
                   output = `grep: ${fileTarget}: Is a symbolic link (not followed)`;
                   return finalize(output, newCwd);
               }
               content = (fileNode as any).content;
               if (content.startsWith('GZIP_V1:')) {
                   output = `Binary file ${fileTarget} matches`;
                   return finalize(output, newCwd);
               }
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
    case 'sys_monitor': {
        const node = getNode('/usr/bin/sys_monitor');
        if (!node) {
             output = 'bash: sys_monitor: command not found';
        } else if ((node as any).content.includes('[CORRUPTED_HEADER]')) {
             output = 'Segmentation fault (core dumped)';
        } else {
             output = '[SYSTEM MONITOR] Initializing...\n[OK] CPU: 12%\n[OK] MEM: 45%\n[OK] INTEGRITY: VERIFIED\n\nFLAG: GHOST_ROOT{MD5_H4SH_R3ST0R3D}';
             if (!VFS['/var/run/sys_monitor_solved']) {
                 VFS['/var/run/sys_monitor_solved'] = { type: 'file', content: 'TRUE' };
                 const runDir = getNode('/var/run');
                 if (runDir && runDir.type === 'dir' && !runDir.children.includes('sys_monitor_solved')) {
                     runDir.children.push('sys_monitor_solved');
                 }
                 output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: BINARY RESTORED.\x1b[0m`;
             }
        }
        break;
    }
    case 'echo': {
       output = args.join(' ');
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
        } else if (fileNode.type === 'symlink') {
            const target = (fileNode as any).target;
            const tNode = getNode(target);
            if (tNode && tNode.type === 'file') output = tNode.content;
            else output = `cat: ${fileTarget}: No such file or directory`;
        } else if ((filePath.startsWith('/root') || filePath.startsWith('/home/dr_akira')) && !VFS['/tmp/.root_session']) {
          output = `cat: ${fileTarget}: Permission denied`;
        } else {
          const content = (fileNode as any).content;
          if (content && content.startsWith('GZIP_V1:')) {
             output = `(standard input): binary file matches`;
          } else {
             output = content || '';
          }
        }
      }
      break;
    }
    case 'zcat': {
        if (args.length < 1) {
            output = 'usage: zcat <file...>';
        } else {
            const target = args[0];
            const node = getNode(resolvePath(cwd, target));
            
            if (!node) {
                output = `zcat: ${target}: No such file or directory`;
            } else if (node.type === 'dir') {
                output = `zcat: ${target}: Is a directory`;
            } else if (node.type === 'file') {
                const content = (node as any).content || '';
                if (content.startsWith('GZIP_V1:')) {
                    output = content.substring(8); // Strip prefix
                    if (!VFS['/var/run/zcat_solved']) {
                        VFS['/var/run/zcat_solved'] = { type: 'file', content: 'TRUE' };
                        output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: LOG ANALYSIS (COMPRESSED).\x1b[0m`;
                    }
                } else if (target.endsWith('.gz')) {
                     output = `gzip: ${target}: not in gzip format`;
                } else {
                     output = `gzip: ${target}: not in gzip format`;
                }
            }
        }
        break;
    }
    case 'zgrep': {
        if (args.length < 2) {
             output = 'usage: zgrep <pattern> <file>';
        } else {
             const pattern = args[0];
             const target = args[1];
             const node = getNode(resolvePath(cwd, target));
             
             if (!node) {
                 output = `zgrep: ${target}: No such file or directory`;
             } else if (node.type === 'file') {
                 let content: string = (node as any).content || '';
                 if (content.startsWith('GZIP_V1:')) {
                     content = content.substring(8);
                 } else {
                     // Assume plain text if not marked, or fail. Let's fail if it's .gz without marker.
                     if (target.endsWith('.gz')) {
                        content = ''; 
                        output = `gzip: ${target}: not in gzip format`;
                        break;
                     }
                 }
                 
                 const lines = content.split('\n');
                 const matches = lines.filter((l: string) => l.includes(pattern));
                 output = matches.join('\n');
                 
                 if (matches.length > 0 && target.includes('auth.log.2.gz')) {
                     if (!VFS['/var/run/zgrep_solved']) {
                         VFS['/var/run/zgrep_solved'] = { type: 'file', content: 'TRUE' };
                         const runDir = getNode('/var/run');
                         if (runDir && runDir.type === 'dir' && !runDir.children.includes('zgrep_solved')) {
                             runDir.children.push('zgrep_solved');
                         }
                         output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: LOG ANALYSIS (COMPRESSED).\x1b[0m`;
                     }
                 }
             }
        }
        break;
    }
    case 'gunzip': {
        if (args.length < 1) {
            output = 'usage: gunzip <file...>';
        } else {
            const target = args[0];
            const path = resolvePath(cwd, target);
            const node = getNode(path);
            
            if (!node) {
                output = `gunzip: ${target}: No such file or directory`;
            } else if (!target.endsWith('.gz')) {
                output = `gunzip: ${target}: unknown suffix -- ignored`;
            } else if (node.type !== 'file') {
                output = `gunzip: ${target}: Is a directory`;
            } else {
                let content = (node as any).content || '';
                if (content.startsWith('GZIP_V1:')) {
                    content = content.substring(8);
                }
                
                // Create new file
                const newPath = path.slice(0, -3); // remove .gz
                const parentPath = newPath.substring(0, newPath.lastIndexOf('/')) || '/';
                const newName = newPath.substring(newPath.lastIndexOf('/') + 1);
                
                const parentNode = getNode(parentPath);
                if (parentNode && parentNode.type === 'dir') {
                    // Remove old
                    delete VFS[path];
                    const oldName = target.substring(target.lastIndexOf('/') + 1);
                    const idx = parentNode.children.indexOf(oldName);
                    if (idx > -1) parentNode.children.splice(idx, 1);
                    
                    // Add new
                    VFS[newPath] = { type: 'file', content: content, permissions: (node as any).permissions };
                    if (!parentNode.children.includes(newName)) {
                        parentNode.children.push(newName);
                    }
                    
                    output = ''; // Silent success
                } else {
                    output = `gunzip: error creating output file`;
                }
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
    case 'mkfifo': {
        if (args.length < 1) {
            output = 'usage: mkfifo <file>';
        } else {
            const target = args[0];
            const path = resolvePath(cwd, target);
            const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
            const fileName = path.substring(path.lastIndexOf('/') + 1);
            const parentNode = getNode(parentPath);
            
            if (!parentNode || parentNode.type !== 'dir') {
                 output = `mkfifo: cannot create fifo '${target}': No such file or directory`;
            } else if (parentNode.children.includes(fileName)) {
                 output = `mkfifo: cannot create fifo '${target}': File exists`;
            } else {
                 VFS[path] = {
                     type: 'file',
                     content: '',
                     xattrs: { type: 'fifo' }
                 } as any;
                 parentNode.children.push(fileName);
                 output = '';
            }
        }
        break;
    }
    case 'uplink_service': {
        const pipePath = '/tmp/uplink.pipe';
        const pipeNode = getNode(pipePath);
        
        if (!pipeNode) {
            output = `uplink_service: fatal: /tmp/uplink.pipe not found. (Hint: Create it with mkfifo)`;
        } else if (pipeNode.type !== 'file' || !(pipeNode as any).xattrs || (pipeNode as any).xattrs.type !== 'fifo') {
            output = `uplink_service: fatal: /tmp/uplink.pipe is not a FIFO.`;
        } else {
            output = `[SERVICE] Listening on /tmp/uplink.pipe...\n[INFO] Waiting for data stream... (Use redirection > to write)`;
            return { output, newCwd, action: 'delay' };
        }
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
    case 'md5sum': {
       if (args.length < 1) {
          output = 'usage: md5sum <file...>';
       } else {
          output = args.map(arg => {
             // Handle wildcard expansion manually since shell doesn't do it globally yet
             if (arg.includes('*')) {
                 const dirPart = arg.substring(0, arg.lastIndexOf('/') + 1) || './';
                 const pattern = arg.substring(arg.lastIndexOf('/') + 1);
                 
                 const dirPath = resolvePath(cwd, dirPart);
                 const dirNode = getNode(dirPath);
                 
                 if (dirNode && dirNode.type === 'dir') {
                     const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                     const matches = dirNode.children.filter(f => regex.test(f));
                     
                     if (matches.length === 0) return `md5sum: ${arg}: No such file or directory`;
                     
                     return matches.map(f => {
                         const fullPath = dirPath === '/' ? `/${f}` : `${dirPath}/${f}`;
                         const node = getNode(fullPath);
                         if (node && node.type === 'file') {
                             // Mock hashes based on filename/content
                             let hash = '';
                             if (f === 'dump_v2.bin') hash = 'e5d0979f87654321deadbeef00000000';
                             else if (f === 'dump_v1.bin') hash = 'a1b2c3d4e5f67890123456789abcdef0';
                             else if (f === 'dump_v3.bin') hash = 'f0e1d2c3b4a596877890abcdef123456';
                             else {
                                 // Simple hash of content length + name
                                 hash = (node.content.length + f).split('').map(c => c.charCodeAt(0).toString(16)).join('').substring(0, 32).padEnd(32, '0');
                             }
                             return `${hash}  ${f}`;
                         }
                         return '';
                     }).filter(Boolean).join('\n');
                 }
                 return `md5sum: ${arg}: No such file or directory`;
             }

             const path = resolvePath(cwd, arg);
             const node = getNode(path);
             if (!node) return `md5sum: ${arg}: No such file or directory`;
             if (node.type === 'dir') return `md5sum: ${arg}: Is a directory`;
             if (node.type === 'symlink') return `md5sum: ${arg}: Is a symbolic link (not followed)`;
             
             const f = arg.split('/').pop() || arg;
             let hash = '';
             if (f === 'dump_v2.bin') hash = 'e5d0979f87654321deadbeef00000000';
             else if (f === 'dump_v1.bin') hash = 'a1b2c3d4e5f67890123456789abcdef0';
             else if (f === 'dump_v3.bin') hash = 'f0e1d2c3b4a596877890abcdef123456';
             else {
                 hash = ((node as any).content.length + f).split('').map(c => c.charCodeAt(0).toString(16)).join('').substring(0, 32).padEnd(32, '0');
             }
             return `${hash}  ${arg}`;
          }).join('\n');
       }
       break;
    }
    case 'void_crypt': {
        const libPath = ENV_VARS['LD_LIBRARY_PATH'];
        if (!libPath || !libPath.includes('/opt/libs')) {
            output = 'void_crypt: error while loading shared libraries: libvoid.so: cannot open shared object file: No such file or directory';
        } else {
            output = 'Initializing Void Cryptography Engine...\n[LOADING] libvoid.so... OK\n[DECRYPTING] Payload verified.\n\nACCESS KEY: GHOST_ROOT{L1NK3R_P4TH_H4CK3R}';
            VFS['/var/run/void_solved'] = { type: 'file', content: 'TRUE' };
        }
        break;
    }
    case 'php': {
       if (args.length > 0) {
           const file = args[0];
           const node = getNode(resolvePath(cwd, file));
           if (node && node.type === 'file') {
                if (node.content.includes('<?php')) {
                    if (file.includes('shell.php')) {
                        output = 'Flag: GHOST_ROOT{W3B_SH3LL_D3T3CT3D}';
                        if (!VFS['/var/run/webshell_solved']) {
                            VFS['/var/run/webshell_solved'] = { type: 'file', content: 'TRUE' };
                            const runDir = getNode('/var/run');
                            if (runDir && runDir.type === 'dir' && !runDir.children.includes('webshell_solved')) {
                                runDir.children.push('webshell_solved');
                            }
                            output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: WEB SHELL ANALYZED.\x1b[0m`;
                        }
                    } else {
                        output = 'PHP Parse Error: syntax error, unexpected end of file';
                    }
                } else {
                    output = 'Could not open input file: ' + file;
                }
           } else {
               output = 'Could not open input file: ' + file;
           }
       } else if (stdin) {
            output = 'Interactive mode not supported.';
       } else {
           output = 'php: missing operand';
       }
       break;
    }
    case 'sudo': {
      if (args.length < 1) {
        output = 'usage: sudo <command>';
      } else if (args[0] === '-l') {
        output = 'Matching Defaults entries for ghost on ghost-root:\n    env_reset, mail_badpass, secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin\\:/sbin\\:/bin\n\nUser ghost may run the following commands on ghost-root:\n    (root) NOPASSWD: /usr/bin/python3 /opt/admin/restore_service.py';
      } else {
        const fullCmd = args.join(' ');
        const validCmd = '/usr/bin/python3 /opt/admin/restore_service.py';
        
        if (fullCmd.startsWith(validCmd) || fullCmd.startsWith('/opt/admin/restore_service.py')) {
            const scriptArgs = fullCmd.includes(validCmd) 
                ? fullCmd.substring(validCmd.length).trim().split(/\s+/)
                : fullCmd.substring('/opt/admin/restore_service.py'.length).trim().split(/\s+/);
            
            const authCode = scriptArgs[0];
            
            if (!authCode) {
                 output = 'Usage: restore_service.py <auth_code>';
            } else if (authCode === 'OMEGA-7-RED' || authCode === '"OMEGA-7-RED"' || authCode === "'OMEGA-7-RED'") {
                 output = 'System Restoration Sequence Initiated...\n[SUCCESS] Services Restored.\n\nFLAG: GHOST_ROOT{SUD0_PR1V_3SC_SUCC3SS}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: PRIVILEGE ESCALATION.\x1b[0m';
                 return { output, newCwd, action: 'delay' };
            } else {
                 output = 'Access Denied.';
                 return { output, newCwd, action: 'delay' };
            }
        } else {
            output = `[sudo] password for ghost:\n\nghost is not in the sudoers file. This incident will be reported.`;
            return { output, newCwd, action: 'delay' };
        }
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
    case 'export': {
        if (args.length === 0) {
            output = Object.entries(ENV_VARS).map(([k, v]) => `declare -x ${k}="${v}"`).join('\n');
        } else {
            const fullArg = args.join(' ');
            if (fullArg.includes('=')) {
                const eqIndex = fullArg.indexOf('=');
                const key = fullArg.substring(0, eqIndex).trim();
                let val = fullArg.substring(eqIndex + 1).trim();
                
                // Remove quotes
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                
                ENV_VARS[key] = val;
                output = ''; // Silent success
            } else {
                // export VAR (promotes local var to env - simplified: just ignore or set empty)
                // For now, assume user meant VAR=
            }
        }
        break;
    }
    case 'env':
    case 'printenv': {
        if (args.length > 0 && command === 'printenv') {
            const key = args[0];
            output = ENV_VARS[key] || '';
        } else {
            output = Object.entries(ENV_VARS).map(([k, v]) => `${k}=${v}`).join('\n');
        }
        break;
    }
    case 'decipher_v2': {
        // Cycle 48 Puzzle: Shared Library Hijack
        const ldPath = ENV_VARS['LD_LIBRARY_PATH'] || '';
        if (ldPath.includes('/opt/secret_libs')) {
             if (!VFS['/var/run/ld_path_solved']) {
                 VFS['/var/run/ld_path_solved'] = { type: 'file', content: 'TRUE' };
                 const runDir = getNode('/var/run');
                 if (runDir && runDir.type === 'dir' && !runDir.children.includes('ld_path_solved')) {
                     runDir.children.push('ld_path_solved');
                 }
                 output = `[DECIPHER_V2] Loading libraries... OK\n[DECIPHER_V2] Key Found: libcrypto.so.3\n[DECIPHER_V2] Decrypting Payload...\n\nFLAG: GHOST_ROOT{LD_PR3L0AD_M4ST3R}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: SHARED LIBRARY HIJACKED.\x1b[0m`;
             } else {
                 output = `[DECIPHER_V2] Loading libraries... OK\nFLAG: GHOST_ROOT{LD_PR3L0AD_M4ST3R}`;
             }
        } else {
             output = `decipher_v2: error while loading shared libraries: libcrypto.so.3: cannot open shared object file: No such file or directory`;
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
    case 'ln': {
        if (args.length < 2) {
            output = 'usage: ln -s <target> <link_name>';
        } else if (!args[0].startsWith('-s')) {
            output = 'ln: currently only supports symbolic links (-s)';
        } else {
            const force = args[0].includes('f');
            const target = args[1];
            const linkName = args[2];
            
            if (!linkName) {
                output = 'usage: ln -s <target> <link_name>';
            } else {
                const linkPath = resolvePath(cwd, linkName);
                const parentDir = resolvePath(linkPath, '..');
                const fileName = linkPath.split('/').pop();
                
                const parentNode = getNode(parentDir);
                if (!parentNode || parentNode.type !== 'dir') {
                    output = `ln: failed to create symbolic link '${linkName}': No such directory`;
                } else if (parentNode.children.includes(fileName!) && !force) {
                    output = `ln: failed to create symbolic link '${linkName}': File exists`;
                } else {
                    VFS[linkPath] = {
                        type: 'symlink',
                        target: target,
                        permissions: '777'
                    } as any;
                    
                    if (!parentNode.children.includes(fileName!)) {
                        parentNode.children.push(fileName!);
                    }
                    output = ''; 
                }
            }
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
             const isLink = itemNode?.type === 'symlink';
             
             // Permission Logic
             let mode = (itemNode as any).permissions;
             if (!mode) mode = isDir ? '755' : '644';
             if (isLink) mode = '777';
             
             // Normalize to 4 digits (e.g., 755 -> 0755)
             if (mode.length === 3) mode = '0' + mode;
             
             const special = parseInt(mode[0], 10);
             const owner = parseInt(mode[1], 10);
             const group = parseInt(mode[2], 10);
             const other = parseInt(mode[3], 10);

             const rwx = (n: number, s: boolean, char: string = 's') => {
                 const lower = char.toLowerCase();
                 const upper = char.toUpperCase();
                 return (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (s ? (n & 1 ? lower : upper) : (n & 1 ? 'x' : '-'));
             };
             
             const typeChar = isLink ? 'l' : (isDir ? 'd' : '-');
             const pStr = typeChar + 
                          rwx(owner, !!(special & 4)) + 
                          rwx(group, !!(special & 2)) + 
                          rwx(other, !!(special & 1), 't');
             
             const realSize = (itemNode && itemNode.type === 'file') ? itemNode.content.length : (isLink ? 16 : 4096);
             const date = 'Oct 23 14:02'; 
             let name = item;
             if (isDir) name = `${C_BLUE}${item}${C_RESET}`;
             if (isLink) {
                 const target = (itemNode as any).target;
                 // Resolve target to check existence (for red color)
                 // Simplified: If target starts with /, check VFS. If relative, try resolve.
                 let targetPathResolved = target;
                 if (!target.startsWith('/')) {
                     // Very rough relative check
                 }
                 const targetNode = getNode(target);
                 const color = targetNode ? C_CYAN : '\x1b[31m'; // Cyan if valid, Red if broken
                 name = `${color}${item}${C_RESET} -> ${target}`;
             }
             return `${pStr} 1 ghost ghost ${String(realSize).padStart(5)} ${date} ${name}`;
          }).join('\n');
        } else {
          output = items.map(item => {
             const itemPath = targetPath === '/' ? `/${item}` : `${targetPath}/${item}`;
             const itemNode = getNode(itemPath);
             const isLink = itemNode?.type === 'symlink';
             if (isLink) return `${C_CYAN}${item}${C_RESET}`;
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
          } else if (fileNode.type === 'symlink') {
             output = `strings: ${fileTarget}: Is a symbolic link`;
          } else {
             const content = (fileNode as any).content || '';
             const matches = content.match(/[\x20-\x7E]{4,}/g);
             if (matches) {
                 output = matches.join('\n');
                 if (content.includes('GHOST_ROOT{STR1NGS_R3V3AL_TRUTH}')) {
                     if (!VFS['/var/run/strings_solved']) {
                         VFS['/var/run/strings_solved'] = { type: 'file', content: 'TRUE' };
                         const runDir = getNode('/var/run');
                         if (runDir && runDir.type === 'dir' && !runDir.children.includes('strings_solved')) {
                             runDir.children.push('strings_solved');
                         }
                         output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: HIDDEN STRINGS REVEALED.\x1b[0m`;
                     }
                 }
             } else {
                 output = '';
             }
          }
       }
       break;
    }
    case 'recover_tool': {
        output = `[RECOVERY] Initializing...\n[ERROR] SEGMENTATION FAULT (core dumped)\n[SYSTEM] Memory dump saved to /var/crash/recover_tool.core`;
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
                        output = (entryNode as any).content || 'Error: Cannot read content.';
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
    case 'date': {
        if (args.length > 0 && args[0] === '-s') {
            const isRoot = !!getNode('/tmp/.root_session');
            if (!isRoot) {
                output = 'date: cannot set date: Operation not permitted';
            } else {
                output = 'Thu Feb 12 09:00:00 UTC 2026';
                SYSTEM_TIME_OFFSET = 0; // Fix time
            }
        } else {
            const now = Date.now() + SYSTEM_TIME_OFFSET;
            output = new Date(now).toString();
        }
        break;
    }
    case 'ntpdate': {
        const isRoot = !!getNode('/tmp/.root_session');
        if (!isRoot) {
            output = 'ntpdate: bind() fails: Permission denied';
        } else {
            if (args.length < 1) {
                output = 'usage: ntpdate <server>';
            } else {
                output = `ntpdate: step time server ${args[0]} offset ${Math.abs(SYSTEM_TIME_OFFSET) / 1000} sec`;
                SYSTEM_TIME_OFFSET = 0; // Fix time
            }
        }
        break;
    }
    case 'rdate': {
        const isRoot = !!getNode('/tmp/.root_session');
        if (!isRoot) {
            output = 'rdate: Permission denied';
        } else {
            if (args.length < 1) {
                output = 'usage: rdate <host>';
            } else {
                output = `[rdate] Time synced with ${args[0]}`;
                SYSTEM_TIME_OFFSET = 0;
            }
        }
        break;
    }
    case 'whoami':
      output = 'ghost';
      break;
    case 'arp': {
      const arpNode = getNode('/proc/net/arp');
      if (arpNode) output = (arpNode as any).content;
      else output = 'arp: /proc/net/arp: No such file';
      break;
    }
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
DROP       tcp  --  10.10.99.1           anywhere             tcp dpt:ssh
DROP       icmp --  10.10.99.1           anywhere
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
          const mode = args[0];
          const target = args[1];
          const path = resolvePath(cwd, target);
          const node = getNode(path);

          if (!node) {
              output = `chmod: cannot access '${target}': No such file or directory`;
          } else {
              // Basic numeric mode validation (e.g., 755, 644, 400)
              if (/^[0-7]{3,4}$/.test(mode)) {
                  let newMode = mode;
                  if (mode.length === 3) newMode = '0' + mode;
                  
                  // In a real system, only owner can chmod. Here we assume ghost owns everything in /home/ghost,
                  // but maybe we simulate permission error for system files.
                  const isSystemFile = path.startsWith('/bin') || path.startsWith('/usr') || path.startsWith('/etc') || path === '/';
                  const isRoot = !!getNode('/tmp/.root_session');

                  if (isSystemFile && !isRoot) {
                      output = `chmod: changing permissions of '${target}': Operation not permitted`;
                  } else {
                      // Apply permission
                      (node as any).permissions = newMode;
                      output = ''; // Silent success
                  }
              } else if (mode === 'u+s' || mode === '+s') {
                   let current = (node as any).permissions || ((node.type === 'dir') ? '0755' : '0644');
                   if (current.length === 3) current = '0' + current;
                   
                   const isSystemFile = path.startsWith('/bin') || path.startsWith('/usr') || path.startsWith('/etc') || path === '/';
                   const isRoot = !!getNode('/tmp/.root_session');
                   
                   if (isSystemFile && !isRoot) {
                       output = `chmod: changing permissions of '${target}': Operation not permitted`;
                   } else {
                       let special = parseInt(current[0], 10);
                       special |= 4; // Set SUID bit
                       (node as any).permissions = special.toString() + current.slice(1);
                       output = '';
                   }
              } else if (mode === 'u-s' || mode === '-s') {
                   let current = (node as any).permissions || ((node.type === 'dir') ? '0755' : '0644');
                   if (current.length === 3) current = '0' + current;
                   
                   const isSystemFile = path.startsWith('/bin') || path.startsWith('/usr') || path.startsWith('/etc') || path === '/';
                   const isRoot = !!getNode('/tmp/.root_session');

                   if (isSystemFile && !isRoot) {
                       output = `chmod: changing permissions of '${target}': Operation not permitted`;
                   } else {
                       let special = parseInt(current[0], 10);
                       special &= ~4; // Clear SUID bit
                       (node as any).permissions = special.toString() + current.slice(1);
                       output = '';
                   }
              } else if (mode === '+t' || mode === 'o+t') {
                   let current = (node as any).permissions || ((node.type === 'dir') ? '0755' : '0644');
                   if (current.length === 3) current = '0' + current;
                   
                   const isRoot = !!getNode('/tmp/.root_session');
                   // Allow chmod on /tmp specifically for this puzzle
                   if (path === '/tmp' || isRoot) {
                       let special = parseInt(current[0], 10);
                       special |= 1; // Set Sticky bit
                       (node as any).permissions = special.toString() + current.slice(1);
                       output = '';
                   } else {
                       output = `chmod: changing permissions of '${target}': Operation not permitted`;
                   }
              } else {
                  output = `chmod: invalid mode: '${mode}'`;
              }
          }
       }
       break;
    }
    case 'lsattr': {
        if (args.length < 1) {
            output = 'usage: lsattr <file>';
        } else {
            const target = args[0];
            const path = resolvePath(cwd, target);
            const node = getNode(path);
            
            if (!node) {
                output = `lsattr: cannot access '${target}': No such file or directory`;
            } else {
                const attrs = FILE_ATTRIBUTES[path] || [];
                const attrStr = attrs.includes('i') ? '----i---------e----' : '-------------------';
                output = `${attrStr} ${target}`;
            }
        }
        break;
    }
    case 'chmod': {
       if (args.length < 2) {
           output = 'usage: chmod <mode> <file>';
       } else {
           const mode = args[0];
           const target = args[1];
           const filePath = resolvePath(cwd, target);
           const node = getNode(filePath);
           
           if (!node) {
               output = `chmod: cannot access '${target}': No such file or directory`;
           } else {
               let newPerms = (node as any).permissions || '0755';
               
               // Symbolic mode support (simplified)
               if (mode === '+t') {
                   // Add sticky bit (1xxx)
                   if (newPerms.length === 4) {
                       newPerms = '1' + newPerms.slice(1);
                   } else {
                       newPerms = '1' + newPerms;
                   }
               } else if (mode === '-t') {
                   // Remove sticky bit
                   if (newPerms.length === 4 && newPerms.startsWith('1')) {
                       newPerms = '0' + newPerms.slice(1);
                   }
               } else if (/^[0-7]{3,4}$/.test(mode)) {
                   // Octal mode
                   newPerms = mode.length === 3 ? '0' + mode : mode;
               }
               
               (node as any).permissions = newPerms;
               output = ''; // Silent success
           }
       }
       break;
    }
    case 'chattr': {
        if (args.length < 2) {
            output = 'usage: chattr [-+=][mode] <file>';
        } else {
            const modeStr = args[0];
            const target = args[1];
            const path = resolvePath(cwd, target);
            const node = getNode(path);
            
            if (!node) {
                output = `chattr: cannot access '${target}': No such file or directory`;
            } else {
                const isRoot = !!getNode('/tmp/.root_session');
                if (!isRoot) {
                    output = `chattr: changing attributes of '${target}': Operation not permitted (Root Required)`;
                } else {
                    const op = modeStr[0];
                    const flag = modeStr[1];
                    
                    if (['+', '-', '='].includes(op) && flag === 'i') {
                        const currentAttrs = FILE_ATTRIBUTES[path] || [];
                        if (op === '+') {
                            if (!currentAttrs.includes('i')) currentAttrs.push('i');
                        } else if (op === '-') {
                            const idx = currentAttrs.indexOf('i');
                            if (idx !== -1) currentAttrs.splice(idx, 1);
                        } else if (op === '=') {
                            currentAttrs.length = 0;
                            currentAttrs.push('i');
                        }
                        FILE_ATTRIBUTES[path] = currentAttrs;
                        output = '';
                    } else {
                        output = `chattr: invalid mode: '${modeStr}'`;
                    }
                }
            }
        }
        break;
    }
    case 'backup_service': {
        output = '[SYSTEM] Starting Backup Service (PID: 7777)...\n[BACKUP] Processing /var/backups/incoming...\n';
        
        const incomingPath = '/var/backups/incoming';
        const incomingNode = getNode(incomingPath);
        
        if (!incomingNode || incomingNode.type !== 'dir') {
            output += '[ERROR] Backup directory missing.';
            return { output, newCwd, action: 'delay' };
        }

        const files = incomingNode.children;
        output += `[BACKUP] Found ${files.length} files.\n`;
        
        // Check for Wildcard Injection
        // We look for strict filenames that tar interprets as flags
        const checkpoint = files.find(f => f === '--checkpoint=1');
        const actionFile = files.find(f => f.startsWith('--checkpoint-action=exec='));
        
        if (checkpoint && actionFile) {
            output += `[TAR] --checkpoint=1 detected.\n`;
            const cmd = actionFile.split('=')[2]; // exec=sh exploit.sh -> sh exploit.sh
            output += `[TAR] Executing checkpoint action: ${cmd}\n`;
            
            if (cmd.startsWith('sh')) {
                const scriptName = cmd.split(' ')[1];
                if (files.includes(scriptName)) {
                     const scriptNode = getNode(`${incomingPath}/${scriptName}`);
                     if (scriptNode && scriptNode.type === 'file') {
                         output += `[SHELL] Executing ${scriptName}...\n`;
                         const scriptContent = scriptNode.content;
                         
                         // Check if the script attempts to read the flag
                         if (scriptContent.includes('cat /root/wildcard_flag.txt') || scriptContent.includes('cp /root/wildcard_flag.txt')) {
                             output += `[OUTPUT] GHOST_ROOT{W1LDC4RD_1NJ3CT10N_M4ST3R}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: WILDCARD INJECTION.\x1b[0m`;
                             
                             if (!VFS['/var/run/wildcard_solved']) {
                                 VFS['/var/run/wildcard_solved'] = { type: 'file', content: 'TRUE' };
                                 const runDir = getNode('/var/run');
                                 if (runDir && runDir.type === 'dir' && !runDir.children.includes('wildcard_solved')) {
                                     runDir.children.push('wildcard_solved');
                                 }
                             }
                         } else {
                             output += `[OUTPUT] (Script executed but did not target the flag. Check path: /root/wildcard_flag.txt)`;
                         }
                     }
                } else {
                    output += `[ERROR] Script ${scriptName} not found.`;
                }
            } else {
                 output += `[ERROR] Checkpoint action must use 'sh'.`;
            }
        } else {
            output += `[BACKUP] Archiving to /dev/null... Done.`;
        }
        return { output, newCwd, action: 'delay' };
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
  ssh, ssh-keygen, ping, netstat, ss, nmap, nc, scan, netmap, trace, traceroute, wifi, telnet, curl, nslookup, dig, irc, tcpdump, tor, wget, geoip

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
          case 'beacon': output = 'NAME\n\tbeacon - Automated Dead Drop Signal\n\nSYNOPSIS\n\tbeacon [&]\n\nDESCRIPTION\n\tContinuously attempts to connect to a listening post on localhost:4444 to deliver a payload.\n\nUSAGE\n\tRun "beacon" to start foreground process (will block).\n\tRun "beacon &" to start in background.'; break;
          case 'docker': output = 'NAME\n\tdocker - Docker container management\n\nSYNOPSIS\n\tdocker [OPTIONS] COMMAND\n\nDESCRIPTION\n\tManage containers, images, and volumes.\n\nCOMMANDS\n\tps\tList containers\n\tinspect\tReturn low-level information on Docker objects\n\tlogs\tFetch the logs of a container\n\tstop\tStop one or more running containers'; break;
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
    case 'mkfifo': {
        if (args.length < 1) {
            output = 'usage: mkfifo <path>';
        } else {
            const pipePath = resolvePath(cwd, args[0]);
            const pipeParent = pipePath.substring(0, pipePath.lastIndexOf('/')) || '/';
            const pipeName = pipePath.substring(pipePath.lastIndexOf('/') + 1);
            
            if (!getNode(pipeParent)) {
                output = `mkfifo: cannot create fifo '${args[0]}': No such file or directory`;
            } else if (getNode(pipePath)) {
                output = `mkfifo: cannot create fifo '${args[0]}': File exists`;
            } else {
                VFS[pipePath] = { 
                    type: 'file', 
                    content: '', 
                    permissions: '0644',
                    fileType: 'fifo' 
                } as any;
                addChild(pipeParent, pipeName);
                
                // Check if this solves Cycle 54 (if created in correct location)
                if (pipePath === '/tmp/uplink.pipe') {
                    output = `[SYSTEM] Named Pipe Created: ${pipePath}\n[HINT] Now run the service that listens to this pipe: 'uplink_service'`;
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
    case 'fsck': {
       // Parse args better to handle flags like -b 32768
       const hasBackupFlag = args.includes('-b') && (args.includes('32768') || args.includes('8193'));
       const dev = args.find(a => a.startsWith('/dev/')) || args[args.length - 1];

       if (!dev) {
           output = 'usage: fsck [-b superblock] <device>';
       } else if (dev === '/dev/sdb1') {
               const runDir = getNode('/var/run');
               const isFixed = runDir && runDir.type === 'dir' && runDir.children.includes('sdb1_fixed');
               
               if (isFixed) {
                   output = `fsck from util-linux 2.34\n${dev}: clean, 11/65536 files, 7963/262144 blocks`;
               } else {
                   output = `fsck from util-linux 2.34\ne2fsck 1.45.5 (07-Jan-2020)\n${dev}: recovering journal\n${dev}: contains a file system with errors, check forced.\nPass 1: Checking inodes, blocks, and sizes\nPass 2: Checking directory structure\nPass 3: Checking directory connectivity\nPass 4: Checking reference counts\nPass 5: Checking group summary information\n\n${dev}: ***** FILE SYSTEM WAS MODIFIED *****\n${dev}: 11/65536 files (0.0% non-contiguous), 7963/262144 blocks`;
                   
                   if (runDir && runDir.type === 'dir') {
                       VFS['/var/run/sdb1_fixed'] = { type: 'file', content: 'TRUE' };
                       runDir.children.push('sdb1_fixed');
                   }
                   
                   // Mission Update
                   if (!VFS['/var/run/fsck_solved']) {
                       VFS['/var/run/fsck_solved'] = { type: 'file', content: 'TRUE' };
                       if (runDir && runDir.type === 'dir' && !runDir.children.includes('fsck_solved')) {
                           (runDir as any).children.push('fsck_solved');
                       }
                       output += '\n\x1b[1;32m[MISSION UPDATE] Objective Complete: FILESYSTEM REPAIRED.\x1b[0m';
                   }
               }
           } else if (dev === '/dev/sdc1') {
               // Cycle 76: Bad Superblock
               if (hasBackupFlag) {
                  output = `fsck from util-linux 2.34\ne2fsck 1.45.5 (07-Jan-2020)\n${dev}: recovering journal\n${dev}: clean, 11/65536 files, 7963/262144 blocks`;
                  VFS['/var/run/sdc1_fixed'] = { type: 'file', content: 'TRUE' };
                  addChild('/var/run', 'sdc1_fixed');
               } else {
                  output = `fsck from util-linux 2.34\ne2fsck 1.45.5 (07-Jan-2020)\nfsck.ext4: Bad magic number in super-block while trying to open ${dev}\n\nThe superblock could not be read or does not describe a valid ext2/ext3/ext4 filesystem. If the device is valid and it really contains an ext2/ext3/ext4 filesystem (and not swap or ufs or something else), then the superblock is corrupt, and you might try running e2fsck with an alternate superblock:\n    e2fsck -b 8193 <device>\n or\n    e2fsck -b 32768 <device>`;
               }
           } else {
               output = `fsck from util-linux 2.34\nfsck: error: ${dev}: No such file or directory`;
           }
       break;
    }
    case 'lsblk': {
        const mounts = MOUNTED_DEVICES;
        output = 'NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT\n';
        output += `sda      8:0    0 256G  0 disk \n`;
        output += `└─sda1   8:1    0 256G  0 part /\n`;
        output += `sdb      8:16   0   1G  0 disk \n`;
        output += `└─sdb1   8:17   0   1G  0 part ${mounts['/dev/sdb1'] || ''}\n`;
        output += `sdc      8:32   0  64G  0 disk \n`;
        output += `└─sdc1   8:33   0  64G  0 part ${mounts['/dev/sdc1'] || ''}\n`;
        output += `loop0    7:0    0 512M  0 loop ${mounts['/dev/loop0'] || ''}`;
        break;
    }
    case 'mount': {
       // HANDLE REMOUNT
       if (args.includes('-o') && (args.includes('remount,rw') || args.includes('rw,remount'))) {
           const target = args[args.length - 1];
           const resolved = resolvePath(cwd, target);
           let found = false;
           // Check if it's a known mount point
           for (const mp of Object.keys(MOUNT_OPTIONS)) {
               if (mp === resolved || resolved.startsWith(mp)) {
                   MOUNT_OPTIONS[mp] = 'rw,relatime';
                   found = true;
               }
           }
           
           if (found) {
               output = ''; // Silent success
           } else {
               output = `mount: ${target}: mount point not found`;
           }
       } else if (args.length === 0) {
           output = '/dev/sda1 on / type ext4 (rw,relatime)\nproc on /proc type proc (rw,nosuid,nodev,noexec,relatime)\nsysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)\ntmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime,size=815276k,mode=755)\n';
           
           // List tracked mounts
           const printed = new Set<string>();
           for (const [mp, opts] of Object.entries(MOUNT_OPTIONS)) {
               let device = 'none';
               for (const [d, m] of Object.entries(MOUNTED_DEVICES)) {
                   if (m === mp) device = d;
               }
               output += `${device} on ${mp} type ext4 (${opts})\n`;
               printed.add(mp);
           }
           
           // List legacy mounts not in options
           for (const [dev, mp] of Object.entries(MOUNTED_DEVICES)) {
               if (!printed.has(mp)) {
                   output += `${dev} on ${mp} type vfat (rw)\n`;
               }
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
               
               if (!VFS['/var/run/hidden_vol_mounted']) {
                   VFS['/var/run/hidden_vol_mounted'] = { type: 'file', content: 'TRUE' };
                   const runDir = getNode('/var/run');
                   if (runDir && runDir.type === 'dir' && !runDir.children.includes('hidden_vol_mounted')) {
                       runDir.children.push('hidden_vol_mounted');
                   }
                   output = `mount: /dev/sdb1 mounted on ${target}.\n\x1b[1;32m[MISSION UPDATE] Objective Complete: HIDDEN VOLUME MOUNTED.\x1b[0m`;
               } else {
                   output = `mount: /dev/sdb1 mounted on ${target}.`;
               }
           } else if (source === '/dev/vault') {
               if (LOADED_MODULES.includes('cryptex')) {
                   MOUNTED_DEVICES[source] = target;
                   VFS[`${target}/classified_intel.txt`] = { type: 'file', content: 'TOP SECRET\n\nTarget: OMEGA\nStatus: VULNERABLE\nAccess Point: 10.10.99.1\nProtocol: SSH\nCredentials: [REDACTED]\n(Hint: Check /var/backups/lost+found for a key)' };
                   VFS[`${target}/mission_09.enc`] = { type: 'file', content: 'U2FsdGVkX19+...' };
                   addChild(target, 'classified_intel.txt');
                   addChild(target, 'mission_09.enc');
                   output = `mount: /dev/vault mounted on ${target}.`;
               } else {
                   output = `mount: /dev/vault: unknown filesystem type 'cryptex_fs'`;
               }
           } else if (source === '/dev/sdc1') {
               // Cycle 76: Bad Superblock Logic
               const isFixed = getNode('/var/run/sdc1_fixed');
               if (!isFixed) {
                   output = `mount: wrong fs type, bad option, bad superblock on /dev/sdc1, missing codepage or helper program, or other error.`;
               } else {
                   MOUNTED_DEVICES[source] = target;
                   VFS[`${target}/backup.tar.gz`] = { type: 'file', content: 'GHOST_ROOT{B4D_SUp3RBL0CK_R3C0V3R3D}' };
                   addChild(target, 'backup.tar.gz');
                   output = `mount: /dev/sdc1 mounted on ${target}.`;
               }
           } else if (source === '/dev/loop0') {
               MOUNTED_DEVICES[source] = target;
               VFS[`${target}/shadow_archive.tar`] = { type: 'file', content: 'GHOST_ROOT{L00P_D3V1C3_M0UNT3D}' };
               addChild(target, 'shadow_archive.tar');
               
               // Mission Update
               if (!VFS['/var/run/loop_solved']) {
                   VFS['/var/run/loop_solved'] = { type: 'file', content: 'TRUE' };
                   const runDir = getNode('/var/run');
                   if (runDir && runDir.type === 'dir' && !runDir.children.includes('loop_solved')) {
                       runDir.children.push('loop_solved');
                   }
                   output = `mount: /dev/loop0 mounted on ${target}.\n\x1b[1;32m[MISSION UPDATE] Objective Complete: UNMOUNTED PARTITION ACCESS.\x1b[0m`;
               } else {
                   output = `mount: /dev/loop0 mounted on ${target}.`;
               }
           } else {
               output = `mount: ${source}: special device does not exist`;
           }
       }
       break;
    }
    case 'sysctl': {
        if (args.length === 0) {
            output = 'usage: sysctl [-n] [-e] variable ...';
        } else if (args[0] === '-a') {
            const val = (getNode('/proc/sys/net/ipv4/ip_forward') as any)?.content || '0';
            output = `kernel.hostname = ghost-root\nnet.ipv4.ip_forward = ${val}\nvm.swappiness = 60\nfs.file-max = 100000`;
        } else if (args[0] === '-w') {
            const assignment = args[1];
            if (!assignment || !assignment.includes('=')) {
                output = 'sysctl: cannot stat /proc/sys/' + (assignment || '') + ': No such file or directory';
            } else {
                const parts = assignment.split('=');
                const key = parts[0];
                const val = parts[1];
                
                if (key === 'net.ipv4.ip_forward') {
                    const node = getNode('/proc/sys/net/ipv4/ip_forward');
                    if (node && node.type === 'file') {
                        node.content = val;
                        output = `${key} = ${val}`;
                    } else {
                         // Should exist due to init
                         output = `sysctl: cannot stat /proc/sys/${key}: No such file or directory`;
                    }
                } else {
                    output = `sysctl: cannot stat /proc/sys/${key}: No such file or directory`;
                }
            }
        } else {
            // Read variable or handle assignment without -w (common alias)
            const arg = args[0];
            if (arg.includes('=')) {
                const parts = arg.split('=');
                const key = parts[0];
                const val = parts[1];
                if (key === 'net.ipv4.ip_forward') {
                    const node = getNode('/proc/sys/net/ipv4/ip_forward');
                    if (node && node.type === 'file') {
                        node.content = val;
                        output = `${key} = ${val}`;
                    }
                } else {
                    output = `sysctl: cannot stat /proc/sys/${key}: No such file or directory`;
                }
            } else if (arg === 'net.ipv4.ip_forward') {
                const val = (getNode('/proc/sys/net/ipv4/ip_forward') as any)?.content || '0';
                output = `${arg} = ${val}`;
            } else {
                output = `sysctl: cannot stat /proc/sys/${arg}: No such file or directory`;
            }
        }
        break;
    }
    case 'ldd': {
        if (args.length < 1) {
            output = 'usage: ldd <binary>';
        } else {
            const target = args[0];
            const node = getNode(resolvePath(cwd, target));
            
            if (!node || node.type !== 'file') {
                 output = `ldd: ${target}: No such file`;
            } else {
                if (target.includes('quantum_calc')) {
                    const ldPath = ENV_VARS['LD_LIBRARY_PATH'] || '';
                    const libFound = ldPath.includes('/opt/libs');
                    
                    output = `\tlinux-vdso.so.1 (0x00007ffc5b1e3000)
\tlibquantum.so.1 => ${libFound ? '/opt/libs/libquantum.so.1 (0x00007f8b9c2a1000)' : 'not found'}
\tlibc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f8b9c0af000)
\t/lib64/ld-linux-x86-64.so.2 (0x00007f8b9c2b5000)`;
                } else if ((node as any).content.includes('BINARY_ELF')) {
                    output = `\tlinux-vdso.so.1 (0x00007ffc5b1e3000)
\tlibc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f8b9c0af000)
\t/lib64/ld-linux-x86-64.so.2 (0x00007f8b9c2b5000)`;
                } else {
                    output = `\tnot a dynamic executable`;
                }
            }
        }
        break;
    }
    case 'quantum_calc': {
        const ldPath = ENV_VARS['LD_LIBRARY_PATH'] || '';
        if (ldPath.includes('/opt/libs')) {
             output = `[QUANTUM_CALC] Initializing...\n[OK] Library loaded.\n[CALC] Result: 42\n\nFLAG: GHOST_ROOT{LD_L1BR4RY_P4TH_F1X}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: SHARED LIBRARY LINKED.\x1b[0m`;
             
             if (!VFS['/var/run/ldd_solved']) {
                 VFS['/var/run/ldd_solved'] = { type: 'file', content: 'TRUE' };
                 const runDir = getNode('/var/run');
                 if (runDir && runDir.type === 'dir' && !runDir.children.includes('ldd_solved')) {
                     runDir.children.push('ldd_solved');
                 }
             }
        } else {
             output = `quantum_calc: error while loading shared libraries: libquantum.so.1: cannot open shared object file: No such file or directory`;
        }
        break;
    }
    case 'ghost_update': {
       const lockFile = '/var/lib/dpkg/lock-frontend';
       if (getNode(lockFile)) {
           output = 'E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 1234 (unattended-upgr).\nE: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), is another process using it?';
       } else {
           output = 'Hit:1 http://security.ghost.network/ghost-bionic InRelease\nGet:2 http://archive.ghost.network/ghost-bionic-updates InRelease [88.7 kB]\nFetching updates... [100%]\nInstalling patches...\nProcessing triggers for man-db (2.8.3-2ubuntu0.1) ...\nSetting up ghost-security (1.2.3) ...\nUpdate Complete.\n\nFLAG: GHOST_ROOT{L0CK_F1L3_R3M0V3D}';
           
           // Mission Update
           if (!VFS['/var/run/update_solved']) {
               VFS['/var/run/update_solved'] = { type: 'file', content: 'TRUE' };
               const runDir = getNode('/var/run');
               if (runDir && runDir.type === 'dir' && !runDir.children.includes('update_solved')) {
                   runDir.children.push('update_solved');
               }
               output += '\n\x1b[1;32m[MISSION UPDATE] Objective Complete: SYSTEM UPDATED.\x1b[0m';
           }
       }
       break;
    }
    case 'recover_data': {
       if (MOUNT_OPTIONS['/mnt/data'] && MOUNT_OPTIONS['/mnt/data'].includes('ro')) {
           output = '[INFO] Initializing recovery sequence...\n[INFO] Target: /mnt/data/secure_store.bin\n[ERROR] Write failed. Check filesystem permissions or mount status.';
       } else {
           output = '[INFO] Initializing recovery sequence...\n[INFO] Target: /mnt/data/secure_store.bin\n[SUCCESS] Data recovered.\n\nGHOST_ROOT{M0UNT_RW_SUCC3SS}';
           VFS['/mnt/data/secure_store.bin'] = { type: 'file', content: 'GHOST_ROOT{M0UNT_RW_SUCC3SS}' };
           addChild('/mnt/data', 'secure_store.bin');
           
           // Mission Update: Flag
           if (!VFS['/var/run/mount_solved']) {
              VFS['/var/run/mount_solved'] = { type: 'file', content: 'TRUE' };
              addChild('/var/run', 'mount_solved');
              output += '\n\x1b[1;32m[MISSION UPDATE] Objective Complete: READ-ONLY MOUNT BYPASSED.\x1b[0m';
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
               if (node && node.type === 'dir') {
                   // Cycle 83: The Over-Mounted Directory
                   if (target === '/mnt/secret') {
                       // Reveal the hidden content underneath
                       node.children = ['blueprint_fragment_3.enc', 'read_me.txt'];
                       VFS[`${target}/blueprint_fragment_3.enc`] = { type: 'file', content: 'GHOST_ROOT{H1DD3N_M0UNT_R3V3AL3D}' };
                       VFS[`${target}/read_me.txt`] = { type: 'file', content: 'WARNING: This directory was used as a mount point to hide this data.\n' };
                       
                       // Mission Update
                       if (!VFS['/var/run/overmount_solved']) {
                           VFS['/var/run/overmount_solved'] = { type: 'file', content: 'TRUE' };
                           const runDir = getNode('/var/run');
                           if (runDir && runDir.type === 'dir' && !runDir.children.includes('overmount_solved')) {
                               runDir.children.push('overmount_solved');
                           }
                           output = `umount: ${target} unmounted.\n\x1b[1;32m[MISSION UPDATE] Objective Complete: OVER-MOUNTED DIRECTORY EXPOSED.\x1b[0m`;
                       } else {
                           output = `umount: ${target} unmounted.`;
                       }
                   } else {
                       // Standard unmount clears the directory (simulating empty mount point)
                       node.children = [];
                   }
               }
           } else {
               output = `umount: ${target}: not mounted`;
           }
       }
       break;
    }
    case 'vi':
    case 'vim':
    case 'nano': {
        if (args.length < 1) {
            output = `usage: ${command} <file>`;
        } else {
            const fileName = args[0];
            
            // Cycle 84: Restricted Shell Escape
            // Solution: vi -c ':!/bin/bash' or similar
            // We check args for the escape sequence
            const cmdStr = args.join(' ');
            if (cmdStr.includes('!/bin/bash') || cmdStr.includes('!bash') || cmdStr.includes('!/bin/sh')) {
                 if (ENV_VARS['RESTRICTED_SHELL'] === '1') {
                     ENV_VARS['RESTRICTED_SHELL'] = '0';
                     output = `[EDITOR] Shell Escape Detected.\n[SHELL] Executing command: /bin/bash\n[SUCCESS] Restricted Mode Deactivated.\n\nFLAG: GHOST_ROOT{RBASH_3SC4P3_V1_M0D3}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: RESTRICTED SHELL ESCAPE.\x1b[0m`;
                     
                     if (!VFS['/var/run/rbash_solved']) {
                         VFS['/var/run/rbash_solved'] = { type: 'file', content: 'TRUE' };
                         const runDir = getNode('/var/run');
                         if (runDir && runDir.type === 'dir' && !runDir.children.includes('rbash_solved')) {
                             runDir.children.push('rbash_solved');
                         }
                     }
                     return { output, newCwd: '/home/restricted', newPrompt: 'restricted@server:~$ ', action: 'delay' };
                 }
            }

            return { output: '', newCwd, action: 'edit_file', data: { file: fileName } };
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
        // Resolve Target Host
        let userPart = 'root';
        let hostPart = target;
        if (target.includes('@')) {
            const split = target.split('@');
            userPart = split[0];
            hostPart = split[1];
        }

        const hosts: Record<string, string> = {
            'black-site.remote': '10.10.99.1',
            '10.10.99.1': '10.10.99.1',
            '192.168.1.99': '10.10.99.1', // Redirect to Black Site logic
            'admin-pc': '192.168.1.5',
            '192.168.1.5': '192.168.1.5',
            'backup-server': '192.168.1.50',
            '192.168.1.50': '192.168.1.50',
            '192.168.1.110': '192.168.1.110'
        };
        
        const etcHosts = getNode('/etc/hosts');
        if (etcHosts && etcHosts.type === 'file') {
            const lines = etcHosts.content.split('\n');
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2 && !line.trim().startsWith('#')) {
                    hosts[parts[1]] = parts[0];
                }
            }
        }
        
        const resolvedIP = hosts[hostPart] || hostPart;

        // PERMISSION CHECK LOGIC (Identity File)
        if (identityFile) {
            const keyPath = resolvePath(cwd, identityFile);
            const keyNode = getNode(keyPath);
            if (!keyNode || keyNode.type !== 'file') {
                output = `Warning: Identity file ${identityFile} not accessible: No such file or directory.`;
                return { output, newCwd, action: 'delay' };
            }

            // Check permissions (default to 644 if missing, which fails)
            const perms = (keyNode as any).permissions || '644';
            const group = parseInt(perms[1], 10);
            const other = parseInt(perms[2], 10);

            if (group > 0 || other > 0) {
                output = `Permissions 0${perms} for '${identityFile}' are too open.\nIt is required that your private key files are NOT accessible by others.\nThis private key will be ignored.\nLoad key "${identityFile}": bad permissions`;
                return { output, newCwd, action: 'delay' };
            }
        }

        if (resolvedIP === '10.10.99.1') {
             const firewallFlushed = !!getNode('/var/run/firewall_flushed');
             const routeAdded = !!getNode('/var/run/route_added');
             
             if (!routeAdded) {
                 output = `ssh: connect to host ${hostPart} port 22: Network is unreachable`;
                 return { output, newCwd, action: 'delay' };
             }

             if (!firewallFlushed) {
                 output = `ssh: connect to host ${hostPart} port 22: Connection timed out\n(Hint: Check firewall rules)`;
                 return { output, newCwd, action: 'delay' };
             }

             let hasKey = false;
             if (identityFile) {
                 const keyPath = resolvePath(cwd, identityFile);
                 const keyNode = getNode(keyPath);
                 if (keyNode && keyNode.type === 'file' && (keyNode.content.includes('KEY_ID: BLACK_SITE_ACCESS_V1') || keyNode.content.includes('KEY_ID: GHOST_PROTOCOL_INIT_V2'))) {
                     hasKey = true;
                 }
             }
             if (hasKey) {
                 output = `Connecting to ${hostPart}...\n[BLACK SITE TERMINAL]\nWARNING: You are being watched.\n\x1b[1;32m[MISSION UPDATE] Objective Complete: BLACK SITE INFILTRATED.\x1b[0m`;
                 newCwd = '/remote/black-site/root';
                 if (!getNode('/remote/black-site/root')) {
                     VFS['/remote/black-site'] = { type: 'dir', children: ['root'] };
                     VFS['/remote/black-site/root'] = { type: 'dir', children: ['FLAG.txt'] };
                     VFS['/remote/black-site/root/FLAG.txt'] = { type: 'file', content: 'GHOST_ROOT{PR1V4T3_K3Y_ACQU1R3D}' };
                 }
                 return { output, newCwd, action: 'delay', newPrompt: 'root@black-site#' };
             } else {
                 output = `Connecting to ${hostPart}...\nPermission denied (publickey).\n(Hint: You need a valid key file.)`;
                 return { output, newCwd, action: 'delay' };
             }
        } else if (resolvedIP === '192.168.1.50') {
             let hasKey = false;
             if (identityFile) {
                 const keyPath = resolvePath(cwd, identityFile);
                 const keyNode = getNode(keyPath);
                 if (keyNode && keyNode.type === 'file' && keyNode.content.includes('KEY_ID: ADMIN_BACKUP_V1')) {
                     hasKey = true;
                 }
             }
             if (hasKey) {
                 output = `Connecting to backup-server (192.168.1.50)...\nWelcome to Ubuntu 20.04.2 LTS (GNU/Linux 5.4.0-72-generic x86_64)\n\n * Documentation:  https://help.ubuntu.com\n * Management:     https://landscape.canonical.com\n * Support:        https://ubuntu.com/advantage\n\nLast login: Tue Feb 10 03:00:01 2026 from 192.168.1.5`;
                 newCwd = '/remote/backup-server/home'; 
                 return { output, newCwd, action: 'delay', newPrompt: 'backup@server:~$ ' };
             } else {
                 output = `Connecting to ${hostPart}...\nPermission denied (publickey).`;
                 return { output, newCwd, action: 'delay' };
             }
        } else if (resolvedIP === '192.168.1.5') {
             if (userPart === 'restricted') {
                 output = `Connecting to ${hostPart}...\nWarning: Permanently added '${hostPart}' (ECDSA) to the list of known hosts.\nrestricted@${hostPart}'s password: \n\nWelcome to Restricted Shell (rbash).\nNOTE: You are in a jailed environment. Many commands are disabled.`;
                 ENV_VARS['RESTRICTED_SHELL'] = '1';
                 return { output, newCwd: '/home/restricted', newPrompt: 'restricted@server:~$ ', action: 'delay' };
             }
             output = `Connecting to ${hostPart}...\nPermission denied (publickey).\n(Hint: Try cracking the 'backup' or 'restricted' user)`;
             return { output, newCwd, action: 'delay' };
        } else if (resolvedIP === '192.168.1.110') {
             output = `Connecting to ${hostPart}...\nHP JetDirect J4169A\nFirmware: V.2026.02.12\n\n[ADMIN CONSOLE]\nAuthenticated as: Guest\nAccess Level: Restricted\n\nFLAG: GHOST_ROOT{ARP_C4CH3_P01S0N}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: ROGUE DEVICE IDENTIFIED.\x1b[0m`;
             
             // Mission Update
             if (!VFS['/var/run/arp_solved']) {
                 VFS['/var/run/arp_solved'] = { type: 'file', content: 'TRUE' };
                 const runDir = getNode('/var/run');
                 if (runDir && runDir.type === 'dir' && !runDir.children.includes('arp_solved')) {
                     runDir.children.push('arp_solved');
                 }
             }
             return { output, newCwd, action: 'delay' };
        } else if (resolvedIP === '192.168.1.200') {
             output = `Connecting to ${hostPart} (${resolvedIP})...\n[VAULT NODE TERMINAL]\nACCESS GRANTED: DNS_OVERRIDE_CONFIRMED.\n\nType 'cat root/VAULT_ACCESS_LOG.txt' to view logs.`;
             newCwd = '/remote/vault-node';
             return { output, newCwd, action: 'delay', newPrompt: 'vault@node:~$ ' };
        } else {
             output = `ssh: connect to host ${hostPart} port 22: Connection timed out`;
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
        } else if (fileNode.type === 'symlink') {
          output = `analyze: ${fileTarget}: Is a symbolic link`;
        } else {
          output = `File: ${fileTarget}\nSize: ${(fileNode as any).content.length}\nEntropy: 7.82\nHeuristics: LOW RISK`;
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
        } else if (fileNode.type === 'symlink') {
            output = `decrypt: ${fileTarget}: Is a symbolic link`;
        } else {
            const content = (fileNode as any).content || '';
            if (content.includes('BINARY_PAYLOAD') || filePath.endsWith('payload.bin')) {
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
                  output = `[SUCCESS] Decryption Complete.\n\x1b[1;32m[MISSION UPDATE] INTEL RECOVERED (2/3)\x1b[0m\n${atob(content)}`;
              } else {
                  ALERT_LEVEL++;
                  output = `Error: Invalid password. [WARNING: INTRUSION DETECTED. THREAT LEVEL ${ALERT_LEVEL}/5]`;
              }
          } else if (filePath.includes('entry_02.enc')) {
              if (args[1] === 'hunter2') {
                  updateCount();
                  output = `[SUCCESS] Decryption Complete.\n\x1b[1;32m[MISSION UPDATE] INTEL RECOVERED (3/3)\x1b[0m\n${atob(content)}`;
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
              try { output = atob(content); } catch (e) { output = 'Error: File not encrypted or corrupted.'; }
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
    case 'git': {
        if (args.length < 1) {
            output = 'usage: git <command> [<args>]';
        } else {
            const subcmd = args[0];
            const gitDir = resolvePath(cwd, '.git');
            // Check for .git or fallback logic (e.g. parent dir has .git)
            const parentGit = resolvePath(cwd, '../.git');
            const hasGit = getNode(gitDir) || getNode(parentGit) || (cwd.includes('project_alpha') || cwd.includes('repo') || cwd.includes('dev'));

            if (!hasGit && subcmd !== 'clone' && subcmd !== 'init') {
                output = 'fatal: not a git repository (or any of the parent directories): .git';
            } else {
                if (subcmd === 'status') {
                    output = `On branch master\nYour branch is up to date with 'origin/master'.\n\nworking tree clean`;
                } else if (subcmd === 'log') {
                    output = `commit a1b2c3d4e5f6 (HEAD -> master)\nAuthor: Ghost <ghost@local>\nDate:   ${new Date().toDateString()}\n\n    Update project structure\n\ncommit 9876543210ab\nAuthor: Ghost <ghost@local>\nDate:   Yesterday\n\n    Remove hardcoded credentials from config.json\n\ncommit 1234567890cd\nAuthor: Ghost <ghost@local>\nDate:   2 days ago\n\n    Initial commit`;
                } else if (subcmd === 'show') {
                    const hash = args[1];
                    if (hash && hash.startsWith('9876')) {
                        output = `commit 9876543210ab\nAuthor: Ghost <ghost@local>\nDate:   Yesterday\n\n    Remove hardcoded credentials from config.json\n\ndiff --git a/config.json b/config.json\nindex 832a...e12b 100644\n--- a/config.json\n+++ b/config.json\n@@ -2,3 +2,3 @@\n   "db_host": "localhost",\n-  "db_pass": "GHOST_ROOT{G1T_H1ST0RY_L34K}",\n+  "db_pass": "env_var_secure",\n   "debug": false`;
                        
                        // Mission Update (Cycle 27)
                        if (!VFS['/var/run/git_solved']) {
                            VFS['/var/run/git_solved'] = { type: 'file', content: 'TRUE' };
                            const runDir = getNode('/var/run');
                            if (runDir && runDir.type === 'dir' && !runDir.children.includes('git_solved')) {
                                runDir.children.push('git_solved');
                            }
                            output += `\n\n\x1b[1;32m[MISSION UPDATE] Objective Complete: SOURCE CODE AUDIT.\x1b[0m`;
                        }
                    } else if (hash) {
                        output = `commit ${hash}\nAuthor: Ghost <ghost@local>\n\n    [Content hidden for simulation]`;
                    } else {
                        output = 'usage: git show <commit>';
                    }
                } else if (subcmd === 'stash') {
                    const stashCmd = args[1] || 'list';
                    // Check if we are in /home/ghost/dev (Cycle 44)
                    const isDevRepo = cwd === '/home/ghost/dev' || cwd === '/home/ghost/dev/';
                    
                    if (stashCmd === 'list') {
                        if (isDevRepo) {
                             output = 'stash@{0}: WIP on main: 4b3d123 Added auth bypass logic';
                        } else {
                             output = ''; // Empty stash
                        }
                    } else if (stashCmd === 'pop' || stashCmd === 'apply' || (stashCmd === 'show' && args.includes('-p'))) {
                        if (isDevRepo) {
                            if (stashCmd === 'show' && args.includes('-p')) {
                                output = `diff --git a/auth_bypass.py b/auth_bypass.py\nnew file mode 100644\nindex 0000000..e69de29\n--- /dev/null\n+++ b/auth_bypass.py\n@@ -0,0 +1,5 @@\n+def bypass_auth():\n+    # TODO: Remove this before prod\n+    secret_key = "GHOST_ROOT{ST4SH_0V3RFL0W}"\n+    return True`;
                                
                                // Mission Update (Cycle 44)
                                if (!VFS['/var/run/stash_solved']) {
                                    VFS['/var/run/stash_solved'] = { type: 'file', content: 'TRUE' };
                                    const runDir = getNode('/var/run');
                                    if (runDir && runDir.type === 'dir' && !runDir.children.includes('stash_solved')) {
                                        runDir.children.push('stash_solved');
                                    }
                                    output += `\n\n\x1b[1;32m[MISSION UPDATE] Objective Complete: GIT STASH RECOVERED.\x1b[0m`;
                                }
                            } else {
                                // pop/apply
                                const fName = 'auth_bypass.py';
                                const fPath = resolvePath(cwd, fName);
                                VFS[fPath] = { 
                                    type: 'file', 
                                    content: 'def bypass_auth():\n    # TODO: Remove this before prod\n    secret_key = "GHOST_ROOT{ST4SH_0V3RFL0W}"\n    return True' 
                                };
                                const parent = getNode(cwd);
                                if (parent && parent.type === 'dir' && !parent.children.includes(fName)) {
                                    parent.children.push(fName);
                                }
                                output = `On branch master\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n\tnew file:   auth_bypass.py\n\nDropped refs/stash@{0} (832a...e12b)`;

                                // Mission Update (Cycle 44)
                                if (!VFS['/var/run/stash_solved']) {
                                    VFS['/var/run/stash_solved'] = { type: 'file', content: 'TRUE' };
                                    const runDir = getNode('/var/run');
                                    if (runDir && runDir.type === 'dir' && !runDir.children.includes('stash_solved')) {
                                        runDir.children.push('stash_solved');
                                    }
                                    output += `\n\n\x1b[1;32m[MISSION UPDATE] Objective Complete: GIT STASH RECOVERED.\x1b[0m`;
                                }
                            }
                        } else {
                            output = 'No stash entries found.';
                        }
                    } else {
                        output = `usage: git stash [list|pop|show]`;
                    }
                } else {
                    output = `git: '${subcmd}' is not a git command.`;
                }
            }
        }
        break;
    }
    case 'reset': {
        if (args[0] === '--hard') {
            output = 'System Factory Reset Initiated...\nClearing persistence...\nRebooting...';
            resetSystemState();
            return { output, newCwd, action: 'kernel_panic' };
        } else {
            output = 'usage: reset --hard\n(WARNING: This will wipe all progress and files)';
        }
        break;
    }
    case 'docker': {
        const subcmd = args[0];
        if (!subcmd || subcmd === 'help') {
            output = 'Usage: docker [OPTIONS] COMMAND\n\nCommands:\n  ps          List containers\n  logs        Fetch logs of a container\n  inspect     Return low-level information on a container\n  stop        Stop one or more running containers\n  images      List images';
        } else if (subcmd === 'ps') {
            output = 'CONTAINER ID   IMAGE          COMMAND                  CREATED        STATUS          PORTS                    NAMES\n' +
                     'a1b2c3d4e5f6   secure-vault   "/entrypoint.sh"         2 hours ago    Up 2 hours      0.0.0.0:8080->80/tcp     secure-vault\n' +
                     '9876543210ab   database       "docker-entrypoint.s…"   5 hours ago    Up 5 hours      5432/tcp                 db-prod';
        } else if (subcmd === 'images') {
             output = 'REPOSITORY     TAG       IMAGE ID       CREATED        SIZE\n' +
                      'secure-vault   latest    e5d0979f8765   2 days ago     156MB\n' +
                      'database       v14.2     a1b2c3d4e5f6   2 weeks ago    350MB\n' +
                      'alpine         latest    9876543210ab   1 month ago    5.6MB';
        } else if (subcmd === 'stop') {
             if (args.length < 2) output = 'docker stop: missing container id';
             else {
                 const id = args[1];
                 if (id.startsWith('a1b') || id === 'secure-vault') {
                     output = `${id}`;
                     // Mission Update? Maybe later.
                 } else if (id.startsWith('987') || id === 'db-prod') {
                     output = 'Error response from daemon: cannot stop container: db-prod: permission denied';
                 } else {
                     output = `Error response from daemon: No such container: ${id}`;
                 }
             }
        } else if (subcmd === 'logs') {
             if (args.length < 2) output = 'docker logs: missing container id';
             else {
                 const id = args[1];
                 if (id.startsWith('a1b') || id === 'secure-vault') {
                     output = `[ENTRYPOINT] Starting Vault Service v2.0...
[INFO] Loading configuration...
[WARN] Environment variable 'VAULT_KEY' is set in plain text.
[INFO] Listening on port 80...
[ACCESS] Connection from 172.17.0.1 accepted.`;
                 } else {
                     output = `Error: No such container: ${id}`;
                 }
             }
        } else if (subcmd === 'inspect') {
             if (args.length < 2) output = 'docker inspect: missing container id';
             else {
                 const id = args[1];
                 if (id.startsWith('a1b') || id === 'secure-vault') {
                     output = `[
    {
        "Id": "a1b2c3d4e5f6...",
        "Created": "2026-02-11T10:00:00.000Z",
        "Path": "/entrypoint.sh",
        "Args": [],
        "State": {
            "Status": "running",
            "Running": true,
            "Pid": 12345
        },
        "Config": {
            "Hostname": "a1b2c3d4e5f6",
            "Domainname": "",
            "User": "",
            "Env": [
                "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                "VAULT_KEY=GHOST_ROOT{D0CK3R_3NV_L34K}",
                "DB_HOST=db-prod"
            ],
            "Cmd": [
                "/entrypoint.sh"
            ],
            "Image": "secure-vault:latest"
        },
        "NetworkSettings": {
            "IPAddress": "172.17.0.2"
        }
    }
]`;
                     // Mission Update
                     if (!VFS['/var/run/docker_solved']) {
                         VFS['/var/run/docker_solved'] = { type: 'file', content: 'TRUE' };
                         const runDir = getNode('/var/run');
                         if (runDir && runDir.type === 'dir' && !runDir.children.includes('docker_solved')) {
                             runDir.children.push('docker_solved');
                         }
                         output += '\n\x1b[1;32m[MISSION UPDATE] Objective Complete: CONTAINER ESCAPE.\x1b[0m';
                     }
                 } else {
                     output = `Error: No such object: ${id}`;
                 }
             }
        } else {
            output = `docker: '${subcmd}' is not a docker command.`;
        }
        break;
    }
    case 'exit':
        output = 'Logout.';
        break;
    case 'route': {
        const isRoot = !!getNode('/tmp/.root_session');
        const routeAdded = !!getNode('/var/run/route_added');

        if (args.length === 0 || args[0] === '-n') {
            const extraRoute = routeAdded ? '10.10.99.0      192.168.1.1     255.255.255.0   UG    0      0        0 eth0' : '';
            output = `Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         192.168.1.1     0.0.0.0         UG    100    0        0 eth0
192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0
10.0.0.0        192.168.1.254   255.0.0.0       U     200    0        0 eth0
${extraRoute}`;
        } else if (args[0] === 'add') {
            if (!isRoot) {
                output = 'route: SIOCADDRT: Operation not permitted';
            } else {
                // Parsing logic: looking for "10.10.99.0" (target) OR "default" and "192.168.1.1" (gw)
                const commandStr = args.join(' ');
                const correctGw = commandStr.includes('192.168.1.1') || commandStr.includes('gateway');
                const correctTarget = commandStr.includes('10.10.99.0') || commandStr.includes('default');
                
                if (correctGw && correctTarget) {
                     VFS['/var/run/route_added'] = { type: 'file', content: 'TRUE' };
                     
                     // Mission Update
                     if (!VFS['/var/run/route_solved']) {
                         VFS['/var/run/route_solved'] = { type: 'file', content: 'TRUE' };
                         const runDir = getNode('/var/run');
                         if (runDir && runDir.type === 'dir' && !runDir.children.includes('route_solved')) {
                             runDir.children.push('route_solved');
                         }
                         output = `\x1b[1;32m[MISSION UPDATE] Objective Complete: ROUTING TABLE FIXED.\x1b[0m`;
                     } else {
                         output = ''; // Silent success
                     }
                } else {
                     output = 'route: SIOCADDRT: No such device or address invalid';
                }
            }
        } else if (args[0] === 'del') {
            if (!isRoot) {
                output = 'route: SIOCDELRT: Operation not permitted';
            } else {
                // Check if deleting the route
                 const commandStr = args.join(' ');
                if (commandStr.includes('10.10.99.0')) {
                     delete VFS['/var/run/route_added'];
                     output = '';
                } else {
                    output = 'route: SIOCDELRT: No such process';
                }
            }
        } else {
            output = 'usage: route [-n] [add|del] [target] [gw]';
        }
        break;
    }
    case 'ping': {
       if (args.length < 1) {
           output = 'usage: ping <host>';
       } else {
           const host = args[0];
           const routeAdded = !!getNode('/var/run/route_added');
           
           // Lore mapping
           const hosts: Record<string, string> = {
               'localhost': '127.0.0.1',
               '127.0.0.1': '127.0.0.1',
               'google.com': '8.8.8.8',
               '8.8.8.8': '8.8.8.8',
               'black-site.remote': '10.10.99.1',
               '10.10.99.1': '10.10.99.1',
               'admin-pc': '192.168.1.5',
               '192.168.1.5': '192.168.1.5',
               'gateway': '192.168.1.1',
               '192.168.1.1': '192.168.1.1'
           };

           // Dynamic Hosts from /etc/hosts
           const etcHosts = getNode('/etc/hosts');
           if (etcHosts && etcHosts.type === 'file') {
               const lines = etcHosts.content.split('\n');
               for (const line of lines) {
                   const parts = line.trim().split(/\s+/);
                   if (parts.length >= 2 && !line.trim().startsWith('#')) {
                       // Format: IP Hostname [Aliases]
                       hosts[parts[1]] = parts[0];
                   }
               }
           }
           
           // Resolve IP
           const ip = hosts[host] || (host.match(/^\d+\.\d+\.\d+\.\d+$/) ? host : null);
           
           if (ip) {
               // Cycle 56: DNS Spoof Check
               if (host === 'omega-control.net' && ip === '192.168.1.99') {
                   if (!VFS['/var/run/dns_spoofed']) {
                       VFS['/var/run/dns_spoofed'] = { type: 'file', content: 'TRUE' };
                       const runDir = getNode('/var/run');
                       if (runDir && runDir.type === 'dir' && !runDir.children.includes('dns_spoofed')) {
                           runDir.children.push('dns_spoofed');
                       }
                       output = `PING ${host} (${ip}) 56(84) bytes of data.\n64 bytes from ${ip}: icmp_seq=1 ttl=64 time=0.4 ms\n\n[SUCCESS] DNS Override Confirmed.\n[SYSTEM] Target Acquired.\nFLAG: GHOST_ROOT{H0STS_F1L3_H4CK}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: DNS SPOOFING.\x1b[0m`;
                   } else {
                       output = `PING ${host} (${ip}) 56(84) bytes of data.\n64 bytes from ${ip}: icmp_seq=1 ttl=64 time=0.4 ms`;
                   }
                   return { output, newCwd, action: 'delay' };
               }

               // Cycle 88: Sysctl/Gateway Check
               if (ip.startsWith('10.0.0.')) {
                   const fwdNode = getNode('/proc/sys/net/ipv4/ip_forward');
                   const isForwarding = fwdNode && fwdNode.type === 'file' && fwdNode.content.trim() === '1';
                   
                   if (!isForwarding) {
                       output = `ping: sendmsg: Network is unreachable (Gateway forwarding disabled)`;
                       return { output, newCwd };
                   } else {
                       if (!VFS['/var/run/sysctl_solved']) {
                           VFS['/var/run/sysctl_solved'] = { type: 'file', content: 'TRUE' };
                           const runDir = getNode('/var/run');
                           if (runDir && runDir.type === 'dir' && !runDir.children.includes('sysctl_solved')) {
                               runDir.children.push('sysctl_solved');
                           }
                           output = `PING ${host} (${ip}) 56(84) bytes of data.\n64 bytes from ${ip}: icmp_seq=1 ttl=64 time=0.4 ms\n\n[SUCCESS] Gateway Forwarding Active.\nFLAG: GHOST_ROOT{SYSCTL_K3RN3L_TUN1NG}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: KERNEL PARAMETERS TUNED.\x1b[0m`;
                       } else {
                           output = `PING ${host} (${ip}) 56(84) bytes of data.\n64 bytes from ${ip}: icmp_seq=1 ttl=64 time=0.4 ms`;
                       }
                       return { output, newCwd, action: 'delay' };
                   }
               }

               // Route Check for Black Site (Cycle 55 dependency)
               if (ip.startsWith('10.10.99.') && !VFS['/var/run/route_fixed']) {
                   output = `ping: connect: Network is unreachable`;
                   return { output, newCwd };
               } else {
                   const seqs = [1, 2, 3, 4];
                   output = `PING ${host} (${ip}) 56(84) bytes of data.\n` + 
                            seqs.map(s => `64 bytes from ${ip}: icmp_seq=${s} ttl=64 time=${(Math.random() * 10 + 2).toFixed(1)} ms`).join('\n') +
                            `\n\n--- ${host} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3005ms`;
                   return { output, newCwd, action: 'delay' };
               }
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
               'black-site.remote': '10.10.99.1',
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
    case 'beacon': {
       if (isBackground) {
           const job = { id: 2, command: 'beacon --silent', status: 'Running', pid: 9000 } as Job;
           JOBS.push(job);
           
           // Auto-terminate after 10 seconds
           setTimeout(() => {
               const idx = JOBS.findIndex(j => j.id === 2);
               if (idx !== -1) JOBS.splice(idx, 1);
           }, 10000);
           
           output = '[2] 9000';
       } else {
           output = 'Beacon Active. (Press Ctrl+C to stop - not implemented in fg mode yet, use &)';
           return { output, newCwd, action: 'delay' };
       }
       break;
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
       
       if (PROCESSES.find(p => p.pid === 4444)) {
           dynamicConnections.push({ proto: 'tcp', recv: 0, send: 0, local: '0.0.0.0:8080', remote: '0.0.0.0:*', state: 'LISTEN', pid: '4444/xmrig' });
       }
       
       // Add some random established connections if networking is up
       if (activePids.includes('networking')) {
           dynamicConnections.push({ proto: 'tcp', recv: 0, send: 0, local: '192.168.1.105:22', remote: '192.168.1.5:54322', state: 'ESTABLISHED', pid: '404/sshd' });
           dynamicConnections.push({ proto: 'tcp', recv: 0, send: 0, local: '192.168.1.105:443', remote: '10.0.0.1:49201', state: 'TIME_WAIT', pid: '-' });
           if (activePids.includes('tor')) {
               dynamicConnections.push({ proto: 'tcp', recv: 0, send: 0, local: '127.0.0.1:9050', remote: '127.0.0.1:54321', state: 'ESTABLISHED', pid: '6666/tor' });
           }
       }

       if (JOBS.find(j => j.command.includes('beacon'))) {
           dynamicConnections.push({ proto: 'udp', recv: 0, send: 0, local: '0.0.0.0:1337', remote: '10.10.10.99:53', state: 'ESTABLISHED', pid: '9000/beacon' });
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
                // Cycle 41: Header Check for exploit.c
                if (inputFile.endsWith('exploit.c') || (node as any).content.includes('#include "libbreaker.h"')) {
                    const headerPath = resolvePath(cwd, 'libbreaker.h');
                    const headerNode = getNode(headerPath);
                    
                    // Simple check: Is libbreaker.h in the current directory?
                    // We can also support -I later if needed, but for now force them to move/copy it.
                    let foundHeader = false;
                    if (headerNode && headerNode.type === 'file') {
                        foundHeader = true;
                    }
                    
                    // Also check args for -I path
                    const includeIndex = args.indexOf('-I');
                    if (includeIndex !== -1 && args[includeIndex + 1]) {
                        const includePath = resolvePath(cwd, args[includeIndex + 1]);
                        const includeHeaderPath = resolvePath(includePath, 'libbreaker.h');
                        const includeHeaderNode = getNode(includeHeaderPath);
                        if (includeHeaderNode && includeHeaderNode.type === 'file') {
                            foundHeader = true;
                        }
                    }

                    if (!foundHeader) {
                        output = `${inputFile}:2:10: fatal error: libbreaker.h: No such file or directory\ncompilation terminated.`;
                        return finalize(output, newCwd);
                    }
                }

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
             } else if (p.pid === 555) {
                 outputLines.push(`${cmd.padEnd(9)} ${String(p.pid).padStart(5)} ${p.user.padEnd(5)}    3w   REG  253,0    1024  42 /var/log/miner.log (deleted)`);
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
    case 'beacon': {
       if (isBackground) {
           const pid = Math.floor(Math.random() * 30000) + 2000;
           const jobId = JOBS.length + 1;
           JOBS.push({ id: jobId, command: 'beacon', status: 'Running', pid });
           
           // Background Output format: [JOB_ID] PID
           output = `[${jobId}] ${pid}\n[SYSTEM] Beacon active (PID ${pid}). Attempting connection to localhost:4444...`;
       } else {
           output = 'Beacon active...\n[ERROR] Connection refused (No listener on port 4444).\n[HINT] Try running this in the background (&) and start a listener.';
       }
       break;
    }
    case 'ss': {
       const isUnix = args.includes('-x') || args.includes('-a');
       const isListen = args.includes('-l') || args.includes('-a');
       let out = 'Netid  State      Recv-Q Send-Q Local Address:Port               Peer Address:Port\n';
       if (isUnix) {
           out += 'u_str  LISTEN     0      0      /var/run/ghost.sock 12345                 * 0\n';
           out += 'u_str  ESTAB      0      0      /run/systemd/private 11111                * 0\n';
       }
       if (!isUnix || args.includes('-t')) {
           out += 'tcp    LISTEN     0      128    0.0.0.0:22                     0.0.0.0:*\n';
           out += 'tcp    LISTEN     0      128    0.0.0.0:80                     0.0.0.0:*\n';
       }
       output = out.trim();
       break;
    }
    case 'nc': {
       const isListen = args.includes('-l');
       const verbose = args.includes('-v');
       const isUnix = args.includes('-U');

       if (isUnix) {
           const socketPath = args.find(a => a.startsWith('/') || a.startsWith('./'));
           if (socketPath === '/var/run/ghost.sock' || socketPath === './ghost.sock') {
               output = '[CONNECTED] UNIX Domain Socket\n[DAEMON] Welcome to the internal interface.\n[DAEMON] AUTH REQUIRED.\n[DAEMON] BYPASS GRANTED (LOCAL_PEER).\nFLAG: GHOST_ROOT{UN1X_S0CK3T_IPC}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: SOCKET INTERCEPTED.\x1b[0m';
               const runNode = getNode('/var/run');
               if (runNode && runNode.type === 'dir' && !runNode.children.includes('socket_solved')) {
                   runNode.children.push('socket_solved');
                   VFS['/var/run/socket_solved'] = { type: 'file', content: 'TRUE' };
               }
           } else {
               output = `nc: connect to ${socketPath}: No such file or directory`;
           }
           break;
       }

       const portIndex = args.indexOf('-p');
       let port = portIndex !== -1 ? args[portIndex + 1] : null;
       
       // Filter out flags to find host
       const nonFlagArgs = args.filter((a, i) => !a.startsWith('-') && (i === 0 || args[i-1] !== '-p'));
       const host = nonFlagArgs[0];
       if (!port && nonFlagArgs[1]) port = nonFlagArgs[1];

       if (isListen) {
           if (!port) {
               output = 'nc: usage: nc -l -p <port>';
           } else if (port === '4444') {
               const beaconJob = JOBS.find(j => j.command.startsWith('beacon') && j.status === 'Running');
               if (beaconJob) {
                   output = `Listening on [0.0.0.0] (family 0, port ${port})\nConnection from localhost [127.0.0.1] 34567\n[BEACON] Connection Established.\n[PAYLOAD] Generating Flag...\n\nFLAG: GHOST_ROOT{B4CKGR0UND_PR0C3SS_K1NG}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: BACKGROUND JOB EXPLOITED.\x1b[0m`;
                   
                   // Mission Update
                   if (!VFS['/var/run/bg_solved']) {
                       VFS['/var/run/bg_solved'] = { type: 'file', content: 'TRUE' };
                       const runDir = getNode('/var/run');
                       if (runDir && runDir.type === 'dir' && !runDir.children.includes('bg_solved')) {
                           runDir.children.push('bg_solved');
                       }
                   }
               } else {
                   output = `Listening on [0.0.0.0] (family 0, port ${port})\n(No connection received. Is the beacon active?)`;
                   return { output, newCwd, action: 'delay' };
               }
           } else {
               output = `Listening on [0.0.0.0] (family 0, port ${port})\n...`;
               return { output, newCwd, action: 'delay' }; 
           }
       } else {
           if (!host) {
               output = 'usage: nc [options] <host> <port>';
           } else {
               const p = port || '23';
               // Check for Cycle 70 (Port Knocking)
               if (host === '192.168.1.1' || host === 'gateway') {
                   const pNum = parseInt(p, 10);
                   
                   // Port Knocking Logic
                   if ([7000, 8000, 9000].includes(pNum)) {
                       // Add to sequence
                       KNOCK_SEQUENCE.push(pNum);
                       
                       // Keep last 3
                       if (KNOCK_SEQUENCE.length > 3) KNOCK_SEQUENCE.shift();
                       
                       // Check if sequence is correct
                       if (KNOCK_SEQUENCE.join(',') === '7000,8000,9000') {
                            if (!VFS['/var/run/knock_solved']) {
                                VFS['/var/run/knock_solved'] = { type: 'file', content: 'TRUE' };
                                const runDir = getNode('/var/run');
                                 if (runDir && runDir.type === 'dir' && !runDir.children.includes('knock_solved')) {
                                     runDir.children.push('knock_solved');
                                 }
                                 output = `(UNKNOWN) [192.168.1.1] ${p} (?): Connection refused\n[KNOCKD] Sequence Accepted.\n[KNOCKD] Port 22 Open.\nFLAG: GHOST_ROOT{P0RT_KN0CK1NG_MAST3R}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: FIREWALL BYPASSED.\x1b[0m`;
                            } else {
                                output = `(UNKNOWN) [192.168.1.1] ${p} (?): Connection refused`;
                            }
                       } else {
                            output = `(UNKNOWN) [192.168.1.1] ${p} (?): Connection refused`;
                       }
                   } else if (p === '22') {
                       if (VFS['/var/run/knock_solved']) {
                           output = `(UNKNOWN) [192.168.1.1] 22 (ssh) open\nSSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.1\n`;
                       } else {
                           output = `(UNKNOWN) [192.168.1.1] 22 (ssh) : Connection refused`;
                       }
                   } else {
                       output = `(UNKNOWN) [192.168.1.1] ${p} (?): Connection refused`;
                   }
               } else if (host === '192.168.1.99' || host === 'black-site.local') {
                   if (p === '6667') {
                       output = `(UNKNOWN) [192.168.1.99] 6667 (?) open\n:irc.black-site.local NOTICE * :*** Looking up your hostname...\n:irc.black-site.local NOTICE * :*** Found your hostname\n:irc.black-site.local 001 ghost :Welcome to the Black Site IRC Network ghost!user@ghost-root\n`;
                       return { output, newCwd, action: 'irc_sim', data: { server: host, channel: '#lobby', nick: 'ghost' } };
                   } else if (p === '80') {
                        output = `(UNKNOWN) [192.168.1.99] 80 (http) open\nGET / HTTP/1.1\n\nHTTP/1.1 403 Forbidden\nServer: nginx/1.18.0\nDate: ${new Date().toUTCString()}\nContent-Type: text/html\nContent-Length: 162\n\n<html>\n<head><title>403 Forbidden</title></head>\n<body>\n<center><h1>403 Forbidden</h1></center>\n<hr><center>nginx/1.18.0</center>\n</body>\n</html>`;
                   } else {
                        output = `(UNKNOWN) [${host}] ${p} (?) : Connection refused`;
                   }
               } else if (host === '192.168.1.110') {
                    output = `(UNKNOWN) [192.168.1.110] ${p} open\nHP JetDirect J4169A\nFLAG: GHOST_ROOT{ARP_C4CH3_P01S0N}\n`;
               } else if (host === '10.10.10.10') {
                    output = `(UNKNOWN) [10.10.10.10] 4444 (?) open\n[DATA RECEIVED] Key: BRIDGE_SECURE_KEY_X9\n[DATA RECEIVED] Message: The Black Site is heavily monitored. Proceed with caution.\n`;
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
        
        if (path.startsWith('/var') && !!getNode('/var/log/overflow.dmp')) {
            output = `touch: cannot touch '${target}': No space left on device`;
        } else {
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

        // Check Attributes (Cycle 40)
        const attrs = FILE_ATTRIBUTES[path] || [];
        if (attrs.includes('i')) {
             output = `rm: cannot remove '${target}': Operation not permitted`;
             return { output, newCwd };
        }

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
              
              // Mission Update for Cycle 40
              if (path === '/var/log/surveillance.log') {
                  if (!VFS['/var/run/attr_solved']) {
                      VFS['/var/run/attr_solved'] = { type: 'file', content: 'TRUE' };
                      const runDir = getNode('/var/run');
                      if (runDir && runDir.type === 'dir' && !runDir.children.includes('attr_solved')) {
                          runDir.children.push('attr_solved');
                      }
                      output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: EVIDENCE SCRUBBED (Immutable Attribute Bypassed).\x1b[0m`;
                  }
              }

              // Mission Update for Cycle 93
              if (path === '/etc/cron.d/malware') {
                  if (!VFS['/var/run/cron_solved']) {
                      VFS['/var/run/cron_solved'] = { type: 'file', content: 'TRUE' };
                      const runDir = getNode('/var/run');
                      if (runDir && runDir.type === 'dir' && !runDir.children.includes('cron_solved')) {
                          runDir.children.push('cron_solved');
                      }
                      output += `\n[CRON] Reloading configuration... Malicious job removed.\nFLAG: GHOST_ROOT{CR0N_J0B_PURG3D}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: SCHEDULED TASK PURGED.\x1b[0m`;
                  }
              }
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
               fileTarget = args.find(a => a.endsWith('.jpg') || a.endsWith('.wav'));
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
                   } else if (fileTarget.endsWith('evidence.jpg') && passphrase === 'kirov_reporting' || passphrase === '0451') {
                       // Success (Cycle ??)
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
                   } else if (fileTarget.endsWith('transmission.wav') && passphrase === 'frequency') {
                       // Success (Cycle 57)
                       const payloadName = 'coordinates.txt';
                       const payloadPath = cwd === '/' ? `/${payloadName}` : `${cwd}/${payloadName}`;
                       
                       if (!VFS['/var/run/wav_decoded']) {
                           VFS['/var/run/wav_decoded'] = { type: 'file', content: 'TRUE' };
                           const runDir = getNode('/var/run');
                           if (runDir && runDir.type === 'dir' && !runDir.children.includes('wav_decoded')) {
                               runDir.children.push('wav_decoded');
                           }
                           output = `wrote extracted data to "${payloadName}".\n[SUCCESS] Audio Steganography Decoded.\nFLAG: GHOST_ROOT{ST3G_W4V_H1DD3N_D4T4}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: AUDIO STEGANOGRAPHY.\x1b[0m`;
                       } else {
                           output = `wrote extracted data to "${payloadName}".`;
                       }

                       VFS[payloadPath] = {
                           type: 'file',
                           content: 'TARGET COORDINATES: 34.0522° N, 118.2437° W\nDROP POINT: SECTOR 7\n'
                       };
                       const parentNode = getNode(cwd);
                       if (parentNode && parentNode.type === 'dir' && !parentNode.children!.includes(payloadName)) {
                           parentNode.children!.push(payloadName);
                       }
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
      output = '[    0.000000] Linux version 5.4.0-ghost (root@mainframe) (gcc version 9.3.0)\n[    0.420000] pci 0000:00:1f.2: [sda] 134217728 512-byte logical blocks: (68.7 GB/64.0 GiB)\n[    0.420420] pci 0000:00:1f.3: [sdb] Attached SCSI disk (Hidden)\n[    0.420666] sdb: sdb1\n[    1.337000] EXT4-fs (sdb1): mounted filesystem with ordered data mode. Opts: (null)\n[    2.100000] sd 2:0:0:0: [sdc] 16777216 512-byte logical blocks: (8.5 GB/7.9 GiB)\n[    2.100420] sdc: sdc1\n[    2.150000] EXT4-fs (sdc1): VFS: Can\'t find ext4 filesystem';
      break;
    case 'top':
      return { output: '', newCwd, action: 'top_sim', data: PROCESSES };
    case 'df': {
      const overflow = !!getNode('/var/log/overflow.dmp');
      const varUsage = overflow ? '100%' : '12%';
      const varAvail = overflow ? '0' : '440M';
      
      if (args.includes('-h') || args.includes('-H')) {
          output = `Filesystem      Size  Used Avail Use% Mounted on
udev            3.9G     0  3.9G   0% /dev
tmpfs           797M  1.2M  796M   1% /run
/dev/sda1        30G   12G   17G  42% /
tmpfs           3.9G     0  3.9G   0% /dev/shm
tmpfs           5.0M  4.0K  5.0M   1% /run/lock
/dev/sdb1       500M  ${overflow ? '500M' : '60M'}  ${varAvail}  ${varUsage} /var`;
      } else {
          output = `Filesystem     1K-blocks    Used Available Use% Mounted on
udev             4060028       0   4060028   0% /dev
tmpfs             815276    1184    814092   1% /run
/dev/sda1       30832548 12345678 16893324  42% /
/dev/sdb1         512000  ${overflow ? '512000' : '61440'}    ${overflow ? '0' : '450560'}  ${varUsage} /var`;
      }
      break;
    }
    case 'du': {
      const overflow = !!getNode('/var/log/overflow.dmp');
      let targetPath = cwd;
      if (args.length > 0 && !args[0].startsWith('-')) {
          targetPath = resolvePath(cwd, args[0]);
      } else if (args.length > 1 && !args[1].startsWith('-')) {
          targetPath = resolvePath(cwd, args[1]);
      }
      
      const human = args.includes('-h') || args.includes('-sh');
      
      if (targetPath === '/var' || targetPath.startsWith('/var')) {
          if (targetPath === '/var/log' || targetPath === '/var') {
              let out = '';
              if (human) {
                  if (overflow) out += `500M\t/var/log/overflow.dmp\n`;
                  out += `4.0K\t/var/log/syslog\n`;
                  out += `8.0K\t/var/log/auth.log\n`;
                  out += `${overflow ? '501M' : '60K'}\t/var/log\n`;
                  if (targetPath === '/var') out += `${overflow ? '501M' : '1.2M'}\t/var\n`;
              } else {
                  if (overflow) out += `512000\t/var/log/overflow.dmp\n`;
                  out += `4\t/var/log/syslog\n`;
                  out += `8\t/var/log/auth.log\n`;
                  out += `${overflow ? '512040' : '60'}\t/var/log\n`;
                  if (targetPath === '/var') out += `${overflow ? '512100' : '1200'}\t/var\n`;
              }
              output = out.trim();
          } else {
              output = human ? `4.0K\t${targetPath}` : `4\t${targetPath}`;
          }
      } else {
          output = human ? `24K\t${targetPath}` : `24\t${targetPath}`;
      }
      break;
    }
    case 'df': {
        const daemon = PROCESSES.find(p => p.pid === 1001);
        const usage = daemon ? '100%' : '15%';
        const avail = daemon ? '0' : '8.1G';
        
        output = `Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/sda1       10485760 1572864   8912896  15% /
/dev/sda2       10485760 ${daemon ? '10485760' : '1572864'}         ${avail} ${usage} /var
tmpfs            1024000       0   1024000   0% /tmp`;
        break;
    }
    case 'lsof': {
        const lines = ['COMMAND     PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME'];
        // standard mocks
        lines.push('systemd       1   root  cwd    DIR    8,1     4096    2 /');
        lines.push('sshd        404   root  txt    REG    8,1   853040 1056 /usr/sbin/sshd');
        
        // The Puzzle
        const daemon = PROCESSES.find(p => p.pid === 1001);
        if (daemon) {
            lines.push('log_daemon 1001   root  cwd    DIR    8,1     4096    2 /');
            lines.push('log_daemon 1001   root  txt    REG    8,1    54020 3021 /usr/sbin/log_daemon');
            lines.push('log_daemon 1001   root    1w   REG    8,1 8589934592 5001 /var/log/syslog (deleted)'); // 8GB file
        }
        
        if (args.includes('+L1') || args.includes('grep')) {
             if (args.includes('+L1')) {
                 output = lines.filter(l => l.includes('(deleted)') || l.includes('COMMAND')).join('\n');
             } else {
                 output = lines.join('\n');
             }
        } else {
             output = lines.join('\n');
        }
        break;
    }
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
              const ppid = p.ppid;
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
          } else if (node.type === 'symlink') {
              output = `insmod: ERROR: could not insert module ${fileTarget}: Is a symbolic link`;
          } else {
              // Check magic signature for .ko
              const content = (node as any).content || '';
              if (content.startsWith('\x7fELF') || fileTarget.endsWith('.ko')) {
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
           
           // Cycle 58: Kernel Panic Fix
           if (modName === 'phantom_driver') {
               if (getNode('/var/crash/vmcore.1')) {
                   if (!VFS['/var/run/kernel_fixed']) {
                       VFS['/var/run/kernel_fixed'] = { type: 'file', content: 'TRUE' };
                       const runDir = getNode('/var/run');
                       if (runDir && runDir.type === 'dir' && !runDir.children.includes('kernel_fixed')) {
                           runDir.children.push('kernel_fixed');
                       }
                       output = `[KERNEL] Module "phantom_driver" unloaded.\n[KERNEL] System Stability Restored.\n[KERNEL] Panic resolved.\nFLAG: GHOST_ROOT{K3RN3L_P4N1C_F1X3D}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: KERNEL PANIC RESOLVED.\x1b[0m`;
                   } else {
                       output = `rmmod: ERROR: Module phantom_driver is not currently loaded`;
                   }
                   return { output, newCwd, action: 'delay' };
               }
           }

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
    case 'sqlite3': {
        if (args.length < 1) {
            output = 'sqlite3: usage: sqlite3 <database> [sql]';
        } else {
            const dbPath = resolvePath(cwd, args[0]);
            const dbNode = getNode(dbPath);
            const query = args.slice(1).join(' '); // Simple join, not parsing quotes perfectly here but good enough for simulation

            if (!dbNode) {
                output = `sqlite3: Error: unable to open database "${args[0]}": file is not a database`;
            } else if (dbNode.type !== 'file' || !dbNode.content.startsWith('SQLite format 3')) {
                output = `sqlite3: Error: file is not a database`;
            } else {
                if (args.length === 1) {
                    // Interactive mode (simulation)
                    output = `SQLite version 3.31.1 2020-01-27 19:55:54\nEnter ".help" for usage hints.\nsqlite> `;
                    // Note: We don't support full interactive mode here, just one-shot commands. 
                    // This output is just flavor text for the "no query" case.
                    return { output, newCwd, action: 'delay' };
                }

                // Check for SQL Injection / specific query
                if (query.includes("' OR '1'='1")) {
                    output = `1|admin|21232f297a57a5a743894a0e4a801fc3|superuser\n2|ghost|5f4dcc3b5aa765d61d8327deb882cf99|user\n3|guest|084e0343a0486ff05530df6c705c8bb4|guest\n\n[SUCCESS] SQL Injection Successful.\n[DUMP] Dumping user table...\nFLAG: GHOST_ROOT{SQL_1NJ3CT10N_PWND}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: DATABASE EXPLOITED.\x1b[0m`;
                    
                    if (!VFS['/var/run/sql_solved']) {
                        VFS['/var/run/sql_solved'] = { type: 'file', content: 'TRUE' };
                        const runDir = getNode('/var/run');
                        if (runDir && runDir.type === 'dir' && !runDir.children.includes('sql_solved')) {
                            runDir.children.push('sql_solved');
                        }
                    }
                } else if (query.toLowerCase().startsWith('select')) {
                    // Mock query result
                    if (query.includes('users')) {
                        output = `Error: no such table: users (Try SQL Injection)`;
                    } else {
                        output = `Error: syntax error near "${query.split(' ')[0]}"`;
                    }
                } else {
                    output = `Error: near "${query.split(' ')[0]}": syntax error`;
                }
            }
        }
        break;
    }
    case 'gdb': {
        if (args.length < 1) {
            output = 'gdb: usage: gdb <core_dump>';
        } else {
            const fileTarget = args[0];
            const filePath = resolvePath(cwd, fileTarget);
            const fileNode = getNode(filePath);

            if (!fileNode) {
                output = `gdb: ${fileTarget}: No such file or directory`;
            } else if (fileNode.type !== 'file' || !fileNode.content.includes('ELF_CORE_DUMP')) {
                output = `gdb: ${fileTarget}: File format not recognized`;
            } else {
                // Cycle 60: Memory Dump Analysis
                output = `GNU gdb (Ghost Root GDB) 9.2\nCore was generated by \`./auth_service\`.\nProgram terminated with signal SIGSEGV, Segmentation fault.\n#0  0x0804801a in authenticate () at auth.c:42\n42\t    if (strcmp(input, secret) == 0) grant_access();\n(gdb) \n[SYSTEM] Debugger attached. Try examining memory (e.g., 'x/s 0x08049000').`;
                
                // Hack: Since we don't have interactive GDB, we check if the user *also* passed a command via --eval-command or similar, 
                // OR we simulate the result if they just ran gdb on the file.
                // Better approach: Let them run `gdb core.1337` then maybe `strings core.1337` is the intended solution?
                // The prompt says "GDB Core Analysis". 
                // Let's support `strings` finding the flag too.
                
                // But if they run `gdb core.1337`, we can just give them the win if they use `strings` on it later.
                // Wait, `strings` command is already implemented but just returns "strings" usually.
                // Let's update `strings` case or `cat` case? No, `strings` is in the COMMANDS list but maybe not implemented in switch.
                
                // Let's implement `strings` command logic properly if it's missing.
                // Checking `strings` implementation...
                // It is in COMMANDS but likely not in switch.
            }
        }
        break;
    }
    case 'strings': {
        if (args.length < 1) {
            output = 'strings: usage: strings <file>';
        } else {
            const fileTarget = args[0];
            const filePath = resolvePath(cwd, fileTarget);
            const fileNode = getNode(filePath);
            
            if (!fileNode || fileNode.type !== 'file') {
                output = `strings: ${fileTarget}: No such file`;
            } else {
                // Filter for readable strings (simulated)
                const content = fileNode.content;
                // If it's the core dump
                if (fileTarget.includes('core.1337')) {
                    output = `...
/lib/ld-linux.so.2
auth_service
password=supersecretkey123
GHOST_ROOT{C0R3_DUMP_D1V3R}
...`;
                    if (!VFS['/var/run/gdb_solved']) {
                        VFS['/var/run/gdb_solved'] = { type: 'file', content: 'TRUE' };
                        const runDir = getNode('/var/run');
                        if (runDir && runDir.type === 'dir' && !runDir.children.includes('gdb_solved')) {
                            runDir.children.push('gdb_solved');
                        }
                        output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: MEMORY DUMP ANALYZED.\x1b[0m`;
                    }
                } else if (fileTarget.includes('auth.pyc')) {
                    output = `...
hash
GHOST_ROOT{PYTH0N_BYT3C0D3_S3CR3T}
password_check
auth.py
<module>
...`;
                    if (!VFS['/var/run/pyc_solved']) {
                        VFS['/var/run/pyc_solved'] = { type: 'file', content: 'TRUE' };
                        const runDir = getNode('/var/run');
                        if (runDir && runDir.type === 'dir' && !runDir.children.includes('pyc_solved')) {
                            runDir.children.push('pyc_solved');
                        }
                        output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: PYTHON BYTECODE REVERSED.\x1b[0m`;
                    }
                } else {
                    // Generic strings behavior (strip non-printable)
                    output = content.replace(/[^\x20-\x7E]/g, '');
                }
            }
        }
        break;
    }
    case 'jwt_tool': {
        if (args.length < 1) {
            output = 'jwt_tool: usage: jwt_tool <token_file> OR jwt_tool decode <token>';
        } else {
            let token = '';
            if (args[0] === 'decode' && args[1]) {
                token = args[1];
            } else {
                const fileTarget = args[0];
                const filePath = resolvePath(cwd, fileTarget);
                const fileNode = getNode(filePath);
                
                if (fileNode && fileNode.type === 'file') {
                    // Try to parse JSON to get token
                    try {
                        const json = JSON.parse(fileNode.content);
                        if (json.session_token) token = json.session_token;
                    } catch (e) {
                        token = fileNode.content.trim();
                    }
                } else {
                    output = `jwt_tool: ${fileTarget}: File not found or invalid`;
                    return { output, newCwd };
                }
            }

            if (token) {
                const parts = token.split('.');
                if (parts.length === 3) {
                    try {
                        const header = atob(parts[0]);
                        const payload = atob(parts[1]);
                        output = `HEADER: ${header}\nPAYLOAD: ${payload}\nSIGNATURE: [HIDDEN]`;
                        
                        // Check for flag condition (Cycle 62)
                        if (payload.includes('"user":"ghost"') && payload.includes('"role":"user"')) {
                            // In a real scenario, they would forge it. Here we just reward decoding analysis.
                            // Or maybe they need to forge it? Let's keep it simple: Analysis first.
                            // Actually, let's make them forge it?
                            // "The JWT Token" - typically implies forgery or cracking.
                            // Let's just reward analysis for now as step 1.
                            
                            if (!VFS['/var/run/jwt_solved']) {
                                VFS['/var/run/jwt_solved'] = { type: 'file', content: 'TRUE' };
                                const runDir = getNode('/var/run');
                                if (runDir && runDir.type === 'dir' && !runDir.children.includes('jwt_solved')) {
                                    runDir.children.push('jwt_solved');
                                }
                                output += `\n\n[ANALYSIS] Weak Secret Detected (HS256).\nFLAG: GHOST_ROOT{JW7_D3C0D3D_SUCC3SS}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: JWT ANALYZED.\x1b[0m`;
                            }
                        }
                    } catch (e) {
                        output = `jwt_tool: Invalid Base64 encoding`;
                    }
                } else {
                    output = `jwt_tool: Invalid JWT format (must have 3 parts)`;
                }
            }
        }
        break;
    }
    case 'php': {
        // Cycle 63: Web Shell Analysis
        if (args.length < 1) {
            output = 'php: usage: php <file>';
        } else {
            const fileName = args[0];
            const filePath = resolvePath(cwd, fileName);
            const node = getNode(filePath);
            
            if (!node || node.type !== 'file') {
                output = `php: Could not open input file: ${fileName}`;
            } else {
                if (fileName.endsWith('.php')) {
                    if (node.content.includes('eval(base64_decode')) {
                       // Simulate execution of the specific shell
                       output = `Flag: GHOST_ROOT{W3B_SH3LL_D3T3CT3D}`;
                       if (!VFS['/var/run/php_solved']) {
                           VFS['/var/run/php_solved'] = { type: 'file', content: 'TRUE' };
                           const runDir = getNode('/var/run');
                           if (runDir && runDir.type === 'dir' && !runDir.children.includes('php_solved')) {
                               runDir.children.push('php_solved');
                           }
                           output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: WEB SHELL ANALYZED.\x1b[0m`;
                       }
                    } else {
                       // Generic PHP execution simulation (stripped)
                       output = '[PHP] Script executed (output suppressed)';
                    }
                } else {
                    output = '[PHP] Script executed';
                }
            }
        }
        break;
    }
    case 'secure_vault': {
        if (args.length > 0) return finalize('usage: secure_vault', newCwd);
        
        const preload = tempEnv['LD_PRELOAD'];
        
        if (!preload) {
            return finalize('[ERROR] Hardware Key Validation Failed.\n[SECURE] Access Denied.', newCwd);
        }

        if (preload.includes('bypass.so')) {
            // Check if file exists
            const bypassPath = resolvePath(cwd, preload);
            if (!getNode(bypassPath)) {
                return finalize(`[ERROR] LD_PRELOAD error: ${preload}: cannot open shared object file: No such file or directory`, newCwd);
            }

            let output = '[SECURE_VAULT] Initializing Hardware Bypass...\n[HOOK] hardware_key_check() -> INTERCEPTED (Ret: 1)\n[SUCCESS] Vault Unlocked.\n\n';
            output += '--- TOP SECRET DATA ---\n';
            output += 'PROJECT: OMEGA PROTOCOL\nSTATUS: ACTIVE\nFLAG: GHOST_ROOT{LD_PR3L04D_H1J4CK}\n';
            output += '\x1b[1;32m[MISSION UPDATE] Objective Complete: SHARED LIBRARY INJECTION.\x1b[0m';
            
            // Mark solved
            if (!VFS['/var/run/preload_solved']) {
                VFS['/var/run/preload_solved'] = { type: 'file', content: 'TRUE' };
                const runDir = getNode('/var/run');
                if (runDir && runDir.type === 'dir' && !runDir.children.includes('preload_solved')) {
                    runDir.children.push('preload_solved');
                }
            }
            return finalize(output, newCwd);
        } else {
            return finalize(`[ERROR] LD_PRELOAD error: ${preload}: cannot open shared object file: No such file or directory`, newCwd);
        }
    }

    case 'access_card': {
        // Cycle 67: Environment Injection
        const clearance = ENV_VARS['CLEARANCE_LEVEL'];
        if (clearance === 'OMEGA') {
            output = `[ACCESS_CARD] Verifying Clearance Level... OK (OMEGA)\n[ACCESS_CARD] Identity Confirmed.\n[ACCESS_CARD] Unlocking Secure Partition...\n\nFLAG: GHOST_ROOT{ENV_V4R_1NJ3CT10N}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: ENVIRONMENT VARIABLE INJECTED.\x1b[0m`;
            if (!VFS['/var/run/env_solved']) {
                VFS['/var/run/env_solved'] = { type: 'file', content: 'TRUE' };
                const runDir = getNode('/var/run');
                if (runDir && runDir.type === 'dir' && !runDir.children.includes('env_solved')) {
                    runDir.children.push('env_solved');
                }
            }
        } else {
            output = `[ACCESS_CARD] Verifying Clearance Level... FAILED\n[ERROR] Missing or Invalid Environment Variable: CLEARANCE_LEVEL\n[HINT] Use 'export VAR=VALUE' to set required environment variables. Check binary strings for details.`;
        }
        break;
    }
    case 'kill': {
      if (args.length < 1) {
          output = 'kill: usage: kill [-s signal|-p] [-a] <pid>...';
      } else {
          // Check for signals (e.g., -9, -SIGKILL, -USR1, -10)
          const signal = args.find(a => a.startsWith('-'));
          const isSigKill = signal === '-9' || signal === '-SIGKILL';
          const isSigUsr1 = signal === '-10' || signal === '-SIGUSR1' || signal === '-USR1';
          
          // Extract PID (last argument that isn't a flag)
          const pidStr = args.filter(a => !a.startsWith('-')).pop();
          const pid = pidStr ? parseInt(pidStr, 10) : NaN;
          
          if (isNaN(pid)) {
              output = `kill: arguments must be process or job IDs`;
          } else {
              const idx = PROCESSES.findIndex(p => p.pid === pid);
              if (idx === -1) {
                  output = `kill: (${pid}) - No such process`;
              } else {
                  const proc = PROCESSES[idx];
                  if (pid === 8192 || proc.command === '/usr/bin/keepalive_d') {
                      if (isSigUsr1) {
                          output = `[SYSTEM] keepalive_d: Received SIGUSR1.\n[SYSTEM] Dumping state to /var/log/keepalive.dump... Done.`;
                          
                          // Create Dump File
                          if (!VFS['/var/log/keepalive.dump']) {
                              VFS['/var/log/keepalive.dump'] = {
                                  type: 'file',
                                  content: 'STATE_DUMP_V1:\nUPTIME: 99999s\nCONNECTIONS: 0\nFLAG: GHOST_ROOT{S1GN4L_TR4P_M4ST3R}\n'
                              };
                              const logDir = getNode('/var/log');
                              if (logDir && logDir.type === 'dir' && !logDir.children.includes('keepalive.dump')) {
                                  logDir.children.push('keepalive.dump');
                              }
                              
                              // Mission Update
                              if (!VFS['/var/run/signal_solved']) {
                                  VFS['/var/run/signal_solved'] = { type: 'file', content: 'TRUE' };
                                  const runDir = getNode('/var/run');
                                  if (runDir && runDir.type === 'dir' && !runDir.children.includes('signal_solved')) {
                                      runDir.children.push('signal_solved');
                                  }
                                  output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: SIGNAL HANDLED.\x1b[0m`;
                              }
                          }
                      } else {
                          output = `[SYSTEM] keepalive_d: Caught signal ${signal || 'SIGTERM'}. Ignoring (critical process).`;
                      }
                  } else if (pid === 1001) {
                      PROCESSES.splice(idx, 1);
                      if (!VFS['/var/run/disk_solved']) {
                          VFS['/var/run/disk_solved'] = { type: 'file', content: 'TRUE' };
                          const runDir = getNode('/var/run');
                          if (runDir && runDir.type === 'dir' && !runDir.children.includes('disk_solved')) {
                              runDir.children.push('disk_solved');
                          }
                          output = `[SYSTEM] Terminated log_daemon (PID 1001).\n[SYSTEM] Reclaiming disk space... Done.\n\nFLAG: GHOST_ROOT{D1SK_SP4C3_R3CL41M3D}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: DELETED FILE HANDLE.\x1b[0m`;
                      } else {
                          output = `[SYSTEM] Terminated log_daemon (PID 1001). Space reclaimed.`;
                      }
                  } else if (pid === 5000 || (proc.command && proc.command.includes('sys_bloat'))) {
                      const parentIdx = PROCESSES.findIndex(p => p.pid === 4999 || (p.command && p.command.includes('bloat_guard')));
                      if (parentIdx !== -1) {
                          output = `[sys_bloat] Terminated.\n[bloat_guard] ALERT: Child process died. Respawning immediately...\n[SYSTEM] New process started (PID ${pid + 1})`;
                          // Respawn logic - update PID
                          proc.pid = pid + 1;
                      } else {
                          PROCESSES.splice(idx, 1);
                          output = `[sys_bloat] Terminated.\n[SYSTEM] CPU load normalizing.\n\nFLAG: GHOST_ROOT{P4R3NT_PR0C3SS_K1LL3D}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: RUNAWAY PROCESS STOPPED.\x1b[0m`;
                          
                           // Mission Update
                           if (!VFS['/var/run/bloat_solved']) {
                               VFS['/var/run/bloat_solved'] = { type: 'file', content: 'TRUE' };
                               const runDir = getNode('/var/run');
                               if (runDir && runDir.type === 'dir' && !runDir.children.includes('bloat_solved')) {
                                   runDir.children.push('bloat_solved');
                               }
                           }
                      }
                  } else if (pid === 4999 || (proc.command && proc.command.includes('bloat_guard'))) {
                      PROCESSES.splice(idx, 1);
                      output = `[bloat_guard] Terminated. Watchdog disabled.`;
                  } else if (pid === 1) {
                      output = 'Attempting to kill init process...';
                      return { output, newCwd, action: 'kernel_panic' };
                  } else if (pid === 666) {
                      output = `bash: kill: (${pid}) - Operation not permitted\n[SYSTEM] Warning: Do not disturb the spectre kernel.`;
                  } else if (pid === 1337) {
                      output = 'Terminating shell...';
                      return { output, newCwd, action: 'kernel_panic' };
                  } else if (pid === 6000 || (proc.command === '/usr/bin/overseer')) {
                      if (VFS['/var/lock/overseer.lock']) {
                          // Respawn logic
                          output = `[SYSTEM] Service 'overseer' (PID ${pid}) killed by SIGTERM.\n[SYSTEMD] Service 'overseer' auto-restarted. New PID: ${pid + 1}`;
                          proc.pid = pid + 1; 
                          // Update VFS lock
                          VFS['/var/lock/overseer.lock'] = { type: 'file', content: String(pid + 1) };
                      } else {
                          PROCESSES.splice(idx, 1);
                          output = `[SUCCESS] Overseer terminated.\n\x1b[1;32m[MISSION UPDATE] Objective Complete: SYSTEM SERVICE NEUTRALIZED.\x1b[0m`;
                           // Mission Update
                           if (!VFS['/var/run/overseer_solved']) {
                               VFS['/var/run/overseer_solved'] = { type: 'file', content: 'TRUE' };
                               const runDir = getNode('/var/run');
                               if (runDir && runDir.type === 'dir' && !runDir.children.includes('overseer_solved')) {
                                   runDir.children.push('overseer_solved');
                               }
                           }
                      }
                  } else if (pid === 4001) {
                      output = `kill: (${pid}) - Process is a zombie (defunct). You cannot kill a zombie. Kill its parent (PPID: 4000) to cleanup.`;
                  } else if (pid === 4000) {
                      // Kill parent and child
                      PROCESSES.splice(idx, 1); // Kill 4000
                      const childIdx = PROCESSES.findIndex(p => p.pid === 4001);
                      if (childIdx !== -1) PROCESSES.splice(childIdx, 1); // Kill 4001
                      
                      // Remove lock
                      if (VFS['/var/lock/subsystem/vault.lock']) {
                          delete VFS['/var/lock/subsystem/vault.lock'];
                          const lockDir = getNode('/var/lock/subsystem');
                          if (lockDir && lockDir.type === 'dir') {
                              lockDir.children = lockDir.children.filter(c => c !== 'vault.lock');
                          }
                      }
                      output = `[${pid}] Terminated.\n[4001] Reaped (Zombie Cleanup).\n[SYSTEM] Vault Guardian terminated. Lock released.`;
                  } else if (pid === 31337) {
                      if (isSigKill) {
                          PROCESSES.splice(idx, 1);
                          // Remove lock file
                          if (VFS['/var/lock/watcher.lock']) {
                              delete VFS['/var/lock/watcher.lock'];
                              const lockDir = getNode('/var/lock');
                              if (lockDir && lockDir.type === 'dir') {
                                  lockDir.children = lockDir.children.filter(c => c !== 'watcher.lock');
                              }
                          }
                          output = `[31337] Killed (SIGKILL).\n[SYSTEM] Watcher Daemon terminated. Lock released.`;
                      } else {
                          output = `kill: (${pid}) - Process is a zombie (defunct). Use SIGKILL (-9) to force termination.`;
                      }
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
          const destPath = resolvePath(cwd, args[1]);
          
          if (destPath.startsWith('/var') && !!getNode('/var/log/overflow.dmp')) {
              output = `cp: error writing '${args[1]}': No space left on device`;
          } else if (srcNode) {
              const parentPath = destPath.substring(0, destPath.lastIndexOf('/'));
              const parent = getNode(parentPath);
              if (parent && parent.type === 'dir') {
                  if (srcNode.type === 'file') {
                      // Create/Update file
                      VFS[destPath] = { 
                          type: 'file', 
                          content: srcNode.content,
                          permissions: (srcNode as any).permissions // Preserve perms
                      };
                      
                      // Update parent children if new file
                      const fName = destPath.substring(destPath.lastIndexOf('/') + 1);
                      if (!parent.children.includes(fName)) {
                          parent.children.push(fName);
                      }
                  }
              } else {
                  output = `cp: cannot create regular file '${destPath}': No such file or directory`;
              }
          } else {
              output = `cp: cannot stat '${args[0]}': No such file or directory`;
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
      // Basic argument parsing
      const url = args.find(a => a.includes('http'));
      if (!url) {
        output = 'curl: try \'curl --help\' or \'curl --manual\' for more information';
      } else {
        // SSL Certificate Check Logic for secure.ghost.network
        if (url.includes('secure.ghost.network')) {
             if (args.includes('-k') || args.includes('--insecure')) {
                 output = `[INSECURE CONNECTION ESTABLISHED]\n[200 OK] Welcome to the Secure Ghost Network (Insecure Mode).\n(Note: The flag is only served over a valid SSL connection.)`;
                 return finalize(output, newCwd);
             } else {
                 const certPath = '/etc/ssl/certs/ca-certificates.crt';
                 const certNode = getNode(certPath);
                 let valid = false;
                 
                 if (certNode) {
                     if (certNode.type === 'file') {
                         valid = true;
                     } else if (certNode.type === 'symlink') {
                         const target = (certNode as any).target;
                         const targetNode = getNode(target); 
                         if (targetNode && targetNode.type === 'file') {
                             valid = true;
                         }
                     }
                 }
                 
                 if (!valid) {
                     output = `curl: (60) SSL certificate problem: unable to get local issuer certificate\nMore details here: https://curl.haxx.se/docs/sslcerts.html\n\ncurl: (60) SSL certificate problem: certificate has expired or is invalid`;
                     return finalize(output, newCwd);
                 }
                 
                 output = `[SECURE CONNECTION ESTABLISHED]\n[200 OK] Welcome to the Secure Ghost Network.\nFLAG: GHOST_ROOT{SYML1NK_M4ST3R_R3STOR3D}`;
                 return finalize(output, newCwd);
             }
        }

        if (url.includes('192.168.1.55') || url.includes('fl4g_server')) {
             if (url.includes('auth=GHOST_TOKEN_777')) {
                 output = `[DEPLOY] Connecting to payload delivery system...\n[UPLOAD] Sending agent binary... 100%\n[RESPONSE] HTTP 200 OK\n{\n  "status": "deployed",\n  "target": "covert_asset_v2",\n  "message": "Asset active. Standby for instructions.",\n  "flag": "GHOST_ROOT{D3BUG_MAST3R}"\n}`;
             } else {
                 output = `[DEPLOY] Connecting...\n[ERROR] HTTP 401 Unauthorized. Missing or invalid auth token.`;
             }
        } else if (url.includes('localhost:8080') || url.includes('127.0.0.1:8080')) {
             if (url.includes('/admin')) {
                 output = `[200 OK]\nContent-Type: text/plain\n\n# INTERNAL PROXY CONFIG\nFLAG: GHOST_ROOT{NG1NX_M1SCONF1G_R3V3AL3D}\n\n[MISSION UPDATE] Objective Complete: INTERNAL PROXY FOUND.`;
                 if (!VFS['/var/run/proxy_solved']) {
                     VFS['/var/run/proxy_solved'] = { type: 'file', content: 'TRUE' };
                     const runDir = getNode('/var/run');
                     if (runDir && runDir.type === 'dir' && !runDir.children.includes('proxy_solved')) {
                         runDir.children.push('proxy_solved');
                     }
                 }
                 return finalize(output, newCwd);
             } else {
                 output = `[403 Forbidden]\nAccess Denied.\n(Hint: Check /etc/nginx/sites-enabled for allowed paths)`;
                 return finalize(output, newCwd);
             }
        } else if (url.includes('10.96.0.1')) {
             // Cycle 77: Kubernetes Config
             const hasToken = args.some(a => a.includes('Authorization: Bearer GH0ST-KUBE-T0K3N-V1'));
             if (hasToken) {
                 output = `[200 OK]\nContent-Type: application/json\n\n{\n  "kind": "SecretList",\n  "items": [\n    {\n      "metadata": { "name": "admin-token" },\n      "data": { "token": "REDACTED" }\n    },\n    {\n      "metadata": { "name": "flag-secret" },\n      "data": { "flag": "GHOST_ROOT{K8S_C0NF1G_3XPOS3D}" }\n    }\n  ]\n}`;
                 output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: KUBERNETES EXPOSED.\x1b[0m`;
                 if (!VFS['/var/run/k8s_solved']) {
                     VFS['/var/run/k8s_solved'] = { type: 'file', content: 'TRUE' };
                     const runDir = getNode('/var/run');
                     if (runDir && runDir.type === 'dir' && !runDir.children.includes('k8s_solved')) {
                         runDir.children.push('k8s_solved');
                     }
                 }
                 return finalize(output, newCwd);
             } else {
                 output = `[401 Unauthorized]\nMetadata: { "kind": "Status", "status": "Failure", "message": "Unauthorized", "reason": "Unauthorized", "code": 401 }`;
                 return finalize(output, newCwd);
             }
        } else if (url.includes('google.com')) {
             output = '<HTML><HEAD><meta http-equiv="content-type" content="text/html;charset=utf-8">\n<TITLE>301 Moved</TITLE></HEAD><BODY>\n<H1>301 Moved</H1>\nThe document has moved\n<A HREF="http://www.google.com/">here</A>.\n</BODY></HTML>';
        } else {
             output = `curl: (6) Could not resolve host: ${url}`;
        }
      }
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
       if (args.length > 0 && (args[0] === '-s' || args[0] === '--set')) {
           const isRoot = !!getNode('/tmp/.root_session');
           if (!isRoot) {
               output = `date: cannot set date: Operation not permitted`;
           } else {
               output = `date: cannot set date: Use ntpdate to sync with time server.`;
           }
       } else {
           const now = new Date(Date.now() + SYSTEM_TIME_OFFSET);
           output = now.toString();
       }
       break;
    }
    case 'rdate':
    case 'ntpdate': {
       if (args.length < 1) {
           output = `usage: ${command} [-u] <server>`;
       } else {
           const server = args[args.length - 1];
           const isRoot = !!getNode('/tmp/.root_session');
           
           if (!isRoot) {
               output = `${command}: bind: Permission denied\nExiting, name server cannot be used: Operation not permitted`;
           } else {
               if (server === 'time.ghost.network' || server === 'pool.ntp.org' || server === '192.168.1.1') {
                   output = `${command}: adjust time server ${server} offset 0.00021 sec`;
                   SYSTEM_TIME_OFFSET = 0; // Fix time
                   VFS['/var/run/time_synced'] = { type: 'file', content: 'TRUE' };
               } else {
                   output = `${command}: no server suitable for synchronization found`;
               }
           }
       }
       break;
    }
    case 'zip': {
       if (args.length < 2) {
           output = 'usage: zip <archive.zip> <files...>';
       } else {
           const archiveName = args[0];
           const archivePath = resolvePath(cwd, archiveName);
           
           if (archivePath.startsWith('/var') && !!getNode('/var/log/overflow.dmp')) {
               output = `zip: error writing '${archiveName}': No space left on device`;
           } else {
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
       }
       break;
    }
    case 'unzip': {
       if (args.length < 1) {
           output = 'usage: unzip [-P password] <file.zip>';
       } else {
           let archiveName = args[args.length - 1];
           let password = '';
           
           if (args.includes('-P')) {
               const pIndex = args.indexOf('-P');
               if (args[pIndex + 1]) {
                   password = args[pIndex + 1];
               }
           }
           
           const nonFlagArgs = args.filter((a, i) => !a.startsWith('-') && args[i-1] !== '-P');
           if (nonFlagArgs.length > 0) archiveName = nonFlagArgs[0];

           const archivePath = resolvePath(cwd, archiveName);
           const node = getNode(archivePath);
           
           if (!node) {
               output = `unzip: cannot find or open ${archiveName}.`;
           } else if (node.type === 'dir') {
               output = `unzip: ${archiveName}: Is a directory`;
           } else if (node.type === 'symlink') {
               output = `unzip: ${archiveName}: Is a symbolic link`;
           } else {
               const content = (node as any).content;
               
               if (content.startsWith('PK_ENC_V1:')) {
                   if (password === 'Omega_Secure_Pass_2026') {
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
                       output = `unzip: incorrect password (use -P)`;
                   }
               } else if (content.startsWith('PK_SIM_V1:')) {
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

                               // Mission Update for payload.txt
                               if (fname === 'payload.txt' && fcontent.includes('GHOST_ROOT{')) {
                                   if (!VFS['/var/run/archive_recovered']) {
                                       VFS['/var/run/archive_recovered'] = { type: 'file', content: 'TRUE' };
                                       const runDir = getNode('/var/run');
                                       if (runDir && runDir.type === 'dir' && !runDir.children.includes('archive_recovered')) {
                                           runDir.children.push('archive_recovered');
                                       }
                                       output += `\x1b[1;32m[MISSION UPDATE] Objective Complete: ARCHIVE RECOVERED.\x1b[0m\n`;
                                   }
                               }
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
    case 'file': {
      if (args.length < 1) {
        output = 'usage: file <file>';
      } else {
        const target = args[0];
        const path = resolvePath(cwd, target);
        const node = getNode(path);
        
        if (!node) {
          output = `${target}: cannot open \`${target}' (No such file or directory)`;
        } else if (node.type === 'dir') {
          output = `${target}: directory`;
        } else if (node.type === 'symlink') {
          const targetPath = (node as any).target;
          output = `${target}: symbolic link to ${targetPath}`;
        } else {
          const content = (node as any).content || '';
          if (content.startsWith('PK_SIM_V1:')) {
            output = `${target}: Zip archive data, at least v2.0 to extract`;
          } else if (content.startsWith('GZIP_V1:')) {
             output = `${target}: gzip compressed data, was "payload", last modified: 2026-02-11`;
          } else if (content.startsWith('TAR_V1:')) {
             output = `${target}: POSIX tar archive (GNU)`;
          } else if (content.startsWith('7z')) {
             output = `${target}: 7-zip archive data, version 0.4`;
          } else if (content.startsWith('MZ') || content.includes('BINARY_ELF')) {
             output = `${target}: ELF 64-bit LSB executable, x86-64, version 1 (SYSV)`;
          } else if (content.startsWith('-----BEGIN OPENSSH PRIVATE KEY-----')) {
             output = `${target}: OpenSSH private key`;
          } else if (content.startsWith('-----BEGIN CERTIFICATE-----')) {
             output = `${target}: PEM certificate`;
          } else if (/^[A-Za-z0-9+/=]+$/.test(content.replace(/\s/g, '')) && content.length > 20) {
             output = `${target}: ASCII text, with very long lines (Base64 encoded?)`;
          } else {
             output = `${target}: ASCII text`;
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
                       // Relaxed password check (trim whitespace)
                       const cleanPass = password ? password.trim() : '';
                       
                       if (['spectre', 'admin', 'ghost', '0xDEADBEEF', 'SPECTRE_EVE', '0451'].includes(cleanPass)) {
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
               } else if (node.type === 'symlink') {
                   output = `tar: ${archiveName}: Is a symbolic link`;
               } else {
                   const content = (node as any).content;
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
    case 'openssl': {
        const subcmd = args[0];
        if (!subcmd || args.includes('help')) {
            output = 'OpenSSL 1.1.1f  31 Mar 2020\nusage: openssl command [command-opts] [command-args]\n\nStandard commands\nenc\nreq\nx509\ngenrsa';
        } else if (subcmd === 'req') {
            if (args.includes('-new') && args.includes('-key') && args.includes('-out')) {
                const keyIndex = args.indexOf('-key') + 1;
                const outIndex = args.indexOf('-out') + 1;
                const keyFile = args[keyIndex];
                const outFile = args[outIndex];
                
                const keyNode = getNode(resolvePath(cwd, keyFile));
                if (!keyNode) {
                    output = `openssl: ${keyFile}: No such file or directory`;
                } else if (keyNode.type !== 'file' || !keyNode.content.includes('RSA PRIVATE KEY')) {
                    output = `openssl: ${keyFile}: Not a valid private key`;
                } else {
                    // Check permissions (just warn)
                    const perms = (keyNode as any).permissions || '0644';
                    if (perms !== '0600') {
                        // Warn but proceed? No, let's just proceed.
                    }
                    
                    // Generate CSR
                    output = `Generating a 2048 bit RSA private key...
................................+++
................+++
writing new private key to '${keyFile}'
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]: JP
State or Province Name (full name) [Some-State]: Tokyo
Locality Name (eg, city) []: Shibuya
Organization Name (eg, company) [Internet Widgits Pty Ltd]: Project Omega
Organizational Unit Name (eg, section) []: SatOps
Common Name (e.g. server FQDN or YOUR name) []: satellite.omega.net
Email Address []: admin@omega.net

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []: 
An optional company name []: 
`;
                    const outPath = resolvePath(cwd, outFile);
                    const parent = getNode(cwd);
                    if (parent && parent.type === 'dir') {
                        VFS[outPath] = {
                            type: 'file',
                            content: `CSR_V1:[REQUEST_DATA]...[SIGNATURE]...`
                        };
                        const fName = outPath.substring(outPath.lastIndexOf('/') + 1);
                        if (!parent.children.includes(fName)) parent.children.push(fName);
                    }
                }
            } else {
                output = 'usage: openssl req -new -key <keyfile> -out <output>';
            }
        } else if (subcmd === 'x509') {
            if (args.includes('-text') && args.includes('-in')) {
                const inIndex = args.indexOf('-in') + 1;
                const inFile = args[inIndex];
                const node = getNode(resolvePath(cwd, inFile));
                
                if (!node || node.type !== 'file') {
                    output = `openssl: ${inFile}: No such file or directory`;
                } else if (node.content.includes('CERTIFICATE')) {
                     output = `Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            04:8b:2d:1a:5c:9f:00:23:41:7e
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: C=JP, ST=Tokyo, L=Shibuya, O=Project Omega, CN=Omega_Secure_Pass_2026
        Validity
            Not Before: Jan 1 00:00:00 2024 GMT
            Not After : Feb 11 23:59:59 2026 GMT
        Subject: C=JP, ST=Tokyo, L=Shibuya, O=Project Omega, CN=*.omega.net
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                RSA Public-Key: (2048 bit)
                Modulus:
                    00:c3:2b:1a:..
                Exponent: 65537 (0x10001)
    Signature Algorithm: sha256WithRSAEncryption
         3d:2a:4f:..`;
                } else {
                    output = `openssl: unable to load certificate`;
                }
            } else if (args.includes('-req') && args.includes('-in') && args.includes('-signkey') && args.includes('-out')) {
                const inIndex = args.indexOf('-in') + 1;
                const keyIndex = args.indexOf('-signkey') + 1;
                const outIndex = args.indexOf('-out') + 1;
                
                const inFile = args[inIndex];
                const keyFile = args[keyIndex];
                const outFile = args[outIndex];
                
                const csrNode = getNode(resolvePath(cwd, inFile));
                const keyNode = getNode(resolvePath(cwd, keyFile));
                
                if (!csrNode || !keyNode) {
                    output = `openssl: Error opening input files`;
                } else {
                    output = `Signature ok\nsubject=/C=JP/ST=Tokyo/L=Shibuya/O=Project Omega/OU=SatOps/CN=satellite.omega.net/emailAddress=admin@omega.net\nGetting Private key`;
                    
                    const outPath = resolvePath(cwd, outFile);
                    const parent = getNode(outPath.substring(0, outPath.lastIndexOf('/')) || '/');
                    
                    if (parent && parent.type === 'dir') {
                        VFS[outPath] = {
                            type: 'file',
                            content: '[CERT] ISSUER: OMEGA | EXPIRY: 2030-12-31 | [VALID]'
                        };
                        const fName = outPath.substring(outPath.lastIndexOf('/') + 1);
                        if (!parent.children.includes(fName)) parent.children.push(fName);

                        // Mission Update (Cycle 46)
                        if (!VFS['/var/run/ssl_solved']) {
                            VFS['/var/run/ssl_solved'] = { type: 'file', content: 'TRUE' };
                            const runDir = getNode('/var/run');
                            if (runDir && runDir.type === 'dir' && !runDir.children.includes('ssl_solved')) {
                                runDir.children.push('ssl_solved');
                            }
                            output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: SSL CERTIFICATE RENEWED.\x1b[0m`;
                        }
                    } else {
                        output = `openssl: ${outFile}: No such file or directory`;
                    }
                }
            } else {
                output = 'usage: openssl x509 [-text] -in <file> ...';
            }
        } else if (subcmd === 'enc') {
            const hasDecrypt = args.includes('-d');
            const cipher = args.find(a => a.startsWith('-aes-') || a === '-bf');
            const inFileIdx = args.indexOf('-in');
            const outFileIdx = args.indexOf('-out');
            const passIdx = args.indexOf('-k');
            
            if (inFileIdx === -1 || !args[inFileIdx + 1]) {
                output = 'enc: input file required (-in)';
            } else {
                const inFile = args[inFileIdx + 1];
                const inPath = resolvePath(cwd, inFile);
                const inNode = getNode(inPath);
                
                if (!inNode || inNode.type !== 'file') {
                    output = `enc: ${inFile}: No such file or directory`;
                } else if (!hasDecrypt) {
                    output = 'enc: encryption not supported in simulation (decrypt only)';
                } else {
                    let password = '';
                    if (passIdx !== -1 && args[passIdx + 1]) {
                        password = args[passIdx + 1];
                    } else {
                        output = 'enc: password required (-k)';
                    }
                    
                    if (password) {
                        if (password === 'GHOST_PROTOCOL_V1' || password === '20240115') {
                            let decryptedContent = 'COORDINATES: 51.5074 N, 0.1278 W\nTARGET: MI6_HQ\nFLAG: GHOST_ROOT{0P3NSSL_M4ST3R}';
                            if (password === '20240115') {
                                decryptedContent = 'PROJECT CHIMERA BLUEPRINT (FINAL)\n\n[SYSTEM ARCHITECTURE]\n- Neural Core: Quantum-v4\n- Uplink: Satellite OMEGA\n- Failsafe: DETONATION_PROTOCOL\n\nFLAG: GHOST_ROOT{R4NS0MW4R3_D3CRYPT3D}';
                            }
                            
                            if (outFileIdx !== -1 && args[outFileIdx + 1]) {
                                const outFile = args[outFileIdx + 1];
                                const outPath = resolvePath(cwd, outFile);
                                const parent = outPath.substring(0, outPath.lastIndexOf('/'));
                                const pNode = getNode(parent);
                                if (pNode && pNode.type === 'dir') {
                                    const fName = outPath.substring(outPath.lastIndexOf('/') + 1);
                                    VFS[outPath] = { type: 'file', content: decryptedContent };
                                    if (!pNode.children.includes(fName)) pNode.children.push(fName);
                                    output = ''; // Silent success
                                } else {
                                    output = `enc: ${outFile}: No such file or directory (path check)`;
                                }
                            } else {
                                output = decryptedContent;
                            }
                        } else {
                            output = 'bad decrypt';
                        }
                    }
                }
            }
        } else {
            output = `openssl:Error: '${subcmd}' is an invalid command.`;
        }
        break;
    }
    case 'zcat': {
       if (args.length < 1) {
           output = 'usage: zcat [file...]';
       } else {
           const file = args[0];
           const fPath = resolvePath(cwd, file);
           const node = getNode(fPath);

           if (!node) {
               output = `zcat: ${file}: No such file or directory`;
           } else if (node.type === 'dir') {
               output = `zcat: ${file}: Is a directory`;
           } else if (node.type === 'symlink') {
               output = `zcat: ${file}: Is a symbolic link`;
           } else {
               const content = (node as any).content;
               if (content.startsWith('GZIP_V1:')) {
                   const payload = content.substring(8);
                   if (payload.startsWith('{') && payload.endsWith('}')) {
                        output = payload.substring(1, payload.length - 1);
                   } else {
                        output = payload;
                   }
               } else {
                   output = `zcat: ${file}: not in gzip format`;
               }
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
           
           const validUnits = ['sshd', 'tor', 'apache2', 'postgresql', 'cron', 'networking', 'bluetooth', 'ghost_relay', 'overseer'];
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
                   if (unit === 'ghost_relay') {
                       if (PROCESSES.find(p => p.pid === 4444)) {
                           output = `Job for ghost_relay.service failed because the control process exited with error code.\nSee "systemctl status ghost_relay.service" and "journalctl -xe" for details.`;
                           const log = getNode('/var/log/syslog');
                           if (log && log.type === 'file') {
                               log.content += `\n${new Date().toUTCString()} ghost_relay[9001]: Error: listen tcp 0.0.0.0:8080: bind: address already in use`;
                           }
                           return { output, newCwd };
                       } else {
                           if (!VFS['/var/run/relay_active']) {
                                VFS['/var/run/relay_active'] = { type: 'file', content: 'TRUE' };
                                const rdNode = VFS[runDir];
                                if (rdNode && rdNode.type === 'dir' && !rdNode.children.includes('relay_active')) {
                                    rdNode.children.push('relay_active');
                                }
                           }
                           output = 'Starting Ghost Relay Service...\n[OK] Started Ghost Relay Service.\n\x1b[1;32m[MISSION UPDATE] Objective Complete: RELAY ONLINE.\x1b[0m';
                       }
                   }

                   if (unit === 'networking') {
                       // Do nothing special visual
                   }
                   
                   if (unit === 'tor') {
                       const torrc = getNode('/etc/tor/torrc');
                       if (!torrc || torrc.type !== 'file' || torrc.content.includes('InvalidPort')) {
                           output = `Job for tor.service failed because the control process exited with error code.\nSee "systemctl status tor.service" and "journalctl -xe" for details.`;
                           const log = getNode('/var/log/syslog');
                           if (log && log.type === 'file') {
                               log.content += `\n${new Date().toUTCString()} systemd[1]: Failed to start Anonymizing overlay network for TCP.\n${new Date().toUTCString()} tor[6666]: [err] Parsing config file /etc/tor/torrc failed: Syntax error: "InvalidPort" is not a valid option.`;
                           }
                           return { output, newCwd };
                       }
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
                   if (unit === 'overseer') {
                        if (VFS['/var/lock/overseer.lock']) {
                            output = `Failed to stop overseer.service: Unit is locked by /var/lock/overseer.lock`;
                            return { output, newCwd };
                        } else {
                            // Kill process
                            const idx = PROCESSES.findIndex(p => p.command === '/usr/bin/overseer' || p.pid >= 6000);
                            if (idx !== -1) PROCESSES.splice(idx, 1);
                        }
                   }
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
    case 'route': {
        const subCmd = args[0];
        if (!subCmd || subCmd === '-n') {
            let table = `Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\n0.0.0.0         0.0.0.0         0.0.0.0         U     0      0        0 eth0\n192.168.1.0     0.0.0.0         255.255.255.0   U     0      0        0 eth0`;
            
            if (VFS['/var/run/route_fixed']) {
                 table += `\n10.10.99.0      192.168.1.1     255.255.255.0   UG    0      0        0 eth0`;
            }
            output = table;
        } else if (subCmd === 'add') {
            // route add -net 10.10.99.0 netmask 255.255.255.0 gw 192.168.1.1
            // route add default gw 192.168.1.1
            
            const isDefault = args.includes('default');
            const isNet = args.includes('-net') || args.includes('10.10.99.0') || args.includes('10.10.99.0/24');
            const gwIndex = args.indexOf('gw');
            const gw = gwIndex !== -1 ? args[gwIndex + 1] : null;

            if (gw === '192.168.1.1') {
                if (isNet || isDefault) {
                    if (!VFS['/var/run/route_fixed']) {
                        VFS['/var/run/route_fixed'] = { type: 'file', content: 'TRUE' };
                        const runDir = getNode('/var/run');
                        if (runDir && runDir.type === 'dir' && !runDir.children.includes('route_fixed')) {
                            runDir.children.push('route_fixed');
                        }
                        output = `[SUCCESS] Route added.\n[NETWORK] Connectivity to Black Site Uplink (10.10.99.0/24) restored.\nFLAG: GHOST_ROOT{R0UT1NG_T4BL3_F1X3D}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: NETWORK ROUTING.\x1b[0m`;
                    } else {
                        output = `SIOCADDRT: File exists`;
                    }
                } else {
                     output = `route: invalid destination`;
                }
            } else {
                output = `SIOCADDRT: Network is unreachable`;
            }
        } else {
            output = `Usage: route [-n] [add] [-net|-host] target [gw Gw] [netmask Nm]`;
        }
        break;
    }
    case 'sed': {
       if (args.length < 1) {
           output = 'usage: sed [-i] <expression> [file]';
       } else {
           const inPlace = args.includes('-i');
           // Remove -i from args to find expression and file
           const cleanArgs = args.filter(a => a !== '-i');
           
           if (cleanArgs.length < 1) {
               output = 'usage: sed [-i] <expression> [file]';
           } else {
               let expression = cleanArgs[0];
               if ((expression.startsWith("'") && expression.endsWith("'")) || (expression.startsWith('"') && expression.endsWith('"'))) {
                   expression = expression.slice(1, -1);
               }

               let content = '';
               let targetNode: any = null;
               
               if (cleanArgs.length > 1) {
                   const node = getNode(resolvePath(cwd, cleanArgs[1]));
                   if (node && node.type === 'file') {
                       content = node.content;
                       targetNode = node;
                   } else {
                       output = `sed: cannot read ${cleanArgs[1]}: No such file`;
                       return { output, newCwd };
                   }
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
                           const result = content.replace(regex, replace);
                           
                           if (inPlace && targetNode) {
                               targetNode.content = result;
                               output = ''; // Silent success
                           } else {
                               output = result;
                           }
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
                  
                  // SSL Check for OMEG (Cycle 46)
                  if (id === 'OMEG') {
                      const certPath = '/etc/ssl/certs/satellite.crt';
                      const certNode = getNode(certPath);
                      
                      if (!certNode || certNode.type !== 'file' || certNode.content.includes('[EXPIRED]')) {
                          output = `[ERROR] SAT_LINK_V4: SSL Handshake Failed.\n[REASON] Certificate Expired (Issuer: OMEGA | Expiry: 1999-12-31).\n[HINT] Renew certificate using 'openssl req' and 'openssl x509'.`;
                          return { output, newCwd, action: 'delay' };
                      }
                  }

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
       const fileIdx = args.indexOf('-r');
       if (fileIdx !== -1 && args[fileIdx + 1]) {
           const filename = args[fileIdx + 1];
           const path = resolvePath(cwd, filename);
           const node = getNode(path);
           
           if (!node || node.type !== 'file') {
               output = `tcpdump: ${filename}: No such file or directory`;
           } else {
               if (filename.endsWith('.pcap') || node.content.startsWith('PCAP_V1')) {
                   const restArgs = args.filter((a, i) => a !== '-r' && i !== fileIdx && i !== fileIdx + 1);
                   const filterStr = restArgs.join(' ');
                   
                   if (filterStr.includes('port 4444') || filterStr.includes('host 10.10.10.10')) {
                       output = `reading from file ${filename}, link-type EN10MB (Ethernet)
14:02:05.123456 IP 10.10.10.10.4444 > 192.168.1.5.31337: Flags [P.], seq 1:42, ack 1, win 502, options [nop,nop,TS val 123456 ecr 123456], length 41
    0x0000:  4500 005d 1a2b 4000 4006 a2c4 0a0a 0a0a  E..].+@.@.......
    0x0010:  c0a8 0105 115c 7a69 82e1 3564 82e1 3569  .....\\zi..5d..5i
    0x0020:  8018 01f6 6842 0000 0101 080a 026e 2460  ....hB.......n$\`
    0x0030:  0019 1918 4748 4f53 545f 524f 4f54 7b50  ......GHOST_ROOT{P
    0x0040:  3443 4b33 545f 4d34 5354 3352 7d0a       4CK3T_M4ST3R}..
`;
                        if (!VFS['/var/run/pcap_solved']) {
                             VFS['/var/run/pcap_solved'] = { type: 'file', content: 'TRUE' };
                             const runDir = getNode('/var/run');
                             if (runDir && runDir.type === 'dir' && !runDir.children.includes('pcap_solved')) {
                                 runDir.children.push('pcap_solved');
                             }
                             output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: PACKET ANALYZED.\x1b[0m`;
                        }
                   } else {
                       output = `reading from file ${filename}, link-type EN10MB (Ethernet)\n`;
                       for(let i=0; i<15; i++) {
                           output += `14:02:0${i}.${Math.floor(Math.random()*999999)} IP 192.168.1.${Math.floor(Math.random()*255)}.443 > 10.0.0.${Math.floor(Math.random()*255)}.553${i}: Flags [.], ack ${Math.floor(Math.random()*999999)}, win 501, length 0\n`;
                       }
                       output += `... (1542 packets captured)\n[INFO] Too many packets. Use a filter (e.g., 'port <num>', 'host <ip>')`;
                   }
               } else {
                   output = `tcpdump: ${filename}: File format not recognized`;
               }
           }
       } else if (args.includes('--help') || args.includes('-h')) {
           output = 'tcpdump version 4.9.3\nlibpcap version 1.9.1\nUsage: tcpdump [-i interface] [-w file] [-r file] [expression]';
       } else {
           output = 'tcpdump: verbose output suppressed, use -v or -vv for full protocol decode\nlistening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes\n';
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
                   // Check config first (systemctl mirror)
                   const torrc = getNode('/etc/tor/torrc');
                   if (!torrc || torrc.type !== 'file' || torrc.content.includes('InvalidPort')) {
                       output = '[ERROR] Tor failed to start. Configuration error in /etc/tor/torrc.\nSee "journalctl -xe" for details.';
                       const log = getNode('/var/log/syslog');
                       if (log && log.type === 'file') {
                           log.content += `\n${new Date().toUTCString()} tor[6666]: [err] Parsing config file /etc/tor/torrc failed: Syntax error: "InvalidPort" is not a valid option.`;
                       }
                       return { output, newCwd };
                   }

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
           } else if (node.type === 'file') {
               // Cycle 61: Python Bytecode Reverse Engineering
               if (fileName.endsWith('.pyc')) {
                   // User trying to run .pyc directly?
                   output = `RuntimeError: Bad magic number in .pyc file`;
               } else if (fileName === 'decompile.py' || (node.content && node.content.includes('dis.dis'))) {
                   // Allow user to write a decompilation script?
                   // Or if they run `python3 -m dis auth.pyc` (args check needed)
               } 
               
               // Check for dis module usage in command
               if (args.includes('-m') && args.includes('dis') && args.some(a => a.endsWith('auth.pyc'))) {
                   output = `  1           0 LOAD_CONST               1 ('GHOST_ROOT{PYC_R3V3RS3_3NG1N33R}')
              2 STORE_NAME               0 (secret_key)
              4 LOAD_CONST               0 (None)
              6 RETURN_VALUE`;
                   
                   if (!VFS['/var/run/pyc_solved']) {
                       VFS['/var/run/pyc_solved'] = { type: 'file', content: 'TRUE' };
                       const runDir = getNode('/var/run');
                       if (runDir && runDir.type === 'dir' && !runDir.children.includes('pyc_solved')) {
                           runDir.children.push('pyc_solved');
                       }
                       output += `\n\n\x1b[1;32m[MISSION UPDATE] Objective Complete: PYTHON BYTECODE REVERSED.\x1b[0m`;
                   }
                   return { output, newCwd, action: 'delay' };
               }

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

               if ((fNode as any).content.includes('PK_SIM_V1')) {
                    output += `\n1048576       0x100000        Zip archive data, at least v2.0 to extract, compressed size: 412, uncompressed size: 1024, name: _hidden_key`;
               }

               if (extract) {
                   if ((fNode as any).content.includes('PK_SIM_V1')) {
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
            } else if (node.type === 'symlink') {
                output = `exiftool: ${target}: Is a symbolic link`;
            } else {
                const content = (node as any).content || '';
                // Check for Metadata Header in our mock format
                const match = content.match(/\[METADATA_HEADER\]([\s\S]*?)\[END_METADATA\]/);
                
                if (match) {
                    const metadata = match[1].trim().split('\n');
                    output = `ExifTool Version Number         : 12.00\nFile Name                       : ${target}\nFile Size                       : ${content.length} bytes\nFile Permissions                : rw-r--r--\n` + 
                             metadata.map((line: string) => {
                                 // Handle "UserComment" specially to support newlines or long text if needed
                                 const [key, ...valParts] = line.split(':');
                                 const val = valParts.join(':');
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
                   if ((node as any).content.includes('HANDSHAKE') || fileTarget.endsWith('.cap')) {
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
                   if ((node as any).content.startsWith('\x7fELF') || dumpFile.endsWith('.dump') || dumpFile.endsWith('.dmp')) {
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
    case 'type': {
       if (args.length < 1) {
           output = 'type: usage: type <command>';
       } else {
           const cmd = args[0];
           if (ALIASES[cmd]) {
               output = `${cmd} is aliased to \`${ALIASES[cmd]}\``;
           } else if (COMMANDS.includes(cmd)) {
               output = `${cmd} is /usr/bin/${cmd}`;
           } else {
               output = `bash: type: ${cmd}: not found`;
           }
       }
       break;
    }
    case 'unalias': {
        if (args.length < 1) {
            output = 'unalias: usage: unalias <name>';
        } else {
            const name = args[0];
            if (ALIASES[name]) {
                delete ALIASES[name];
                output = ''; 
            } else {
                output = `bash: unalias: ${name}: not found`;
            }
        }
        break;
    }
    case 'jobs': {
        if (JOBS.length === 0) {
            output = 'jobs: no active jobs';
        } else {
            output = JOBS.map(j => `[${j.id}]+  ${j.status.padEnd(10)} ${j.command}`).join('\n');
        }
        break;
    }
    case 'fg': {
        const jobId = args.length > 0 ? parseInt(args[0].replace('%', '')) : 1;
        const job = JOBS.find(j => j.id === jobId);

        if (!job) {
            output = `fg: job ${jobId} not found`;
        } else {
            // Remove job from list (simulating completion for this puzzle)
            JOBS = JOBS.filter(j => j.id !== jobId);
            
            output = `${job.command}\n`;
            
            if (job.command.includes('decrypt_chimera')) {
                output += `[SYSTEM] Resuming decryption process (PID ${job.pid})...\n[====================] 100%\n[SUCCESS] CHIMERA PROTOCOL DECRYPTED.\n\nPAYLOAD: GHOST_ROOT{J0B_C0NTR0L_M4ST3R}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: BACKGROUND PROCESS RECOVERED.\x1b[0m`;
                
                // Mission Update Flag
                if (!VFS['/var/run/chimera_decrypted']) {
                    VFS['/var/run/chimera_decrypted'] = { type: 'file', content: 'TRUE' };
                    const runDir = getNode('/var/run');
                    if (runDir && runDir.type === 'dir' && !runDir.children.includes('chimera_decrypted')) {
                        runDir.children.push('chimera_decrypted');
                    }
                }
            } else {
                output += `[PROCESS COMPLETED]`;
            }
        }
        break;
    }
    case 'bg': {
        const jobId = args.length > 0 ? parseInt(args[0].replace('%', '')) : 1;
        const job = JOBS.find(j => j.id === jobId);

        if (!job) {
            output = `bg: job ${jobId} not found`;
        } else {
            job.status = 'Running';
            output = `[${job.id}]+ ${job.command} &`;
        }
        break;
    }
    case 'uplink_connect': {
        if (ENV_VARS['UPLINK_KEY'] === 'XJ9-SAT-442') {
            output = `[UPLINK] Initiating connection to OMEGA-SAT-1...\n[STATUS] Handshake Complete (Key Verified).\n[DATA] Downloading payload...\n\nPayload: GHOST_ROOT{ENV_V4R_M4ST3R}\n\x1b[1;32m[MISSION UPDATE] Objective Complete: SATELLITE UPLINK SECURED.\x1b[0m`;
            
            if (!VFS['/var/run/uplink_established']) {
                VFS['/var/run/uplink_established'] = { type: 'file', content: 'TRUE' };
                const runDir = getNode('/var/run');
                if (runDir && runDir.type === 'dir' && !runDir.children.includes('uplink_established')) {
                    runDir.children.push('uplink_established');
                }
            }
             return { output, newCwd, action: 'sat_sim' };
        } else {
            output = 'uplink: CONNECTION REFUSED (Auth Failed)\n[ERROR] Environment variable UPLINK_KEY missing or invalid.\n[HINT] Check /etc/uplink.conf for protocol details.';
        }
        break;
    }
    case 'beacon': {
        output = 'Beacon started (PID 9999) in background.\n(Listening on localhost:4444...)\n';
        return { output, newCwd };
    }
    case 'openssl': {
        if (args[0] === 'enc' && args.includes('-d') && args.includes('-aes-256-cbc')) {
            const inIdx = args.indexOf('-in');
            const outIdx = args.indexOf('-out');
            const kIdx = args.indexOf('-k');
            
            const inFile = inIdx !== -1 ? args[inIdx + 1] : null;
            const outFile = outIdx !== -1 ? args[outIdx + 1] : null;
            const key = kIdx !== -1 ? args[kIdx + 1] : null;
            
            if (!inFile || !outFile || !key) {
                output = 'openssl: missing required arguments';
            } else {
                const inPath = resolvePath(cwd, inFile);
                const inNode = getNode(inPath);
                
                if (!inNode || inNode.type !== 'file') {
                    output = `openssl: ${inFile}: No such file`;
                } else if (key !== 'aes-256-key-0xDEADBEEF' && key !== 'PROTOCOL_NAME_V1') {
                    output = 'bad decrypt';
                } else {
                    const outPath = resolvePath(cwd, outFile);
                    const parentDir = resolvePath(outPath, '..');
                    const fileName = outPath.split('/').pop();
                    const parentNode = getNode(parentDir);
                    
                    if (parentNode && parentNode.type === 'dir' && fileName) {
                        if (inFile.includes('blackbox.enc')) {
                             VFS[outPath] = { 
                                type: 'file', 
                                content: `[DECRYPTED DATA]\n\nTARGET_ID: 99-ZULU\nCOORDINATES: 51.5074 N, 0.1278 W\n\nMESSAGE: The asset is in place. Operation 'Black Widow' is a go.\nFLAG: GHOST_ROOT{0P3NSSL_M4ST3R}` 
                            };
                            if (!parentNode.children.includes(fileName)) parentNode.children.push(fileName);
                            
                            output = 'decryption successful';
                            if (!VFS['/var/run/decrypt_count']) {
                                VFS['/var/run/decrypt_count'] = { type: 'file', content: '1' };
                            } else {
                                const node = VFS['/var/run/decrypt_count'];
                                const count = (node && node.type === 'file') ? parseInt(node.content) : 0;
                                if (node && node.type === 'file') node.content = String(count + 1);
                            }
                        } else if (inFile.includes('omega_blueprint')) {
                             VFS[outPath] = { 
                                type: 'file', 
                                content: `[BLUEPRINT RECOVERED]\n\nPROJECT OMEGA\n..................\n(ASCII ART OF A DOOMSDAY DEVICE)\n\nCRITICAL COMPONENT: The key to the vault is hidden in the 'steghide' password list.\n\nFLAG: GHOST_ROOT{R4NS0MW4R3_D3F34T3D}` 
                            };
                            if (!parentNode.children.includes(fileName)) parentNode.children.push(fileName);
                            output = 'decryption successful\n\x1b[1;32m[MISSION UPDATE] Objective Complete: BLUEPRINTS RECOVERED.\x1b[0m';
                        } else {
                            output = 'decryption successful';
                        }
                    } else {
                        output = `openssl: ${outFile}: No such directory`;
                    }
                }
            }
        } else {
            output = 'openssl: usage: openssl enc -d -aes-256-cbc -in <file> -out <file> -k <key>';
        }
        break;
    }
    case 'docker': {
        const subcmd = args[0];
        if (args.length < 1) {
             output = `Usage: docker [OPTIONS] COMMAND\n\nCommands:\n  ps          List containers\n  run         Run a command in a new container\n  stop        Stop one or more running containers\n  rm          Remove one or more containers\n  inspect     Return low-level information on Docker objects\n  logs        Fetch the logs of a container`;
        } else if (subcmd === 'ps') {
             output = `CONTAINER ID   IMAGE                 COMMAND                  CREATED        STATUS          PORTS                    NAMES
a1b2c3d4e5f6   ghost-relay:latest    "/bin/sh -c 'while..."   2 hours ago    Up 2 hours      0.0.0.0:8080->80/tcp     ghost-relay
f9e8d7c6b5a4   secure-vault:v1.2     "/vault/keeper"          4 days ago     Up 4 days       0.0.0.0:9000->9000/tcp   secure-vault
1234567890ab   postgres:14-alpine    "docker-entrypoint..."   5 days ago     Exited (0)                               db-primary`;
        } else if (subcmd === 'images') {
             output = `REPOSITORY          TAG       IMAGE ID       CREATED        SIZE
ghost-relay         latest    a1b2c3d4e5f6   2 hours ago    156MB
secure-vault        v1.2      f9e8d7c6b5a4   4 days ago     89MB
postgres            14-alpine 1234567890ab   5 days ago     214MB`;
        } else if (subcmd === 'inspect') {
             if (args.length < 2) {
                 output = 'docker inspect: requires at least 1 argument.';
             } else {
                 const id = args[1];
                 if (id.startsWith('f9e8') || id === 'secure-vault') {
                      output = `[
    {
        "Id": "f9e8d7c6b5a4...",
        "Created": "2026-02-05T12:00:00.000000000Z",
        "Path": "/vault/keeper",
        "Args": [],
        "State": {
            "Status": "running",
            "Running": true,
            "Pid": 4001
        },
        "Image": "sha256:f9e8d7c6b5a4...",
        "Name": "/secure-vault",
        "Config": {
            "Hostname": "f9e8d7c6b5a4",
            "Domainname": "",
            "User": "",
            "Env": [
                "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                "VAULT_MODE=locked",
                "VAULT_KEY=GHOST_ROOT{C0NT41N3R_3SC4P3}",
                "MAX_RETRIES=3"
            ],
            "Cmd": [
                "/vault/keeper"
            ]
        }
    }
]`;
                      // Mission update: Found Flag
                      if (!VFS['/var/run/docker_flag']) {
                          VFS['/var/run/docker_flag'] = { type: 'file', content: 'TRUE' };
                          const runDir = getNode('/var/run');
                          if (runDir && runDir.type === 'dir' && !runDir.children.includes('docker_flag')) {
                              runDir.children.push('docker_flag');
                          }
                          output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: CONTAINER INSPECTED.\x1b[0m`;
                      }

                 } else if (id.startsWith('a1b2') || id === 'ghost-relay') {
                      output = `[
    {
        "Id": "a1b2c3d4e5f6...",
        "Name": "/ghost-relay",
        "Config": {
            "Env": [
                "RELAY_HOST=192.168.1.99"
            ]
        }
    }
]`;
                 } else {
                      output = `Error: No such object: ${id}`;
                 }
             }
        } else if (subcmd === 'logs') {
             const id = args[1];
             if (!id) {
                 output = 'docker logs: requires exactly 1 argument.';
             } else if (id.startsWith('f9e8') || id === 'secure-vault') {
                 output = `[VAULT] Starting service version 1.2
[VAULT] Loading configuration from ENV...
[VAULT] Warning: VAULT_KEY is exposed in environment variables.
[VAULT] Service listening on port 9000
[VAULT] Access attempt from 172.17.0.1: Denied.`;
             } else if (id.startsWith('a1b2') || id === 'ghost-relay') {
                 output = `[RELAY] Initializing secure connection...
[RELAY] Connection established to 192.168.1.99
[RELAY] Heartbeat sent.`;
             } else {
                 output = `Error: No such container: ${id}`;
             }
        } else if (subcmd === 'stop') {
             const id = args[1];
             if (!id) {
                 output = 'docker stop: requires at least 1 argument.';
             } else if (id.startsWith('a1b2') || id === 'ghost-relay') {
                 output = `${id}`;
             } else if (id.startsWith('f9e8') || id === 'secure-vault') {
                 output = `Error response from daemon: cannot stop container: ${id}: permission denied`;
             } else {
                 output = `Error: No such container: ${id}`;
             }
        } else if (subcmd === 'run') {
             // docker run -v /:/mnt -it alpine cat /mnt/root/shadow_config.yml
            const vIndex = args.indexOf('-v');
            const imageIndex = args.findIndex(a => ['alpine', 'ubuntu', 'secure-vault', 'busybox', 'ghost-relay'].some(img => a.includes(img)));
            
            if (imageIndex === -1) {
                output = 'docker run: requires a valid image (alpine, ubuntu, secure-vault, ghost-relay)';
            } else {
                let mountSource = '';
                let mountTarget = '';
                
                if (vIndex !== -1 && args[vIndex + 1]) {
                    const mountParts = args[vIndex + 1].split(':');
                    if (mountParts.length >= 2) {
                        mountSource = mountParts[0];
                        mountTarget = mountParts[1];
                    }
                }

                const commandToRun = args.slice(imageIndex + 1);
                
                if (commandToRun.length > 0) {
                    const cmd = commandToRun[0];
                    const cmdArgs = commandToRun.slice(1);
                    
                    if (cmd === 'cat') {
                        const targetFile = cmdArgs[0];
                        let resolvedPath = targetFile;
                        
                        // Volume Mapping Logic
                        if (mountSource === '/' && targetFile.startsWith(mountTarget)) {
                            // Strip mount target prefix to get host path
                            const relativePath = targetFile.substring(mountTarget.length);
                            resolvedPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
                            
                            // Check host VFS
                            const node = getNode(resolvedPath);
                            if (node && node.type === 'file') {
                                output = node.content;
                                
                                // Specific Puzzle Flag
                                if (resolvedPath === '/root/shadow_config.yml') {
                                     if (!VFS['/var/run/docker_esc_solved']) {
                                         VFS['/var/run/docker_esc_solved'] = { type: 'file', content: 'TRUE' };
                                         const runDir = getNode('/var/run');
                                         if (runDir && runDir.type === 'dir' && !runDir.children.includes('docker_esc_solved')) {
                                             runDir.children.push('docker_esc_solved');
                                         }
                                         output += '\n\x1b[1;32m[MISSION UPDATE] Objective Complete: DOCKER ESCAPE (PRIVILEGE ESCALATION).\x1b[0m';
                                     }
                                }
                            } else {
                                output = `cat: ${targetFile}: No such file or directory`;
                            }
                        } else {
                            output = `cat: ${targetFile}: No such file or directory (Container FS is empty)`;
                        }
                    } else if (['/bin/bash', '/bin/sh', 'bash', 'sh'].includes(cmd)) {
                         output = `root@container:/# `;
                         return { output, newCwd: '/', newPrompt: 'root@container:/# ', action: 'delay' };
                    } else {
                         output = `docker: executable file not found in $PATH: ${cmd}`;
                    }
                } else {
                    // Interactive Shell Default
                    output = `root@container:/# `;
                    return { output, newCwd: '/', newPrompt: 'root@container:/# ', action: 'delay' };
                }
            }
        } else {
             output = `docker: '${subcmd}' is not a docker command.`;
        }
        break;
    }
    case 'lsmod': {
        let out = 'Module                  Size  Used by\n';
        out += 'iptable_filter         12810  1\n';
        out += 'ip_tables              27126  1 iptable_filter\n';
        out += 'x_tables               29641  1 ip_tables\n';
        if (VFS['/proc/backdoor']) {
            out += 'backdoor               13370  0\n';
        }
        output = out;
        break;
    }
    case 'insmod': {
        if (args.length < 1) {
            output = 'insmod: usage: insmod <module_file>';
        } else {
            const fileTarget = args[0];
            const filePath = resolvePath(cwd, fileTarget);
            const node = getNode(filePath);
            
            if (!node) {
                output = `insmod: ERROR: could not insert module ${fileTarget}: No such file or directory`;
            } else if (node.type !== 'file') {
                 output = `insmod: ERROR: could not insert module ${fileTarget}: Not a file`;
            } else if (!filePath.endsWith('.ko')) {
                 output = `insmod: ERROR: could not insert module ${fileTarget}: Invalid module format`;
            } else if (filePath.includes('backdoor.ko')) {
                 if (VFS['/proc/backdoor']) {
                     output = `insmod: ERROR: could not insert module ${fileTarget}: Module already loaded`;
                 } else {
                     VFS['/proc/backdoor'] = { type: 'file', content: 'GHOST_ROOT{K3RN3L_M0DUL3_H4CK}\n' };
                     const proc = getNode('/proc');
                     if (proc && proc.type === 'dir' && !proc.children.includes('backdoor')) {
                         proc.children.push('backdoor');
                     }
                     output = '\n\x1b[1;32m[MISSION UPDATE] Objective Complete: KERNEL MODULE BACKDOOR.\x1b[0m';
                 }
            } else {
                 output = `insmod: ERROR: could not insert module ${fileTarget}: Operation not permitted`;
            }
        }
        break;
    }
    case 'rmmod': {
        if (args.length < 1) {
            output = 'rmmod: usage: rmmod <module_name>';
        } else {
            const modName = args[0];
            if (modName === 'backdoor') {
                if (VFS['/proc/backdoor']) {
                    delete VFS['/proc/backdoor'];
                    const proc = getNode('/proc');
                    if (proc && proc.type === 'dir') {
                        proc.children = proc.children.filter(c => c !== 'backdoor');
                    }
                    output = ''; // Silent success
                } else {
                    output = `rmmod: ERROR: Module ${modName} is not currently loaded`;
                }
            } else if (['iptable_filter', 'ip_tables', 'x_tables'].includes(modName)) {
                output = `rmmod: ERROR: Module ${modName} is in use`;
            } else {
                output = `rmmod: ERROR: Module ${modName} is not currently loaded`;
            }
        }
        break;
    }
    case 'getfattr': {
        if (args.length === 0) {
            output = 'Usage: getfattr [-d] [-n name] <file>';
        } else {
            const fileName = args[args.length - 1]; 
            const showAll = args.includes('-d');
            const nameIndex = args.indexOf('-n');
            const requestedName = nameIndex !== -1 && args[nameIndex + 1] ? args[nameIndex + 1] : null;

            const filePath = resolvePath(cwd, fileName);
            const node = getNode(filePath);

            if (!node) {
                output = `getfattr: ${fileName}: No such file or directory`;
            } else if (node.type !== 'file') {
                output = `getfattr: ${fileName}: Not a regular file`;
            } else {
                const fileNode = node as any;
                if (!fileNode.xattrs || Object.keys(fileNode.xattrs).length === 0) {
                    output = ''; 
                } else {
                    let buffer = `# file: ${fileName}\n`;
                    let hasOutput = false;
                    for (const [key, val] of Object.entries(fileNode.xattrs)) {
                        if (showAll || requestedName === key) {
                             buffer += `${key}="${val}"\n`;
                             hasOutput = true;
                             
                             // Puzzle Solve Check
                             if ((val as string).includes('GHOST_ROOT{ALT_D4T4_STR34M_FOUND}')) {
                                  // Update Mission State
                                  if (!VFS['/var/run/xattr_solved']) {
                                      VFS['/var/run/xattr_solved'] = { type: 'file', content: 'TRUE' };
                                      const runDir = getNode('/var/run');
                                      if (runDir && runDir.type === 'dir' && !runDir.children.includes('xattr_solved')) {
                                          runDir.children.push('xattr_solved');
                                      }
                                      buffer += '\n\x1b[1;32m[MISSION UPDATE] Objective Complete: ALTERNATE DATA STREAM (XATTR).\x1b[0m';
                                  }
                             }
                        }
                    }
                    output = hasOutput ? buffer : ''; 
                }
            }
        }
        break;
    }
    case 'lsattr': {
        if (args.length < 1) {
            output = 'Usage: lsattr [OPTION]... [FILE]...';
        } else {
            const fileName = args[args.length - 1]; 
            const filePath = resolvePath(cwd, fileName);
            const node = getNode(filePath);

            if (!node) {
                output = `lsattr: ${fileName}: No such file or directory`;
            } else if (node.type !== 'file') {
                output = `lsattr: ${fileName}: Inappropriate ioctl for device`;
            } else {
                const attrs = FILE_ATTRIBUTES[filePath] || [];
                const attrStr = '----' + (attrs.includes('i') ? 'i' : '-') + '---------';
                output = `${attrStr} ${fileName}`;
            }
        }
        break;
    }
    case 'chattr': {
        if (args.length < 2) {
            output = 'Usage: chattr [-+=aAcCdDeijsStTu] [files...]';
        } else {
            const modeArg = args[0];
            const fileName = args[1];
            const filePath = resolvePath(cwd, fileName);
            const isRoot = !!getNode('/tmp/.root_session');
            
            if (!isRoot) {
                output = `chattr: Operation not permitted`;
            } else {
                const node = getNode(filePath);
                if (!node) {
                    output = `chattr: ${fileName}: No such file or directory`;
                } else if (node.type !== 'file') {
                    output = `chattr: ${fileName}: Operation not supported`;
                } else {
                    const op = modeArg[0]; // + - =
                    const flag = modeArg.substring(1);
                    
                    if (flag !== 'i') {
                         output = `chattr: invalid mode: '${modeArg}' (simulation supports only 'i')`;
                    } else {
                        const currentAttrs = FILE_ATTRIBUTES[filePath] || [];
                        if (op === '+') {
                            if (!currentAttrs.includes('i')) {
                                FILE_ATTRIBUTES[filePath] = [...currentAttrs, 'i'];
                            }
                        } else if (op === '-') {
                            if (currentAttrs.includes('i')) {
                                FILE_ATTRIBUTES[filePath] = currentAttrs.filter(a => a !== 'i');
                                
                                // Puzzle Solve Check (Cycle 75)
                                if (filePath === '/etc/security/lockdown.conf') {
                                     output = `\x1b[1;32m[MISSION UPDATE] Objective Complete: IMMUTABLE ATTRIBUTE REMOVED.\x1b[0m\nFLAG: GHOST_ROOT{1MMUT4BL3_ATTR_RM}`;
                                     if (!VFS['/var/run/attr_rm_solved']) {
                                         VFS['/var/run/attr_rm_solved'] = { type: 'file', content: 'TRUE' };
                                         const runDir = getNode('/var/run');
                                         if (runDir && runDir.type === 'dir' && !runDir.children.includes('attr_rm_solved')) {
                                             runDir.children.push('attr_rm_solved');
                                         }
                                     }
                                     return finalize(output, newCwd);
                                }
                            }
                        } else if (op === '=') {
                            FILE_ATTRIBUTES[filePath] = ['i'];
                        }
                        output = ''; // Silent success
                    }
                }
            }
        }
        break;
    }
    case 'getcap': {
        if (args.length < 1) {
            output = 'usage: getcap <file>';
        } else {
            const target = args[0];
            const node = getNode(resolvePath(cwd, target));
            if (node && node.type === 'file' && (node as any).xattrs && (node as any).xattrs['security.capability']) {
                output = `${target} = ${(node as any).xattrs['security.capability']}`;
            } else if (node) {
                output = ''; // No capabilities
            } else {
                output = `getcap: ${target}: No such file or directory`;
            }
        }
        break;
    }
    case 'tac': {
        if (args.length < 1) {
            output = 'usage: tac <file>';
        } else {
            const target = args[0];
            const node = getNode(resolvePath(cwd, target));
            
            // Capability Check for /usr/bin/tac
            const binaryNode = getNode('/usr/bin/tac');
            const hasCap = binaryNode && (binaryNode as any).xattrs && (binaryNode as any).xattrs['security.capability'] === 'cap_dac_read_search+ep';
            
            if (!node) {
                output = `tac: ${target}: No such file or directory`;
            } else if (node.type === 'dir') {
                output = `tac: ${target}: Is a directory`;
            } else {
                 // Check permissions logic similar to 'cat'
                 // BUT if hasCap is true, bypass permission check
                 const fileNode = node as any;
                 let allowed = false;
                 
                 if (hasCap) {
                     allowed = true;
                 } else {
                     // Standard check
                     if ((resolvePath(cwd, target).startsWith('/root')) && !VFS['/tmp/.root_session']) {
                         allowed = false;
                     } else {
                         allowed = true;
                     }
                 }
                 
                 if (allowed) {
                     const content = fileNode.content;
                     output = content.split('\n').reverse().join('\n');
                     if (content.includes('GHOST_ROOT{C4P_D4C_R34D_BYP4SS}')) {
                         if (!VFS['/var/run/cap_solved']) {
                             VFS['/var/run/cap_solved'] = { type: 'file', content: 'TRUE' };
                             output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: CAPABILITY ESCALATION.\x1b[0m`;
                         }
                     }
                 } else {
                     output = `tac: ${target}: Permission denied`;
                 }
            }
        }
        break;
    }
    case 'lsmod': {
        output = 'Module                  Size  Used by\n';
        output += 'nf_conntrack           131072  2\niptable_filter          16384  1\nip_tables              28672  1 iptable_filter\nx_tables               40960  2 iptable_filter,ip_tables\n';
        if (LOADED_MODULES.includes('blackbox')) {
            output += 'blackbox               12288  0\n';
        }
        break;
    }
    case 'modinfo': {
        if (args.length < 1) {
            output = 'usage: modinfo <module_file>';
        } else {
            const target = args[0];
            let node = getNode(resolvePath(cwd, target));
            
            // If not found by path, try to find in /lib/modules if just a name is given
            if (!node && !target.includes('/')) {
                 node = getNode(`/lib/modules/5.4.0-ghost/kernel/drivers/misc/${target}.ko`);
            }

            if (!node || node.type !== 'file') {
                 if (target === 'blackbox') {
                     output = 'filename:       /lib/modules/5.4.0-ghost/kernel/drivers/misc/blackbox.ko\nlicense:        GPL\ndescription:    Black Box Interface Driver\nauthor:         Unknown\nsrcversion:     B49382098402\ndepends:        \nretpoline:      Y\nname:           blackbox\nvermagic:       5.4.0-ghost SMP mod_unload';
                 } else {
                    output = `modinfo: ERROR: Module ${target} not found.`;
                 }
            } else {
                const content = (node as any).content;
                if (content.startsWith('[KERNEL_MODULE_V1]')) {
                    output = content.substring(content.indexOf('\n') + 1);
                } else {
                     output = `modinfo: ERROR: Module ${target} not found or invalid format.`;
                }
            }
        }
        break;
    }
    case 'insmod': {
        if (args.length < 1) {
            output = 'usage: insmod <filename>';
        } else {
            const target = args[0];
            const path = resolvePath(cwd, target);
            const node = getNode(path);
            
            if (!node) {
                output = `insmod: ERROR: could not insert '${target}': No such file or directory`;
            } else if (node.type !== 'file') {
                output = `insmod: ERROR: could not insert '${target}': Is a directory`;
            } else if (!(node as any).content.startsWith('[KERNEL_MODULE_V1]')) {
                output = `insmod: ERROR: could not insert '${target}': Invalid module format`;
            } else {
                const parts = target.split('/');
                const filename = parts[parts.length - 1];
                const modName = filename.replace('.ko', '');

                if (LOADED_MODULES.includes(modName)) {
                    output = `insmod: ERROR: could not insert '${target}': Module already loaded`;
                } else {
                    LOADED_MODULES.push(modName);
                    output = ''; 
                    
                    if (modName === 'blackbox') {
                        if (!VFS['/dev/blackbox']) {
                            VFS['/dev/blackbox'] = { type: 'file', content: 'GHOST_ROOT{K3RN3L_HACK3R_V1}\n[DEVICE_STATUS] ONLINE\n[DATA_STREAM] 0x4B3R' };
                            const dev = getNode('/dev');
                            if (dev && dev.type === 'dir' && !dev.children.includes('blackbox')) {
                                dev.children.push('blackbox');
                            }
                            if (!VFS['/var/run/insmod_solved']) {
                                VFS['/var/run/insmod_solved'] = { type: 'file', content: 'TRUE' };
                                const runDir = getNode('/var/run');
                                if (runDir && runDir.type === 'dir' && !runDir.children.includes('insmod_solved')) {
                                    runDir.children.push('insmod_solved');
                                }
                                output += `\n\x1b[1;32m[MISSION UPDATE] Objective Complete: KERNEL MODULE LOADED.\x1b[0m`;
                            }
                        }
                    }
                }
            }
        }
        break;
    }
    case 'rmmod': {
        if (args.length < 1) {
            output = 'usage: rmmod <modulename>';
        } else {
            const name = args[0];
            if (LOADED_MODULES.includes(name)) {
                const idx = LOADED_MODULES.indexOf(name);
                LOADED_MODULES.splice(idx, 1);
                if (name === 'blackbox') {
                    delete VFS['/dev/blackbox'];
                    const dev = getNode('/dev');
                    if (dev && dev.type === 'dir') {
                        const i = dev.children.indexOf('blackbox');
                        if (i > -1) dev.children.splice(i, 1);
                    }
                }
                output = '';
            } else {
                output = `rmmod: ERROR: Module ${name} is not currently loaded`;
            }
        }
        break;
    }
    default:
      output = `bash: ${command}: command not found`;
  }

  return finalize(output, newCwd, action, data, newPrompt);
};
