#!/bin/bash
# MacBook Resource Monitoring - Log Cleanup Utility

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

echo "Cleaning up logs older than $LOG_RETENTION_DAYS days..."
echo "Log directory: $LOG_DIR"

count=$(find "$LOG_DIR" -name "${LOG_FILE_PREFIX}-*.json" -mtime +$LOG_RETENTION_DAYS 2>/dev/null | wc -l | tr -d ' ')

if [ "$count" -gt 0 ]; then
    echo "Found $count old log file(s) to delete:"
    find "$LOG_DIR" -name "${LOG_FILE_PREFIX}-*.json" -mtime +$LOG_RETENTION_DAYS -print
    find "$LOG_DIR" -name "${LOG_FILE_PREFIX}-*.json" -mtime +$LOG_RETENTION_DAYS -delete
    echo "Cleanup complete."
else
    echo "No old logs to clean up."
fi
