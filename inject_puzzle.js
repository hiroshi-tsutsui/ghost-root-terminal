const fs = require('fs');
const path = 'ghost_root/web/lib/Shell.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Inject Init
const initCode = `
    // Cycle 248 Init (The DNS Poison)
    if (!VFS['/usr/bin/connect_secure']) {
        const ensureDir = (p) => { if (!VFS[p]) VFS[p] = { type: 'dir', children: [] }; };
        const link = (p, c) => { const n = getNode(p); if (n && n.type === 'dir' && !n.children.includes(c)) n.children.push(c); };

        ensureDir('/usr'); ensureDir('/usr/bin');
        link('/usr', 'bin');

        VFS['/usr/bin/connect_secure'] = {
            type: 'file',
            content: '[BINARY_ELF_X86_64] [SECURE_CLIENT]\\n[TARGET] secure.corp\\n[PORT] 443\\n',
            permissions: '0755'
        };
        link('/usr/bin', 'connect_secure');

        if (!VFS['/etc/hosts']) {
             ensureDir('/etc');
             link('/', 'etc');
             VFS['/etc/hosts'] = { 
                 type: 'file', 
                 content: '127.0.0.1 localhost\\n',
                 permissions: '0644' 
             };
             link('/etc', 'hosts');
        }

        if (!VFS['/home/ghost/dns_alert.txt']) {
            VFS['/home/ghost/dns_alert.txt'] = {
                type: 'file',
                content: '[ALERT] DNS Server Failure.\\n[ERROR] Cannot resolve "secure.corp".\\n[ACTION] Add manual override to /etc/hosts.\\n[Target IP] 10.10.10.10'
            };
            const home = getNode('/home/ghost');
            if (home && home.type === 'dir' && !home.children.includes('dns_alert.txt')) {
                home.children.push('dns_alert.txt');
            }
        }
    }
`;

// Find the end of loadSystemState
const initHookRegex = /};(\s+)export const processCommand/;
let injectedInit = false;
if (initHookRegex.test(content)) {
    content = content.replace(initHookRegex, (match, space) => {
        injectedInit = true;
        return initCode + '};' + space + 'export const processCommand';
    });
    console.log("Injected Init Logic.");
} else {
    console.log("Failed to match Init Hook. Regex: /};(\\s+)export const processCommand/");
    // Debug: print context around potential match
    const idx = content.indexOf('export const processCommand');
    if (idx !== -1) {
        console.log("Found export at: " + idx);
        console.log("Preceding chars: " + JSON.stringify(content.substring(idx - 20, idx)));
    }
}

// 2. Inject Command
const cmdCode = `
    // Cycle 248: The DNS Poison
    case 'connect_secure':
    case '/usr/bin/connect_secure': {
        const hostsNode = getNode('/etc/hosts');
        let resolved = false;
        
        if (hostsNode && hostsNode.type === 'file') {
            const lines = hostsNode.content.split('\\n');
            for (const line of lines) {
                if (line.trim().match(/^10\\.10\\.10\\.10\\s+secure\\.corp$/)) {
                    resolved = true;
                    break;
                }
            }
        }

        if (resolved) {
             output = '[CONNECT] Resolving secure.corp... [10.10.10.10]\\n[SUCCESS] Connection Established.\\nFLAG: GHOST_ROOT{DNS_P01S0N_M4ST3R}\\n\\x1b[1;32m[MISSION UPDATE] Objective Complete: DNS OVERRIDE ACTIVE.\\x1b[0m';
        } else {
             output = '[CONNECT] Resolving secure.corp... [FAILED]\\n[ERROR] Host not found or DNS server unreachable.\\n[HINT] Check /etc/hosts for manual overrides.';
        }
        break;
    }
`;

// Hook: default: output = `bash: ${command}: command not found`;
// This string is unique enough?
const cmdHookString = 'default:\n      output = `bash: ${command}: command not found`;';
// Trying regex to be safe with whitespace
const cmdHookRegex = /(\s+default:\s+output = `bash: \${command}: command not found`;)/;

if (cmdHookRegex.test(content)) {
    content = content.replace(cmdHookRegex, (match) => {
        return cmdCode + match;
    });
    console.log("Injected Command Logic.");
} else {
    console.log("Failed to match Command Hook.");
}

if (injectedInit) {
    fs.writeFileSync(path, content);
    console.log("File updated.");
} else {
    console.log("Aborted write due to init failure.");
}
