import os
import subprocess
import datetime
import re

def set_volume(level):
    """Set volume to a percentage (0-100)."""
    try:
        # macOS volume is 0-7 typically or 0-100 for output volume
        # 'set volume output volume X' (0-100)
        subprocess.run(["osascript", "-e", f"set volume output volume {level}"], check=True)
        return True
    except Exception as e:
        print(f"Error setting volume: {e}")
        return False

def change_volume(delta):
    """Change volume by a delta (+10, -10)."""
    try:
        # Get current volume first? Hard to get reliably without parsing.
        # Just use the standard output volume 0-100
        # For simplicity, we can use "set volume output volume (output volume of (get volume settings) + {delta})"
        script = f"set volume output volume ((output volume of (get volume settings)) + {delta})"
        subprocess.run(["osascript", "-e", script], check=True)
        return True
    except Exception as e:
        print(f"Error changing volume: {e}")
        return False

def open_app(app_name):
    """Open an application by name."""
    try:
        subprocess.run(["open", "-a", app_name], check=True)
        return True
    except Exception as e:
        print(f"Error opening app {app_name}: {e}")
        return False

def get_time_speech():
    now = datetime.datetime.now()
    # Format: "It is 4:30 PM"
    return now.strftime("It is %I:%M %p")

def handle_local_command(text):
    """
    Check if the text matches a local skill.
    Returns: (handled: bool, response_text: str|None)
    """
    text = text.lower().strip()

    # --- TIME ---
    if "what time is it" in text or "current time" in text or text == "time":
        return True, get_time_speech()

    # --- VOLUME ---
    if "volume up" in text:
        change_volume(10)
        return True, "Volume up"
    if "volume down" in text:
        change_volume(-10)
        return True, "Volume down"
    if "mute" in text:
        subprocess.run(["osascript", "-e", "set volume output muted true"])
        return True, "Muted"
    if "unmute" in text:
        subprocess.run(["osascript", "-e", "set volume output muted false"])
        return True, "Unmuted"
    
    # "Set volume to X percent"
    vol_match = re.search(r"volume (?:to )?(\d+)", text)
    if vol_match:
        level = int(vol_match.group(1))
        # clamp 0-100
        level = max(0, min(100, level))
        set_volume(level)
        return True, f"Volume set to {level} percent"

    # --- OPEN APPS ---
    # "Open [App Name]"
    if text.startswith("open "):
        app_name = text[5:].strip()
        if app_name:
            if open_app(app_name):
                return True, f"Opening {app_name}"
            else:
                return True, f"I couldn't find {app_name}"

    # Not handled locally
    return False, None
