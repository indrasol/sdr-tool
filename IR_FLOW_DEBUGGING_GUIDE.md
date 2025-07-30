# IR Flow Debugging Guide

This guide explains the fixes made to the IR (Intermediate Representation) flow and how to verify it's working correctly.

## Overview of the IR Flow

The IR flow provides semantically enriched diagrams with multiple view options:
- **ReactFlow**: Default interactive diagram view
- **D2**: Text-based diagram format
- **C4**: Architecture context diagram format

## Fixes Applied

1. **d2json Binary Setup**:
   - Fixed the path resolution for the d2json binary
   - Built the binary from source code
   - Created a symbolic link in ~/bin for easier access
   - Added better error handling when d2json is missing

2. **Settings Integration**:
   - Added IR_BUILDER_MIN_ACTIVE flag to settings.py
   - Set it to True by default
   - Updated code to use the centralized setting

3. **Error Handling**:
   - Added graceful fallback when d2json is missing
   - Better logging throughout the IR flow
   - Added diagnostic utilities

4. **UI Debugging**:
   - Added debug indicators to show when views are available
   - Enhanced logging in the ViewSwitcher component

## How to Verify It's Working

1. **Run the Diagnostic Script**:
   ```bash
   python sdr_backend/diagnose_ir_flow.py
   ```
   This will check:
   - IR_BUILDER_MIN_ACTIVE setting
   - d2json binary availability and functionality
   - Required IR modules
   - Available views

2. **Check the UI**:
   - Generate a new diagram
   - Look for the debug indicator showing available views
   - The ViewSwitcher dropdown should appear in the toolbar
   - Console logs should show ViewSwitcher rendering details

3. **Check Server Logs**:
   - Look for "IR flow active" messages
   - Look for "Available views in response" with views list
   - Watch for any errors related to d2json or IR flow

## Known Issues

1. **d2json Missing**: If the d2json binary is missing, the server will now:
   - Log an error message
   - Continue with just ReactFlow view
   - Still use IR data model internally

2. **ViewSwitcher Not Showing**: If the ViewSwitcher doesn't appear, check:
   - Browser console logs for errors
   - Server logs for "IR flow active" messages
   - That availableBackendViews is being passed to DiagramActions component

## Layout Improvements

The IR flow improves diagram layouts by:
1. Using more semantic classification of node types
2. Applying consistent styling based on node purpose
3. Creating proper layer groups
4. Maintaining clear visual hierarchy

## Testing Process

When testing changes to the IR flow:

1. Run the diagnostic script first
2. Restart the backend server
3. Generate a new diagram
4. Check for the ViewSwitcher and try switching views

## Additional Resources

- `sdr_backend/IR_IMPLEMENTATION_README.md`: Details about the IR implementation
- `sdr_backend/diagnose_ir_flow.py`: Diagnostic script
- Frontend logs: Check for "ViewSwitcher" and "Backend supports multiple views" messages 