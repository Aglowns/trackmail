#!/bin/bash
echo "🚀 Starting TrackMail backend..."
echo "📁 Current directory: $(pwd)"
echo "📋 Files in directory:"
ls -la
echo "🔍 Checking for minimal_app.py:"
if [ -f "minimal_app.py" ]; then
    echo "✅ minimal_app.py found!"
    echo "🚀 Starting FastAPI server..."
    python -u minimal_app.py
else
    echo "❌ minimal_app.py NOT found!"
    exit 1
fi
