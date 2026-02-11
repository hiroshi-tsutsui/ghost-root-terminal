// VFS.ts - Virtual File System
// Defines the initial state of the file system

export interface VFSNode {
  type: 'file' | 'dir';
  content?: string; // For files
  children?: string[]; // For dirs
  permissions?: string;
  owner?: string;
  group?: string;
}

const VFS: Record<string, VFSNode> = {
  '/': {
    type: 'dir',
    children: ['home', 'etc', 'var', 'bin', 'usr', 'tmp', 'mnt', 'dev', 'proc', 'boot', 'root'],
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root'
  },
  '/home': {
    type: 'dir',
    children: ['ghost'],
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root'
  },
  '/home/ghost': {
    type: 'dir',
    children: ['evidence.jpg', 'notes.txt', '.bash_history', 'secrets'],
    permissions: 'drwxr-x---',
    owner: 'ghost',
    group: 'ghost'
  },
  '/home/ghost/evidence.jpg': {
    type: 'file',
    content: '[BINARY_DATA_JPEG_HEADER_FF_D8_FF...]', // Placeholder for steghide
    permissions: '-rw-r--r--',
    owner: 'ghost',
    group: 'ghost'
  },
  '/home/ghost/notes.txt': {
    type: 'file',
    content: 'To-Do:\n1. Check mail.\n2. Review auth logs for intrusion attempts.\n3. Delete evidence.jpg before they find it.',
    permissions: '-rw-r--r--',
    owner: 'ghost',
    group: 'ghost'
  },
  '/home/ghost/.bash_history': {
    type: 'file',
    content: 'ls\ncd /var/log\ncat auth.log\ngrep "password" auth.log\nsteghide embed -cf evidence.jpg -ef payload.txt\nrm payload.txt\nexit',
    permissions: '-rw-------',
    owner: 'ghost',
    group: 'ghost'
  },
  '/home/ghost/secrets': {
    type: 'dir',
    children: ['operation_blackout.enc'],
    permissions: 'drwx------',
    owner: 'ghost',
    group: 'ghost'
  },
  '/home/ghost/secrets/operation_blackout.enc': {
    type: 'file',
    content: 'U2FsdGVkX1+v8w8z8z8z8z8z8z8z8z8z8z8z8z8z8z8=\n[ENCRYPTED_DATA_STREAM]',
    permissions: '-rw-------',
    owner: 'ghost',
    group: 'ghost'
  },
  '/etc': {
    type: 'dir',
    children: ['passwd', 'shadow', 'hosts', 'hostname', 'issue'],
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root'
  },
  '/etc/passwd': {
    type: 'file',
    content: 'root:x:0:0:root:/root:/bin/bash\nghost:x:1000:1000:ghost:/home/ghost:/bin/bash\nadmin:x:1001:1001:admin:/home/admin:/bin/bash\nsshd:x:105:65534::/run/sshd:/usr/sbin/nologin',
    permissions: '-rw-r--r--',
    owner: 'root',
    group: 'root'
  },
  '/etc/shadow': {
    type: 'file',
    content: 'root:$6$rounds=4096$salt$encrypted_hash...:18500:0:99999:7:::\nghost:$6$rounds=4096$salt$encrypted_hash...:18500:0:99999:7:::\nadmin:$6$rounds=4096$salt$encrypted_hash...:18500:0:99999:7:::',
    permissions: '-rw-r-----',
    owner: 'root',
    group: 'shadow'
  },
  '/etc/hosts': {
    type: 'file',
    content: '127.0.0.1\tlocalhost\n127.0.1.1\tghost-root\n\n# The following lines are desirable for IPv6 capable hosts\n::1     localhost ip6-localhost ip6-loopback\nff02::1 ip6-allnodes\nff02::2 ip6-allrouters',
    permissions: '-rw-r--r--',
    owner: 'root',
    group: 'root'
  },
  '/var': {
    type: 'dir',
    children: ['log', 'mail', 'www'],
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root'
  },
  '/var/log': {
    type: 'dir',
    children: ['syslog', 'auth.log', 'kern.log', 'dmesg'],
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root'
  },
  '/var/log/auth.log': {
    type: 'file',
    content: `Oct 23 10:00:01 ghost-root CRON[2024]: pam_unix(cron:session): session opened for user root by (uid=0)
Oct 23 10:00:01 ghost-root CRON[2024]: pam_unix(cron:session): session closed for user root
Oct 23 12:15:32 ghost-root sshd[404]: Failed password for invalid user kirov_reporting from 192.168.1.5 port 54322 ssh2
Oct 23 12:15:35 ghost-root sshd[404]: Failed password for invalid user kirov_reporting from 192.168.1.5 port 54322 ssh2
Oct 23 12:15:40 ghost-root sshd[404]: Failed password for ghost from 192.168.1.5 port 54328 ssh2
Oct 23 12:15:42 ghost-root sshd[404]: Accepted password for ghost from 192.168.1.5 port 54328 ssh2
Oct 23 14:00:05 ghost-root sudo: ghost : TTY=pts/0 ; PWD=/home/ghost ; USER=root ; COMMAND=/bin/cat /etc/shadow
Oct 23 14:02:11 ghost-root su[412]: Successful su for root by ghost
Oct 23 14:05:00 ghost-root sshd[404]: Received disconnect from 192.168.1.5 port 54328:11: Bye Bye
Oct 23 14:10:00 ghost-root sshd[404]: Invalid user support from 10.0.0.13
Oct 23 14:10:01 ghost-root sshd[404]: input_userauth_request: invalid user support [preauth]
Oct 23 14:10:01 ghost-root sshd[404]: pam_unix(sshd:auth): check pass; user unknown
Oct 23 14:10:01 ghost-root sshd[404]: pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=10.0.0.13
Oct 23 14:10:03 ghost-root sshd[404]: Failed password for invalid user support from 10.0.0.13 port 39201 ssh2
Oct 23 14:10:03 ghost-root sshd[404]: Connection closed by invalid user support 10.0.0.13 port 39201 [preauth]
Oct 23 14:22:15 ghost-root steghide: passphrase failed for evidence.jpg (user: ghost)
Oct 23 14:22:30 ghost-root steghide: passphrase accepted for evidence.jpg (user: ghost)
Oct 23 14:23:00 ghost-root fs: file created /home/ghost/payload.txt`,
    permissions: '-rw-r-----',
    owner: 'root',
    group: 'adm'
  },
  '/var/mail': {
    type: 'dir',
    children: ['ghost'],
    permissions: 'drwxrwsr-x',
    owner: 'root',
    group: 'mail'
  },
  '/var/mail/ghost': {
    type: 'file',
    content: `From: The Architect <architect@omega.net>
Subject: Phase 2 Instructions
Date: Oct 23 09:00:00 2024

Agent,

The package has been delivered to your home directory. 
It is hidden within 'evidence.jpg'.

Do not fail me. You know the passphrase. 
It's the same one we used for the Kirov operation.
If you forgot, check your auth logs. You typed it in wrong three times yesterday.

- A
---
From: SysAdmin <root@localhost>
Subject: Security Alert
Date: Oct 23 12:30:00 2024

Suspicious activity detected on your account.
Please change your password immediately.

Run 'passwd' to update your credentials.

- IT Support`,
    permissions: '-rw-rw----',
    owner: 'ghost',
    group: 'mail'
  },
  '/bin': {
    type: 'dir',
    children: ['ls', 'bash', 'cat', 'cp', 'mv', 'rm', 'mkdir', 'touch', 'grep', 'steghide', 'ping', 'ssh', 'netstat', 'nc'],
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root'
  },
  '/usr': {
    type: 'dir',
    children: ['bin', 'lib', 'local'],
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root'
  },
  '/usr/bin': {
    type: 'dir',
    children: ['whoami', 'man', 'top', 'ps', 'kill', 'clear', 'exit', 'hydra', 'nmap', 'sqlmap', 'python'],
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root'
  },
  '/tmp': {
    type: 'dir',
    children: [],
    permissions: 'drwxrwxrwt',
    owner: 'root',
    group: 'root'
  },
  '/dev': {
    type: 'dir',
    children: ['null', 'zero', 'random', 'sda', 'sda1', 'sdb'],
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root'
  },
  '/proc': {
    type: 'dir',
    children: ['cpuinfo', 'meminfo', 'version'],
    permissions: 'dr-xr-xr-x',
    owner: 'root',
    group: 'root'
  },
  '/proc/cpuinfo': {
    type: 'file',
    content: 'processor\t: 0\nmodel name\t: ARMv8 Processor rev 4 (v8l)\nBogoMIPS\t: 48.00\nFeatures\t: fp asimd evtstrm aes pmull sha1 sha2 crc32\nCPU implementer\t: 0x41\nCPU architecture: 8\nCPU variant\t: 0x0\nCPU part\t: 0xd03\nCPU revision\t: 4',
    permissions: '-r--r--r--',
    owner: 'root',
    group: 'root'
  },
  '/proc/version': {
    type: 'file',
    content: 'Linux version 5.4.0-ghost (root@build) (gcc version 9.3.0 (Ubuntu 9.3.0-17ubuntu1~20.04)) #1 SMP Sat Oct 23 10:00:00 UTC 2024',
    permissions: '-r--r--r--',
    owner: 'root',
    group: 'root'
  },
  '/root': {
    type: 'dir',
    children: ['flag.txt'],
    permissions: 'drwx------',
    owner: 'root',
    group: 'root'
  },
  '/root/flag.txt': {
    type: 'file',
    content: 'GHOST_ROOT{Y0U_AR3_TH3_0P3R4T0R}',
    permissions: '-rw-------',
    owner: 'root',
    group: 'root'
  }
};

export default VFS;
