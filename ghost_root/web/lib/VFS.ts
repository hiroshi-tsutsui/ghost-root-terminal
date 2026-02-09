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
    children: ['home', 'etc', 'var', 'archive']
  },
  '/home': {
    type: 'dir',
    children: ['recovery', 'ghost']
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
    children: ['secrets', '.bash_history', 'wifi_note.txt']
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
    children: ['passwd', 'hosts']
  },
  '/etc/passwd': {
      type: 'file',
      content: 'root:x:0:0:root:/root:/bin/bash\nghost:x:1001:1001:,,,:/home/ghost:/bin/zsh'
  },
  '/etc/hosts': {
      type: 'file',
      content: '127.0.0.1 localhost\n192.168.1.5 admin-pc\n10.0.0.1 uplink-router'
  },
  '/var': {
    type: 'dir',
    children: ['log', 'mail']
  },
  '/var/log': {
      type: 'dir',
      children: ['syslog', 'connections.log', 'trace.log', 'auth.log']
  },
  '/var/log/auth.log': {
      type: 'file',
      content: `Oct 23 10:00:00 ghost-root sshd[404]: Accepted publickey for root from 192.168.1.5
Oct 23 11:15:22 ghost-root camsnap[888]: Camera 03 access granted. Token used: SPECTRE_EYE
Oct 23 11:16:00 ghost-root camsnap[888]: Session closed.`
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
      content: `From: sysadmin@local
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
    children: ['sda1', 'sdb', 'video0', 'null', 'random']
  },
  '/dev/video0': {
    type: 'file',
    content: '[DEVICE: CAMERA_SYSTEM_V2]'
  },
  '/var/lib': {
      type: 'dir',
      children: ['cams']
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
        content: `Oct 23 14:02:11 ghost-root systemd[1]: Started Session 1 of user root.
Oct 23 14:05:00 ghost-root CRON[1234]: (root) CMD (echo "System check complete")
Oct 23 14:10:22 ghost-root kernel: [    0.000000] Linux version 5.4.0-123-generic (buildd@lcy02-amd64-001) (gcc version 9.4.0 (Ubuntu 9.4.0-1ubuntu1~20.04.1)) #139-Ubuntu SMP Mon Jul 11 15:47:32 UTC 2022
Oct 23 15:00:00 ghost-root shadow[666]: User Romanoff: red_ledger authentication successful.
`
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
  }
};

export default VFS;
