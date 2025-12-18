# MacBook Resource Monitoring

A comprehensive system monitoring solution for Apple Silicon Macs (M1/M2/M3/M4). Logs CPU, GPU, memory, swap, disk I/O, network, and temperature metrics to JSON files with an interactive web-based viewer.

## Features

- **Real-time JSON logging** via `mactop` headless mode
- **Configurable sampling interval** (default: 1 second)
- **Interactive web viewer** with live-updating charts
- **Windsurf/Electron process tracking** for IDE performance monitoring
- **Multiple launcher options**: Terminal, Automator app, menu bar concept
- **Auto-cleanup** of logs older than 7 days
- **No sudo required** - uses native Apple APIs

## Prerequisites

- macOS Monterey 12.3+ on Apple Silicon (M1/M2/M3/M4)
- [Homebrew](https://brew.sh) installed
- `mactop` installed: `brew install mactop`

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/macbook-resource-monitoring.git
cd macbook-resource-monitoring

# Install mactop if not already installed
brew install mactop

# Make scripts executable
chmod +x src/*.sh launchers/*.command
```

## Usage

### Quick Start

1. **Terminal**: Run `./src/monitor.sh start`
2. **Finder**: Double-click `launchers/StartMonitoring.command`
3. **Automator**: Double-click `launchers/MacBookMonitor.app`

### Commands

```bash
# Start monitoring (default: 1 second interval)
./src/monitor.sh start

# Start with custom interval (milliseconds)
./src/monitor.sh start --interval 2000

# Stop monitoring
./src/monitor.sh stop

# View status
./src/monitor.sh status

# Open the web viewer
./src/monitor.sh viewer

# Clean up old logs (older than 7 days)
./src/monitor.sh cleanup
```

### Viewing Logs

Open `viewer/index.html` in your browser, or run:
```bash
./src/monitor.sh viewer
```

The viewer auto-refreshes and shows:
- CPU/GPU usage and power consumption
- Memory and swap usage
- Disk I/O read/write speeds
- Network upload/download speeds
- Temperature and thermal state
- Process list with Windsurf highlighting

## Configuration

Edit `src/config.sh` to customize:

```bash
SAMPLE_INTERVAL_MS=1000      # Sampling interval in milliseconds
LOG_RETENTION_DAYS=7         # Days to keep log files
LOG_DIR="$HOME/Documents/GitHub/macbook-resource-monitoring/logs"
```

## Project Structure

```
macbook-resource-monitoring/
├── src/
│   ├── monitor.sh          # Main monitoring script
│   ├── config.sh           # Configuration file
│   └── cleanup.sh          # Log cleanup utility
├── viewer/
│   ├── index.html          # Interactive web viewer
│   ├── app.js              # Viewer JavaScript
│   └── styles.css          # Viewer styles
├── launchers/
│   ├── StartMonitoring.command    # Double-click launcher
│   └── MacBookMonitor.app/        # Automator app
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── logs/                   # JSON log files (gitignored)
└── README.md
```

## Log Format

Each log entry is a JSON object with:

```json
{
  "timestamp": "2024-12-18T11:30:00-05:00",
  "soc_metrics": {
    "cpu_power": 5.2,
    "gpu_power": 1.4,
    "system_power": 25.5,
    "cpu_temp": 55.2,
    "gpu_temp": 52.1
  },
  "memory": {
    "total": 34359738368,
    "used": 20000000000,
    "swap_used": 1000000000
  },
  "cpu_usage": 25.5,
  "gpu_usage": 10.2
}
```

## Testing

```bash
# Run all tests
./tests/run_tests.sh

# Run specific test suites
./tests/run_tests.sh unit
./tests/run_tests.sh integration
./tests/run_tests.sh e2e
```

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [mactop](https://github.com/context-labs/mactop) - Apple Silicon monitoring tool
- [Chart.js](https://www.chartjs.org/) - JavaScript charting library
