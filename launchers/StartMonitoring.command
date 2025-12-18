#!/bin/bash
# MacBook Resource Monitor - Quick Start Launcher
# Double-click this file in Finder to start monitoring

cd "$(dirname "$0")/.."

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           MacBook Resource Monitor                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if mactop is installed
if ! command -v mactop &> /dev/null; then
    echo "❌ mactop is not installed!"
    echo ""
    echo "Install it with:"
    echo "  brew install mactop"
    echo ""
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi

# Check if already running
if [ -f /tmp/macbook-monitor.pid ]; then
    pid=$(cat /tmp/macbook-monitor.pid)
    if ps -p "$pid" > /dev/null 2>&1; then
        echo "⚠️  Monitor is already running (PID: $pid)"
        echo ""
        echo "Options:"
        echo "  1) Stop monitoring"
        echo "  2) Open viewer"
        echo "  3) Exit"
        echo ""
        read -p "Choose option (1-3): " choice
        
        case $choice in
            1)
                ./src/monitor.sh stop
                ;;
            2)
                ./src/monitor.sh viewer
                ;;
            *)
                exit 0
                ;;
        esac
        exit 0
    fi
fi

echo "Starting monitoring with 1-second interval..."
echo ""

# Start monitoring
./src/monitor.sh start --interval 1000

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Monitoring is now running in the background!"
echo ""
echo "Options:"
echo "  1) Open viewer in browser"
echo "  2) Watch live log output"
echo "  3) Stop monitoring and exit"
echo "  4) Keep running and close this window"
echo ""
read -p "Choose option (1-4): " choice

case $choice in
    1)
        ./src/monitor.sh viewer
        echo ""
        echo "Viewer opened. Monitoring continues in background."
        echo "Run './src/monitor.sh stop' to stop monitoring."
        ;;
    2)
        echo ""
        echo "Watching live log (Ctrl+C to stop watching, monitoring continues):"
        echo ""
        log_file="logs/system-monitor-$(date +%Y-%m-%d).json"
        tail -f "$log_file" | while read line; do
            echo "$line" | jq -c '{time: .timestamp, cpu: .cpu_usage, mem_gb: (.memory.used/1024/1024/1024), swap_gb: (.memory.swap_used/1024/1024/1024), power: .soc_metrics.system_power}'
        done
        ;;
    3)
        ./src/monitor.sh stop
        ;;
    4)
        echo ""
        echo "Monitoring continues in background."
        echo "Run './src/monitor.sh stop' to stop monitoring."
        ;;
esac

echo ""
echo "Press any key to close this window..."
read -n 1
