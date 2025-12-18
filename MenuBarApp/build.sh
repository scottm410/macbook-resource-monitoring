#!/bin/bash
# Build script for Resource Monitor menu bar app

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
APP_NAME="ResourceMonitor"
APP_BUNDLE="$PROJECT_DIR/launchers/${APP_NAME}.app"

echo "Building Resource Monitor menu bar app..."

# Create app bundle structure
rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# Copy Info.plist
cp "$SCRIPT_DIR/ResourceMonitor/Info.plist" "$APP_BUNDLE/Contents/"

# Compile Swift
echo "Compiling Swift..."
swiftc -o "$APP_BUNDLE/Contents/MacOS/$APP_NAME" \
    -framework Cocoa \
    -O \
    "$SCRIPT_DIR/ResourceMonitor/main.swift"

# Make executable
chmod +x "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

echo ""
echo "✅ Build complete!"
echo "   App location: $APP_BUNDLE"
echo ""
echo "To run:"
echo "   open '$APP_BUNDLE'"
echo ""
echo "To add to Login Items (start on boot):"
echo "   1. Open System Settings > General > Login Items"
echo "   2. Click '+' and add ResourceMonitor.app"
