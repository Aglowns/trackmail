#!/bin/bash
echo "🚀 Starting TrackMail backend..."
echo "📁 Current directory: $(pwd)"
echo "📋 Files in directory:"
ls -la
echo "🔍 Checking for simple_server.py:"
if [ -f "simple_server.py" ]; then
    echo "✅ simple_server.py found!"
    echo "🚀 Starting Python server..."
    python -u simple_server.py
else
    echo "❌ simple_server.py NOT found!"
    exit 1
fi
