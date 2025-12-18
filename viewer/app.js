// MacBook Resource Monitor - Viewer Application

class ResourceMonitor {
    constructor() {
        this.data = [];
        this.charts = {};
        this.maxDataPoints = 300; // Show last 5 minutes at 1-second intervals
        this.refreshInterval = null;
        this.logDir = '../logs';
        this.lastDataLength = 0; // Track last known data length for incremental updates
        this.isUpdating = false; // Prevent concurrent updates
        
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
        // Base config for small charts (no time axis)
        const chartConfigSmall = {
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

        // Config for wide charts with time axis
        const chartConfigWide = {
            type: 'line',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: {
                    legend: { 
                        display: true,
                        labels: { color: '#a0a0a0', boxWidth: 12 }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { 
                            unit: 'minute',
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm'
                            }
                        },
                        display: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { 
                            color: '#a0a0a0',
                            maxTicksLimit: 10
                        }
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

        const chartConfig = chartConfigSmall;

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

        // Power Chart - with time axis
        this.charts.power = new Chart(document.getElementById('power-chart'), {
            ...chartConfigWide,
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
            }
        });

        // Windsurf Chart - with time axis
        this.charts.windsurf = new Chart(document.getElementById('windsurf-chart'), {
            ...chartConfigWide,
            data: {
                datasets: [
                    {
                        label: 'CPU % (normalized)',
                        data: [],
                        borderColor: '#a78bfa',
                        backgroundColor: 'rgba(167, 139, 250, 0.1)',
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Memory %',
                        data: [],
                        borderColor: '#4ade80',
                        backgroundColor: 'transparent',
                        yAxisID: 'y'
                    },
                    {
                        label: 'RAM (GB)',
                        data: [],
                        borderColor: '#fbbf24',
                        backgroundColor: 'transparent',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                ...chartConfigWide.options,
                scales: {
                    ...chartConfigWide.options.scales,
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#a0a0a0' },
                        title: {
                            display: true,
                            text: '%',
                            color: '#a0a0a0'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#fbbf24' },
                        title: {
                            display: true,
                            text: 'GB',
                            color: '#fbbf24'
                        }
                    }
                }
            }
        });
    }

    async loadTodayLog() {
        // Prevent concurrent updates that cause jitter
        if (this.isUpdating) return;
        this.isUpdating = true;
        
        const today = new Date().toISOString().split('T')[0];
        const filename = `system-monitor-${today}.json`;
        
        // Don't show loading status on refresh - it causes flicker
        if (this.data.length === 0) {
            this.updateStatus('loading', `Loading ${filename}...`);
        }
        
        try {
            // Try to load from the logs directory
            const response = await fetch(`${this.logDir}/${filename}`, {
                cache: 'no-store' // Prevent caching
            });
            if (!response.ok) {
                throw new Error(`Log file not found: ${filename}`);
            }
            
            const text = await response.text();
            const newDataCount = this.parseLogData(text);
            
            // Only update status if we got new data or it's first load
            if (newDataCount > 0 || this.data.length === 0) {
                this.updateStatus('active', `${this.data.length} samples`);
            }
        } catch (error) {
            console.error('Error loading log:', error);
            if (this.data.length === 0) {
                this.updateStatus('error', 'No log file found. Start monitoring first.');
                this.showInstructions();
            }
        } finally {
            this.isUpdating = false;
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
        const lines = text.trim().split('\n');
        const previousLength = this.data.length;
        
        // Only parse new lines if we already have data
        const startIndex = previousLength > 0 ? previousLength : 0;
        
        // Clear and rebuild if file was truncated/rotated
        if (lines.length < previousLength) {
            this.data = [];
        }
        
        // Parse only new lines
        for (let i = this.data.length; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            try {
                const entry = JSON.parse(line);
                this.data.push(entry);
            } catch (e) {
                // Skip malformed lines silently
            }
        }
        
        const newDataCount = this.data.length - previousLength;
        
        // Only update UI if we have new data
        if (newDataCount > 0 || previousLength === 0) {
            this.updateUI();
        }
        
        return newDataCount;
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

        // Windsurf Chart
        if (this.charts.windsurf) {
            this.charts.windsurf.data.datasets[0].data = recentData.map((d, i) => ({
                x: timestamps[i],
                y: d.windsurf?.total_cpu_normalized || 0
            }));
            this.charts.windsurf.data.datasets[1].data = recentData.map((d, i) => ({
                x: timestamps[i],
                y: d.windsurf?.total_mem || 0
            }));
            this.charts.windsurf.data.datasets[2].data = recentData.map((d, i) => ({
                x: timestamps[i],
                y: (d.windsurf?.total_rss_mb || 0) / 1024
            }));
            this.charts.windsurf.update('none');
        }

        // Update Windsurf panel
        this.updateWindsurfPanel(recentData[recentData.length - 1]);
    }

    updateWindsurfPanel(latest) {
        if (!latest?.windsurf) {
            // No windsurf data yet
            return;
        }

        const ws = latest.windsurf;
        
        // Update summary stats
        document.getElementById('ws-process-count').textContent = ws.process_count || 0;
        document.getElementById('ws-total-rss').textContent = `${((ws.total_rss_mb || 0) / 1024).toFixed(2)} GB`;
        document.getElementById('sampling-overhead').textContent = `${latest.sampling_overhead_ms || 0} ms`;

        // Update bars
        const cpuNorm = ws.total_cpu_normalized || 0;
        const memPct = ws.total_mem || 0;
        
        document.getElementById('ws-cpu-bar').style.width = `${Math.min(cpuNorm, 100)}%`;
        document.getElementById('ws-cpu-value').textContent = `${cpuNorm.toFixed(1)}%`;
        
        document.getElementById('ws-mem-bar').style.width = `${Math.min(memPct, 100)}%`;
        document.getElementById('ws-mem-value').textContent = `${memPct.toFixed(1)}%`;

        // Update 30-second rolling average status indicators
        this.updateStatusIndicators();
    }

    updateStatusIndicators() {
        // Get last 30 seconds of data (assuming ~1 sample per second with overhead)
        const now = Date.now();
        const thirtySecondsAgo = now - 30000;
        
        const recentData = this.data.filter(d => {
            const ts = new Date(d.timestamp).getTime();
            return ts >= thirtySecondsAgo && d.windsurf;
        });

        if (recentData.length === 0) return;

        // Calculate 30-second averages
        let totalCpu = 0;
        let totalMem = 0;
        
        for (const d of recentData) {
            totalCpu += d.windsurf?.total_cpu_normalized || 0;
            totalMem += d.windsurf?.total_mem || 0;
        }
        
        const avgCpu = totalCpu / recentData.length;
        const avgMem = totalMem / recentData.length;

        // Configurable thresholds
        const CPU_WARNING_THRESHOLD = 30;
        const CPU_HIGH_THRESHOLD = 50;
        const MEM_WARNING_THRESHOLD = 40;
        const MEM_HIGH_THRESHOLD = 60;

        // Update CPU indicator
        const cpuIndicator = document.getElementById('cpu-status-indicator');
        if (cpuIndicator) {
            cpuIndicator.classList.remove('status-ok', 'status-warning', 'status-high');
            if (avgCpu >= CPU_HIGH_THRESHOLD) {
                cpuIndicator.classList.add('status-high');
                cpuIndicator.title = `CPU High: ${avgCpu.toFixed(1)}% (30s avg)`;
            } else if (avgCpu >= CPU_WARNING_THRESHOLD) {
                cpuIndicator.classList.add('status-warning');
                cpuIndicator.title = `CPU Warning: ${avgCpu.toFixed(1)}% (30s avg)`;
            } else {
                cpuIndicator.classList.add('status-ok');
                cpuIndicator.title = `CPU OK: ${avgCpu.toFixed(1)}% (30s avg)`;
            }
        }

        // Update Memory indicator
        const memIndicator = document.getElementById('mem-status-indicator');
        if (memIndicator) {
            memIndicator.classList.remove('status-ok', 'status-warning', 'status-high');
            if (avgMem >= MEM_HIGH_THRESHOLD) {
                memIndicator.classList.add('status-high');
                memIndicator.title = `Memory High: ${avgMem.toFixed(1)}% (30s avg)`;
            } else if (avgMem >= MEM_WARNING_THRESHOLD) {
                memIndicator.classList.add('status-warning');
                memIndicator.title = `Memory Warning: ${avgMem.toFixed(1)}% (30s avg)`;
            } else {
                memIndicator.classList.add('status-ok');
                memIndicator.title = `Memory OK: ${avgMem.toFixed(1)}% (30s avg)`;
            }
        }
    }

    updateProcessTable(latest) {
        const tbody = document.getElementById('process-tbody');
        const highlightWindsurf = document.getElementById('highlight-windsurf').checked;
        
        // Use Windsurf process data from our sampler
        if (!latest?.windsurf?.processes || latest.windsurf.processes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-secondary);">
                        No Windsurf processes detected.<br>
                        Make sure Windsurf is running.
                    </td>
                </tr>
            `;
            return;
        }

        // Sort by CPU usage descending, take top 15
        const processes = [...latest.windsurf.processes]
            .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
            .slice(0, 15);

        tbody.innerHTML = processes.map(proc => {
            const typeLabels = {
                'cascade_ai': '🤖 Cascade AI',
                'renderer': '🖼️ Renderer',
                'extension_host': '🔌 Extension',
                'gpu_helper': '🎮 GPU Helper',
                'language_server': '📝 Lang Server',
                'main': '⚡ Main',
                'other': '📦 Other'
            };
            
            const typeLabel = typeLabels[proc.type] || proc.type;
            const isHighCpu = proc.cpu > 50;
            const isHighMem = proc.rss_mb > 500;
            
            const rowClass = highlightWindsurf ? 'highlighted' : '';
            const cpuClass = isHighCpu ? 'style="color: var(--accent-red); font-weight: bold;"' : '';
            const memClass = isHighMem ? 'style="color: var(--accent-yellow); font-weight: bold;"' : '';
            
            return `
                <tr class="${rowClass}">
                    <td>${proc.pid}</td>
                    <td>${typeLabel}</td>
                    <td ${cpuClass}>${(proc.cpu || 0).toFixed(1)}%</td>
                    <td ${memClass}>${(proc.rss_mb || 0).toFixed(0)} MB</td>
                </tr>
            `;
        }).join('');
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
