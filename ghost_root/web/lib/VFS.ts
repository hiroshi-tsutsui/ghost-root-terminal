// VFS.ts - Virtual File System for the browser
// Ported from ghost_root/src/VFS.js

export interface FileNode {
  type: 'file';
  content: string;
  permissions?: string;
}

export interface DirNode {
  type: 'dir';
  children: string[];
  permissions?: string;
}

export interface SymlinkNode {
  type: 'symlink';
  target: string;
  permissions?: string;
}

export type VFSNode = FileNode | DirNode | SymlinkNode;

const VFS: Record<string, VFSNode> = {
  '/': {
    type: 'dir',
    children: ['home', 'etc', 'var', 'archive', 'usr', 'root', 'tmp', 'dev', 'lib', 'mnt', 'opt', 'remote'],
    permissions: '755'
  },
  '/root': {
    type: 'dir',
    children: ['launch_codes.bin', 'README.txt']
  },
  '/root/launch_codes.bin': {
    type: 'file',
    content: 'TEFVTkNIX0NPREVTX0lOSVRJQVRFRA==' // Base64 for "LAUNCH_CODES_INITIATED"
  },
  '/root/README.txt': {
    type: 'file',
    content: 'WARNING: DO NOT DECRYPT WITHOUT AUTHORIZATION.\nKEY IS ROTATED DAILY VIA SATELLITE LINK (COSMOS-2542).'
  },
  '/usr': {
    type: 'dir',
    children: ['src', 'bin', 'share']
  },
  '/usr/bin': {
    type: 'dir',
    children: ['gcc', 'net-bridge', 'void_crypt', 'deploy_agent', 'otp_gen', 'recover_data', 'ghost_update']
  },
  '/usr/bin/ghost_update': {
    type: 'file',
    content: `#!/bin/bash
# GHOST_UPDATE_V1
# Updates system packages and security definitions.

echo "Checking for updates..."
# [LOCK CHECK]
if [ -f "/var/lib/dpkg/lock-frontend" ]; then
  echo "E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 1234 (unattended-upgr)."
  echo "E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), is another process using it?"
  exit 1
fi

echo "Hit:1 http://security.ghost.network/ghost-bionic InRelease"
echo "Fetching updates... [100%]"
echo "Update Complete."
echo "FLAG: GHOST_ROOT{L0CK_F1L3_R3M0V3D}"
`
  },
  '/usr/bin/strange_binary': {
    type: 'file',
    content: '\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x3e\x00\x01\x00\x00\x00\x30\x05\x40\x00\x00\x00\x00\x00@\x00\x00\x00\x00\x00\x00\x00LICENSE_KEY_CHECK\x00\x00GHOST_ROOT{STR1NGS_R3V3AL_S3CR3TS}\x00\x00ACCESS_DENIED\x00'
  },
  '/usr/bin/recover_data': {
    type: 'file',
    content: `#!/bin/bash
# RECOVER_DATA_V1
# RESTORES CRITICAL SYSTEM FILE: /mnt/data/secure_store.bin

TARGET="/mnt/data/secure_store.bin"

echo "[INFO] Initializing recovery sequence..."
echo "[INFO] Target: $TARGET"

# Payload Injection
echo "GHOST_ROOT{M0UNT_RW_SUCC3SS}" > $TARGET

if [ $? -eq 0 ]; then
  echo "[SUCCESS] Data recovered."
else
  echo "[ERROR] Write failed. Check filesystem permissions or mount status."
fi
`
  },
  '/usr/bin/net-bridge': {
    type: 'file',
    content: `#!/bin/bash
# NET-BRIDGE v1.0
# ESTABLISH UPLINK TO SECRET RELAY

# AUTOMATED TARGET ACQUISITION
# Scans logs for the daily bridge target IP
TARGET=$(grep "BRIDGE_TARGET" /var/log/syslog | awk '{print $NF}')

if [ -z "$TARGET" ]; then
  echo "Error: Target IP not found."
  exit 1
fi

echo "Initiating handshake with $TARGET..."
# [FATAL ERROR] SEGMENTATION FAULT
# [CORRUPTION DETECTED AT OFFSET 0x4A]
# [MANUAL OVERRIDE REQUIRED: Connect via 'nc']
`
  },
  '/usr/bin/deploy_agent': {
    type: 'file',
    content: `#!/bin/bash
# DEPLOY_AGENT_V2
# Auto-deployment to covert asset.

# TARGET_SERVER="192.168.1.55"
TARGET_SERVER="fl4g_server" # TODO: Update DNS
AUTH_TOKEN="GHOST_TOKEN_777"

echo "Deploying to $TARGET_SERVER..."
curl -s "http://$TARGET_SERVER/api/deploy?auth=$AUTH_TOKEN"
# ERROR: Could not resolve host
`
  },
  '/usr/bin/otp_gen': {
    type: 'file',
    content: '[BINARY_ELF_X86_64]\n[DEPENDENCY: ntpdate]\n[USAGE: ./otp_gen]',
    permissions: '755'
  },
  '/usr/bin/void_crypt': {
    type: 'file',
    content: '[BINARY_ELF_X86_64]\n[DEPENDENCY: libvoid.so]\n[USAGE: ./void_crypt <input>]'
  },
  '/opt': {
    type: 'dir',
    children: ['libs']
  },
  '/opt/libs': {
    type: 'dir',
    children: ['libvoid.so']
  },
  '/opt/libs/libvoid.so': {
    type: 'file',
    content: '[ELF_SHARED_OBJECT]\n[EXPORT: void_encrypt, void_decrypt]'
  },
  '/usr/src': {
    type: 'dir',
    children: ['exploit.c', 'Makefile', 'ghost_kernel']
  },
  '/usr/src/Makefile': {
    type: 'file',
    content: `all: exploit

exploit: exploit.c
	gcc exploit.c -o exploit
	@echo "Build successful."

clean:
	rm exploit
`
  },
  '/usr/src/ghost_kernel': {
    type: 'dir',
    children: ['source_code.c']
  },
  '/usr/src/ghost_kernel/source_code.c': {
    type: 'file',
    content: '/*\n * GHOST KERNEL V1.0\n * Copyright (c) 2024 The Architect\n *\n * TODO: Remove backdoor access code: GHOST_ROOT{TH3_ARCH1T3CT_L1V3S}\n */\n\nvoid kernel_init() {\n  // ...\n}'
  },
  '/usr/src/exploit.c': {
    type: 'file',
    content: `#include <stdio.h>
#include <string.h>

int main(int argc, char *argv[]) {
    char buffer[64];
    if (argc < 2) {
        printf("Usage: %s <payload>\\n", argv[0]);
        return 1;
    }
    // VULNERABILITY: strcpy is unsafe!
    strcpy(buffer, argv[1]);
    printf("Input: %s\\n", buffer);
    return 0;
}
/*
 * TODO: Compile with -fno-stack-protector
 * Target: /usr/sbin/auth_service
 * Offset: 76
 */`
  },
  '/home': {
    type: 'dir',
    children: ['recovery', 'ghost', 'dr_akira']
  },
  '/home/recovery': {
    type: 'dir',
    children: ['emergency_protocol.sh', '.cache', 'notes.txt']
  },
  '/home/recovery/emergency_protocol.sh': {
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
  '/home/recovery/.cache': {
    type: 'dir',
    children: ['temp.log', 'auth.key']
  },
  '/home/recovery/.cache/temp.log': {
    type: 'file',
    content: `[INFO] Cache cleared successfully.
[WARN] Failed to remove auth.key: Permission denied.
`
  },
  '/home/recovery/.cache/auth.key': {
    type: 'file',
    content: `-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA3...
(This is a fake key, but it looks important)
KEY_ID: GHOST_PROTOCOL_INIT_V2
-----END RSA PRIVATE KEY-----`
  },
  '/home/recovery/notes.txt': {
    type: 'file',
    content: 'Meeting with SysAdmin at 14:00. Remember to check the logs.'
  },
  '/home/ghost': {
    type: 'dir',
    children: ['project_alpha', 'secrets', '.bash_history', 'wifi_note.txt', 'journal', 'evidence.jpg', 'surveillance.jpg', 'tools', 'tools.zip', 'capture.cap', 'drone_manual.txt', 'beacon_protocol.txt', 'hashes.txt', 'wordlist.txt', 'operations']
  },
  '/home/ghost/operations': {
    type: 'dir',
    children: ['blackbox.enc', 'README.txt']
  },
  '/home/ghost/operations/blackbox.enc': {
    type: 'file',
    content: 'Salted__\x00\x00\x00\x00\x00\x00\x00\x00[ENCRYPTED_DATA_AES_256_CBC]'
  },
  '/home/ghost/operations/README.txt': {
    type: 'file',
    content: 'INTERCEPTED TRANSMISSION\n------------------------\nSource: Unknown\nEncryption: AES-256-CBC\n\nWe managed to get the file, but it is encrypted.\nIntel suggests the password is the name of our protocol (uppercase) followed by version 1.\nExample: PROTOCOL_NAME_V1\n\nUse: openssl enc -d -aes-256-cbc -in blackbox.enc -out decrypted.txt -k <password>'
  },
  '/home/ghost/beacon_protocol.txt': {
    type: 'file',
    content: 'BEACON PROTOCOL v1.0\n--------------------\nOur field agents use a "dead drop" signal to transmit data safely.\nThe binary is \'/bin/beacon\' (simulated, just type "beacon").\n\nINSTRUCTIONS:\n1. The beacon transmits to localhost port 4444.\n2. It retries indefinitely until a connection is made.\n3. You must set up a listener (\'nc -l 4444\') to catch the payload.\n\nWARNING: The beacon process must be active while you listen.\n(Hint: Use \'&\' to run it in the background).'
  },
  '/home/ghost/tools': {
    type: 'dir',
    children: ['signal_decoder.sh']
  },
  '/home/ghost/tools/signal_decoder.sh': {
    type: 'file',
    content: `#!/bin/bash
# SIGNAL_DECODER_V1
# PURPOSE: Decrypt raw signal data from the uplink.

# Check input file
if [ ! -f "/var/data/raw_signal.dat" ]; then
  echo "Error: Input file /var/data/raw_signal.dat not found."
  echo "Please restore from backup if missing."
  exit 1
fi

echo "Decoding signal stream..."
# The pipeline is: cat file | decode | filter key
cat /var/data/raw_signal.dat | base64 -d | grep "KEY"
`,
    permissions: '000'
  },
  '/home/ghost/hashes.txt': {
    type: 'file',
    content: '5f4dcc3b5aa765d61d8327deb882cf99\n098f6bcd4621d373cade4e832627b4f6'
  },
  '/home/ghost/wordlist.txt': {
    type: 'file',
    content: 'password\n123456\nadmin\nghost\nspectre\nkirov\nreporting\nred_ledger\nSPECTRE_EVE\nhunter2\ncorrect_horse_battery_staple'
  },
  '/home/ghost/drone_manual.txt': {
    type: 'file',
    content: 'RAVEN-X DRONE OPERATING MANUAL\n\n1. CONNECT\n   Use "drone connect <id>" to establish uplink.\n   Default ID: DR-01\n\n2. CONTROLS\n   (Automated flight path in simulation mode)\n\n3. TROUBLESHOOTING\n   If signal is lost, check battery levels.\n   WARNING: Do not fly near the Black Site (Sector 7). Anti-air defenses active.'
  },
  '/home/ghost/tools.zip': {
    type: 'file',
    content: 'PK_SIM_V1:{exploit.py:cHJpbnQoIlRoaXMgaXMgYSBmYWtlIGV4cGxvaXQuIik=}{README.md:VGhpcyB6aXAgY29udGFpbnMgdG9vbHMgZm9yIHRlc3Rpbmcu}'
  },
  '/home/ghost/evidence.jpg': {
    type: 'file',
    content: 'ÿØÿà\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00ÿá\x00\x16Exif\x00\x00MM\x00*\x00\x00\x00\x08\x00\x01\x01\x12\x00\x03\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00ÿÛ\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0C\x14\r\x0C\x0B\x0B\x0C\x19\x12\x13\x0F\x14\x1D\x1A\x1F\x1E\x1D\x1A\x1C\x1C $.\' ",#\x1C\x1C(7),01444\x1F\'9=82<.342ÿÛ\x00C\x01\t\t\t\x0C\x0B\x0C\x18\r\r\x182!\x1C!22222222222222222222222222222222222222222222222222ÿÀ\x00\x11\x08\x00d\x00d\x03\x01\x22\x00\x02\x11\x01\x03\x11\x01ÿÄ\x00\x1F\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0BÿÄ\x00\xB5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07"q\x142\x81\x91¡\x08#B±Á\x15RÑð$3br\x82\t\n\x16\x17\x18\x19\x1A%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8A\x92\x93\x94\x95\x96\x97\x98\x99\x9A\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA[HIDDEN_STEG_DATA:Um9vdCBhY2Nlc3MgY29kZTogYmxhY2tfd2lkb3dfcHJvdG9jb2xfaW5pdA==]'
  },
  '/home/ghost/surveillance.jpg': {
    type: 'file',
    content: 'ÿØÿà\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00ÿá\x00\x16Exif\x00\x00MM\x00*\x00\x00\x00\x08\x00[METADATA_HEADER]\nMake: Cyberdyne Systems\nModel: T-800 Vision\nDateTime: 2026:02:10 04:20:00\nGPSLatitude: 35.6895 N\nGPSLongitude: 139.6917 E\nArtist: Agent V\nUserComment: Target identified. Access Code: 0451.\n[END_METADATA]\nÿÛ\x00C\x00...'
  },
  '/home/ghost/journal': {
    type: 'dir',
    children: ['entry_01.txt', 'entry_02.enc', 'entry_03.txt']
  },
  '/home/ghost/journal/entry_01.txt': {
    type: 'file',
    content: `Day 42
The system is acting strange. I keep seeing processes I didn't start.
'spectre_kernel'? What is that?
I tried to kill it, but it just respawned with a new PID.
I'm going to start encrypting my logs.
`
  },
  '/home/ghost/journal/entry_01.bak': {
    type: 'file',
    content: `Day 42
The system is acting strange. I keep seeing processes I didn't start.
'spectre_kernel'? What is that?
I tried to kill it, but it just respawned with a new PID.
The PID was 666. It seems to be monitoring port 45678.
I'm going to start encrypting my logs.
`
  },
  '/home/ghost/journal/entry_02.enc': {
    type: 'file',
    content: `VGhleSBhcmUgdHJhY2tpbmcgbWUuIEkgaGlkIHRoZSBldmlkZW5jZSBwYXNzcGhyYXNlIG9uIHRoZSBhZG1pbiBiYWNrdXAgc2VydmVyICgxOTIuMTY4LjEuNSkuIFRoZSB1c2VyIGlzICdiYWNrdXAnLiBZb3UnbGwgbmVlZCB0byBicnV0ZSBmb3JjZSBpdC4=`
  },
  '/home/ghost/journal/entry_03.txt': {
    type: 'file',
    content: `Day 45
If you are reading this, I'm already gone.
They locked me out of the main server, but I managed to leave a backdoor.
Check the wifi networks. There's a hidden one.
The password is... obscure.
`
  },
  '/home/ghost/wifi_note.txt': {
    type: 'file',
    content: 'Found a strange SSID on the scan yesterday.\n"Hidden" or something?\nThe guy at the cafe said the password is just hex for "Dead Beef".\nTry: 0xDEADBEEF\n\n(Note: Interface wlan0 needs to be up first. Check dmesg.)'
  },
  '/home/ghost/.bash_history': {
    type: 'file',
    content: `ssh admin@192.168.1.5
nmap -sV 192.168.1.0/24
crack 192.168.1.5 root
cat /etc/shadow
rm -rf /var/log/syslog
whois omega
decrypt operation_blackout.enc
dmesg | grep sdb
mount /dev/sdb1 /mnt
./emergency_protocol.sh
exit`
  },
  '/home/ghost/projects': {
    type: 'dir',
    children: ['omega_blueprint.pdf.enc', 'README.txt']
  },
  '/home/ghost/projects/omega_blueprint.pdf.enc': {
    type: 'file',
    content: 'Salted__\x00\x00\x00\x00\x00\x00\x00\x00[ENCRYPTED_PDF_HEADER_V1.4]\n[BINARY_BLOB_DO_NOT_READ]\n...'
  },
  '/home/ghost/projects/README.txt': {
    type: 'file',
    content: 'URGENT: The blueprints were encrypted by the rogue AI.\nIt seems to have hidden the key in a temporary location.\nCheck /var/tmp/.key (it might be hidden).\n\nUse: openssl enc -d -aes-256-cbc -in omega_blueprint.pdf.enc -out blueprint.pdf -k <key>'
  },
  '/var/tmp/.key': {
    type: 'file',
    content: 'aes-256-key-0xDEADBEEF'
  },
  '/home/ghost/project_alpha': {
    type: 'dir',
    children: ['.git', 'config.json', 'src']
  },
  '/home/ghost/project_alpha/.git': {
    type: 'dir',
    children: ['HEAD', 'config', 'objects']
  },
  '/home/ghost/project_alpha/config.json': {
    type: 'file',
    content: '{\n  "db_host": "localhost",\n  "db_pass": "env_var_secure",\n  "debug": false\n}'
  },
  '/home/ghost/project_alpha/src': {
    type: 'dir',
    children: ['main.c']
  },
  '/home/ghost/project_alpha/src/main.c': {
    type: 'file',
    content: '#include <stdio.h>\n\nint main() {\n  printf("Project Alpha v1.0\\n");\n  return 0;\n}'
  },
  '/home/ghost/memory_analysis.txt': {
    type: 'file',
    content: 'INCIDENT REPORT #99\n\nSystem crashed at 14:45.\nA memory dump was captured at /tmp/core.dump.\n\nSuspect process: phantom_process\nTool required: volatility\n\nTask: Extract the process command line arguments.\nUsage: volatility -f <dump> cmdline'
  },
  '/home/ghost/backup.zip.b64': {
    type: 'file',
    // PK_SIM_V1:{confidential.txt:R0hPU1RfUk9PVHtCNFNFNjRfWjFQX1IzQ09WM1JZfQ==}
    // Base64 encoded: UEtfU0lNX1YxOntjb25maWRlbnRpYWwudHh0OlIwaFBVMVJmVWk5UFZUdENORk5GTmpSZlcmpRWDFJelEwOTNNMUpaZVE9PX0=
    content: 'UEtfU0lNX1YxOntjb25maWRlbnRpYWwudHh0OlIwaFBVMVJmVWk5UFZUdENORk5GTmpSZlcmpRWDFJelEwOTNNMUpaZVE9PX0='
  },
  '/home/ghost/secrets': {
    type: 'dir',
    children: ['operation_blackout.enc']
  },
  '/home/ghost/secrets/operation_blackout.enc': {
    type: 'file',
    content: 'RU5DUllQVEVEIERBVEE6ClRBUkdFVDogU0hJRUxEX0hFTElDQVJSSUVSClNUVVMyOiBDT01QUk9NSVNFRApQQVlMT0FEOiBXSURPV1NfQklURV9WMg=='
  },
  '/home/ghost/secrets/payload.bin': {
    type: 'file',
    content: 'P4sB7X\x00\x01\x02GHOST_ROOT\x00\x00\x00\x1F\x8B\x08\x00\x00\x00\x00\x00\x02\x03\xED\xBD\x07\x60\x1C\x49\x96\x25\x26\x2F\x6D\x61\x72\x76\x65\x6C\x2F\x73\x74\x75\x64\x69\x6F\x73\x2F\x73\x65\x63\x72\x65\x74\x5F\x69\x6E\x76\x61\x73\x69\x6F\x6E'
  },
  '/etc': {
    type: 'dir',
    children: ['passwd', 'shadow', 'hosts', 'iptables.rules', 'tor', 'cron.daily', 'ssl', 'uplink.conf']
  },
  '/etc/uplink.conf': {
    type: 'file',
    content: '# UPLINK CONFIGURATION v2.0\n# --------------------------\n# SECURITY ALERT: HARDCODED KEYS REMOVED.\n#\n# To establish a connection, you must set the session environment variable:\n# export UPLINK_KEY=XJ9-SAT-442\n#\n# Then run: uplink_connect'
  },
  '/etc/tor': {
    type: 'dir',
    children: ['torrc']
  },
  '/etc/tor/torrc': {
    type: 'file',
    content: 'HiddenServiceDir /var/lib/tor/hidden_service/\nInvalidPort 80 127.0.0.1:80'
  },
  '/etc/cron.daily': {
    type: 'dir',
    children: ['logrotate', 'maintenance', 'man-db']
  },
  '/etc/cron.daily/maintenance': {
    type: 'file',
    content: `#!/bin/bash
# DAILY MAINTENANCE SCRIPT
# Moves critical data to backup location if system is in maintenance mode.

if [ -f "/var/run/maintenance.mode" ]; then
  echo "Maintenance mode detected."
  echo "Backing up secure data..."
  tar -czf /tmp/secure_backup.tar.gz /root/secrets/payload.bin
  echo "Backup complete: /tmp/secure_backup.tar.gz"
else
  echo "System is normal. Skipping backup."
fi
`,
    permissions: '755'
  },
  '/etc/cron.hourly': {
    type: 'file',
    content: '# Hourly cron jobs placeholder\n# This file is intentionally empty.\n'
  },
  '/etc/passwd': {
      type: 'file',
      content: 'root:x:0:0:root:/root:/bin/bash\nghost:x:1001:1001:,,,:/home/ghost:/bin/zsh'
  },
  '/etc/shadow': {
      type: 'file',
      content: 'root:$6$5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8:18550:0:99999:7:::\nghost:$6$randomsalt$encryptedhash:18550:0:99999:7:::'
  },
  '/etc/ntp.conf': {
      type: 'file',
      content: '# Network Time Protocol (NTP) Configuration\n\nserver 0.pool.ntp.org\nserver 1.pool.ntp.org\nserver time.ghost.network\n\n# Access Control\nrestrict default kod nomodify notrap nopeer noquery'
  },
  '/etc/hosts': {
      type: 'file',
      content: '127.0.0.1 localhost\n192.168.1.5 admin-pc\n10.0.0.1 uplink-router\n10.10.99.1 black-site.remote'
  },
  '/etc/network': {
      type: 'dir',
      children: ['interfaces']
  },
  '/etc/network/interfaces': {
      type: 'file',
      content: '# The route to the Black Site (10.10.99.0/24) was deleted by the intruder.\n# Gateway is 192.168.1.1.\n# You must restore the route manually.'
  },
  '/etc/iptables.rules': {
      type: 'file',
      content: `# Generated by iptables-save v1.8.4 on Oct 23 09:00:00
*filter
:INPUT ACCEPT [0:0]
:FORWARD ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
-A INPUT -s 10.10.99.1/32 -p tcp -m tcp --dport 22 -j DROP
-A INPUT -s 10.10.99.1/32 -p icmp -j DROP
COMMIT
# Completed on Oct 23 09:00:00`
  },
  '/etc/ssl': {
    type: 'dir',
    children: ['certs']
  },
  '/etc/ssl/certs': {
    type: 'dir',
    children: ['ca-certificates.crt']
  },
  '/etc/ssl/certs/ca-certificates.crt': {
    type: 'symlink',
    target: '/tmp/build/certs.crt'
  },
  '/usr/share': {
    type: 'dir',
    children: ['ca-certificates']
  },
  '/usr/share/ca-certificates': {
    type: 'dir',
    children: ['mozilla']
  },
  '/usr/share/ca-certificates/mozilla': {
    type: 'dir',
    children: ['ca-certificates.crt']
  },
  '/usr/share/ca-certificates/mozilla/ca-certificates.crt': {
    type: 'file',
    content: '[CERTIFICATE_BUNDLE_V2]\nIssuer: Ghost Root CA\nSubject: *.ghost.network\nValid Until: 2030-01-01\n-----BEGIN CERTIFICATE-----\nMIIEowIBAAKCAQEA...\n-----END CERTIFICATE-----'
  },
  '/var': {
    type: 'dir',
    children: ['log', 'mail', 'backups', 'lib', 'lock', 'opt', 'run']
  },
  '/var/lock': {
    type: 'dir',
    children: ['watcher.lock']
  },
  '/var/lock/watcher.lock': {
    type: 'file',
    content: '31337'
  },
  '/var/opt': {
    type: 'dir',
    children: ['watcher']
  },
  '/var/opt/watcher': {
    type: 'dir',
    children: ['config.json', 'secret.txt']
  },
  '/var/opt/watcher/config.json': {
    type: 'file',
    content: '{\n  "daemon": true,\n  "lock_file": "/var/lock/watcher.lock",\n  "target": "all"\n}'
  },
  '/var/opt/watcher/secret.txt': {
    type: 'file',
    content: 'AUTH_TOKEN: GHOST_ROOT{Z0MB1E_PR0CESS_K1LL3D}\nACCESS_LEVEL: 5'
  },
  '/var/run': {
    type: 'dir',
    children: ['net_status', 'scan_complete', 'decrypt_count', 'firewall_flushed']
  },
  '/var/data': {
    type: 'dir',
    children: ['dump_v1.bin', 'dump_v2.bin', 'dump_v3.bin', 'checksum.md5', 'README.txt']
  },
  '/var/data/README.txt': {
    type: 'file',
    content: 'CRITICAL DATA RECOVERY\n----------------------\nWe managed to salvage 3 fragments from the crash site.\nOnly one is the original data structure. The others are corrupted.\nUse the checksum to verify integrity before proceeding.\n\nRequired Checksum: e5d0979f... (check the .md5 file)'
  },
  '/var/data/checksum.md5': {
    type: 'file',
    content: 'e5d0979f87654321deadbeef00000000  dump_v2.bin'
  },
  '/var/data/dump_v1.bin': {
    type: 'file',
    content: '[CORRUPTED BLOCK 0x01]\nFATAL ERROR: CRC Mismatch.\nData unreadable.'
  },
  '/var/data/dump_v2.bin': {
    type: 'file',
    content: '[DATA_RECOVERED]\nACCESS_CODE: GHOST_ROOT{1NTEGR1TY_V3R1F13D}\n\nCongratulations. The data is intact.\nProceed to the next sector.'
  },
  '/var/data/dump_v3.bin': {
    type: 'file',
    content: '[CORRUPTED BLOCK 0xFF]\nFATAL ERROR: Null pointer exception.\nData lost.'
  },
  '/var/backups': {
      type: 'dir',
      children: ['logs.tar', 'lost+found', 'signal_log.enc', 'mystery.dat', 'README.txt'],
      permissions: '755'
  },
  '/var/backups/mystery.dat': {
      type: 'file',
      content: 'UEtfU0lNX1YxOntwYXlsb2FkLnR4dDpSMGhQVTFSZlVrOVBWSHROTkVjeFExOUNXVlF6VTE5U00wTXdWak5TTTBSOX0='
  },
  '/var/backups/README.txt': {
      type: 'file',
      content: 'ERROR: Corrupted archive detected.\nHeader mismatch? Try converting to standard format.'
  },
  '/var/backups/signal_log.enc': {
      type: 'file',
      content: 'W0xPRyBTVEFSVF0KLi4uCihub2lzZSkKLi4uClRBUkdFVF9DT09SRElOQVRFUzogNDUuMTIsIC05My4yMQpLRVk6IE9NRUdBLTEyMwouLi4KW0xPRyBFTkRdCg=='
  },
  '/var/backups/lost+found': {
      type: 'dir',
      children: ['id_rsa.backup', 'README.txt'],
      permissions: '700'
  },
  '/var/backups/lost+found/id_rsa.backup': {
      type: 'file',
      content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA3... (BACKUP KEY)\nKEY_ID: ADMIN_BACKUP_V1\n-----END RSA PRIVATE KEY-----',
      permissions: '644'
  },
  '/var/backups/lost+found/README.txt': {
      type: 'file',
      content: 'Found this key in the old server rack. Not sure if it works on the new backup server (192.168.1.50).\n- J',
      permissions: '644'
  },
  '/var/backups/logs.tar': {
      type: 'file',
      // encoded content: old_syslog.txt -> "Log entry 001: Admin password rotated to 'hunter2'. Do not write this down."
      content: 'TAR_V1:{old_syslog.txt:TG9nIGVudHJ5IDAwMTogQWRtaW4gcGFzc3dvcmQgcm90YXRlZCB0byAnaHVudGVyMicuIERvIG5vdCB3cml0ZSB0aGlzIGRvd24u}'
  },
  '/var/log': {
      type: 'dir',
      children: ['syslog', 'connections.log', 'trace.log', 'auth.log', 'overflow.dmp']
  },
  '/var/log/overflow.dmp': {
      type: 'file',
      content: 'SIMULATED_LARGE_FILE_DO_NOT_READ_DIRECTLY\n[SIZE: 500MB]\n[CONTENT: JUNK_DATA_FROM_PREVIOUS_INTRUSION]\n...'
  },
  '/var/log/auth.log': {
      type: 'file',
      content: `Oct 23 10:00:00 ghost-root sshd[404]: Accepted publickey for root from 192.168.1.5
Oct 23 11:15:22 ghost-root camsnap[888]: Camera 03 access granted. Token used: SPECTRE_EYE
Oct 23 11:16:00 ghost-root camsnap[888]: Session closed.
Oct 23 12:15:32 ghost-root sshd[404]: Failed password for invalid user kirov_reporting from 192.168.1.5 port 54322 ssh2
Oct 23 12:15:35 ghost-root sshd[404]: Failed password for invalid user kirov_reporting from 192.168.1.5 port 54322 ssh2`
  },
  '/var/log/trace.log': {
      type: 'file',
      content: `[WARN] Trace attempt to uplink-router (10.0.0.1) detected.
[INFO] Route optimization enabled.
[ERROR] Hop 2 failed: timeout. Possible firewall rule.`
  },
  '/var/mail': {
      type: 'dir',
      children: ['ghost']
  },
  '/var/mail/ghost': {
      type: 'file',
      content: `From: The Architect <architect@omega.net>
Subject: Phase 2 Instructions
Date: Oct 23 09:00:00 2024

Agent,

The package has been delivered to your home directory. 
It is hidden within 'evidence.jpg'.

To extract it, you'll need the passphrase.
I wrote down the location in your journal (entry_02.enc), but it's encrypted.

The decryption key for the journal is the old admin password.
I think there's a backup of the old system logs in '/var/backups'.
The password might be in there.

Good luck.

- A
---
From: sysadmin@local
Subject: Welcome to GHOST_ROOT
Date: Oct 20 09:00

Welcome to the recovery terminal.
Remember, standard protocols apply.
Do not decrypt files without authorization.

-- SysAdmin

---
From: watcher@void
Subject: The Dead Drop
Date: Oct 21 23:42

I've left the payload on the USB drive.
It's mounted at /dev/sdb1 usually, but you'll need to mount it manually to /mnt/usb.
Don't forget to check dmesg if you can't find the device name.

The key is "spectre".

-- Watcher

---
From: marketing@scam.net
Subject: URGENT: Extended Warranty
Date: Oct 22 04:20

We've been trying to reach you about your car's extended warranty.
Click here to claim your prize!

-- The Scammers
`
  },
  '/dev': {
    type: 'dir',
    children: ['sda1', 'sdb1', 'video0', 'null', 'random']
  },
  '/dev/sdb1': {
    type: 'file',
    content: '[BLOCK DEVICE: USB_DRIVE_16GB]'
  },
  '/dev/video0': {
    type: 'file',
    content: '[DEVICE: CAMERA_SYSTEM_V2]'
  },
  '/dev/vault': {
    type: 'file',
    content: '[BLOCK DEVICE: CRYPTEX_VAULT_PARTITION]'
  },
  '/dev/null': {
    type: 'file',
    content: 'GHOST_ROOT{N0THING_IS_TRU3}'
  },
  '/proc': {
    type: 'dir',
    children: ['555', 'self']
  },
  '/proc/555': {
    type: 'dir',
    children: ['fd', 'cmdline', 'status']
  },
  '/proc/555/fd': {
    type: 'dir',
    children: ['0', '1', '2', '3']
  },
  '/proc/555/fd/0': { type: 'symlink', target: '/dev/null' },
  '/proc/555/fd/1': { type: 'symlink', target: '/dev/null' },
  '/proc/555/fd/2': { type: 'symlink', target: '/dev/null' },
  '/proc/555/fd/3': { 
      type: 'file', 
      content: 'MINING_LOG_V1\n[WORKER_ID: 555]\n[HASH_RATE: 45 MH/s]\n[POOL: stratum+tcp://ghost.pool:3333]\n[USER: ghost]\n[PASS: x]\n[RESULT: ACCEPTED]\n[FLAG: GHOST_ROOT{PR0C_FS_R3COV3RY}]\n' 
  },
  '/proc/555/cmdline': { type: 'file', content: './data_miner --silent' },
  '/proc/555/status': { type: 'file', content: 'Name:\tdata_miner\nState:\tR (running)\nPid:\t555\nPPid:\t1\nUid:\t1000\nGid:\t1000\n' },
  '/mnt': {
      type: 'dir',
      children: ['vault', 'data']
  },
  '/mnt/data': {
      type: 'dir',
      children: ['README.txt']
  },
  '/mnt/data/README.txt': {
      type: 'file',
      content: 'WARNING: STORAGE ARRAY DEGRADED. MOUNTED READ-ONLY.'
  },
  '/mnt/vault': {
      type: 'dir',
      children: []
  },
  '/var/lib': {
      type: 'dir',
      children: ['cams', 'tor', 'modules', 'dpkg']
  },
  '/var/lib/dpkg': {
      type: 'dir',
      children: ['lock-frontend']
  },
  '/var/lib/dpkg/lock-frontend': {
      type: 'file',
      content: '1234'
  },
  '/lib': {
      type: 'dir',
      children: ['modules']
  },
  '/lib/modules': {
      type: 'dir',
      children: ['5.15.0']
  },
  '/lib/modules/5.15.0': {
      type: 'dir',
      children: ['kernel']
  },
  '/lib/modules/5.15.0/kernel': {
      type: 'dir',
      children: ['drivers']
  },
  '/lib/modules/5.15.0/kernel/drivers': {
      type: 'dir',
      children: ['cryptex.ko']
  },
  '/lib/modules/5.15.0/kernel/drivers/cryptex.ko': {
      type: 'file',
      content: '\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x3e\x00\x01\x00\x00\x00\x30\x05\x40\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00[MODULE_LICENSE: GPL]\n[MODULE_AUTHOR: Ghost]\n[MODULE_DESCRIPTION: Encrypted Vault Filesystem Driver]\n'
  },
  '/var/log/kernel.log': {
    type: 'file',
    content: '[    0.000000] Linux version 5.4.0-ghost (root@mainframe)\n[    0.123456] Command line: BOOT_IMAGE=/boot/vmlinuz root=/dev/sda1 ro\n[    1.234567] KERNEL_PANIC: VFS_MOUNT_ERROR_CODE_777\n[    1.234568] CPU: 0 PID: 1 Comm: init Not tainted 5.4.0-ghost #1\n'
  },
  '/var/lib/tor': {
      type: 'dir',
      children: []
  },
  '/var/lib/cams': {
      type: 'dir',
      children: []
  },
  '/home/ghost/.ssh': {
    type: 'dir',
    children: ['id_rsa', 'id_rsa.pub', 'known_hosts']
  },
  '/home/ghost/.ssh/id_rsa': {
    type: 'file',
    content: `-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA3...
(Private Key for user ghost)
-----END RSA PRIVATE KEY-----`
  },
  '/home/ghost/.ssh/id_rsa.pub': {
    type: 'file',
    content: `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC3... ghost@terminal`
  },
  '/home/ghost/.ssh/known_hosts': {
    type: 'file',
    content: `192.168.1.5 ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABB...`
  },
  '/tmp': {
    type: 'dir',
    children: ['system_crash.dump', 'sess_a1b2c3d4']
  },
  '/tmp/system_crash.dump': {
    type: 'file',
    content: `Error: Segfault at 0x00000000\nMemory dump:\n0000: DE AD BE EF 00 00 00 00\n...`
  },
  '/tmp/sess_a1b2c3d4': {
    type: 'file',
    content: `Session data: ACTIVE\nUser: ghost\nExpires: Never`
  },
  '/tmp/core.dump': {
    type: 'file',
    content: '\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x3e\x00\x01\x00\x00\x00\x30\x05\x40\x00\x00\x00\x00\x00@\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00@\x00\x38\x00\x09\x00\x40\x00\x1c\x00\x1b\x00\x06\x00\x00\x00\x05\x00\x00\x00@\x00\x00\x00\x00\x00\x00\x00@\x00\x40\x00\x00\x00\x00\x00@\x00\x40\x00\x00\x00\x00\x00\xf8\x01\x00\x00\x00\x00\x00\x00\xf8\x01\x00\x00\x00\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x03\x00\x00\x00\x04\x00\x00\x00\x38\x02\x00\x00\x00\x00\x00\x00\x38\x02\x40\x00\x00\x00\x00\x00\x38\x02\x40\x00\x00\x00\x00\x00\x1c\x00\x00\x00\x00\x00\x00\x00\x1c\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x05\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00password_db_connect\x00admin_user\x00GHOST_ROOT{M3M0RY_L34K_D3T3CT3D}\x00segmentation_fault\x00core_dumped\x00'
  },
  '/var/log/syslog': {
        type: 'file',
        content: `Oct 23 09:00:01 ghost-root systemd[1]: Starting Rotate log files...
Oct 23 09:00:01 ghost-root systemd[1]: Started Rotate log files.
Oct 23 09:00:01 ghost-root CRON[1122]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)
Oct 23 10:23:45 ghost-root kernel: [    4.123456] usb 1-1: new high-speed USB device number 2 using xhci_hcd
Oct 23 10:23:45 ghost-root kernel: [    4.234567] usb 1-1: New USB device found, idVendor=1337, idProduct=0xdead
Oct 23 10:23:45 ghost-root kernel: [    4.234567] usb 1-1: Product: BLACK_WIDOW_V2
Oct 23 10:23:45 ghost-root mtp-probe: checking bus 1, device 2: "/sys/devices/pci0000:00/0000:00:14.0/usb1/1-1"
Oct 23 11:00:00 ghost-root systemd[1]: Started Session 42 of user ghost.
Oct 23 11:05:22 ghost-root sudo: ghost : TTY=pts/0 ; PWD=/home/ghost ; USER=root ; COMMAND=/bin/su
Oct 23 11:05:25 ghost-root su[2048]: (to root) ghost on pts/0
Oct 23 11:05:25 ghost-root su[2048]: pam_unix(su:session): session opened for user root by ghost(uid=1000)
Oct 23 12:00:00 ghost-root systemd[1]: Starting Cleanup of Temporary Directories...
Oct 23 12:00:00 ghost-root systemd[1]: Started Cleanup of Temporary Directories.
Oct 23 13:37:00 ghost-root sshd[666]: Refused connection from 192.168.1.99 (Black Site): User blacklisted.
Oct 23 13:37:01 ghost-root sshd[666]: Invalid user spectre from 192.168.1.99
Oct 23 14:02:11 ghost-root systemd[1]: Started Session 1 of user root.
Oct 23 14:05:00 ghost-root CRON[1234]: (root) CMD (echo "System check complete")
Oct 23 14:45:00 ghost-root kernel: [ 3600.000000] SEGFAULT at 0x08048000 ip 0xdeadbeef sp 0xbfffffff error 4 in phantom_process[08048000+1000]
Oct 23 14:45:01 ghost-root systemd-coredump[999]: Process 666 (phantom_process) of user 1000 dumped core.
Oct 23 15:00:00 ghost-root shadow[666]: User Romanoff: red_ledger authentication successful.
Oct 23 15:30:00 ghost-root systemd[1]: Reloading OpenClaw Agent Service.
Oct 23 15:30:01 ghost-root openclaw[1337]: Agent "Vision" reporting status: ONLINE.
Oct 23 15:45:00 ghost-root kernel: [ 4000.000000] RADIO: Strong FM interference detected on 89.9 MHz.
Oct 23 16:00:00 ghost-root network[500]: BRIDGE_TARGET initiated at 10.10.10.10
Oct 23 16:20:00 ghost-root kernel: [ 4200.000000] VAULT_NODE: Connection refused from 192.168.1.200 (vault-node.local).
`
    },
    '/var/log/syslog.2.gz': {
        type: 'file',
        content: 'GZIP_V1:{Oct 21 03:00:01 ghost-root sshd[999]: Accepted publickey for user ghost from 192.168.1.105 port 55555 ssh2\nOct 21 03:00:05 ghost-root sshd[999]: pam_unix(sshd:session): session opened for user ghost by (uid=0)\nOct 21 04:00:00 ghost-root CRON[111]: (root) CMD (echo "Log rotation complete")\nOct 21 04:20:00 ghost-root kernel: [ 1000.000000] ACCESS_CODE_RECOVERY: GHOST_ROOT{L0G_R0T4T10N_M4ST3R}}'
    },
    '/var/log/connections.log': {
        type: 'file',
        content: `[INFO] Connection established from 192.168.1.5:443
[WARN] Port scan detected from 192.168.1.5
[INFO] Outbound connection to 192.168.1.5:8080 [ESTABLISHED]
[INFO] Data transfer complete.
[WARN] Connection reset by peer.`
    },
  '/remote': {
    type: 'dir',
    children: ['admin-pc']
  },
  '/remote/admin-pc': {
    type: 'dir',
    children: ['home', 'var']
  },
  '/remote/backup-server': {
    type: 'dir',
    children: ['home']
  },
  '/remote/backup-server/home': {
    type: 'dir',
    children: ['admin_hash.txt']
  },
  '/remote/vault-node': {
    type: 'dir',
    children: ['root']
  },
  '/remote/vault-node/root': {
    type: 'dir',
    children: ['VAULT_ACCESS_LOG.txt']
  },
  '/remote/vault-node/root/VAULT_ACCESS_LOG.txt': {
    type: 'file',
    content: '[SECURE LOG]\nAccess granted to USER: ghost via DNS_OVERRIDE.\nFlag: GHOST_ROOT{DNS_P01S0N_SUCC3SS}'
  },
  '/remote/backup-server/home/admin_hash.txt': {
    type: 'file',
    content: 'User: admin\nHash: $1$spectre$456789 (MD5)\nHint: It is a color.'
  },
  '/remote/admin-pc/home': {
    type: 'dir',
    children: ['admin']
  },
  '/remote/admin-pc/home/admin': {
    type: 'dir',
    children: ['project_omega', 'todo.txt']
  },
  '/remote/admin-pc/home/admin/todo.txt': {
      type: 'file',
      content: `- [x] Update firewall rules\n- [ ] Encrypt the payload\n- [ ] Deploy the ghost protocol`
  },
  '/remote/admin-pc/home/admin/project_omega': {
      type: 'dir',
      children: ['blueprint.txt']
  },
  '/remote/admin-pc/home/admin/project_omega/blueprint.txt': {
      type: 'file',
      content: `PROJECT OMEGA - CLASSIFIED\nTarget: Global Neural Interface\nStatus: Pending\nVector: The game is the trojan.`
  },
  '/archive': {
    type: 'dir',
    children: ['README.md', 'manifest.enc', 'system_backup.tar.gz']
  },
  '/archive/README.md': {
    type: 'file',
    content: 'ARCHIVE PROTOCOL v0.9\nAccess Restricted to Level 4 Personnel.\n\nEncryption Key: [REDACTED]\nHint: The key is "shadow".\n(Note: This key is old and might have been rotated.)'
  },
  '/archive/manifest.enc': {
    type: 'file',
    content: 'VGhlIGFyY2hpdmUgaXMgYSBkaXZlcnNpb24u'
  },
  '/archive/system_backup.tar.gz': {
    type: 'file',
    content: 'Error: File corrupted. CRC mismatch.'
  },
  '/home/ghost/capture.cap': {
    type: 'file',
    content: '[PCAP_HEADER_LE: a1b2c3d4 0002 0004 0000 0000 ffff 0000]\n[PACKET: IV=1234 KEYID=0 DATA=Encrypted]\n[PACKET: IV=1235 KEYID=0 DATA=Encrypted]\n[HANDSHAKE: 00:C0:CA:AD:88:99 -> DE:AD:BE:EF:CA:FE]'
  },
  '/home/dr_akira': {
    type: 'dir',
    children: ['notes.txt', 'project_chimera', '.bash_history']
  },
  '/home/dr_akira/notes.txt': {
    type: 'file',
    content: `THEY ARE WATCHING.
I know the "Watcher" process isn't just a daemon. It's an AI.
It tracks keystrokes. It monitors the "alert_level" variable.
I've hidden the true schematics in the "chimera" folder, but I had to corrupt them to bypass the deep packet inspection.
To restore them, you need the sequence. 
It involves the number of active processes...`
  },
  '/home/dr_akira/.bash_history': {
    type: 'file',
    content: `export DECRYPTION_PROTOCOL=ENABLED
./fix_corruption.sh --force
netstat -an | grep 666
kill -9 666
rm -rf /var/log/watcher.log
exit`
  },
  '/home/dr_akira/project_chimera': {
    type: 'dir',
    children: ['blueprint_v1.corrupt', 'README.md']
  },
  '/home/dr_akira/project_chimera/README.md': {
    type: 'file',
    content: `PROJECT CHIMERA: AUTONOMOUS DEFENSE GRID
Status: HALTED by Admin Order 66.

The corrupt file contains the access codes for the satellite uplink.
Do not attempt to fix it unless the alert level is 0.
`
  },
  '/home/dr_akira/project_chimera/blueprint_v1.corrupt': {
    type: 'file',
    content: `[HEADER_CORRUPT]
0000: DE AD BE EF CA FE BA BE
0010: ?? ?? ?? ?? ?? ?? ?? ??
[DATA_LOST]
(Try 'hexdump' to analyze structure)`
  },
};

export const initialVFS = JSON.parse(JSON.stringify(VFS)); // Deep copy for reset

export default VFS;
