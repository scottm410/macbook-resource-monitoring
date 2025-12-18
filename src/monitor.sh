#!/bin/bash
# MacBook Resource Monitoring - Main Monitor Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_mactop() {
    if ! command -v mactop &> /dev/null; then
        print_error "mactop is not installed. Install it with: brew install mactop"
        exit 1
    fi
}

get_log_file() {
    local date_str=$(date +%Y-%m-%d)
    echo "$LOG_DIR/${LOG_FILE_PREFIX}-${date_str}.json"
}

is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

start_monitoring() {
    local interval="${1:-$SAMPLE_INTERVAL_MS}"
    
    check_mactop
    
    if is_running; then
        print_warning "Monitor is already running (PID: $(cat "$PID_FILE"))"
        return 1
    fi
    
    # Create log directory if it doesn't exist
    mkdir -p "$LOG_DIR"
    
    local log_file=$(get_log_file)
    
    print_status "Starting monitoring with ${interval}ms interval..."
    print_status "Logging to: $log_file"
    
    # Start monitoring using the sampler script
    # Run in background and save PID
    (
        while true; do
            current_log=$(get_log_file)
            "$SCRIPT_DIR/sampler.sh" "$interval" "$current_log"
            sleep $(echo "scale=3; $interval/1000" | bc)
        done
    ) &
    
    local pid=$!
    echo "$pid" > "$PID_FILE"
    
    print_success "Monitor started (PID: $pid)"
    print_status "View logs with: tail -f $log_file | jq ."
    print_status "Stop with: $0 stop"
}

stop_monitoring() {
    if ! is_running; then
        print_warning "Monitor is not running"
        return 1
    fi
    
    local pid=$(cat "$PID_FILE")
    print_status "Stopping monitor (PID: $pid)..."
    
    # Kill the process and all children
    pkill -P "$pid" 2>/dev/null || true
    kill "$pid" 2>/dev/null || true
    
    rm -f "$PID_FILE"
    print_success "Monitor stopped"
}

show_status() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        local log_file=$(get_log_file)
        local log_size=$(du -h "$log_file" 2>/dev/null | cut -f1 || echo "0")
        local sample_count=$(wc -l < "$log_file" 2>/dev/null | tr -d ' ' || echo "0")
        
        print_success "Monitor is running (PID: $pid)"
        echo ""
        echo "  Log file:     $log_file"
        echo "  Log size:     $log_size"
        echo "  Samples:      $sample_count"
        echo "  Interval:     ${SAMPLE_INTERVAL_MS}ms"
    else
        print_warning "Monitor is not running"
    fi
}

open_viewer() {
    local project_dir="$(dirname "$SCRIPT_DIR")"
    local viewer_path="$project_dir/viewer/index.html"
    local port="${VIEWER_PORT:-8765}"
    
    if [ ! -f "$viewer_path" ]; then
        print_error "Viewer not found at: $viewer_path"
        exit 1
    fi
    
    # Check if server is already running on the port
    if lsof -i ":$port" > /dev/null 2>&1; then
        print_status "Viewer server already running on port $port"
    else
        print_status "Starting viewer server on port $port..."
        # Start Python HTTP server in background
        (cd "$project_dir" && python3 -m http.server "$port" > /dev/null 2>&1) &
        sleep 1
    fi
    
    print_status "Opening viewer in browser..."
    open "http://localhost:$port/viewer/index.html"
}

cleanup_logs() {
    print_status "Cleaning up logs older than $LOG_RETENTION_DAYS days..."
    
    local count=$(find "$LOG_DIR" -name "${LOG_FILE_PREFIX}-*.json" -mtime +$LOG_RETENTION_DAYS 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$count" -gt 0 ]; then
        find "$LOG_DIR" -name "${LOG_FILE_PREFIX}-*.json" -mtime +$LOG_RETENTION_DAYS -delete
        print_success "Deleted $count old log file(s)"
    else
        print_status "No old logs to clean up"
    fi
}

show_help() {
    echo "MacBook Resource Monitoring"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  start [--interval <ms>]  Start monitoring (default: ${SAMPLE_INTERVAL_MS}ms)"
    echo "  stop                     Stop monitoring"
    echo "  status                   Show monitoring status"
    echo "  viewer                   Open the web viewer"
    echo "  cleanup                  Remove logs older than $LOG_RETENTION_DAYS days"
    echo "  help                     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                 Start with default 1-second interval"
    echo "  $0 start --interval 500  Start with 500ms interval"
    echo "  $0 stop                  Stop monitoring"
    echo "  $0 viewer                Open charts in browser"
}

# Parse command line arguments
case "${1:-help}" in
    start)
        interval="$SAMPLE_INTERVAL_MS"
        shift
        while [[ $# -gt 0 ]]; do
            case "$1" in
                --interval|-i)
                    interval="$2"
                    shift 2
                    ;;
                *)
                    print_error "Unknown option: $1"
                    exit 1
                    ;;
            esac
        done
        start_monitoring "$interval"
        ;;
    stop)
        stop_monitoring
        ;;
    status)
        show_status
        ;;
    viewer)
        open_viewer
        ;;
    cleanup)
        cleanup_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
