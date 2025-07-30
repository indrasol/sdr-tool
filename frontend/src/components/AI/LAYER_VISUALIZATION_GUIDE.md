# Layer Visualization Guide

## Overview

This document explains our new approach to layer-based visualization of architecture diagrams. The approach uses a single source of truth (tech_taxonomy table) for node classification and creates beautiful tinted layer containers with proper node grouping.

## Architecture

The architecture consists of three main parts:
1. **Backend IR Enrichment** - Uses tech_taxonomy as single source of truth to classify nodes
2. **Frontend Layer Visualization** - Trusts backend layerIndex values and renders beautiful tinted layers
3. **Integration** - Provides hooks and components to connect the two systems

## Backend Pipeline

The backend pipeline consists of these steps:

1. **Node Classification (taxonomy_mapper.py)**
   - Maps nodes to taxonomy entries based on their name/label
   - Assigns kind, layer, and layerIndex
   - Falls back to reasonable defaults when no match is found

2. **Group Creation (simplified_grouping.py)**
   - Creates groups of nodes based on their kind
   - Preserves domain-based grouping for bounded contexts

## Frontend Rendering

The frontend rendering consists of these steps:

1. **Layer Index Trust (simplifiedIrToReactflow.ts)**
   - Trusts the layerIndex values provided by backend
   - Only provides fallbacks for nodes that are missing layerIndex
   - No complex classification rules

2. **Layer Theme Application (layerThemes.ts)**
   - Provides beautiful tinted colors for each layer type
   - Maps layer indices to visual styling
   - Consistent color scheme across the application

3. **Node Arrangement**
   - Positions nodes in a neat vertical stack within each layer
   - Left-to-right flow based on layer index
   - Proper padding and spacing between layers

## Integration Points

### 1. Layer Index Mapping

The backend assigns layerIndex values using this mapping:

```typescript
// Backend: taxonomy_mapper.py
KIND_TO_LAYER_INDEX = {
  "CLIENT": 0,
  "EDGE_NETWORK": 1,
  "IDENTITY": 2,
  "SERVICE": 3,
  "INTEGRATION_MESSAGING": 4,
  "PROCESSING_ANALYTICS": 5,
  "COMPUTE": 5,  // Map to same layer as PROCESSING_ANALYTICS
  "DATA": 6,
  "OBSERVABILITY": 7,
  "AI_ML": 5,    // Map to same layer as PROCESSING_ANALYTICS
  "DEV_CI_CD": 3,  // Map to same layer as SERVICE
  "OTHER": 3,     // Default to service layer
}
```

The frontend uses the same index values for styling:

```typescript
// Frontend: layerThemes.ts
export const layerThemes: Record<number, LayerTheme> = {
  0: { // CLIENT
    label: 'Client Layer',
    color: 'rgba(240, 240, 245, 0.75)',
    // ...
  },
  1: { // EDGE_NETWORK
    label: 'Network / Edge Layer',
    color: 'rgba(255, 230, 230, 0.75)',
    // ...
  },
  // ...
}
```

### 2. Node Data Structure

Backend sends nodes with layerIndex in metadata:

```json
{
  "id": "auth-service",
  "name": "Authentication Service",
  "kind": "IDENTITY",
  "layer": "IDENTITY",
  "metadata": {
    "layerIndex": 2,
    "iconifyId": "mdi:shield-lock"
  }
}
```

Frontend expects nodes with layerIndex in data:

```typescript
{
  id: "auth-service",
  data: {
    label: "Authentication Service",
    layerIndex: 2,
    iconifyId: "mdi:shield-lock"
  }
}
```

### 3. Group Structure

Backend creates groups by kind:

```json
{
  "id": "kind_identity",
  "name": "Identity Group",
  "type": "layer_cluster",
  "member_node_ids": ["auth-service", "user-service"]
}
```

Frontend uses these groups to enhance node information:

```typescript
const enhancedNodes = enhanceNodesWithGroupInfo(nodes, groups);
```

## How to Use

### Backend Integration

Make sure the tech_taxonomy table has correct KIND values and iconify_id values for all entries.

### Frontend Integration

1. Use the LayeredDiagram component:

```tsx
<LayeredDiagram
  nodes={diagramNodes}
  edges={diagramEdges}
  groups={diagramGroups}
  onNodeClick={handleNodeClick}
/>
```

2. Or use the useLayerVisualizer hook directly:

```tsx
const { processedNodes, processedEdges } = useLayerVisualizer({
  nodes,
  edges,
  groups
});
```

## Customization

### Layer Colors

To customize the layer colors, edit the layerThemes.ts file:

```typescript
// frontend/src/components/AI/styles/layerThemes.ts
export const layerThemes: Record<number, LayerTheme> = {
  // ...customize colors here
}
```

### Layout Options

To customize the layout options, edit the simplifiedIrToReactflow.ts file:

```typescript
// frontend/src/components/AI/utils/simplifiedIrToReactflow.ts
const layoutOptions = {
  direction,
  nodeWidth: 180,     // Customize node width
  nodeHeight: 50,     // Customize node height
  spacingBetweenLayers: 300,  // Customize layer spacing
  spacingWithinLayer: 70,     // Customize node spacing
};
```

## Troubleshooting

### Missing Layer Index

If nodes are not showing up in the correct layer, check:

1. The node's kind in the backend
2. The node's layerIndex in the frontend
3. The mapping in KIND_TO_LAYER_INDEX

### Layer Styling Issues

If layer styling is not applied correctly:

1. Check that the layerIndex matches between backend and frontend
2. Verify the layerThemes.ts file has entries for all layer indices

### Node Positioning Issues

If nodes are not positioned correctly within layers:

1. Check the postProcessNodePositions function in simplifiedIrToReactflow.ts
2. Adjust the vertical and horizontal spacing parameters

## Conclusion

This new approach provides a robust, maintainable solution for layer-based visualization. By trusting the backend classification and using consistent theme mapping, we ensure that nodes are correctly placed in beautiful tinted layer containers with proper grouping and spacing. 