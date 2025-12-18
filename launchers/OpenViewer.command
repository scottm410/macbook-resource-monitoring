#!/bin/bash
# MacBook Resource Monitor - Open Viewer
# Double-click this file in Finder to open the web viewer

cd "$(dirname "$0")/.."

echo "Opening MacBook Resource Monitor viewer..."
./src/monitor.sh viewer

echo "Viewer opened in your default browser."
sleep 2
