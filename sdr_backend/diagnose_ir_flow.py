#!/usr/bin/env python3
"""
Diagnostic script to verify the IR flow components are working correctly.
"""

import os
import sys
import json
import subprocess
from pathlib import Path

# Add the parent directory to the path so we can import modules
sys.path.insert(0, str(Path(__file__).parent))

# Import settings
try:
    from config.settings import IR_BUILDER_MIN_ACTIVE
    print(f"✅ Imported IR_BUILDER_MIN_ACTIVE setting: {IR_BUILDER_MIN_ACTIVE}")
except Exception as e:
    print(f"❌ Failed to import IR_BUILDER_MIN_ACTIVE setting: {e}")
    IR_BUILDER_MIN_ACTIVE = None

def check_d2json_binary():
    """Check if d2json binary is available and working."""
    print("\n=== Checking d2json binary ===")
    
    # Check if d2json is in PATH
    try:
        result = subprocess.run(["which", "d2json"], capture_output=True, text=True)
        if result.returncode == 0:
            path = result.stdout.strip()
            print(f"✅ Found d2json in PATH: {path}")
            return True
    except Exception:
        pass
    
    # Check in the project directory
    base_dir = Path(__file__).parent
    possible_paths = [
        base_dir / "tools" / "cmd" / "d2json" / "d2json",
        Path.home() / "bin" / "d2json",
        Path("/usr/local/bin/d2json"),
        Path("/usr/bin/d2json"),
    ]
    
    for path in possible_paths:
        if path.exists() and os.access(path, os.X_OK):
            print(f"✅ Found d2json at: {path}")
            try:
                # Test if it works
                test_input = "direction: right\na: A\nb: B\na -> b"
                result = subprocess.run(
                    [str(path)], 
                    input=test_input.encode(), 
                    capture_output=True, 
                    timeout=5
                )
                if result.returncode == 0:
                    print("✅ d2json binary is working properly")
                    return True
                else:
                    print(f"❌ d2json binary exists but returned error: {result.stderr.decode()}")
            except Exception as e:
                print(f"❌ Error testing d2json: {e}")
    
    print("❌ d2json binary not found or not working")
    return False

def check_ir_modules():
    """Check if required IR modules are available."""
    print("\n=== Checking IR modules ===")
    
    required_modules = [
        ("core.ir.ir_builder", "IRBuilder"),
        ("core.ir.ir_types", "IRGraph"),
        ("core.ir.enrich", "IrEnricher"),
        ("core.ir.view_emitters", "ReactFlowEmitter")
    ]
    
    all_ok = True
    for module_path, class_name in required_modules:
        try:
            module_parts = module_path.split('.')
            from_module = '.'.join(module_parts[:-1])
            import_name = module_parts[-1]
            
            exec(f"from {from_module} import {import_name}")
            module = eval(import_name)
            
            # Try to access the class
            cls = getattr(module, class_name)
            print(f"✅ Successfully imported {class_name} from {module_path}")
        except Exception as e:
            print(f"❌ Failed to import {class_name} from {module_path}: {e}")
            all_ok = False
    
    return all_ok

def check_available_views():
    """Check which views are available from view_emitters."""
    print("\n=== Checking available views ===")
    
    try:
        from core.ir.view_emitters import _EMITTERS
        views = list(_EMITTERS.keys())
        print(f"✅ Available views: {views}")
        return views
    except Exception as e:
        print(f"❌ Failed to get available views: {e}")
        return []

def main():
    """Run all diagnostics."""
    print("=== IR Flow Diagnostics ===")
    print(f"Current directory: {os.getcwd()}")
    
    # Check if IR flow is enabled
    print(f"\nIR_BUILDER_MIN_ACTIVE = {IR_BUILDER_MIN_ACTIVE}")
    if IR_BUILDER_MIN_ACTIVE is None:
        print("⚠️ Could not determine if IR flow is enabled, assuming it is")
    elif not IR_BUILDER_MIN_ACTIVE:
        print("⚠️ IR flow is disabled in settings")
    else:
        print("✅ IR flow is enabled in settings")
    
    # Check for d2json binary
    d2json_ok = check_d2json_binary()
    
    # Check IR modules
    modules_ok = check_ir_modules()
    
    # Check available views
    views = check_available_views()
    
    # Summary
    print("\n=== Diagnostic Summary ===")
    if d2json_ok and modules_ok and views:
        print("✅ All IR flow components are working correctly")
        print(f"✅ Available views: {views}")
    else:
        print("❌ Some IR flow components are not working correctly")
        if not d2json_ok:
            print("❌ d2json binary is missing or not working")
        if not modules_ok:
            print("❌ Some IR modules could not be imported")
        if not views:
            print("❌ No views available from view_emitters")
    
    return 0 if d2json_ok and modules_ok and views else 1

if __name__ == "__main__":
    sys.exit(main()) 