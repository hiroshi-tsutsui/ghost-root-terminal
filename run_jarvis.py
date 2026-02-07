#!/usr/bin/env python3
import sys
import os

# Ensure we can import the jarvis package
sys.path.append(os.getcwd())

try:
    from jarvis.core import main
    if __name__ == "__main__":
        main()
except ImportError as e:
    print(f"Error importing Jarvis: {e}")
    print("Ensure you are running this from the root directory.")
