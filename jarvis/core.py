import time
import sys
import subprocess
import speech_recognition as sr
import threading
from . import skills
from . import bridge

# --- Configuration ---
WAKE_WORD = "jarvis"
SOUND_WAKE = "/System/Library/Sounds/Hero.aiff"
SOUND_ACK = "/System/Library/Sounds/Ping.aiff"
TTS_VOICE = "Daniel"

class Jarvis:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        self.running = True
        
        # Optimize recognizer
        self.recognizer.pause_threshold = 0.8  # Shorter pause for faster response
        self.recognizer.non_speaking_duration = 0.5
        self.recognizer.dynamic_energy_threshold = True
        
    def play_sound(self, sound_path):
        """Play a system sound asynchronously."""
        subprocess.Popen(["afplay", sound_path], stderr=subprocess.DEVNULL)

    def speak(self, text):
        """Text to speech."""
        print(f"[Jarvis]: {text}")
        subprocess.Popen(["say", "-v", TTS_VOICE, text])

    def calibrate(self):
        print("[*] Calibrating microphone for ambient noise...")
        with self.microphone as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=1)
        print("[*] Calibration complete.")

    def run(self):
        print(f"[*] Jarvis Online. Waiting for '{WAKE_WORD}'...")
        self.calibrate()
        
        while self.running:
            try:
                with self.microphone as source:
                    # Listen for the wake word (short timeout to keep checking running flag)
                    try:
                        audio = self.recognizer.listen(source, timeout=1.0, phrase_time_limit=5.0)
                    except sr.WaitTimeoutError:
                        continue
                
                # Recognize
                try:
                    text = self.recognizer.recognize_google(audio).lower()
                except sr.UnknownValueError:
                    continue # No speech detected
                except sr.RequestError:
                    print("[!] Connection error")
                    continue
                
                # Wake Word Check
                if WAKE_WORD in text:
                    print(f"[!] WAKE DETECTED: {text}")
                    self.play_sound(SOUND_WAKE)
                    self.handle_command_phase()
                    
            except KeyboardInterrupt:
                self.stop()
            except Exception as e:
                print(f"[!] Error in main loop: {e}")

    def handle_command_phase(self):
        """Listen for the actual command after wake."""
        print("[*] Listening for command...")
        
        with self.microphone as source:
            try:
                # Give user 5 seconds to speak command
                audio = self.recognizer.listen(source, timeout=5.0, phrase_time_limit=10.0)
            except sr.WaitTimeoutError:
                print("[-] Command timeout")
                return

        try:
            command_text = self.recognizer.recognize_google(audio)
            print(f"[CMD] {command_text}")
            self.play_sound(SOUND_ACK)
            self.process_command(command_text)
        except sr.UnknownValueError:
            print("[-] Could not understand command")
            self.speak("I didn't catch that.")
        except sr.RequestError:
            self.speak("I'm having trouble connecting to the network.")

    def process_command(self, text):
        # 1. Check Local Skills
        handled, response = skills.handle_local_command(text)
        if handled:
            if response:
                self.speak(response)
            return

        # 2. Bridge to Agent
        self.speak("Processing...")
        success = bridge.send_to_agent(text)
        if not success:
            self.speak("I couldn't reach the main system.")

    def stop(self):
        self.running = False
        print("\n[*] Jarvis shutting down.")

def main():
    try:
        app = Jarvis()
        app.run()
    except KeyboardInterrupt:
        print("\nGoodbye.")

if __name__ == "__main__":
    main()
