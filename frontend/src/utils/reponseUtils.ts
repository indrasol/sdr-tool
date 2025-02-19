
// 1. HELPER FUNCTIONS FOR MERGING
export function mergeNodes(
    currentNodes: any[], 
    backendNodes: { add: any[]; update: any[]; remove: any[] }
  ) {
    // Create a map of existing nodes by ID
    const nodesMap = new Map(currentNodes.map(n => [n.id, n]));
    
    // Remove nodes
    backendNodes.remove.forEach((nodeToRemove) => {
      nodesMap.delete(nodeToRemove.id);
    });
  
    // Add nodes
    backendNodes.add.forEach((nodeToAdd) => {
      nodesMap.set(nodeToAdd.id, nodeToAdd);
    });
  
    // Update nodes
    backendNodes.update.forEach((nodeToUpdate) => {
      nodesMap.set(nodeToUpdate.id, nodeToUpdate);
    });
  
    // Convert map back to array
    return Array.from(nodesMap.values());
  }
  
export function mergeEdges(
currentEdges: any[], 
backendEdges: { add: any[]; remove: any[] }
) {
const edgesMap = new Map(currentEdges.map(e => [e.id, e]));

// Remove edges
backendEdges.remove.forEach((edgeToRemove) => {
    edgesMap.delete(edgeToRemove.id);
});

// Add edges
backendEdges.add.forEach((edgeToAdd) => {
    edgesMap.set(edgeToAdd.id, edgeToAdd);
});

return Array.from(edgesMap.values());
}
