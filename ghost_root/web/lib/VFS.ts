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
    children: ['secrets', '.bash_history', 'wifi_note.txt', 'journal', 'evidence.jpg', 'tools.zip']
  },
  '/home/ghost/tools.zip': {
    type: 'file',
    content: 'PK_SIM_V1:{exploit.py:cHJpbnQoIlRoaXMgaXMgYSBmYWtlIGV4cGxvaXQuIik=}{README.md:VGhpcyB6aXAgY29udGFpbnMgdG9vbHMgZm9yIHRlc3Rpbmcu}'
  },
  '/home/ghost/evidence.jpg': {
    type: 'file',
    content: 'ÿØÿà\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00ÿá\x00\x16Exif\x00\x00MM\x00*\x00\x00\x00\x08\x00\x01\x01\x12\x00\x03\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00ÿÛ\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0C\x14\r\x0C\x0B\x0B\x0C\x19\x12\x13\x0F\x14\x1D\x1A\x1F\x1E\x1D\x1A\x1C\x1C $.\' ",#\x1C\x1C(7),01444\x1F\'9=82<.342ÿÛ\x00C\x01\t\t\t\x0C\x0B\x0C\x18\r\r\x182!\x1C!22222222222222222222222222222222222222222222222222ÿÀ\x00\x11\x08\x00d\x00d\x03\x01\x22\x00\x02\x11\x01\x03\x11\x01ÿÄ\x00\x1F\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0BÿÄ\x00\xB5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07"q\x142\x81\x91¡\x08#B±Á\x15RÑð$3br\x82\t\n\x16\x17\x18\x19\x1A%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8A\x92\x93\x94\x95\x96\x97\x98\x99\x9A\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA[HIDDEN_STEG_DATA:VGhlIHBhc3NwaHJhc2UgaXMgImJsYWNrX3dpZG93Ii4=]'
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
    content: `RU5DUllQVEVEIEpPVVJOQUwgRU5UUlkgMjMKClRoZXkgZm91bmQgbWUuClRoZSB3YXRjaGVycy4KVGhleSdyZSBpbiB0aGUgbmV0d29yay4KSSBoaWQgdGhlIGtleSBpbiB0aGUgY2FtZXJhIGZlZWQuCkNhbWVyYSAwMy4gVGhlIHBhc3N3b3JkIGlzIFNQRUNUUkVfRVZFLg==`
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
  '/var/backups': {
      type: 'dir',
      children: ['logs.tar']
  },
  '/var/backups/logs.tar': {
      type: 'file',
      // encoded content: old_syslog.txt -> "Log entry 001: Admin password rotated to 'hunter2'. Do not write this down."
      content: 'TAR_V1:{old_syslog.txt:TG9nIGVudHJ5IDAwMTogQWRtaW4gcGFzc3dvcmQgcm90YXRlZCB0byAnaHVudGVyMicuIERvIG5vdCB3cml0ZSB0aGlzIGRvd24u}'
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
  '/mnt': {
      type: 'dir',
      children: []
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
