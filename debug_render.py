#!/usr/bin/env python3
"""
Debug script to show Render what's happening
"""
import os
import sys

print("=== RENDER DEBUG INFO ===")
print(f"Current working directory: {os.getcwd()}")
print(f"Python executable: {sys.executable}")
print(f"Python version: {sys.version}")
print()

print("=== DIRECTORY CONTENTS ===")
for root, dirs, files in os.walk('.'):
    level = root.replace('.', '').count(os.sep)
    indent = ' ' * 2 * level
    print(f"{indent}{os.path.basename(root)}/")
    subindent = ' ' * 2 * (level + 1)
    for file in files:
        print(f"{subindent}{file}")
print()

print("=== REQUIREMENTS.TXT CHECK ===")
requirements_path = "requirements.txt"
print(f"Looking for: {os.path.abspath(requirements_path)}")
print(f"Exists: {os.path.exists(requirements_path)}")
if os.path.exists(requirements_path):
    print("Contents:")
    with open(requirements_path, 'r') as f:
        print(f.read())
print()

print("=== APP.PY CHECK ===")
app_path = "app.py"
print(f"Looking for: {os.path.abspath(app_path)}")
print(f"Exists: {os.path.exists(app_path)}")
if os.path.exists(app_path):
    print("First 5 lines:")
    with open(app_path, 'r') as f:
        for i, line in enumerate(f):
            if i < 5:
                print(f"  {i+1}: {line.rstrip()}")
            else:
                break

print("=== DEBUG COMPLETE ===")
