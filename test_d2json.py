#!/usr/bin/env python3
"""
Test script to validate d2json binary with timeout support.
"""

import subprocess
import time
import json
import os
from pathlib import Path

# Set the path to the d2json binary
D2JSON_PATH = str(Path.home() / "bin" / "d2json")

# If not found in ~/bin, try to find it in the current project
if not os.path.isfile(D2JSON_PATH):
    project_root = Path(__file__).parent
    possible_paths = [
        project_root / "sdr_backend" / "tools" / "cmd" / "d2json" / "d2json",
        project_root / "tools" / "cmd" / "d2json" / "d2json",
    ]
    for path in possible_paths:
        if path.exists() and os.access(path, os.X_OK):
            D2JSON_PATH = str(path)
            break

# Verify the binary exists
if not os.path.isfile(D2JSON_PATH):
    print(f"❌ d2json binary not found: {D2JSON_PATH}")
    exit(1)

print(f"✅ Using d2json binary: {D2JSON_PATH}")

# Create a simple D2 diagram
test_diagram = """
direction: right

client: "Client" { style.fill: "#3B82F6" }
server: "Server" { style.fill: "#8B5CF6" }
database: "Database" { style.fill: "#F97316" }

client -> server: "Request"
server -> database: "Query"
database -> server: "Results"
server -> client: "Response"
"""

# Test with timeout parameter
print("\n=== Testing d2json with timeout parameter ===")
start_time = time.time()
try:
    # Write diagram to a temporary file
    temp_file = "/tmp/test_d2json.d2"
    with open(temp_file, "w") as f:
        f.write(test_diagram)
    
    result = subprocess.run(
        [D2JSON_PATH, "-timeout", "5", temp_file],
        capture_output=True,
        text=True,
        check=True,
        timeout=7  # Allow a bit more time than the binary timeout
    )
    
    elapsed = time.time() - start_time
    print(f"✅ d2json completed in {elapsed:.2f} seconds")
    
    # Parse the output
    try:
        data = json.loads(result.stdout)
        print(f"✅ Successfully parsed JSON output: {len(data.get('nodes', []))} nodes, {len(data.get('edges', []))} edges")
        
        # Print nodes and edges
        print("\nNodes:")
        for node in data.get('nodes', []):
            print(f"  - {node['id']}: {node['label']}")
        
        print("\nEdges:")
        for edge in data.get('edges', []):
            print(f"  - {edge['Source']} -> {edge['Target']}: {edge.get('Label', '')}")
        
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON: {e}")
        print(f"Output: {result.stdout[:200]}...")
    
    # Clean up
    os.unlink(temp_file)
    
except subprocess.TimeoutExpired:
    elapsed = time.time() - start_time
    print(f"❌ d2json timed out after {elapsed:.2f} seconds")
except subprocess.CalledProcessError as e:
    print(f"❌ d2json failed with exit code {e.returncode}")
    print(f"Error output: {e.stderr}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n=== Test completed ===") 