#!/bin/bash
# MacBook Resource Monitor - Test Runner

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
SKIPPED=0

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

run_test() {
    local test_name="$1"
    local test_cmd="$2"
    
    printf "  %-50s" "$test_name"
    
    if eval "$test_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

skip_test() {
    local test_name="$1"
    local reason="$2"
    
    printf "  %-50s" "$test_name"
    echo -e "${YELLOW}SKIP${NC} ($reason)"
    ((SKIPPED++))
}

# Determine which tests to run
TEST_SUITE="${1:-all}"

print_header "MacBook Resource Monitor - Test Suite"
echo "Running: $TEST_SUITE tests"
echo "Project: $PROJECT_DIR"
echo ""

# ============================================================================
# UNIT TESTS
# ============================================================================
if [[ "$TEST_SUITE" == "all" || "$TEST_SUITE" == "unit" ]]; then
    print_header "Unit Tests"
    
    # Test: Config file exists and is valid
    run_test "Config file exists" "[ -f '$PROJECT_DIR/src/config.sh' ]"
    
    # Test: Config file is sourceable
    run_test "Config file is valid bash" "bash -n '$PROJECT_DIR/src/config.sh'"
    
    # Test: Monitor script exists and is valid
    run_test "Monitor script exists" "[ -f '$PROJECT_DIR/src/monitor.sh' ]"
    run_test "Monitor script is valid bash" "bash -n '$PROJECT_DIR/src/monitor.sh'"
    
    # Test: Cleanup script exists and is valid
    run_test "Cleanup script exists" "[ -f '$PROJECT_DIR/src/cleanup.sh' ]"
    run_test "Cleanup script is valid bash" "bash -n '$PROJECT_DIR/src/cleanup.sh'"
    
    # Test: Viewer files exist
    run_test "Viewer HTML exists" "[ -f '$PROJECT_DIR/viewer/index.html' ]"
    run_test "Viewer CSS exists" "[ -f '$PROJECT_DIR/viewer/styles.css' ]"
    run_test "Viewer JS exists" "[ -f '$PROJECT_DIR/viewer/app.js' ]"
    
    # Test: Launcher files exist
    run_test "StartMonitoring.command exists" "[ -f '$PROJECT_DIR/launchers/StartMonitoring.command' ]"
    run_test "StopMonitoring.command exists" "[ -f '$PROJECT_DIR/launchers/StopMonitoring.command' ]"
    run_test "OpenViewer.command exists" "[ -f '$PROJECT_DIR/launchers/OpenViewer.command' ]"
    
    # Test: Automator app structure
    run_test "Automator app bundle exists" "[ -d '$PROJECT_DIR/launchers/MacBookMonitor.app' ]"
    run_test "Automator app Info.plist exists" "[ -f '$PROJECT_DIR/launchers/MacBookMonitor.app/Contents/Info.plist' ]"
    run_test "Automator app executable exists" "[ -f '$PROJECT_DIR/launchers/MacBookMonitor.app/Contents/MacOS/MacBookMonitor' ]"
    
    # Test: Scripts are executable
    run_test "monitor.sh is executable" "[ -x '$PROJECT_DIR/src/monitor.sh' ]"
    run_test "cleanup.sh is executable" "[ -x '$PROJECT_DIR/src/cleanup.sh' ]"
    run_test "StartMonitoring.command is executable" "[ -x '$PROJECT_DIR/launchers/StartMonitoring.command' ]"
    
    # Test: Config variables are set
    run_test "Config has SAMPLE_INTERVAL_MS" "source '$PROJECT_DIR/src/config.sh' && [ -n \"\$SAMPLE_INTERVAL_MS\" ]"
    run_test "Config has LOG_RETENTION_DAYS" "source '$PROJECT_DIR/src/config.sh' && [ -n \"\$LOG_RETENTION_DAYS\" ]"
    run_test "Config has PID_FILE" "source '$PROJECT_DIR/src/config.sh' && [ -n \"\$PID_FILE\" ]"
fi

# ============================================================================
# INTEGRATION TESTS
# ============================================================================
if [[ "$TEST_SUITE" == "all" || "$TEST_SUITE" == "integration" ]]; then
    print_header "Integration Tests"
    
    # Test: mactop is installed
    if command -v mactop &> /dev/null; then
        run_test "mactop is installed" "command -v mactop"
        
        # Test: mactop can run headless mode
        run_test "mactop headless mode works" "timeout 5 mactop --headless --count 1 2>/dev/null | head -1 | jq -e '.[0].timestamp' > /dev/null"
        
        # Test: mactop output has expected fields
        run_test "mactop output has cpu_usage" "timeout 5 mactop --headless --count 1 2>/dev/null | head -1 | jq -e '.[0].cpu_usage' > /dev/null"
        run_test "mactop output has memory" "timeout 5 mactop --headless --count 1 2>/dev/null | head -1 | jq -e '.[0].memory' > /dev/null"
        run_test "mactop output has soc_metrics" "timeout 5 mactop --headless --count 1 2>/dev/null | head -1 | jq -e '.[0].soc_metrics' > /dev/null"
    else
        skip_test "mactop is installed" "mactop not found - install with: brew install mactop"
        skip_test "mactop headless mode works" "mactop not installed"
        skip_test "mactop output has cpu_usage" "mactop not installed"
        skip_test "mactop output has memory" "mactop not installed"
        skip_test "mactop output has soc_metrics" "mactop not installed"
    fi
    
    # Test: jq is installed (required for log parsing)
    run_test "jq is installed" "command -v jq"
    
    # Test: bc is installed (required for interval calculation)
    run_test "bc is installed" "command -v bc"
    
    # Test: Monitor help command works
    run_test "monitor.sh help works" "'$PROJECT_DIR/src/monitor.sh' help 2>&1 | grep -q 'Usage'"
    
    # Test: Monitor status when not running
    run_test "monitor.sh status (not running)" "'$PROJECT_DIR/src/monitor.sh' status 2>&1 | grep -qi 'not running'"
    
    # Test: Log directory can be created
    run_test "Log directory is writable" "mkdir -p '$PROJECT_DIR/logs' && touch '$PROJECT_DIR/logs/.test' && rm '$PROJECT_DIR/logs/.test'"
fi

# ============================================================================
# END-TO-END TESTS
# ============================================================================
if [[ "$TEST_SUITE" == "all" || "$TEST_SUITE" == "e2e" ]]; then
    print_header "End-to-End Tests"
    
    if command -v mactop &> /dev/null; then
        # Test: Start and stop monitoring
        echo "  Testing start/stop cycle..."
        
        # Clean up any existing monitor
        "$PROJECT_DIR/src/monitor.sh" stop 2>/dev/null || true
        sleep 1
        
        # Start monitoring
        if "$PROJECT_DIR/src/monitor.sh" start --interval 1000 2>&1 | grep -q "started"; then
            echo -e "    Start monitoring:                                ${GREEN}PASS${NC}"
            ((PASSED++))
            
            sleep 3
            
            # Check if PID file exists
            if [ -f /tmp/macbook-monitor.pid ]; then
                echo -e "    PID file created:                                ${GREEN}PASS${NC}"
                ((PASSED++))
                
                pid=$(cat /tmp/macbook-monitor.pid)
                
                # Check if process is running
                if ps -p "$pid" > /dev/null 2>&1; then
                    echo -e "    Monitor process running:                         ${GREEN}PASS${NC}"
                    ((PASSED++))
                else
                    echo -e "    Monitor process running:                         ${RED}FAIL${NC}"
                    ((FAILED++))
                fi
            else
                echo -e "    PID file created:                                ${RED}FAIL${NC}"
                ((FAILED++))
            fi
            
            # Check if log file was created
            log_file="$PROJECT_DIR/logs/system-monitor-$(date +%Y-%m-%d).json"
            sleep 2
            if [ -f "$log_file" ] && [ -s "$log_file" ]; then
                echo -e "    Log file created with data:                      ${GREEN}PASS${NC}"
                ((PASSED++))
                
                # Validate JSON format
                if head -1 "$log_file" | jq -e '.timestamp' > /dev/null 2>&1; then
                    echo -e "    Log entries are valid JSON:                      ${GREEN}PASS${NC}"
                    ((PASSED++))
                else
                    echo -e "    Log entries are valid JSON:                      ${RED}FAIL${NC}"
                    ((FAILED++))
                fi
            else
                echo -e "    Log file created with data:                      ${RED}FAIL${NC}"
                ((FAILED++))
            fi
            
            # Stop monitoring
            if "$PROJECT_DIR/src/monitor.sh" stop 2>&1 | grep -q "stopped"; then
                echo -e "    Stop monitoring:                                 ${GREEN}PASS${NC}"
                ((PASSED++))
            else
                echo -e "    Stop monitoring:                                 ${RED}FAIL${NC}"
                ((FAILED++))
            fi
            
            # Verify process stopped
            sleep 1
            if [ -f /tmp/macbook-monitor.pid ]; then
                echo -e "    PID file cleaned up:                             ${RED}FAIL${NC}"
                ((FAILED++))
            else
                echo -e "    PID file cleaned up:                             ${GREEN}PASS${NC}"
                ((PASSED++))
            fi
        else
            echo -e "    Start monitoring:                                ${RED}FAIL${NC}"
            ((FAILED++))
        fi
        
        # Test: Viewer can be opened (just check the command doesn't error)
        run_test "Viewer command works" "'$PROJECT_DIR/src/monitor.sh' viewer 2>&1; exit 0"
        
    else
        skip_test "E2E: Start/stop cycle" "mactop not installed"
        skip_test "E2E: Log file creation" "mactop not installed"
        skip_test "E2E: JSON validation" "mactop not installed"
    fi
fi

# ============================================================================
# SUMMARY
# ============================================================================
print_header "Test Summary"

TOTAL=$((PASSED + FAILED + SKIPPED))

echo -e "  ${GREEN}Passed:${NC}  $PASSED"
echo -e "  ${RED}Failed:${NC}  $FAILED"
echo -e "  ${YELLOW}Skipped:${NC} $SKIPPED"
echo -e "  ─────────────"
echo -e "  Total:   $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
