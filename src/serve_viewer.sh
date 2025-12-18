#!/bin/bash
# MacBook Resource Monitor - Viewer Server
# Starts a simple HTTP server to serve the viewer with proper CORS

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PORT="${1:-8765}"

echo "Starting viewer server on http://localhost:$PORT"
echo "Press Ctrl+C to stop"
echo ""

cd "$PROJECT_DIR"

# Use Python's built-in HTTP server
if command -v python3 &> /dev/null; then
    python3 -m http.server "$PORT"
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer "$PORT"
else
    echo "Error: Python is required to run the viewer server"
    exit 1
fi
