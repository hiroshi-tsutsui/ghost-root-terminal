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
  }
};

export default VFS;
