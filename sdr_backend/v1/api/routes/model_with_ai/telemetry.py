"""Telemetry Endpoints

Collection and analysis of application telemetry for improving user experience
and monitoring system health.
"""

from __future__ import annotations

from typing import Dict, Any, List, Optional
import json
from datetime import datetime
import os
from pathlib import Path
from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response
from services.auth_handler import verify_token
from utils.logger import log_info

router = APIRouter()

# Create a directory for telemetry data if it doesn't exist
TELEMETRY_DIR = Path(__file__).parents[4] / "data" / "telemetry"
TELEMETRY_DIR.mkdir(exist_ok=True, parents=True)

MISSING_ICONS_FILE = TELEMETRY_DIR / "missing_icons.json"

# Initialize missing icons tracking file if it doesn't exist
if not MISSING_ICONS_FILE.exists():
    with open(MISSING_ICONS_FILE, 'w') as f:
        json.dump({
            "last_updated": datetime.now().isoformat(),
            "missing_icons": {}
        }, f, indent=2)


@router.post("/missing-icon")
async def track_missing_icon(
    request: Request,
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(verify_token),
):
    """Record missing icon telemetry.
    
    This endpoint collects information about missing icons to help prioritize
    icon additions to the custom collection.
    """
    try:
        icon_id = payload.get("iconId")
        provider = payload.get("provider")
        timestamp = payload.get("timestamp", datetime.now().isoformat())
        user_agent = payload.get("userAgent", "")
        
        if not icon_id:
            raise HTTPException(status_code=400, detail="iconId is required")
            
        log_info(f"Received missing icon report: {icon_id} (provider: {provider})")
        
        # Read current tracking data
        if MISSING_ICONS_FILE.exists():
            with open(MISSING_ICONS_FILE, 'r') as f:
                tracking_data = json.load(f)
        else:
            tracking_data = {
                "last_updated": datetime.now().isoformat(),
                "missing_icons": {}
            }
            
        # Update tracking data
        if icon_id not in tracking_data["missing_icons"]:
            tracking_data["missing_icons"][icon_id] = {
                "count": 1,
                "provider": provider,
                "first_reported": timestamp,
                "last_reported": timestamp,
                "reported_by": [current_user["id"]]
            }
        else:
            icon_data = tracking_data["missing_icons"][icon_id]
            icon_data["count"] += 1
            icon_data["last_reported"] = timestamp
            if current_user["id"] not in icon_data["reported_by"]:
                icon_data["reported_by"].append(current_user["id"])
                
        # Update last_updated timestamp
        tracking_data["last_updated"] = datetime.now().isoformat()
        
        # Write updated data back
        with open(MISSING_ICONS_FILE, 'w') as f:
            json.dump(tracking_data, f, indent=2)
            
        return {"success": True}
        
    except Exception as e:
        log_info(f"Error tracking missing icon: {str(e)}")
        # Don't fail the request for telemetry issues
        return {"success": False}


@router.get("/missing-icons")
async def get_missing_icons_report(
    current_user: dict = Depends(verify_token),
):
    """Get a report of missing icons.
    
    Requires authentication. Returns a sorted list of missing icons by frequency.
    """
    try:
        if not MISSING_ICONS_FILE.exists():
            return {
                "last_updated": datetime.now().isoformat(),
                "missing_icons": []
            }
            
        with open(MISSING_ICONS_FILE, 'r') as f:
            tracking_data = json.load(f)
            
        # Convert to list and sort by count (descending)
        missing_icons = []
        for icon_id, data in tracking_data["missing_icons"].items():
            missing_icons.append({
                "icon_id": icon_id,
                **data
            })
            
        missing_icons.sort(key=lambda x: x["count"], reverse=True)
        
        return {
            "last_updated": tracking_data["last_updated"],
            "missing_icons": missing_icons
        }
    except Exception as e:
        log_info(f"Error retrieving missing icons report: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving missing icons report") 