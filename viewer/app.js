// MacBook Resource Monitor - Viewer Application

class ResourceMonitor {
    constructor() {
        this.data = [];
        this.charts = {};
        this.maxDataPoints = 300; // Show last 5 minutes at 1-second intervals
        this.refreshInterval = null;
        this.logDir = '../logs';
        
        this.init();
    }

    init() {
        this.setupCharts();
        this.setupEventListeners();
        this.loadTodayLog();
    }

    setupEventListeners() {
        document.getElementById('load-today').addEventListener('click', () => this.loadTodayLog());
        document.getElementById('log-file').addEventListener('change', (e) => this.loadFile(e));
        document.getElementById('auto-refresh').addEventListener('change', (e) => this.toggleAutoRefresh(e.target.checked));
        document.getElementById('refresh-interval').addEventListener('change', (e) => {
            if (document.getElementById('auto-refresh').checked) {
                this.startAutoRefresh(parseInt(e.target.value));
            }
        });

        // Start auto-refresh by default
        this.startAutoRefresh(2000);
    }

    setupCharts() {
        const chartConfig = {
            type: 'line',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'minute' },
                        display: false
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#a0a0a0' }
                    }
                },
                elements: {
                    point: { radius: 0 },
                    line: { tension: 0.3 }
                }
            }
        };

        // CPU Chart
        this.charts.cpu = new Chart(document.getElementById('cpu-chart'), {
            ...chartConfig,
            data: {
                datasets: [{
                    label: 'CPU %',
                    data: [],
                    borderColor: '#4a9eff',
                    backgroundColor: 'rgba(74, 158, 255, 0.1)',
                    fill: true
                }]
            }
        });

        // GPU Chart
        this.charts.gpu = new Chart(document.getElementById('gpu-chart'), {
            ...chartConfig,
            data: {
                datasets: [{
                    label: 'GPU %',
                    data: [],
                    borderColor: '#a78bfa',
                    backgroundColor: 'rgba(167, 139, 250, 0.1)',
                    fill: true
                }]
            }
        });

        // Memory Chart
        this.charts.memory = new Chart(document.getElementById('memory-chart'), {
            ...chartConfig,
            data: {
                datasets: [{
                    label: 'Memory GB',
                    data: [],
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    fill: true
                }]
            }
        });

        // Swap Chart
        this.charts.swap = new Chart(document.getElementById('swap-chart'), {
            ...chartConfig,
            data: {
                datasets: [{
                    label: 'Swap GB',
                    data: [],
                    borderColor: '#fbbf24',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    fill: true
                }]
            }
        });

        // Disk Chart
        this.charts.disk = new Chart(document.getElementById('disk-chart'), {
            ...chartConfig,
            data: {
                datasets: [
                    {
                        label: 'Read MB/s',
                        data: [],
                        borderColor: '#4ade80',
                        backgroundColor: 'transparent'
                    },
                    {
                        label: 'Write MB/s',
                        data: [],
                        borderColor: '#f87171',
                        backgroundColor: 'transparent'
                    }
                ]
            },
            options: {
                ...chartConfig.options,
                plugins: {
                    legend: { 
                        display: true,
                        labels: { color: '#a0a0a0', boxWidth: 12 }
                    }
                }
            }
        });

        // Network Chart
        this.charts.network = new Chart(document.getElementById('network-chart'), {
            ...chartConfig,
            data: {
                datasets: [
                    {
                        label: 'Download KB/s',
                        data: [],
                        borderColor: '#4ade80',
                        backgroundColor: 'transparent'
                    },
                    {
                        label: 'Upload KB/s',
                        data: [],
                        borderColor: '#4a9eff',
                        backgroundColor: 'transparent'
                    }
                ]
            },
            options: {
                ...chartConfig.options,
                plugins: {
                    legend: { 
                        display: true,
                        labels: { color: '#a0a0a0', boxWidth: 12 }
                    }
                }
            }
        });

        // Temperature Chart
        this.charts.temp = new Chart(document.getElementById('temp-chart'), {
            ...chartConfig,
            data: {
                datasets: [
                    {
                        label: 'CPU °C',
                        data: [],
                        borderColor: '#f87171',
                        backgroundColor: 'transparent'
                    },
                    {
                        label: 'GPU °C',
                        data: [],
                        borderColor: '#fbbf24',
                        backgroundColor: 'transparent'
                    }
                ]
            },
            options: {
                ...chartConfig.options,
                plugins: {
                    legend: { 
                        display: true,
                        labels: { color: '#a0a0a0', boxWidth: 12 }
                    }
                }
            }
        });

        // Power Chart
        this.charts.power = new Chart(document.getElementById('power-chart'), {
            ...chartConfig,
            data: {
                datasets: [
                    {
                        label: 'System W',
                        data: [],
                        borderColor: '#4ade80',
                        backgroundColor: 'rgba(74, 222, 128, 0.1)',
                        fill: true
                    },
                    {
                        label: 'CPU W',
                        data: [],
                        borderColor: '#4a9eff',
                        backgroundColor: 'transparent'
                    },
                    {
                        label: 'GPU W',
                        data: [],
                        borderColor: '#a78bfa',
                        backgroundColor: 'transparent'
                    }
                ]
            },
            options: {
                ...chartConfig.options,
                plugins: {
                    legend: { 
                        display: true,
                        labels: { color: '#a0a0a0', boxWidth: 12 }
                    }
                }
            }
        });
    }

    async loadTodayLog() {
        const today = new Date().toISOString().split('T')[0];
        const filename = `system-monitor-${today}.json`;
        
        this.updateStatus('loading', `Loading ${filename}...`);
        
        try {
            // Try to load from the logs directory
            const response = await fetch(`${this.logDir}/${filename}`);
            if (!response.ok) {
                throw new Error(`Log file not found: ${filename}`);
            }
            
            const text = await response.text();
            this.parseLogData(text);
            this.updateStatus('active', `Loaded ${this.data.length} samples`);
        } catch (error) {
            console.error('Error loading log:', error);
            this.updateStatus('error', 'No log file found. Start monitoring first.');
            
            // Show instructions
            this.showInstructions();
        }
    }

    loadFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.updateStatus('loading', `Loading ${file.name}...`);

        const reader = new FileReader();
        reader.onload = (e) => {
            this.parseLogData(e.target.result);
            this.updateStatus('active', `Loaded ${this.data.length} samples from ${file.name}`);
        };
        reader.onerror = () => {
            this.updateStatus('error', 'Error reading file');
        };
        reader.readAsText(file);
    }

    parseLogData(text) {
        this.data = [];
        const lines = text.trim().split('\n');
        
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const entry = JSON.parse(line);
                this.data.push(entry);
            } catch (e) {
                console.warn('Failed to parse line:', line);
            }
        }

        this.updateUI();
    }

    updateUI() {
        if (this.data.length === 0) return;

        const latest = this.data[this.data.length - 1];
        const recentData = this.data.slice(-this.maxDataPoints);

        // Update current values
        this.updateCurrentValues(latest);
        
        // Update charts
        this.updateCharts(recentData);
        
        // Update process table
        this.updateProcessTable(latest);
        
        // Update statistics
        this.updateStatistics();
    }

    updateCurrentValues(latest) {
        // CPU
        const cpuUsage = latest.cpu_usage?.toFixed(1) || '--';
        document.getElementById('cpu-value').textContent = `${cpuUsage}%`;
        document.getElementById('cpu-power').textContent = `${latest.soc_metrics?.cpu_power?.toFixed(1) || '--'} W`;

        // GPU
        const gpuUsage = latest.gpu_usage?.toFixed(1) || '--';
        document.getElementById('gpu-value').textContent = `${gpuUsage}%`;
        document.getElementById('gpu-power').textContent = `${latest.soc_metrics?.gpu_power?.toFixed(1) || '--'} W`;

        // Memory
        const memUsedGB = (latest.memory?.used / 1024 / 1024 / 1024).toFixed(1);
        const memTotalGB = (latest.memory?.total / 1024 / 1024 / 1024).toFixed(1);
        document.getElementById('memory-value').textContent = `${memUsedGB} GB`;
        document.getElementById('memory-detail').textContent = `${memUsedGB} / ${memTotalGB} GB`;

        // Swap
        const swapUsedGB = (latest.memory?.swap_used / 1024 / 1024 / 1024).toFixed(2);
        const swapTotalGB = (latest.memory?.swap_total / 1024 / 1024 / 1024).toFixed(1);
        document.getElementById('swap-value').textContent = `${swapUsedGB} GB`;
        document.getElementById('swap-detail').textContent = `${swapUsedGB} / ${swapTotalGB} GB`;

        // Disk I/O
        const diskRead = (latest.net_disk?.read_kbytes_per_sec / 1024).toFixed(2);
        const diskWrite = (latest.net_disk?.write_kbytes_per_sec / 1024).toFixed(2);
        document.getElementById('disk-read').textContent = `R: ${diskRead} MB/s`;
        document.getElementById('disk-write').textContent = `W: ${diskWrite} MB/s`;

        // Network
        const netDown = latest.net_disk?.in_bytes_per_sec?.toFixed(1) || '--';
        const netUp = latest.net_disk?.out_bytes_per_sec?.toFixed(1) || '--';
        document.getElementById('net-down').textContent = `↓ ${netDown} KB/s`;
        document.getElementById('net-up').textContent = `↑ ${netUp} KB/s`;

        // Temperature
        document.getElementById('cpu-temp').textContent = `${latest.cpu_temp?.toFixed(1) || latest.soc_metrics?.cpu_temp?.toFixed(1) || '--'}°C`;
        document.getElementById('gpu-temp').textContent = `${latest.gpu_temp?.toFixed(1) || latest.soc_metrics?.gpu_temp?.toFixed(1) || '--'}°C`;
        document.getElementById('system-power').textContent = `${latest.soc_metrics?.system_power?.toFixed(1) || '--'} W`;
        
        const thermalState = latest.thermal_state || '--';
        const thermalEl = document.getElementById('thermal-state');
        thermalEl.textContent = thermalState;
        thermalEl.className = 'thermal-value';
        if (thermalState === 'Serious' || thermalState === 'Critical') {
            thermalEl.classList.add('critical');
        } else if (thermalState === 'Fair' || thermalState === 'Moderate') {
            thermalEl.classList.add('warning');
        }
    }

    updateCharts(recentData) {
        const timestamps = recentData.map(d => new Date(d.timestamp));

        // CPU Chart
        this.charts.cpu.data.datasets[0].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: d.cpu_usage || 0
        }));
        this.charts.cpu.update('none');

        // GPU Chart
        this.charts.gpu.data.datasets[0].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: d.gpu_usage || 0
        }));
        this.charts.gpu.update('none');

        // Memory Chart
        this.charts.memory.data.datasets[0].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: (d.memory?.used || 0) / 1024 / 1024 / 1024
        }));
        this.charts.memory.update('none');

        // Swap Chart
        this.charts.swap.data.datasets[0].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: (d.memory?.swap_used || 0) / 1024 / 1024 / 1024
        }));
        this.charts.swap.update('none');

        // Disk Chart
        this.charts.disk.data.datasets[0].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: (d.net_disk?.read_kbytes_per_sec || 0) / 1024
        }));
        this.charts.disk.data.datasets[1].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: (d.net_disk?.write_kbytes_per_sec || 0) / 1024
        }));
        this.charts.disk.update('none');

        // Network Chart
        this.charts.network.data.datasets[0].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: d.net_disk?.in_bytes_per_sec || 0
        }));
        this.charts.network.data.datasets[1].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: d.net_disk?.out_bytes_per_sec || 0
        }));
        this.charts.network.update('none');

        // Temperature Chart
        this.charts.temp.data.datasets[0].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: d.cpu_temp || d.soc_metrics?.cpu_temp || 0
        }));
        this.charts.temp.data.datasets[1].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: d.gpu_temp || d.soc_metrics?.gpu_temp || 0
        }));
        this.charts.temp.update('none');

        // Power Chart
        this.charts.power.data.datasets[0].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: d.soc_metrics?.system_power || 0
        }));
        this.charts.power.data.datasets[1].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: d.soc_metrics?.cpu_power || 0
        }));
        this.charts.power.data.datasets[2].data = recentData.map((d, i) => ({
            x: timestamps[i],
            y: d.soc_metrics?.gpu_power || 0
        }));
        this.charts.power.update('none');
    }

    updateProcessTable(latest) {
        const tbody = document.getElementById('process-tbody');
        const highlightWindsurf = document.getElementById('highlight-windsurf').checked;
        
        // mactop doesn't include process list in headless mode by default
        // We'll show a placeholder or parse from the data if available
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-secondary);">
                    Process list available in interactive mactop mode.<br>
                    Run <code>mactop</code> in terminal for live process view.
                </td>
            </tr>
        `;
    }

    updateStatistics() {
        if (this.data.length === 0) return;

        const samples = this.data.length;
        const first = new Date(this.data[0].timestamp);
        const last = new Date(this.data[this.data.length - 1].timestamp);
        const durationMs = last - first;
        const durationStr = this.formatDuration(durationMs);

        // Calculate averages and peaks
        let totalCpu = 0, peakCpu = 0;
        let totalMem = 0, peakMem = 0;
        let peakSwap = 0;
        let totalPower = 0;

        for (const d of this.data) {
            const cpu = d.cpu_usage || 0;
            const mem = (d.memory?.used || 0) / 1024 / 1024 / 1024;
            const swap = (d.memory?.swap_used || 0) / 1024 / 1024 / 1024;
            const power = d.soc_metrics?.system_power || 0;

            totalCpu += cpu;
            totalMem += mem;
            totalPower += power;

            if (cpu > peakCpu) peakCpu = cpu;
            if (mem > peakMem) peakMem = mem;
            if (swap > peakSwap) peakSwap = swap;
        }

        document.getElementById('stat-samples').textContent = samples.toLocaleString();
        document.getElementById('stat-duration').textContent = durationStr;
        document.getElementById('stat-avg-cpu').textContent = `${(totalCpu / samples).toFixed(1)}%`;
        document.getElementById('stat-peak-cpu').textContent = `${peakCpu.toFixed(1)}%`;
        document.getElementById('stat-avg-memory').textContent = `${(totalMem / samples).toFixed(1)} GB`;
        document.getElementById('stat-peak-memory').textContent = `${peakMem.toFixed(1)} GB`;
        document.getElementById('stat-peak-swap').textContent = `${peakSwap.toFixed(2)} GB`;
        document.getElementById('stat-avg-power').textContent = `${(totalPower / samples).toFixed(1)} W`;
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    updateStatus(state, message) {
        const dot = document.getElementById('status-dot');
        const text = document.getElementById('status-text');

        dot.className = 'status-dot';
        if (state === 'active') {
            dot.classList.add('active');
        } else if (state === 'error') {
            dot.classList.add('error');
        }

        text.textContent = message;
    }

    showInstructions() {
        const tbody = document.getElementById('process-tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <h3 style="margin-bottom: 15px; color: var(--text-primary);">No Data Yet</h3>
                    <p>Start monitoring to collect data:</p>
                    <code style="display: block; margin: 15px 0; padding: 10px; background: var(--bg-secondary); border-radius: 6px;">
                        ./src/monitor.sh start
                    </code>
                    <p>Or double-click <strong>StartMonitoring.command</strong> in the launchers folder.</p>
                </td>
            </tr>
        `;
    }

    toggleAutoRefresh(enabled) {
        if (enabled) {
            const interval = parseInt(document.getElementById('refresh-interval').value);
            this.startAutoRefresh(interval);
        } else {
            this.stopAutoRefresh();
        }
    }

    startAutoRefresh(intervalMs) {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            this.loadTodayLog();
        }, intervalMs);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}

// Initialize the monitor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.monitor = new ResourceMonitor();
});
