#!/bin/bash
# Script to install the updated d2json binary

set -e  # Exit immediately if a command fails

echo "Installing updated d2json binary with timeout support..."

# Ensure d2json source directory exists
if [ ! -d "sdr_backend/tools/cmd/d2json" ]; then
    echo "❌ Error: d2json source directory not found. Please run from project root."
    exit 1
fi

# Build the binary
cd sdr_backend/tools/cmd/d2json
echo "🔨 Building d2json binary..."
go build -o d2json

# Check if build succeeded
if [ ! -f "d2json" ]; then
    echo "❌ Error: Failed to build d2json binary."
    exit 1
fi

# Create installation paths
mkdir -p ~/bin
mkdir -p /usr/local/bin 2>/dev/null || true  # Might need sudo for this one

# Install to user's bin directory
echo "📦 Installing d2json to ~/bin..."
cp d2json ~/bin/
chmod +x ~/bin/d2json

# Try to install to system path (might require sudo)
if [ -w "/usr/local/bin" ]; then
    echo "📦 Installing d2json to /usr/local/bin..."
    cp d2json /usr/local/bin/
    chmod +x /usr/local/bin/d2json
else
    echo "⚠️  Notice: Could not install to /usr/local/bin without sudo."
    echo "⚠️  To install system-wide, run: sudo cp ~/bin/d2json /usr/local/bin/ && sudo chmod +x /usr/local/bin/d2json"
fi

# Test installed binary
echo "🧪 Testing installed binary..."
~/bin/d2json -timeout 3 -help > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Binary works correctly!"
else
    echo "⚠️  Warning: Binary might not work correctly."
fi

echo "✅ Installation complete!"
echo ""
echo "Add ~/bin to your PATH if not already done:"
echo "echo 'export PATH=\"\$HOME/bin:\$PATH\"' >> ~/.bashrc  # For bash"
echo "echo 'export PATH=\"\$HOME/bin:\$PATH\"' >> ~/.zshrc   # For zsh" 