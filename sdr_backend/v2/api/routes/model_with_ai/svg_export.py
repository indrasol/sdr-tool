from __future__ import annotations

"""
FastAPI route for SVG export functionality in Design-Service v2.

POST /v2/design/svg
-------------------
Converts D2 DSL to SVG format with theme support, validation, and caching.
Built on top of our robust DSL parsing and SVG rendering pipeline.
"""

import asyncio
from io import BytesIO
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, validator

from services.auth_handler import verify_token
from core.dsl.parser_d2_lang import D2LangParser
from core.dsl.validators import DiagramValidator
from core.dsl.svg_renderer import render_svg
from utils.logger import log_info

router = APIRouter()

# Initialize components
_parser = D2LangParser()
_validator = DiagramValidator()

# Supported themes for D2 SVG rendering
SUPPORTED_THEMES = {
    "0": "Neutral default",
    "1": "Neutral grey", 
    "2": "Flagship terrastruct",
    "3": "Cool classics",
    "4": "Mixed berry blue",
    "5": "Grape soda",
    "6": "Aubergine",
    "7": "Colorblind clear",
    "8": "Vanilla nitro cola",
    "100": "Terminal",
    "101": "Terminal grayscale",
    "200": "Origami",
    "300": "Shirley temple",
    "301": "Earth tones",
    "302": "Everglade green",
    "400": "Buttered toast",
    "401": "Dark mauve",
    "500": "Ink"
}

DEFAULT_THEME = "0"


class D2Source(BaseModel):
    """Request model for D2 DSL to SVG conversion."""
    
    dsl: str = Field(..., min_length=1, max_length=50000, description="D2 DSL source code")
    theme: Optional[str] = Field(DEFAULT_THEME, description="Theme ID for SVG rendering")
    
    @validator('dsl')
    def validate_dsl_content(cls, v):
        """Validate D2 DSL content for basic safety."""
        if not v.strip():
            raise ValueError("DSL content cannot be empty")
        
        # Basic safety checks
        if len(v.split('\n')) > 500:
            raise ValueError("DSL content has too many lines (max 500)")
        
        # Check for potentially harmful content
        dangerous_patterns = [
            'import', 'include', 'exec', 'system', 'eval',
            'subprocess', 'os.', 'file://', 'http://', 'https://'
        ]
        
        lower_dsl = v.lower()
        for pattern in dangerous_patterns:
            if pattern in lower_dsl:
                raise ValueError(f"DSL contains potentially unsafe content: {pattern}")
        
        return v
    
    @validator('theme')
    def validate_theme(cls, v):
        """Validate theme ID."""
        if v and v not in SUPPORTED_THEMES:
            raise ValueError(f"Unsupported theme '{v}'. Supported themes: {list(SUPPORTED_THEMES.keys())}")
        return v or DEFAULT_THEME


@router.post("/svg")
async def export_svg(
    request: D2Source,
    current_user: dict = Depends(verify_token),
    download: bool = Query(False, description="Set to true to download as file attachment")
):
    """
    Convert D2 DSL to SVG format with robust validation and error handling.
    
    Features:
    - Validates D2 DSL syntax before rendering
    - Supports multiple themes 
    - Caches SVG output for performance
    - Handles timeout and compilation errors gracefully
    - Optional file download
    """
    user_id = current_user["id"]
    
    try:
        # Step 1: Parse and validate D2 DSL
        log_info(f"Starting SVG export for user {user_id}, DSL length: {len(request.dsl)}")
        
        # Parse DSL to validate syntax and structure
        try:
            diagram = _parser.parse(request.dsl)
        except ValueError as e:
            log_info(f"DSL parsing failed: {e}")
            raise HTTPException(
                status_code=422,
                detail={
                    "error_code": "DSL_PARSING_FAILED",
                    "message": f"D2 DSL parsing failed: {str(e)}",
                    "supported_themes": list(SUPPORTED_THEMES.keys())
                }
            )
        
        # Step 2: Validate diagram content
        is_valid, validation_errors = _validator.validate(diagram)
        if not is_valid:
            log_info(f"Diagram validation failed: {validation_errors}")
            raise HTTPException(
                status_code=422,
                detail={
                    "error_code": "DIAGRAM_VALIDATION_FAILED", 
                    "message": "Diagram content failed validation",
                    "errors": validation_errors
                }
            )
        
        # Step 3: Render SVG with caching
        try:
            svg_bytes = render_svg(request.dsl, theme=request.theme)
            
            if not svg_bytes:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "error_code": "SVG_RENDER_FAILED",
                        "message": "SVG rendering returned empty content"
                    }
                )
            
            log_info(f"SVG export successful: {len(svg_bytes)} bytes, theme: {request.theme}")
            
        except Exception as e:
            log_info(f"SVG rendering failed: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error_code": "SVG_RENDER_ERROR",
                    "message": f"SVG rendering failed: {str(e)}",
                    "theme": request.theme
                }
            )
        
        # Step 4: Return SVG response
        headers = {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=3600",  # 1 hour cache
            "X-Content-Type-Options": "nosniff"
        }
        
        if download:
            filename = f"diagram_theme_{request.theme}.svg"
            headers["Content-Disposition"] = f'attachment; filename="{filename}"'
        
        return StreamingResponse(
            BytesIO(svg_bytes),
            media_type="image/svg+xml",
            headers=headers
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Handle any unexpected errors
        log_info(f"Unexpected error in SVG export: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred during SVG export"
            }
        )


@router.get("/svg/themes")
async def get_supported_themes(
    current_user: dict = Depends(verify_token)
):
    """
    Get list of supported themes for SVG rendering.
    
    Returns:
        Dictionary mapping theme IDs to theme names
    """
    return {
        "themes": SUPPORTED_THEMES,
        "default_theme": DEFAULT_THEME,
        "total_themes": len(SUPPORTED_THEMES)
    }


@router.post("/svg/preview")
async def preview_svg_info(
    request: D2Source,
    current_user: dict = Depends(verify_token)
):
    """
    Preview SVG export information without generating the full SVG.
    
    Useful for validating DSL and getting export metadata before actual export.
    """
    try:
        # Parse and validate DSL
        diagram = _parser.parse(request.dsl)
        is_valid, validation_errors = _validator.validate(diagram)
        
        if not is_valid:
            return {
                "valid": False,
                "errors": validation_errors,
                "theme": request.theme
            }
        
        # Calculate estimated SVG size and complexity
        node_count = len(diagram.nodes)
        edge_count = len(diagram.edges)
        
        # Estimate SVG size (rough calculation)
        estimated_size_kb = (node_count * 2) + (edge_count * 1) + 5  # Base overhead
        
        complexity_level = "simple"
        if node_count > 10 or edge_count > 15:
            complexity_level = "moderate"
        if node_count > 20 or edge_count > 30:
            complexity_level = "complex"
        
        return {
            "valid": True,
            "errors": [],
            "theme": request.theme,
            "theme_name": SUPPORTED_THEMES.get(request.theme, "Unknown"),
            "node_count": node_count,
            "edge_count": edge_count,
            "estimated_size_kb": estimated_size_kb,
            "complexity_level": complexity_level,
            "export_ready": True
        }
        
    except ValueError as e:
        return {
            "valid": False,
            "errors": [str(e)],
            "theme": request.theme,
            "export_ready": False
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": "PREVIEW_ERROR",
                "message": f"Preview generation failed: {str(e)}"
            }
        ) 