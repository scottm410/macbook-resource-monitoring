#!/bin/bash
# MacBook Resource Monitor - Stop Launcher
# Double-click this file in Finder to stop monitoring

cd "$(dirname "$0")/.."

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           MacBook Resource Monitor - Stop                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

./src/monitor.sh stop

echo ""
echo "Press any key to close this window..."
read -n 1
