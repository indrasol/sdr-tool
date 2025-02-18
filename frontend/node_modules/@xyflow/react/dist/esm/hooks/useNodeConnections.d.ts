import { Connection, NodeConnection, HandleType } from '@xyflow/system';
type UseNodeConnectionsParams = {
    id?: string;
    handleType?: HandleType;
    handleId?: string;
    onConnect?: (connections: Connection[]) => void;
    onDisconnect?: (connections: Connection[]) => void;
};
/**
 * Hook to retrieve all edges connected to a node. Can be filtered by handle type and id.
 *
 * @public
 * @param param.id - node id - optional if called inside a custom node
 * @param param.handleType - filter by handle type 'source' or 'target'
 * @param param.handleId - filter by handle id (this is only needed if the node has multiple handles of the same type)
 * @param param.onConnect - gets called when a connection is established
 * @param param.onDisconnect - gets called when a connection is removed
 * @returns an array with connections
 */
export declare function useNodeConnections({ id, handleType, handleId, onConnect, onDisconnect, }?: UseNodeConnectionsParams): NodeConnection[];
export {};
//# sourceMappingURL=useNodeConnections.d.ts.map