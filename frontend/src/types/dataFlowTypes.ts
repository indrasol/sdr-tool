export interface DataFlowRequest {
  project_id: string;
  nodes: any[];
  edges: any[];
}

export interface DataFlowResponse {
  mermaid_code: string;
} 