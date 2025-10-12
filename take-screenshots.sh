#!/bin/bash

# Galaxy Audio Visualizer Player - Screenshot Capture Script
# This script helps capture screenshots of the project

echo "📸 Galaxy Audio Visualizer Player - Screenshot Capture"
echo "====================================================="

# Check if the project is running
if ! pgrep -f "http.server" > /dev/null; then
    echo "🚀 Starting local server..."
    python3 -m http.server 8000 &
    SERVER_PID=$!
    sleep 3
    echo "✅ Server started on http://localhost:8000"
else
    echo "✅ Server already running on http://localhost:8000"
fi

# Create screenshots directory
mkdir -p media/screenshots

echo ""
echo "📋 Screenshot Instructions:"
echo "=========================="
echo "1. Open your browser and go to: http://localhost:8000"
echo "2. Take screenshots of the following views:"
echo ""
echo "   📸 Main Interface (Full Screen)"
echo "   📸 Particle Visualization Mode"
echo "   📸 Spectrum Analysis Mode"
echo "   📸 Waveform Display Mode"
echo "   📸 Needle Charts Mode"
echo "   📸 Equalizer Interface"
echo "   📸 Mobile/Responsive View"
echo "   📸 Playlist Interface"
echo ""
echo "3. Save screenshots to: media/screenshots/"
echo "4. Use descriptive names like:"
echo "   - main-interface.png"
echo "   - particle-mode.png"
echo "   - spectrum-mode.png"
echo "   - waveform-mode.png"
echo "   - needle-mode.png"
echo "   - equalizer.png"
echo "   - mobile-view.png"
echo "   - playlist.png"
echo ""

# macOS screenshot commands
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🖥️  macOS Screenshot Commands:"
    echo "============================="
    echo "• Full screen: Cmd + Shift + 3"
    echo "• Selected area: Cmd + Shift + 4"
    echo "• Specific window: Cmd + Shift + 4, then Space"
    echo ""
    echo "💡 Tips:"
    echo "• Use Cmd + Shift + 4 for precise area selection"
    echo "• Press Space after Cmd + Shift + 4 to capture specific windows"
    echo "• Screenshots will be saved to Desktop by default"
    echo "• Move them to media/screenshots/ after taking"
fi

# Windows screenshot commands
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "🖥️  Windows Screenshot Commands:"
    echo "==============================="
    echo "• Full screen: Print Screen key"
    echo "• Active window: Alt + Print Screen"
    echo "• Snipping Tool: Windows + Shift + S"
    echo ""
    echo "💡 Tips:"
    echo "• Use Snipping Tool for precise area selection"
    echo "• Save screenshots to media/screenshots/ folder"
fi

# Linux screenshot commands
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🖥️  Linux Screenshot Commands:"
    echo "============================="
    echo "• Full screen: Print Screen key"
    echo "• Selected area: Shift + Print Screen"
    echo "• Specific window: Alt + Print Screen"
    echo ""
    echo "💡 Tips:"
    echo "• Use Shift + Print Screen for area selection"
    echo "• Screenshots saved to ~/Pictures/ by default"
    echo "• Move them to media/screenshots/ after taking"
fi

echo ""
echo "📁 Screenshot Directory:"
echo "======================="
echo "Target folder: $(pwd)/media/screenshots/"
echo ""

# Show current screenshots if any
if [ "$(ls -A media/screenshots/ 2>/dev/null)" ]; then
    echo "📸 Current screenshots:"
    ls -la media/screenshots/
    echo ""
fi

echo "🎯 After taking screenshots:"
echo "==========================="
echo "1. Move screenshots to: media/screenshots/"
echo "2. Run: ./upload-screenshots.sh"
echo "3. Or manually:"
echo "   git add media/screenshots/"
echo "   git commit -m 'Add project screenshots'"
echo "   git push"
echo ""

# Keep server running
echo "🌐 Server is running at: http://localhost:8000"
echo "Press Ctrl+C to stop the server when done"
echo ""

# Wait for user input
read -p "Press Enter when you're ready to take screenshots..."

# Cleanup function
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        echo ""
        echo "🛑 Stopping server..."
        kill $SERVER_PID 2>/dev/null
    fi
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Keep script running
while true; do
    sleep 1
done
