#!/bin/bash
# MacBook Resource Monitor - Combined Sampler
# Collects mactop data + Windsurf process data + overhead metrics

INTERVAL="${1:-1000}"
LOG_FILE="${2:-/tmp/monitor.json}"
CPU_CORES=$(sysctl -n hw.ncpu)

sample_start=$(python3 -c "import time; print(int(time.time()*1000))")

# Get mactop sample
mactop_data=$(mactop --headless --count 1 --interval "$INTERVAL" 2>/dev/null | jq -c '.[0]')

# Get Windsurf process data with summary
windsurf_json=$(ps aux 2>/dev/null | grep -i windsurf | grep -v grep | awk -v cores="$CPU_CORES" '
BEGIN { 
    total_cpu=0; total_mem=0; total_rss=0; count=0;
}
{
    cpu=$3; mem=$4; rss=$6/1024; pid=$2;
    total_cpu+=cpu; total_mem+=mem; total_rss+=rss; count++;
    
    # Extract process type from command
    cmd="";
    for(i=11;i<=NF;i++) cmd=cmd" "$i;
    
    # Categorize process
    if (cmd ~ /server_[a-f0-9]/) type="cascade_ai";
    else if (cmd ~ /Renderer/) type="renderer";
    else if (cmd ~ /Plugin/) type="extension_host";
    else if (cmd ~ /GPU/) type="gpu_helper";
    else if (cmd ~ /language_server/) type="language_server";
    else if (cmd ~ /Electron/) type="main";
    else type="other";
    
    # Store process info
    procs[count] = sprintf("{\"pid\":%s,\"cpu\":%.1f,\"mem\":%.1f,\"rss_mb\":%.1f,\"type\":\"%s\"}", pid, cpu, mem, rss, type);
}
END {
    # Build processes array
    printf "{\"process_count\":%d,\"total_cpu\":%.1f,\"total_cpu_normalized\":%.1f,\"total_mem\":%.1f,\"total_rss_mb\":%.1f,\"cpu_cores\":%d,\"processes\":[", count, total_cpu, total_cpu/cores, total_mem, total_rss, cores;
    for (i=1; i<=count; i++) {
        if (i > 1) printf ",";
        printf "%s", procs[i];
    }
    printf "]}"
}
')

sample_end=$(python3 -c "import time; print(int(time.time()*1000))")
sample_overhead=$((sample_end - sample_start))

# Handle empty windsurf data
if [ -z "$windsurf_json" ] || [ "$windsurf_json" = "" ]; then
    windsurf_json='{"process_count":0,"total_cpu":0,"total_cpu_normalized":0,"total_mem":0,"total_rss_mb":0,"cpu_cores":'$CPU_CORES',"processes":[]}'
fi

# Merge all data into single JSON
echo "$mactop_data" | jq -c --argjson ws "$windsurf_json" --argjson overhead "$sample_overhead" --argjson cores "$CPU_CORES" '
    . + {
        windsurf: $ws,
        sampling_overhead_ms: $overhead,
        cpu_cores: $cores,
        cpu_usage_normalized: ((.cpu_usage // 0) / $cores)
    }
' >> "$LOG_FILE"
