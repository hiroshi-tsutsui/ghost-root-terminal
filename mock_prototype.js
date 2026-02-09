import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

// --- MOCK VIRTUAL FILE SYSTEM ---
const INITIAL_FS = {
	'/home/recovery_mode': {
		'README.txt': 'SYSTEM RECOVERY MODE.\nRun diagnostic tools to restore functionality.',
		'emergency_protocol.sh': '# TODO: Fix syntax error on line 42\n# PART 1: "XJ-9"\n# PART 2: "-OVER"\n# PART 3: "RIDE"\necho "Attempting network unlock..."\nerr "Critical failure"',
		'.cache': {
			'last_session.history': 'ls -la\ncat /var/log/syslog\n./unlock_net --key=???'
		}
	},
	'/bin': {
		'ls': 'List directory contents',
		'cat': 'Concatenate files to standard output',
		'help': 'Display available commands'
	}
};

const Game = () => {
	const [history, setHistory] = useState([
		{ type: 'system', content: 'BOOT SEQUENCE INITIATED...' },
		{ type: 'system', content: 'ERROR: KERNEL PANIC. FALLBACK TO RECOVERY MODE.' },
		{ type: 'info', content: 'Welcome to GHOST_ROOT. Type "help" for commands.' }
	]);
	const [input, setInput] = useState('');
	const [cwd, setCwd] = useState('/home/recovery_mode');

	// Simple command parser
	const handleSubmit = (cmd) => {
		const parts = cmd.trim().split(' ');
		const command = parts[0];
		const args = parts.slice(1);
		
		const newHistory = [...history, { type: 'user', content: `${cwd} $ ${cmd}` }];

		switch (command) {
			case 'ls':
				// Mock listing of current directory
				const dirContent = INITIAL_FS[cwd];
				if (dirContent) {
					const files = Object.keys(dirContent).filter(f => !f.startsWith('.') || args.includes('-a') || args.includes('-la'));
					newHistory.push({ type: 'output', content: files.join('  ') });
				} else {
					newHistory.push({ type: 'error', content: `Error: accessing ${cwd}` });
				}
				break;
			case 'cat':
				const filename = args[0];
				// Very basic traversal logic for demo
				if (INITIAL_FS[cwd] && INITIAL_FS[cwd][filename]) {
					newHistory.push({ type: 'output', content: INITIAL_FS[cwd][filename] });
				} else {
					newHistory.push({ type: 'error', content: `cat: ${filename}: No such file or directory` });
				}
				break;
			case 'help':
				newHistory.push({ type: 'info', content: 'Available commands: ls, cat, cd (stub), help' });
				break;
			case 'clear':
				setHistory([]);
				setInput('');
				return; // Early return to avoid adding "clear" to history logic
			default:
				if (command) newHistory.push({ type: 'error', content: `bash: ${command}: command not found` });
		}

		setHistory(newHistory);
		setInput('');
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Box borderStyle="single" borderColor="green" paddingX={1}>
				<Text color="green">GHOST_ROOT // SYSTEM_ID: PID_1</Text>
			</Box>
			
			<Box flexDirection="column" marginTop={1}>
				{history.map((item, index) => (
					<Text key={index} color={item.type === 'error' ? 'red' : item.type === 'user' ? 'blue' : item.type === 'system' ? 'yellow' : 'white'}>
						{item.content}
					</Text>
				))}
			</Box>

			<Box marginTop={1}>
				<Text color="green">{cwd} $ </Text>
				<TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
			</Box>
		</Box>
	);
};

// Start the app if run directly (simulated)
// render(<Game />); 

export default Game;
