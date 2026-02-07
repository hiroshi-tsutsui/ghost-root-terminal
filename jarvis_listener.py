import time
import os
import sys
import subprocess
import speech_recognition as sr
import threading

# --- Configuration ---
WAKE_WORD = "jarvis"
SOUND_TINK = "/System/Library/Sounds/Tink.aiff"
SOUND_POP = "/System/Library/Sounds/Pop.aiff"

# Gateway Config (Hardcoded for local)
GATEWAY_URL = "http://127.0.0.1:18789" # Not used directly in this simple script yet, we use file trigger

def play_sound(sound_path):
    subprocess.run(["afplay", sound_path])

def speak(text):
    subprocess.run(["say", "-v", "Daniel", text])

# Use osascript to notify OpenClaw directly via a URL scheme or just let the Agent handle it?
# Actually, the best way for a local script to trigger the agent is to append to a watched file 
# OR use the 'openclaw' CLI tool if available.
# Since we are inside the workspace, we can write to a special file that the Agent monitors.
# But for "Real Time", a file watch via 5-min cron is too slow.
# WE NEED A DIRECT TRIGGER.
# I will use `osascript` to send a message via the OpenClaw "WebChat" if open, 
# OR I will just use `curl` to hit the local OpenClaw Gateway to inject a message?
# Actually, OpenClaw Gateway doesn't have a public REST endpoint for message injection without auth.
# A simpler hack: Write to `memory/jarvis_inbox.json` AND play a sound, 
# but the Agent (Me) needs to know to look.
#
# WAIT. I am the Agent. I can just poll a file every 1 second in a loop? No, I can't block.
#
# NEW STRATEGY: 
# The listener will execute `openclaw message --action send --to heartbeat --message "[JARVIS] <command>"` 
# This uses the CLI which is authenticated!

def send_to_agent(command_text):
    print(f"[*] Sending to Agent: {command_text}")
    try:
        # We assume 'openclaw' is in the path or we use the absolute path
        # The agent's own bin path:
        openclaw_bin = "/Users/tsutsuihiroshi/.anyenv/envs/nodenv/versions/22.13.1/bin/openclaw"
        
        # We send it as a message to the "heartbeat" or just "self"
        # Actually, injecting it as a user message is tricky.
        # But we can use `openclaw cron run` to trigger a wake event?
        # Or `openclaw gateway --action wake`? No.
        
        # We will use the `trigger_file` approach combined with a high-frequency check? 
        # No, simpler: 
        # The script effectively *is* an external tool.
        # It can't easily talk to the running session without a proper client.
        
        # Temporary Solution: Just write to a file, and I (Natasha) will verify I can read it.
        # But the User wants it to work NOW.
        # Let's try sending a message to a "Jarvis" channel if we can create one? No.
        
        # HACK: Use `osascript` to type the command into the current terminal window? Dangerous.
        
        # REAL SOLUTION: Use the `openclaw` CLI to send a message to the 'webchat' channel if possible.
        # `openclaw message send --channel webchat --message "[JARVIS] ..."`
        
        subprocess.run([openclaw_bin, "message", "send", "--channel", "webchat", "--to", "heartbeat", "--message", f"[JARVIS_VOICE] {command_text}"], capture_output=True)
        
    except Exception as e:
        print(f"Error sending to agent: {e}")

def listener():
    r = sr.Recognizer()
    mic = sr.Microphone()
    r.pause_threshold = 1.2
    
    with mic as source:
        r.adjust_for_ambient_noise(source, duration=1)

    print(f"[*] Jarvis Listener v2.0 Online. Wake word: '{WAKE_WORD}'")

    while True:
        try:
            with mic as source:
                try:
                    audio = r.listen(source, timeout=1, phrase_time_limit=5)
                except sr.WaitTimeoutError:
                    continue

            try:
                text = r.recognize_google(audio).lower()
                if WAKE_WORD in text:
                    print(f"[!] Wake: {WAKE_WORD}")
                    play_sound(SOUND_TINK)
                    
                    with mic as source:
                        command_audio = r.listen(source, timeout=5, phrase_time_limit=15)
                    
                    play_sound(SOUND_POP)
                    
                    command_text = r.recognize_google(command_audio)
                    print(f"[CMD] {command_text}")
                    
                    if command_text:
                        # 1. Speak receipt
                        # speak(f"On it. {command_text}")
                        # 2. Send to Agent
                        send_to_agent(command_text)
                        
            except sr.UnknownValueError: pass
            except sr.RequestError: pass
                
        except KeyboardInterrupt: break
        except Exception: continue

if __name__ == "__main__":
    listener()
