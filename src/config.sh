#!/bin/bash
# MacBook Resource Monitoring - Configuration File

# Sampling interval in milliseconds (default: 1000 = 1 second)
SAMPLE_INTERVAL_MS=1000

# Number of days to keep log files before auto-cleanup
LOG_RETENTION_DAYS=7

# Log directory (where JSON files are stored)
LOG_DIR="$(dirname "$(dirname "$(realpath "$0")")")/logs"

# PID file location (to track running monitor process)
PID_FILE="/tmp/macbook-monitor.pid"

# Log file naming pattern
LOG_FILE_PREFIX="system-monitor"

# Viewer port for local server (if using)
VIEWER_PORT=8765

# Processes to highlight in viewer (comma-separated patterns)
HIGHLIGHT_PROCESSES="Windsurf,Code,node,Electron"

# Enable verbose logging
VERBOSE=false
