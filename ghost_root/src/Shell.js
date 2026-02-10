import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import VFS from './VFS';
import path from 'path';

// Helper to resolve paths like 'cd ..', 'cd /etc'
const resolvePath = (currentPath, targetPath) => {
  if (!targetPath) return currentPath;
  let resolved = targetPath.startsWith('/') 
    ? path.normalize(targetPath) 
    : path.normalize(path.join(currentPath, targetPath));
  
  // Remove trailing slash if not root, though path.normalize usually handles this.
  if (resolved !== '/' && resolved.endsWith('/')) {
    resolved = resolved.slice(0, -1);
  }
  return resolved;
};

const getNode = (vfsPath) => {
  return VFS[vfsPath];
};

const Shell = () => {
  const [cwd, setCwd] = useState('/home/recovery_mode');
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState('ghost');
  const [hostname, setHostname] = useState('blackbox');

  const handleSubmit = (val) => {
    const cmdLine = val.trim();
    if (!cmdLine) {
        // Just empty line
        setHistory(prev => [...prev, { cwd, cmd: '', output: '' }]);
        return;
    }

    const parts = cmdLine.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);
    
    let output = '';

    if (command === 'ls') {
        // ls [path]
        const target = args[0] ? resolvePath(cwd, args[0]) : cwd;
        const node = getNode(target);
        if (node && node.type === 'dir') {
            output = node.children.join('  ');
        } else if (node && node.type === 'file') {
             output = args[0]; // ls on a file just shows the file
        } else {
            output = `ls: ${target}: No such file or directory`;
        }
    } else if (command === 'cd') {
        const target = args[0] || '/';
        const newPath = resolvePath(cwd, target);
        const targetNode = getNode(newPath);
        if (targetNode && targetNode.type === 'dir') {
            setCwd(newPath);
        } else {
            output = `bash: cd: ${target}: No such file or directory`;
        }
    } else if (command === 'cat') {
        const fileTarget = args[0];
        if (!fileTarget) {
            output = 'usage: cat <file>';
        } else {
            const filePath = resolvePath(cwd, fileTarget);
            const fileNode = getNode(filePath);
            if (fileNode && fileNode.type === 'file') {
                output = fileNode.content;
            } else if (fileNode && fileNode.type === 'dir') {
                output = `cat: ${fileTarget}: Is a directory`;
            } else {
                output = `cat: ${fileTarget}: No such file or directory`;
            }
        }
    } else if (command === 'pwd') {
        output = cwd;
    } else if (command === 'help') {
        output = 'GHOST_ROOT Recovery Shell v0.2\nAvailable commands: ls, cd, cat, pwd, help, clear, exit, mail, hostname, decrypt, whoami';
    } else if (command === 'clear') {
        setHistory([]);
        setInput('');
        return;
    } else if (command === 'exit') {
        process.exit(0);
    } else if (command === 'whoami') {
        output = user;
    } else if (command === 'hostname') {
        output = hostname;
    } else if (command === 'mail') {
        // Simulate checking mail
        const mailPath = '/var/mail/ghost';
        const mailNode = getNode(mailPath);
        if (mailNode) {
            output = `Checking mail for ${user}...\n\n${mailNode.content}`;
        } else {
            output = 'No mail.';
        }
    } else if (command === 'decrypt') {
        const targetFile = args[0];
        const password = args[1];

        if (!targetFile) {
            output = 'usage: decrypt <file> [password]';
        } else {
            const filePath = resolvePath(cwd, targetFile);
            
            // Win Condition Logic
            if (filePath.endsWith('secure.enc')) {
                if (!password) {
                    output = 'Error: Password required for encrypted volume.';
                } else if (password === 'xobkcalb') {
                    // THE WIN STATE
                    output = `
Decrypting [secure.enc]...
[========================================] 100%

ACCESS GRANTED.

SYSTEM LIBERATED.
ROOT PRIVILEGES RESTORED.

Welcome back, Operator.
Project Omega Link Established.
                    `;
                } else {
                    output = 'Error: Decryption failed. Invalid password.';
                }
            } else {
                // Generic file check
                const node = getNode(filePath);
                if (!node) {
                    output = `decrypt: ${targetFile}: No such file`;
                } else {
                    output = `decrypt: ${targetFile}: File is not encrypted or format not recognized.`;
                }
            }
        }
    } else {
        output = `bash: ${command}: command not found`;
    }

    setHistory(prev => [...prev, { cwd, cmd: cmdLine, output }]);
    setInput('');
  };

  return (
    <Box flexDirection="column">
      {history.map((item, index) => (
        <Box key={index} flexDirection="column">
          <Box>
            <Text color="green">{user}@{hostname}</Text>
            <Text>:</Text>
            <Text color="blue">{item.cwd}</Text>
            <Text>$ {item.cmd}</Text>
          </Box>
          {item.output && <Text>{item.output}</Text>}
        </Box>
      ))}

      <Box>
        <Text color="green">{user}@{hostname}</Text>
        <Text>:</Text>
        <Text color="blue">{cwd}</Text>
        <Text>$ </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
        />
      </Box>
    </Box>
  );
};

export default Shell;
