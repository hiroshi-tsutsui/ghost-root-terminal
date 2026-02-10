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
    children: ['emergency_protocol.sh', '.cache', 'notes.txt', 'secure.enc']
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
# HINT: Check your mail.
#`
  },
  '/home/recovery_mode/secure.enc': {
    type: 'file',
    content: '[[ ENCRYPTED DATA STREAM - AES-256 ]]\nSalt: 8f3a2b1c\nPayload: [LOCKED]'
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
  '/etc/passwd': {
    type: 'file',
    content: 'root:x:0:0:root:/root:/bin/bash\nghost:x:1000:1000:ghost:/home/recovery_mode:/bin/bash'
  },
  '/etc/hosts': {
    type: 'file',
    content: '127.0.0.1\tlocalhost\n127.0.1.1\tblackbox'
  },
  '/var': {
    type: 'dir',
    children: ['log', 'mail']
  },
  '/var/log': {
    type: 'dir',
    children: ['syslog']
  },
  '/var/log/syslog': {
    type: 'file',
    content: 'Feb 10 03:00:00 blackbox systemd[1]: Started Session 1 of user ghost.\nFeb 10 03:01:00 blackbox kernel: [    0.000000] Linux version 5.4.0-42-generic (buildd@lgw01-amd64-038) (gcc version 9.3.0 (Ubuntu 9.3.0-10ubuntu2)) #46-Ubuntu SMP Fri Jul 10 00:24:02 UTC 2020'
  },
  '/var/mail': {
    type: 'dir',
    children: ['ghost']
  },
  '/var/mail/ghost': {
    type: 'file',
    content: `From: Unknown <admin@blackbox.local>
Subject: ESCAPE ROUTE

Listen closely. The system is locked down. I managed to encrypt the override code in "secure.enc".

The password is the system hostname, reversed.

Good luck.
- V`
  }
};

export default VFS;
