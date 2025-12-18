import Cocoa

// Menu Bar App for MacBook Resource Monitor
// Provides Start/Stop/Open Viewer functionality from the menu bar

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem!
    var isMonitorRunning = false
    let projectPath = NSString(string: "~/Documents/GitHub/macbook-resource-monitoring").expandingTildeInPath
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Create status bar item
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "waveform.path.ecg", accessibilityDescription: "Resource Monitor")
            button.image?.isTemplate = true
        }
        
        // Check initial status
        checkMonitorStatus()
        
        // Build menu
        setupMenu()
        
        // Periodically check status
        Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            self?.checkMonitorStatus()
        }
    }
    
    func setupMenu() {
        let menu = NSMenu()
        
        // Status item
        let statusMenuItem = NSMenuItem(title: "Status: Checking...", action: nil, keyEquivalent: "")
        statusMenuItem.tag = 100
        menu.addItem(statusMenuItem)
        
        menu.addItem(NSMenuItem.separator())
        
        // Start/Stop
        let toggleItem = NSMenuItem(title: "Start Monitoring", action: #selector(toggleMonitoring), keyEquivalent: "s")
        toggleItem.tag = 101
        menu.addItem(toggleItem)
        
        // Open Viewer
        let viewerItem = NSMenuItem(title: "Open Viewer", action: #selector(openViewer), keyEquivalent: "v")
        menu.addItem(viewerItem)
        
        menu.addItem(NSMenuItem.separator())
        
        // Open Logs Folder
        let logsItem = NSMenuItem(title: "Open Logs Folder", action: #selector(openLogs), keyEquivalent: "l")
        menu.addItem(logsItem)
        
        // Open Project Folder
        let projectItem = NSMenuItem(title: "Open Project Folder", action: #selector(openProject), keyEquivalent: "p")
        menu.addItem(projectItem)
        
        menu.addItem(NSMenuItem.separator())
        
        // Quit
        let quitItem = NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        menu.addItem(quitItem)
        
        statusItem.menu = menu
    }
    
    func checkMonitorStatus() {
        let pidFile = "/tmp/macbook-monitor.pid"
        let fileManager = FileManager.default
        
        var running = false
        
        if fileManager.fileExists(atPath: pidFile) {
            if let pidString = try? String(contentsOfFile: pidFile, encoding: .utf8).trimmingCharacters(in: .whitespacesAndNewlines),
               let pid = Int32(pidString) {
                // Check if process is actually running
                running = kill(pid, 0) == 0
            }
        }
        
        isMonitorRunning = running
        updateMenuStatus()
    }
    
    func updateMenuStatus() {
        guard let menu = statusItem.menu else { return }
        
        // Update status text
        if let statusItem = menu.item(withTag: 100) {
            statusItem.title = isMonitorRunning ? "● Running" : "○ Stopped"
            // Add color via attributed string
            let color: NSColor = isMonitorRunning ? .systemGreen : .systemGray
            let attributes: [NSAttributedString.Key: Any] = [.foregroundColor: color]
            statusItem.attributedTitle = NSAttributedString(string: statusItem.title, attributes: attributes)
        }
        
        // Update toggle button text
        if let toggleItem = menu.item(withTag: 101) {
            toggleItem.title = isMonitorRunning ? "Stop Monitoring" : "Start Monitoring"
        }
        
        // Update menu bar icon
        if let button = statusItem.button {
            let symbolName = isMonitorRunning ? "waveform.path.ecg" : "waveform.path.ecg.rectangle"
            button.image = NSImage(systemSymbolName: symbolName, accessibilityDescription: "Resource Monitor")
            button.image?.isTemplate = true
        }
    }
    
    @objc func toggleMonitoring() {
        let script = "\(projectPath)/src/monitor.sh"
        let action = isMonitorRunning ? "stop" : "start"
        
        runShellCommand("\(script) \(action)")
        
        // Wait a moment then check status
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            self?.checkMonitorStatus()
        }
    }
    
    @objc func openViewer() {
        // Start monitor if not running
        if !isMonitorRunning {
            let script = "\(projectPath)/src/monitor.sh"
            runShellCommand("\(script) start")
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
                self?.checkMonitorStatus()
            }
        }
        
        // Open viewer
        let script = "\(projectPath)/src/monitor.sh"
        runShellCommand("\(script) viewer")
    }
    
    @objc func openLogs() {
        let logsPath = "\(projectPath)/logs"
        NSWorkspace.shared.open(URL(fileURLWithPath: logsPath))
    }
    
    @objc func openProject() {
        NSWorkspace.shared.open(URL(fileURLWithPath: projectPath))
    }
    
    func runShellCommand(_ command: String) {
        let task = Process()
        task.launchPath = "/bin/bash"
        task.arguments = ["-c", command]
        task.standardOutput = FileHandle.nullDevice
        task.standardError = FileHandle.nullDevice
        
        do {
            try task.run()
        } catch {
            print("Error running command: \(error)")
        }
    }
}

// Main entry point
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory) // Menu bar only, no dock icon
app.run()
