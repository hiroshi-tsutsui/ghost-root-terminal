import subprocess
import shutil
import json

OPENCLAW_BIN = "openclaw"

def find_openclaw():
    """Locate the openclaw binary."""
    global OPENCLAW_BIN
    
    # Check PATH
    path = shutil.which("openclaw")
    if path:
        OPENCLAW_BIN = path
        return True
        
    # Check common locations (fallback from user's script)
    candidates = [
        "/Users/tsutsuihiroshi/.anyenv/envs/nodenv/versions/22.13.1/bin/openclaw",
        "/usr/local/bin/openclaw",
        os.path.expanduser("~/.openclaw/bin/openclaw")
    ]
    
    for c in candidates:
        if os.path.exists(c):
            OPENCLAW_BIN = c
            return True
            
    return False

def send_to_agent(text, channel="webchat"):
    """
    Send text to the OpenClaw agent via CLI.
    """
    if not find_openclaw():
        print("[!] OpenClaw CLI not found in PATH or standard locations.")
        return False

    print(f"[*] Bridge: Sending '{text}' to Agent...")
    
    # Construct command
    # openclaw message send --channel webchat --message "[VOICE] text"
    # We prefix with [VOICE] so the Agent knows context, though not strictly required.
    cmd = [
        OPENCLAW_BIN, 
        "message", 
        "send", 
        "--channel", channel, 
        "--message", f"[VOICE] {text}"
    ]
    
    try:
        # Run in background or wait?
        # Better to wait briefly to ensure it's sent, but don't block the listener too long.
        # Actually, the CLI might take a second. Let's run it.
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print("[*] Bridge: Sent successfully.")
            return True
        else:
            print(f"[!] Bridge Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"[!] Bridge Exception: {e}")
        return False
