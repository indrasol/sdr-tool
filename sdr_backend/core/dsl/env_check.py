# core/dsl/env_check.py
import shutil, subprocess, sys
from utils.logger import log_info, log_error

def ensure_d2_present(min_version: str = "0.7.0") -> None:
    binary = shutil.which("d2")
    if not binary:
        log_error(" D2 binary not found in PATH – aborting startup")
        sys.exit(1)

    try:
        # Get D2 version output
        version_output = subprocess.check_output([binary, "--version"], text=True).strip()
        log_info(f"D2 version output: {version_output}")
        
        # Parse version more robustly
        # Try different parsing approaches
        version_parts = version_output.split()
        ver = None
        
        # Look for version pattern in the output
        for part in version_parts:
            if part.startswith('v') and '.' in part:
                ver = part[1:]  # Remove 'v' prefix
                break
            elif '.' in part and any(c.isdigit() for c in part):
                ver = part
                break
        
        if not ver:
            # If we can't parse version, just log warning and continue
            log_info(f"Could not parse D2 version from output: {version_output}")
            log_info("Continuing without version check...")
            return
            
        log_info(f"Detected d2 {ver} at {binary}")
        
        # Compare versions
        try:
            current_version = tuple(map(int, ver.split(".")))
            required_version = tuple(map(int, min_version.split(".")))
            
            if current_version < required_version:
                log_error(f"  d2 ≥ {min_version} required (found {ver}) – aborting startup")
                sys.exit(1)
        except ValueError:
            # If version comparison fails, just log warning and continue
            log_info(f"Could not compare versions (found: {ver}, required: {min_version})")
            log_info("Continuing without version check...")
            
    except subprocess.CalledProcessError as e:
        log_error(f"Failed to get D2 version: {e}")
        log_info("Continuing without D2 version check...")
    except Exception as e:
        log_error(f"Unexpected error checking D2 version: {e}")
        log_info("Continuing without D2 version check...")
