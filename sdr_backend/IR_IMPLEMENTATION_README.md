# IR-Based Architecture Views Implementation

This document explains the Intermediate Representation (IR) architecture diagram view system implementation and how to verify it's working correctly.

## Overview

The IR system provides a semantically enriched representation of architecture diagrams that enables different visualization options (views) from a single source of truth.

Key components:
- **IR Builder**: Converts DSL diagrams to a semantic IR representation
- **IR Enrichment Pipeline**: Enhances IR with node classification, layer assignment, etc.
- **View Emitters**: Converts IR to different visualization formats (ReactFlow, D2, C4)

## Implementation Status

The IR feature is now enabled by default through the `IR_BUILDER_MIN_ACTIVE` configuration flag in `config/settings.py`.

### Available Views

When the IR system is active, the following views are available:
- **reactflow**: Default React Flow rendering (standard view)
- **d2**: D2 language diagram rendering
- **c4ctx**: C4 Context diagram rendering

## How It Works

1. When a diagram is generated or updated, the backend:
   - Parses the D2 DSL
   - Converts it to an IRGraph via IRBuilder
   - Runs the enrichment pipeline (classification, layer assignment, etc.)
   - Stores the IR in the database
   - Returns available views to the frontend

2. The frontend:
   - Displays the diagram using ReactFlow by default
   - Shows a ViewSwitcher component when multiple views are available
   - When the user switches views, it fetches the selected view from `/v2/design/view`
   - Updates the diagram display accordingly

## Verifying It Works

1. **Backend Console Logs**:
   - Look for `IR generation successful` in the logs
   - Check for `Layout completed: engine=...` with IR-specific positioning

2. **Frontend UI**:
   - The ViewSwitcher dropdown should appear in the diagram toolbar
   - It should show options like "reactflow", "d2", "c4ctx"
   - Switching between views should update the diagram visualization

3. **API Response Inspection**:
   - The `/v1/routes/generate` response should include `available_views: ["reactflow", "d2", "c4ctx"]`
   - The `/v2/design/view` endpoint should return different rendering formats

## Troubleshooting

If the IR-based views are not working:

1. **Check Environment Variables**:
   - Verify `IR_BUILDER_MIN_ACTIVE` is set to `true` in `config/settings.py`
   - Restart the backend server to apply changes

2. **Inspect API Responses**:
   - Check if `available_views` is present in the `/generate` response
   - If missing, the IR builder may have failed - check server logs

3. **Debug Backend Issues**:
   - Look for error messages related to "IR generation failed"
   - Ensure all IR-related dependencies are installed

4. **Debug Frontend Issues**:
   - Open browser console and check for errors related to view switching
   - Verify the ViewSwitcher component is receiving proper props

## Next Steps

1. **Enhanced IR Classification**: Improve node kind classification rules
2. **Additional Views**: Implement sequence diagrams and other specialized views
3. **View-Specific Layout**: Optimize layout algorithms for each view type 